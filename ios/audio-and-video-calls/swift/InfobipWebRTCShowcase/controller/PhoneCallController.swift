import UIKit
import InfobipRTC
import os.log

class PhoneCallController: MainController {
    
    var activeCall: PhoneCall?
    
    @IBOutlet weak var destinationInput: UITextField!
    @IBOutlet weak var callPhoneButton: UIButton!
    @IBOutlet weak var muteButton: UIButton!
    @IBOutlet weak var hangupButton: UIButton!
        
    override func viewDidLoad() {
        super.viewDidLoad()
    }

    @IBAction func callPhone(_ sender: Any) {
        guard let destination = self.destinationInput.text, let token = self.token else {
            os_log("Invalid destination or missing token.")
            return
        }
        
        do {
            let callRequest = CallPhoneRequest(token, destination: destination, phoneCallEventListener: self)
            self.activeCall = try infobipRTC.callPhone(callRequest)

            self.statusLabel.text = "Calling \(destination)..."
            self.dialPadVisibility(.HIDDEN)
            self.hangupButton.isHidden = false
        } catch {
            os_log("Failed to make a call: %@", error.localizedDescription)
        }
    }
    
    @IBAction func mute(_ sender: UIButton) {
        if let activeCall = self.activeCall {
            do {
                let isMuted = activeCall.muted()
                try activeCall.mute(!isMuted)
                self.muteButton.setTitle(isMuted ? "Mute" : "Unmute", for: .normal)
            } catch {
                self.showErrorAlert(message: "Something unexpected happened")
            }
        }
    }
    
    @IBAction func hangup(_ sender: Any) {
        self.activeCall?.hangup()
    }
    
    override func dialPadVisibility(_ visibility: DialpadVisibility) {
        let isHidden = visibility == .HIDDEN
        self.destinationInput.isHidden = isHidden
        self.callPhoneButton.isHidden = isHidden
    }
}

extension PhoneCallController: PhoneCallEventListener {
    
    func onRinging(_ callRingingEvent: CallRingingEvent) {
        self.statusLabel.text = "Ringing"
    }
    
    func onEarlyMedia(_ callEarlyMediaEvent: CallEarlyMediaEvent) {
        self.statusLabel.text = "Ringing"
    }
    
    func onEstablished(_ callEstablishedEvent: CallEstablishedEvent) {
        let remote = getRemote()
        self.statusLabel.text = "In a call with: \(remote)"
        self.muteButton.isHidden = false
    }
    
    func onHangup(_ callHangupEvent: CallHangupEvent) {
        self.callCleanup(callHangupEvent.errorCode.description)
    }
    
    func onError(_ errorEvent: ErrorEvent) {
        self.callCleanup(errorEvent.errorCode.description)
        self.showErrorAlert(message: errorEvent.errorCode.description)
    }
    
    func onRemoteMuted() {
        self.statusLabel.text = "Remote participant is muted"
    }
    
    func onRemoteUnmuted() {
        self.statusLabel.text = "Remote participant is unmuted"
    }
    
    private func callCleanup(_ reason: String) {
        if let call = self.activeCall {
            CallKitAdapter.shared.endCall(call)
        }
        
        self.dialPadVisibility(.VISIBLE)
        self.muteButton.isHidden = true
        self.hangupButton.isHidden = true
        os_log("Phone call has finished: %@", reason)
        self.statusLabel.text = "Connected as \(self.identity ?? self.unknown)"
    }
    
    private func getRemote() -> String {
        if let call = self.activeCall {
            return call.counterpart().identifier()
        }
        return self.unknown
    }
}
