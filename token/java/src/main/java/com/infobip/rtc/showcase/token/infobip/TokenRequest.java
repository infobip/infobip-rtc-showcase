package com.infobip.rtc.showcase.token.infobip;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TokenRequest {
    private String identity;
    private String applicationId;
}
