package com.infobip.rtc.calls.showcase.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.Map;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class SayFinishedProperties {
    private Map<String, String> customData;
}
