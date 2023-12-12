package com.infobip.rtc.calls.showcase.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@JsonIgnoreProperties(ignoreUnknown=true)
public class CallLog {
    private String callId;
    private List<String> conferenceIds;
    private ErrorCode errorCode;
    private Map<String, String> customData;
}
