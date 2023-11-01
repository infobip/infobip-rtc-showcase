import UIKit
import InfobipRTC
import os.log

class RoomCallController: MainController {
    
    var activeCall: RoomCall?
    
    private var participants: [Participant] = []
    
    @IBOutlet weak var participantsLabel: UILabel!

    @IBOutlet weak var roomNameInput: UITextField!
    @IBOutlet weak var joinButton: UIButton!
    @IBOutlet weak var joinVideoButton: UIButton!
    @IBOutlet weak var muteButton: UIButton!
    @IBOutlet weak var leaveButton: UIButton!
    @IBOutlet weak var flipCameraButton: UIButton!
    @IBOutlet weak var toggleCameraVideoButton: UIButton!
    @IBOutlet weak var toggleScreenShareButton: UIButton!

    @IBOutlet weak var localCameraVideoView: UIView!
    @IBOutlet weak var localScreenShareView: UIView!
    
    @IBOutlet weak var remoteTopVideoView: UIView!
    @IBOutlet weak var remoteBottomVideoView: UIView!
    @IBOutlet weak var remoteVideosStack: UIStackView!

    @IBOutlet weak var videoButtonsStack: UIStackView!
    @IBOutlet weak var joinButtonsStack: UIStackView!
    
    var localCameraView: UIView?
    var localScreenView: UIView?
    var remoteTopView: UIView?
    var remoteBottomView: UIView?
        
    override func viewDidLoad() {
        super.viewDidLoad()
    }
    
    @IBAction func joinAudioRoom(_ sender: Any) {
        self.joinRoom(callType: .room_audio)
    }
    
    @IBAction func joinVideoRoom(_ sender: Any) {
        self.joinRoom(callType: .room_video)
    }
    
    @IBAction func leave(_ sender: Any) {
        self.activeCall?.leave()
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
        self.roomNameInput.isHidden = isHidden
        self.joinButtonsStack.isHidden = isHidden
    }
    
    private func joinRoom(callType: CallType) {
        guard let roomName = self.roomNameInput.text, let token = self.token else {
            os_log("Invalid room name or missing token.")
            return
        }
        do {
            let roomRequest = RoomRequest(token, roomName: roomName, roomCallEventListener: self)
            let hasVideo = callType == .room_video
            let roomOptions = RoomCallOptions(video: hasVideo)
            self.activeCall = try infobipRTC.joinRoom(roomRequest, roomOptions)
            
            self.statusLabel.text = "Joining room \(roomName)..."
            self.dialPadVisibility(.HIDDEN)
            self.leaveButton.isHidden = false
        } catch {
            os_log("Failed to join a room: %@", error.localizedDescription)
        }
    }
    
    private func updateParticipantsLabel() {
        if (self.participants.count == 1) {
            self.participantsLabel.text = "You are the only one in the room."
        } else {
            self.participantsLabel.text = "Participants (\(self.participants.count)): \(self.participants.map {$0.endpoint.identifier() }.joined(separator: ", "))"
        }
    }
}

extension RoomCallController: RoomCallEventListener {
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
    
    func onError(_ error: ErrorEvent) {
        self.callCleanup(error.errorCode.description)
        self.showErrorAlert(message: error.errorCode.description)
    }
    
    func onRoomJoined(_ roomJoinedEvent: RoomJoinedEvent) {
        self.statusLabel.text = "You have successfully joined the room"
        self.participants = roomJoinedEvent.participants
        self.updateParticipantsLabel()
        
        if let activeCall = self.activeCall {
            self.muteButton.isHidden = false
            self.videoButtonsStack.isHidden = false
            self.flipCameraButton.isHidden = !activeCall.hasCameraVideo()
        }
    }
    
    func onRoomLeft(_ roomLeftEvent: RoomLeftEvent) {
        self.callCleanup(roomLeftEvent.errorCode.description)
    }
    
    func onParticipantJoining(_ participantJoiningEvent: ParticipantJoiningEvent) {
        self.statusLabel.text = "\(self.getIdentifier(participantJoiningEvent.participant)) is joining the room"
    }
    
    func onParticipantJoined(_ participantJoinedEvent: ParticipantJoinedEvent) {
        self.statusLabel.text = "\(self.getIdentifier(participantJoinedEvent.participant)) has joined the room"
        self.participants.append(participantJoinedEvent.participant)
        self.updateParticipantsLabel()
    }
    
    func onParticipantLeft(_ participantLeftEvent: ParticipantLeftEvent) {
        self.statusLabel.text = "\(self.getIdentifier(participantLeftEvent.participant)) has left the room"
        self.participants.removeAll(where: { $0.endpoint.identifier() == self.getIdentifier(participantLeftEvent.participant) })
        self.updateParticipantsLabel()
    }
    
    func onParticipantCameraVideoAdded(_ participantCameraVideoAddedEvent: ParticipantCameraVideoAddedEvent) {
        if (self.remoteTopView != nil) {
            self.addRemoteBottomVideoView(self.getIdentifier(participantCameraVideoAddedEvent.participant), "cameraVideo")
            participantCameraVideoAddedEvent.track.addRenderer(self.remoteBottomView!)
        } else {
            self.addRemoteTopVideoView(self.getIdentifier(participantCameraVideoAddedEvent.participant), "cameraVideo")
            participantCameraVideoAddedEvent.track.addRenderer(self.remoteTopView!)
        }
    }
    
    func onParticipantCameraVideoRemoved(_ participantCameraVideoRemovedEvent: ParticipantCameraVideoRemovedEvent) {
        self.hideRemoteVideoView(self.getIdentifier(participantCameraVideoRemovedEvent.participant), "cameraVideo")
    }
    
    func onParticipantScreenShareAdded(_ participantScreenShareAddedEvent: ParticipantScreenShareAddedEvent) {
        if (self.remoteTopView != nil) {
            self.addRemoteBottomVideoView(self.getIdentifier(participantScreenShareAddedEvent.participant), "screenShare")
            participantScreenShareAddedEvent.track.addRenderer(self.remoteBottomView!)
        } else {
            self.addRemoteTopVideoView(self.getIdentifier(participantScreenShareAddedEvent.participant), "screenShare")
            participantScreenShareAddedEvent.track.addRenderer(self.remoteTopView!)
        }
    }
    
    func onParticipantScreenShareRemoved(_ participantScreenShareRemovedEvent: ParticipantScreenShareRemovedEvent) {
        self.hideRemoteVideoView(self.getIdentifier(participantScreenShareRemovedEvent.participant), "screenShare")
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
        if self.localCameraView != nil || self.localScreenView != nil || self.remoteTopView != nil || self.remoteBottomView != nil {
            self.finalizeVideoCallPreview()
        }
        self.dialPadVisibility(.VISIBLE)
        self.videoButtonsStack.isHidden = true
        self.muteButton.isHidden = true
        self.leaveButton.isHidden = true
        os_log("Room call has finished: %@", reason)
        self.statusLabel.text = "Connected as \(self.identity ?? self.unknown)"
        self.participantsLabel.text = ""
        self.participants = []
    }
    
    private func getIdentifier(_ participant: Participant) -> String {
        return participant.endpoint.identifier()
    }
}
