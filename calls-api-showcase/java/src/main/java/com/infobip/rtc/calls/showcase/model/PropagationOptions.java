package com.infobip.rtc.calls.showcase.model;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PropagationOptions {
    private boolean childCallRinging;
    private boolean childCallHangup;
}
