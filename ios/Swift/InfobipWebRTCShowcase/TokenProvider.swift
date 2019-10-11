import Alamofire
import os.log

class TokenProvider {
    private static let TOKEN_API_URL = "http://localhost:9090/token"
    static let shared = TokenProvider()
    
    func get(completion: @escaping (AccessToken?, Error?) -> Void) {
        Alamofire
            .request(TokenProvider.TOKEN_API_URL, method: .post, encoding: JSONEncoding.default)
            .responseJSON { response in
                guard
                    let body = response.result.value,
                    let json = body as? NSDictionary,
                    let token = json.value(forKey: "token") as? String,
                    let identity = json.value(forKey: "identity") as? String
                else {
                    os_log("Failed to generate token")
                    completion(nil, APIError.tokenUnavailable)
                    return
                }
            
                completion(AccessToken(token, identity), nil)
        }
    }
}

class AccessToken {
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
