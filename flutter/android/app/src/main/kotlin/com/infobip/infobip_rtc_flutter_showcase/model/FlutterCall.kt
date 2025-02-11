package com.infobip.infobip_rtc_flutter_showcase.model

import com.infobip.webrtc.sdk.api.call.PhoneCall
import com.infobip.webrtc.sdk.api.call.WebrtcCall
import com.infobip.webrtc.sdk.api.model.endpoint.Endpoint

interface FlutterCall {
    val id: String
    val muted: Boolean
    val source: Endpoint
    val destination: Endpoint
    val counterpart: Endpoint
}

data class FlutterPhoneCall(
    override val id: String,
    override val muted: Boolean,
    override val source: Endpoint,
    override val destination: Endpoint,
    override val counterpart: Endpoint,
) : FlutterCall

data class FlutterWebrtcCall(
    override val id: String,
    override val muted: Boolean,
    override val source: Endpoint,
    override val destination: Endpoint,
    override val counterpart: Endpoint,
    val hasCameraVideo: Boolean,
    val hasRemoteCameraVideo: Boolean,
    val hasScreenShare: Boolean,
    val hasRemoteScreenShare: Boolean
) : FlutterCall

class FlutterMapper {
    companion object {
        fun mapToFlutterCall(call: WebrtcCall): FlutterWebrtcCall =
            FlutterWebrtcCall(
                id = call.id(),
                muted = call.muted(),
                source = call.source(),
                destination = call.destination(),
                counterpart = call.counterpart(),
                hasCameraVideo = call.hasCameraVideo(),
                hasRemoteCameraVideo = call.hasRemoteCameraVideo(),
                hasScreenShare = call.hasScreenShare(),
                hasRemoteScreenShare = call.hasRemoteScreenShare()
            )

        fun mapToFlutterCall(call: PhoneCall): FlutterPhoneCall =
            FlutterPhoneCall(
                id = call.id(),
                muted = call.muted(),
                source = call.source(),
                destination = call.destination(),
                counterpart = call.counterpart(),
            )
    }
}