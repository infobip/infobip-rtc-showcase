import UIKit

class TabBarController: UITabBarController, UITabBarControllerDelegate {

    override func viewDidLoad() {
        super.viewDidLoad()
        self.delegate = self
        self.selectedIndex = 0
        self.connectOnTabSelected(self.selectedIndex)
    }
    
    func tabBarController(_ tabBarController: UITabBarController, didSelect viewController: UIViewController) {
        self.connectOnTabSelected(self.selectedIndex)
    }
    
    func connectOnTabSelected(_ selectedIndex: Int) {
        if selectedIndex == 0, let customerController = self.viewControllers?.first as? CustomerController {
            if customerController.identity == nil || customerController.identity!.starts(with: "agent") {
                customerController.statusLabel.text = "Connecting..."
                TokenProvider.shared.get { token, error in
                    guard let accessToken = token else {
                        customerController.statusLabel.text = "Failed to connect."
                        return
                    }
                    customerController.statusLabel.text = "Connected as \(accessToken.identity)"
                    customerController.token = accessToken.token
                    customerController.identity = accessToken.identity
                }
            }
        } else if selectedIndex == 1, let agentController = self.viewControllers?.last as? AgentController {
            if agentController.identity == nil || agentController.identity!.starts(with: "user") {
                agentController.statusLabel.text = "Connecting..."
                TokenProvider.shared.get(identity: "agent") { token, error in
                    guard let accessToken = token else {
                        agentController.statusLabel.text = "Failed to connect."
                        return
                    }
                    agentController.createPushRegistry(accessToken.token)
                    agentController.statusLabel.text = "Connected as \(accessToken.identity)"
                    agentController.token = accessToken.token
                    agentController.identity = accessToken.identity
                }
            }
        }
    }
}
