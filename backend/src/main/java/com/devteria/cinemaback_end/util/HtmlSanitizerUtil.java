package com.devteria.cinemaback_end.util;

import org.owasp.html.HtmlPolicyBuilder;
import org.owasp.html.PolicyFactory;

public class HtmlSanitizerUtil {

    // Tạo bộ lọc: Chỉ cho phép các thẻ HTML an toàn và thuộc tính an toàn
    private static final PolicyFactory POLICY = new HtmlPolicyBuilder()
            .allowElements("p", "b", "i", "strong", "em", "u", "br", "ul", "ol", "li", "img", "a", "h1", "h2", "h3")
            .allowUrlProtocols("http", "https")
            .allowAttributes("src").onElements("img")
            .allowAttributes("href", "target").onElements("a")
            .toFactory();

    public static String sanitize(String html) {
        if (html == null) return null; // Tránh lỗi NullPointerException
        return POLICY.sanitize(html);
    }
}