import UIKit
import InfobipRTC

extension ApplicationCallController {
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
        getInfobipRTCInstance().getActiveApplicationCall()?.speakerphone(true) { error in
            DispatchQueue.main.async {
                if let error = error {
                    self.showErrorAlert(message: error.localizedDescription)
                }
            }
        }
    }
    
    func addVideo(_ identifier: String, _ videoType: String) {
        let remoteVideoView = UIView()
        remoteVideoView.frame.size.width = 360
        remoteVideoView.frame.size.height = 200
        remoteVideoView.accessibilityIdentifier = "\(identifier)-\(videoType)"
        
        let remoteView = InfobipRTCFactory.videoView(frame: remoteVideoView.frame, contentMode: .scaleAspectFit)
        self.videoViews["\(identifier)-\(videoType)"] = remoteView
        self.embedView(self.videoViews["\(identifier)-\(videoType)"]!, into: remoteVideoView)
        
        let label = UILabel()
        label.text = "\(identifier)"
        label.textAlignment = .center
        label.textColor = .white
        label.backgroundColor = .black
        label.translatesAutoresizingMaskIntoConstraints = false

        remoteVideoView.addSubview(label)
        NSLayoutConstraint.activate([
            label.leadingAnchor.constraint(equalTo: remoteVideoView.leadingAnchor, constant: 16),
            label.trailingAnchor.constraint(equalTo: remoteVideoView.trailingAnchor, constant: -16),
            label.bottomAnchor.constraint(equalTo: remoteVideoView.bottomAnchor, constant: -16),
        ])
        remoteVideoView.bringSubviewToFront(label)
        
        self.videosStack.addArrangedSubview(remoteVideoView)
    }
    
    func removeVideo(_ identifier: String, _ videoType: String) {
        if let viewToRemove = videosStack.arrangedSubviews.first(where: { $0.accessibilityIdentifier == "\(identifier)-\(videoType)" }) {
            self.videosStack.removeArrangedSubview(viewToRemove)
            viewToRemove.removeFromSuperview()
        }
        self.videoViews.removeValue(forKey: "\(identifier)-\(videoType)")
    }
    
    func finalizeRemoteVideosPreview() {
        DispatchQueue.main.async {
            for subview in self.videosStack.arrangedSubviews {
                if let identifier = subview.accessibilityIdentifier, !identifier.contains(self.identity!) {
                    self.videosStack.removeArrangedSubview(subview)
                    subview.removeFromSuperview()
                    self.videoViews.removeValue(forKey: identifier)
                }
            }
        }
    }
    
    func finalizeLocalVideosPreview() {
        DispatchQueue.main.async {
            for subview in self.videosStack.arrangedSubviews {
                if let identifier = subview.accessibilityIdentifier, identifier.contains(self.identity!) {
                    self.videosStack.removeArrangedSubview(subview)
                    subview.removeFromSuperview()
                    self.videoViews.removeValue(forKey: identifier)
                }
            }
        }
    }
}
