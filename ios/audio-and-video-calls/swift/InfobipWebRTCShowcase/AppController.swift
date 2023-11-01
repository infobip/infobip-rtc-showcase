import UIKit
import InfobipRTC
import os.log

class AppController: UIViewController {
    
    private let unknown = "Unknown"
    private var state: State = .IDLE
    private var token: String?
    private var identity: String?
    var callType: CallType?
    var activeCall: BasicCall?
    
    @IBOutlet weak var statusLabel: UILabel!
    @IBOutlet weak var destinationInput: UITextField!
    @IBOutlet weak var callButton: UIButton!
    @IBOutlet weak var callVideoButton: UIButton!
    @IBOutlet weak var callPhoneButton: UIButton!
    @IBOutlet weak var hangupButton: UIButton!
    @IBOutlet weak var flipCameraButton: UIButton!
    @IBOutlet weak var toggleCameraVideoButton: UIButton!
    @IBOutlet weak var toggleScreenShareButton: UIButton!

    @IBOutlet weak var localCameraVideoView: UIView!
    @IBOutlet weak var localScreenShareView: UIView!
    @IBOutlet weak var remoteCameraVideoView: UIView!

    @IBOutlet weak var videoButtonsStack: UIStackView!
    @IBOutlet weak var callButtonsStack: UIStackView!
    
    var localCameraView: UIView?
    var localScreenView: UIView?
    var remoteSmallView: UIView?
    var remoteFullView: UIView?
        
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
        self.makeCall(callType: .webrtc_audio)
    }
    
    @IBAction func callVideo(_ sender: Any) {
        self.makeCall(callType: .webrtc_video)
    }
    
    @IBAction func callPhone(_ sender: Any) {
        self.makeCall(callType: .phone_number)
    }
    
    @IBAction func hangup(_ sender: Any) {
        self.activeCall?.hangup()
    }
    
    @IBAction func flipCamera(_ sender: UIButton) {
        if let activeCall = self.activeCall as? WebrtcCall {
            activeCall.cameraOrientation(activeCall.cameraOrientation() == .front ? .back : .front)
        }
    }
    
    @available(iOS 11, *)
    @IBAction func toggleScreenShare(_ sender: UIButton) {
        if let activeCall = self.activeCall as? WebrtcCall {
            do {
                let hasScreenShare = activeCall.hasScreenShare()
                try activeCall.screenShare(screenShare: !hasScreenShare)
            } catch {
                self.showErrorAlert(message: "Something unexpected happened")
            }
        }
    }
    
    @IBAction func toggleCameraVideo(_ sender: UIButton) {
        if let activeCall = self.activeCall as? WebrtcCall {
            do {
                let hasCameraVideo = activeCall.hasCameraVideo()
                try activeCall.cameraVideo(cameraVideo: !hasCameraVideo)
            } catch {
                self.showErrorAlert(message: "Something unexpected happened")
            }
        }
    }
    
    func dialPadVisibility(_ visibility: DialpadVisibility) {
        let isHidden = visibility == .HIDDEN
        self.destinationInput.isHidden = isHidden
        self.callButtonsStack.isHidden = isHidden
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
        do {
            self.callType = callType
            if callType == .phone_number {
                let callRequest = CallPhoneRequest(token, destination, self)
                self.activeCall = try InfobipRTC.callPhone(callRequest)
            } else {
                let callRequest = CallWebrtcRequest(token, destination, self)
                let hasVideo = callType == .webrtc_video
                let webrtcCallOptions = WebrtcCallOptions(video: hasVideo)
                self.activeCall = try InfobipRTC.callWebrtc(callRequest, webrtcCallOptions)
            }
            self.statusLabel.text = "Calling \(destination)..."
            self.dialPadVisibility(.HIDDEN)
            self.hangupButton.isHidden = false
        } catch {
            os_log("Failed to make a call: %@", error.localizedDescription)
        }
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

extension AppController: PhoneCallEventListener, WebrtcCallEventListener {
    
    func onRinging(_ callRingingEvent: CallRingingEvent) {
        self.statusLabel.text = "Ringing"
    }
    
    func onEarlyMedia(_ callEarlyMediaEvent: CallEarlyMediaEvent) {
        self.statusLabel.text = "Ringing"
    }
    
    func onEstablished(_ callEstablishedEvent: CallEstablishedEvent) {
        let remote = getRemote()
        self.statusLabel.text = "In a call with: \(remote)"
        
        if self.callType != .phone_number {
            self.videoButtonsStack.isHidden = false
            self.flipCameraButton.isHidden = !(self.activeCall as! WebrtcCall).hasCameraVideo()
        }
    }
    
    func onHangup(_ callHangupEvent: CallHangupEvent) {
        self.callCleanup(callHangupEvent.errorCode.description)
    }
    
    func onError(_ callErrorEvent: CallErrorEvent) {
        self.callCleanup(callErrorEvent.reason.description)
        self.showErrorAlert(message: callErrorEvent.reason.description)
    }
    
    func onCameraVideoAdded(cameraVideoAddedEvent: CameraVideoAddedEvent) {
        self.addLocalCameraVideoView()
        cameraVideoAddedEvent.track.addRenderer(self.localCameraView!)
        
        self.localCameraVideoView.isHidden = false
        self.flipCameraButton.isHidden = false
        self.turnSpeakerphoneOn()
    }
    
    func onCameraVideoUpdated(cameraVideoUpdatedEvent: CameraVideoUpdatedEvent) {
        cameraVideoUpdatedEvent.track.addRenderer(self.localCameraView!)
    }
    
    func onCameraVideoRemoved() {
        self.hideLocalCameraVideoView()
    }
    
    func onScreenShareAdded(screenShareAddedEvent: ScreenShareAddedEvent) {
        self.addLocalScreenShareView()
        screenShareAddedEvent.track.addRenderer(self.localScreenView!)
        
        self.localScreenShareView.isHidden = false
        self.turnSpeakerphoneOn()
    }
    
    func onScreenShareRemoved() {
        self.hideLocalScreenShareView()
    }
    
    func onRemoteCameraVideoAdded(cameraVideoAddedEvent: CameraVideoAddedEvent) {
        if let webrtcCall = self.activeCall as? WebrtcCall {
            if webrtcCall.hasRemoteScreenShare() {
                self.addRemoteSmallView()
                cameraVideoAddedEvent.track.addRenderer(self.remoteSmallView!)
                self.remoteCameraVideoView.isHidden = false
            } else {
                self.addRemoteFullView()
                cameraVideoAddedEvent.track.addRenderer(self.remoteFullView!)
            }
            
            self.turnSpeakerphoneOn()
        }
    }
    
    func onRemoteCameraVideoRemoved() {
        if let webrtcCall = self.activeCall as? WebrtcCall {
            if webrtcCall.hasRemoteScreenShare() {
                self.hideRemoteSmallView()
            } else {
                self.hideRemoteFullView()
            }
        }
    }

    func onRemoteScreenShareAdded(screenShareAddedEvent: ScreenShareAddedEvent) {
        if let webrtcCall = self.activeCall as? WebrtcCall {
            if webrtcCall.hasRemoteCameraVideo() {
                self.hideRemoteFullView()
                
                self.addRemoteSmallView()
                if let remoteSmallView = self.remoteSmallView {
                    webrtcCall.remoteCameraTrack()?.addRenderer(remoteSmallView)
                }
                
                self.addRemoteFullView()
                if let remoteFullView = self.remoteFullView {
                    screenShareAddedEvent.track.addRenderer(remoteFullView)
                }
            } else {
                self.addRemoteFullView()
                if let remoteFullView = self.remoteFullView {
                    screenShareAddedEvent.track.addRenderer(remoteFullView)
                }
            }
            
            self.turnSpeakerphoneOn()
        }
    }
    
    func onRemoteScreenShareRemoved() {
        if let webrtcCall = self.activeCall as? WebrtcCall {
            self.hideRemoteFullView()
            if webrtcCall.hasRemoteCameraVideo() {
                self.addRemoteFullView()
                if let remoteFullView = self.remoteFullView {
                    webrtcCall.remoteCameraTrack()?.addRenderer(remoteFullView)
                }
                self.hideRemoteSmallView()
            }
        }
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
        if self.localCameraView != nil || self.localScreenView != nil || self.remoteFullView != nil || self.remoteSmallView != nil {
            self.finalizeVideoCallPreview()
        }
        self.dialPadVisibility(.VISIBLE)
        self.videoButtonsStack.isHidden = true
        self.hangupButton.isHidden = true
        os_log("Call finished: %@", reason)
        self.statusLabel.text = "Connected as \(self.identity ?? self.unknown)"
    }
    
    func showErrorAlert(message: String) {
        let alertController = UIAlertController(title: "Error", message: message, preferredStyle: .alert)
        self.present(alertController, animated: true, completion: nil)
        let when = DispatchTime.now() + 2
        DispatchQueue.main.asyncAfter(deadline: when){
            alertController.dismiss(animated: true, completion: nil)
        }
    }
    
    private func getRemote() -> String {
        if let call = self.activeCall {
            return call.counterpart().identifier()
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
    case webrtc_video
    case webrtc_audio
    case phone_number
}

extension UIApplication {
    var statusBarView: UIView? {
        return value(forKey: "statusBar") as? UIView
    }
}
