package com.infobip.rtc.showcase

import android.Manifest.permission
import android.content.pm.PackageManager
import android.os.AsyncTask
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.infobip.rtc.showcase.service.AccessToken
import com.infobip.rtc.showcase.service.TokenService
import com.infobip.webrtc.sdk.api.InfobipRTC
import com.infobip.webrtc.sdk.api.call.CallRequest
import com.infobip.webrtc.sdk.api.call.IncomingCall
import com.infobip.webrtc.sdk.api.call.options.CallOptions
import com.infobip.webrtc.sdk.api.call.options.CallPhoneNumberOptions
import com.infobip.webrtc.sdk.api.call.options.VideoOptions.CameraOrientation
import com.infobip.webrtc.sdk.api.event.CallEventListener
import com.infobip.webrtc.sdk.api.event.call.*
import com.infobip.webrtc.sdk.api.video.RTCVideoTrack
import com.infobip.webrtc.sdk.api.video.VideoRenderer
import org.webrtc.RendererCommon
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.TimeUnit

class MainActivity : AppCompatActivity() {
    companion object {
        const val INCOMING_CALL = "INCOMING_CALL"

        private const val TAG = "INFOBIP_RTC"
        private const val FROM = "33712345678"
        private val EXECUTOR: ScheduledExecutorService = Executors.newScheduledThreadPool(2)
        private var localVideoTrack: RTCVideoTrack? = null
        private var remoteVideoTrack: RTCVideoTrack? = null
        private lateinit var remoteVideoRenderer: VideoRenderer
        private lateinit var localVideoRenderer: VideoRenderer
    }

    private lateinit var accessToken: AccessToken

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        ensurePermissions()

        remoteVideoRenderer = findViewById(R.id.remote_video)
        localVideoRenderer = findViewById(R.id.local_video)

        findViewById<View>(R.id.call).setOnClickListener {
            callButtonOnClick()
        }

        findViewById<View>(R.id.video_call).setOnClickListener {
            videoCallButtonOnClick()
        }

        findViewById<View>(R.id.call_phone_number).setOnClickListener {
            callPhoneNumberButtonOnClick()
        }

        findViewById<View>(R.id.hangup).setOnClickListener {
            hangupButtonOnClick()
        }

        findViewById<View>(R.id.video_hangup).setOnClickListener {
            hangupButtonOnClick()
        }

        findViewById<View>(R.id.accept).setOnClickListener {
            acceptButtonOnClick()
        }

        findViewById<View>(R.id.decline).setOnClickListener {
            declineButtonOnClick()
        }

        findViewById<View>(R.id.flip_camera_button).setOnClickListener{
            flipCameraButtonOnClick()
        }

        AsyncTask.execute {
            try {
                accessToken = TokenService.getAccessToken()
                InfobipRTC.enablePushNotification(accessToken.token, applicationContext)
                if (InfobipRTC.getActiveCall() == null) {
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

        val action = intent.action
        if (INCOMING_CALL == action) {
            showIncomingCall()
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<String>, grantResults: IntArray) {
        if (grantResults[0] == PackageManager.PERMISSION_GRANTED) Log.d(TAG, "RECORD_AUDIO granted")
        else Log.d(TAG, "RECORD_AUDIO denied")

        if (grantResults[1] == PackageManager.PERMISSION_GRANTED) Log.d(TAG, "CAMERA granted")
        else Log.d(TAG, "CAMERA denied")
    }

    private fun ensurePermissions() {
        if (!permissionGranted(permission.RECORD_AUDIO) || !permissionGranted(permission.CAMERA)) {
            ActivityCompat.requestPermissions(this, arrayOf(permission.RECORD_AUDIO, permission.CAMERA), 200)
        }
    }

    private fun permissionGranted(permission: String): Boolean {
        return ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED
    }

    private fun videoCallButtonOnClick() {
        call(phoneNumber = false, video = true)
    }

    private fun callButtonOnClick() {
        call(phoneNumber = false, video = false)
    }

    private fun callPhoneNumberButtonOnClick() {
        call(phoneNumber = true, video = false)
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

    private fun flipCameraButtonOnClick() {
        val activeCall = InfobipRTC.getActiveCall()
        val front = activeCall.cameraOrientation() == CameraOrientation.FRONT
        val newCameraOrientation = if (front) CameraOrientation.BACK else CameraOrientation.FRONT
        activeCall.cameraOrientation(newCameraOrientation)
    }

    private fun call(phoneNumber: Boolean, video: Boolean) {
        AsyncTask.execute {
            try {
                accessToken = TokenService.getAccessToken()
                val destination = findViewById<EditText>(R.id.destination).text.toString()
                val callRequest = CallRequest(accessToken.token, applicationContext, destination, callEventListener())

                val outgoingCall = if (phoneNumber) {
                    val callPhoneNumberOutgoingCall = CallPhoneNumberOptions.builder().from(FROM).build()
                    InfobipRTC.callPhoneNumber(callRequest, callPhoneNumberOutgoingCall)
                } else {
                    val callOptions = CallOptions.builder().video(video).build()
                    InfobipRTC.call(callRequest, callOptions)
                }

                Log.d(TAG, "Outgoing Call: $outgoingCall")

                runOnUiThread {
                    if (video) initializeVideoRenderers()
                    setApplicationState(R.string.calling_label)
                    handleOutgoingCallLayout()
                }
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
            override fun onRinging(callRingingEvent: CallRingingEvent?) {
                handleRinging(callRingingEvent!!)
            }
            override fun onEarlyMedia(callEarlyMediaEvent: CallEarlyMediaEvent?) {
                Log.d(TAG, "Early media: $callEarlyMediaEvent")
            }
            override fun onHangup(callHangupEvent: CallHangupEvent?) {
                handleHangup("Hangup: ${callHangupEvent?.errorCode?.name}")
            }
            override fun onEstablished(callEstablishedEvent: CallEstablishedEvent?) {
                handleEstablished(callEstablishedEvent!!)
            }
            override fun onError(callErrorEvent: CallErrorEvent?) {
                handleHangup("Error: ${callErrorEvent?.reason?.name}")
            }
        }
    }

    private fun handleHangup(message: String) {
        localVideoTrack = null
        remoteVideoTrack = null
        releaseVideoRenderers()

        Log.d(TAG, message)
        runOnUiThread {
            setApplicationState(message)
        }

        EXECUTOR.schedule({
            runOnUiThread {
                setApplicationState("Connected as ${accessToken.identity}")
                resetLayout()
            }
        }, 2, TimeUnit.SECONDS)
    }

    private fun handleEstablished(callEstablishedEvent: CallEstablishedEvent) {
        Log.d(TAG, "Established: $callEstablishedEvent")

        val activeCall = InfobipRTC.getActiveCall()
        val hasVideo = activeCall.hasLocalVideo() || activeCall.hasRemoteVideo()
        if (hasVideo) {
            localVideoTrack = callEstablishedEvent.localRTCVideoTrack
            remoteVideoTrack = callEstablishedEvent.remoteRTCVideoTrack
            setVideoTracks()
        }

        runOnUiThread {
            setApplicationState(R.string.in_a_call_label)
            handleActiveCallLayout(hasVideo)
        }
    }

    private fun handleRinging(callRingingEvent: CallRingingEvent) {
        Log.d(TAG, "Ringing: $callRingingEvent")
        runOnUiThread {
            setApplicationState(R.string.ringing_label)
        }
    }

    private fun initializeVideoRenderers() {
        remoteVideoRenderer.init()
        remoteVideoRenderer.setEnableHardwareScaler(true)
        remoteVideoRenderer.setScalingType(RendererCommon.ScalingType.SCALE_ASPECT_FIT)

        localVideoRenderer.init()
        localVideoRenderer.setMirror(true)
        localVideoRenderer.setZOrderMediaOverlay(true)

        setVideoTracks()
    }

    private fun releaseVideoRenderers() {
        remoteVideoRenderer.release()
        localVideoRenderer.release()
    }

    private fun setVideoTracks() {
        localVideoTrack?.addSink(localVideoRenderer)
        remoteVideoTrack?.addSink(remoteVideoRenderer)
    }

    private fun showIncomingCall() {
        val incomingCall = InfobipRTC.getActiveCall() as IncomingCall
        incomingCall.setEventListener(callEventListener())
        val video = incomingCall.hasRemoteVideo()
        val callType = if (video) "video" else "audio"

        runOnUiThread {
            if (video) initializeVideoRenderers()
            setApplicationState("Incoming $callType call from ${incomingCall.source().identity}")
            handleIncomingCallLayout()
        }
    }

    private fun setApplicationState(label: Int) {
        findViewById<TextView>(R.id.application_state).setText(label)
    }

    private fun setApplicationState(text: String) {
        findViewById<TextView>(R.id.application_state).text = text
    }

    private fun handleActiveCallLayout(video: Boolean) {
        if (video) setVideoLayoutVisibility(true)
        setHangupButtonVisibility(true)
        setDestinationVisibility(true)
        setIncomingCallButtonsVisibility(false)
    }

    private fun handleOutgoingCallLayout() {
        setHangupButtonVisibility(true)
        setOutgoingCallButtonsVisibility(false)
        setIncomingCallButtonsVisibility(false)
    }

    private fun handleIncomingCallLayout() {
        setDestinationVisibility(false)
        setOutgoingCallButtonsVisibility(false)
        setIncomingCallButtonsVisibility(true)
    }

    private fun resetLayout() {
        setVideoLayoutVisibility(false)
        setDestinationVisibility(true)
        setHangupButtonVisibility(false)
        setOutgoingCallButtonsVisibility(true)
        setIncomingCallButtonsVisibility(false)
    }

    private fun setHangupButtonVisibility(visible: Boolean) {
        findViewById<Button>(R.id.hangup).visibility = if (visible) Button.VISIBLE else Button.GONE
    }

    private fun setOutgoingCallButtonsVisibility(visible: Boolean) {
        val visibility = if (visible) Button.VISIBLE else Button.GONE
        findViewById<Button>(R.id.call).visibility = visibility
        findViewById<Button>(R.id.video_call).visibility = visibility
        findViewById<Button>(R.id.call_phone_number).visibility = visibility
    }

    private fun setIncomingCallButtonsVisibility(visible: Boolean) {
        val visibility = if (visible) Button.VISIBLE else Button.GONE
        findViewById<Button>(R.id.accept).visibility = visibility
        findViewById<Button>(R.id.decline).visibility = visibility
    }

    private fun setDestinationVisibility(visible: Boolean) {
        findViewById<View>(R.id.destination).visibility = if (visible) Button.VISIBLE else Button.GONE
    }

    private fun setVideoLayoutVisibility(visible: Boolean) {
        findViewById<View>(R.id.video_buttons).visibility = if (visible) Button.VISIBLE else Button.GONE
        findViewById<LinearLayout>(R.id.other_content).visibility = if (visible) Button.INVISIBLE else Button.VISIBLE
        findViewById<FrameLayout>(R.id.video_content).visibility = if (visible) Button.VISIBLE else Button.INVISIBLE
    }
}