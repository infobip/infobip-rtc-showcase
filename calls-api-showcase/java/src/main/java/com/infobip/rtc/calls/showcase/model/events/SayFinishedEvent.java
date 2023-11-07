package com.infobip.rtc.calls.showcase.model.events;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.infobip.rtc.calls.showcase.model.SayFinishedProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown=true)
public class SayFinishedEvent {
    private String callId;
    private SayFinishedProperties properties;
}
