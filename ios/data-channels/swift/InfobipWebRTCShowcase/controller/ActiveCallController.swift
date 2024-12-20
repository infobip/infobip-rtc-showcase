import UIKit
import InfobipRTC
import os.log

class ActiveCallController: UIViewController, UIPickerViewDelegate, UIPickerViewDataSource, UITableViewDelegate, UITableViewDataSource {
    @IBOutlet weak var connectionStatusLabel: UILabel!
    @IBOutlet weak var callStatusLabel: UILabel!
        
    @IBOutlet weak var textsTableView: UITableView!
    
    @IBOutlet weak var toInput: UITextField!
    @IBOutlet weak var textInput: UITextField!

    @IBOutlet weak var sendButton: UIButton!
    @IBOutlet weak var leaveButton: UIButton!
    
    @IBOutlet weak var viewBottomConstraint: NSLayoutConstraint!
    
    var roomName: String?
    var accessToken: AccessToken?
    var participants: [String] = []
    var texts: [DataChannelText] = []
    let dateFormatter = DateFormatter()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        self.connect()
        
        self.dateFormatter.dateFormat = "h:mm a"
        
        self.setUpKeyboard()
        self.setUpTapGestures()
        self.setUpPickerView()
        self.setUpTableView()

        return self.makeRoomCall()
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
    
    @IBAction func sendText(_ sender: Any) {
        let text = self.textInput.text, to = self.toInput.text
        let activeRoomCall = getInfobipRTCInstance().getActiveRoomCall()
        let fromEndpoint =  WebrtcEndpoint(identity: self.accessToken?.identity ?? "")
        
        if let trimmedText = text?.trimmingCharacters(in: .whitespacesAndNewlines), !trimmedText.isEmpty, let activeRoomCall {
            if let toEndpoint = activeRoomCall.participants().first(where: { participant in participant.endpoint.identifier().lowercased() == to })?.endpoint {
                activeRoomCall.dataChannel()?.send(text: trimmedText, to: toEndpoint) { id, error in
                    if let _ = error {
                        os_log("An error occurred when sending a text")
                        self.texts.append(DataChannelText(NSUUID().uuidString.lowercased(), fromEndpoint, toEndpoint, Date(), trimmedText, .failed))
                    } else if let id {
                        self.texts.append(DataChannelText(id, fromEndpoint, toEndpoint, Date(), trimmedText, .sent))
                    }
                }
            } else {
                activeRoomCall.dataChannel()?.send(text: trimmedText) { id, error in
                    if let _ = error {
                        os_log("An error occurred when sending a text")
                        self.texts.append(DataChannelText(NSUUID().uuidString.lowercased(), fromEndpoint, nil, Date(), trimmedText, .failed))
                    } else if let id {
                        self.texts.append(DataChannelText(id, fromEndpoint, nil, Date(), trimmedText, .sent))
                    }
                }
            }
            self.textsTableView.reloadData()
        }
        
        self.textInput.text = ""
    }
    
    @IBAction func leave(_ sender: UIButton) {
        if let activeRoomCall = getInfobipRTCInstance().getActiveRoomCall() {
            activeRoomCall.leave()
        }
    }
    
    private func connect() {
        TokenProvider.shared.get { token, error in
            guard let accessToken = token else {
                self.dismissCurrentView()
                return
            }
            self.accessToken = accessToken
            self.connectionStatusLabel.text = "Connected as \(accessToken.identity)"
        }
    }
    
    private func makeRoomCall() {
        guard let accessToken = self.accessToken, let roomName = self.roomName else {
            os_log("Missing room name or token")
            self.callStatusLabel.text = "Missing room name or token"
            self.dismissCurrentView()
            return
        }
        do {
            let roomRequest = RoomRequest(accessToken.token, roomName: roomName, roomCallEventListener: self)
            let roomCallOptions = RoomCallOptions(audio: false, video: false, dataChannel: true)
            let roomCall = try getInfobipRTCInstance().joinRoom(roomRequest, roomCallOptions)
            roomCall.dataChannel()?.dataChannelEventListener = self
            self.showJoiningRoomLayout()
        } catch {
            os_log("Failed to make a room call: %@", error.localizedDescription)
            self.callStatusLabel.text = error.localizedDescription
            self.dismissCurrentView()
        }
    }
    
    private func showJoiningRoomLayout() {
        if let roomName = self.roomName {
            self.callStatusLabel.text = "Joining room \(roomName)"
        }
        self.leaveButton.isEnabled = true
    }

    private func showActiveCallLayout() {
        if let roomName = self.roomName {
            self.callStatusLabel.text = "Joined room \(roomName)"
        }
        self.sendButton.isEnabled = true
        self.updateParticipants()
    }
    
    private func updateParticipants() {
        if let participants = getInfobipRTCInstance().getActiveRoomCall()?.participants() {
            self.participants = participants.filter { $0.endpoint.identifier() != self.accessToken?.identity }.map{ $0.endpoint.identifier() }
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
        self.texts = []
        self.participants = []
    }
    
    private func dismissCurrentView() {
        DispatchQueue.main.async {
            self.dismiss(animated: false, completion: nil)
        }
    }
    
    private func setUpKeyboard() {
        NotificationCenter.default.addObserver(self, selector: #selector(self.keyboardWillShow(_:)), name: UIResponder.keyboardWillShowNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(self.keyboardWillHide(_:)), name: UIResponder.keyboardWillHideNotification, object: nil)
    }
    
    private func setUpTapGestures() {
        let tapGesture = UITapGestureRecognizer(target: self, action: #selector(self.handleTap(_:)))
        self.view.addGestureRecognizer(tapGesture)
    }
    
    private func setUpPickerView() {
        let pickerView = UIPickerView()
        pickerView.delegate = self
        pickerView.dataSource = self
        toInput.inputView = pickerView
        
        let toolbar = UIToolbar()
        toolbar.sizeToFit()
        let doneButton = UIBarButtonItem(title: "Done", style: .done, target: self, action: #selector(doneButtonTapped))
        toolbar.setItems([doneButton], animated: false)
        toInput.inputAccessoryView = toolbar
    }
    
    private func setUpTableView() {
        self.textsTableView.delegate = self
        self.textsTableView.dataSource = self
        
        self.textsTableView.rowHeight = UITableView.automaticDimension
        self.textsTableView.estimatedRowHeight = UITableView.automaticDimension
    }
    
    @objc private func keyboardWillShow(_ notification: Notification) {
        if let keyboardFrame = notification.userInfo?[UIResponder.keyboardFrameEndUserInfoKey] as? CGRect {
            let keyboardHeight = keyboardFrame.height
            self.viewBottomConstraint.constant = 4 + keyboardHeight
            UIView.animate(withDuration: 0.3) {
                self.view.layoutIfNeeded()
            }
        }
    }
    
    @objc private func keyboardWillHide(_ notification: Notification) {
        self.viewBottomConstraint.constant = 32
        UIView.animate(withDuration: 0.3) {
            self.view.layoutIfNeeded()
        }
    }
    
    @objc private func handleTap(_ gesture: UITapGestureRecognizer) {
        view.endEditing(true)
    }
}

extension ActiveCallController: RoomCallEventListener {
    func onRoomRecordingStarted(_ roomRecordingStartedEvent: RoomRecordingStartedEvent) {
        os_log("Room recording started")
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
    
    func onRoomRejoining(_ roomRejoiningEvent: RoomRejoiningEvent) {
        os_log("Rejoining room...")
    }
    
    func onRoomRejoined(_ roomRejoinedEvent: RoomRejoinedEvent) {
        os_log("Rejoined room")
    }
    
    func onError(_ errorEvent: ErrorEvent) {
        os_log("Error: %@", errorEvent.errorCode.description)
        self.showErrorAlert(message: errorEvent.errorCode.description)
    }
    
    func onParticipantJoining(_ participantJoiningEvent: ParticipantJoiningEvent) {
        os_log("Participant %@ joining room", participantJoiningEvent.participant.endpoint.identifier())
    }
    
    func onParticipantJoined(_ participantJoinedEvent: ParticipantJoinedEvent) {
        os_log("Participant %@ joined room", participantJoinedEvent.participant.endpoint.identifier())
        self.updateParticipants()
    }
    
    func onParticipantLeft(_ participantLeftEvent: ParticipantLeftEvent) {
        os_log("Participant %@ left room", participantLeftEvent.participant.endpoint.identifier())
        self.updateParticipants()
    }
    
    func onParticipantMuted(_ participantMutedEvent: ParticipantMutedEvent) {
        os_log("Participant %@ muted", participantMutedEvent.participant.endpoint.identifier())
    }
    
    func onParticipantUnmuted(_ participantUnmutedEvent: ParticipantUnmutedEvent) {
        os_log("Participant %@ unmuted", participantUnmutedEvent.participant.endpoint.identifier())
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
    
    func onCameraVideoAdded(_ cameraVideoAddedEvent: CameraVideoAddedEvent) {
        os_log("Local camera video added")
    }
    
    func onCameraVideoUpdated(_ cameraVideoUpdatedEvent: CameraVideoUpdatedEvent) {
        os_log("Local camera video updated")
    }
    
    func onCameraVideoRemoved() {
        os_log("Local camera video removed")
    }
    
    func onScreenShareAdded(_ screenShareAddedEvent: ScreenShareAddedEvent) {
        os_log("Local screen share video added")
    }
    
    func onScreenShareRemoved(_ screenShareRemovedEvent: ScreenShareRemovedEvent) {
        os_log("Local screen share video removed")
    }
    
    func onParticipantCameraVideoAdded(_ participantCameraVideoAddedEvent: ParticipantCameraVideoAddedEvent) {
        os_log("Participant %@ added camera video", participantCameraVideoAddedEvent.participant.endpoint.identifier())
    }
    
    func onParticipantCameraVideoRemoved(_ participantCameraVideoRemovedEvent: ParticipantCameraVideoRemovedEvent) {
        os_log("Participant %@ removed camera video", participantCameraVideoRemovedEvent.participant.endpoint.identifier())
    }
    
    func onParticipantScreenShareAdded(_ participantScreenShareAddedEvent: ParticipantScreenShareAddedEvent) {
        os_log("Participant %@ added screen share video", participantScreenShareAddedEvent.participant.endpoint.identifier())
    }
    
    func onParticipantScreenShareRemoved(_ participantScreenShareRemovedEvent: ParticipantScreenShareRemovedEvent) {
        os_log("Participant %@ removed screen share video", participantScreenShareRemovedEvent.participant.endpoint.identifier())
    }
}
