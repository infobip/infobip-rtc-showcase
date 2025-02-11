import Foundation

class CodableModel {
    enum AudioQualityMode: String, Codable {
        case auto = "AUTO"
        case lowData = "LOW_DATA"
        case highQuality = "HIGH_QUALITY"
    }

    struct AudioOptions: Codable {
        let audioQualityMode: AudioQualityMode?
    }
    
    enum CameraOrientation: String, Codable {
        case front = "FRONT"
        case back = "BACK"
    }

    enum VideoMode: String, Codable {
        case grid = "GRID"
        case presentation = "PRESENTATION"
    }
    
    struct VideoOptions: Codable {
        let cameraOrientation: CameraOrientation?
        let videoMode: VideoMode?
    }
    
    enum RecordingType: String, Codable {
        case audio = "AUDIO"
        case audioAndVideo = "AUDIO_AND_VIDEO"
        case undefined = "UNDEFINED"
    }

    struct RecordingOptions: Codable {
        let recordingType: RecordingType?
    }

    struct PhoneCallOptions {
        let audio: Bool?
        let audioOptions: AudioOptions?
        let recordingOptions: RecordingOptions?
        let from: String?
    }
    
    struct WebrtcCallOptions {
        let audio: Bool?
        let audioOptions: AudioOptions?
        let recordingOptions: RecordingOptions?
        let video: Bool?
        let videoOptions: VideoOptions?
    }

    struct WebrtcEndpoint: Codable {
        let identity: String
        let displayName: String?
    }
    
    struct PhoneEndpoint: Codable {
        let phoneNumber: String
    }
    
    struct PhoneCall: Codable {
        let id: String
        let muted: Bool
        let source: WebrtcEndpoint
        let destination: PhoneEndpoint
        let counterpart: PhoneEndpoint
    }

    struct WebrtcCall: Codable {
        let id: String
        let muted: Bool
        let hasCameraVideo: Bool
        let hasRemoteCameraVideo: Bool
        let hasScreenShare: Bool
        let hasRemoteScreenShare: Bool
        let source: WebrtcEndpoint
        let destination: WebrtcEndpoint
        let counterpart: WebrtcEndpoint
    }
    
    struct IncomingWebrtcCall: Codable {
        let id: String
        let muted: Bool
        let hasCameraVideo: Bool
        let hasRemoteCameraVideo: Bool
        let source: WebrtcEndpoint
        let destination: WebrtcEndpoint
        let counterpart: WebrtcEndpoint
    }

    struct ErrorCode: Codable {
        let id: Int
        let name: String?
        let description: String?
    }

    struct CallHangupEvent: Codable {
        let errorCode: ErrorCode
    }
    
    struct ErrorEvent: Codable {
        let errorCode: ErrorCode
    }
    
    struct CallRecordingStartedEvent: Codable {
        let recordingType: RecordingType
    }

    struct IncomingWebrtcCallEvent: Codable {
        let incomingWebrtcCall: IncomingWebrtcCall
    }
}
