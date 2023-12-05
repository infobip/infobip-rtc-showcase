import Alamofire

class TokenProvider {
    private static let TOKEN_API_URL = "http://localhost:8080/token"
    static let shared = TokenProvider()
    
    private var accessToken: AccessToken?
    
    func get(completion: @escaping (AccessToken?, Error?) -> Void) {
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
    
    func get(identity: String, completion: @escaping (AccessToken?, Error?) -> Void) {
        let url = TokenProvider.TOKEN_API_URL + "/" + identity
        AF
            .request(url, method: .post, encoding: JSONEncoding.default)
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
