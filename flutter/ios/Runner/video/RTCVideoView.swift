import Foundation
import InfobipRTC

class RTCVideoView: NSObject, FlutterPlatformView {
    private var _view: UIView
    private var streamId: String?
    private var videoView: UIView?
    private var plugin: RTCVideoPlugin

    init(
            frame: CGRect,
            viewIdentifier viewId: Int64,
            arguments args: Any?,
            binaryMessenger messenger: FlutterBinaryMessenger?,
            plugin: RTCVideoPlugin
    ) {
        self.streamId = (args as? [String: Any])?["streamId"] as? String
        self.plugin = plugin
        
        self._view = UIView()

        super.init()
        createNativeView(view: _view, frame: frame)
    }

    func createNativeView(view _view: UIView, frame: CGRect) {
        if let streamId = self.streamId as String? {
            let videoView = InfobipRTCFactory.videoView(frame: frame, contentMode: .scaleAspectFit)
            videoView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            
            if let activeCall = getInfobipRTCInstance().getActiveCall() as? WebrtcCall {
                if streamId == "remote", let track = activeCall.remoteCameraTrack() {
                    track.addRenderer(videoView)
                } else if streamId == "local", let track = activeCall.localCameraTrack() {
                    track.addRenderer(videoView)
                }
            }

            self.videoView = videoView
            self.plugin.setView(streamId: streamId, rtcVideoView: self)
            self._view.addSubview(videoView)
        }
    }

    func view() -> UIView {
        self._view
    }

    func attachTrack(_ track: VideoTrack?) {
        if let videoView = self.videoView {
            track?.addRenderer(videoView)
        }
    }

    func release() {
    }
}
