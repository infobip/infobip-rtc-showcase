import UIKit
import InfobipRTC

class CustomerController: MainController {
    
    @IBOutlet weak var callPhoneButton: UIButton!
    @IBOutlet weak var videoCallAgentButton: UIButton!
    
    @IBAction func callPhone(_ sender: UIButton) {
        self.makeCall(.application_call_audio)
    }
    
    @IBAction func videoCallAgent(_ sender: UIButton) {
        self.makeCall(.application_call_video)
    }
    
    func makeCall(_ callType: CallType) {
        let applicationCallController = self.storyboard?.instantiateViewController(withIdentifier: "ApplicationCallController") as! ApplicationCallController
        applicationCallController.modalPresentationStyle = .fullScreen
        applicationCallController.callType = callType
        applicationCallController.identity = self.identity
        applicationCallController.token = self.token

        self.present(applicationCallController, animated: true, completion: nil)
    }
}
