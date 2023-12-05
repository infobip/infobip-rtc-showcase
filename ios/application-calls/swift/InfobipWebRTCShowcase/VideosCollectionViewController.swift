import Foundation
import UIKit
import InfobipRTC

class VideoViewCell: UICollectionViewCell {
    @IBOutlet weak var videoView: UIView!
    @IBOutlet weak var videoLabel: UILabel!
}

extension ApplicationCallController: UICollectionViewDelegate, UICollectionViewDataSource {
    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        if collectionView == self.localVideosCollectionView {
            return localVideoViews.count
        } else {
            return remoteVideoViews.count
        }
    }
    
    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        let cell = collectionView.dequeueReusableCell(withReuseIdentifier: "videoViewCell", for: indexPath) as! VideoViewCell
        if collectionView == self.localVideosCollectionView {
            let localVideo = self.localVideoViews[indexPath.row]
            self.createVideoView(cell: cell, video: localVideo)
        } else {
            let remoteVideo = self.remoteVideoViews[indexPath.row]
            self.createVideoView(cell: cell, video: remoteVideo)
        }
        return cell
    }
    
    func createVideoView(cell: VideoViewCell, video: Video) {
        cell.videoView.frame.size.width = 200
        cell.videoView.frame.size.height = 200
        let videoView = InfobipRTCFactory.videoView(frame: cell.videoView.frame, contentMode: .scaleAspectFit)
        self.embedView(videoView, into: cell.videoView)
        video.track.addRenderer(videoView)
        cell.videoLabel.text = "\(video.identity)-\(video.type)"
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
}

class Video {
    var identity: String
    var type: String
    var track: VideoTrack
    
    init(identity: String, type: String, track: VideoTrack) {
        self.identity = identity
        self.type = type
        self.track = track
    }
}
