import UIKit
import InfobipRTC
import os.log

class MainController: UIViewController {
    @IBOutlet weak var connectionStatusLabel: UILabel!
    @IBOutlet weak var destinationInput: UITextField!
    @IBOutlet weak var audioSwitch: UISwitch!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        self.connectionStatusLabel.text = "Connecting..."
        TokenProvider.shared.get { token, error in
            guard let accessToken = token else {
                self.connectionStatusLabel.text = "Failed to connect."
                return
            }
            self.connectionStatusLabel.text = "Connected as \(accessToken.identity)"
            self.createPushRegistry(accessToken.token)
        }
    }
    
    func makeCall(callType: CallType) {
        guard let destination = self.destinationInput.text else {
            os_log("Invalid destination!")
            return
        }
        
        let callController = self.storyboard?.instantiateViewController(withIdentifier: "CallController") as! CallController
        callController.modalPresentationStyle = .fullScreen
        callController.destination = destination
        callController.callType = callType
        callController.startCallMuted = !self.audioSwitch.isOn
        self.present(callController, animated: true, completion: nil)
    }
    
    func handleIncomingCall(_ destination: String, _ callType: CallType) {
        let callController = self.storyboard?.instantiateViewController(withIdentifier: "CallController") as! CallController
        callController.modalPresentationStyle = .fullScreen
        callController.destination = destination
        callController.callType = callType
        
        self.present(callController, animated: true, completion: nil)
    }
}

enum CallType {
    case webrtc_video
    case webrtc_audio
    case phone
    case room_audio
    case room_video
}
