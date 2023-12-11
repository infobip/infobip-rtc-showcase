import Foundation
import InfobipRTC

extension ActiveCallController: DataChannelEventListener {
    func onBroadcastTextReceived(_ broadcastTextReceivedEvent: BroadcastTextReceivedEvent) {
        self.texts.append(DataChannelText(NSUUID().uuidString.lowercased(), nil, nil, broadcastTextReceivedEvent.date, broadcastTextReceivedEvent.text, .delivered))
    }
    
    func onTextDelivered(_ textDeliveredEvent: TextDeliveredEvent) {
        self.texts.last(where: {$0.id == textDeliveredEvent.id})?.status = textDeliveredEvent.delivered ? .delivered : .failed
        self.textsTableView.reloadData()
    }
    
    func onTextReceived(_ textReceivedEvent: TextReceivedEvent) {
        let toEndpoint = textReceivedEvent.isDirect ? WebrtcEndpoint(identity: self.accessToken?.identity ?? "") : nil
        self.texts.append(DataChannelText(NSUUID().uuidString.lowercased(), textReceivedEvent.from, toEndpoint, textReceivedEvent.date, textReceivedEvent.text, .delivered))
        self.textsTableView.reloadData()
    }
}
