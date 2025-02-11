package com.infobip.infobip_rtc_flutter_showcase.video

import com.infobip.webrtc.sdk.api.InfobipRTC
import com.infobip.webrtc.sdk.api.call.WebrtcCall
import com.infobip.webrtc.sdk.api.model.video.RTCVideoTrack
import io.flutter.embedding.engine.plugins.FlutterPlugin
import java.util.*

class RTCVideoPlugin: FlutterPlugin {
  private val views: MutableMap<String, RTCVideoView> = HashMap()

  override fun onAttachedToEngine(flutterPluginBinding: FlutterPlugin.FlutterPluginBinding) {
    flutterPluginBinding.platformViewRegistry
      .registerViewFactory(
        "<infobip-rtc-video-view>",
        RTCVideoViewFactory(this)
      )
  }

  override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
  }

  fun setTrack(streamId: String, track: RTCVideoTrack?) {
    views[streamId]?.let { view ->
      if (track == null) {
        view.release()
      } else {
        view.attachTrack(track)
      }
    }
  }

  fun setView(streamId: String, rtcVideoView: RTCVideoView) {
    views[streamId] = rtcVideoView
    val activeCall = InfobipRTC.getInstance().activeCall as? WebrtcCall

    if (streamId == "remote") {
      rtcVideoView.attachTrack(activeCall?.remoteCameraTrack())
    } else {
      rtcVideoView.attachTrack(activeCall?.localCameraTrack())
    }
  }
}