package com.infobip.rtc.showcase

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.media.projection.MediaProjectionManager
import android.os.Bundle
import android.util.Log
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.view.children
import com.google.android.material.tabs.TabLayout
import com.google.android.material.tabs.TabLayout.Tab
import com.infobip.rtc.showcase.service.AccessToken
import com.infobip.rtc.showcase.service.CALL_FINISHED
import com.infobip.rtc.showcase.service.CALL_IN_PROGRESS
import com.infobip.rtc.showcase.service.INCOMING_CALL_START
import com.infobip.rtc.showcase.service.OUTGOING_CALL_START
import com.infobip.rtc.showcase.service.Role
import com.infobip.rtc.showcase.service.TokenService
import com.infobip.rtc.showcase.service.startService
import com.infobip.webrtc.sdk.api.InfobipRTC
import com.infobip.webrtc.sdk.api.call.IncomingApplicationCall
import com.infobip.webrtc.sdk.api.event.call.CallEarlyMediaEvent
import com.infobip.webrtc.sdk.api.event.call.CallEstablishedEvent
import com.infobip.webrtc.sdk.api.event.call.CallHangupEvent
import com.infobip.webrtc.sdk.api.event.call.CallRecordingStartedEvent
import com.infobip.webrtc.sdk.api.event.call.CallRecordingStoppedEvent
import com.infobip.webrtc.sdk.api.event.call.CallRingingEvent
import com.infobip.webrtc.sdk.api.event.call.CameraVideoAddedEvent
import com.infobip.webrtc.sdk.api.event.call.CameraVideoUpdatedEvent
import com.infobip.webrtc.sdk.api.event.call.ConferenceJoinedEvent
import com.infobip.webrtc.sdk.api.event.call.ConferenceLeftEvent
import com.infobip.webrtc.sdk.api.event.call.ConferenceRecordingStartedEvent
import com.infobip.webrtc.sdk.api.event.call.ConferenceRecordingStoppedEvent
import com.infobip.webrtc.sdk.api.event.call.DialogJoinedEvent
import com.infobip.webrtc.sdk.api.event.call.DialogLeftEvent
import com.infobip.webrtc.sdk.api.event.call.DialogRecordingStartedEvent
import com.infobip.webrtc.sdk.api.event.call.DialogRecordingStoppedEvent
import com.infobip.webrtc.sdk.api.event.call.ErrorEvent
import com.infobip.webrtc.sdk.api.event.call.ParticipantCameraVideoAddedEvent
import com.infobip.webrtc.sdk.api.event.call.ParticipantCameraVideoRemovedEvent
import com.infobip.webrtc.sdk.api.event.call.ParticipantDeafEvent
import com.infobip.webrtc.sdk.api.event.call.ParticipantDisconnectedEvent
import com.infobip.webrtc.sdk.api.event.call.ParticipantJoinedEvent
import com.infobip.webrtc.sdk.api.event.call.ParticipantJoiningEvent
import com.infobip.webrtc.sdk.api.event.call.ParticipantLeftEvent
import com.infobip.webrtc.sdk.api.event.call.ParticipantMutedEvent
import com.infobip.webrtc.sdk.api.event.call.ParticipantReconnectedEvent
import com.infobip.webrtc.sdk.api.event.call.ParticipantScreenShareAddedEvent
import com.infobip.webrtc.sdk.api.event.call.ParticipantScreenShareRemovedEvent
import com.infobip.webrtc.sdk.api.event.call.ParticipantStartedTalkingEvent
import com.infobip.webrtc.sdk.api.event.call.ParticipantStoppedTalkingEvent
import com.infobip.webrtc.sdk.api.event.call.ParticipantUndeafEvent
import com.infobip.webrtc.sdk.api.event.call.ParticipantUnmutedEvent
import com.infobip.webrtc.sdk.api.event.call.ReconnectedEvent
import com.infobip.webrtc.sdk.api.event.call.ReconnectingEvent
import com.infobip.webrtc.sdk.api.event.call.ScreenShareAddedEvent
import com.infobip.webrtc.sdk.api.event.call.ScreenShareRemovedEvent
import com.infobip.webrtc.sdk.api.event.listener.ApplicationCallEventListener
import com.infobip.webrtc.sdk.api.event.listener.NetworkQualityEventListener
import com.infobip.webrtc.sdk.api.event.listener.ParticipantNetworkQualityEventListener
import com.infobip.webrtc.sdk.api.event.network.NetworkQualityChangedEvent
import com.infobip.webrtc.sdk.api.event.network.ParticipantNetworkQualityChangedEvent
import com.infobip.webrtc.sdk.api.model.CallStatus
import com.infobip.webrtc.sdk.api.model.participant.Participant
import com.infobip.webrtc.sdk.api.model.participant.ParticipantState
import com.infobip.webrtc.sdk.api.model.video.RTCVideoTrack
import com.infobip.webrtc.sdk.api.model.video.ScreenCapturer
import com.infobip.webrtc.sdk.api.model.video.VideoRenderer
import com.infobip.webrtc.sdk.api.options.ApplicationCallOptions
import com.infobip.webrtc.sdk.api.options.AudioOptions.AudioQualityMode
import com.infobip.webrtc.sdk.api.options.VideoOptions
import com.infobip.webrtc.sdk.api.request.CallApplicationRequest
import org.webrtc.RendererCommon
import java.util.concurrent.Executors

private const val TAG = "INFOBIP_RTC"
private const val CAPTURE_PERMISSION_REQUEST_CODE = 1
private const val LOCAL_CAMERA_VIDEO_TAG = "local-camera"
private const val LOCAL_SCREEN_SHARE_TAG = "local-screen-share"

class MainActivity : Activity(), ApplicationCallEventListener, NetworkQualityEventListener,
    ParticipantNetworkQualityEventListener {
    companion object {
        private val backgroundThreadExecutor = Executors.newSingleThreadExecutor()
    }

    private val localVideos: MutableMap<String, RTCVideoTrack> = mutableMapOf()
    private val remoteVideos: MutableMap<String, RTCVideoTrack> = mutableMapOf()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.main_activity)

        ensurePermissions()
        setButtonClickListeners()
        setActiveTabLayout()
    }

    override fun onResume() {
        super.onResume()
        val action = intent.action
        if (INCOMING_CALL_START == action && InfobipRTC.getInstance().activeApplicationCall != null) {
            showIncomingCall()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        releaseVideoRenderers()
        removeVideoViews()
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)

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
            InfobipRTC.getInstance().activeApplicationCall?.startScreenShare(screenCapturer)
        }
    }

    private fun ensurePermissions() {
        if (!permissionGranted(Manifest.permission.RECORD_AUDIO) || !permissionGranted(Manifest.permission.CAMERA)) {
            ActivityCompat.requestPermissions(
                this, arrayOf(Manifest.permission.RECORD_AUDIO, Manifest.permission.CAMERA), 200
            )
        }
    }

    private fun permissionGranted(permission: String): Boolean {
        return ContextCompat.checkSelfPermission(
            this,
            permission
        ) == PackageManager.PERMISSION_GRANTED
    }

    private fun setButtonClickListeners() {
        findViewById<TabLayout>(R.id.tabs).addOnTabSelectedListener(getTabListener())

        findViewById<Button>(R.id.video_call_with_agent_button).setOnClickListener {
            videoCallWithAgentButtonOnClick()
        }

        findViewById<Button>(R.id.phone_call_button).setOnClickListener {
            phoneCallButtonOnClick()
        }

        findViewById<Button>(R.id.accept_button).setOnClickListener {
            acceptButtonOnClick()
        }

        findViewById<Button>(R.id.decline_button).setOnClickListener {
            declineButtonOnClick()
        }

        findViewById<Button>(R.id.toggle_audio_button).setOnClickListener {
            toggleAudioButtonOnClick()
        }

        findViewById<Button>(R.id.select_audio_quality_button).setOnClickListener {
            showAudioQualityModeDialog()
        }

        findViewById<Button>(R.id.select_audio_device_button).setOnClickListener {
            showAudioDeviceDialog()
        }

        findViewById<Button>(R.id.toggle_camera_button).setOnClickListener {
            toggleCameraButtonOnClick()
        }

        findViewById<Button>(R.id.toggle_screen_share_button).setOnClickListener {
            toggleScreenShareButtonOnClick()
        }

        findViewById<Button>(R.id.flip_camera_button).setOnClickListener {
            flipCameraButtonOnClick()
        }

        findViewById<Button>(R.id.hangup_button).setOnClickListener {
            hangupButtonOnClick()
        }
    }

    private fun getTabListener(): TabLayout.OnTabSelectedListener {
        return object : TabLayout.OnTabSelectedListener {
            override fun onTabSelected(tab: Tab) {
                logIn(tab)
            }

            override fun onTabUnselected(tab: Tab?) {
            }

            override fun onTabReselected(tab: Tab) {
                logIn(tab)
            }
        }
    }

    private fun logIn(tab: Tab) {
        backgroundThreadExecutor.submit {
            try {
                if (tab.position == 0) logInAsCustomer() else logInAsAgent()
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

    private fun logInAsCustomer() {
        val accessToken = TokenService.getCustomerAccessToken()
        runOnUiThread {
            setLoginStatus(getString(R.string.logged_in_as, accessToken.identity))
            findViewById<LinearLayout>(R.id.customer_layout).visibility = View.VISIBLE
        }
    }

    private fun logInAsAgent() {
        val accessToken = TokenService.getAgentAccessToken()
        runOnUiThread {
            setLoginStatus(getString(R.string.logged_in_as, accessToken.identity))
            findViewById<LinearLayout>(R.id.customer_layout).visibility = View.GONE
        }
        enablePushNotifications(accessToken)
    }

    private fun enablePushNotifications(accessToken: AccessToken) {
        InfobipRTC.getInstance().enablePushNotification(
            accessToken.token,
            applicationContext,
            PUSH_CONFIG_ID
        )
    }

    private fun videoCallWithAgentButtonOnClick() {
        call(true, "conference")
    }

    private fun phoneCallButtonOnClick() {
        call(false, "dialog")
    }

    private fun call(video: Boolean, scenario: String) {
        backgroundThreadExecutor.submit {
            try {
                callApplication(video, scenario)

                startService(this@MainActivity, OUTGOING_CALL_START)
                intent.action = null

                runOnUiThread {
                    setCallStatus(R.string.calling)
                    showOutgoingCallLayout()
                }
            } catch (t: Throwable) {
                Log.e(TAG, "Error calling", t)
                runOnUiThread {
                    Toast.makeText(
                        applicationContext,
                        "Error calling: ${t.message}", Toast.LENGTH_LONG
                    ).show()
                }
            }
        }
    }

    private fun callApplication(video: Boolean, scenario: String) {
        val applicationCallRequest = CallApplicationRequest(
            TokenService.getCustomerAccessToken().token,
            applicationContext,
            CALLS_CONFIGURATION_ID,
            this
        )
        val applicationCallOptions = ApplicationCallOptions.builder()
            .video(video)
            .customData(mapOf("scenario" to scenario))
            .autoReconnect(true)
            .build()
        val call =
            InfobipRTC.getInstance().callApplication(applicationCallRequest, applicationCallOptions)
        Log.d(TAG, "Outgoing call with call id ${call.id()}")
    }

    private fun showIncomingCall() {
        val incomingApplicationCall = InfobipRTC.getInstance().activeApplicationCall
        if (incomingApplicationCall?.status() == CallStatus.RINGING) {
            incomingApplicationCall.eventListener = this

            runOnUiThread {
                setLoginStatus(
                    getString(
                        R.string.logged_in_as,
                        TokenService.getAgentAccessToken().identity
                    )
                )
                showIncomingCallLayout()
            }
        }
    }

    private fun showOutgoingCallLayout() {
        findViewById<TabLayout>(R.id.tabs).visibility = View.GONE
        findViewById<LinearLayout>(R.id.incoming_call_agent_layout).visibility = View.GONE
        findViewById<LinearLayout>(R.id.customer_layout).visibility = View.GONE
        findViewById<LinearLayout>(R.id.in_call_layout).visibility = View.VISIBLE
        findViewById<Button>(R.id.hangup_button).visibility = View.VISIBLE
    }

    private fun showIncomingCallLayout() {
        findViewById<TabLayout>(R.id.tabs).visibility = View.GONE
        findViewById<LinearLayout>(R.id.customer_layout).visibility = View.GONE
        findViewById<LinearLayout>(R.id.incoming_call_agent_layout).visibility = View.VISIBLE
        findViewById<Button>(R.id.hangup_button).visibility = View.GONE
    }

    private fun acceptButtonOnClick() {
        val applicationCall = InfobipRTC.getInstance().activeApplicationCall
        if (applicationCall != null) {
            (applicationCall as IncomingApplicationCall).accept(
                ApplicationCallOptions.builder().video(true).autoReconnect(true).build()
            )
        } else {
            runOnUiThread {
                Toast.makeText(applicationContext, "No active call", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun declineButtonOnClick() {
        val applicationCall = InfobipRTC.getInstance().activeApplicationCall
        if (applicationCall != null) {
            (applicationCall as IncomingApplicationCall).decline()
        } else {
            runOnUiThread {
                Toast.makeText(applicationContext, "No active call", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun toggleAudioButtonOnClick() {
        val applicationCall = InfobipRTC.getInstance().activeApplicationCall
        if (applicationCall != null) {
            val muted = !applicationCall.muted()
            applicationCall.mute(muted)

            runOnUiThread {
                findViewById<Button>(R.id.toggle_audio_button).setText(if (muted) R.string.unmute else R.string.mute)
            }
        }
    }

    private fun showAudioQualityModeDialog() {
        val applicationCall = InfobipRTC.getInstance().activeApplicationCall
        val audioQualityMode = applicationCall?.audioQualityMode()
        val audioQualityModes = AudioQualityMode.values().map { it.name }.toTypedArray()
        var checkedItem = AudioQualityMode.values().indexOfFirst { it == audioQualityMode }

        AlertDialog.Builder(this)
            .setTitle("Select preferred audio quality mode")
            .setSingleChoiceItems(audioQualityModes, checkedItem) { _, which ->
                checkedItem = which
            }
            .setPositiveButton("Ok") { _, _ ->
                applicationCall?.audioQualityMode(AudioQualityMode.values()[checkedItem])
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showAudioDeviceDialog() {
        val applicationCall = InfobipRTC.getInstance().activeApplicationCall
        val activeDevice = applicationCall?.audioDeviceManager()?.activeDevice
        val availableAudioDevices = applicationCall?.audioDeviceManager()?.availableAudioDevices
        val audioDevices = availableAudioDevices?.map { it.name }?.toTypedArray()
        var checkedItem = availableAudioDevices?.indexOfFirst { it == activeDevice }

        if (checkedItem != null) {
            AlertDialog.Builder(this)
                .setTitle("Select preferred audio device")
                .setSingleChoiceItems(audioDevices, checkedItem) { _, which ->
                    checkedItem = which
                }
                .setPositiveButton("Ok") { _, _ ->
                    val audioDevice = availableAudioDevices?.elementAt(checkedItem!!)!!
                    applicationCall.audioDeviceManager()!!.selectAudioDevice(audioDevice)
                }
                .setNegativeButton("Cancel", null)
                .show()
        }
    }

    private fun toggleCameraButtonOnClick() {
        val applicationCall = InfobipRTC.getInstance().activeApplicationCall
        if (applicationCall != null) {
            val hasCameraVideo = !applicationCall.hasCameraVideo()
            try {
                applicationCall.cameraVideo(hasCameraVideo)
            } catch (e: Exception) {
                Log.d(TAG, "${e.message}")
            }

            runOnUiThread {
                findViewById<Button>(R.id.flip_camera_button).visibility =
                    if (hasCameraVideo) View.VISIBLE else View.GONE
            }
        }
    }

    private fun toggleScreenShareButtonOnClick() {
        val applicationCall = InfobipRTC.getInstance().activeApplicationCall
        if (applicationCall != null) {
            val hasScreenShare = applicationCall.hasScreenShare()
            if (!hasScreenShare) {
                startScreenShare()
            } else {
                applicationCall.stopScreenShare()
            }
        }
    }

    private fun flipCameraButtonOnClick() {
        val applicationCall = InfobipRTC.getInstance().activeApplicationCall
        if (applicationCall != null) {
            val front = applicationCall.cameraOrientation() == VideoOptions.CameraOrientation.FRONT
            val newCameraOrientation =
                if (front) VideoOptions.CameraOrientation.BACK else VideoOptions.CameraOrientation.FRONT
            applicationCall.cameraOrientation(newCameraOrientation)
        }
    }

    private fun hangupButtonOnClick() {
        val applicationCall = InfobipRTC.getInstance().activeApplicationCall
        if (applicationCall != null) {
            applicationCall.hangup()
        } else {
            runOnUiThread {
                Toast.makeText(applicationContext, "No active call", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun setLoginStatus(text: String) {
        val loginStatus = findViewById<TextView>(R.id.login_status)
        loginStatus.visibility = View.VISIBLE
        loginStatus.text = text
    }

    private fun startScreenShare() {
        val mediaProjectionManager =
            application.getSystemService(MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        startActivityForResult(
            mediaProjectionManager.createScreenCaptureIntent(), CAPTURE_PERMISSION_REQUEST_CODE
        )
    }

    private fun resetLayout() {
        hideActiveCallLayout()
        setActiveTabLayout()
    }

    private fun showActiveCallLayout() {
        showOutgoingCallLayout()
        findViewById<Button>(R.id.toggle_audio_button).setText(R.string.mute)
        findViewById<LinearLayout>(R.id.audio_buttons).visibility = View.VISIBLE
        val applicationCall = InfobipRTC.getInstance().activeApplicationCall
        if (applicationCall?.customData()?.get("scenario") == "conference" || TokenService.getRole() == Role.AGENT) {
            findViewById<LinearLayout>(R.id.video_buttons).visibility = View.VISIBLE
            findViewById<Button>(R.id.flip_camera_button).visibility = View.VISIBLE
        } else {
            findViewById<LinearLayout>(R.id.video_buttons).visibility = View.GONE
            findViewById<Button>(R.id.flip_camera_button).visibility = View.GONE
        }
    }

    private fun hideActiveCallLayout() {
        findViewById<LinearLayout>(R.id.incoming_call_agent_layout).visibility = View.GONE
        findViewById<LinearLayout>(R.id.in_call_layout).visibility = View.GONE
        findViewById<LinearLayout>(R.id.participants_layout).visibility = View.GONE
        findViewById<LinearLayout>(R.id.remote_videos_layout).visibility = View.GONE
        findViewById<LinearLayout>(R.id.local_videos_layout).visibility = View.GONE
        findViewById<LinearLayout>(R.id.video_buttons).visibility = View.GONE
        findViewById<Button>(R.id.hangup_button).visibility = View.GONE
    }

    private fun setActiveTabLayout() {
        val tabs = findViewById<TabLayout>(R.id.tabs)
        tabs.visibility = View.VISIBLE
        val role = TokenService.getRole()
        if (role == Role.CUSTOMER || role == null) {
            tabs.selectTab(tabs.getTabAt(0))
        } else {
            tabs.selectTab(tabs.getTabAt(1))
        }
    }

    private fun updateLayoutAfterLeavingConferenceOrDialog(message: String) {
        Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
        setCallStatus(R.string.in_call)
        hideParticipantsLayout()
        releaseRemoteVideoRenderers()
        removeRemoteVideoViews()
    }

    private fun setCallStatus(label: Int) {
        findViewById<TextView>(R.id.call_status).setText(label)
    }

    private fun setCallStatus(text: String) {
        findViewById<TextView>(R.id.call_status).text = text
    }

    private fun initParticipantsLayout() {
        findViewById<LinearLayout>(R.id.participants_layout).visibility = View.VISIBLE
        setNumberOfParticipants()
        InfobipRTC.getInstance().activeApplicationCall?.participants()?.forEach { participant : Participant ->
            if (participant.state.equals(ParticipantState.JOINED)) {
                val participantToAdd = createParticipant(participant.endpoint.identifier())
                findViewById<LinearLayout>(R.id.participants).addView(participantToAdd)
            }
        }
    }

    private fun hideParticipantsLayout() {
        findViewById<LinearLayout>(R.id.participants_layout).visibility = View.GONE
        findViewById<LinearLayout>(R.id.participants).removeAllViews()
    }

    private fun createParticipant(identifier: String): TextView {
        val textView = TextView(this)
        val params = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        )
        params.gravity = Gravity.CENTER
        textView.layoutParams = params
        textView.tag = identifier
        textView.text = identifier

        return textView
    }

    private fun addParticipant(identifier: String) {
        setNumberOfParticipants()
        val participantToAdd = createParticipant(identifier)
        findViewById<LinearLayout>(R.id.participants).addView(participantToAdd)
    }

    private fun removeParticipant(identifier: String) {
        setNumberOfParticipants()
        val participants = findViewById<LinearLayout>(R.id.participants)
        val participantToRemove = participants.findViewWithTag<TextView>(identifier)
        participants.removeView(participantToRemove)
    }

    private fun setNumberOfParticipants() {
        val numberOfParticipants = findViewById<TextView>(R.id.participants_label)
        numberOfParticipants.text =
            getString(
                R.string.participants_title,
                InfobipRTC.getInstance().activeApplicationCall?.participants()?.size
            )
    }

    private fun createVideoLayout(tag: String, track: RTCVideoTrack, parent: LinearLayout) {
        val inflater = LayoutInflater.from(this)
        val videoLayout = inflater.inflate(R.layout.video_layout, parent, false)

        val videoRenderer = videoLayout.findViewById<VideoRenderer>(R.id.video_renderer)
        videoRenderer.tag = tag
        initVideoRenderer(videoRenderer)
        track.addSink(videoRenderer)

        val videoLabel = videoLayout.findViewById<TextView>(R.id.video_label)
        videoLabel.text = tag

        parent.addView(videoLayout)
    }

    private fun initVideoRenderer(videoRenderer: VideoRenderer) {
        videoRenderer.init()
        videoRenderer.setMirror(true)
        videoRenderer.setZOrderMediaOverlay(true)
        videoRenderer.setScalingType(RendererCommon.ScalingType.SCALE_ASPECT_FILL)
    }

    private fun releaseVideoRenderers() {
        releaseLocalVideoRenderers()
        releaseRemoteVideoRenderers()
    }

    private fun releaseLocalVideoRenderers() {
        val localVideosLayout = findViewById<LinearLayout>(R.id.local_videos)
        localVideosLayout.children.forEach { view ->
            (view as LinearLayout).findViewById<VideoRenderer>(R.id.video_renderer).release()
        }
    }

    private fun releaseRemoteVideoRenderers() {
        val remoteVideosLayout = findViewById<LinearLayout>(R.id.remote_videos)
        remoteVideosLayout.children.forEach { view ->
            (view as LinearLayout).findViewById<VideoRenderer>(R.id.video_renderer).release()
        }
    }

    private fun removeVideoViews() {
        removeLocalVideoViews()
        removeRemoteVideoViews()
    }

    private fun removeLocalVideoViews() {
        val localVideosLayout = findViewById<LinearLayout>(R.id.local_videos)
        findViewById<LinearLayout>(R.id.local_videos_layout).visibility = View.GONE
        localVideosLayout.removeAllViews()
        localVideos.clear()
    }

    private fun removeRemoteVideoViews() {
        val remoteVideosLayout = findViewById<LinearLayout>(R.id.remote_videos)
        findViewById<LinearLayout>(R.id.remote_videos_layout).visibility = View.GONE
        remoteVideosLayout.removeAllViews()
        remoteVideos.clear()
    }

    private fun addLocalVideo(tag: String, track: RTCVideoTrack) {
        findViewById<LinearLayout>(R.id.local_videos_layout).visibility = View.VISIBLE
        val localVideos = findViewById<LinearLayout>(R.id.local_videos)
        createVideoLayout(tag, track, localVideos)
    }

    private fun updateLocalVideo(tag: String, track: RTCVideoTrack) {
        val localVideos = findViewById<LinearLayout>(R.id.local_videos)
        val videoToUpdate = localVideos.findViewWithTag<VideoRenderer>(tag)
        if (videoToUpdate != null) {
            track.addSink(videoToUpdate)
        }
    }

    private fun removeLocalVideo(tag: String, track: RTCVideoTrack?) {
        val localVideos = findViewById<LinearLayout>(R.id.local_videos)
        val videoToRemove = localVideos.findViewWithTag<VideoRenderer>(tag)
        if (videoToRemove != null) {
            track?.removeSink(videoToRemove)
            videoToRemove.release()
            localVideos.removeView(videoToRemove.parent as View)
        }
        if (localVideos.childCount == 0) {
            findViewById<LinearLayout>(R.id.local_videos_layout).visibility = View.GONE
        }
    }

    private fun addRemoteVideo(tag: String, track: RTCVideoTrack) {
        findViewById<LinearLayout>(R.id.remote_videos_layout).visibility = View.VISIBLE
        val remoteVideos = findViewById<LinearLayout>(R.id.remote_videos)
        createVideoLayout(tag, track, remoteVideos)
    }

    private fun removeRemoteVideo(tag: String, track: RTCVideoTrack?) {
        val remoteVideos = findViewById<LinearLayout>(R.id.remote_videos)
        val videoToRemove = remoteVideos.findViewWithTag<VideoRenderer>(tag)
        if (videoToRemove != null) {
            track?.removeSink(videoToRemove)
            videoToRemove.release()
            remoteVideos.removeView(videoToRemove.parent as View)
        }
        if (remoteVideos.childCount == 0) {
            findViewById<LinearLayout>(R.id.remote_videos_layout).visibility = View.GONE
        }
    }

    override fun onRinging(callRingingEvent: CallRingingEvent?) {
        val message = "Ringing..."
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            setCallStatus(R.string.ringing)
        }
    }

    override fun onEarlyMedia(callEarlyMediaEvent: CallEarlyMediaEvent?) {
        val message = "Early media received. Ringing..."
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
        }
    }

    override fun onEstablished(callEstablishedEvent: CallEstablishedEvent?) {
        val message = "Call established"
        Log.d(TAG, message)

        startService(this@MainActivity, CALL_IN_PROGRESS)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            setCallStatus(R.string.in_call)
            showActiveCallLayout()
        }
    }

    override fun onHangup(callHangupEvent: CallHangupEvent?) {
        val message = "Hangup: ${callHangupEvent?.errorCode?.description}"
        Log.d(TAG, message)

        startService(this@MainActivity, CALL_FINISHED)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            hideParticipantsLayout()
            releaseVideoRenderers()
            removeVideoViews()
            setCallStatus(getString(R.string.hangup_message, callHangupEvent?.errorCode?.name))
            resetLayout()
        }
    }

    override fun onError(errorEvent: ErrorEvent?) {
        val message = "Error: ${errorEvent?.errorCode}"
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            setCallStatus(getString(R.string.error_message, errorEvent?.errorCode?.name))
        }
    }

    override fun onCameraVideoAdded(cameraVideoAddedEvent: CameraVideoAddedEvent?) {
        val message = "Camera video added"
        Log.d(TAG, message)

        val track = cameraVideoAddedEvent?.track!!
        localVideos[LOCAL_CAMERA_VIDEO_TAG] = track

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            addLocalVideo(LOCAL_CAMERA_VIDEO_TAG, track)
        }
    }

    override fun onCameraVideoUpdated(cameraVideoUpdatedEvent: CameraVideoUpdatedEvent?) {
        val message = "Camera video updated"
        Log.d(TAG, message)

        val track = cameraVideoUpdatedEvent?.track!!
        localVideos[LOCAL_CAMERA_VIDEO_TAG] = track

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            updateLocalVideo(LOCAL_CAMERA_VIDEO_TAG, track)
        }
    }

    override fun onCameraVideoRemoved() {
        val message = "Camera video removed"
        Log.d(TAG, message)

        val track = localVideos[LOCAL_CAMERA_VIDEO_TAG]
        localVideos.remove(LOCAL_CAMERA_VIDEO_TAG)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            removeLocalVideo(LOCAL_CAMERA_VIDEO_TAG, track)
        }
    }

    override fun onScreenShareAdded(screenShareAddedEvent: ScreenShareAddedEvent?) {
        val message = "Screen share added"
        Log.d(TAG, message)

        val track = screenShareAddedEvent?.track!!
        localVideos[LOCAL_SCREEN_SHARE_TAG] = track

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            addLocalVideo(LOCAL_SCREEN_SHARE_TAG, track)
        }
    }

    override fun onScreenShareRemoved(screenShareRemovedEvent: ScreenShareRemovedEvent?) {
        val message = "Screen share removed. Reason: ${screenShareRemovedEvent?.reason.toString()}"
        Log.d(TAG, message)

        val track = localVideos[LOCAL_SCREEN_SHARE_TAG]
        localVideos.remove(LOCAL_SCREEN_SHARE_TAG)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            removeLocalVideo(LOCAL_SCREEN_SHARE_TAG, track)
        }
    }

    override fun onConferenceJoined(conferenceJoinedEvent: ConferenceJoinedEvent?) {
        val message = "Joined conference ${conferenceJoinedEvent?.id}"
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            setCallStatus(getString(R.string.in_conference, conferenceJoinedEvent?.id))
            initParticipantsLayout()
        }
    }

    override fun onConferenceLeft(conferenceLeftEvent: ConferenceLeftEvent?) {
        val message = "Left conference: ${conferenceLeftEvent?.errorCode?.name}"
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            updateLayoutAfterLeavingConferenceOrDialog(message)
        }
    }

    override fun onParticipantJoining(participantJoiningEvent: ParticipantJoiningEvent?) {
        val message =
            "Participant ${participantJoiningEvent?.participant?.endpoint?.identifier()} joining conference"
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
        }
    }

    override fun onParticipantJoined(participantJoinedEvent: ParticipantJoinedEvent?) {
        val identifier = participantJoinedEvent?.participant?.endpoint?.identifier()!!
        val message = "Participant $identifier joined conference"
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            addParticipant(identifier)
        }
    }

    override fun onParticipantLeft(participantLeftEvent: ParticipantLeftEvent?) {
        val identifier = participantLeftEvent?.participant?.endpoint?.identifier()!!
        val message = "Participant $identifier left conference"
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            removeParticipant(identifier)
        }
    }

    override fun onParticipantCameraVideoAdded(participantCameraVideoAddedEvent: ParticipantCameraVideoAddedEvent?) {
        val identifier = participantCameraVideoAddedEvent?.participant?.endpoint?.identifier()
        val message = "Participant $identifier added camera video"
        Log.d(TAG, message)

        val track = participantCameraVideoAddedEvent?.track!!
        val tag = "$identifier-camera"
        remoteVideos[tag] = track

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            addRemoteVideo(tag, track)
        }
    }

    override fun onParticipantCameraVideoRemoved(participantCameraVideoRemovedEvent: ParticipantCameraVideoRemovedEvent?) {
        val identifier = participantCameraVideoRemovedEvent?.participant?.endpoint?.identifier()
        val message = "Participant $identifier removed camera video"
        Log.d(TAG, message)

        val tag = "$identifier-camera"
        val track = remoteVideos[tag]
        remoteVideos.remove(tag)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            removeRemoteVideo(tag, track)
        }
    }

    override fun onParticipantScreenShareAdded(participantScreenShareAddedEvent: ParticipantScreenShareAddedEvent?) {
        val identifier = participantScreenShareAddedEvent?.participant?.endpoint?.identifier()
        val message = "Participant $identifier added screen share"
        Log.d(TAG, message)

        val track = participantScreenShareAddedEvent?.track!!
        val tag = "$identifier-screen-share"
        remoteVideos[tag] = track

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            addRemoteVideo(tag, track)
        }
    }

    override fun onParticipantScreenShareRemoved(participantScreenShareRemovedEvent: ParticipantScreenShareRemovedEvent?) {
        val identifier = participantScreenShareRemovedEvent?.participant?.endpoint?.identifier()
        val message = "Participant $identifier removed screen share"
        Log.d(TAG, message)

        val tag = "$identifier-screen-share"
        val track = remoteVideos[tag]
        remoteVideos.remove(tag)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            removeRemoteVideo(tag, track)
        }
    }

    override fun onParticipantMuted(participantMutedEvent: ParticipantMutedEvent?) {
        val message =
            "Participant ${participantMutedEvent?.participant?.endpoint?.identifier()} muted"
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
        }
    }

    override fun onParticipantUnmuted(participantUnmutedEvent: ParticipantUnmutedEvent?) {
        val message =
            "Participant ${participantUnmutedEvent?.participant?.endpoint?.identifier()} unmuted"
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
        }
    }

    override fun onParticipantDeaf(participantDeafEvent: ParticipantDeafEvent?) {
        val message =
            "Participant ${participantDeafEvent?.participant?.endpoint?.identifier()} deafened"
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
        }
    }

    override fun onParticipantUndeaf(participantUndeafEvent: ParticipantUndeafEvent?) {
        val message =
            "Participant ${participantUndeafEvent?.participant?.endpoint?.identifier()} undeafened"
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
        }
    }

    override fun onParticipantStartedTalking(participantStartedTalkingEvent: ParticipantStartedTalkingEvent?) {
        val message =
            "Participant ${participantStartedTalkingEvent?.participant?.endpoint?.identifier()} started talking"
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
        }
    }

    override fun onParticipantStoppedTalking(participantStoppedTalkingEvent: ParticipantStoppedTalkingEvent?) {
        val message =
            "Participant ${participantStoppedTalkingEvent?.participant?.endpoint?.identifier()} stopped talking"
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
        }
    }

    override fun onDialogJoined(dialogJoinedEvent: DialogJoinedEvent?) {
        val identifier = dialogJoinedEvent?.remote?.endpoint?.identifier()
        val message = "Joined dialog with $identifier"
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            setCallStatus(getString(R.string.in_dialog, identifier))
            initParticipantsLayout()
        }
    }

    override fun onDialogLeft(dialogLeftEvent: DialogLeftEvent?) {
        val message = "Left dialog: ${dialogLeftEvent?.errorCode?.name}"
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            updateLayoutAfterLeavingConferenceOrDialog(message)
        }
    }

    override fun onReconnecting(reconnectingEvent: ReconnectingEvent?) {
        val message = "Call reconnecting..."
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
        }
    }

    override fun onReconnected(reconnectedEvent: ReconnectedEvent?) {
        val message = "Call reconnected"
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
        }
    }

    override fun onParticipantDisconnected(participantDisconnectedEvent: ParticipantDisconnectedEvent?) {
        val participant = participantDisconnectedEvent?.participant?.endpoint?.identifier()
        val message = "Participant $participant disconnected"
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
        }
    }

    override fun onParticipantReconnected(participantReconnectedEvent: ParticipantReconnectedEvent?) {
        val participant = participantReconnectedEvent?.participant?.endpoint?.identifier()
        val message = "Participant $participant reconnected"
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
        }
    }

    override fun onCallRecordingStarted(callRecordingStarted: CallRecordingStartedEvent?) {
        val recordingType = callRecordingStarted?.recordingType?.name
        val message = "Call recording started with type: $recordingType"
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
        }
    }

    override fun onCallRecordingStopped(callRecordingStoppedEvent: CallRecordingStoppedEvent?) {
        val message = "Call recording stopped"
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
        }
    }

    override fun onDialogRecordingStarted(dialogRecordingStartedEvent: DialogRecordingStartedEvent?) {
        val recordingType = dialogRecordingStartedEvent?.recordingType?.name
        val message = "Dialog recording started with type: $recordingType"
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
        }
    }

    override fun onDialogRecordingStopped(dialogRecordingStoppedEvent: DialogRecordingStoppedEvent?) {
        val message = "Dialog recording stopped"
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
        }
    }

    override fun onConferenceRecordingStarted(conferenceRecordingStartedEvent: ConferenceRecordingStartedEvent?) {
        val recordingType = conferenceRecordingStartedEvent?.recordingType?.name
        val message = "Conference recording started with type: $recordingType"
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
        }
    }

    override fun onConferenceRecordingStopped(conferenceRecordingStoppedEvent: ConferenceRecordingStoppedEvent?) {
        val message = "Conference recording stopped"
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
        }
    }

    override fun onNetworkQualityChanged(networkQualityChangedEvent: NetworkQualityChangedEvent?) {
        val networkQuality = networkQualityChangedEvent?.networkQuality
        val message =
            "Local network quality changed to ${networkQuality?.name} (${networkQuality?.score})"
        Log.d(TAG, message)
    }

    override fun onParticipantNetworkQualityChanged(participantNetworkQualityChangedEvent: ParticipantNetworkQualityChangedEvent?) {
        val networkQuality = participantNetworkQualityChangedEvent?.networkQuality
        val participant = participantNetworkQualityChangedEvent?.participant?.endpoint?.identifier()
        val message =
            "Participant $participant network quality changed to ${networkQuality?.name} (${networkQuality?.score})"
        Log.d(TAG, message)
    }
}