import UIKit
import InfobipRTC
import os.log

class WebrtcCallController: MainController {

    var activeCall: WebrtcCall?
    
    @IBOutlet weak var destinationInput: UITextField!
    @IBOutlet weak var callButton: UIButton!
    @IBOutlet weak var callVideoButton: UIButton!
    @IBOutlet weak var muteButton: UIButton!
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
        
        TokenProvider.shared.get { token, error in
            guard let accessToken = token else {
                return
            }
            self.createPushRegistry(accessToken.token)
        }
    }
    
    @IBAction func call(_ sender: Any) {
        self.makeCall(callType: .webrtc_audio)
    }
    
    @IBAction func callVideo(_ sender: Any) {
        self.makeCall(callType: .webrtc_video)
    }
    
    @IBAction func hangup(_ sender: Any) {
        self.activeCall?.hangup()
    }
    
    @IBAction func flipCamera(_ sender: UIButton) {
        if let activeCall = self.activeCall {
            activeCall.cameraOrientation(activeCall.cameraOrientation() == .front ? .back : .front)
        }
    }
    
    @available(iOS 11, *)
    @IBAction func toggleScreenShare(_ sender: UIButton) {
        if let activeCall = self.activeCall {
            do {
                let hasScreenShare = activeCall.hasScreenShare()
                try activeCall.screenShare(screenShare: !hasScreenShare)
            } catch {
                self.showErrorAlert(message: "Something unexpected happened")
            }
        }
    }
    
    @IBAction func toggleCameraVideo(_ sender: UIButton) {
        if let activeCall = self.activeCall {
            do {
                let hasCameraVideo = activeCall.hasCameraVideo()
                try activeCall.cameraVideo(cameraVideo: !hasCameraVideo)
            } catch {
                self.showErrorAlert(message: "Something unexpected happened")
            }
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
    
    override func dialPadVisibility(_ visibility: DialpadVisibility) {
        let isHidden = visibility == .HIDDEN
        self.destinationInput.isHidden = isHidden
        self.callButtonsStack.isHidden = isHidden
    }
    
    func handleIncomingCall() {
        self.callType = self.activeCall!.hasCameraVideo() ? .webrtc_video : .webrtc_audio
        self.activeCall?.webrtcCallEventListener = self
        self.statusLabel.text = self.callType == .webrtc_video ? "Incoming video call..." : "Incoming audio call..."
        self.dialPadVisibility(.HIDDEN)
        self.hangupButton.isHidden = false
    }
    
    private func makeCall(callType: CallType) {
        guard let destination = self.destinationInput.text, let token = self.token else {
            os_log("Invalid destination or missing token.")
            return
        }
        do {
            let callRequest = CallWebrtcRequest(token, destination: destination, webrtcCallEventListener: self)
            let hasVideo = callType == .webrtc_video
            let webrtcCallOptions = WebrtcCallOptions(video: hasVideo)
            self.activeCall = try infobipRTC.callWebrtc(callRequest, webrtcCallOptions)
            
            self.statusLabel.text = "Calling \(destination)..."
            self.dialPadVisibility(.HIDDEN)
            self.hangupButton.isHidden = false
        } catch {
            os_log("Failed to make a call: %@", error.localizedDescription)
        }
    }
}

extension WebrtcCallController: PhoneCallEventListener, WebrtcCallEventListener {
    
    func onRinging(_ callRingingEvent: CallRingingEvent) {
        self.statusLabel.text = "Ringing"
    }
    
    func onEarlyMedia(_ callEarlyMediaEvent: CallEarlyMediaEvent) {
        self.statusLabel.text = "Ringing"
    }
    
    func onEstablished(_ callEstablishedEvent: CallEstablishedEvent) {
        let remote = getRemote()
        self.statusLabel.text = "In a call with: \(remote)"
        
        if let activeCall = self.activeCall {
            self.videoButtonsStack.isHidden = false
            self.muteButton.isHidden = false
            self.flipCameraButton.isHidden = !activeCall.hasCameraVideo()
        }
    }
    
    func onHangup(_ callHangupEvent: CallHangupEvent) {
        self.callCleanup(callHangupEvent.errorCode.description)
    }
    
    func onError(_ errorEvent: ErrorEvent) {
        self.showErrorAlert(message: errorEvent.errorCode.description)
    }
    
    func onCameraVideoAdded(_ cameraVideoAddedEvent: CameraVideoAddedEvent) {
        self.addLocalCameraVideoView()
        cameraVideoAddedEvent.track.addRenderer(self.localCameraView!)
        
        self.localCameraVideoView.isHidden = false
        self.flipCameraButton.isHidden = false
        self.turnSpeakerphoneOn()
    }
    
    func onCameraVideoUpdated(_ cameraVideoUpdatedEvent: CameraVideoUpdatedEvent) {
        cameraVideoUpdatedEvent.track.addRenderer(self.localCameraView!)
    }
    
    func onCameraVideoRemoved() {
        self.hideLocalCameraVideoView()
    }
    
    func onScreenShareAdded(_ screenShareAddedEvent: ScreenShareAddedEvent) {
        self.addLocalScreenShareView()
        screenShareAddedEvent.track.addRenderer(self.localScreenView!)
        
        self.localScreenShareView.isHidden = false
        self.turnSpeakerphoneOn()
    }
    
    func onScreenShareRemoved(_ screenShareRemovedEvent: ScreenShareRemovedEvent) {
        self.hideLocalScreenShareView()
    }
    
    func onRemoteCameraVideoAdded(_ cameraVideoAddedEvent: CameraVideoAddedEvent) {
        if let webrtcCall = self.activeCall {
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
        if let webrtcCall = self.activeCall {
            if webrtcCall.hasRemoteScreenShare() {
                self.hideRemoteSmallView()
            } else {
                self.hideRemoteFullView()
            }
        }
    }

    func onRemoteScreenShareAdded(_ screenShareAddedEvent: ScreenShareAddedEvent) {
        if let webrtcCall = self.activeCall {
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
        if let webrtcCall = self.activeCall {
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
        CallKitAdapter.shared.endCall()
        if self.localCameraView != nil || self.localScreenView != nil || self.remoteFullView != nil || self.remoteSmallView != nil {
            self.finalizeVideoCallPreview()
        }
        self.dialPadVisibility(.VISIBLE)
        self.videoButtonsStack.isHidden = true
        self.muteButton.isHidden = true
        self.hangupButton.isHidden = true
        os_log("Webrtc call has finished: %@", reason)
        self.statusLabel.text = "Connected as \(self.identity ?? self.unknown)"
    }
    
    private func getRemote() -> String {
        if let call = self.activeCall {
            return call.counterpart().identifier()
        }
        return unknown
    }
}
