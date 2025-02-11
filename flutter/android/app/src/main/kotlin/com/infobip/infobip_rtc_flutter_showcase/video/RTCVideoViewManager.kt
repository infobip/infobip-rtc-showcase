package com.infobip.infobip_rtc_flutter_showcase.video

import android.content.Context
import android.view.View
import com.infobip.infobip_rtc_flutter_showcase.video.RTCVideoView
import io.flutter.plugin.platform.PlatformView

internal class RTCVideoViewManager(context: Context, id: Int, creationParams: Map<String?, Any?>?) :
    PlatformView {
    private val rtcVideoView: RTCVideoView = RTCVideoView(context)

    override fun getView(): View {
        return rtcVideoView
    }

    override fun dispose() {
        rtcVideoView.release()
    }
}