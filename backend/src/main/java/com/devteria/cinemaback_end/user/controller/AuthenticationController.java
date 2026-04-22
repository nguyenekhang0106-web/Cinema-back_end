package com.devteria.cinemaback_end.user.controller;

import com.devteria.cinemaback_end.common.ApiResponse;
import com.devteria.cinemaback_end.user.dto.*;
import com.devteria.cinemaback_end.user.service.AuthenticationService;
import com.nimbusds.jose.JOSEException;
import jakarta.validation.Valid; // Bổ sung import này
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.text.ParseException;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationController {
    AuthenticationService authenticationService;

    @PostMapping("/token")
        // BỔ SUNG @Valid Ở ĐÂY
    ApiResponse<AuthenticationResponse> authenticate(@RequestBody @Valid AuthenticationRequest request){
        var result = authenticationService.authenticate(request);

        ApiResponse<AuthenticationResponse> response = new ApiResponse<>();
        response.setResult(result);

        return response;
    }

    @PostMapping("/introspect")
    ApiResponse<IntrospectResponse> authenticate(@RequestBody IntrospectRequest request)
            throws ParseException, JOSEException {
        var result = authenticationService.introspect(request);

        ApiResponse<IntrospectResponse> response = new ApiResponse<>();
        response.setResult(result);
        return response;
    }

    @PostMapping("/logout")
    ApiResponse<Void> logout(@RequestBody LogoutRequest request)
            throws ParseException, JOSEException {

        authenticationService.logout(request);

        ApiResponse<Void> response = new ApiResponse<>();
        response.setResult(null);

        return response;
    }

    @PostMapping("/refresh")
    ApiResponse<AuthenticationResponse> authenticate(@RequestBody RefreshRequest request) throws ParseException, JOSEException {
        var result = authenticationService.refreshToken(request);

        ApiResponse<AuthenticationResponse> response = new ApiResponse<>();
        response.setResult(result);

        return response;
    }
}