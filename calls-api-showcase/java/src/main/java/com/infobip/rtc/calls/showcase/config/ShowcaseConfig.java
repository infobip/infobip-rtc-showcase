package com.infobip.rtc.calls.showcase.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.web.client.RestTemplate;

@Configuration
public class ShowcaseConfig {
    private final String infobipApiKey;

    public ShowcaseConfig(@Value("${infobip.api-key}") String infobipApiKey) {
        this.infobipApiKey = infobipApiKey;
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Bean
    public HttpHeaders httpHeaders() {
        var httpHeaders = new HttpHeaders();
        httpHeaders.set(HttpHeaders.CONTENT_TYPE, "application/json");
        httpHeaders.set(HttpHeaders.AUTHORIZATION, String.format("App %s", infobipApiKey));
        return httpHeaders;
    }
}
