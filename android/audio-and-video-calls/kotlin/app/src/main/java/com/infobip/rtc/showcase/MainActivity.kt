package com.infobip.rtc.showcase

import android.Manifest.permission
import android.content.Intent
import android.content.pm.PackageManager
import android.media.projection.MediaProjectionManager
import android.os.Bundle
import android.util.Log
import android.view.Gravity
import android.view.View
import android.widget.*
import android.widget.LinearLayout.LayoutParams
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.view.updateLayoutParams
import com.google.android.material.tabs.TabLayout
import com.google.android.material.tabs.TabLayout.OnTabSelectedListener
import com.infobip.rtc.showcase.service.AccessToken
import com.infobip.rtc.showcase.service.ServiceHelper
import com.infobip.rtc.showcase.service.TokenService
import com.infobip.webrtc.sdk.api.InfobipRTC
import com.infobip.webrtc.sdk.api.call.*
import com.infobip.webrtc.sdk.api.event.call.*
import com.infobip.webrtc.sdk.api.event.listener.PhoneCallEventListener
import com.infobip.webrtc.sdk.api.event.listener.RoomCallEventListener
import com.infobip.webrtc.sdk.api.event.listener.WebrtcCallEventListener
import com.infobip.webrtc.sdk.api.model.CallStatus
import com.infobip.webrtc.sdk.api.model.participant.Participant
import com.infobip.webrtc.sdk.api.model.video.RTCVideoTrack
import com.infobip.webrtc.sdk.api.model.video.ScreenCapturer
import com.infobip.webrtc.sdk.api.model.video.VideoRenderer
import com.infobip.webrtc.sdk.api.options.PhoneCallOptions
import com.infobip.webrtc.sdk.api.options.RoomCallOptions
import com.infobip.webrtc.sdk.api.options.VideoOptions.CameraOrientation
import com.infobip.webrtc.sdk.api.options.WebrtcCallOptions
import com.infobip.webrtc.sdk.api.request.CallPhoneRequest
import com.infobip.webrtc.sdk.api.request.CallWebrtcRequest
import com.infobip.webrtc.sdk.api.request.RoomRequest

import org.webrtc.RendererCommon

import java.util.concurrent.Executors
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.TimeUnit

enum class Tab(val position: Int) {
    WEBRTC(0), PHONE(1), ROOM(2);
}

class MainActivity : AppCompatActivity(), PhoneCallEventListener, WebrtcCallEventListener, RoomCallEventListener {
    companion object {
        const val CAPTURE_PERMISSION_REQUEST_CODE = 1

        const val OUTGOING_CALL_START = "outgoing_call_start"
        const val INCOMING_CALL_START = "incoming_call_start"
        const val CALL_IN_PROGRESS = "call_in_progress"
        const val CALL_FINISHED = "call_finished"

        private const val TAG = "INFOBIP_RTC"
        private const val FROM = "33712345678"

        private val EXECUTOR: ScheduledExecutorService = Executors.newScheduledThreadPool(2)

        private var localCameraTrack: RTCVideoTrack? = null
        private var localScreenShareTrack: RTCVideoTrack? = null
        private var remoteCameraVideoTrack: RTCVideoTrack? = null
        private var remoteScreenShareTrack: RTCVideoTrack? = null

        private lateinit var remoteBigVideoRenderer: VideoRenderer
        private lateinit var remoteSmallVideoRenderer: VideoRenderer
        private lateinit var localCameraVideoRenderer: VideoRenderer
        private lateinit var localScreenShareRenderer: VideoRenderer

        private lateinit var participantVideosLayout: LinearLayout
        private lateinit var tabLayout: TabLayout

        private lateinit var participantsLayout: LinearLayout
        private lateinit var scrollParticipants: ScrollView
        private lateinit var roomParticipants: LinearLayout

        private var audioEnabled: Boolean = true
        private var activeTab = Tab.WEBRTC

        private val infobipRTC: InfobipRTC = InfobipRTC.getInstance()
    }

    private lateinit var accessToken: AccessToken

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        tabLayout = findViewById(R.id.tabs)
        tabLayout.selectTab(tabLayout.getTabAt(Tab.WEBRTC.position))

        setWebrtcTabLayout()
        ensurePermissions()
        findVideoRenderers()
        findParticipantsLayout()
        setButtonClickListeners()
        connect()
    }

    override fun onDestroy() {
        super.onDestroy()
        releaseVideoRenderers()
    }

    override fun onResume() {
        super.onResume()
        val action = intent.action
        if (INCOMING_CALL_START == action && infobipRTC.activeCall != null) {
            showIncomingCall()
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<String>,
        grantResults: IntArray
    ) {
        if (grantResults[0] == PackageManager.PERMISSION_GRANTED) Log.d(TAG, "RECORD_AUDIO granted")
        else Log.d(TAG, "RECORD_AUDIO denied")

        if (grantResults[1] == PackageManager.PERMISSION_GRANTED) Log.d(TAG, "CAMERA granted")
        else Log.d(TAG, "CAMERA denied")
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode != CAPTURE_PERMISSION_REQUEST_CODE) {
            return
        }
        if (resultCode == RESULT_OK) {
            val screenCapturer = ScreenCapturer(resultCode, data)
            if (activeTab == Tab.ROOM) {
                infobipRTC.activeRoomCall.startScreenShare(screenCapturer)
            } else {
                (infobipRTC.activeCall as WebrtcCall).startScreenShare(screenCapturer)
            }

            val toggleScreenShare = findViewById<Button>(R.id.toggle_screen_share_button)
            toggleScreenShare.setText(R.string.screen_share_off)
        }
    }

    override fun onRinging(callRingingEvent: CallRingingEvent?) {
        handleRinging(callRingingEvent!!)
    }

    override fun onEarlyMedia(callEarlyMediaEvent: CallEarlyMediaEvent?) {
        Log.d(TAG, "Early media: $callEarlyMediaEvent")
    }

    override fun onEstablished(callEstablishedEvent: CallEstablishedEvent?) {
        handleEstablished(callEstablishedEvent!!)
    }

    override fun onCameraVideoAdded(cameraVideoAddedEvent: CameraVideoAddedEvent?) {
        handleCameraVideoAdded(cameraVideoAddedEvent!!)
    }

    override fun onCameraVideoUpdated(cameraVideoUpdatedEvent: CameraVideoUpdatedEvent?) {
        handleCameraVideoUpdated(cameraVideoUpdatedEvent!!)
    }

    override fun onCameraVideoRemoved() {
        handleCameraVideoRemoved()
    }

    override fun onScreenShareAdded(screenShareAddedEvent: ScreenShareAddedEvent?) {
        handleScreenShareAdded(screenShareAddedEvent!!)
    }

    override fun onScreenShareRemoved(screenShareRemovedEvent: ScreenShareRemovedEvent) {
        handleScreenShareRemoved()
    }

    override fun onRemoteCameraVideoAdded(cameraVideoAddedEvent: CameraVideoAddedEvent?) {
        handleRemoteCameraVideoAdded(cameraVideoAddedEvent!!)
    }

    override fun onRemoteCameraVideoRemoved() {
        handleRemoteCameraVideoRemoved()
    }

    override fun onRemoteScreenShareAdded(screenShareAddedEvent: ScreenShareAddedEvent?) {
        handleRemoteScreenShareAdded(screenShareAddedEvent!!)
    }

    override fun onRemoteScreenShareRemoved() {
        handleRemoteScreenShareRemoved()
    }

    override fun onRemoteMuted() {
        handleRemoteMuted()
    }

    override fun onRemoteUnmuted() {
        handleRemoteUnmuted()
    }

    override fun onHangup(callHangupEvent: CallHangupEvent?) {
        handleHangup("Hangup: ${callHangupEvent?.errorCode?.name}")
    }

    override fun onError(errorEvent: ErrorEvent?) {
        val error = errorEvent?.errorCode?.name
        Log.d(TAG, "Error: $error")
        setApplicationState("Error: $error")
    }

    override fun onRoomJoined(roomJoinedEvent: RoomJoinedEvent?) {
        handleRoomJoined(roomJoinedEvent)
    }

    override fun onRoomLeft(roomLeftEvent: RoomLeftEvent?) {
        handleRoomLeft(roomLeftEvent)
    }

    override fun onParticipantJoining(participantJoiningEvent: ParticipantJoiningEvent?) {
        Log.d(TAG, "Participant joining: ${participantJoiningEvent!!.participant.endpoint.identifier()}")
    }

    override fun onParticipantJoined(participantJoinedEvent: ParticipantJoinedEvent?) {
        handleParticipantJoined(participantJoinedEvent)
    }

    override fun onParticipantLeft(participantLeftEvent: ParticipantLeftEvent?) {
        handleParticipantLeft(participantLeftEvent)
    }

    override fun onParticipantCameraVideoAdded(participantCameraVideoAddedEvent: ParticipantCameraVideoAddedEvent?) {
        handleParticipantCameraVideoAdded(participantCameraVideoAddedEvent)
    }

    override fun onParticipantCameraVideoRemoved(participantCameraVideoRemovedEvent: ParticipantCameraVideoRemovedEvent?) {
        handleParticipantCameraVideoRemoved(participantCameraVideoRemovedEvent)
    }

    override fun onParticipantScreenShareAdded(participantScreenShareAddedEvent: ParticipantScreenShareAddedEvent?) {
        handleParticipantScreenShareAdded(participantScreenShareAddedEvent)
    }

    override fun onParticipantScreenShareRemoved(participantScreenShareRemovedEvent: ParticipantScreenShareRemovedEvent?) {
        handleParticipantScreenShareRemoved(participantScreenShareRemovedEvent)
    }

    override fun onParticipantMuted(participantMutedEvent: ParticipantMutedEvent?) {
        handleParticipantMuted(participantMutedEvent)
    }

    override fun onParticipantUnmuted(participantUnmutedEvent: ParticipantUnmutedEvent?) {
        handleParticipantUnmuted(participantUnmutedEvent)
    }

    override fun onParticipantDeaf(participantDeafEvent: ParticipantDeafEvent?) {
        Log.d(TAG, "Participant deaf: ${participantDeafEvent!!.participant.endpoint.identifier()}")
    }

    override fun onParticipantUndeaf(participantUndeafEvent: ParticipantUndeafEvent?) {
        Log.d(TAG, "Participant undeaf: ${participantUndeafEvent!!.participant.endpoint.identifier()}")
    }

    override fun onParticipantStartedTalking(participantStartedTalkingEvent: ParticipantStartedTalkingEvent?) {
        Log.d(TAG, "Participant started talking: ${participantStartedTalkingEvent!!.participant.endpoint.identifier()}")
    }

    override fun onParticipantStoppedTalking(participantStoppedTalkingEvent: ParticipantStoppedTalkingEvent?) {
        Log.d(TAG, "Participant stopped talking: ${participantStoppedTalkingEvent!!.participant.endpoint.identifier()}")
    }

    private fun handleRinging(callRingingEvent: CallRingingEvent) {
        Log.d(TAG, "Ringing: $callRingingEvent")
        runOnUiThread {
            setApplicationState(R.string.ringing_label)
        }
    }

    private fun handleEstablished(callEstablishedEvent: CallEstablishedEvent) {
        Log.d(TAG, "Established: $callEstablishedEvent")
        ServiceHelper.startService(this@MainActivity, CALL_IN_PROGRESS)

        val applicationState = "In a call with ${infobipRTC.activeCall.counterpart().identifier()}"
        runOnUiThread {
            setApplicationState(applicationState)
            handleActiveCallLayout()
        }
    }

    private fun handleCameraVideoAdded(cameraVideoAddedEvent: CameraVideoAddedEvent) {
        Log.d(TAG, "Camera video added")
        localCameraTrack = cameraVideoAddedEvent.track
        addTrack(localCameraTrack!!, localCameraVideoRenderer)
        runOnUiThread {
            findViewById<Button>(R.id.toggle_camera_button).setText(R.string.camera_off)
        }
    }

    private fun handleCameraVideoUpdated(cameraVideoUpdatedEvent: CameraVideoUpdatedEvent) {
        Log.d(TAG, "Camera video updated")
        localCameraTrack = cameraVideoUpdatedEvent.track
        localCameraTrack!!.addSink(localCameraVideoRenderer)
    }

    private fun handleCameraVideoRemoved() {
        Log.d(TAG, "Camera video removed")
        removeTrack(localCameraTrack!!, localCameraVideoRenderer)
        localCameraTrack = null
        runOnUiThread {
            findViewById<Button>(R.id.toggle_camera_button).setText(R.string.camera_on)
        }
    }

    private fun handleScreenShareAdded(screenShareAddedEvent: ScreenShareAddedEvent) {
        Log.d(TAG, "Screen share video added")
        localScreenShareTrack = screenShareAddedEvent.track
        addTrack(localScreenShareTrack!!, localScreenShareRenderer)
        runOnUiThread {
            findViewById<Button>(R.id.toggle_screen_share_button).setText(R.string.screen_share_off)
        }
    }

    private fun handleScreenShareRemoved() {
        Log.d(TAG, "Screen share video removed")
        removeTrack(localScreenShareTrack!!, localScreenShareRenderer)
        localScreenShareTrack = null
        runOnUiThread {
            findViewById<Button>(R.id.toggle_screen_share_button).setText(R.string.screen_share_on)
        }
    }

    private fun handleRemoteCameraVideoAdded(cameraVideoAddedEvent: CameraVideoAddedEvent) {
        Log.d(TAG, "Remote camera video added")
        setApplicationStateStatus(false)

        remoteCameraVideoTrack = cameraVideoAddedEvent.track
        val activeCall = infobipRTC.activeCall
        if (activeCall != null && activeCall is WebrtcCall) {
            if (activeCall.hasRemoteScreenShare()) {
                addTrack(remoteCameraVideoTrack!!, remoteSmallVideoRenderer)
            } else {
                addTrack(remoteCameraVideoTrack!!, remoteBigVideoRenderer)
            }
        }
    }

    private fun handleRemoteCameraVideoRemoved() {
        Log.d(TAG, "Remote camera video removed")
        setApplicationStateStatus(true)

        val activeCall = infobipRTC.activeCall
        if (activeCall != null && activeCall is WebrtcCall) {
            if (activeCall.hasRemoteScreenShare()) {
                removeTrack(remoteCameraVideoTrack!!, remoteSmallVideoRenderer)
            } else {
                removeTrack(remoteCameraVideoTrack!!, remoteBigVideoRenderer)
            }
        }
        remoteCameraVideoTrack = null
    }

    private fun handleRemoteScreenShareAdded(screenShareAddedEvent: ScreenShareAddedEvent) {
        Log.d(TAG, "Remote screen share video added")
        setApplicationStateStatus(false)

        remoteScreenShareTrack = screenShareAddedEvent.track
        val activeCall = infobipRTC.activeCall
        if (activeCall != null && activeCall is WebrtcCall) {
            if (activeCall.hasRemoteCameraVideo()) {
                remoteCameraVideoTrack!!.removeSink(remoteBigVideoRenderer)
                addTrack(remoteCameraVideoTrack!!, remoteSmallVideoRenderer)
                remoteScreenShareTrack!!.addSink(remoteBigVideoRenderer)
            } else {
                addTrack(remoteScreenShareTrack!!, remoteBigVideoRenderer)
            }
        }
    }

    private fun handleRemoteScreenShareRemoved() {
        Log.d(TAG, "Remote screen share video removed")
        val activeCall = infobipRTC.activeCall

        if (activeCall != null && activeCall is WebrtcCall) {
            if (activeCall.hasRemoteCameraVideo()) {
                remoteScreenShareTrack!!.removeSink(remoteBigVideoRenderer)
                removeTrack(remoteCameraVideoTrack!!, remoteSmallVideoRenderer)
                remoteCameraVideoTrack!!.addSink(remoteBigVideoRenderer)
            } else {
                setApplicationStateStatus(true)
                removeTrack(remoteScreenShareTrack!!, remoteBigVideoRenderer)
            }
        }
        remoteScreenShareTrack = null
    }

    private fun handleRemoteMuted() {
        Log.d(TAG, "Remote muted")
        runOnUiThread {
            setRemoteAudioStateVisibility(true)
        }
    }

    private fun handleRemoteUnmuted() {
        Log.d(TAG, "Remote unmuted")
        runOnUiThread {
            setRemoteAudioStateVisibility(false)
        }
    }

    private fun handleHangup(message: String) {
        releaseVideoRenderers()

        localCameraTrack = null
        localScreenShareTrack = null
        remoteCameraVideoTrack = null
        remoteScreenShareTrack = null

        Log.d(TAG, message)
        runOnUiThread {
            removeVideoContent()
            setApplicationStateStatus(true)
            setApplicationState(message)
            resetLayout()
        }

        ServiceHelper.startService(this@MainActivity, CALL_FINISHED)
        endActiveCalls()

        EXECUTOR.schedule({
            runOnUiThread {
                setApplicationState("Connected as ${accessToken.identity}")
            }
        }, 2, TimeUnit.SECONDS)
    }

    private fun handleRoomJoined(roomJoinedEvent: RoomJoinedEvent?) {
        ServiceHelper.startService(this@MainActivity, CALL_IN_PROGRESS)
        Log.d(TAG, "Room joined: $roomJoinedEvent")

        val activeRoomCall = infobipRTC.activeRoomCall
        runOnUiThread {
            setApplicationState("Joined room ${activeRoomCall?.name()}")
            participantsLayout.visibility = View.VISIBLE
            handleActiveCallLayout()
        }
        initParticipantsList()
    }

    private fun handleRoomLeft(roomLeftEvent: RoomLeftEvent?) {
        ServiceHelper.startService(this@MainActivity, CALL_FINISHED)
        Log.d(TAG, "Room left: $roomLeftEvent")

        releaseVideoRenderers()
        resetRoomVideoContent()
        runOnUiThread {
            setApplicationState("Room Left!")
        }

        EXECUTOR.schedule({
            runOnUiThread {
                setApplicationState("Connected as ${accessToken.identity}")
            }
        }, 2, TimeUnit.SECONDS)
    }

    private fun handleParticipantJoined(participantJoinedEvent: ParticipantJoinedEvent?) {
        val participant = participantJoinedEvent?.participant?.endpoint?.identifier()
        Log.d(TAG, "Participant joined: $participant")

        val numberOfParticipants = findViewById<TextView>(R.id.participants_number)
        val participantToAddToView = addParticipantToParticipantsList(participant!!)
        runOnUiThread {
            numberOfParticipants.text = "Participants: (${infobipRTC.activeRoomCall.participants().size})"
            roomParticipants.addView(participantToAddToView)
            setApplicationState("Participant $participant joined room")
        }
    }

    private fun handleParticipantLeft(participantLeftEvent: ParticipantLeftEvent?) {
        val participant = participantLeftEvent?.participant?.endpoint?.identifier()
        Log.d(TAG, "Participant left: $participant")

        val numberOfParticipants = findViewById<TextView>(R.id.participants_number)
        val participantToRemoveFromView = roomParticipants.findViewWithTag<TextView>(participant)
        runOnUiThread {
            numberOfParticipants.text = "Participants: (${infobipRTC.activeRoomCall.participants().size})"
            roomParticipants.removeView(participantToRemoveFromView)
            setApplicationState("Participant $participant left room")
        }
    }

    private fun handleParticipantCameraVideoAdded(participantCameraVideoAddedEvent: ParticipantCameraVideoAddedEvent?) {
        val participant = participantCameraVideoAddedEvent?.participant?.endpoint?.identifier()
        Log.d(TAG, "Participant camera video added: $participant")

        remoteCameraVideoTrack = participantCameraVideoAddedEvent?.track
        runOnUiThread {
            setApplicationState("Participant $participant added camera video")
            findViewById<HorizontalScrollView>(R.id.horizontalScrollView).visibility = View.VISIBLE
            participantVideosLayout.visibility = View.VISIBLE
            val newVideoRenderer = createNewVideoRenderer(participant!!)
            participantVideosLayout.addView(newVideoRenderer)
        }
    }

    private fun handleParticipantCameraVideoRemoved(participantCameraVideoRemovedEvent: ParticipantCameraVideoRemovedEvent?) {
        val participant = participantCameraVideoRemovedEvent?.participant?.endpoint?.identifier()
        Log.d(TAG, "Participant camera video removed: $participant")

        runOnUiThread {
            setApplicationState("Participant $participant removed camera video")
            removeVideoRenderer(participant!!)
        }
    }

    private fun handleParticipantScreenShareAdded(participantScreenShareAddedEvent: ParticipantScreenShareAddedEvent?) {
        val participant = participantScreenShareAddedEvent?.participant?.endpoint?.identifier()
        Log.d(TAG, "Participant started screen share: $participant")

        val activeRoomCall = infobipRTC.activeRoomCall
        remoteScreenShareTrack = participantScreenShareAddedEvent?.track
        if (activeRoomCall != null) {
            remoteScreenShareTrack!!.addSink(remoteBigVideoRenderer)
            runOnUiThread {
                findViewById<TextView>(R.id.application_state).visibility = View.GONE
                findViewById<VideoRenderer>(R.id.remote_big_video).visibility = View.VISIBLE
            }
        }
    }

    private fun handleParticipantScreenShareRemoved(participantScreenShareRemovedEvent: ParticipantScreenShareRemovedEvent?) {
        val participant = participantScreenShareRemovedEvent?.participant?.endpoint?.identifier()
        Log.d(TAG, "Participant stopped screen share: $participant")

        if (remoteScreenShareTrack != null) {
            remoteScreenShareTrack?.removeSink(remoteBigVideoRenderer)
            runOnUiThread {
                findViewById<TextView>(R.id.application_state).visibility = View.VISIBLE
                findViewById<VideoRenderer>(R.id.remote_big_video).visibility = View.GONE
            }
        }
        remoteScreenShareTrack = null
    }

    private fun handleParticipantMuted(participantMutedEvent: ParticipantMutedEvent?) {
        val participant = participantMutedEvent?.participant?.endpoint?.identifier()
        Log.d(TAG, "Participant muted: $participant")

        runOnUiThread {
            setApplicationState("Participant $participant muted")
        }
    }

    private fun handleParticipantUnmuted(participantUnmutedEvent: ParticipantUnmutedEvent?) {
        val participant = participantUnmutedEvent?.participant?.endpoint?.identifier()
        Log.d(TAG, "Participant unmuted: $participant")

        runOnUiThread {
            setApplicationState("Participant $participant unmuted")
        }
    }

    private fun createNewVideoRenderer(participant: String): VideoRenderer {
        val videoRenderer = VideoRenderer(this)
        val params = LayoutParams(
            500,
            500
        )
        params.gravity = Gravity.CENTER
        params.marginStart = 30
        params.topMargin = 20
        videoRenderer.layoutParams = params
        videoRenderer.tag = participant
        videoRenderer.foregroundGravity = Gravity.CENTER
        videoRenderer.visibility = View.VISIBLE
        initVideoRenderer(videoRenderer)
        addTrack(remoteCameraVideoTrack!!, videoRenderer)

        return videoRenderer
    }

    private fun removeVideoRenderer(participant: String) {
        val videoToRemove = participantVideosLayout.findViewWithTag<VideoRenderer>(participant)
        if (videoToRemove != null) {
            removeTrack(remoteCameraVideoTrack!!, videoToRemove)
            videoToRemove.release()
            participantVideosLayout.removeView(videoToRemove)
        }
        if (participantVideosLayout.childCount == 0) {
            participantVideosLayout.visibility = View.GONE
            findViewById<HorizontalScrollView>(R.id.horizontalScrollView).visibility = View.GONE
            remoteCameraVideoTrack = null
        }
    }

    private fun endActiveCalls() {
        if (infobipRTC.activeCall != null) {
            infobipRTC.activeCall.hangup()
        }
        if(infobipRTC.activeRoomCall != null) {
            infobipRTC.activeRoomCall.leave()
        }
    }

    private fun ensurePermissions() {
        if (!permissionGranted(permission.RECORD_AUDIO) || !permissionGranted(permission.CAMERA)) {
            ActivityCompat.requestPermissions(
                this, arrayOf(permission.RECORD_AUDIO, permission.CAMERA), 200
            )
        }
    }

    private fun findVideoRenderers() {
        localCameraVideoRenderer = findViewById(R.id.local_camera_video)
        localScreenShareRenderer = findViewById(R.id.local_screen_share)
        remoteBigVideoRenderer = findViewById(R.id.remote_big_video)
        remoteSmallVideoRenderer = findViewById(R.id.remote_small_video)
        participantVideosLayout = findViewById(R.id.linearLayoutVideos)
    }

    private fun findParticipantsLayout() {
        participantsLayout = findViewById(R.id.room_participants_layout)
        scrollParticipants = findViewById(R.id.room_participants_scroll)
        roomParticipants = findViewById(R.id.room_participants)
    }

    private fun addParticipantToParticipantsList(identity: String): TextView {
        val textView = TextView(this)
        val params = LayoutParams(
            LayoutParams.WRAP_CONTENT,
            LayoutParams.WRAP_CONTENT
        )
        params.gravity = Gravity.CENTER
        textView.layoutParams = params
        textView.text = identity
        textView.tag = identity

        return textView
    }

    private fun initParticipantsList() {
        val activeParticipants = infobipRTC.activeRoomCall.participants()
        val numberOfParticipants = findViewById<TextView>(R.id.participants_number)
        numberOfParticipants.text = "Participants: (${activeParticipants.size})"

        for (participant: Participant in activeParticipants) {
            val participantToAdd = addParticipantToParticipantsList(participant.endpoint.identifier())
            runOnUiThread {
                roomParticipants.addView(participantToAdd)
            }
        }
    }

    fun findTab(position: Int): Tab {
        val values = Tab.values()
        for (value in values) {
            if (value.position == position) {
                return value
            }
        }
        return Tab.WEBRTC
    }

    private fun getTabListener(): OnTabSelectedListener {
        return object : OnTabSelectedListener {
            override fun onTabSelected(tab: TabLayout.Tab) {
                activeTab = findTab(tab.position)
                when (activeTab) {
                    Tab.WEBRTC -> {
                        setWebrtcTabLayout()
                    }
                    Tab.PHONE -> {
                        setPhoneTabLayout()
                    }
                    Tab.ROOM -> {
                        setRoomTabLayout()
                    }
                }
            }

            override fun onTabUnselected(tab: TabLayout.Tab?) {
                Log.d(TAG, "Tab unselected")
            }

            override fun onTabReselected(tab: TabLayout.Tab) {
                Log.d(TAG, "Tab reselected")
            }
        }
    }

    private fun setWebrtcTabLayout() {
        findViewById<View>(R.id.call).visibility = View.VISIBLE
        findViewById<View>(R.id.video_call).visibility = View.VISIBLE
        findViewById<View>(R.id.call_phone_number).visibility = View.GONE
        findViewById<View>(R.id.join_room).visibility = View.GONE
        findViewById<Button>(R.id.hangup).text = "Hangup"
        setButtons(false)
    }

    private fun setPhoneTabLayout() {
        findViewById<View>(R.id.call).visibility = View.GONE
        findViewById<View>(R.id.video_call).visibility = View.GONE
        findViewById<View>(R.id.call_phone_number).visibility = View.VISIBLE
        findViewById<View>(R.id.join_room).visibility = View.GONE
        findViewById<Button>(R.id.hangup).text = "Hangup"
        setButtons(true)
    }

    private fun setRoomTabLayout() {
        findViewById<View>(R.id.call).visibility = View.GONE
        findViewById<View>(R.id.video_call).visibility = View.GONE
        findViewById<View>(R.id.call_phone_number).visibility = View.GONE
        findViewById<View>(R.id.join_room).visibility = View.VISIBLE
        findViewById<Button>(R.id.hangup).text = "Leave"
        setButtons(false)
    }

    private fun setButtons(isPhoneCall: Boolean) {
        val muteButton = findViewById<Button>(R.id.toggle_audio_button)
        runOnUiThread {
            muteButton.updateLayoutParams<LayoutParams> {
                weight = if (isPhoneCall) 0F else 1F
                width = if (isPhoneCall) LayoutParams.WRAP_CONTENT else 0
                bottomMargin = if (isPhoneCall) 30 else 0
            }
        }
    }

    private fun setButtonClickListeners() {
        tabLayout.addOnTabSelectedListener(getTabListener())

        findViewById<Switch>(R.id.toggle_audio_switch).setOnClickListener {
            toggleAudioSwitchOnClick()
        }

        findViewById<Button>(R.id.call).setOnClickListener {
            callButtonOnClick()
        }

        findViewById<Button>(R.id.video_call).setOnClickListener {
            videoCallButtonOnClick()
        }

        findViewById<Button>(R.id.call_phone_number).setOnClickListener {
            callPhoneNumberButtonOnClick()
        }

        findViewById<Button>(R.id.join_room).setOnClickListener {
            joinRoomOnClick()
        }

        findViewById<Button>(R.id.accept).setOnClickListener {
            acceptButtonOnClick(false)
        }

        findViewById<Button>(R.id.accept_video).setOnClickListener {
            acceptButtonOnClick(true)
        }

        findViewById<Button>(R.id.decline).setOnClickListener {
            declineButtonOnClick()
        }

        findViewById<Button>(R.id.hangup).setOnClickListener {
            if (activeTab == Tab.ROOM) leaveButtonOnClick() else hangupButtonOnClick()
        }

        findViewById<Button>(R.id.toggle_audio_button).setOnClickListener {
            if (activeTab == Tab.ROOM) toggleRoomAudioButtonOnClick() else toggleAudioButtonOnClick()
        }

        findViewById<Button>(R.id.toggle_camera_button).setOnClickListener {
            if (activeTab == Tab.ROOM) toggleRoomCameraButtonOnClick() else toggleCameraButtonOnClick()
        }

        findViewById<Button>(R.id.toggle_screen_share_button).setOnClickListener {
            if (activeTab == Tab.ROOM) toggleRoomScreenShareButtonOnClick() else toggleScreenShareButtonOnClick()
        }

        findViewById<Button>(R.id.flip_camera_button).setOnClickListener {
            if (activeTab == Tab.ROOM) flipRoomCameraButtonOnClick() else flipCameraButtonOnClick()
        }
    }

    private fun connect() {
        EXECUTOR.execute {
            try {
                accessToken = TokenService.getAccessToken()
                infobipRTC.enablePushNotification(accessToken.token, applicationContext)
                if (infobipRTC.activeCall == null) {
                    runOnUiThread {
                        setApplicationState("Connected as ${accessToken.identity}")
                    }
                }
            } catch (t: Throwable) {
                Log.e(TAG, "Error connecting", t)
                runOnUiThread {
                    setApplicationState("Connection error: ${t.javaClass.simpleName} ${t.message}")
                }
            }
        }
    }

    private fun toggleAudioSwitchOnClick() {
        audioEnabled = !audioEnabled
    }

    private fun callButtonOnClick() {
        call(video = false)
    }

    private fun videoCallButtonOnClick() {
        call(video = true)
    }

    private fun callPhoneNumberButtonOnClick() {
        call(video = false)
    }

    private fun joinRoomOnClick() {
        call(video = false)
    }

    private fun acceptButtonOnClick(video: Boolean) {
        val activeCall = infobipRTC.activeCall
        if (activeCall != null) {
            (activeCall as IncomingWebrtcCall).accept(
                WebrtcCallOptions.builder().audio(audioEnabled).video(video).build()
            )
            initializeVideoRenderers()
        } else {
            Toast.makeText(applicationContext, "No active call", Toast.LENGTH_LONG).show()
        }
    }

    private fun declineButtonOnClick() {
        val activeCall = infobipRTC.activeCall
        if (activeCall != null) {
            (activeCall as IncomingWebrtcCall).decline()
        } else {
            Toast.makeText(applicationContext, "No active call", Toast.LENGTH_LONG).show()
        }
    }

    private fun hangupButtonOnClick() {
        val activeCall = infobipRTC.activeCall
        if (activeCall != null) {
            activeCall.hangup()

            runOnUiThread {
                removeVideoContent()
                setApplicationStateStatus(true)
                resetLayout()
            }
        } else {
            Toast.makeText(applicationContext, "No active call", Toast.LENGTH_LONG).show()
        }
    }

    private fun leaveButtonOnClick() {
        val activeRoomCall = infobipRTC.activeRoomCall
        if (activeRoomCall != null) {
            activeRoomCall.leave()
            resetRoomVideoContent()
        } else {
            Toast.makeText(applicationContext, "No active call", Toast.LENGTH_LONG).show()
        }
    }

    private fun resetRoomVideoContent() {
        runOnUiThread {
            participantsLayout.visibility = View.GONE
            roomParticipants.removeAllViews()
            remoteCameraVideoTrack = null
            participantVideosLayout.visibility = View.GONE
            participantVideosLayout.removeAllViews()
            findViewById<HorizontalScrollView>(R.id.horizontalScrollView).visibility = View.GONE
            setApplicationStateStatus(true)
            removeVideoContent()
            resetLayout()
        }
    }

    private fun toggleAudioButtonOnClick() {
        val activeCall = infobipRTC.activeCall
        val muted = !activeCall?.muted()!!

        activeCall.mute(muted)
        runOnUiThread {
            findViewById<Button>(R.id.toggle_audio_button).setText(if (muted) R.string.unmute else R.string.mute)
        }
    }

    private fun toggleRoomAudioButtonOnClick() {
        val activeRoomCall = infobipRTC.activeRoomCall
        val muted = !activeRoomCall?.muted()!!

        activeRoomCall.mute(muted)
        runOnUiThread {
            findViewById<Button>(R.id.toggle_audio_button).setText(if (muted) R.string.unmute else R.string.mute)
        }
    }

    private fun toggleCameraButtonOnClick() {
        val activeCall = infobipRTC.activeCall
        if (activeCall is WebrtcCall) {
            val hasCameraVideo = !activeCall.hasCameraVideo()
            try {
                activeCall.cameraVideo(hasCameraVideo)
            } catch (e: Exception) {
                Log.d(TAG, "${e.message}")
            }
            findViewById<Button>(R.id.flip_camera_button).visibility = if (hasCameraVideo) View.VISIBLE else View.GONE
        }
    }

    private fun toggleRoomCameraButtonOnClick() {
        val activeRoomCall = infobipRTC.activeRoomCall
        val hasCameraVideo = !activeRoomCall.hasCameraVideo()

        try {
            activeRoomCall.cameraVideo(hasCameraVideo)
        } catch (e: Exception) {
            Log.d(TAG, "${e.message}")
        }
        findViewById<Button>(R.id.flip_camera_button).visibility = if (hasCameraVideo) View.VISIBLE else View.GONE
    }

    private fun toggleScreenShareButtonOnClick() {
        val activeCall = infobipRTC.activeCall
        if (activeCall is WebrtcCall) {
            val hasScreenShare = activeCall.hasScreenShare()
            if (!hasScreenShare) {
                startScreenShare()
            } else {
                activeCall.stopScreenShare()
            }
        }
    }

    private fun toggleRoomScreenShareButtonOnClick() {
        val activeRoomCall = infobipRTC.activeRoomCall
        val hasScreenShare = activeRoomCall?.hasScreenShare()

        if (!hasScreenShare!!) {
            startScreenShare()
        } else {
            activeRoomCall.stopScreenShare()
        }
    }

    private fun flipCameraButtonOnClick() {
        val activeCall = infobipRTC.activeCall
        if (activeCall is WebrtcCall) {
            val front = activeCall.cameraOrientation() == CameraOrientation.FRONT
            val newCameraOrientation =
                if (front) CameraOrientation.BACK else CameraOrientation.FRONT
            activeCall.cameraOrientation(newCameraOrientation)
        }
    }

    private fun flipRoomCameraButtonOnClick() {
        val activeRoomCall = infobipRTC.activeRoomCall
        val front = activeRoomCall?.cameraOrientation() == CameraOrientation.FRONT
        val newCameraOrientation =
            if (front) CameraOrientation.BACK else CameraOrientation.FRONT
        activeRoomCall?.cameraOrientation(newCameraOrientation)
    }

    private fun permissionGranted(permission: String): Boolean {
        return ContextCompat.checkSelfPermission(
            this, permission
        ) == PackageManager.PERMISSION_GRANTED
    }

    private fun startScreenShare() {
        val mediaProjectionManager =
            application.getSystemService(MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        startActivityForResult(
            mediaProjectionManager.createScreenCaptureIntent(), CAPTURE_PERMISSION_REQUEST_CODE
        )
    }

    private fun call(video: Boolean) {
        EXECUTOR.execute {
            try {
                accessToken = TokenService.getAccessToken()
                val destination = findViewById<EditText>(R.id.destination).text.toString()

                val outgoingCall: Any = when(activeTab) {
                    Tab.WEBRTC -> {
                        webrtcCall(destination, video) as Call
                    }
                    Tab.PHONE -> {
                        phoneCall(destination) as Call
                    }
                    Tab.ROOM -> {
                        roomCall(destination, video)
                    }
                }

                Log.d(TAG, "Outgoing Call: $outgoingCall")
                ServiceHelper.startService(this@MainActivity, OUTGOING_CALL_START)
                intent.action = null

                runOnUiThread {
                    setApplicationState(R.string.calling_label)
                    initializeVideoRenderers()
                    handleOutgoingCallLayout()
                }
            } catch (t: Throwable) {
                Log.e(TAG, "Error calling", t)
                runOnUiThread {
                    Toast.makeText(
                        applicationContext, "Error calling: ${t.message}", Toast.LENGTH_LONG
                    ).show()
                }
            }
        }
    }

    private fun phoneCall(destination: String): PhoneCall? {
        val callPhoneRequest = CallPhoneRequest(
            accessToken.token, applicationContext, destination, this
        )
        val phoneCallOptions = PhoneCallOptions.builder().audio(audioEnabled).from(FROM).build()
        return infobipRTC.callPhone(callPhoneRequest, phoneCallOptions)
    }

    private fun webrtcCall(destination: String, video: Boolean): WebrtcCall? {
        val webrtcCallRequest = CallWebrtcRequest(
            accessToken.token, applicationContext, destination, this
        )
        val webrtcCallOptions = WebrtcCallOptions.builder().audio(audioEnabled).video(video).build()
        return infobipRTC.callWebrtc(webrtcCallRequest, webrtcCallOptions)
    }

    private fun roomCall(destination: String, video: Boolean): RoomCall {
        val roomCallRequest = RoomRequest(
            accessToken.token, applicationContext, this, destination
        )
        val roomCallOptions = RoomCallOptions.builder().audio(audioEnabled).video(video).build()
        return infobipRTC.joinRoom(roomCallRequest, roomCallOptions)
    }

    private fun setApplicationStateStatus(visible: Boolean) {
        runOnUiThread {
            findViewById<TextView>(R.id.application_state).visibility =
                if (visible) View.VISIBLE else View.INVISIBLE
            findViewById<TextView>(R.id.remote_audio_state).visibility =
                if (visible) View.VISIBLE else View.INVISIBLE
        }
    }

    private fun addTrack(videoTrack: RTCVideoTrack, videoRenderer: VideoRenderer) {
        runOnUiThread {
            videoRenderer.visibility = View.VISIBLE
        }
        videoTrack.addSink(videoRenderer)
    }

    private fun removeTrack(videoTrack: RTCVideoTrack, videoRenderer: VideoRenderer) {
        runOnUiThread {
            videoRenderer.visibility = View.GONE
        }
        videoTrack.removeSink(videoRenderer)
    }

    private fun initializeVideoRenderers() {
        initLocalCameraVideoRenderer()
        initLocalScreenShareRenderer()
        initRemoteBigVideoRenderer()
        initRemoteSmallVideoRenderer()
    }

    private fun initRemoteBigVideoRenderer() {
        remoteBigVideoRenderer.init()
        remoteBigVideoRenderer.setEnableHardwareScaler(true)
        remoteBigVideoRenderer.setScalingType(RendererCommon.ScalingType.SCALE_ASPECT_FIT)
    }

    private fun initRemoteSmallVideoRenderer() {
        remoteSmallVideoRenderer.init()
        remoteSmallVideoRenderer.setEnableHardwareScaler(true)
        remoteSmallVideoRenderer.setScalingType(RendererCommon.ScalingType.SCALE_ASPECT_FIT)
    }

    private fun initLocalScreenShareRenderer() {
        localScreenShareRenderer.init()
        localScreenShareRenderer.setMirror(false)
        localScreenShareRenderer.setZOrderMediaOverlay(true)
    }

    private fun initLocalCameraVideoRenderer() {
        localCameraVideoRenderer.init()
        localCameraVideoRenderer.setMirror(true)
        localCameraVideoRenderer.setZOrderMediaOverlay(true)
    }

    private fun initVideoRenderer(videoRenderer: VideoRenderer) {
        videoRenderer.init()
        videoRenderer.setMirror(true)
        videoRenderer.setZOrderMediaOverlay(true)
        videoRenderer.setScalingType(RendererCommon.ScalingType.SCALE_ASPECT_FILL)
    }

    private fun releaseVideoRenderers() {
        localCameraVideoRenderer.release()
        localScreenShareRenderer.release()
        remoteBigVideoRenderer.release()
        remoteSmallVideoRenderer.release()
    }

    private fun removeVideoContent() {
        findViewById<VideoRenderer>(R.id.remote_small_video).visibility = View.GONE
        findViewById<VideoRenderer>(R.id.remote_big_video).visibility = View.GONE
        findViewById<VideoRenderer>(R.id.local_camera_video).visibility = View.GONE
        findViewById<VideoRenderer>(R.id.local_screen_share).visibility = View.GONE
    }

    private fun showIncomingCall() {
        val incomingWebrtcCall = infobipRTC.activeCall as WebrtcCall
        if (incomingWebrtcCall.status() == CallStatus.RINGING) {
            incomingWebrtcCall.eventListener = this
            val video = incomingWebrtcCall.hasRemoteCameraVideo()
            val callType = if (video) "video" else "audio"

            runOnUiThread {
                setApplicationState(
                    "Incoming $callType call from ${incomingWebrtcCall.source().identifier()}"
                )
                handleIncomingCallLayout()
            }
        }
    }

    private fun setApplicationState(label: Int) {
        findViewById<TextView>(R.id.application_state).setText(label)
    }

    private fun setApplicationState(text: String) {
        findViewById<TextView>(R.id.application_state).text = text
    }

    private fun handleActiveCallLayout() {
        setActiveCallLayoutVisibility(true)
        setVideoLayoutVisibility(true)
        setHangupLayoutVisibility(true)
        setDestinationVisibility(false)
        setIncomingCallLayoutVisibility(false)
    }

    private fun handleOutgoingCallLayout() {
        setVideoLayoutVisibility(false)
        setHangupLayoutVisibility(true)
        setOutgoingCallButtonsVisibility(false)
        setIncomingCallLayoutVisibility(false)
    }

    private fun handleIncomingCallLayout() {
        setVideoLayoutVisibility(false)
        setHangupLayoutVisibility(false)
        setDestinationVisibility(false)
        setOutgoingCallButtonsVisibility(false)
        setIncomingCallLayoutVisibility(true)
    }

    private fun resetLayout() {
        setActiveCallLayoutVisibility(false)
        setVideoLayoutVisibility(false)
        setRemoteAudioStateVisibility(false)
        setDestinationVisibility(true)
        setHangupLayoutVisibility(false)
        setOutgoingCallButtonsVisibility(true)
        setIncomingCallLayoutVisibility(false)
        setActiveTabLayout()
    }

    private fun setActiveTabLayout() {
        when (activeTab) {
            Tab.WEBRTC -> setWebrtcTabLayout()
            Tab.PHONE -> setPhoneTabLayout()
            Tab.ROOM -> setRoomTabLayout()
        }
    }

    private fun setHangupLayoutVisibility(visible: Boolean) {
        findViewById<LinearLayout>(R.id.hangup_layout).visibility =
            if (visible) View.VISIBLE else View.GONE
    }

    private fun setOutgoingCallButtonsVisibility(visible: Boolean) {
        val visibility = if (visible) View.VISIBLE else View.GONE
        findViewById<Switch>(R.id.toggle_audio_switch).visibility = visibility
        findViewById<Button>(R.id.call).visibility = visibility
        findViewById<Button>(R.id.video_call).visibility = visibility
        findViewById<Button>(R.id.call_phone_number).visibility = visibility
        findViewById<Button>(R.id.join_room).visibility = visibility
    }

    private fun setIncomingCallLayoutVisibility(visible: Boolean) {
        val visibility = if (visible) View.VISIBLE else View.GONE
        findViewById<Button>(R.id.toggle_audio_switch).visibility = visibility
        findViewById<LinearLayout>(R.id.incoming_call_layout).visibility = visibility
    }

    private fun setDestinationVisibility(visible: Boolean) {
        findViewById<EditText>(R.id.destination).visibility =
            if (visible) View.VISIBLE else View.GONE
    }

    private fun setRemoteAudioStateVisibility(visible: Boolean) {
        if (remoteBigVideoRenderer.visibility != View.VISIBLE) {
            findViewById<TextView>(R.id.remote_audio_state).visibility =
                if (visible) View.VISIBLE else View.INVISIBLE
        } else {
            findViewById<TextView>(R.id.remote_audio_state).visibility = View.INVISIBLE
        }
    }

    private fun setActiveCallLayoutVisibility(visible: Boolean) {
        findViewById<LinearLayout>(R.id.active_call_layout).visibility =
            if (visible) View.VISIBLE else View.GONE
        findViewById<LinearLayout>(R.id.incoming_call_layout).visibility =
            if (visible) View.GONE else View.VISIBLE
        findViewById<TabLayout>(R.id.tabs).visibility =
            if (visible) View.GONE else View.VISIBLE

        if (visible) {
            if (activeTab == Tab.ROOM) setActiveRoomCallButtonsText() else setActiveCallButtonsText()
        }
    }

    private fun setVideoLayoutVisibility(visible: Boolean) {
        findViewById<FrameLayout>(R.id.video_content).visibility =
            if (visible) View.VISIBLE else View.GONE
    }

    private fun setActiveCallButtonsText() {
        val activeCall = infobipRTC.activeCall
        findViewById<Button>(R.id.toggle_audio_button).setText(if (activeCall.muted()) R.string.unmute else R.string.mute)
        if (activeCall is WebrtcCall) {
            findViewById<Button>(R.id.toggle_camera_button).visibility = View.VISIBLE
            findViewById<Button>(R.id.toggle_screen_share_button).visibility = View.VISIBLE
            findViewById<Button>(R.id.flip_camera_button).visibility =
                if (activeCall.hasCameraVideo()) View.VISIBLE else View.GONE

            findViewById<Button>(R.id.toggle_camera_button).setText(if (activeCall.hasCameraVideo()) R.string.camera_off else R.string.camera_on)
            findViewById<Button>(R.id.toggle_screen_share_button).setText(if (activeCall.hasScreenShare()) R.string.screen_share_off else R.string.screen_share_on)
        } else {
            findViewById<Button>(R.id.toggle_camera_button).visibility = View.GONE
            findViewById<Button>(R.id.toggle_screen_share_button).visibility = View.GONE
            findViewById<Button>(R.id.flip_camera_button).visibility = View.GONE
        }
    }

    private fun setActiveRoomCallButtonsText() {
        val activeRoomCall = infobipRTC.activeRoomCall
        findViewById<Button>(R.id.toggle_audio_button).setText(if (activeRoomCall!!.muted()) R.string.unmute else R.string.mute)
        findViewById<Button>(R.id.toggle_camera_button).visibility = View.VISIBLE
        findViewById<Button>(R.id.toggle_screen_share_button).visibility = View.VISIBLE
        findViewById<Button>(R.id.flip_camera_button).visibility =
            if (activeRoomCall.hasCameraVideo()) View.VISIBLE else View.GONE

        findViewById<Button>(R.id.toggle_camera_button).setText(if (activeRoomCall.hasCameraVideo()) R.string.camera_off else R.string.camera_on)
        findViewById<Button>(R.id.toggle_screen_share_button).setText(if (activeRoomCall.hasScreenShare()) R.string.screen_share_off else R.string.screen_share_on)
    }
}