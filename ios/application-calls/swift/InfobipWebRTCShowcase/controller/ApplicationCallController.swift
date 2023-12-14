import UIKit
import InfobipRTC
import os.log

class ApplicationCallController: UIViewController {
    private static var CAMERA = "camera"
    private static var SCREEN_SHARE = "screen-share"
    private static var LOCAL = "local"
    
    private static var AUDIO_QUALITY_MODES: [AudioQualityMode:String] = [
        .auto: "Auto",
        .highQuality: "High Quality",
        .lowData: "Low Data"
    ]
    
    @IBOutlet weak var callStatusLabel: UILabel!
    @IBOutlet weak var destinationLabel: UILabel!
    
    @IBOutlet weak var participantsTitleLabel: UILabel!
    @IBOutlet weak var participantsTableView: UITableView!
    
    @IBOutlet weak var remoteVideosTitleLabel: UILabel!
    @IBOutlet weak var remoteVideosCollectionView: UICollectionView!
    
    @IBOutlet weak var localVideosTitleLabel: UILabel!
    @IBOutlet weak var localVideosCollectionView: UICollectionView!
    
    @IBOutlet weak var muteButton: UIButton!
    @IBOutlet weak var audioButtonsStack: UIStackView!
    @IBOutlet weak var videoButtonsStack: UIStackView!
    @IBOutlet weak var toggleCameraVideoButton: UIButton!
    @IBOutlet weak var toggleScreenShareButton: UIButton!
    @IBOutlet weak var flipCameraButton: UIButton!
    @IBOutlet weak var hangupButton: UIButton!
    
    var identity: String?
    var token: String?
    var callType: CallType?
    
    var localVideoViews: [Video] = []
    var remoteVideoViews: [Video] = []
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        self.participantsTableView.delegate = self
        self.participantsTableView.dataSource = self
        
        self.localVideosCollectionView.delegate = self
        self.localVideosCollectionView.dataSource = self
        
        self.remoteVideosCollectionView.delegate = self
        self.remoteVideosCollectionView.dataSource = self
        
        if getInfobipRTCInstance().getActiveApplicationCall() != nil {
            return self.handleIncomingApplicationCallOnSimulator()
        }
        
        if self.callType == .application_call_audio {
            return self.makeAudioApplicationCall()
        } else if self.callType == .application_call_video {
            return self.makeVideoApplicationCall()
        }
    }
    
    func handleIncomingApplicationCallOnSimulator() {
        getInfobipRTCInstance().getActiveApplicationCall()?.applicationCallEventListener = self
        self.showIncomingCallLayout()
    }
    
    func makeAudioApplicationCall() {
        do {
            if let token = self.token {
                let callApplicationRequest = CallApplicationRequest(token, applicationId: Config.applicationId, applicationCallEventListener: self)
                let applicationCallOptions = ApplicationCallOptions(video: false, customData: ["scenario" : "dialog"])
                let _ = try getInfobipRTCInstance().callApplication(callApplicationRequest, applicationCallOptions)
                self.showOutgoingCallLayout()
            } else {
                os_log("Missing token")
                self.callStatusLabel.text = "Missing token"
                self.dismissCurrentView()
            }
        } catch {
            os_log("Failed to make a call: %@", error.localizedDescription)
            self.callStatusLabel.text = error.localizedDescription
            self.dismissCurrentView()
        }
    }
    
    func makeVideoApplicationCall() {
        do {
            if let token = self.token {
                let callApplicationRequest = CallApplicationRequest(token, applicationId: Config.applicationId, applicationCallEventListener: self)
                let applicationCallOptions = ApplicationCallOptions(video: true, customData: ["scenario" : "conference"])
                let _ = try getInfobipRTCInstance().callApplication(callApplicationRequest, applicationCallOptions)
                self.showOutgoingCallLayout()
            } else {
                os_log("Missing token")
                self.callStatusLabel.text = "Missing token"
                self.dismissCurrentView()
            }
        } catch {
            os_log("Failed to make a call: %@", error.localizedDescription)
            self.callStatusLabel.text = error.localizedDescription
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
                self.participantsTableView.reloadData()
            } catch {
                self.showErrorAlert(message: "Something unexpected happened")
            }
        }
    }
    
    @IBAction func openAudioQualityModeAlert(_ sender: UIButton) {
        let title = "Audio Quality Mode"
        let message = "Select your preferred mode"
        let alert = UIAlertController(title: title, message: message, preferredStyle: .actionSheet)
        for audioQualityMode in ApplicationCallController.AUDIO_QUALITY_MODES {
            alert.addAction(UIAlertAction(title: audioQualityMode.value, style: .default) {_ in
                if let mode = AudioQualityMode(rawValue: audioQualityMode.key.rawValue) {
                    self.changeAudioQualityMode(mode)
                }
            })
        }
        alert.addAction(UIAlertAction(title: "Dismiss", style: .cancel))

        self.present(alert, animated: true)
    }
        
    func changeAudioQualityMode(_ mode: AudioQualityMode) {
        if let activeCall = getInfobipRTCInstance().getActiveApplicationCall() {
            activeCall.audioQualityMode(mode)
        }
    }
    
    private func showOutgoingCallLayout() {
        self.callStatusLabel.text = "Calling..."
        self.destinationLabel.text = Config.applicationId
        self.destinationLabel.isHidden = false
        self.hangupButton.isHidden = false
        self.audioButtonsStack.isHidden = true
        self.videoButtonsStack.isHidden = true
    }
    
    private func showIncomingCallLayout() {
        self.callStatusLabel.text = "Incoming \(self.callType == .application_call_video ? "video" : "audio") call"
        self.destinationLabel.text = Config.applicationId
        self.destinationLabel.isHidden = false
        self.hangupButton.isHidden = true
        self.audioButtonsStack.isHidden = true
        self.videoButtonsStack.isHidden = true
    }
    
    private func showActiveCallLayout() {
        self.callStatusLabel.text = "In a call"
        self.audioButtonsStack.isHidden = false
        self.hangupButton.isHidden = false
        self.videoButtonsStack.isHidden = self.callType != .application_call_video
        let activeApplicationCall = getInfobipRTCInstance().getActiveApplicationCall()!
        self.flipCameraButton.isHidden = !activeApplicationCall.hasCameraVideo()
        self.muteButton.setTitle("Mute", for: .normal)
    }
    
    private func updateParticipants() {
        DispatchQueue.main.async {
            let participants = getInfobipRTCInstance().getActiveApplicationCall()!.participants()
            self.participantsTitleLabel.isHidden = participants.isEmpty
            self.participantsTableView.isHidden = participants.isEmpty
            self.participantsTitleLabel.text = "Participants (\(participants.count))"
            self.participantsTableView.reloadData()
        }
    }
    
    private func updateRemoteVideos() {
        DispatchQueue.main.async {
            self.remoteVideosTitleLabel.isHidden = self.remoteVideoViews.isEmpty
            self.remoteVideosCollectionView.isHidden = self.remoteVideoViews.isEmpty
            self.remoteVideosCollectionView.reloadData()
        }
    }
    
    private func updateLocalVideos() {
        DispatchQueue.main.async {
            self.localVideosTitleLabel.isHidden = self.localVideoViews.isEmpty
            self.localVideosCollectionView.isHidden = self.localVideoViews.isEmpty
            self.localVideosCollectionView.reloadData()
        }
    }
    
    func showErrorAlert(message: String) {
        let alertController = UIAlertController(title: "Error", message: message, preferredStyle: .alert)
        self.present(alertController, animated: true, completion: nil)
        DispatchQueue.main.asyncAfter(deadline: DispatchTime.now() + 2) {
            alertController.dismiss(animated: true, completion: nil)
        }
    }
    
    private func callCleanup() {
        CallKitAdapter.shared.endCall()
        self.audioButtonsStack.isHidden = true
        self.videoButtonsStack.isHidden = true
        self.hangupButton.isHidden = true
        self.localVideoViews.removeAll()
        self.updateLocalVideos()
    }
    
    private func conferenceOrDialogCleanup() {
        self.remoteVideoViews.removeAll()
        self.updateRemoteVideos()
        self.updateParticipants()
    }
    
    private func dismissCurrentView() {
        DispatchQueue.main.async {
            self.dismiss(animated: false, completion: nil)
        }
    }
}

extension ApplicationCallController: ApplicationCallEventListener, NetworkQualityEventListener, ParticipantNetworkQualityEventListener {
    func onRinging(_ callRingingEvent: CallRingingEvent) {
        os_log("Ringing...")
        self.callStatusLabel.text = "Ringing..."
    }
    
    func onEarlyMedia(_ callEarlyMediaEvent: CallEarlyMediaEvent) {
        os_log("Early media received.")
        self.callStatusLabel.text = "Ringing..."
    }
    
    func onEstablished(_ callEstablishedEvent: CallEstablishedEvent) {
        os_log("Established")
        self.showActiveCallLayout()
    }
    
    func onHangup(_ callHangupEvent: CallHangupEvent) {
        os_log("Hangup: %@", callHangupEvent.errorCode.description)
        self.callCleanup()
        self.dismissCurrentView()
    }
    
    func onError(_ errorEvent: ErrorEvent) {
        os_log("Error: %@", errorEvent.errorCode.description)
        self.showErrorAlert(message: errorEvent.errorCode.description)
    }
    
    func onConferenceJoined(_ conferenceJoinedEvent: ConferenceJoinedEvent) {
        os_log("Joined conference")
        self.callStatusLabel.text = "Joined conference"
        self.destinationLabel.text = conferenceJoinedEvent.id
        self.updateParticipants()
    }
    
    func onConferenceLeft(_ conferenceLeftEvent: ConferenceLeftEvent) {
        let errorCode = conferenceLeftEvent.errorCode
        os_log("Left conference: %@", errorCode.description)
        self.callStatusLabel.text = "Left conference: \(errorCode.name)"
        self.conferenceOrDialogCleanup()
    }
    
    func onDialogJoined(_ dialogJoinedEvent: DialogJoinedEvent) {
        os_log("Joined dialog")
        self.callStatusLabel.text = "Joined dialog"
        self.destinationLabel.text = dialogJoinedEvent.id
        self.updateParticipants()
    }
    
    func onDialogLeft(_ dialogLeftEvent: DialogLeftEvent) {
        let errorCode = dialogLeftEvent.errorCode
        os_log("Left dialog: %@", errorCode.description)
        self.callStatusLabel.text = "Left dialog: \(errorCode.name)"
        self.conferenceOrDialogCleanup()
    }
    
    func onReconnecting(_ callReconnectingEvent: CallReconnectingEvent) {
        //disabled by default
        os_log("Reconnecting...")
        self.callStatusLabel.text = "Reconnecting..."
    }
    
    func onReconnected(_ callReconnectedEvent: CallReconnectedEvent) {
        //disabled by default
        os_log("Reconnected")
        self.callStatusLabel.text = "In a call"
    }
    
    func onCameraVideoAdded(_ cameraVideoAddedEvent: CameraVideoAddedEvent) {
        os_log("Local camera video added")
        self.localVideoViews.append(Video(identity: ApplicationCallController.LOCAL, type: ApplicationCallController.CAMERA, track: cameraVideoAddedEvent.track))
        self.flipCameraButton.isHidden = false
        self.updateLocalVideos()
    }
    
    func onCameraVideoUpdated(_ cameraVideoUpdatedEvent: CameraVideoUpdatedEvent) {
        os_log("Local camera video updated")
        let video = self.localVideoViews.first { video in
            return video.identity == ApplicationCallController.LOCAL && video.type == ApplicationCallController.CAMERA
        }
        video!.track = cameraVideoUpdatedEvent.track
        self.localVideosCollectionView.reloadData()
    }
    
    func onCameraVideoRemoved() {
        os_log("Local camera video removed")
        self.localVideoViews.removeAll { video in
            video.identity.elementsEqual(ApplicationCallController.LOCAL) && video.type.elementsEqual(ApplicationCallController.CAMERA)
        }
        self.flipCameraButton.isHidden = true
        self.updateLocalVideos()
    }
    
    func onScreenShareAdded(_ screenShareAddedEvent: ScreenShareAddedEvent) {
        os_log("Local screen share video added")
        self.localVideoViews.append(Video(identity: ApplicationCallController.LOCAL, type: ApplicationCallController.SCREEN_SHARE, track: screenShareAddedEvent.track))
        self.updateLocalVideos()
    }
    
    func onScreenShareRemoved(_ screenShareRemovedEvent: ScreenShareRemovedEvent) {
        os_log("Local screen share video removed")
        self.localVideoViews.removeAll { video in
            video.identity.elementsEqual(ApplicationCallController.LOCAL) && video.type.elementsEqual(ApplicationCallController.SCREEN_SHARE)
        }
        self.updateLocalVideos()
    }
    
    func onParticipantJoining(_ participantJoiningEvent: ParticipantJoiningEvent) {
        os_log("Participant %@ joining room", participantJoiningEvent.participant.endpoint.identifier())
        self.updateParticipants()
    }
    
    func onParticipantJoined(_ participantJoinedEvent: ParticipantJoinedEvent) {
        os_log("Participant %@ joined room", participantJoinedEvent.participant.endpoint.identifier())
        self.updateParticipants()
    }
    
    func onParticipantLeft(_ participantLeftEvent: ParticipantLeftEvent) {
        os_log("Participant %@ left room", participantLeftEvent.participant.endpoint.identifier())
        self.updateParticipants()
    }
    
    func onParticipantCameraVideoAdded(_ participantCameraVideoAddedEvent: ParticipantCameraVideoAddedEvent) {
        os_log("Participant %@ added camera video", participantCameraVideoAddedEvent.participant.endpoint.identifier())
        self.remoteVideoViews.append(Video(identity: participantCameraVideoAddedEvent.participant.endpoint.identifier(), type: ApplicationCallController.CAMERA, track: participantCameraVideoAddedEvent.track))
        self.updateRemoteVideos()
    }
    
    func onParticipantCameraVideoRemoved(_ participantCameraVideoRemovedEvent: ParticipantCameraVideoRemovedEvent) {
        os_log("Participant %@ removed camera video", participantCameraVideoRemovedEvent.participant.endpoint.identifier())
        self.remoteVideoViews.removeAll { video in
            video.identity.elementsEqual(participantCameraVideoRemovedEvent.participant.endpoint.identifier()) && video.type.elementsEqual(ApplicationCallController.CAMERA)
        }
        self.updateRemoteVideos()
    }
    
    func onParticipantScreenShareAdded(_ participantScreenShareAddedEvent: ParticipantScreenShareAddedEvent) {
        os_log("Participant %@ added screen share video", participantScreenShareAddedEvent.participant.endpoint.identifier())
        self.remoteVideoViews.append(Video(identity: participantScreenShareAddedEvent.participant.endpoint.identifier(), type: ApplicationCallController.SCREEN_SHARE, track: participantScreenShareAddedEvent.track))
        self.updateRemoteVideos()
    }
    
    func onParticipantScreenShareRemoved(_ participantScreenShareRemovedEvent: ParticipantScreenShareRemovedEvent) {
        os_log("Participant %@ removed screen share video", participantScreenShareRemovedEvent.participant.endpoint.identifier())
        self.remoteVideoViews.removeAll { video in
            video.identity.elementsEqual(participantScreenShareRemovedEvent.participant.endpoint.identifier()) && video.type.elementsEqual(ApplicationCallController.SCREEN_SHARE)
        }
        self.updateRemoteVideos()
    }
    
    func onParticipantMuted(_ participantMutedEvent: ParticipantMutedEvent) {
        os_log("Participant %@ muted", participantMutedEvent.participant.endpoint.identifier())
        self.participantsTableView.reloadData()
    }
    
    func onParticipantUnmuted(_ participantUnmutedEvent: ParticipantUnmutedEvent) {
        os_log("Participant %@ unmuted", participantUnmutedEvent.participant.endpoint.identifier())
        self.participantsTableView.reloadData()
    }
    
    func onParticipantDeaf(_ participantDeafEvent: ParticipantDeafEvent) {
        os_log("Participant %@ deafened", participantDeafEvent.participant.endpoint.identifier())
    }
    
    func onParticipantUndeaf(_ participantUndeafEvent: ParticipantUndeafEvent) {
        os_log("Participant %@ undeafened", participantUndeafEvent.participant.endpoint.identifier())
    }
    
    func onParticipantStartedTalking(_ participantStartedTalkingEvent: ParticipantStartedTalkingEvent) {
        os_log("Participant %@ started talking", participantStartedTalkingEvent.participant.endpoint.identifier())
    }
    
    func onParticipantStoppedTalking(_ participantStoppedTalkingEvent: ParticipantStoppedTalkingEvent) {
        os_log("Participant %@ stopped talking", participantStoppedTalkingEvent.participant.endpoint.identifier())
    }
    
    func onNetworkQualityChanged(_ networkQualityChangedEvent: NetworkQualityChangedEvent) {
        let networkQuality = networkQualityChangedEvent.networkQuality
        os_log("Local network quality changed to %@ (%@)", networkQuality.getName(), networkQuality.getScore())
    }
    
    func onParticipantNetworkQualityChanged(_ participantNetworkQualityChangedEvent: ParticipantNetworkQualityChangedEvent) {
        let networkQuality = participantNetworkQualityChangedEvent.networkQuality
        os_log("Participant %@ network quality changed to %@ (%@)", participantNetworkQualityChangedEvent.participant.endpoint.identifier(), networkQuality.getName(), networkQuality.getScore())
    }
}
