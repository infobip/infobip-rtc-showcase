package com.infobip.rtc.showcase

import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.ArrayAdapter
import android.widget.AutoCompleteTextView
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.infobip.rtc.showcase.adapters.MessageRecyclerViewAdapter
import com.infobip.rtc.showcase.data.Message
import com.infobip.rtc.showcase.data.MessageStatus
import com.infobip.rtc.showcase.data.MessageType
import com.infobip.rtc.showcase.service.TokenService
import com.infobip.webrtc.sdk.api.InfobipRTC
import com.infobip.webrtc.sdk.api.call.RoomCall
import com.infobip.webrtc.sdk.api.event.call.CameraVideoAddedEvent
import com.infobip.webrtc.sdk.api.event.call.CameraVideoUpdatedEvent
import com.infobip.webrtc.sdk.api.event.call.ErrorEvent
import com.infobip.webrtc.sdk.api.event.call.ParticipantCameraVideoAddedEvent
import com.infobip.webrtc.sdk.api.event.call.ParticipantCameraVideoRemovedEvent
import com.infobip.webrtc.sdk.api.event.call.ParticipantDeafEvent
import com.infobip.webrtc.sdk.api.event.call.ParticipantJoinedEvent
import com.infobip.webrtc.sdk.api.event.call.ParticipantJoiningEvent
import com.infobip.webrtc.sdk.api.event.call.ParticipantLeftEvent
import com.infobip.webrtc.sdk.api.event.call.ParticipantMutedEvent
import com.infobip.webrtc.sdk.api.event.call.ParticipantScreenShareAddedEvent
import com.infobip.webrtc.sdk.api.event.call.ParticipantScreenShareRemovedEvent
import com.infobip.webrtc.sdk.api.event.call.ParticipantStartedTalkingEvent
import com.infobip.webrtc.sdk.api.event.call.ParticipantStoppedTalkingEvent
import com.infobip.webrtc.sdk.api.event.call.ParticipantUndeafEvent
import com.infobip.webrtc.sdk.api.event.call.ParticipantUnmutedEvent
import com.infobip.webrtc.sdk.api.event.call.RoomJoinedEvent
import com.infobip.webrtc.sdk.api.event.call.RoomLeftEvent
import com.infobip.webrtc.sdk.api.event.call.ScreenShareAddedEvent
import com.infobip.webrtc.sdk.api.event.call.ScreenShareRemovedEvent
import com.infobip.webrtc.sdk.api.event.datachannel.BroadcastTextReceivedEvent
import com.infobip.webrtc.sdk.api.event.datachannel.TextDeliveredEvent
import com.infobip.webrtc.sdk.api.event.datachannel.TextReceivedEvent
import com.infobip.webrtc.sdk.api.event.listener.DataChannelEventListener
import com.infobip.webrtc.sdk.api.event.listener.RoomCallEventListener
import com.infobip.webrtc.sdk.api.event.listener.SendTextListener
import com.infobip.webrtc.sdk.api.model.ErrorCode
import com.infobip.webrtc.sdk.api.model.endpoint.Endpoint
import com.infobip.webrtc.sdk.api.options.RoomCallOptions
import com.infobip.webrtc.sdk.api.request.RoomRequest
import com.infobip.webrtc.sdk.impl.event.listener.DefaultRoomCallEventListener
import java.util.Date
import java.util.concurrent.Executors

private const val TAG = "DATA_CHANNEL_SHOWCASE"

class MainActivity : Activity() {
    companion object {
        private val backgroundThreadExecutor = Executors.newSingleThreadExecutor()
    }

    private val messages: MutableList<Message> = arrayListOf()
    private lateinit var recyclerViewAdapter: MessageRecyclerViewAdapter
    private lateinit var connectedUser: String

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.main_activity)

        connect()
        ensurePermissions()

        setRecyclerViewAdapter()
        setButtonClickListeners()
        showJoinRoomLayout()
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)

        if (grantResults[0] == PackageManager.PERMISSION_GRANTED) Log.d(TAG, "RECORD_AUDIO granted")
        else Log.d(TAG, "RECORD_AUDIO denied")
    }

    private fun ensurePermissions() {
        if (!permissionGranted(Manifest.permission.RECORD_AUDIO)) {
            ActivityCompat.requestPermissions(
                this, arrayOf(Manifest.permission.RECORD_AUDIO), 200
            )
        }
    }

    private fun permissionGranted(permission: String): Boolean {
        return ContextCompat.checkSelfPermission(
            this,
            permission
        ) == PackageManager.PERMISSION_GRANTED
    }

    private fun setRecyclerViewAdapter() {
        recyclerViewAdapter = MessageRecyclerViewAdapter(messages)
        val recyclerView: RecyclerView = findViewById(R.id.message_recycler_view)

        val linearLayoutManager = LinearLayoutManager(this)
        linearLayoutManager.orientation = LinearLayoutManager.VERTICAL

        recyclerView.layoutManager = linearLayoutManager
        recyclerView.adapter = recyclerViewAdapter
    }

    private fun setButtonClickListeners() {
        findViewById<Button>(R.id.leave_button).setOnClickListener {
            leaveButtonClick()
        }

        findViewById<Button>(R.id.join_button).setOnClickListener {
            val roomName = findViewById<EditText>(R.id.room_name_input).text.toString()
            joinChatRoom(roomName)
        }

        findViewById<Button>(R.id.send_text_button).setOnClickListener {
            val text = findViewById<EditText>(R.id.message_input).text.toString()
            val to = findViewById<EditText>(R.id.recipient_input).text.toString()
            val toEndpoint = getEndpointByIdentity(to)

            if (text.trim().isNotEmpty()) {
                val dataChannel = InfobipRTC.getInstance().activeRoomCall?.dataChannel()

                if (toEndpoint != null) {
                    dataChannel?.send(text, toEndpoint, getSendTextEventListener(text, to))
                } else {
                    dataChannel?.send(text, getSendTextEventListener(text, null))
                }

                findViewById<EditText>(R.id.message_input).setText("")
            } else {
                Toast.makeText(this, "Empty text", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun connect() {
        backgroundThreadExecutor.submit {
            try {
                val accessToken = TokenService.getAccessToken()
                setLoginStatus(getString(R.string.logged_in_as, accessToken.identity))
                connectedUser = accessToken.identity
            } catch (t: Throwable) {
                Log.e(TAG, "Error connecting", t)
                runOnUiThread {
                    setLoginStatus(
                        getString(R.string.connection_error, t.javaClass.simpleName, t.message)
                    )
                }
            }
        }
    }

    private fun joinChatRoom(roomName: String) {
        backgroundThreadExecutor.submit {
            try {
                joinRoom(roomName)

                runOnUiThread {
                    showChatRoomLayout()
                }
            } catch (t: Throwable) {
                Log.e(TAG, "Error joining", t)
                runOnUiThread {
                    Toast.makeText(
                        applicationContext,
                        "Error joining: ${t.message}", Toast.LENGTH_LONG
                    ).show()
                }
            }
        }
    }

    private fun joinRoom(roomName: String) {
        val roomRequest = RoomRequest(
            TokenService.getAccessToken().token,
            applicationContext,
            getRoomCallEventListener(),
            roomName
        )

        val roomCallOptions = RoomCallOptions.builder()
            .video(false)
            .audio(false)
            .dataChannel(true)
            .build()

        val roomCall = InfobipRTC.getInstance().joinRoom(roomRequest, roomCallOptions)

        setUpDataChannelEventListeners(roomCall);

        Log.d(TAG, "Joining room with name $roomName")
    }

    private fun setUpDataChannelEventListeners(roomCall: RoomCall) {
        roomCall.dataChannel().eventListener = object : DataChannelEventListener {
            override fun onTextDelivered(textDeliveredEvent: TextDeliveredEvent?) {
                runOnUiThread {
                    Log.d(TAG, "Received text delivered event for id: ${textDeliveredEvent?.id}")
                    modifyStatusByMessageId(textDeliveredEvent!!.id, MessageStatus.DELIVERED)
                }
            }

            override fun onTextReceived(textReceivedEvent: TextReceivedEvent?) {
                Log.d(TAG, "Received text received with text: ${textReceivedEvent?.text}")
                appendMessage(
                    Message(
                        MessageType.RECEIVED,
                        textReceivedEvent!!.date,
                        textReceivedEvent.text,
                        MessageStatus.DELIVERED,
                        null,
                        null,
                        textReceivedEvent.from.identifier(),
                        textReceivedEvent.isDirect
                    )
                )
            }

            override fun onBroadcastTextReceived(broadcastTextReceivedEvent: BroadcastTextReceivedEvent?) {
                Log.d(
                    TAG,
                    "Received broadcast text received event with text: ${broadcastTextReceivedEvent?.text}"
                )

                appendMessage(
                    Message(
                        MessageType.BROADCAST,
                        broadcastTextReceivedEvent!!.date,
                        broadcastTextReceivedEvent.text,
                        MessageStatus.DELIVERED,
                        null,
                        null,
                        null,
                        false
                    )
                )
            }
        }
    }

    private fun showChatRoomLayout() {
        findViewById<ConstraintLayout>(R.id.chat_room_layout).visibility = View.VISIBLE
        findViewById<LinearLayout>(R.id.join_room_layout).visibility = View.GONE
    }

    private fun showJoinRoomLayout() {
        findViewById<ConstraintLayout>(R.id.chat_room_layout).visibility = View.GONE
        findViewById<LinearLayout>(R.id.join_room_layout).visibility = View.VISIBLE
    }

    private fun leaveButtonClick() {
        val roomCall = InfobipRTC.getInstance().activeRoomCall
        if (roomCall != null) {
            roomCall.leave()
        } else {
            runOnUiThread {
                Toast.makeText(applicationContext, "No active room call", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun setLoginStatus(text: String) {
        val loginStatus = findViewById<TextView>(R.id.login_status)
        loginStatus.visibility = View.VISIBLE
        loginStatus.text = text
    }

    private fun updateLayoutAfterLeavingRoom(message: String) {
        Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
        showJoinRoomLayout()
        messages.clear()
        findViewById<EditText>(R.id.message_input).setText("")
        findViewById<EditText>(R.id.recipient_input).setText("")
    }

    private fun modifyStatusByMessageId(id: String, status: MessageStatus) {
        val index = messages.indexOfFirst { it.messageId == id }
        messages[index].status = status
        recyclerViewAdapter.notifyItemChanged(index)
    }

    private fun setAutoCompleteAdapter() {
        runOnUiThread {
            val identifiers = InfobipRTC.getInstance().activeRoomCall?.participants()
                ?.map { it.endpoint.identifier() }
                ?.filter { it != connectedUser }

            Log.d(
                TAG,
                "Setting auto complete adapter, identifiers are: ${identifiers?.joinToString()}"
            )

            val autoCompleteAdapter =
                ArrayAdapter(this, android.R.layout.simple_list_item_1, identifiers ?: emptyList())
            val autoComplete = findViewById<AutoCompleteTextView>(R.id.recipient_input)

            autoComplete.setAdapter(autoCompleteAdapter)
        }
    }

    private fun getSendTextEventListener(text: String, to: String?): SendTextListener {
        return object : SendTextListener {
            override fun onSendSuccess(id: String?) {
                Log.d(TAG, "Message sent successfully")
                appendMessage(
                    Message(
                        MessageType.SENT,
                        Date(),
                        text,
                        MessageStatus.SENT,
                        id!!,
                        to,
                        null,
                        to != null
                    )
                )
            }

            override fun onSendFailure(errorCode: ErrorCode?) {
                Log.e(TAG, "Failed to send message: ${errorCode?.name}")
            }
        }
    }

    private fun appendMessage(message: Message) {
        runOnUiThread {
            messages.add(message)
            recyclerViewAdapter.notifyItemInserted(messages.size - 1)
        }
    }

    private fun getEndpointByIdentity(identity: String): Endpoint? {
        return InfobipRTC.getInstance().activeRoomCall?.participants()
            ?.find { it.endpoint.identifier() == identity }?.endpoint
    }

    private fun getRoomCallEventListener(): RoomCallEventListener {
        return object : DefaultRoomCallEventListener() {
            override fun onError(errorEvent: ErrorEvent?) {
                val message = "Error: ${errorEvent?.errorCode}"
                Log.e(TAG, message)

                runOnUiThread {
                    Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
                }
            }

            override fun onRoomJoined(roomJoinedEvent: RoomJoinedEvent?) {
                val message = "Joined room ${roomJoinedEvent?.name}"
                Log.d(TAG, message)

                setAutoCompleteAdapter()

                runOnUiThread {
                    Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
                }
            }

            override fun onRoomLeft(roomLeftEvent: RoomLeftEvent?) {
                val message = "Left room: ${roomLeftEvent?.errorCode?.name}"
                Log.d(TAG, message)

                runOnUiThread {
                    Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
                    updateLayoutAfterLeavingRoom(message)
                }
            }

            override fun onParticipantJoining(participantJoiningEvent: ParticipantJoiningEvent?) {
                val message =
                    "Participant ${participantJoiningEvent?.participant?.endpoint?.identifier()} joining room"
                Log.d(TAG, message)
            }

            override fun onParticipantJoined(participantJoinedEvent: ParticipantJoinedEvent?) {
                val identifier = participantJoinedEvent?.participant?.endpoint?.identifier()!!
                val message = "Participant $identifier joined room"
                Log.d(TAG, message)

                setAutoCompleteAdapter()

                runOnUiThread {
                    Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
                }
            }

            override fun onParticipantLeft(participantLeftEvent: ParticipantLeftEvent?) {
                val identifier = participantLeftEvent?.participant?.endpoint?.identifier()!!
                val message = "Participant $identifier left room"
                Log.d(TAG, message)

                setAutoCompleteAdapter()

                runOnUiThread {
                    Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
                }
            }
        }
    }
}