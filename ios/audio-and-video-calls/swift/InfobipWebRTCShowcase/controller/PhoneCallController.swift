import UIKit
import InfobipRTC
import os.log

class PhoneCallController: MainController {
    @IBOutlet weak var callPhoneButton: UIButton!
    
    @IBAction func callPhone(_ sender: Any) {
        self.makeCall(callType: .phone)
    }
}
