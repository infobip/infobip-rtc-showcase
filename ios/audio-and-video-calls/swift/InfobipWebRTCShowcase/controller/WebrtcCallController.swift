import UIKit
import InfobipRTC
import os.log

class WebrtcCallController: MainController {
    @IBOutlet weak var callButton: UIButton!
    @IBOutlet weak var callVideoButton: UIButton!
    
    @IBAction func call(_ sender: Any) {
        self.makeCall(callType: .webrtc_audio)
    }
    
    @IBAction func callVideo(_ sender: Any) {
        self.makeCall(callType: .webrtc_video)
    }
}
