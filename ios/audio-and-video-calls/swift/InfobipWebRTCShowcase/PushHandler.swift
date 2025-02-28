import PushKit
import InfobipRTC

extension MainController: PKPushRegistryDelegate, IncomingCallEventListener {
    func pushRegistry(_ registry: PKPushRegistry, didUpdate pushCredentials: PKPushCredentials, for type: PKPushType) {
        if type == .voIP {
            TokenProvider.shared.get { accessToken, error in
#if DEBUG
                getInfobipRTCInstance().enablePushNotification(accessToken!.token, pushCredentials: pushCredentials, debug: true, pushConfigId: Config.pushConfigId)
#else
                getInfobipRTCInstance().enablePushNotification(accessToken!.token, pushCredentials: pushCredentials, Config.pushConfigId)
#endif
            }
        }
    }
    
    func pushRegistry(_ registry: PKPushRegistry, didReceiveIncomingPushWith payload: PKPushPayload, for type: PKPushType) {
        if type == .voIP {
            if getInfobipRTCInstance().isIncomingCall(payload) {
                getInfobipRTCInstance().handleIncomingCall(payload, self)
            }
        }
    }
    
    func pushRegistry(_ registry: PKPushRegistry, didInvalidatePushTokenFor type: PKPushType) {
        TokenProvider.shared.get { accessToken, error in
            getInfobipRTCInstance().disablePushNotification(accessToken!.token)
        }
    }
    
    func createPushRegistry(_ token: String) {
        let voipRegistry = Runtime.simulator() ? InfobipSimulator(token: token) : PKPushRegistry(queue: DispatchQueue.main)
        voipRegistry.desiredPushTypes = [PKPushType.voIP]
        voipRegistry.delegate = self
    }
    
    private func handleIncomingCallOnSimulator(_ incomingCall: IncomingWebrtcCall) {
        let alert = UIAlertController(title: "Incoming Call", message: incomingCall.source().identifier(), preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Accept", style: .default, handler: {action in
            incomingCall.accept(WebrtcCallOptions(autoReconnect: true))
            let callType = incomingCall.hasRemoteCameraVideo() ? CallType.webrtc_video : CallType.webrtc_audio
            self.handleIncomingCall(incomingCall.counterpart().identifier(), callType)
        }))
        alert.addAction(UIAlertAction(title: "Decline", style: .cancel, handler: {action in
            incomingCall.decline(DeclineOptions(true))
        }))
        
        self.present(alert, animated: true, completion: nil)
    }
    
    func onIncomingWebrtcCall(_ incomingWebrtcCallEvent: IncomingWebrtcCallEvent) {
        DispatchQueue.main.async {
            self.tabBarController?.selectedIndex = 0
            let incomingWebrtcCall = incomingWebrtcCallEvent.incomingWebrtcCall
            if Runtime.simulator() {
                self.handleIncomingCallOnSimulator(incomingWebrtcCall)
            } else {
                CallKitAdapter.shared.reportIncomingCall(incomingWebrtcCall)
            }
        }
    }
}
