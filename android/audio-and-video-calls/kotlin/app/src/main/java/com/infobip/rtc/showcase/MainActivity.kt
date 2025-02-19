package com.infobip.rtc.showcase

import android.Manifest.permission
import android.content.Intent
import android.content.pm.PackageManager
import android.media.projection.MediaProjectionManager
import android.os.Bundle
import android.util.Log
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.LinearLayout.LayoutParams
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.SwitchCompat
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.view.children
import com.google.android.material.tabs.TabLayout
import com.google.android.material.tabs.TabLayout.OnTabSelectedListener
import com.infobip.rtc.showcase.service.CALL_FINISHED
import com.infobip.rtc.showcase.service.CALL_IN_PROGRESS
import com.infobip.rtc.showcase.service.INCOMING_CALL_START
import com.infobip.rtc.showcase.service.OUTGOING_CALL_START
import com.infobip.rtc.showcase.service.TokenService
import com.infobip.rtc.showcase.service.startService
import com.infobip.webrtc.sdk.api.InfobipRTC
import com.infobip.webrtc.sdk.api.call.IncomingWebrtcCall
import com.infobip.webrtc.sdk.api.call.WebrtcCall
import com.infobip.webrtc.sdk.api.event.call.CallEarlyMediaEvent
import com.infobip.webrtc.sdk.api.event.call.CallEstablishedEvent
import com.infobip.webrtc.sdk.api.event.call.CallHangupEvent
import com.infobip.webrtc.sdk.api.event.call.CallRecordingStartedEvent
import com.infobip.webrtc.sdk.api.event.call.CallRingingEvent
import com.infobip.webrtc.sdk.api.event.call.CameraVideoAddedEvent
import com.infobip.webrtc.sdk.api.event.call.CameraVideoUpdatedEvent
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
import com.infobip.webrtc.sdk.api.event.call.RemoteDisconnectedEvent
import com.infobip.webrtc.sdk.api.event.call.RemoteReconnectedEvent
import com.infobip.webrtc.sdk.api.event.call.RoomJoinedEvent
import com.infobip.webrtc.sdk.api.event.call.RoomLeftEvent
import com.infobip.webrtc.sdk.api.event.call.RoomRecordingStartedEvent
import com.infobip.webrtc.sdk.api.event.call.ScreenShareAddedEvent
import com.infobip.webrtc.sdk.api.event.call.ScreenShareRemovedEvent
import com.infobip.webrtc.sdk.api.event.listener.NetworkQualityEventListener
import com.infobip.webrtc.sdk.api.event.listener.ParticipantNetworkQualityEventListener
import com.infobip.webrtc.sdk.api.event.listener.PhoneCallEventListener
import com.infobip.webrtc.sdk.api.event.listener.RemoteNetworkQualityEventListener
import com.infobip.webrtc.sdk.api.event.listener.RoomCallEventListener
import com.infobip.webrtc.sdk.api.event.listener.WebrtcCallEventListener
import com.infobip.webrtc.sdk.api.event.network.NetworkQualityChangedEvent
import com.infobip.webrtc.sdk.api.event.network.ParticipantNetworkQualityChangedEvent
import com.infobip.webrtc.sdk.api.event.network.RemoteNetworkQualityChangedEvent
import com.infobip.webrtc.sdk.api.model.CallStatus
import com.infobip.webrtc.sdk.api.model.participant.Participant
import com.infobip.webrtc.sdk.api.model.participant.ParticipantState
import com.infobip.webrtc.sdk.api.model.video.RTCVideoTrack
import com.infobip.webrtc.sdk.api.model.video.ScreenCapturer
import com.infobip.webrtc.sdk.api.model.video.VideoRenderer
import com.infobip.webrtc.sdk.api.options.AudioOptions.AudioQualityMode
import com.infobip.webrtc.sdk.api.options.PhoneCallOptions
import com.infobip.webrtc.sdk.api.options.RoomCallOptions
import com.infobip.webrtc.sdk.api.options.VideoOptions.CameraOrientation
import com.infobip.webrtc.sdk.api.options.WebrtcCallOptions
import com.infobip.webrtc.sdk.api.request.CallPhoneRequest
import com.infobip.webrtc.sdk.api.request.CallWebrtcRequest
import com.infobip.webrtc.sdk.api.request.RoomRequest
import org.webrtc.RendererCommon
import java.util.concurrent.Executors


enum class Tab(val position: Int) {
    WEBRTC(0), PHONE(1), ROOM(2);
}

private const val TAG = "INFOBIP_RTC"
private const val FROM = "33712345678"
private const val CAPTURE_PERMISSION_REQUEST_CODE = 1
private const val LOCAL_CAMERA_VIDEO_TAG = "local-camera"
private const val LOCAL_SCREEN_SHARE_TAG = "local-screen-share"
private const val REMOTE_CAMERA_VIDEO_TAG = "remote-camera"
private const val REMOTE_SCREEN_SHARE_TAG = "remote-screen-share"

class MainActivity : AppCompatActivity(), PhoneCallEventListener, WebrtcCallEventListener,
    RoomCallEventListener, NetworkQualityEventListener, RemoteNetworkQualityEventListener,
    ParticipantNetworkQualityEventListener {
    companion object {
        private val backgroundThreadExecutor = Executors.newSingleThreadExecutor()
    }

    private val localVideos: MutableMap<String, RTCVideoTrack> = mutableMapOf()
    private val remoteVideos: MutableMap<String, RTCVideoTrack> = mutableMapOf()

    private var audioEnabled: Boolean = true
    private var activeTab = Tab.WEBRTC

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.main_activity)

        val tabs = findViewById<TabLayout>(R.id.tabs)
        tabs.selectTab(tabs.getTabAt(Tab.WEBRTC.position))

        ensurePermissions()
        setWebrtcTabLayout()
        setButtonClickListeners()
        connect()
    }

    override fun onResume() {
        super.onResume()
        val action = intent.action
        if (INCOMING_CALL_START == action && InfobipRTC.getInstance().activeCall != null) {
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
            if (activeTab == Tab.ROOM) {
                InfobipRTC.getInstance().activeRoomCall?.startScreenShare(screenCapturer)
            } else {
                (InfobipRTC.getInstance().activeCall as WebrtcCall).startScreenShare(screenCapturer)
            }
        }
    }

    override fun onRinging(callRingingEvent: CallRingingEvent?) {
        Log.d(TAG, "Ringing...")

        runOnUiThread {
            setCallStatus(R.string.ringing_label)
        }
    }

    override fun onEarlyMedia(callEarlyMediaEvent: CallEarlyMediaEvent?) {
        Log.d(TAG, "Early media received")
    }

    override fun onEstablished(callEstablishedEvent: CallEstablishedEvent?) {
        Log.d(TAG, "Established")
        startService(this@MainActivity, CALL_IN_PROGRESS)

        runOnUiThread {
            setCallStatus(R.string.in_call)
            showActiveCallLayout()
        }
    }

    override fun onCameraVideoAdded(cameraVideoAddedEvent: CameraVideoAddedEvent?) {
        Log.d(TAG, "Camera video added")
        val track = cameraVideoAddedEvent?.track!!
        localVideos[LOCAL_CAMERA_VIDEO_TAG] = track

        runOnUiThread {
            addLocalVideo(LOCAL_CAMERA_VIDEO_TAG, track)
        }
    }

    override fun onCameraVideoUpdated(cameraVideoUpdatedEvent: CameraVideoUpdatedEvent?) {
        Log.d(TAG, "Camera video updated")
        val track = cameraVideoUpdatedEvent?.track!!
        localVideos[LOCAL_CAMERA_VIDEO_TAG] = track

        runOnUiThread {
            updateLocalVideo(LOCAL_CAMERA_VIDEO_TAG, track)
        }
    }

    override fun onCameraVideoRemoved() {
        Log.d(TAG, "Camera video removed")
        val track = localVideos[LOCAL_CAMERA_VIDEO_TAG]
        localVideos.remove(LOCAL_CAMERA_VIDEO_TAG)

        runOnUiThread {
            removeLocalVideo(LOCAL_CAMERA_VIDEO_TAG, track)
        }
    }

    override fun onScreenShareAdded(screenShareAddedEvent: ScreenShareAddedEvent?) {
        Log.d(TAG, "Screen share added")
        val track = screenShareAddedEvent?.track!!
        localVideos[LOCAL_SCREEN_SHARE_TAG] = track

        runOnUiThread {
            addLocalVideo(LOCAL_SCREEN_SHARE_TAG, track)
        }
    }

    override fun onScreenShareRemoved(screenShareRemovedEvent: ScreenShareRemovedEvent) {
        Log.d(TAG, "Screen share removed")
        val track = localVideos[LOCAL_SCREEN_SHARE_TAG]
        localVideos.remove(LOCAL_SCREEN_SHARE_TAG)

        runOnUiThread {
            removeLocalVideo(LOCAL_SCREEN_SHARE_TAG, track)
        }
    }

    override fun onRemoteCameraVideoAdded(cameraVideoAddedEvent: CameraVideoAddedEvent?) {
        val message = "Remote user added camera video"
        Log.d(TAG, message)
        val track = cameraVideoAddedEvent?.track!!
        remoteVideos[REMOTE_CAMERA_VIDEO_TAG] = track

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            addRemoteVideo(REMOTE_CAMERA_VIDEO_TAG, track)
        }
    }

    override fun onRemoteCameraVideoRemoved() {
        val message = "Remote user removed camera video"
        Log.d(TAG, message)
        val track = remoteVideos[REMOTE_CAMERA_VIDEO_TAG]
        remoteVideos.remove(REMOTE_CAMERA_VIDEO_TAG)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            removeRemoteVideo(REMOTE_CAMERA_VIDEO_TAG, track)
        }
    }

    override fun onRemoteScreenShareAdded(screenShareAddedEvent: ScreenShareAddedEvent?) {
        val message = "Remote user added screen share video"
        Log.d(TAG, message)
        val track = screenShareAddedEvent?.track!!
        remoteVideos[REMOTE_SCREEN_SHARE_TAG] = track

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            addRemoteVideo(REMOTE_SCREEN_SHARE_TAG, track)
        }
    }

    override fun onRemoteScreenShareRemoved() {
        val message = "Remote user removed screen share video"
        Log.d(TAG, message)
        val track = remoteVideos[REMOTE_SCREEN_SHARE_TAG]
        remoteVideos.remove(REMOTE_SCREEN_SHARE_TAG)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            removeRemoteVideo(REMOTE_SCREEN_SHARE_TAG, track)
        }
    }

    override fun onRemoteMuted() {
        Log.d(TAG, "Remote user muted")
        runOnUiThread {
            findViewById<TextView>(R.id.remote_user).text =
                getString(
                    R.string.remote_muted,
                    InfobipRTC.getInstance().activeCall?.counterpart()?.identifier()
                )
        }
    }

    override fun onRemoteUnmuted() {
        Log.d(TAG, "Remote user unmuted")

        runOnUiThread {
            findViewById<TextView>(R.id.remote_user).text =
                InfobipRTC.getInstance().activeCall?.counterpart()?.identifier()
        }
    }

    override fun onHangup(callHangupEvent: CallHangupEvent?) {
        val message = "Hangup: ${callHangupEvent?.errorCode?.description}"
        Log.d(TAG, message)
        startService(this@MainActivity, CALL_FINISHED)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            setCallStatus(getString(R.string.hangup_message, callHangupEvent?.errorCode?.name))
            releaseVideoRenderers()
            removeVideoViews()
            cleanup()
            resetLayout()
        }
    }

    override fun onError(errorEvent: ErrorEvent?) {
        val message = getString(R.string.error_message, errorEvent?.errorCode?.name)
        Log.d(TAG, message)

        runOnUiThread {
            setCallStatus(message)
        }
    }

    override fun onRoomJoined(roomJoinedEvent: RoomJoinedEvent?) {
        val message = "Joined room ${roomJoinedEvent?.name}"
        Log.d(TAG, message)
        startService(this@MainActivity, CALL_IN_PROGRESS)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            setCallStatus(R.string.joined_room)
            showActiveCallLayout()
            initParticipantsView()
        }
    }

    override fun onRoomLeft(roomLeftEvent: RoomLeftEvent?) {
        val message = "Left room: ${roomLeftEvent?.errorCode?.description}"
        Log.d(TAG, message)
        startService(this@MainActivity, CALL_FINISHED)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            setCallStatus(getString(R.string.left_room, roomLeftEvent?.errorCode?.name))
            releaseVideoRenderers()
            removeVideoViews()
            removeParticipantViews()
            cleanup()
            resetLayout()
        }
    }

    override fun onParticipantJoining(participantJoiningEvent: ParticipantJoiningEvent?) {
        val identifier = participantJoiningEvent?.participant?.endpoint?.identifier()
        val message = "Participant $identifier joining conference"
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            addParticipant(participantJoiningEvent?.participant!!)
        }
    }

    override fun onParticipantJoined(participantJoinedEvent: ParticipantJoinedEvent?) {
        val identifier = participantJoinedEvent?.participant?.endpoint?.identifier()
        val message = "Participant $identifier joined room"
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            val roomParticipants = findViewById<LinearLayout>(R.id.participants)
            val participantToUpdate = roomParticipants.findViewWithTag<TextView>(identifier)
            if (participantToUpdate != null) {
                participantToUpdate.text = identifier
            } else {
                addParticipant(participantJoinedEvent?.participant!!)
            }
        }
    }

    override fun onParticipantLeft(participantLeftEvent: ParticipantLeftEvent?) {
        val identifier = participantLeftEvent?.participant?.endpoint?.identifier()
        val message = "Participant $identifier left room"
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
        val message = "Participant $identifier added screen share video"
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
        val message = "Participant $identifier removed screen share video"
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
        val identifier = participantMutedEvent?.participant?.endpoint?.identifier()
        val message = "Participant $identifier muted"
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            updateParticipant(getString(R.string.remote_muted, identifier), identifier!!)
        }
    }

    override fun onParticipantUnmuted(participantUnmutedEvent: ParticipantUnmutedEvent?) {
        val identifier = participantUnmutedEvent?.participant?.endpoint?.identifier()
        val message = "Participant $identifier unmuted"
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            updateParticipant(identifier, identifier!!)
        }
    }

    override fun onParticipantDeaf(participantDeafEvent: ParticipantDeafEvent?) {
        val identifier = participantDeafEvent?.participant?.endpoint?.identifier()
        val message = "Participant $identifier deafened"
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            updateParticipant(getString(R.string.remote_deafened, identifier), identifier!!)
        }
    }

    override fun onParticipantUndeaf(participantUndeafEvent: ParticipantUndeafEvent?) {
        val identifier = participantUndeafEvent?.participant?.endpoint?.identifier()
        val message = "Participant $identifier undeafened"
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            updateParticipant(identifier, identifier!!)
        }
    }

    override fun onParticipantStartedTalking(participantStartedTalkingEvent: ParticipantStartedTalkingEvent?) {
        val identifier = participantStartedTalkingEvent?.participant?.endpoint?.identifier()
        val message = "Participant $identifier started talking"
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            updateParticipant(getString(R.string.remote_talking, identifier), identifier!!)
        }
    }

    override fun onParticipantStoppedTalking(participantStoppedTalkingEvent: ParticipantStoppedTalkingEvent?) {
        val identifier = participantStoppedTalkingEvent?.participant?.endpoint?.identifier()
        val message = "Participant $identifier stopped talking"
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            updateParticipant(identifier, identifier!!)
        }
    }

    override fun onReconnecting(reconnectingEvent: ReconnectingEvent?) {
        val message = "Trying to reconnect..."
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            setCallStatus(message)
        }
    }

    override fun onReconnected(reconnectedEvent: ReconnectedEvent?) {
        val message = "You have been successfully reconnected!"
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
            if (InfobipRTC.getInstance().activeRoomCall != null){
                setCallStatus(R.string.joined_room)
            } else {
                setCallStatus(R.string.in_call)
            }
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

    override fun onRemoteDisconnected(remoteDisconnectedEvent: RemoteDisconnectedEvent?) {
        val message = "Remote disconnected"
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
        }
    }

    override fun onRemoteReconnected(remoteReconnectedEvent: RemoteReconnectedEvent?) {
        val message = "Remote reconnected"
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
        }
    }

    override fun onRoomRecordingStarted(roomRecordingStartedEvent: RoomRecordingStartedEvent?) {
        val recordingType = roomRecordingStartedEvent?.recordingType?.name
        val message = "Room recording started with type: $recordingType"
        Log.d(TAG, message)

        runOnUiThread {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
        }
    }

    override fun onCallRecordingStarted(callRecordingStartedEvent: CallRecordingStartedEvent?) {
        val recordingType = callRecordingStartedEvent?.recordingType?.name
        val message = "Call recording started with type: $recordingType"
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

    override fun onRemoteNetworkQualityChanged(remoteNetworkQualityChangedEvent: RemoteNetworkQualityChangedEvent?) {
        val networkQuality = remoteNetworkQualityChangedEvent?.networkQuality
        val message =
            "Remote network quality changed to ${networkQuality?.name} (${networkQuality?.score})"
        Log.d(TAG, message)
    }

    override fun onParticipantNetworkQualityChanged(participantNetworkQualityChangedEvent: ParticipantNetworkQualityChangedEvent?) {
        val networkQuality = participantNetworkQualityChangedEvent?.networkQuality
        val participant = participantNetworkQualityChangedEvent?.participant?.endpoint?.identifier()
        val message =
            "Participant $participant network quality changed to ${networkQuality?.name} (${networkQuality?.score})"
        Log.d(TAG, message)
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

    private fun ensurePermissions() {
        if (!permissionGranted(permission.RECORD_AUDIO) || !permissionGranted(permission.CAMERA)) {
            ActivityCompat.requestPermissions(
                this, arrayOf(permission.RECORD_AUDIO, permission.CAMERA), 200
            )
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
        val localVideos = findViewById<LinearLayout>(R.id.local_videos)
        localVideos.children.forEach { view ->
            (view as LinearLayout).findViewById<VideoRenderer>(R.id.video_renderer).release()
        }
        val remoteVideos = findViewById<LinearLayout>(R.id.remote_videos)
        remoteVideos.children.forEach { view ->
            (view as LinearLayout).findViewById<VideoRenderer>(R.id.video_renderer).release()
        }
    }

    private fun removeVideoViews() {
        val localVideosLayout = findViewById<LinearLayout>(R.id.local_videos)
        localVideosLayout.removeAllViews()

        val remoteVideosLayout = findViewById<LinearLayout>(R.id.remote_videos)
        remoteVideosLayout.removeAllViews()
    }

    private fun cleanup() {
        localVideos.clear()
        remoteVideos.clear()
    }

    private fun removeParticipantViews() {
        findViewById<LinearLayout>(R.id.room_participants_layout).visibility = View.GONE
        findViewById<LinearLayout>(R.id.participants).removeAllViews()
    }

    private fun initParticipantsView() {
        findViewById<LinearLayout>(R.id.room_participants_layout).visibility = View.VISIBLE
        val participants = InfobipRTC.getInstance().activeRoomCall?.participants()
        val numberOfParticipants = findViewById<TextView>(R.id.number_of_participants)
        numberOfParticipants.text =
            getString(
                R.string.number_of_participants_title,
                participants?.size
            )
        participants?.forEach { participant: Participant ->
            val participantToAdd = createParticipant(participant)
            findViewById<LinearLayout>(R.id.participants).addView(participantToAdd)
        }
    }

    private fun createParticipant(participant: Participant): TextView {
        val textView = TextView(this)
        val params = LayoutParams(
            LayoutParams.WRAP_CONTENT,
            LayoutParams.WRAP_CONTENT
        )
        params.gravity = Gravity.CENTER
        textView.layoutParams = params
        val identifier = participant.endpoint.identifier()
        textView.tag = identifier
        textView.text = when {
            participant.state.equals(ParticipantState.JOINING) -> getString(
                R.string.remote_joining,
                identifier
            )

            participant.media.audio.muted -> getString(
                R.string.remote_muted,
                identifier
            )

            else -> identifier
        }

        return textView
    }

    private fun addParticipant(participant: Participant) {
        setNumberOfParticipants()
        val participantToAdd = createParticipant(participant)
        findViewById<LinearLayout>(R.id.participants).addView(participantToAdd)
    }

    private fun updateParticipant(tag: String?, identifier: String) {
        val participants = findViewById<LinearLayout>(R.id.participants)
        val participantToUpdate = participants.findViewWithTag<TextView>(identifier)
        participantToUpdate.text = tag
    }

    private fun removeParticipant(identifier: String?) {
        setNumberOfParticipants()
        val participants = findViewById<LinearLayout>(R.id.participants)
        val participantToRemove = participants.findViewWithTag<TextView>(identifier)
        participants.removeView(participantToRemove)
    }

    private fun setNumberOfParticipants() {
        val numberOfParticipants = findViewById<TextView>(R.id.number_of_participants)
        numberOfParticipants.text =
            getString(
                R.string.number_of_participants_title,
                InfobipRTC.getInstance().activeRoomCall?.participants()?.size
            )
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
        findViewById<LinearLayout>(R.id.webrtc_tab_buttons).visibility = View.VISIBLE
        findViewById<LinearLayout>(R.id.phone_tab_buttons).visibility = View.GONE
        findViewById<LinearLayout>(R.id.room_tab_buttons).visibility = View.GONE
        findViewById<Button>(R.id.hangup_button).text = getString(R.string.hangup)
    }

    private fun setPhoneTabLayout() {
        findViewById<LinearLayout>(R.id.webrtc_tab_buttons).visibility = View.GONE
        findViewById<LinearLayout>(R.id.phone_tab_buttons).visibility = View.VISIBLE
        findViewById<LinearLayout>(R.id.room_tab_buttons).visibility = View.GONE
        findViewById<Button>(R.id.hangup_button).text = getString(R.string.hangup)
    }

    private fun setRoomTabLayout() {
        findViewById<LinearLayout>(R.id.webrtc_tab_buttons).visibility = View.GONE
        findViewById<LinearLayout>(R.id.phone_tab_buttons).visibility = View.GONE
        findViewById<LinearLayout>(R.id.room_tab_buttons).visibility = View.VISIBLE
        findViewById<Button>(R.id.hangup_button).text = getString(R.string.leave)
    }

    private fun setButtonClickListeners() {
        findViewById<TabLayout>(R.id.tabs).addOnTabSelectedListener(getTabListener())

        findViewById<SwitchCompat>(R.id.toggle_audio_switch).setOnClickListener {
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

        findViewById<Button>(R.id.join_room_video).setOnClickListener {
            joinVideoRoomOnClick()
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

        findViewById<Button>(R.id.hangup_button).setOnClickListener {
            if (activeTab == Tab.ROOM) leaveButtonOnClick() else hangupButtonOnClick()
        }

        findViewById<Button>(R.id.toggle_audio_button).setOnClickListener {
            if (activeTab == Tab.ROOM) toggleRoomAudioButtonOnClick() else toggleAudioButtonOnClick()
        }

        findViewById<Button>(R.id.select_audio_quality_button).setOnClickListener {
            if (activeTab == Tab.ROOM) showRoomAudioQualityModeDialog() else showCallAudioQualityModeDialog()
        }

        findViewById<Button>(R.id.select_audio_device_button).setOnClickListener {
            if (activeTab == Tab.ROOM) showRoomAudioDeviceDialog() else showCallAudioDeviceDialog()
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
        backgroundThreadExecutor.submit {
            try {
                val accessToken = TokenService.getAccessToken()
                InfobipRTC.getInstance().enablePushNotification(
                    accessToken.token,
                    applicationContext,
                    PUSH_CONFIG_ID
                )
                if (InfobipRTC.getInstance().activeCall == null) {
                    runOnUiThread {
                        setLoginStatus(getString(R.string.logged_in_status, accessToken.identity))
                    }
                }
            } catch (t: Throwable) {
                Log.e(TAG, "Error connecting", t)
                runOnUiThread {
                    setLoginStatus(
                        getString(
                            R.string.connection_error,
                            t.javaClass.simpleName,
                            t.message
                        )
                    )
                }
            }
        }
    }

    private fun setLoginStatus(text: String) {
        val loginStatus = findViewById<TextView>(R.id.login_status)
        loginStatus.visibility = View.VISIBLE
        loginStatus.text = text
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

    private fun joinVideoRoomOnClick() {
        call(video = true)
    }

    private fun acceptButtonOnClick(video: Boolean) {
        val activeCall = InfobipRTC.getInstance().activeCall
        if (activeCall != null) {
            val webrtcCallOptions =
                WebrtcCallOptions.builder()
                    .audio(audioEnabled)
                    .video(video)
                    .autoReconnect(true)
                    .build()
            (activeCall as IncomingWebrtcCall).accept(webrtcCallOptions)
        } else {
            runOnUiThread {
                Toast.makeText(applicationContext, "No active call", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun declineButtonOnClick() {
        val activeCall = InfobipRTC.getInstance().activeCall
        if (activeCall != null) {
            (activeCall as IncomingWebrtcCall).decline()
        } else {
            runOnUiThread {
                Toast.makeText(applicationContext, "No active call", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun hangupButtonOnClick() {
        val activeCall = InfobipRTC.getInstance().activeCall
        if (activeCall != null) {
            activeCall.hangup()
        } else {
            runOnUiThread {
                Toast.makeText(applicationContext, "No active call", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun leaveButtonOnClick() {
        val activeRoomCall = InfobipRTC.getInstance().activeRoomCall
        if (activeRoomCall != null) {
            activeRoomCall.leave()
        } else {
            runOnUiThread {
                Toast.makeText(applicationContext, "No active call", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun toggleAudioButtonOnClick() {
        val activeCall = InfobipRTC.getInstance().activeCall
        val muted = activeCall?.muted() != true
        activeCall?.mute(muted)

        runOnUiThread {
            findViewById<Button>(R.id.toggle_audio_button).setText(if (muted) R.string.unmute else R.string.mute)
        }
    }

    private fun toggleRoomAudioButtonOnClick() {
        val activeRoomCall = InfobipRTC.getInstance().activeRoomCall
        val muted = activeRoomCall?.muted() != true
        activeRoomCall?.mute(muted)

        runOnUiThread {
            findViewById<Button>(R.id.toggle_audio_button).setText(if (muted) R.string.unmute else R.string.mute)
            val identifier = TokenService.getAccessToken().identity
            updateParticipant(
                if (muted) getString(R.string.remote_muted, identifier) else identifier,
                identifier
            )
        }
    }

    private fun showRoomAudioQualityModeDialog() {
        val activeRoomCall = InfobipRTC.getInstance().activeRoomCall
        val audioQualityMode = activeRoomCall?.audioQualityMode()
        val audioQualityModes = AudioQualityMode.values().map { it.name }.toTypedArray()
        var checkedItem = AudioQualityMode.values().indexOfFirst { it == audioQualityMode }

        AlertDialog.Builder(this)
            .setTitle("Select preferred audio quality mode")
            .setSingleChoiceItems(audioQualityModes, checkedItem) { _, which ->
                checkedItem = which
            }
            .setPositiveButton("Ok") { _, _ ->
                activeRoomCall?.audioQualityMode(AudioQualityMode.values()[checkedItem])
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showCallAudioQualityModeDialog() {
        val activeCall = InfobipRTC.getInstance().activeCall
        val audioQualityMode = activeCall?.audioQualityMode()
        val audioQualityModes = AudioQualityMode.values().map { it.name }.toTypedArray()
        var checkedItem = AudioQualityMode.values().indexOfFirst { it == audioQualityMode }

        AlertDialog.Builder(this)
            .setTitle("Select preferred audio quality mode")
            .setSingleChoiceItems(audioQualityModes, checkedItem) { _, which ->
                checkedItem = which
            }
            .setPositiveButton("Ok") { _, _ ->
                activeCall?.audioQualityMode(AudioQualityMode.values()[checkedItem])
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showRoomAudioDeviceDialog() {
        val activeRoomCall = InfobipRTC.getInstance().activeRoomCall
        val activeDevice = activeRoomCall?.audioDeviceManager()?.activeDevice
        val availableAudioDevices = activeRoomCall?.audioDeviceManager()?.availableAudioDevices
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
                    activeRoomCall.audioDeviceManager().selectAudioDevice(audioDevice)
                }
                .setNegativeButton("Cancel", null)
                .show()
        }
    }

    private fun showCallAudioDeviceDialog() {
        val activeCall = InfobipRTC.getInstance().activeCall
        val activeDevice = activeCall?.audioDeviceManager()?.activeDevice
        val availableAudioDevices = activeCall?.audioDeviceManager()?.availableAudioDevices
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
                    activeCall.audioDeviceManager().selectAudioDevice(audioDevice)
                }
                .setNegativeButton("Cancel", null)
                .show()
        }
    }

    private fun toggleCameraButtonOnClick() {
        val activeCall = InfobipRTC.getInstance().activeCall
        if (activeCall is WebrtcCall) {
            val hasCameraVideo = !activeCall.hasCameraVideo()
            try {
                activeCall.cameraVideo(hasCameraVideo)
            } catch (e: Exception) {
                Log.d(TAG, "${e.message}")
            }

            runOnUiThread {
                findViewById<Button>(R.id.flip_camera_button).visibility =
                    if (hasCameraVideo) View.VISIBLE else View.GONE
            }
        }
    }

    private fun toggleRoomCameraButtonOnClick() {
        val activeRoomCall = InfobipRTC.getInstance().activeRoomCall
        val hasCameraVideo = activeRoomCall?.hasCameraVideo() != true
        try {
            activeRoomCall?.cameraVideo(hasCameraVideo)
        } catch (e: Exception) {
            Log.d(TAG, "${e.message}")
        }

        runOnUiThread {
            findViewById<Button>(R.id.flip_camera_button).visibility =
                if (hasCameraVideo) View.VISIBLE else View.GONE
        }
    }

    private fun toggleScreenShareButtonOnClick() {
        val activeCall = InfobipRTC.getInstance().activeCall
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
        val activeRoomCall = InfobipRTC.getInstance().activeRoomCall
        val hasScreenShare = activeRoomCall?.hasScreenShare()
        if (hasScreenShare == true) {
            activeRoomCall.stopScreenShare()
        } else {
            startScreenShare()
        }
    }

    private fun flipCameraButtonOnClick() {
        val activeCall = InfobipRTC.getInstance().activeCall
        if (activeCall is WebrtcCall) {
            val front = activeCall.cameraOrientation() == CameraOrientation.FRONT
            val newCameraOrientation =
                if (front) CameraOrientation.BACK else CameraOrientation.FRONT
            activeCall.cameraOrientation(newCameraOrientation)
        }
    }

    private fun flipRoomCameraButtonOnClick() {
        val activeRoomCall = InfobipRTC.getInstance().activeRoomCall
        val front = activeRoomCall?.cameraOrientation() == CameraOrientation.FRONT
        val newCameraOrientation = if (front) CameraOrientation.BACK else CameraOrientation.FRONT
        activeRoomCall?.cameraOrientation(newCameraOrientation)
    }

    private fun permissionGranted(permission: String): Boolean {
        return ContextCompat.checkSelfPermission(
            this,
            permission
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
        backgroundThreadExecutor.submit {
            try {
                val destination = findViewById<EditText>(R.id.destination).text.toString()
                when (activeTab) {
                    Tab.WEBRTC -> {
                        webrtcCall(destination, video)
                    }

                    Tab.PHONE -> {
                        phoneCall(destination)
                    }

                    Tab.ROOM -> {
                        roomCall(destination, video)
                    }
                }

                startService(this@MainActivity, OUTGOING_CALL_START)
                intent.action = null

                runOnUiThread {
                    setCallStatus(R.string.calling_label)
                    findViewById<TextView>(R.id.remote_user).text = destination
                    showOutgoingCallLayout()
                }
            } catch (t: Throwable) {
                val message = "Error calling: ${t.message}"
                Log.e(TAG, message)
                runOnUiThread {
                    Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    private fun phoneCall(destination: String) {
        val callPhoneRequest = CallPhoneRequest(
            TokenService.getAccessToken().token,
            applicationContext,
            destination,
            this
        )
        val phoneCallOptions = PhoneCallOptions.builder()
            .audio(audioEnabled)
            .from(FROM)
            .autoReconnect(true)
            .build()
        val call = InfobipRTC.getInstance().callPhone(callPhoneRequest, phoneCallOptions)
        Log.d(TAG, "Outgoing phone call with id ${call.id()}")
    }

    private fun webrtcCall(destination: String, video: Boolean) {
        val webrtcCallRequest = CallWebrtcRequest(
            TokenService.getAccessToken().token,
            applicationContext,
            destination,
            this
        )
        val webrtcCallOptions = WebrtcCallOptions.builder()
            .audio(audioEnabled)
            .video(video)
            .autoReconnect(true)
            .build()
        val call = InfobipRTC.getInstance().callWebrtc(webrtcCallRequest, webrtcCallOptions)
        Log.d(TAG, "Outgoing webrtc call with id ${call.id()}")
    }

    private fun roomCall(destination: String, video: Boolean) {
        val roomCallRequest =
            RoomRequest(TokenService.getAccessToken().token, applicationContext, this, destination)
        val roomCallOptions =
            RoomCallOptions.builder()
                .audio(audioEnabled)
                .video(video)
                .autoReconnect(true)
                .build()
        val call = InfobipRTC.getInstance().joinRoom(roomCallRequest, roomCallOptions)
        Log.d(TAG, "Outgoing room call with id ${call.id()}")
    }

    private fun showOutgoingCallLayout() {
        findViewById<LinearLayout>(R.id.in_call_layout).visibility = View.VISIBLE
        findViewById<LinearLayout>(R.id.incoming_call_layout).visibility = View.GONE
        findViewById<LinearLayout>(R.id.tab_layout).visibility = View.GONE
        findViewById<Button>(R.id.hangup_button).visibility = View.VISIBLE
    }

    private fun showIncomingCall() {
        val incomingWebrtcCall = InfobipRTC.getInstance().activeCall as WebrtcCall
        if (incomingWebrtcCall.status() == CallStatus.RINGING) {
            incomingWebrtcCall.eventListener = this

            val video = incomingWebrtcCall.hasRemoteCameraVideo()
            val callType = if (video) "video" else "audio"

            runOnUiThread {
                findViewById<TextView>(R.id.incoming_call_title).text =
                    getString(
                        R.string.incoming_call_label,
                        callType,
                        incomingWebrtcCall.counterpart().identifier()
                    )
                setLoginStatus(
                    getString(
                        R.string.logged_in_status,
                        TokenService.getAccessToken().identity
                    )
                )
                showIncomingCallLayout()
            }
        }
    }

    private fun showIncomingCallLayout() {
        findViewById<LinearLayout>(R.id.incoming_call_layout).visibility = View.VISIBLE
        findViewById<LinearLayout>(R.id.tab_layout).visibility = View.GONE
        findViewById<LinearLayout>(R.id.in_call_layout).visibility = View.GONE
        findViewById<Button>(R.id.hangup_button).visibility = View.GONE
    }

    private fun setCallStatus(label: Int) {
        findViewById<TextView>(R.id.call_status).setText(label)
    }

    private fun setCallStatus(text: String) {
        findViewById<TextView>(R.id.call_status).text = text
    }

    private fun showActiveCallLayout() {
        showOutgoingCallLayout()
        when (activeTab) {
            Tab.WEBRTC -> prepareActiveWebRTCCallLayout()
            Tab.PHONE -> prepareActivePhoneCallLayout()
            Tab.ROOM -> prepareActiveRoomCallLayout()
        }
    }

    private fun prepareActiveWebRTCCallLayout() {
        val activeCall = InfobipRTC.getInstance().activeCall as WebrtcCall
        findViewById<LinearLayout>(R.id.audio_buttons).visibility = View.VISIBLE
        findViewById<Button>(R.id.toggle_audio_button).setText(if (activeCall.muted()) R.string.unmute else R.string.mute)
        findViewById<LinearLayout>(R.id.video_buttons).visibility = View.VISIBLE
        findViewById<Button>(R.id.flip_camera_button).visibility =
            if (activeCall.hasCameraVideo()) View.VISIBLE else View.GONE
        findViewById<LinearLayout>(R.id.local_videos_layout).visibility =
            if (activeCall.hasCameraVideo() || activeCall.hasScreenShare()) View.VISIBLE else View.GONE
        findViewById<LinearLayout>(R.id.remote_videos_layout).visibility =
            if (activeCall.hasRemoteCameraVideo() || activeCall.hasRemoteScreenShare()) View.VISIBLE else View.GONE
    }

    private fun prepareActivePhoneCallLayout() {
        val activeCall = InfobipRTC.getInstance().activeCall
        activeCall?.let {
            findViewById<LinearLayout>(R.id.audio_buttons).visibility = View.VISIBLE
            findViewById<Button>(R.id.toggle_audio_button).setText(if (activeCall.muted()) R.string.unmute else R.string.mute)
            findViewById<LinearLayout>(R.id.video_buttons).visibility = View.GONE
            findViewById<LinearLayout>(R.id.local_videos_layout).visibility = View.GONE
            findViewById<LinearLayout>(R.id.remote_videos_layout).visibility = View.GONE
        }
    }

    private fun prepareActiveRoomCallLayout() {
        val activeRoomCall = InfobipRTC.getInstance().activeRoomCall
        activeRoomCall?.let {
            findViewById<LinearLayout>(R.id.audio_buttons).visibility = View.VISIBLE
            findViewById<Button>(R.id.toggle_audio_button).setText(if (activeRoomCall.muted()) R.string.unmute else R.string.mute)
            findViewById<LinearLayout>(R.id.video_buttons).visibility = View.VISIBLE
            findViewById<Button>(R.id.flip_camera_button).visibility =
                if (activeRoomCall.hasCameraVideo()) View.VISIBLE else View.GONE
            findViewById<LinearLayout>(R.id.local_videos_layout).visibility =
                if (activeRoomCall.hasCameraVideo() || activeRoomCall.hasScreenShare()) View.VISIBLE else View.GONE
            findViewById<LinearLayout>(R.id.remote_videos_layout).visibility =
                if (activeRoomCall.remoteVideos().isNotEmpty()) View.VISIBLE else View.GONE
        }

    }

    private fun hideActiveCallLayout() {
        findViewById<LinearLayout>(R.id.in_call_layout).visibility = View.GONE
        findViewById<LinearLayout>(R.id.remote_videos_layout).visibility = View.GONE
        findViewById<LinearLayout>(R.id.local_videos_layout).visibility = View.GONE
        findViewById<LinearLayout>(R.id.audio_buttons).visibility = View.GONE
        findViewById<LinearLayout>(R.id.video_buttons).visibility = View.GONE
        findViewById<Button>(R.id.hangup_button).visibility = View.GONE
    }

    private fun hideIncomingCallLayout() {
        findViewById<LinearLayout>(R.id.incoming_call_layout).visibility = View.GONE
    }

    private fun resetLayout() {
        hideActiveCallLayout()
        hideIncomingCallLayout()
        setActiveTabLayout()
    }

    private fun setActiveTabLayout() {
        findViewById<LinearLayout>(R.id.tab_layout).visibility = View.VISIBLE
        when (activeTab) {
            Tab.WEBRTC -> setWebrtcTabLayout()
            Tab.PHONE -> setPhoneTabLayout()
            Tab.ROOM -> setRoomTabLayout()
        }
    }
}