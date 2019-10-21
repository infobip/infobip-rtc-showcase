import UIKit
import InfobipRTC
import os.log

class ViewController: UIViewController {
    private let unknown = "Unknown"
    private var state: State = .IDLE
    private var token: String?
    private var identity: String?
    private var activeCall: Call?
    
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
    
    private func dialPadVisibility(_ visibility: DialpadVisibility) {
        let isHidden = visibility == .HIDDEN
        self.destinationInput.isHidden = isHidden
        self.callButton.isHidden = isHidden
        self.callPhoneButton.isHidden = isHidden
    }
}

extension ViewController: CallDelegate {
    func onRinging(_ callRingingEvent: CallRingingEvent) {
        self.statusLabel.text = "Ringing"
    }
    
    func onEarlyMedia(_ callEarlyMediaEvent: CallEarlyMediaEvent) {
        self.statusLabel.text = "Ringing..."
    }
    
    func onEstablished(_ callEstablishedEvent: CallEstablishedEvent) {
        self.statusLabel.text = "Active call with: \(self.activeCall?.destination().identity ?? self.unknown)"
    }
    
    func onHangup(_ callHangupEvent: CallHangupEvent) {
        self.callCleanup(callHangupEvent.errorCode.description)
    }
    
    func onError(_ callErrorEvent: CallErrorEvent) {
        self.callCleanup(callErrorEvent.reason)
    }
    
    private func callCleanup(_ reason: String) {
        self.dialPadVisibility(.VISIBLE)
        self.hangupButton.isHidden = true
        os_log("Call finished: %@", reason)
        self.statusLabel.text = "Connected as \(self.identity ?? self.unknown)"
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

