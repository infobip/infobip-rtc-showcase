package com.infobip.rtc.calls.showcase.model.events;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.infobip.rtc.calls.showcase.model.Properties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown=true)
public class CallReceivedEvent {
    private String callId;
}
