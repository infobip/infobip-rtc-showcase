import UIKit
import InfobipRTC
import os.log

class CallController: UIViewController {
    private static var CAMERA = "camera"
    private static var SCREEN_SHARE = "screen-share"
    private static var LOCAL = "local"
    private static var REMOTE = "remote"
    
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
    @IBOutlet weak var toggleCameraButton: UIButton!
    @IBOutlet weak var toggleScreenShareButton: UIButton!
    @IBOutlet weak var flipCameraButton: UIButton!
    @IBOutlet weak var hangupButton: UIButton!
    
    var callType: CallType = .webrtc_audio
    var destination: String?
    var startCallMuted: Bool = false
    
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
        
        if getInfobipRTCInstance().getActiveCall() != nil {
            return self.handleIncomingCallOnSimulator()
        }
        
        if self.callType == .room_audio || self.callType == .room_video {
            return self.performRoomCall()
        } else if self.callType == .phone {
            return self.performPhoneCall()
        } else if self.callType == .webrtc_audio || self.callType == .webrtc_video {
            return self.performWebrtcCall()
        }
    }
    
    private func handleIncomingCallOnSimulator() {
        (getInfobipRTCInstance().getActiveCall() as? WebrtcCall)?.webrtcCallEventListener = self
        self.showIncomingCallLayout()
    }
    
    private func performRoomCall() {
        TokenProvider.shared.get { token, error in
            guard let accessToken = token, let destination = self.destination else {
                os_log("Missing destination or token")
                self.callStatusLabel.text = "Missing destination or token"
                self.dismissCurrentView()
                return
            }
            do {
                let roomRequest = RoomRequest(accessToken.token, roomName: destination, roomCallEventListener: self)
                let roomCallOptions = RoomCallOptions(audio: !self.startCallMuted, video: self.callType == .room_video, autoRejoin: true)
                let _ = try getInfobipRTCInstance().joinRoom(roomRequest, roomCallOptions)
                self.showOutgoingCallLayout()
            } catch {
                os_log("Failed to make a room call: %@", error.localizedDescription)
                self.callStatusLabel.text = error.localizedDescription
                self.dismissCurrentView()
            }
        }
    }
    
    private func performPhoneCall() {
        TokenProvider.shared.get { token, error in
            guard let accessToken = token, let destination = self.destination else {
                os_log("Missing destination or token")
                self.callStatusLabel.text = "Missing destination or token"
                self.dismissCurrentView()
                return
            }
            do {
                let callPhoneRequest = CallPhoneRequest(accessToken.token, destination: destination, phoneCallEventListener: self)
                let phoneCallOptions = PhoneCallOptions(audio: !self.startCallMuted)
                let _ = try getInfobipRTCInstance().callPhone(callPhoneRequest, phoneCallOptions)
                self.showOutgoingCallLayout()
            } catch {
                os_log("Failed to make a phone call: %@", error.localizedDescription)
                self.callStatusLabel.text = error.localizedDescription
                self.dismissCurrentView()
            }
        }
    }
    
    private func performWebrtcCall() {
        TokenProvider.shared.get { token, error in
            guard let accessToken = token, let destination = self.destination else {
                os_log("Missing destination or token")
                self.callStatusLabel.text = "Missing destination or token"
                self.dismissCurrentView()
                return
            }
            do {
                let callWebrtcRequest = CallWebrtcRequest(accessToken.token, destination: destination, webrtcCallEventListener: self)
                let webrtcCallOptions = WebrtcCallOptions(audio: !self.startCallMuted, video: self.callType == .webrtc_video)
                let _ = try getInfobipRTCInstance().callWebrtc(callWebrtcRequest, webrtcCallOptions)
                self.showOutgoingCallLayout()
            } catch {
                os_log("Failed to join a webrtc call: %@", error.localizedDescription)
                self.callStatusLabel.text = error.localizedDescription
                self.dismissCurrentView()
            }
        }
    }
    
    @IBAction func hangup(_ sender: UIButton) {
        if let activeRoomCall = getInfobipRTCInstance().getActiveRoomCall() {
            activeRoomCall.leave()
        }
        
        if let activeCall = getInfobipRTCInstance().getActiveCall() {
            activeCall.hangup()
        }
    }
    
    @IBAction func flipCamera(_ sender: UIButton) {
        if let activeRoomCall = getInfobipRTCInstance().getActiveRoomCall() {
            activeRoomCall.cameraOrientation(activeRoomCall.cameraOrientation() == .front ? .back : .front)
        }
        
        if let activeWebrtcCall = getInfobipRTCInstance().getActiveCall() as? WebrtcCall {
            activeWebrtcCall.cameraOrientation(activeWebrtcCall.cameraOrientation() == .front ? .back : .front)
        }
    }
    
    @available(iOS 11, *)
    @IBAction func toggleScreenShare(_ sender: UIButton) {
        if let activeRoomCall = getInfobipRTCInstance().getActiveRoomCall() {
            do {
                let hasScreenShare = activeRoomCall.hasScreenShare()
                try activeRoomCall.screenShare(screenShare: !hasScreenShare)
            } catch {
                self.showErrorAlert(message: "Something unexpected happened")
            }
        }
        
        if let activeWebrtcCall = getInfobipRTCInstance().getActiveCall() as? WebrtcCall {
            do {
                let hasScreenShare = activeWebrtcCall.hasScreenShare()
                try activeWebrtcCall.screenShare(screenShare: !hasScreenShare)
            } catch {
                self.showErrorAlert(message: "Something unexpected happened")
            }
        }
    }
    
    @IBAction func toggleCameraVideo(_ sender: UIButton) {
        if let activeRoomCall = getInfobipRTCInstance().getActiveRoomCall() {
            do {
                let hasCameraVideo = activeRoomCall.hasCameraVideo()
                try activeRoomCall.cameraVideo(cameraVideo: !hasCameraVideo)
            } catch {
                self.showErrorAlert(message: "Something unexpected happened")
            }
        }
        
        if let activeWebrtcCall = getInfobipRTCInstance().getActiveCall() as? WebrtcCall {
            do {
                let hasCameraVideo = activeWebrtcCall.hasCameraVideo()
                try activeWebrtcCall.cameraVideo(cameraVideo: !hasCameraVideo)
            } catch {
                self.showErrorAlert(message: "Something unexpected happened")
            }
        }
    }
    
    @IBAction func mute(_ sender: UIButton) {
        if let activeRoomCall = getInfobipRTCInstance().getActiveRoomCall() {
            do {
                let isMuted = activeRoomCall.muted()
                try activeRoomCall.mute(!isMuted)
                self.muteButton.setTitle(isMuted ? "Mute" : "Unmute", for: .normal)
                self.participantsTableView.reloadData()
            } catch {
                self.showErrorAlert(message: "Something unexpected happened")
            }
        }
        
        if let activeCall = getInfobipRTCInstance().getActiveCall() {
            do {
                let isMuted = activeCall.muted()
                try activeCall.mute(!isMuted)
                self.muteButton.setTitle(isMuted ? "Mute" : "Unmute", for: .normal)
            } catch {
                self.showErrorAlert(message: "Something unexpected happened")
            }
        }
    }
    
    @IBAction func openAudioQualityModeAlert(_ sender: UIButton) {
        let title = "Audio Quality Mode"
        let message = "Select your preferred mode"
        let alert = UIAlertController(title: title, message: message, preferredStyle: .actionSheet)
        for audioQualityMode in CallController.AUDIO_QUALITY_MODES {
            alert.addAction(UIAlertAction(title: audioQualityMode.value, style: .default) {_ in
                if let mode = AudioQualityMode(rawValue: audioQualityMode.key.rawValue) {
                    self.changeAudioQualityMode(mode)
                }
            })
        }
        alert.addAction(UIAlertAction(title: "Dismiss", style: .cancel))

        self.present(alert, animated: true)
    }
    
    @IBAction func openAudioDevicesAlert(_ sender: UIButton) {
        if let activeRoomCall = getInfobipRTCInstance().getActiveRoomCall() {
            let availableAudioDevices = activeRoomCall.audioDeviceManager.availableAudioDevices
            let activeAudioDevice = activeRoomCall.audioDeviceManager.activeDevice
            let alert = self.getAudioDevicesAlert(activeAudioDevice, availableAudioDevices)
            self.present(alert, animated: true)
        } else if let activeCall = getInfobipRTCInstance().getActiveCall() {
            let availableAudioDevices = activeCall.audioDeviceManager.availableAudioDevices
            let activeAudioDevice = activeCall.audioDeviceManager.activeDevice
            let alert = self.getAudioDevicesAlert(activeAudioDevice, availableAudioDevices)
            self.present(alert, animated: true)
        }
    }
    
    func changeAudioQualityMode(_ mode: AudioQualityMode) {
        if let activeRoomCall = getInfobipRTCInstance().getActiveRoomCall() {
            activeRoomCall.audioQualityMode(mode)
        }
        
        if let activeCall = getInfobipRTCInstance().getActiveCall() {
            activeCall.audioQualityMode(mode)
        }
    }
    
    func getAudioDevicesAlert(_ activeAudioDevice: AudioDevice?, _ availableAudioDevices: [AudioDevice]) -> UIAlertController {
        let title = "Audio Devices"
        var message = "Select your preferred device."
        if let activeAudioDevice = activeAudioDevice {
            message += " Current device: \(activeAudioDevice.name)"
        }

        let alert = UIAlertController(title: title, message: message, preferredStyle: .actionSheet)
        for audioDevice in availableAudioDevices {
            alert.addAction(UIAlertAction(title: audioDevice.name, style: .default) {_ in
                self.changeAudioDevice(audioDevice)
            })
        }
        alert.addAction(UIAlertAction(title: "Dismiss", style: .cancel))
        
        return alert
    }
    
    func changeAudioDevice(_ audioDevice: AudioDevice) {
        do {
            if let activeRoomCall = getInfobipRTCInstance().getActiveRoomCall() {
                try activeRoomCall.audioDeviceManager.selectAudioDevice(audioDevice)
            } else if let activeCall = getInfobipRTCInstance().getActiveCall() {
                try activeCall.audioDeviceManager.selectAudioDevice(audioDevice)
            }
        } catch {
            self.showErrorAlert(message: "Something unexpected happened")
        }
    }
    
    private func showOutgoingCallLayout() {
        self.callStatusLabel.text = "Calling..."
        if getInfobipRTCInstance().getActiveRoomCall() != nil {
            self.callStatusLabel.text = "Joining..."
            self.hangupButton.setTitle("Leave", for: .normal)
        }
        self.destinationLabel.text = self.destination
        self.destinationLabel.isHidden = false
        self.hangupButton.isHidden = false
        self.audioButtonsStack.isHidden = true
        self.videoButtonsStack.isHidden = true
    }
    
    private func showIncomingCallLayout() {
        self.callStatusLabel.text = "Incoming \(self.callType == .webrtc_video ? "video" : "audio") call"
        self.destinationLabel.text = self.destination
        self.destinationLabel.isHidden = false
        self.hangupButton.isHidden = true
        self.audioButtonsStack.isHidden = true
        self.videoButtonsStack.isHidden = true
    }
    
    private func showActiveCallLayout() {
        self.audioButtonsStack.isHidden = false
        self.videoButtonsStack.isHidden = true
        self.hangupButton.isHidden = false
        if let activeRoomCall = getInfobipRTCInstance().getActiveRoomCall() {
            self.showActiveRoomCallLayout(activeRoomCall)
        }
        if let activeCall = getInfobipRTCInstance().getActiveCall() {
            self.showActiveCallLayout(activeCall)
        }
    }
    
    private func showActiveRoomCallLayout(_ activeRoomCall: (RoomCall)) {
        self.callStatusLabel.text = "Joined room"
        self.updateParticipants()
        self.videoButtonsStack.isHidden = false
        self.flipCameraButton.isHidden = !activeRoomCall.hasCameraVideo()
        self.muteButton.setTitle(activeRoomCall.muted() ? "Unmute" : "Mute", for: .normal)
    }
    
    private func showActiveCallLayout(_ activeCall: Call) {
        self.callStatusLabel.text = "In a call"
        if let webrtcCall = activeCall as? WebrtcCall {
            self.videoButtonsStack.isHidden = false
            self.flipCameraButton.isHidden = !webrtcCall.hasCameraVideo()
        }
        self.muteButton.setTitle(activeCall.muted() ? "Unmute" : "Mute", for: .normal)
    }
    
    private func updateParticipants() {
        DispatchQueue.main.async {
            if let participants = getInfobipRTCInstance().getActiveRoomCall()?.participants() {
                self.participantsTitleLabel.isHidden = participants.isEmpty
                self.participantsTableView.isHidden = participants.isEmpty
                self.participantsTitleLabel.text = "Participants (\(participants.count))"
                self.participantsTableView.reloadData()
            }
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
        self.muteButton.isHidden = true
        self.videoButtonsStack.isHidden = true
        self.hangupButton.isHidden = true
        self.updateParticipants()
        self.localVideoViews.removeAll()
        self.updateLocalVideos()
        self.remoteVideoViews.removeAll()
        self.updateRemoteVideos()
    }
    
    private func dismissCurrentView() {
        DispatchQueue.main.async {
            self.dismiss(animated: false, completion: nil)
        }
    }
}

extension CallController: PhoneCallEventListener, WebrtcCallEventListener, RoomCallEventListener, NetworkQualityEventListener, RemoteNetworkQualityEventListener, ParticipantNetworkQualityEventListener {
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
    
    func onCameraVideoAdded(_ cameraVideoAddedEvent: CameraVideoAddedEvent) {
        os_log("Local camera video added")
        self.localVideoViews.append(Video(identity: CallController.LOCAL, type: CallController.CAMERA, track: cameraVideoAddedEvent.track))
        self.flipCameraButton.isHidden = false
        self.updateLocalVideos()
    }
    
    func onCameraVideoUpdated(_ cameraVideoUpdatedEvent: CameraVideoUpdatedEvent) {
        os_log("Local camera video updated")
        let video = self.localVideoViews.first { video in
            return video.identity == CallController.LOCAL && video.type == CallController.CAMERA
        }
        video!.track = cameraVideoUpdatedEvent.track
        self.localVideosCollectionView.reloadData()
    }
    
    func onCameraVideoRemoved() {
        os_log("Local camera video removed")
        self.localVideoViews.removeAll { video in
            video.identity.elementsEqual(CallController.LOCAL) && video.type.elementsEqual(CallController.CAMERA)
        }
        self.flipCameraButton.isHidden = true
        self.updateLocalVideos()
    }
    
    func onScreenShareAdded(_ screenShareAddedEvent: ScreenShareAddedEvent) {
        os_log("Local screen share video added")
        self.localVideoViews.append(Video(identity: CallController.LOCAL, type: CallController.SCREEN_SHARE, track: screenShareAddedEvent.track))
        self.updateLocalVideos()
    }
    
    func onScreenShareRemoved(_ screenShareRemovedEvent: ScreenShareRemovedEvent) {
        os_log("Local screen share video removed")
        self.localVideoViews.removeAll { video in
            video.identity.elementsEqual(CallController.LOCAL) && video.type.elementsEqual(CallController.SCREEN_SHARE)
        }
        self.updateLocalVideos()
    }
    
    func onRemoteCameraVideoAdded(_ cameraVideoAddedEvent: CameraVideoAddedEvent) {
        os_log("Remote screen camera added")
        self.remoteVideoViews.append(Video(identity: CallController.REMOTE, type: CallController.CAMERA, track: cameraVideoAddedEvent.track))
        self.updateRemoteVideos()
    }
    
    func onRemoteCameraVideoRemoved() {
        os_log("Remote screen camera removed")
        self.remoteVideoViews.removeAll { video in
            video.identity.elementsEqual(CallController.REMOTE) && video.type.elementsEqual(CallController.CAMERA)
        }
        self.updateRemoteVideos()
    }
    
    func onRemoteScreenShareAdded(_ screenShareAddedEvent: ScreenShareAddedEvent) {
        os_log("Remote screen share video added")
        self.remoteVideoViews.append(Video(identity: CallController.REMOTE, type: CallController.SCREEN_SHARE, track: screenShareAddedEvent.track))
        self.updateRemoteVideos()
    }
    
    func onRemoteScreenShareRemoved() {
        os_log("Remote screen share video removed")
        self.remoteVideoViews.removeAll { video in
            video.identity.elementsEqual(CallController.REMOTE) && video.type.elementsEqual(CallController.SCREEN_SHARE)
        }
        self.updateRemoteVideos()
    }
    
    func onRemoteMuted() {
        os_log("Remote user muted")
        self.destinationLabel.text = "\(self.destination!) (muted)"
    }
    
    func onRemoteUnmuted() {
        os_log("Remote user unmuted")
        self.destinationLabel.text = self.destination!
    }
    
    func onRoomJoined(_ roomJoinedEvent: RoomJoinedEvent) {
        os_log("Joined room")
        self.showActiveCallLayout()
    }
    
    func onRoomLeft(_ roomLeftEvent: RoomLeftEvent) {
        os_log("Left room: %@", roomLeftEvent.errorCode.description)
        self.callCleanup()
        self.dismissCurrentView()
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
        self.remoteVideoViews.append(Video(identity: participantCameraVideoAddedEvent.participant.endpoint.identifier(), type: CallController.CAMERA, track: participantCameraVideoAddedEvent.track))
        self.updateRemoteVideos()
    }
    
    func onParticipantCameraVideoRemoved(_ participantCameraVideoRemovedEvent: ParticipantCameraVideoRemovedEvent) {
        os_log("Participant %@ removed camera video", participantCameraVideoRemovedEvent.participant.endpoint.identifier())
        self.remoteVideoViews.removeAll { video in
            video.identity.elementsEqual(participantCameraVideoRemovedEvent.participant.endpoint.identifier()) && video.type.elementsEqual(CallController.CAMERA)
        }
        self.updateRemoteVideos()
    }
    
    func onParticipantScreenShareAdded(_ participantScreenShareAddedEvent: ParticipantScreenShareAddedEvent) {
        os_log("Participant %@ added screen share video", participantScreenShareAddedEvent.participant.endpoint.identifier())
        self.remoteVideoViews.append(Video(identity: participantScreenShareAddedEvent.participant.endpoint.identifier(), type: CallController.SCREEN_SHARE, track: participantScreenShareAddedEvent.track))
        self.updateRemoteVideos()
    }
    
    func onParticipantScreenShareRemoved(_ participantScreenShareRemovedEvent: ParticipantScreenShareRemovedEvent) {
        os_log("Participant %@ removed screen share video", participantScreenShareRemovedEvent.participant.endpoint.identifier())
        self.remoteVideoViews.removeAll { video in
            video.identity.elementsEqual(participantScreenShareRemovedEvent.participant.endpoint.identifier()) && video.type.elementsEqual(CallController.SCREEN_SHARE)
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
    
    func onRoomRejoining(_ roomRejoiningEvent: RoomRejoiningEvent) {
        os_log("Rejoining room...")
        self.callStatusLabel.text = "Rejoining..."
    }
    
    func onRoomRejoined(_ roomRejoinedEvent: RoomRejoinedEvent) {
        os_log("Rejoined room")
        self.callStatusLabel.text = "Joined room"
    }
    
    func onNetworkQualityChanged(_ networkQualityChangedEvent: NetworkQualityChangedEvent) {
        let networkQuality = networkQualityChangedEvent.networkQuality
        os_log("Local network quality changed to %@ (%@)", networkQuality.getName(), networkQuality.getScore())
    }
    
    func onRemoteNetworkQualityChanged(_ remoteNetworkQualityChangedEvent: RemoteNetworkQualityChangedEvent) {
        let networkQuality = remoteNetworkQualityChangedEvent.networkQuality
        os_log("Remote network quality changed to %@ (%@)", networkQuality.getName(), networkQuality.getScore())
    }
    
    func onParticipantNetworkQualityChanged(_ participantNetworkQualityChangedEvent: ParticipantNetworkQualityChangedEvent) {
        let networkQuality = participantNetworkQualityChangedEvent.networkQuality
        os_log("Participant %@ network quality changed to %@ (%@)", participantNetworkQualityChangedEvent.participant.endpoint.identifier(), networkQuality.getName(), networkQuality.getScore())
    }
}
