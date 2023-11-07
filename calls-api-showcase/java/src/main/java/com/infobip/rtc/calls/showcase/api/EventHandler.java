package com.infobip.rtc.calls.showcase.api;

import com.infobip.rtc.calls.showcase.model.events.*;

public interface EventHandler {
    void handleCallReceivedEvent(CallReceivedEvent callReceivedEvent);
    void handleCallEstablishedEvent(CallEstablishedEvent callEstablishedEvent);
    void handleSayFinishedEvent(SayFinishedEvent sayFinishedEvent);
    void handleCallFailedEvent(CallFailedEvent callFailedEvent);
    void handleCallFinishedEvent(CallFinishedEvent callFinishedEvent);
}
