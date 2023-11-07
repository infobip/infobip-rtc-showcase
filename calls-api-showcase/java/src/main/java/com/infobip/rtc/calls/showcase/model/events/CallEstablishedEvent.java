package com.infobip.rtc.calls.showcase.model.events;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.infobip.rtc.calls.showcase.model.CallEstablishedProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown=true)
public class CallEstablishedEvent {
    private String callId;
    private CallEstablishedProperties properties;
}
