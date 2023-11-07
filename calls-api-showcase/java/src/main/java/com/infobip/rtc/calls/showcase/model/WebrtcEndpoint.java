package com.infobip.rtc.calls.showcase.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

@EqualsAndHashCode(callSuper = true)
@Data
@Builder
public class WebrtcEndpoint extends Endpoint {
    private String identity;

    public WebrtcEndpoint(String identity) {
        super("WEBRTC");
        this.identity = identity;
    }
}
