import UIKit
import InfobipRTC
import os.log

class ApplicationCallController: UIViewController {

    var identity: String?
    var token: String?

    var callType: CallType?

    @IBOutlet weak var statusLabel: UILabel!
    @IBOutlet weak var participantsLabel: UILabel!
    
    @IBOutlet weak var muteButton: UIButton!
    @IBOutlet weak var hangupButton: UIButton!
    @IBOutlet weak var flipCameraButton: UIButton!
    @IBOutlet weak var toggleCameraVideoButton: UIButton!
    @IBOutlet weak var toggleScreenShareButton: UIButton!

    @IBOutlet weak var videoButtonsStack: UIStackView!
    @IBOutlet weak var callActionsButtonsStack: UIStackView!
    
    @IBOutlet weak var videosStack: UIStackView!
    
    var videoViews: [String: UIView] = [:]
        
    override func viewDidLoad() {
        super.viewDidLoad()
    
        if getInfobipRTCInstance().getActiveApplicationCall() != nil {
            return self.handleIncomingApplicationCall()
        }
        
        if self.callType == .application_call_audio {
            return self.makeAudioApplicationCall()
        } else if self.callType == .application_call_video {
            return self.makeVideoApplicationCall()
        }
    }
    
    func handleIncomingApplicationCall() {
        getInfobipRTCInstance().getActiveApplicationCall()?.applicationCallEventListener = self
        self.statusLabel.text = self.callType == .application_call_video ? "Incoming video call..." : "Incoming audio call..."
        self.hangupButton.isHidden = false
    }
    
    func makeAudioApplicationCall() {        
        do {
            if let token = self.token {
                let callApplicationRequest = CallApplicationRequest(token, applicationId: Config.applicationId, applicationCallEventListener: self)
                let applicationCallOptions = ApplicationCallOptions(video: false, customData: ["scenario" : "dialog"])
                try getInfobipRTCInstance().callApplication(callApplicationRequest, applicationCallOptions)
                
                self.statusLabel.text = "Calling phone number..."
                self.hangupButton.isHidden = false
            } else {
                self.dismissCurrentView()
            }
        } catch {
            os_log("Failed to make a call: %@", error.localizedDescription)
            self.dismissCurrentView()
        }
    }
    
    func makeVideoApplicationCall() {
        do {
            if let token = self.token {
                let callApplicationRequest = CallApplicationRequest(token, applicationId: Config.applicationId, applicationCallEventListener: self)
                let applicationCallOptions = ApplicationCallOptions(video: true, customData: ["scenario" : "conference"])
                try getInfobipRTCInstance().callApplication(callApplicationRequest, applicationCallOptions)
                
                self.statusLabel.text = "Calling agent..."
                self.hangupButton.isHidden = false
            } else {
                self.dismissCurrentView()
            }
        } catch {
            os_log("Failed to make a call: %@", error.localizedDescription)
            self.dismissCurrentView()
        }
    }
    
    @IBAction func hangup(_ sender: Any) {
        getInfobipRTCInstance().getActiveApplicationCall()?.hangup()
    }
    
    @IBAction func flipCamera(_ sender: UIButton) {
        if let activeCall = getInfobipRTCInstance().getActiveApplicationCall() {
            activeCall.cameraOrientation(activeCall.cameraOrientation() == .front ? .back : .front)
        }
    }
    
    @available(iOS 11, *)
    @IBAction func toggleScreenShare(_ sender: UIButton) {
        if let activeCall = getInfobipRTCInstance().getActiveApplicationCall() {
            do {
                let hasScreenShare = activeCall.hasScreenShare()
                try activeCall.screenShare(screenShare: !hasScreenShare)
            } catch {
                self.showErrorAlert(message: "Something unexpected happened")
            }
        }
    }
    
    @IBAction func toggleCameraVideo(_ sender: UIButton) {
        if let activeCall = getInfobipRTCInstance().getActiveApplicationCall() {
            do {
                let hasCameraVideo = activeCall.hasCameraVideo()
                try activeCall.cameraVideo(cameraVideo: !hasCameraVideo)
            } catch {
                self.showErrorAlert(message: "Something unexpected happened")
            }
        }
    }
    
    @IBAction func mute(_ sender: UIButton) {
        if let activeCall = getInfobipRTCInstance().getActiveApplicationCall() {
            do {
                let isMuted = activeCall.muted()
                try activeCall.mute(!isMuted)
                self.muteButton.setTitle(isMuted ? "Mute" : "Unmute", for: .normal)
            } catch {
                self.showErrorAlert(message: "Something unexpected happened")
            }
        }
    }
    
    func showErrorAlert(message: String) {
        let alertController = UIAlertController(title: "Error", message: message, preferredStyle: .alert)
        self.present(alertController, animated: true, completion: nil)
        DispatchQueue.main.asyncAfter(deadline: DispatchTime.now() + 2){
            alertController.dismiss(animated: true, completion: nil)
        }
    }
    
    private func updateParticipantsLabel() {
        if let activeCall = getInfobipRTCInstance().getActiveApplicationCall() {
            if (activeCall.participants().count > 0) {
                self.participantsLabel.text = "Participants (\(activeCall.participants().count)): \(activeCall.participants().map {$0.endpoint.identifier() }.joined(separator: ", "))"
            }
        }
    }
    
    private func dismissCurrentView() {
        DispatchQueue.main.async {
            self.dismiss(animated: false, completion: nil)
        }
    }
}

extension ApplicationCallController: ApplicationCallEventListener {
    func onRinging(_ callRingingEvent: CallRingingEvent) {
        self.statusLabel.text = "Ringing"
    }
    
    func onEarlyMedia(_ callEarlyMediaEvent: CallEarlyMediaEvent) {
        self.statusLabel.text = "Ringing"
    }
    
    func onEstablished(_ callEstablishedEvent: CallEstablishedEvent) {
        self.statusLabel.text = "Established"
        
        if let activeCall = getInfobipRTCInstance().getActiveApplicationCall() {
            self.videoButtonsStack.isHidden = self.callType == .application_call_audio
            self.muteButton.isHidden = false
            self.flipCameraButton.isHidden = !activeCall.hasCameraVideo()
        }
    }
    
    func onHangup(_ callHangupEvent: CallHangupEvent) {
        self.callCleanup(callHangupEvent.errorCode.description)
        self.dismissCurrentView()
    }
    
    func onError(_ errorEvent: ErrorEvent) {
        self.showErrorAlert(message: errorEvent.errorCode.description)
    }
    
    func onConferenceJoined(_ conferenceJoinedEvent: ConferenceJoinedEvent) {
        let conferenceId = conferenceJoinedEvent.id
        self.statusLabel.text = "Conference joined, conferenceId: \(conferenceId)"
        self.updateParticipantsLabel()
    }
    
    func onConferenceLeft(_ conferenceLeftEvent: ConferenceLeftEvent) {
        let errorCode = conferenceLeftEvent.errorCode
        self.statusLabel.text = "Conference left, errorCode: \(errorCode.name)"
        self.callCleanupAfterLeavingConferenceOrDialog(errorCode.description)
    }
    
    func onDialogJoined(_ dialogJoinedEvent: DialogJoinedEvent) {
        let dialogId = dialogJoinedEvent.id
        self.statusLabel.text = "Dialog joined, dialogId: \(dialogId)"
        self.updateParticipantsLabel()
    }
    
    func onDialogLeft(_ dialogLeftEvent: DialogLeftEvent) {
        let errorCode = dialogLeftEvent.errorCode
        self.statusLabel.text = "Dialog left, errorCode: \(errorCode.name)"
        self.callCleanupAfterLeavingConferenceOrDialog(errorCode.description)
    }
    
    func onReconnecting(_ callReconnectingEvent: CallReconnectingEvent) {
        //disabled by default
        self.statusLabel.text = "Reconnecting"
    }
    
    func onReconnected(_ callReconnectedEvent: CallReconnectedEvent) {
        //disabled by default
        self.statusLabel.text = "Reconnected"
    }
    
    func onCameraVideoAdded(_ cameraVideoAddedEvent: CameraVideoAddedEvent) {
        self.addVideo(self.identity!, "camera-video")
        cameraVideoAddedEvent.track.addRenderer(self.videoViews["\(self.identity!)-camera-video"]!)
        
        self.flipCameraButton.isHidden = false
        self.turnSpeakerphoneOn()
    }
    
    func onCameraVideoUpdated(_ cameraVideoUpdatedEvent: CameraVideoUpdatedEvent) {
        cameraVideoUpdatedEvent.track.addRenderer(self.videoViews["\(self.identity!)-camera-video"]!)
    }
    
    func onCameraVideoRemoved() {
        self.removeVideo(self.identity!, "camera-video")
        self.flipCameraButton.isHidden = true
    }
    
    func onScreenShareAdded(_ screenShareAddedEvent: ScreenShareAddedEvent) {
        self.addVideo(self.identity!, "screen-share")
        screenShareAddedEvent.track.addRenderer(self.videoViews["\(self.identity!)-screen-share"]!)
        self.turnSpeakerphoneOn()
    }
    
    func onScreenShareRemoved(_ screenShareRemovedEvent: ScreenShareRemovedEvent) {
        self.removeVideo(self.identity!, "screen-share")
    }
    
    func onParticipantJoining(_ participantJoiningEvent: ParticipantJoiningEvent) {
        self.statusLabel.text = "\(self.getIdentifier(participantJoiningEvent.participant)) is joining"
    }
    
    func onParticipantJoined(_ participantJoinedEvent: ParticipantJoinedEvent) {
        self.statusLabel.text = "\(self.getIdentifier(participantJoinedEvent.participant)) has joined"
        self.updateParticipantsLabel()
    }
    
    func onParticipantLeft(_ participantLeftEvent: ParticipantLeftEvent) {
        self.statusLabel.text = "\(self.getIdentifier(participantLeftEvent.participant)) has left"
        self.updateParticipantsLabel()
    }
    
    func onParticipantCameraVideoAdded(_ participantCameraVideoAddedEvent: ParticipantCameraVideoAddedEvent) {
        self.addVideo(self.getIdentifier(participantCameraVideoAddedEvent.participant), "camera-video")
        participantCameraVideoAddedEvent.track.addRenderer(self.videoViews["\(self.getIdentifier(participantCameraVideoAddedEvent.participant))-camera-video"]!)
    }
    
    func onParticipantCameraVideoRemoved(_ participantCameraVideoRemovedEvent: ParticipantCameraVideoRemovedEvent) {
        self.removeVideo(self.getIdentifier(participantCameraVideoRemovedEvent.participant), "camera-video")
    }
    
    func onParticipantScreenShareAdded(_ participantScreenShareAddedEvent: ParticipantScreenShareAddedEvent) {
        self.addVideo(self.getIdentifier(participantScreenShareAddedEvent.participant), "screen-share")
        participantScreenShareAddedEvent.track.addRenderer(self.videoViews["\(self.getIdentifier(participantScreenShareAddedEvent.participant))-screen-share"]!)
    }
    
    func onParticipantScreenShareRemoved(_ participantScreenShareRemovedEvent: ParticipantScreenShareRemovedEvent) {
        self.removeVideo(self.getIdentifier(participantScreenShareRemovedEvent.participant), "screen-share")
    }
    
    func onParticipantMuted(_ participantMutedEvent: ParticipantMutedEvent) {
        self.statusLabel.text = "\(self.getIdentifier(participantMutedEvent.participant)) has been muted"
    }
    
    func onParticipantUnmuted(_ participantUnmutedEvent: ParticipantUnmutedEvent) {
        self.statusLabel.text = "\(self.getIdentifier(participantUnmutedEvent.participant)) has been unmuted"
    }
    
    func onParticipantDeaf(_ participantDeafEvent: ParticipantDeafEvent) {
        os_log("Participant %@ has been deafened", self.getIdentifier(participantDeafEvent.participant))
    }
    
    func onParticipantUndeaf(_ participantUndeafEvent: ParticipantUndeafEvent) {
        os_log("Participant %@ has been undeafened", self.getIdentifier(participantUndeafEvent.participant))
    }
    
    func onParticipantStartedTalking(_ participantStartedTalkingEvent: ParticipantStartedTalkingEvent) {
        os_log("Participant %@ started talking", self.getIdentifier(participantStartedTalkingEvent.participant))
    }
    
    func onParticipantStoppedTalking(_ participantStoppedTalkingEvent: ParticipantStoppedTalkingEvent) {
        os_log("Participant %@ stopped talking", self.getIdentifier(participantStoppedTalkingEvent.participant))
    }
    
    private func callCleanup(_ reason: String) {
        CallKitAdapter.shared.endCall()
        self.finalizeLocalVideosPreview()
        self.videoButtonsStack.isHidden = true
        self.muteButton.isHidden = true
        self.hangupButton.isHidden = true
        
        os_log("Application call has ended: %@", reason)
    }
    
    private func callCleanupAfterLeavingConferenceOrDialog(_ reason: String) {
        self.finalizeRemoteVideosPreview()
        self.participantsLabel.text = ""
        
        os_log("Application call has left a conference or dialog: %@", reason)
    }
    
    private func getIdentifier(_ participant: Participant) -> String {
        return participant.endpoint.identifier()
    }
}
