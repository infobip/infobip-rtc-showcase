import UIKit
import InfobipRTC
import os.log

class RoomCallController: UIViewController {
    @IBOutlet weak var connectionStatusLabel: UILabel!
    @IBOutlet weak var roomNameInput: UITextField!
    @IBOutlet weak var joinButton: UIButton!
        
    @IBAction func joinRoom(_ sender: Any) {
        guard let roomName = self.roomNameInput.text else {
            os_log("Invalid room name!")
            return
        }
        
        let activeCallController = self.storyboard?.instantiateViewController(withIdentifier: "ActiveCallController") as! ActiveCallController
        activeCallController.modalPresentationStyle = .fullScreen
        activeCallController.roomName = roomName
        self.present(activeCallController, animated: true, completion: nil)
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        self.connectionStatusLabel.text = "Connecting..."
        TokenProvider.shared.get { token, error in
            guard let accessToken = token else {
                self.connectionStatusLabel.text = "Failed to connect."
                return
            }
            self.connectionStatusLabel.text = "Connected as \(accessToken.identity)"
        }
    }
}
