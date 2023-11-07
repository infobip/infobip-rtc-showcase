package com.infobip.rtc.calls.showcase.model.requests;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ConferenceRequest {
    private long maxDuration;
}
