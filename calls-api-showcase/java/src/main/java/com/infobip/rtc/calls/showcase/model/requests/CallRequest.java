package com.infobip.rtc.calls.showcase.model.requests;

import com.infobip.rtc.calls.showcase.model.Endpoint;
import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class CallRequest {
    private Endpoint endpoint;
    private String from;
    private Map<String, String> customData;
}
