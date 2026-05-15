package com.devteria.cinemaback_end.configuration;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "payment.vnpay")
public class VnPayProperties {
    String payUrl;
    String tmnCode;
    String hashSecret;
    String returnUrl;
    String version = "2.1.0";
    String command = "pay";
    String orderType = "other";
}
