import UIKit
import InfobipRTC

class AgentController: MainController {
        
    func handleIncomingCall() {
        let applicationCallController = self.storyboard?.instantiateViewController(withIdentifier: "ApplicationCallController") as! ApplicationCallController
        applicationCallController.modalPresentationStyle = .fullScreen
        applicationCallController.callType = .application_call_video
        applicationCallController.identity = self.identity
        applicationCallController.token = self.token

        self.present(applicationCallController, animated: true, completion: nil)
    }
}
