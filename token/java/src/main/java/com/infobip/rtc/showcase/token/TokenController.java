package com.infobip.rtc.showcase.token;

import com.infobip.rtc.showcase.token.infobip.TokenService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

@RestController
@Slf4j
public class TokenController {

    private final TokenService tokenService;

    public TokenController(TokenService tokenService) {
        this.tokenService = tokenService;
    }

    @CrossOrigin
    @PostMapping("/token")
    public TokenResponse generate() {
        return tokenService.nextToken();
    }
}
