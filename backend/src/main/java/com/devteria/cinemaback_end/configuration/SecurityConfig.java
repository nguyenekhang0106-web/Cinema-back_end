package com.devteria.cinemaback_end.configuration;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // 🔥 BẮT BUỘC PHẢI CÓ để @PreAuthorize hoạt động
public class SecurityConfig {

    private final String[] PUBLIC_POST_ENDPOINTS = {
            "/users", "/users/register", "/users/verify-otp", "/users/resend-otp",
            "/auth/token", "/auth/introspect", "/auth/logout", "/auth/refresh",
            "/auth/forgot-password", "/auth/reset-password",
            "/payments/*/execute",
            "/ws/**",
            "/api/chat/upload-image"
    };

    private final String[] PUBLIC_GET_ENDPOINTS = {
            "/movies", "/movies/**", "/cinema/movies/**",
            "/showtimes", "/showtimes/**", "/cinema/showtimes/**",
            "/reviews/movie/**", "/reviews/*",
            "/cinemas", "/cinemas/**", "/cinema/cinemas/**",
            "/halls", "/halls/**", "/cinema/halls/**",

            // 🔥 ĐÃ BỔ SUNG CÁC TIỀN TỐ CHO BANNERS
            "/banners", "/banners/**", "/cinema/banners/**",

            "/seats/hall/**", "/cinema/seats/**",
            "/seats/status/**",
            "/articles", "/articles/**", "/cinema/articles/**",
            "/concessions", "/concessions/**", "/cinema/concessions/**",
            "/promotions", "/promotions/**", "/cinema/promotions/**",

            "/payments/vnpay/return", "/payments/vnpay/return/**",
            "/payments/vnpay/ipn", "/payments/vnpay/ipn/**",
            "/ws/**", "/images/**",

            "/api/chat/**",

    };

    @Value("${jwt.signerKey}")
    private String signerKey;

    @Autowired
    private CustomJwtDecoder customJwtDecoder;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity httpSecurity) throws Exception {
        httpSecurity.authorizeHttpRequests(request -> request
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(HttpMethod.POST, PUBLIC_POST_ENDPOINTS).permitAll()
                .requestMatchers(HttpMethod.GET, PUBLIC_GET_ENDPOINTS).permitAll()
                .anyRequest().authenticated());

        httpSecurity.cors(Customizer.withDefaults());

        httpSecurity.oauth2ResourceServer(oauth2 -> oauth2.jwt(jwtConfigurer -> jwtConfigurer
                        .decoder(customJwtDecoder)
                        .jwtAuthenticationConverter(jwtAuthenticationConverter()))
                .authenticationEntryPoint(new JwtAuthenticationEntryPoint()));

        httpSecurity.exceptionHandling(exceptions -> exceptions
                .accessDeniedHandler(new CustomAccessDeniedHandler()));

        httpSecurity.csrf(AbstractHttpConfigurer::disable);

        return httpSecurity.build();
    }

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration corsConfiguration = new CorsConfiguration();

        // 🔥 SỬ DỤNG AllowedOriginPatterns thay vì addAllowedOrigin để tương thích với Credentials
        corsConfiguration.setAllowedOriginPatterns(java.util.List.of("http://localhost:3000"));
        corsConfiguration.addAllowedMethod("*");
        corsConfiguration.addAllowedHeader("*");

        // 🔥 BẮT BUỘC PHẢI CÓ DÒNG NÀY ĐỂ FIX TRÚNG ĐÍCH LỖI "Access-Control-Allow-Credentials"
        corsConfiguration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource urlBasedCorsConfigurationSource = new UrlBasedCorsConfigurationSource();
        urlBasedCorsConfigurationSource.registerCorsConfiguration("/**", corsConfiguration);

        return new CorsFilter(urlBasedCorsConfigurationSource);
    }

    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter(){
        JwtGrantedAuthoritiesConverter jwtGrantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
        jwtGrantedAuthoritiesConverter.setAuthorityPrefix("");
        JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(jwtGrantedAuthoritiesConverter);
        return jwtAuthenticationConverter;
    }

    @Bean
    PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder(10);
    }
}