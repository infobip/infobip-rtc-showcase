package com.infobip.rtc.calls.showcase.service;

import com.infobip.rtc.calls.showcase.api.ActionService;
import com.infobip.rtc.calls.showcase.model.PhoneEndpoint;
import com.infobip.rtc.calls.showcase.model.PropagationOptions;
import com.infobip.rtc.calls.showcase.model.WebrtcEndpoint;
import com.infobip.rtc.calls.showcase.model.requests.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class ActionServiceImpl implements ActionService {
    private static final long MAX_DURATION = 600;
    private static final String FROM = "Customer";
    @Value("http://${infobip.api-host}")
    private String baseUrl;

    private final RestTemplate restTemplate;
    private final HttpHeaders httpHeaders;

    @Override
    public void answer(String callId) {
        var request = new HttpEntity<>(Collections.emptyMap(), httpHeaders);
        restTemplate.postForLocation(String.format("%s/calls/1/calls/%s/answer", baseUrl, callId), request);
    }

    @Override
    public void say(String callId, String text, String languageCode) {
        var request = new HttpEntity<>(sayRequest(text, languageCode), httpHeaders);
        restTemplate.postForLocation(String.format("%s/calls/1/calls/%s/say", baseUrl, callId), request);
    }

    @Override
    public void createDialog(String callId, String phoneNumber) {
        var request = new HttpEntity<>(createDialogRequest(callId, phoneNumber), httpHeaders);
        restTemplate.postForLocation(String.format("%s/calls/1/dialogs", baseUrl), request);
    }

    @Override
    public void hangupCall(String callId) {
        var request = new HttpEntity<>(Collections.emptyMap(), httpHeaders);
        restTemplate.postForLocation(String.format("%s/calls/1/calls/%s/hangup", baseUrl, callId), request);
    }

    @Override
    public void hangupConference(String conferenceId) {
        var request = new HttpEntity<>(Collections.emptyMap(), httpHeaders);
        restTemplate.postForLocation(String.format("%s/calls/1/conferences/%s/hangup", baseUrl, conferenceId), request);
    }

    @Override
    public void connectWithNewCall(String callId, String identity) {
        var request = new HttpEntity<>(connectWithNewCallRequest(identity, callId), httpHeaders);
        restTemplate.postForLocation(String.format("%s/calls/1/calls/%s/connect", baseUrl, callId), request);
    }

    private SayRequest sayRequest(String text, String languageCode) {
        return SayRequest.builder()
                .text(text)
                .language(languageCode)
                .build();
    }

    private CreateDialogRequest createDialogRequest(String callId, String phoneNumber) {
        return CreateDialogRequest.builder()
                .parentCallId(callId)
                .childCallRequest(CallRequest.builder()
                        .endpoint(PhoneEndpoint.builder()
                                .phoneNumber(phoneNumber)
                                .build())
                        .from(FROM)
                        .build())
                .propagationOptions(PropagationOptions.builder()
                        .childCallHangup(true)
                        .childCallRinging(true)
                        .build())
                .build();
    }

    private ConnectWithNewCallRequest connectWithNewCallRequest(String identity, String callId) {
        return ConnectWithNewCallRequest.builder()
                .callRequest(CallRequest.builder()
                        .endpoint(WebrtcEndpoint.builder()
                                .identity(identity)
                                .build())
                        .from(FROM)
                        .customData(Map.of("parentCallId", callId))
                        .build())
                .connectOnEarlyMedia(true)
                .conferenceRequest(ConferenceRequest.builder()
                        .maxDuration(MAX_DURATION)
                        .build())
                .build();
    }
}
