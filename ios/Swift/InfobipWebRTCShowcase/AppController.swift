import UIKit
import InfobipRTC
import os.log

class AppController: UIViewController {
    private let unknown = "Unknown"
    private var state: State = .IDLE
    private var token: String?
    private var identity: String?
    var activeCall: Call?
    
    @IBOutlet weak var statusLabel: UILabel!
    @IBOutlet weak var destinationInput: UITextField!
    @IBOutlet weak var callButton: UIButton!
    @IBOutlet weak var callPhoneButton: UIButton!
    @IBOutlet weak var hangupButton: UIButton!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        self.statusLabel.text = "Connecting..."
        TokenProvider.shared.get { token, error in
            guard let accessToken = token else {
                self.statusLabel.text = "Failed to connect."
                return
            }
            self.statusLabel.text = "Connected as \(accessToken.identity)"
            self.dialPadVisibility(.VISIBLE)
            self.token = accessToken.token
            self.identity = accessToken.identity
            self.createPushRegistry(accessToken.token)
        }
    }

    @IBAction func call(_ sender: Any) {
        self.makeCall()
    }
    
    @IBAction func callPhone(_ sender: Any) {
        self.makeCall(phoneCall: true)
    }
    
    @IBAction func hangup(_ sender: Any) {
        self.activeCall?.hangup()
    }
    
    func dialPadVisibility(_ visibility: DialpadVisibility) {
        let isHidden = visibility == .HIDDEN
        self.destinationInput.isHidden = isHidden
        self.callButton.isHidden = isHidden
        self.callPhoneButton.isHidden = isHidden
    }
    
    private func makeCall(phoneCall: Bool = false) {
        guard let destination = self.destinationInput.text, let token = self.token else {
            os_log("Invalid destination or missing token.")
            return
        }
        let callRequest = CallRequest(token, destination: destination, callDelegate: self)
        do {
            if phoneCall {
                self.activeCall = try InfobipRTC.callPhoneNumber(callRequest)
            } else {
                self.activeCall = try InfobipRTC.call(callRequest)
            }
            self.statusLabel.text = "Calling \(destination)..."
            self.dialPadVisibility(.HIDDEN)
            self.hangupButton.isHidden = false
        } catch {
            os_log("Failed to make a call: %@", error.localizedDescription)
        }
    }
}

extension AppController: CallDelegate {
    func onRinging(_ callRingingEvent: CallRingingEvent) {
        self.statusLabel.text = "Ringing"
    }
    
    func onEarlyMedia(_ callEarlyMediaEvent: CallEarlyMediaEvent) {
        self.statusLabel.text = "Ringing..."
    }
    
    func onEstablished(_ callEstablishedEvent: CallEstablishedEvent) {
        let remote = getRemote()
        self.statusLabel.text = "Active call with: \(remote)"
    }
    
    func onHangup(_ callHangupEvent: CallHangupEvent) {
        self.callCleanup(callHangupEvent.errorCode.description)
    }
    
    func onError(_ callErrorEvent: CallErrorEvent) {
        self.callCleanup(callErrorEvent.reason)
    }
    
    private func callCleanup(_ reason: String) {
        if let call = self.activeCall {
            CallKitAdapter.shared.endCall(call)
        }
        self.dialPadVisibility(.VISIBLE)
        self.hangupButton.isHidden = true
        os_log("Call finished: %@", reason)
        self.statusLabel.text = "Connected as \(self.identity ?? self.unknown)"
    }
    
    private func getRemote() -> String {
        if let call = self.activeCall {
            if call is IncomingCall {
                return call.source().identity
            } else {
                return call.destination().identity
            }
        }
        return unknown
    }
}

enum State {
    case IDLE
    case CONNECTING
    case CONNECTED
}

enum DialpadVisibility {
    case VISIBLE
    case HIDDEN
}

