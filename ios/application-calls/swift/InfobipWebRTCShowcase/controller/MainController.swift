import UIKit
import InfobipRTC

class MainController: UIViewController {
    var token: String?
    var identity: String?
    
    @IBOutlet weak var statusLabel: UILabel!
}

enum CallType {
    case application_call_video
    case application_call_audio
}
