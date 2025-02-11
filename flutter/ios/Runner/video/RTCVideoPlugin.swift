import InfobipRTC

public class RTCVideoPlugin: NSObject, FlutterPlugin {
    var videoViews: [String: RTCVideoView] = [:]

    public static func register(with registrar: FlutterPluginRegistrar) {
        registrar.register(
            RTCVideoViewFactory(messenger: registrar.messenger(), plugin: RTCVideoPlugin()),
            withId: "<infobip-rtc-video-view>"
        )
    }

    public func handle(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
        result(FlutterMethodNotImplemented)
    }

    func setView(streamId: String, rtcVideoView: RTCVideoView) {
        videoViews[streamId] = rtcVideoView
        if let activeCall = getInfobipRTCInstance().getActiveCall() as? WebrtcCall {
            if streamId == "remote", let track = activeCall.remoteCameraTrack() {
                rtcVideoView.attachTrack(track)
            } else if streamId == "local", let track = activeCall.localCameraTrack() {
                rtcVideoView.attachTrack(track)
            }
        }
    }

    func setTrack(streamId: String, track: VideoTrack?) {
        if let view = videoViews[streamId] {
            if track == nil {
                view.release()
            } else {
                view.attachTrack(track)
            }
        }
    }

    func clearViews() {
        videoViews.values.forEach { $0.release() }
        videoViews.removeAll()
    }
}
