package com.infobip.rtc.showcase.token.infobip;

import com.infobip.rtc.showcase.token.TokenResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class TokenService {

    @Value("http://${infobip.api-host}${infobip.rtc-token-path}")
    private String infobipTokenUrl;

    private final RestTemplate restTemplate;
    private final HttpHeaders httpHeaders;

    private int counter = 0;

    public TokenService(@Value("${infobip.username}") String infobipUsername,
                        @Value("${infobip.password}") String infobipPassword) {
        restTemplate = new RestTemplate();
        httpHeaders = new HttpHeaders();
        httpHeaders.setBasicAuth(infobipUsername, infobipPassword);
    }

    public TokenResponse nextToken() {
        String identity = nextIdentity();
        HttpEntity<TokenRequest> request = new HttpEntity<>(new TokenRequest(identity), httpHeaders);
        TokenResponse response = restTemplate.postForObject(infobipTokenUrl, request, TokenResponse.class);
        response.setIdentity(identity);
        return response;
    }

    private String nextIdentity() {
        return String.format("user%d", counter++);
    }
}
