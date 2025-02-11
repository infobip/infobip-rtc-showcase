package com.infobip.infobip_rtc_flutter_showcase.video

import android.content.Context
import io.flutter.plugin.common.StandardMessageCodec
import io.flutter.plugin.platform.PlatformView
import io.flutter.plugin.platform.PlatformViewFactory

class RTCVideoViewFactory(private val plugin: RTCVideoPlugin) : PlatformViewFactory(StandardMessageCodec.INSTANCE) {
  override fun create(context: Context, viewId: Int, args: Any?): PlatformView {
    val creationParams = args as? Map<String?, Any?>
    val streamId = creationParams?.get("streamId") as? String
      ?: throw IllegalArgumentException("streamId in RTCVideoView has to be set!")

    val rtcVideoView = RTCVideoViewManager(context, viewId, creationParams)
    plugin.setView(streamId, rtcVideoView.view as RTCVideoView)

    return rtcVideoView
  }
}

