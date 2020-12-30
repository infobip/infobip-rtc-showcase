import CallKit
import InfobipRTC
import AVFoundation

class CallKitAdapter: NSObject {
    static let shared = CallKitAdapter()
    
    private var calls: [String: CallRecord] = [:]
    private var callKitProvider = CXProvider(configuration: CXProviderConfiguration(localizedName: "InfobipRTC"))
    private let callKitCallController = CXCallController()
    
    override init() {
        super.init()
        callKitProvider.setDelegate(self, queue: nil)
    }
    
    func reportIncomingCall(_ call: Call) {
        guard let uuid = UUID(uuidString: call.id()) else { return }
        calls[call.id()] = CallRecord(uuid, call)
        let callUpdate = CXCallUpdate()
        callUpdate.remoteHandle = CXHandle(type: .phoneNumber, value: call.source().identity)
        callUpdate.hasVideo = call.hasLocalVideo()
        callKitProvider.reportNewIncomingCall(with: uuid, update: callUpdate){ (error) in
            if let err = error {
                print("Failed to report incoming call: %@", err.localizedDescription)
            } else {
                print("Successfully reported incoming call.")
            }
        }
    }
    
    func endCall(_ call: Call) {
        if let uuid = calls[call.id()]?.uuid {
            callKitProvider.reportCall(with: uuid, endedAt: nil, reason: .remoteEnded)
            calls.removeValue(forKey: call.id())
        }
    }
}

extension CallKitAdapter: CXProviderDelegate {
    func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
        if let incomingCall = calls[action.callUUID.uuidString.lowercased()]?.call as? IncomingCall {
            incomingCall.accept()
            action.fulfill()
        } else {
            action.fail()
        }
    }
    
    func provider(_ provider: CXProvider, perform action: CXStartCallAction) {
        self.callKitProvider.reportOutgoingCall(with: action.callUUID, startedConnectingAt: nil)
        action.fulfill()
    }
    
    func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
        guard let call = calls[action.callUUID.uuidString.lowercased()]?.call else { return }
        if let incoming = call as? IncomingCall, incoming.status != .ESTABLISHED {
            incoming.decline()
        } else {
            call.hangup()
        }
        action.fulfill()
    }
    
    func provider(_ provider: CXProvider, perform action: CXSetMutedCallAction) {
        if let call = calls[action.callUUID.uuidString.lowercased()]?.call {
            call.mute(action.isMuted)
            action.fulfill()
        }
    }
    
    func providerDidReset(_ provider: CXProvider) {}
}

class CallRecord {
    let uuid: UUID
    let call: Call
    
    init(_ uuid: UUID, _ call: Call) {
        self.uuid = uuid
        self.call = call
    }
}

