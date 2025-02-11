import Foundation
import InfobipRTC

public class InfobipRTCPlugin: NSObject, FlutterPlugin {
    static let RTC_CHANNEL = "infobip-rtc"
    static let RTC_EVENT_LISTENER_CHANNEL = "infobip-rtc-event-listener"
    
    static let RTC_CALL_CHANNEL = "infobip-rtc-call"
    static let RTC_CALL_EVENT_LISTENER_CHANNEL = "infobip-rtc-call-event-listener"

    var binaryMessenger: FlutterBinaryMessenger?
    var videoPlugin: RTCVideoPlugin?

    public static func register(with registrar: FlutterPluginRegistrar) {
        let instance = InfobipRTCPlugin()
        let flutterChannel = FlutterMethodChannel(name: InfobipRTCPlugin.RTC_CHANNEL, binaryMessenger: registrar.messenger())
        let flutterCallChannel = FlutterMethodChannel(name: InfobipRTCPlugin.RTC_CALL_CHANNEL, binaryMessenger: registrar.messenger())
        
        instance.binaryMessenger = registrar.messenger()
        registrar.addMethodCallDelegate(instance, channel: flutterChannel)
        registrar.addMethodCallDelegate(instance, channel: flutterCallChannel)

        instance.videoPlugin = RTCVideoPlugin()
        RTCVideoPlugin.register(with: registrar)
    }
    
    public func handle(_ methodCall: FlutterMethodCall, result: @escaping FlutterResult) {
        switch methodCall.method {
        case "callWebrtc":
            self.callWebrtc(methodCall, result: result)
        case "callPhone":
            self.callPhone(methodCall, result: result)
        case "registerForActiveConnection":
            self.registerForActiveConnection(methodCall)
        case "mute":
            self.mute(methodCall, result: result)
        case "cameraVideo":
            self.cameraVideo(methodCall, result: result)
        case "screenShare":
            self.screenShare(methodCall, result: result)
        case "hangup":
            self.hangup()
        case "accept":
            self.acceptIncomingCall()
        case "decline":
            self.declineIncomingCall()
        default:
            result(FlutterMethodNotImplemented)
        }
    }

    func callWebrtc(_ methodCall: FlutterMethodCall, result: @escaping FlutterResult) {
        guard let args = methodCall.arguments as? [String: Any],
              let token = args["token"] as? String,
              let destination = args["destination"] as? String else {
            result(FlutterError(code: "INVALID_ARGUMENTS",
                                message: "Missing or invalid arguments",
                                details: nil))
            return
        }

        var options: WebrtcCallOptions? = nil
        if let optionsArg = args["options"] as? String {
            do {
                options = try CallOptionsUtil.getWebrtcCallOptions(optionsArg)
            } catch {
                result(FlutterError(code: "INVALID_OPTIONS",
                                    message: "Failed to parse WebRTC options",
                                    details: error.localizedDescription))
                return
            }
        }

        let callRequest = CallWebrtcRequest(token, destination: destination, webrtcCallEventListener: self)
        do {
            let call = try getInfobipRTCInstance().callWebrtc(callRequest, options ?? WebrtcCallOptions())
            let callJson = call.toFlutterModel().toJsonString()
            result(callJson)
        } catch {
            result(FlutterError(code: "CALL_FAILED",
                                message: "Failed to initiate WebRTC call",
                                details: error.localizedDescription))
        }

    }

    func callPhone(_ methodCall: FlutterMethodCall, result: @escaping FlutterResult) {
        guard let args = methodCall.arguments as? [String: Any],
              let token = args["token"] as? String,
              let destination = args["destination"] as? String else {
            result(FlutterError(code: "INVALID_ARGUMENTS",
                                message: "Missing or invalid arguments",
                                details: nil))
            return
        }

        var options: PhoneCallOptions? = nil
        if let optionsArg = args["options"] as? String {
            do {
                options = try CallOptionsUtil.getPhoneCallOptions(optionsArg)
            } catch {
                result(FlutterError(code: "INVALID_OPTIONS",
                                    message: "Failed to parse phone options",
                                    details: error.localizedDescription))
                return
            }
        }

        let callRequest = CallPhoneRequest(token, destination: destination, phoneCallEventListener: self)
        do {
            let call = try getInfobipRTCInstance().callPhone(callRequest, options ?? PhoneCallOptions())
            let callJson = call.toFlutterModel().toJsonString()
            result(callJson)
        } catch {
            result(FlutterError(code: "CALL_FAILED",
                                message: "Failed to initiate phone call",
                                details: error.localizedDescription))
        }
    }

    func registerForActiveConnection(_ methodCall: FlutterMethodCall) {
        // todo support incoming calls
    }

    func mute(_ methodCall: FlutterMethodCall, result: @escaping FlutterResult) {
        guard let args = methodCall.arguments as? [String: Any], let mute: Bool = args["mute"] as? Bool else { return }
        do {
            try getInfobipRTCInstance().getActiveCall()?.mute(mute)
        } catch {
            result(FlutterError(code: "ACTION_FAILED",
                                message: "Failed to (un)mute call",
                                details: error.localizedDescription))
        }
    }
    
    func cameraVideo(_ methodCall: FlutterMethodCall, result: @escaping FlutterResult) {
        guard let args = methodCall.arguments as? [String: Any], let cameraVideo: Bool = args["cameraVideo"] as? Bool else { return }
        do {
            try (getInfobipRTCInstance().getActiveCall() as? WebrtcCall)?.cameraVideo(cameraVideo: cameraVideo)
        } catch {
            result(FlutterError(code: "ACTION_FAILED",
                                message: "Failed to enable/disable camera video",
                                details: error.localizedDescription))
        }
    }
    
    func screenShare(_ methodCall: FlutterMethodCall, result: @escaping FlutterResult) {
        guard let args = methodCall.arguments as? [String: Any], let screenShare: Bool = args["screenShare"] as? Bool else { return }
        do {
            try (getInfobipRTCInstance().getActiveCall() as? WebrtcCall)?.screenShare(screenShare: screenShare)
        } catch {
            result(FlutterError(code: "ACTION_FAILED",
                                message: "Failed to enable/disable screen share video",
                                details: error.localizedDescription))
        }
    }

    func hangup() {
        getInfobipRTCInstance().getActiveCall()?.hangup()
    }

    func acceptIncomingCall() {
        if let incomingCall = getInfobipRTCInstance().getActiveCall() as? IncomingWebrtcCall {
            incomingCall.accept()
        }
    }

    func declineIncomingCall() {
        if let incomingCall = getInfobipRTCInstance().getActiveCall() as? IncomingWebrtcCall {
            incomingCall.decline()
        }
    }

    func invokeEvent(event: String, data: Codable?) {
        if let messenger = binaryMessenger {
            let flutterChannel = FlutterMethodChannel(name: InfobipRTCPlugin.RTC_CALL_EVENT_LISTENER_CHANNEL, binaryMessenger: messenger)
            flutterChannel.invokeMethod("onEvent", arguments: [
                "event": event,
                "data": data?.toJsonString()
            ])
        }
    }
}
