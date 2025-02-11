package com.infobip.infobip_rtc_flutter_showcase.video

import android.content.Context
import android.widget.FrameLayout
import com.infobip.webrtc.sdk.api.model.video.RTCVideoTrack
import com.infobip.webrtc.sdk.api.model.video.VideoRenderer
import org.webrtc.RendererCommon

class RTCVideoView(context: Context) : FrameLayout(context) {
  private var renderer: VideoRenderer = VideoRenderer(context)

  init {
    renderer.keepScreenOn = true
    renderer.setScalingType(RendererCommon.ScalingType.SCALE_ASPECT_FIT)
    renderer.init()
    renderer.setMirror(true)
    renderer.setZOrderMediaOverlay(true)
    renderer.setEnableHardwareScaler(true)

    layoutParams = LayoutParams(
      LayoutParams.MATCH_PARENT,
      LayoutParams.MATCH_PARENT
    )

    addView(renderer)
  }

  fun attachTrack(track: RTCVideoTrack?) {
    track?.addSink(renderer)
  }

  fun release() {
    renderer.release()
  }
}
