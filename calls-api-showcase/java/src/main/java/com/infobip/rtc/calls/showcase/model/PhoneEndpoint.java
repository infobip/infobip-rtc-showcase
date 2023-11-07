package com.infobip.rtc.calls.showcase.model;

import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
@Builder
public class PhoneEndpoint extends Endpoint {
    private String phoneNumber;

    public PhoneEndpoint(String phoneNumber) {
        super("PHONE");
        this.phoneNumber = phoneNumber;
    }
}
