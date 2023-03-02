import PushKit
import InfobipRTC

extension WebrtcCallController: PKPushRegistryDelegate, IncomingCallEventListener {
    func pushRegistry(_ registry: PKPushRegistry, didUpdate pushCredentials: PKPushCredentials, for type: PKPushType) {
        if type == .voIP {
            TokenProvider.shared.get { (accessToken, error) in
                do {
                    #if DEBUG
                    try self.infobipRTC.enablePushNotification(accessToken!.token, pushCredentials: pushCredentials, debug: true)
                    #else
                    try self.infobipRTC.enablePushNotification(accessToken!.token, pushCredentials: pushCredentials)
                    #endif
                } catch {
                    print("Failed to register for push: %@", error.localizedDescription)
                }
            }
        }
    }

    func pushRegistry(_ registry: PKPushRegistry, didReceiveIncomingPushWith payload: PKPushPayload, for type: PKPushType) {
        if type == .voIP {
            if infobipRTC.isIncomingCall(payload) {
                infobipRTC.handleIncomingCall(payload, self)
            }
        }
    }

    func pushRegistry(_ registry: PKPushRegistry, didInvalidatePushTokenFor type: PKPushType) {
        TokenProvider.shared.get { (accessToken, error) in
            do {
                try self.infobipRTC.disablePushNotification(accessToken!.token)
            } catch {
                print("Failed to disable push notifications.")
            }
        }
    }

    func createPushRegistry(_ token: String) {
        let voipRegistry = Runtime.simulator() ? InfobipSimulator(token: token) : PKPushRegistry(queue: DispatchQueue.main)
        voipRegistry.desiredPushTypes = [PKPushType.voIP]
        voipRegistry.delegate = self
    }
    
    private func handleIncomingCallOnSimulator(_ incomingCall: IncomingWebrtcCall) {
        let alert = UIAlertController(title: "Incoming Call", message: incomingCall.source().identifier(), preferredStyle: UIAlertController.Style.alert)
                
        alert.addAction(UIAlertAction(title: "Accept", style: UIAlertAction.Style.default, handler: {action in
            incomingCall.accept()
        }))
        alert.addAction(UIAlertAction(title: "Decline", style: UIAlertAction.Style.cancel, handler: {action in
            incomingCall.decline(DeclineOptions(true))
        }))
        
        self.present(alert, animated: true, completion: nil)
    }
    
    func onIncomingWebrtcCall(_ incomingWebrtcCallEvent: IncomingWebrtcCallEvent) {
        self.tabBarController?.selectedIndex = 0
        
        let incomingWebrtcCall = incomingWebrtcCallEvent.incomingWebrtcCall
        self.activeCall = incomingWebrtcCall
        self.handleIncomingCall()
        
        if Runtime.simulator() {
            self.handleIncomingCallOnSimulator(incomingWebrtcCall)
        } else {
            CallKitAdapter.shared.reportIncomingCall(incomingWebrtcCall)
        }
    }
}
