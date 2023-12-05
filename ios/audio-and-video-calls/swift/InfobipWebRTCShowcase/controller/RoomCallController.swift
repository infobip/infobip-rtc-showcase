import UIKit
import InfobipRTC
import os.log

class RoomCallController: MainController {
    @IBOutlet weak var joinButton: UIButton!
    @IBOutlet weak var joinVideoButton: UIButton!
    
    @IBAction func joinAudioRoom(_ sender: Any) {
        self.makeCall(callType: .room_audio)
    }
    
    @IBAction func joinVideoRoom(_ sender: Any) {
        self.makeCall(callType: .room_video)
    }
}
