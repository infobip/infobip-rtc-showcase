import UIKit
import InfobipRTC

class MainController: UIViewController {
    
    let infobipRTC: InfobipRTC = getInfobipRTCInstance()
    
    let unknown = "Unknown"
    var token: String?
    var identity: String?
    var callType: CallType?
    
    @IBOutlet weak var statusLabel: UILabel!

    override func viewDidLoad() {
        super.viewDidLoad()
        
        self.statusLabel.text = "Connecting..."
        TokenProvider.shared.get { token, error in
            guard let accessToken = token else {
                self.statusLabel.text = "Failed to connect."
                return
            }
            self.statusLabel.text = "Connected as \(accessToken.identity)"
            self.dialPadVisibility(.VISIBLE)
            self.token = accessToken.token
            self.identity = accessToken.identity
        }
    }
    
    func showErrorAlert(message: String) {
        let alertController = UIAlertController(title: "Error", message: message, preferredStyle: .alert)
        self.present(alertController, animated: true, completion: nil)
        let when = DispatchTime.now() + 2
        DispatchQueue.main.asyncAfter(deadline: when){
            alertController.dismiss(animated: true, completion: nil)
        }
    }
    
    func dialPadVisibility(_ visibility: DialpadVisibility) {}
}

enum DialpadVisibility {
    case VISIBLE
    case HIDDEN
}

enum CallType {
    case webrtc_video
    case webrtc_audio
    case phone_number
    case room_audio
    case room_video
}

extension UIView {
    var id: String? {
        get {
            return self.accessibilityIdentifier
        }
        set {
            self.accessibilityIdentifier = newValue
        }
    }
}
