import Alamofire
import os.log

class TokenProvider {
    private static let TOKEN_API_URL = "http://localhost:8080/token"
    static let shared = TokenProvider()

    private var accessToken: AccessToken? = AccessToken("eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhcHAiOiI2NzU4OWM2Mi0wNDQ2LTRkNmEtYjNiNC1jYjkxZWI3MGQ3N2EiLCJpZGVudGl0eSI6ImFkbmFuZSIsImlzcyI6IkluZm9iaXAiLCJuYW1lIjoiQWRuYW4gRWxlem92aWMiLCJsb2NhdGlvbiI6IiIsImV4cCI6MTY1NjcxNDA2MSwiY2FwcyI6W119.L7Q0zNhob7JHLJ-tnYeDCKEK89d0rsQdSZxak0nkRw8", "adnane")
    
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
