package com.infobip.rtc.showcase

import android.Manifest
import android.content.pm.PackageManager
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.EditText
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.infobip.rtc.showcase.service.TokenService
import com.infobip.webrtc.sdk.api.InfobipRTC
import com.infobip.webrtc.sdk.api.call.CallRequest
import com.infobip.webrtc.sdk.api.call.options.CallPhoneNumberOptions
import com.infobip.webrtc.sdk.api.event.CallEventListener
import com.infobip.webrtc.sdk.api.event.call.CallErrorEvent
import com.infobip.webrtc.sdk.api.event.call.CallEstablishedEvent
import com.infobip.webrtc.sdk.api.event.call.CallHangupEvent
import com.infobip.webrtc.sdk.api.event.call.CallRingingEvent
import android.os.AsyncTask
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import com.infobip.rtc.showcase.service.AccessToken
import com.infobip.webrtc.sdk.api.call.IncomingCall
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.TimeUnit

class MainActivity : AppCompatActivity() {

    companion object {
        const val INCOMING_CALL = "INCOMING_CALL"

        private const val TAG = "INFOBIP_RTC"
        private const val FROM = "33755531044"
        private val EXECUTOR: ScheduledExecutorService = Executors.newScheduledThreadPool(2)
    }

    private lateinit var accessToken: AccessToken

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        ensureRecordAudioPermission()

        findViewById<View>(R.id.call).setOnClickListener {
            callButtonOnClick()
        }

        findViewById<View>(R.id.call_phone_number).setOnClickListener {
            callPhoneNumberButtonOnClick()
        }

        findViewById<View>(R.id.hangup).setOnClickListener {
            hangupButtonOnClick()
        }

        findViewById<View>(R.id.accept).setOnClickListener {
            acceptButtonOnClick()
        }

        findViewById<View>(R.id.decline).setOnClickListener {
            declineButtonOnClick()
        }

        AsyncTask.execute {
            try {
                accessToken = TokenService.getAccessToken()
                InfobipRTC.enablePushNotification(accessToken.token, applicationContext)
                if (InfobipRTC.getActiveCall() == null) {
                    setApplicationState("Connected as ${accessToken.identity}")
                }
            } catch (t: Throwable) {
                Log.e(TAG, "Error connecting", t)
                setApplicationState("Connection error: ${t.javaClass.simpleName} ${t.message}")
            }

        }

        val action = intent.action
        if (INCOMING_CALL == action) {
            showIncomingCall()
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<String>, grantResults: IntArray) {
        if (grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            Log.d(TAG, "RECORD_AUDIO granted")
        } else {
            Log.w(TAG, "RECORD_AUDIO denied")
        }
    }

    private fun ensureRecordAudioPermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.RECORD_AUDIO), 200)
        }
    }

    private fun callButtonOnClick() {
        call(false)
    }

    private fun callPhoneNumberButtonOnClick() {
        call(true)
    }

    private fun hangupButtonOnClick() {
        val activeCall = InfobipRTC.getActiveCall()
        if (activeCall != null) {
            activeCall.hangup()
        } else {
            Toast.makeText(applicationContext, "No active call", Toast.LENGTH_LONG).show()
        }
    }

    private fun acceptButtonOnClick() {
        val activeCall = InfobipRTC.getActiveCall()
        if (activeCall != null) {
            (activeCall as IncomingCall).accept()
        } else {
            Toast.makeText(applicationContext, "No active call", Toast.LENGTH_LONG).show()
        }
    }

    private fun declineButtonOnClick() {
        val activeCall = InfobipRTC.getActiveCall()
        if (activeCall != null) {
            (activeCall as IncomingCall).decline()
        } else {
            Toast.makeText(applicationContext, "No active call", Toast.LENGTH_LONG).show()
        }
    }

    private fun call(phoneNumber: Boolean) {
        AsyncTask.execute {
            try {
                accessToken = TokenService.getAccessToken()
                val destination = findViewById<EditText>(R.id.destination).text.toString()
                val callRequest = CallRequest(accessToken.token, applicationContext, destination, callEventListener())

                val outgoingCall = if (phoneNumber) {
                    val callPhoneNumberOutgoingCall = CallPhoneNumberOptions.builder().from(FROM).build()
                    InfobipRTC.callPhoneNumber(callRequest, callPhoneNumberOutgoingCall)
                } else {
                    InfobipRTC.call(callRequest)
                }
                Log.d(TAG, "Outgoing Call: $outgoingCall")
                setApplicationState(R.string.calling_label)
                setHangupButtonVisibility(true)
                setOutgoingCallButtonsVisibility(false)
            } catch (t: Throwable) {
                Log.e(TAG, "Error calling", t)
                runOnUiThread {
                    Toast.makeText(applicationContext, "Error calling: ${t.message}", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    private fun callEventListener(): CallEventListener {
        return object : CallEventListener {
            override fun onHangup(callHangupEvent: CallHangupEvent?) {
                handleHangup("Hangup: ${callHangupEvent?.errorCode?.name}")
            }
            override fun onEstablished(callEstablishedEvent: CallEstablishedEvent?) {
                handleEstablished(callEstablishedEvent!!)
            }
            override fun onError(callErrorEvent: CallErrorEvent?) {
                handleHangup("Error: ${callErrorEvent?.reason?.name}")
            }
            override fun onRinging(callRingingEvent: CallRingingEvent?) {
               handleRinging(callRingingEvent!!)
            }
        }
    }

    private fun handleHangup(message: String) {
        Log.d(TAG, message)
        setApplicationState(message)
        EXECUTOR.schedule({
            setApplicationState("Connected as ${accessToken.identity}")
            setOutgoingCallButtonsVisibility(true)
        }, 2, TimeUnit.SECONDS)
        setHangupButtonVisibility(false)
        setIncomingCallButtonsVisibility(false)
    }

    private fun handleEstablished(callEstablishedEvent: CallEstablishedEvent) {
        Log.d(TAG, "Established: $callEstablishedEvent")
        setApplicationState(R.string.in_a_call_label)
        setHangupButtonVisibility(true)
        setIncomingCallButtonsVisibility(false)
    }

    private fun handleRinging(callRingingEvent: CallRingingEvent) {
        Log.d(TAG, "Ringing: $callRingingEvent")
        setApplicationState(R.string.ringing_label)
    }

    private fun showIncomingCall() {
        val incomingCall = InfobipRTC.getActiveCall() as IncomingCall
        incomingCall.setEventListener(callEventListener())
        setApplicationState("Incoming call from ${incomingCall.source()}")
        setOutgoingCallButtonsVisibility(false)
        setIncomingCallButtonsVisibility(true)
    }

    private fun setApplicationState(label: Int) {
        runOnUiThread {
            findViewById<TextView>(R.id.application_state).setText(label)
        }
    }

    private fun setApplicationState(text: String) {
        runOnUiThread {
            findViewById<TextView>(R.id.application_state).text = text
        }
    }

    private fun setHangupButtonVisibility(visible: Boolean) {
        runOnUiThread {
            findViewById<Button>(R.id.hangup).visibility = if (visible) Button.VISIBLE else Button.GONE
        }
    }

    private fun setOutgoingCallButtonsVisibility(visible: Boolean) {
        runOnUiThread {
            val visibility = if (visible) Button.VISIBLE else Button.GONE
            findViewById<Button>(R.id.call).visibility = visibility
            findViewById<Button>(R.id.call_phone_number).visibility = visibility
        }
    }

    private fun setIncomingCallButtonsVisibility(visible: Boolean) {
        runOnUiThread {
            val visibility = if (visible) Button.VISIBLE else Button.GONE
            findViewById<Button>(R.id.accept).visibility = visibility
            findViewById<Button>(R.id.decline).visibility = visibility
        }
    }
}
