package com.infobip.rtc.calls.showcase.controller;

import com.infobip.rtc.calls.showcase.api.EventHandler;
import com.infobip.rtc.calls.showcase.model.EventType;
import com.infobip.rtc.calls.showcase.model.events.*;
import com.infobip.rtc.calls.showcase.util.EventUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j
public class ShowcaseController {
    private final EventHandler eventHandler;

    @CrossOrigin
    @PostMapping("/event")
    public void callReceivedEvent(@RequestBody Map<String, Object> body) {
        EventUtils.getEventType(body)
                .ifPresentOrElse(
                        eventType -> handleEventType(eventType, body),
                        () -> log.debug("Unhandled event: {}", body)
                );
    }

    private void handleEventType(EventType eventType, Map<String, Object> body) {
        switch (eventType) {
            case CALL_RECEIVED -> eventHandler.handleCallReceivedEvent(EventUtils.convert(body, CallReceivedEvent.class));
            case CALL_ESTABLISHED -> eventHandler.handleCallEstablishedEvent(EventUtils.convert(body, CallEstablishedEvent.class));
            case SAY_FINISHED -> eventHandler.handleSayFinishedEvent(EventUtils.convert(body, SayFinishedEvent.class));
            case CALL_FAILED -> eventHandler.handleCallFailedEvent(EventUtils.convert(body, CallFailedEvent.class));
            case CALL_FINISHED -> eventHandler.handleCallFinishedEvent(EventUtils.convert(body, CallFinishedEvent.class));
        }
    }
}
