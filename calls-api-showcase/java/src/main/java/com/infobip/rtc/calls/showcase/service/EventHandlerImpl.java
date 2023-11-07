package com.infobip.rtc.calls.showcase.service;

import com.infobip.rtc.calls.showcase.api.ActionService;
import com.infobip.rtc.calls.showcase.api.EventHandler;
import com.infobip.rtc.calls.showcase.model.*;
import com.infobip.rtc.calls.showcase.model.events.*;
import jakarta.annotation.Nullable;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class EventHandlerImpl implements EventHandler {
    @Value("${phone-number}")
    private String phoneNumber;
    private final ActionService actionService;

    @Override
    public void handleCallReceivedEvent(CallReceivedEvent callReceivedEvent) {
        log.info("Handling call received event: {}", callReceivedEvent);
        actionService.answer(callReceivedEvent.getCallId());
    }

    @Override
    public void handleCallEstablishedEvent(CallEstablishedEvent callEstablishedEvent) {
        getDirection(callEstablishedEvent.getProperties())
                .ifPresent(direction -> handleCallEstablishedWithDirection(direction, callEstablishedEvent));
    }

    @Override
    public void handleSayFinishedEvent(SayFinishedEvent sayFinishedEvent) {
        log.info("Handling say finished event: {}", sayFinishedEvent);
        String callId = sayFinishedEvent.getCallId();
        getScenario(sayFinishedEvent.getProperties())
                .ifPresent(scenario -> handleSayFinishedWithScenario(scenario, callId));
    }

    @Override
    public void handleCallFailedEvent(CallFailedEvent callFailedEvent) {
        log.info("Handling call failed event: {}", callFailedEvent);
        getConferenceId(callFailedEvent.getProperties())
                .ifPresent(actionService::hangupConference);
    }

    @Override
    public void handleCallFinishedEvent(CallFinishedEvent callFinishedEvent) {
        log.info("Handling call finished event: {}", callFinishedEvent);
        getConferenceId(callFinishedEvent.getProperties())
                .ifPresent(actionService::hangupConference);
    }

    private void handleSayFinishedWithScenario(String scenario, String callId) {
        if ("dialog".equals(scenario)) {
            log.debug("Unavailability announcement completed for call id: {}, hanging up", callId);
            actionService.hangupCall(callId);
        } else if ("conference".equals(scenario)) {
            log.info("Agent found for call id: {}, connecting", callId);
            actionService.connectWithNewCall(callId, "agent");
        }
    }

    private void handleCallEstablishedWithDirection(String direction, CallEstablishedEvent callEstablishedEvent) {
        if (!"INBOUND".equals(direction)) {
            return;
        }
        log.info("Handling inbound call established event: {}", callEstablishedEvent);
        var callId = callEstablishedEvent.getCallId();
        getScenario(callEstablishedEvent.getProperties())
                .ifPresent(scenario -> handleCallEstablishedWithScenario(scenario, callId));
    }

    private Optional<String> getScenario(@Nullable CallEstablishedProperties properties) {
        return Optional.ofNullable(properties)
                .map(CallEstablishedProperties::getCall)
                .map(Call::getCustomData)
                .map(customData -> customData.get("scenario"));
    }

    private Optional<String> getScenario(@Nullable SayFinishedProperties sayFinishedProperties) {
        return Optional.ofNullable(sayFinishedProperties)
                .map(SayFinishedProperties::getCustomData)
                .map(customData -> customData.get("scenario"));
    }

    private Optional<String> getConferenceId(@Nullable Properties properties) {
        return Optional.ofNullable(properties)
                .map(Properties::getCallLog)
                .map(CallLog::getConferenceIds)
                .map(conferenceIds -> !conferenceIds.isEmpty() ? conferenceIds.get(0) : null);
    }

    private Optional<String> getDirection(@Nullable CallEstablishedProperties properties) {
        return Optional.ofNullable(properties)
                .map(CallEstablishedProperties::getCall)
                .map(Call::getDirection);
    }

    private void handleCallEstablishedWithScenario(String scenario, String callId) {
        if ("dialog".equals(scenario)) {
            if (phoneNumber != null) {
                log.debug("Call with id: {} joining dialog", callId);
                actionService.createDialog(callId, phoneNumber);
            } else {
                log.debug("Phone service not available, call id: {}", callId);
                actionService.say(callId, "Phone call service is currently unavailable", "en");
            }
        } else if ("conference".equals(scenario)) {
            log.debug("Notifying call id: {} about agent search", callId);
            actionService.say(callId, "Wait as we connect you to one of our agents!", "en");
        } else {
            log.warn("Unexpected scenario for call id: {}, hanging up", callId);
            actionService.hangupCall(callId);
        }
    }
}
