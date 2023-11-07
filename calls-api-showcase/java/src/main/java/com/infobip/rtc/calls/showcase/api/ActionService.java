package com.infobip.rtc.calls.showcase.api;

public interface ActionService {
    void answer(String callId);
    void say(String callId, String text, String languageCode);
    void createDialog(String callId, String phoneNumber);
    void hangupCall(String callId);
    void hangupConference(String conferenceId);
    void connectWithNewCall(String callId, String identity);
}
