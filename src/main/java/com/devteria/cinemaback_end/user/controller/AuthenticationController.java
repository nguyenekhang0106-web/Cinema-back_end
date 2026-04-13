package com.devteria.cinemaback_end.user.controller;

import com.devteria.cinemaback_end.common.ApiResponse;
import com.devteria.cinemaback_end.user.dto.AuthenticationRequest;
import com.devteria.cinemaback_end.user.dto.AuthenticationResponse;
import com.devteria.cinemaback_end.user.dto.IntrospectRequest;
import com.devteria.cinemaback_end.user.dto.IntrospectResponse;
import com.devteria.cinemaback_end.user.service.AuthenticationService;
import com.nimbusds.jose.JOSEException;
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
@RequiredArgsConstructor // Tự động tạo Constructor cho class với các field final hoặc có anntotation @NonNull
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationController {
    AuthenticationService authenticationService;

    @PostMapping("/token")
    ApiResponse<AuthenticationResponse> authenticate(@RequestBody AuthenticationRequest request){
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
}
