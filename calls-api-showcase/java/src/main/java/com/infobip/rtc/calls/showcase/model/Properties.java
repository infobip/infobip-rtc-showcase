package com.infobip.rtc.calls.showcase.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown=true)
public class Properties {
    private CallLog callLog;
}
