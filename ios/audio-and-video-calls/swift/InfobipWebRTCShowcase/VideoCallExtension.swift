import UIKit
import InfobipRTC

extension WebrtcCallController {
    func initRemoteSmallView() {
        let remoteView = InfobipRTCFactory.videoView(frame: self.remoteCameraVideoView.frame, contentMode: .scaleAspectFill)
        remoteView.layer.cornerRadius = 10.0
        remoteView.clipsToBounds = true
        self.embedView(remoteView, into: self.remoteCameraVideoView)
        self.remoteSmallView = remoteView
    }
    
    func initRemoteFullView() {
        let remoteView = InfobipRTCFactory.videoView(frame: self.view.frame, contentMode: .scaleAspectFit)
        self.embedView(remoteView, into: self.view)
        self.view.sendSubviewToBack(remoteView)
        self.remoteFullView = remoteView
    }
    
    func initLocalCameraVideoView() {
        let localView = InfobipRTCFactory.videoView(frame: self.localCameraVideoView.frame, contentMode: .scaleAspectFill)
        localView.layer.cornerRadius = 10.0
        localView.clipsToBounds = true
        self.embedView(localView, into: self.localCameraVideoView)
        self.localCameraView = localView
    }
    
    func initLocalScreenShareView() {
        let localView = InfobipRTCFactory.videoView(frame: self.localScreenShareView.frame, contentMode: .scaleAspectFill)
        localView.layer.cornerRadius = 10.0
        localView.clipsToBounds = true
        self.embedView(localView, into: self.localScreenShareView)
        self.localScreenView = localView
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
        self.activeCall?.speakerphone(true) { error in
            DispatchQueue.main.async {
                if let error = error {
                    self.showErrorAlert(message: error.localizedDescription)
                }
            }
        }
    }
    
    func addLocalCameraVideoView() {
        self.initLocalCameraVideoView()
    }
    
    func addLocalScreenShareView() {
        self.initLocalScreenShareView()
    }
    
    func addRemoteSmallView() {
        self.remoteCameraVideoView.isHidden = false
        self.initRemoteSmallView()
    }
    
    func addRemoteFullView() {
        self.initRemoteFullView()
    }
    
    func hideLocalCameraVideoView() {
        self.localCameraView = nil
        self.localCameraVideoView.isHidden = true
        self.flipCameraButton.isHidden = true
    }
    
    func hideLocalScreenShareView() {
        self.localScreenView = nil
        self.localScreenShareView.isHidden = true
    }
    
    func hideRemoteSmallView() {
        self.remoteCameraVideoView?.isHidden = true
        self.remoteSmallView = nil
    }
    
    func hideRemoteFullView() {
        self.remoteFullView?.removeFromSuperview()
        self.remoteFullView?.isHidden = true
        self.remoteFullView = nil
    }
    
    func finalizeVideoCallPreview() {
        DispatchQueue.main.async {
            self.localCameraVideoView?.isHidden = true
            self.localCameraView = nil
            
            self.localScreenShareView?.isHidden = true
            self.localScreenView = nil
            
            self.remoteCameraVideoView?.isHidden = true
            self.remoteSmallView = nil
            
            self.remoteFullView?.removeFromSuperview()
            self.remoteFullView?.isHidden = true
            self.remoteFullView = nil
        }
    }
}

extension RoomCallController {
    func initLocalCameraVideoView() {
        let localView = InfobipRTCFactory.videoView(frame: self.localCameraVideoView.frame, contentMode: .scaleAspectFill)
        localView.layer.cornerRadius = 10.0
        localView.clipsToBounds = true
        self.embedView(localView, into: self.localCameraVideoView)
        self.localCameraView = localView
    }
    
    func initLocalScreenShareView() {
        let localView = InfobipRTCFactory.videoView(frame: self.localScreenShareView.frame, contentMode: .scaleAspectFill)
        localView.layer.cornerRadius = 10.0
        localView.clipsToBounds = true
        self.embedView(localView, into: self.localScreenShareView)
        self.localScreenView = localView
    }
    
    func initRemoteTopVideoView() {
        let remoteView = InfobipRTCFactory.videoView(frame: self.remoteTopVideoView.frame, contentMode: .scaleAspectFill)
        remoteView.layer.cornerRadius = 10.0
        remoteView.clipsToBounds = true
        self.embedView(remoteView, into: self.remoteTopVideoView)
        self.remoteTopView = remoteView
    }
    
    func initRemoteBottomCameraView() {
        let remoteView = InfobipRTCFactory.videoView(frame: self.remoteBottomVideoView.frame, contentMode: .scaleAspectFill)
        remoteView.layer.cornerRadius = 10.0
        remoteView.clipsToBounds = true
        self.embedView(remoteView, into: self.remoteBottomVideoView)
        self.remoteBottomView = remoteView
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
        self.activeCall?.speakerphone(true) { error in
            DispatchQueue.main.async {
                if let error = error {
                    self.showErrorAlert(message: error.localizedDescription)
                }
            }
        }
    }
    
    func addLocalCameraVideoView() {
        self.initLocalCameraVideoView()
    }
    
    func addLocalScreenShareView() {
        self.initLocalScreenShareView()
    }
    
    func addRemoteTopVideoView(_ identifier: String, _ videoType: String) {
        self.initRemoteTopVideoView()
        self.remoteTopVideoView.accessibilityIdentifier = "\(identifier)-\(videoType)"
        self.remoteTopVideoView.isHidden = false
        self.remoteVideosStack.isHidden = false
    }
    
    func addRemoteBottomVideoView(_ identifier: String, _ videoType: String) {
        self.initRemoteBottomCameraView()
        self.remoteBottomVideoView.accessibilityIdentifier = "\(identifier)-\(videoType)"
        self.remoteBottomVideoView.isHidden = false
        self.remoteVideosStack.isHidden = false
    }
    
    func hideLocalCameraVideoView() {
        self.localCameraView = nil
        self.localCameraVideoView.isHidden = true
        self.flipCameraButton.isHidden = true
    }
    
    func hideLocalScreenShareView() {
        self.localScreenView = nil
        self.localScreenShareView.isHidden = true
    }
    
    func hideRemoteVideoView(_ identifier: String, _ videoType: String) {
        if (self.remoteTopVideoView.id == "\(identifier)-\(videoType)") {
            self.remoteTopView = nil
            self.remoteTopVideoView.isHidden = true
            self.remoteTopVideoView.id = ""
        } else if (self.remoteBottomVideoView.id == "\(identifier)-\(videoType)") {
            self.remoteBottomView = nil
            self.remoteBottomVideoView.isHidden = true
            self.remoteBottomVideoView.id = ""
        }
        
        if (self.remoteTopView == nil && self.remoteBottomView == nil) {
            self.remoteVideosStack.isHidden = true
        }
    }
    
    func finalizeVideoCallPreview() {
        DispatchQueue.main.async {
            self.localCameraVideoView.isHidden = true
            self.localCameraView = nil
            
            self.localScreenShareView.isHidden = true
            self.localScreenView = nil
            
            self.remoteTopVideoView.isHidden = true
            self.remoteTopVideoView.id = ""
            self.remoteTopView = nil
            
            self.remoteBottomVideoView.isHidden = true
            self.remoteBottomVideoView.id = ""
            self.remoteBottomView = nil
            
            self.remoteVideosStack.isHidden = true
        }
    }
}
