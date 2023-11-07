package com.infobip.rtc.calls.showcase.model.requests;

import com.infobip.rtc.calls.showcase.model.PropagationOptions;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CreateDialogRequest {
    private String parentCallId;
    private CallRequest childCallRequest;
    private PropagationOptions propagationOptions;
}
