import UIKit
import InfobipRTC
import os.log

class AppController: UIViewController {
    private let unknown = "Unknown"
    private var state: State = .IDLE
    private var token: String?
    private var identity: String?
    private var callType: CallType?
    var activeCall: Call?
    
    @IBOutlet weak var statusLabel: UILabel!
    @IBOutlet weak var destinationInput: UITextField!
    @IBOutlet weak var callButton: UIButton!
    @IBOutlet weak var callVideoButton: UIButton!
    @IBOutlet weak var callPhoneButton: UIButton!
    @IBOutlet weak var hangupButton: UIButton!
    @IBOutlet weak var flipCameraButton: UIButton!
    @IBOutlet weak var toggleVideoButton: UIButton!
    @IBOutlet weak var localVideoView: UIView!
    @IBOutlet weak var callButtonsStack: UIStackView!
    
    var localView: UIView?
    var remoteView: UIView?
    
    var isCameraFlipped: Bool = false
    
    override func viewDidLoad() {
        super.viewDidLoad()
        self.hideKeyboardWhenTappedAround()
        self.setStatusBarStyle()
        
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
        self.makeCall(callType: .audio)
    }
    
    @IBAction func callPhone(_ sender: Any) {
        self.makeCall(callType: .pstn)
    }
    
    @IBAction func callVideo(_ sender: Any) {
        self.makeCall(callType: .video)
    }
    
    @IBAction func hangup(_ sender: Any) {
        self.activeCall?.hangup()
    }
    
    @IBAction func flipCamera(_ sender: UIButton) {
        self.isCameraFlipped = !isCameraFlipped
        self.activeCall?.cameraOrientation(self.isCameraFlipped ? .back : .front) { localVideoTrack in
            if let local = self.localView {
                localVideoTrack?.addRenderer(local)
            }
        }
    }
    
    @IBAction func toggleVideo(_ sender: UIButton) {
        let hasLocalVideo = self.activeCall?.hasLocalVideo() ?? false
        self.setToggleVideoButtonTitle(hasVideo: !hasLocalVideo)
        self.activeCall?.localVideo(localVideo: !hasLocalVideo)
    }
    
    func dialPadVisibility(_ visibility: DialpadVisibility) {
        let isHidden = visibility == .HIDDEN
        self.destinationInput.isHidden = isHidden
        self.callButton.isHidden = isHidden
        self.callVideoButton.isHidden = isHidden
        self.callPhoneButton.isHidden = isHidden
    }
    
    private func setStatusBarStyle() {
        let sharedApplication = UIApplication.shared
        if #available(iOS 13.0, *) {
            let statusBar = UIView(frame: (sharedApplication.delegate?.window??.windowScene?.statusBarManager?.statusBarFrame)!)
            statusBar.backgroundColor = .orange
            self.view.addSubview(statusBar)
        } else {
            sharedApplication.statusBarView?.backgroundColor = .orange
        }
    }
    
    private func makeCall(callType: CallType) {
        guard let destination = self.destinationInput.text, let token = self.token else {
            os_log("Invalid destination or missing token.")
            return
        }
        let callRequest = CallRequest(token, destination: destination, callDelegate: self)
        do {
            self.callType = callType
            if callType == .pstn {
                self.activeCall = try InfobipRTC.callPhoneNumber(callRequest)
            } else {
                let hasVideo = callType == .video
                let callOptions = CallOptions(video: hasVideo)
                self.activeCall = try InfobipRTC.call(callRequest, callOptions)
            }
            self.statusLabel.text = "Calling \(destination)..."
            self.dialPadVisibility(.HIDDEN)
            self.callButtonsStack.isHidden = false
            self.hangupButton.isHidden = false
            self.flipCameraButton.isHidden = true
            self.toggleVideoButton.isHidden = true
        } catch {
            os_log("Failed to make a call: %@", error.localizedDescription)
        }
    }
    
    private func setToggleVideoButtonTitle(hasVideo: Bool) {
        self.toggleVideoButton.setTitle(hasVideo ? "Disable Video" : "Enable Video", for: .normal)
    }
    
    func hideKeyboardWhenTappedAround() {
        let tap: UITapGestureRecognizer = UITapGestureRecognizer(target: self, action: #selector(self.dismissKeyboard))
        tap.cancelsTouchesInView = false
        view.addGestureRecognizer(tap)
    }
    
    @objc func dismissKeyboard() {
        view.endEditing(true)
    }
}

extension AppController: CallDelegate {
    func onUpdated(_ callUpdatedEvent: CallUpdatedEvent) {
        DispatchQueue.main.async {
            let remoteVideoTrack = callUpdatedEvent.remoteVideoTrack
            if remoteVideoTrack != nil && self.remoteView == nil {
                self.showRemoteVideoView(remoteVideoTrack)
            } else if remoteVideoTrack == nil && self.remoteView != nil {
                self.hideRemoteVideoView()
            }
            
            let localVideoTrack = callUpdatedEvent.localVideoTrack
            if localVideoTrack != nil && self.localView == nil {
                self.showLocalVideoView(localVideoTrack)
            } else if localVideoTrack == nil && self.localView != nil {
                self.hideLocalVideoView()
            }
            
            if localVideoTrack != nil || remoteVideoTrack != nil {
                self.turnSpeakerphoneOn()
            }
        }
    }
    
    func onRinging(_ callRingingEvent: CallRingingEvent) {
        self.statusLabel.text = "Ringing"
    }
    
    func onEarlyMedia(_ callEarlyMediaEvent: CallEarlyMediaEvent) {
        self.statusLabel.text = "Ringing..."
    }
    
    func onEstablished(_ callEstablishedEvent: CallEstablishedEvent) {
        let remote = getRemote()
        self.statusLabel.text = "In a call with: \(remote)"
        
        self.callButtonsStack.isHidden = false
        self.hangupButton.isHidden = false
        if self.callType != .pstn {
            self.toggleVideoButton.isHidden = false
        }
        
        let remoteVideoTrack = callEstablishedEvent.remoteVideoTrack
        if remoteVideoTrack != nil {
            self.showRemoteVideoView(remoteVideoTrack)
        }
        
        let localVideoTrack = callEstablishedEvent.localVideoTrack
        if localVideoTrack != nil {
            self.showLocalVideoView(localVideoTrack)
        } else {
            self.hideLocalVideoView()
        }
        
        self.setToggleVideoButtonTitle(hasVideo: localVideoTrack != nil)
        
        if localVideoTrack != nil || remoteVideoTrack != nil {
            self.turnSpeakerphoneOn()
        }
    }
    
    func onHangup(_ callHangupEvent: CallHangupEvent) {
        self.callCleanup(callHangupEvent.errorCode.description)
    }
    
    func onError(_ callErrorEvent: CallErrorEvent) {
        self.callCleanup(callErrorEvent.reason.description)
    }
    
    private func callCleanup(_ reason: String) {
        if let call = self.activeCall {
            CallKitAdapter.shared.endCall(call)
        }
        if self.localView != nil || self.remoteView != nil {
            self.finalizeVideoCallPreview()
        }
        self.dialPadVisibility(.VISIBLE)
        self.callButtonsStack.isHidden = true
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

enum CallType {
    case video
    case audio
    case pstn
}

extension UIApplication {
    var statusBarView: UIView? {
        return value(forKey: "statusBar") as? UIView
    }
}
