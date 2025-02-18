package com.infobip.infobip_rtc_flutter_showcase

import android.util.Log
import com.infobip.infobip_rtc_flutter_showcase.model.FlutterMapper
import com.infobip.infobip_rtc_flutter_showcase.video.RTCVideoPlugin
import com.google.gson.Gson
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
import com.infobip.webrtc.sdk.api.event.call.ReconnectedEvent
import com.infobip.webrtc.sdk.api.event.call.ReconnectingEvent
import com.infobip.webrtc.sdk.api.event.call.RemoteDisconnectedEvent
import com.infobip.webrtc.sdk.api.event.call.RemoteReconnectedEvent
import com.infobip.webrtc.sdk.api.event.call.ScreenShareAddedEvent
import com.infobip.webrtc.sdk.api.event.call.ScreenShareRemovedEvent
import com.infobip.webrtc.sdk.api.event.listener.IncomingCallEventListener
import com.infobip.webrtc.sdk.api.event.listener.PhoneCallEventListener
import com.infobip.webrtc.sdk.api.event.listener.WebrtcCallEventListener
import com.infobip.webrtc.sdk.api.event.rtc.IncomingWebrtcCallEvent
import com.infobip.webrtc.sdk.api.options.PhoneCallOptions
import com.infobip.webrtc.sdk.api.options.WebrtcCallOptions
import com.infobip.webrtc.sdk.api.request.CallPhoneRequest
import com.infobip.webrtc.sdk.api.request.CallWebrtcRequest

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import io.flutter.plugins.GeneratedPluginRegistrant

class MainActivity : FlutterActivity(), WebrtcCallEventListener, PhoneCallEventListener, IncomingCallEventListener {
    private val rtcChannel = "infobip-rtc"
    private val rtcEventListenerChannel = "infobip-rtc-event-listener"

    private val callChannel = "infobip-rtc-call"
    private val callEventListenerChannel = "infobip-rtc-call-event-listener"

    private lateinit var plugin: RTCVideoPlugin

    private val gson = Gson()

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        plugin = RTCVideoPlugin()
        flutterEngine.plugins.add(plugin)

        GeneratedPluginRegistrant.registerWith(flutterEngine);

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, rtcChannel).setMethodCallHandler { methodCall, result ->
            when (methodCall.method) {
                "callWebrtc" -> callWebrtc(methodCall, result)
                "callPhone" -> callPhone(methodCall, result)
                "registerForActiveConnection" -> registerForActiveConnection(methodCall)
                else -> result.notImplemented()
            }
        }

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, callChannel).setMethodCallHandler { methodCall, result ->
            when (methodCall.method) {
                "mute" -> mute(methodCall)
                "cameraVideo" -> cameraVideo(methodCall)
                "screenShare" -> screenShare(methodCall)
                "hangup" -> hangup()
                "accept" -> acceptIncomingCall()
                "decline" -> declineIncomingCall()
                else -> result.notImplemented()
            }
        }
    }

    private fun callWebrtc(methodCall: MethodCall, result: MethodChannel.Result) {
        val token: String = methodCall.argument("token")!!
        val destination: String = methodCall.argument("destination")!!
        val options: WebrtcCallOptions? = methodCall.argument<String?>("options")?.let { gson.fromJson(it, WebrtcCallOptions::class.java) }
        val callRequest =
            CallWebrtcRequest(token, applicationContext, destination, this)
        try {
            val call = InfobipRTC.getInstance().callWebrtc(callRequest, options ?: WebrtcCallOptions.builder().build())
            val flutterCall = gson.toJson(FlutterMapper.mapToFlutterCall(call))
            result.success(flutterCall)
        } catch (e: Exception) {
            Log.e("RTC", e.message, e)
            result.error("ERROR", "Error during WebRTC call", e.message)
        }
    }

    private fun callPhone(methodCall: MethodCall, result: MethodChannel.Result) {
        val token: String = methodCall.argument("token")!!
        val destination: String = methodCall.argument("destination")!!
        val options: PhoneCallOptions? = methodCall.argument<String?>("options")?.let { gson.fromJson(it, PhoneCallOptions::class.java) }
        val callRequest =
            CallPhoneRequest(token, applicationContext, destination, this)
        try {
            val call = InfobipRTC.getInstance().callPhone(callRequest, options ?: PhoneCallOptions.builder().build())
            val flutterCall = gson.toJson(FlutterMapper.mapToFlutterCall(call))
            result.success(flutterCall)
        } catch (e: Exception) {
            Log.d("RTC", e.message, e)
            result.error("ERROR", "Error during phone call", e.message)
        }
    }

    private fun registerForActiveConnection(methodCall: MethodCall) {
        val token: String = methodCall.argument("token")!!

        InfobipRTC.getInstance().registerForActiveConnection(
            token,
            applicationContext,
            this
        )
    }

    private fun mute(methodCall: MethodCall) {
        val mute: Boolean = methodCall.argument("mute")!!
        InfobipRTC.getInstance().activeCall?.mute(mute)
    }

    private fun cameraVideo(methodCall: MethodCall) {
        val cameraVideo: Boolean = methodCall.argument("cameraVideo")!!
        val call = InfobipRTC.getInstance().activeCall as? WebrtcCall
        call?.cameraVideo(cameraVideo)
    }

    private fun screenShare(methodCall: MethodCall) {
        // todo
    }

    private fun hangup() {
        InfobipRTC.getInstance().activeCall?.hangup()
    }

    private fun acceptIncomingCall() {
        (InfobipRTC.getInstance().activeCall as IncomingWebrtcCall).accept()
    }

    private fun declineIncomingCall() {
        (InfobipRTC.getInstance().activeCall as IncomingWebrtcCall).decline()
    }

    private fun invokeMethod(event: String, data: String?) {
        runOnUiThread {
            flutterEngine?.dartExecutor?.binaryMessenger?.let {
                MethodChannel(it, callEventListenerChannel).invokeMethod(
                    "onEvent",
                    mapOf(
                        "event" to event,
                        "data" to data
                    )
                )
            }
        }
    }

    override fun onEarlyMedia(callEarlyMediaEvent: CallEarlyMediaEvent?) {
        invokeMethod("onEarlyMedia", gson.toJson(callEarlyMediaEvent))
    }

    override fun onRinging(callRingingEvent: CallRingingEvent?) {
        invokeMethod("onRinging", gson.toJson(callRingingEvent))
    }

    override fun onEstablished(callEstablishedEvent: CallEstablishedEvent?) {
        invokeMethod("onEstablished", gson.toJson(callEstablishedEvent))
    }

    override fun onHangup(callHangupEvent: CallHangupEvent?) {
        invokeMethod("onHangup", gson.toJson(callHangupEvent))
    }

    override fun onError(errorEvent: ErrorEvent?) {
        invokeMethod("onError", gson.toJson(errorEvent))
    }

    override fun onCallRecordingStarted(callRecordingStartedEvent: CallRecordingStartedEvent?) {
        invokeMethod("onCallRecordingStarted", gson.toJson(callRecordingStartedEvent))
    }

    override fun onCameraVideoAdded(cameraVideoAddedEvent: CameraVideoAddedEvent?) {
        if (cameraVideoAddedEvent != null) {
            plugin.setTrack("local", cameraVideoAddedEvent.track)
        }

        invokeMethod("onCameraVideoAdded", null)
    }

    override fun onCameraVideoUpdated(cameraVideoUpdatedEvent: CameraVideoUpdatedEvent?) {
        if (cameraVideoUpdatedEvent != null) {
            plugin.setTrack("local", cameraVideoUpdatedEvent.track)
        }

        invokeMethod("onCameraVideoUpdated", null)
    }

    override fun onCameraVideoRemoved() {
        plugin.setTrack("local", null)

        invokeMethod("onCameraVideoRemoved", null)
    }

    override fun onScreenShareAdded(screenShareAddedEvent: ScreenShareAddedEvent?) {
        invokeMethod("onScreenShareAdded", null)
    }

    override fun onScreenShareRemoved(screenShareRemovedEvent: ScreenShareRemovedEvent?) {
        invokeMethod("onScreenShareRemoved", null)
    }

    override fun onRemoteCameraVideoAdded(cameraVideoAddedEvent: CameraVideoAddedEvent?) {
        if (cameraVideoAddedEvent != null) {
            plugin.setTrack("remote", cameraVideoAddedEvent.track)
        }

        invokeMethod("onRemoteCameraVideoAdded", null)
    }

    override fun onRemoteCameraVideoRemoved() {
        plugin.setTrack("remote", null)

        invokeMethod("onRemoteCameraVideoRemoved", null)
    }

    override fun onRemoteScreenShareAdded(screenShareAddedEvent: ScreenShareAddedEvent?) {
        invokeMethod("onRemoteScreenShareAdded", null)
    }

    override fun onRemoteScreenShareRemoved() {
        invokeMethod("onRemoteScreenShareRemoved", null)
    }

    override fun onRemoteMuted() {
        invokeMethod("onRemoteMuted", null)
    }

    override fun onRemoteUnmuted() {
        invokeMethod("onRemoteUnmuted", null)
    }

    override fun onReconnecting(reconnectingEvent: ReconnectingEvent?) {
        invokeMethod("onReconnecting", null)
    }

    override fun onReconnected(reconnectedEvent: ReconnectedEvent?) {
        invokeMethod("onReconnected", null)
    }

    override fun onRemoteDisconnected(remoteDisconnectedEvent: RemoteDisconnectedEvent?) {
        invokeMethod("onRemoteDisconnected", null)
    }

    override fun onRemoteReconnected(remoteReconnectedEvent: RemoteReconnectedEvent?) {
        invokeMethod("onRemoteReconnected", null)
    }

    override fun onIncomingWebrtcCall(incomingWebrtcCallEvent: IncomingWebrtcCallEvent?) {
        val incomingCall = incomingWebrtcCallEvent?.incomingWebrtcCall
        incomingCall?.eventListener = this

        runOnUiThread {
            flutterEngine?.dartExecutor?.binaryMessenger?.let {
                MethodChannel(it, rtcEventListenerChannel).invokeMethod(
                    "onEvent",
                    mapOf(
                        "event" to "onIncomingCall",
                        "data" to gson.toJson(
                            FlutterMapper.mapToFlutterCall(
                                incomingCall as WebrtcCall
                            )
                        )
                    )
                )
            }
        }
    }
}