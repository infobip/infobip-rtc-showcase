package com.infobip.rtc.calls.showcase.model.requests;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ConnectWithNewCallRequest {
    private CallRequest callRequest;
    private boolean connectOnEarlyMedia;
    private ConferenceRequest conferenceRequest;
}
