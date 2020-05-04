import Alamofire
import os.log

class TokenProvider {
    private static let TOKEN_API_URL = "http://localhost:9090/token"
    static let shared = TokenProvider()
    
    private var accessToken: AccessToken?
    
    func get(completion: @escaping (AccessToken?, Error?) -> Void) {
        if let token = accessToken { return completion(token, nil) }
        AF
            .request(TokenProvider.TOKEN_API_URL, method: .post, encoding: JSONEncoding.default)
            .responseDecodable(of: AccessToken.self) { response in
                if let accessToken = response.value {
                    self.accessToken = accessToken
                    completion(accessToken, nil)
                } else {
                    completion(nil, APIError.tokenUnavailable)
                }
            }
    }
}

class AccessToken: Decodable {
    let token: String
    let identity: String
    
    init(_ token: String, _ identity: String) {
        self.token = token
        self.identity = identity
    }
}

enum APIError: Error {
    case tokenUnavailable
}
