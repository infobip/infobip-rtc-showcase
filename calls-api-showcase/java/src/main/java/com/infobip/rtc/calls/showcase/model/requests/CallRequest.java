package com.infobip.rtc.calls.showcase.model.requests;

import com.infobip.rtc.calls.showcase.model.Endpoint;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CallRequest {
    private Endpoint endpoint;
    private String from;
}
