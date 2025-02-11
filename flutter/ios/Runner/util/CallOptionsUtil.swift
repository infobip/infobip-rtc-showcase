import InfobipRTC

class CallOptionsUtil {
    private static let audioQualityMapping: [String: AudioQualityMode] = [
        "AUTO": .auto,
        "LOW_DATA": .lowData,
        "HIGH_QUALITY": .highQuality
    ]
    
    private static let recordingTypeMapping: [String: RecordingType] = [
        "AUDIO": .audio,
        "AUDIO_AND_VIDEO": .audio_and_video,
        "UNDEFINED": .undefined
    ]
    
    static func getPhoneCallOptions(_ json: String) throws -> PhoneCallOptions? {
        let data = Data(json.utf8)
        if let dict = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any] {
            return PhoneCallOptions(
                audio: dict["audio"] as! Bool,
                audioOptions: getAudioOptions(from: dict["audioOptions"] as! [String: Any]),
                recordingOptions: getRecordingOptions(from: dict["recordingOptions"] as! [String: Any]),
                customData: [:],
                autoReconnect: dict["autoReconnect"] as! Bool
            )
        }

        return nil
    }

    static func getWebrtcCallOptions(_ json: String) throws -> WebrtcCallOptions? {
        let data = Data(json.utf8)
        if let dict = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any] {
            return WebrtcCallOptions(
                audio: dict["audio"] as! Bool,
                audioOptions: getAudioOptions(from: dict["audioOptions"] as! [String: Any]),
                recordingOptions: getRecordingOptions(from: dict["recordingOptions"] as! [String: Any]),
                video: dict["video"] as! Bool,
                videoOptions: getVideoOptions(from: dict["videoOptions"] as! [String: Any]),
                customData: [:],
                dataChannel: dict["dataChannel"] as! Bool,
                autoReconnect: dict["autoReconnect"] as! Bool
            )
        }

        return nil
    }
    
    static func getAudioOptions(from data: [String: Any]) -> AudioOptions {
        let audioQualityMode = audioQualityMapping[data["audioQualityMode"] as? String ?? "auto"] ?? .auto
        return AudioOptions(audioQualityMode)
    }

    static func getVideoOptions(from data: [String: Any]) -> VideoOptions {
        let cameraOrientation = CameraOrientation(rawValue: (data["cameraOrientation"] as? String ?? "").lowercased()) ?? .front
        let videoMode = VideoMode(rawValue: (data["videoMode"] as? String ?? "").lowercased()) ?? .presentation
        return VideoOptions(cameraOrientation, videoMode)
    }

    static func getRecordingOptions(from data: [String: Any]) -> RecordingOptions {
        let recordingType = recordingTypeMapping[data["recordingType"] as? String ?? "undefined"] ?? .undefined
        return RecordingOptions(recordingType)
    }
}
