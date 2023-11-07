package com.infobip.rtc.calls.showcase.model.requests;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SayRequest {
    private String text;
    private String language;
}
