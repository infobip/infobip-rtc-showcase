import Foundation
import InfobipRTC

extension AudioQualityMode {
    func toFlutterEnum() -> CodableModel.AudioQualityMode {
        switch (self) {
        case .auto:
            return .auto
        case .lowData:
            return .lowData
        case .highQuality:
            return .highQuality
        }
    }
}

extension AudioOptions {
    func toFlutterModel() -> CodableModel.AudioOptions {
        CodableModel.AudioOptions(
            audioQualityMode: self.audioQualityMode.toFlutterEnum()
        )
    }
}

extension CameraOrientation {
    func toFlutterEnum() -> CodableModel.CameraOrientation {
        switch (self) {
        case .front:
            return .front
        case .back:
            return .back
        }
    }
}

extension VideoMode {
    func toFlutterEnum() -> CodableModel.VideoMode {
        switch (self) {
        case .grid:
            return .grid
        case .presentation:
            return .presentation
        }
    }
}

extension VideoOptions {
    func toFlutterModel() -> CodableModel.VideoOptions {
        CodableModel.VideoOptions(
            cameraOrientation: self.cameraOrientation.toFlutterEnum(),
            videoMode: self.videoMode.toFlutterEnum()
        )
    }
}

extension RecordingType {
    func toFlutterEnum() -> CodableModel.RecordingType {
        switch (self) {
        case .audio:
            return .audio
        case .audio_and_video:
            return .audioAndVideo
        case .undefined:
            return .undefined
        }
    }
}

extension RecordingOptions {
    func toFlutterModel() -> CodableModel.RecordingOptions {
        CodableModel.RecordingOptions(
            recordingType: recordingType.toFlutterEnum()
        )
    }
}

extension PhoneCallOptions {
    func toFlutterModel() -> CodableModel.PhoneCallOptions {
        CodableModel.PhoneCallOptions(
            audio: audio,
            audioOptions: audioOptions.toFlutterModel(),
            recordingOptions: recordingOptions.toFlutterModel(),
            from: from
        )
    }
}

extension WebrtcCallOptions {
    func toFlutterModel() -> CodableModel.WebrtcCallOptions {
        CodableModel.WebrtcCallOptions(
            audio: audio,
            audioOptions: audioOptions.toFlutterModel(),
            recordingOptions: recordingOptions.toFlutterModel(),
            video: video,
            videoOptions: videoOptions.toFlutterModel()
        )
    }
}

extension WebrtcEndpoint {
    func toFlutterModel() -> CodableModel.WebrtcEndpoint {
        CodableModel.WebrtcEndpoint(
            identity: identifier(),
            displayName: displayIdentifier()
        )
    }
}

extension PhoneEndpoint {
    func toFlutterModel() -> CodableModel.PhoneEndpoint {
        CodableModel.PhoneEndpoint(
            phoneNumber: identifier()
        )
    }
}

extension PhoneCall {
    func toFlutterModel() -> CodableModel.PhoneCall {
        CodableModel.PhoneCall(
                id: id(),
                muted: muted(),
                source: CodableModel.WebrtcEndpoint(identity: source().identifier(), displayName: source().displayIdentifier()),
                destination: CodableModel.PhoneEndpoint(phoneNumber: destination().identifier()),
                counterpart: CodableModel.PhoneEndpoint(phoneNumber: counterpart().identifier())
        )
    }
}

extension WebrtcCall {
    func toFlutterModel() -> CodableModel.WebrtcCall {
        CodableModel.WebrtcCall(
                id: id(),
                muted: muted(),
                hasCameraVideo: hasCameraVideo(),
                hasRemoteCameraVideo: hasRemoteCameraVideo(),
                hasScreenShare: hasScreenShare(),
                hasRemoteScreenShare: hasRemoteScreenShare(),
                source: CodableModel.WebrtcEndpoint(identity: source().identifier(), displayName: source().displayIdentifier()),
                destination: CodableModel.WebrtcEndpoint(identity: destination().identifier(), displayName: destination().displayIdentifier()),
                counterpart: CodableModel.WebrtcEndpoint(identity: counterpart().identifier(), displayName: destination().displayIdentifier())
        )
    }
}

extension IncomingWebrtcCall {
    func toFlutterModel() -> CodableModel.IncomingWebrtcCall {
        CodableModel.IncomingWebrtcCall(
                id: id(),
                muted: muted(),
                hasCameraVideo: hasCameraVideo(),
                hasRemoteCameraVideo: hasRemoteCameraVideo(),
                source: CodableModel.WebrtcEndpoint(identity: source().identifier(), displayName: source().displayIdentifier()),
                destination: CodableModel.WebrtcEndpoint(identity: destination().identifier(), displayName: destination().displayIdentifier()),
                counterpart: CodableModel.WebrtcEndpoint(identity: counterpart().identifier(), displayName: counterpart().displayIdentifier())
        )
    }
}

extension ErrorCode {
    func toFlutterModel() -> CodableModel.ErrorCode {
        CodableModel.ErrorCode(id: id, name: name, description: description)
    }
}

extension CallHangupEvent {
    func toFlutterModel() -> CodableModel.CallHangupEvent {
        CodableModel.CallHangupEvent(
            errorCode: errorCode.toFlutterModel()
        )
    }
}

extension ErrorEvent {
    func toFlutterModel() -> CodableModel.ErrorEvent {
        CodableModel.ErrorEvent(
            errorCode: errorCode.toFlutterModel()
        )
    }
}

extension CallRecordingStartedEvent {
    func toFlutterModel() -> CodableModel.CallRecordingStartedEvent {
        CodableModel.CallRecordingStartedEvent(
            recordingType: recordingType.toFlutterEnum()
        )
    }
}

extension IncomingWebrtcCallEvent {
    func toFlutterModel() -> CodableModel.IncomingWebrtcCallEvent {
        CodableModel.IncomingWebrtcCallEvent(
            incomingWebrtcCall: incomingWebrtcCall.toFlutterModel()
        )
    }
}

extension Encodable {
    func toJsonData() -> Data? {
        do {
            return try JSONEncoder().encode(self)
        } catch {
            return nil
        }
    }

    func toJsonString() -> String? {
        guard let data = toJsonData() else {
            return nil
        }
        return String(decoding: data, as: UTF8.self)
    }
}
