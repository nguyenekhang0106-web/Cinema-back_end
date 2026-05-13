package com.devteria.cinemaback_end.configuration;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
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
public class SecurityConfig {

    private final String[] PUBLIC_POST_ENDPOINTS = {
            "/users",
            "/users/register",
            "/users/verify-otp",
            "/users/resend-otp",
//            "/users/verify-email",
//            "/users/resend-verification",
            "/auth/token",
            "/auth/introspect",
            "/auth/logout",
            "/auth/refresh",
            "/auth/forgot-password",
            "/auth/reset-password",
            // 🔥 BỔ SUNG CHO MODULE PAYMENT (Để server VNPay/MoMo có thể gọi vào)
            "/payments/*/execute"
    };

    private final String[] PUBLIC_GET_ENDPOINTS = {
            "/movies",
            "/movies/**", // Ký hiệu ** giúp mở khóa cho cả /movies/{id}
            "/showtimes",     // Thêm dòng này: Cho phép xem danh sách lịch chiếu
            "/showtimes/**",   // Thêm dòng này: Cho phép xem chi tiết 1 lịch chiếu
            "/reviews/movie/**", "/reviews/*" , // Mở khóa để ai cũng xem được review
            "/cinemas", "/cinemas/**",
            "/halls", "/halls/**",
            "/banners",
            "/banners/**", // 🔥 ĐÃ THÊM: Mở khóa cho các đường dẫn con như /banners/cinema/{id}
            "/seats/hall/**",
            "/articles", "/articles/**",
            "/concessions",
            "/concessions/**",
            "/promotions",
            "/promotions/**"
    };

    @Value("${jwt.signerKey}")
    private String signerKey;

    @Autowired
    private  CustomJwtDecoder customJwtDecoder;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity httpSecurity) throws Exception {
        httpSecurity.authorizeHttpRequests(request -> request
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // 3. Cấu hình phân dải cho POST và GET
                .requestMatchers(HttpMethod.POST, PUBLIC_POST_ENDPOINTS).permitAll()
                .requestMatchers(HttpMethod.GET, PUBLIC_GET_ENDPOINTS).permitAll()

                .anyRequest().authenticated());

        // Kích hoạt CORS
        httpSecurity.cors(Customizer.withDefaults());

        // 🔥 BỔ SUNG EXCEPTION HANDLING CHO SPRING SECURITY Ở ĐÂY
        httpSecurity.oauth2ResourceServer(oauth2 -> oauth2.jwt(jwtConfigurer -> jwtConfigurer
                        .decoder(customJwtDecoder)
                        .jwtAuthenticationConverter(jwtAuthenticationConverter()))
                .authenticationEntryPoint(new JwtAuthenticationEntryPoint()));

        // Thêm dòng này để xử lý lỗi 403 Forbidden
        httpSecurity.exceptionHandling(exceptions -> exceptions
                .accessDeniedHandler(new CustomAccessDeniedHandler()));

        httpSecurity.csrf(AbstractHttpConfigurer::disable);

        return httpSecurity.build();
    }

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration corsConfiguration = new CorsConfiguration();

        //corsConfiguration.addAllowedOrigin("*");
        corsConfiguration.addAllowedOrigin("http://localhost:3000");
        corsConfiguration.addAllowedMethod("*");
        corsConfiguration.addAllowedHeader("*");

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