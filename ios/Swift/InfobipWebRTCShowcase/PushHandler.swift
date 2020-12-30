import PushKit
import InfobipRTC

extension AppController: PKPushRegistryDelegate {
    func pushRegistry(_ registry: PKPushRegistry, didUpdate pushCredentials: PKPushCredentials, for type: PKPushType) {
        if type == .voIP {
            TokenProvider.shared.get { (accessToken, error) in
                do {
                    #if DEBUG
                        try InfobipRTC.enablePushNotification(accessToken!.token, pushCredentials: pushCredentials, debug: true)
                    #else
                        try InfobipRTC.enablePushNotification(accessToken!.token, pushCredentials: pushCredentials)
                    #endif
                } catch {
                    print("Failed to register for push: %@", error.localizedDescription)
                }
            }
        }
    }

    func pushRegistry(_ registry: PKPushRegistry, didReceiveIncomingPushWith payload: PKPushPayload, for type: PKPushType) {
        if type == .voIP {
            if var incomingCall = InfobipRTC.handleIncomingCall(payload) {
                self.activeCall = incomingCall
                self.dialPadVisibility(.HIDDEN)
                incomingCall.delegate = self
                if Runtime.simulator() {
                    showIncomingCall(incomingCall)
                } else {
                    CallKitAdapter.shared.reportIncomingCall(incomingCall)
                    self.hangupButton.isHidden = false
                }
            }
        }
    }

    func pushRegistry(_ registry: PKPushRegistry, didInvalidatePushTokenFor type: PKPushType) {
        TokenProvider.shared.get { (accessToken, error) in
            do {
                try InfobipRTC.disablePushNotification(accessToken!.token)
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
    
    private func showIncomingCall(_ incomingCall: IncomingCall) {
        let hasVideo: Bool = incomingCall.hasRemoteVideo()
        let callType = hasVideo ? "Video" : "Audio"
        let alert = UIAlertController(title: "Incoming " + callType + " Call", message: incomingCall.source().identity, preferredStyle: UIAlertController.Style.alert)

        alert.addAction(UIAlertAction(title: "Accept", style: UIAlertAction.Style.default, handler: {action in
            incomingCall.accept()
        }))
        alert.addAction(UIAlertAction(title: "Decline", style: UIAlertAction.Style.cancel, handler: {action in
            incomingCall.decline()
        }))

        self.present(alert, animated: true, completion: nil)
    }
}
