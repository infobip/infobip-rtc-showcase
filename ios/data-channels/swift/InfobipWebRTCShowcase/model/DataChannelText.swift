import Foundation
import InfobipRTC

public class DataChannelText: NSObject {
    public let id: String
    public let from: Endpoint?
    public let to: Endpoint?
    public let date: Date
    public let content: String
    public var status: Status
    
    init(_ id: String, _ from: Endpoint?, _ to: Endpoint?, _ date: Date, _ content: String, _ status: Status) {
        self.id = id
        self.from = from
        self.to = to
        self.date = date
        self.content = content
        self.status = status
    }
}

public enum Status: Int, RawRepresentable, Codable {
    case sent
    case delivered
    case failed
    
    public typealias RawValue = String
    
    public var rawValue: RawValue {
        switch self {
        case .sent:
            return "sent"
        case .delivered:
            return "delivered"
        case .failed:
            return "failed"
        }
    }
    
    public init?(rawValue: RawValue) {
        switch rawValue {
        case "sent":
            self = .sent
        case "delivered":
            self = .delivered
        case "failed":
            self = .failed
        default:
            return nil
        }
    }
}
