import UIKit
import InfobipRTC
import os.log

extension AppController {
    func initRemoteVideoView() {
        let remoteView = InfobipRTCFactory.videoView(frame: self.view.frame, contentMode: .scaleAspectFit)
        self.embedView(remoteView, into: self.view)
        self.view.sendSubviewToBack(remoteView)
        self.remoteView = remoteView
    }
    
    func initLocalVideoView() {
        let localView = InfobipRTCFactory.videoView(frame: self.localVideoView.frame, contentMode: .scaleAspectFill)
        localView.layer.cornerRadius = 10.0
        localView.clipsToBounds = true
        self.embedView(localView, into: self.localVideoView)
        self.localView = localView
    }
    
    func embedView(_ view: UIView, into containerView: UIView) {
        containerView.addSubview(view)
        view.translatesAutoresizingMaskIntoConstraints = false
        containerView.addConstraints(NSLayoutConstraint.constraints(withVisualFormat: "H:|[view]|",
                                                                    options: [],
                                                                    metrics: nil,
                                                                    views: ["view":view]))
        
        containerView.addConstraints(NSLayoutConstraint.constraints(withVisualFormat: "V:|[view]|",
                                                                    options: [],
                                                                    metrics: nil,
                                                                    views: ["view":view]))
        containerView.layoutIfNeeded()
    }
    
    func turnSpeakerphoneOn() {
        DispatchQueue.main.async {
            self.activeCall?.speakerphone(true)
        }
    }
    
    func showLocalVideoView(_ localVideoTrack: VideoTrack?) {
        self.localVideoView.isHidden = false
        self.flipCameraButton.isHidden = false
        
        self.initLocalVideoView()
        if let localView = self.localView {
            localVideoTrack!.addRenderer(localView)
        }
    }
    
    func showRemoteVideoView(_ remoteVideoTrack: VideoTrack?) {
        self.initRemoteVideoView()
        if let remoteView = self.remoteView {
            remoteVideoTrack!.addRenderer(remoteView)
        }
    }
    
    func hideLocalVideoView() {
        self.localView = nil
        self.localVideoView.isHidden = true
        self.flipCameraButton.isHidden = true
    }
    
    func hideRemoteVideoView() {
        self.remoteView?.removeFromSuperview()
        self.remoteView?.isHidden = true
        self.remoteView = nil
    }
    
    func finalizeVideoCallPreview() {
        DispatchQueue.main.async {
            self.localVideoView.isHidden = true
            self.localView = nil
            self.remoteView?.removeFromSuperview()
            self.remoteView = nil
        }
    }
}
