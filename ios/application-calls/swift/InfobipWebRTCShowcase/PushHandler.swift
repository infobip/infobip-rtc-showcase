import PushKit
import InfobipRTC

extension AgentController: PKPushRegistryDelegate, IncomingApplicationCallEventListener {
    func pushRegistry(_ registry: PKPushRegistry, didUpdate pushCredentials: PKPushCredentials, for type: PKPushType) {
        if type == .voIP {
            TokenProvider.shared.get(identity: "agent") { (accessToken, error) in
                do {
                    #if DEBUG
                    try getInfobipRTCInstance().enablePushNotification(accessToken!.token, pushCredentials: pushCredentials, debug: true, pushConfigId: Config.pushConfigId)
                    #else
                    try getInfobipRTCInstance().enablePushNotification(accessToken!.token, pushCredentials: pushCredentials, pushConfigId: Config.pushConfigId)
                    #endif
                } catch {
                    print("Failed to register for push: %@", error.localizedDescription)
                }
            }
        }
    }

    func pushRegistry(_ registry: PKPushRegistry, didReceiveIncomingPushWith payload: PKPushPayload, for type: PKPushType) {
        if type == .voIP {
            if getInfobipRTCInstance().isIncomingApplicationCall(payload) {
                getInfobipRTCInstance().handleIncomingApplicationCall(payload, self)
            }
        }
    }

    func pushRegistry(_ registry: PKPushRegistry, didInvalidatePushTokenFor type: PKPushType) {
        TokenProvider.shared.get(identity: "agent") { (accessToken, error) in
            do {
                try getInfobipRTCInstance().disablePushNotification(accessToken!.token)
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
    
    private func handleIncomingCallOnSimulator(_ incomingCall: IncomingApplicationCall) {
        let alert = UIAlertController(title: "Incoming Application Call", message: incomingCall.from, preferredStyle: .alert)
                
        alert.addAction(UIAlertAction(title: "Accept", style: .default, handler: {action in
            let applicationCallOptions = ApplicationCallOptions(video: true)
            incomingCall.accept(applicationCallOptions)
            self.handleIncomingCall()
        }))
        alert.addAction(UIAlertAction(title: "Decline", style: .cancel, handler: {action in
            incomingCall.decline(DeclineOptions(true))
        }))
        
        alert.modalPresentationStyle = .overFullScreen
        self.present(alert, animated: true, completion: nil)
    }
    
    func onIncomingApplicationCall(_ incomingApplicationCallEvent: IncomingApplicationCallEvent) {
        let incomingApplicationCall = incomingApplicationCallEvent.incomingApplicationCall
        
        if Runtime.simulator() {
            self.handleIncomingCallOnSimulator(incomingApplicationCall)
        } else {
            self.handleIncomingCall()
            CallKitAdapter.shared.reportIncomingCall(incomingApplicationCall)
        }
    }
}
