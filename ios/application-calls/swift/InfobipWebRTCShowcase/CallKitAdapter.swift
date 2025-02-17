import CallKit
import InfobipRTC
import AVFoundation

class CallKitAdapter: NSObject {
    static let shared = CallKitAdapter()
    
    private var callRecord: CallRecord?
    private var callKitProvider = CXProvider(configuration: CXProviderConfiguration(localizedName: "InfobipRTC"))
    
    private let callKitCallController = CXCallController()
    
    override init() {
        super.init()
        callKitProvider.setDelegate(self, queue: nil)
    }
    
    func reportIncomingCall(_ call: IncomingApplicationCall) {
        guard let uuid = UUID(uuidString: call.id()) else { return }
        callRecord = CallRecord(uuid, call)
        let callUpdate = CXCallUpdate()
        callUpdate.remoteHandle = CXHandle(type: .phoneNumber, value: call.from)

        callKitProvider.reportNewIncomingCall(with: uuid, update: callUpdate){ (error) in
            if let err = error {
                print("Failed to report incoming call: %@", err.localizedDescription)
            } else {
                print("Successfully reported incoming call.")
            }
        }
    }
    
    func endCall() {
        if let uuid = callRecord?.uuid {
            callKitProvider.reportCall(with: uuid, endedAt: nil, reason: .remoteEnded)
        }
    }
}

extension CallKitAdapter: CXProviderDelegate {
    func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
        if let incomingCall = callRecord?.call as? IncomingApplicationCall {
            let applicationCallOptions = ApplicationCallOptions(video: true, autoReconnect: true)
            incomingCall.accept(applicationCallOptions)
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
        guard let call = callRecord?.call else { return }
        if let incoming = call as? IncomingApplicationCall, incoming.status != .established {
            incoming.decline()
        } else {
            call.hangup()
        }
        action.fulfill()
    }
    
    func provider(_ provider: CXProvider, perform action: CXSetMutedCallAction) {
        if let call = callRecord?.call {
            do {
                try call.mute(action.isMuted)
                action.fulfill()
            } catch {
                action.fail()
            }
        }
    }
    
    func providerDidReset(_ provider: CXProvider) {}
}

class CallRecord {
    let uuid: UUID
    let call: ApplicationCall
    
    init(_ uuid: UUID, _ call: ApplicationCall) {
        self.uuid = uuid
        self.call = call
    }
}

