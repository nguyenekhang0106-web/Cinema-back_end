package com.devteria.cinemaback_end.user.service;

import com.devteria.cinemaback_end.common.SecurityUtils;
import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import com.devteria.cinemaback_end.user.dto.*;
import com.devteria.cinemaback_end.user.entity.InvalidatedToken;
import com.devteria.cinemaback_end.user.repository.UserRepository;
import com.devteria.cinemaback_end.user.entity.User;
import com.devteria.cinemaback_end.user.repository.InvalidatedRepository;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.StringJoiner;
import java.util.UUID;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AuthenticationService {
    UserRepository userRepository;
    InvalidatedRepository invalidatedRepository;
    LoginAttemptService loginAttemptService;

    @NonFinal
    @Value("${jwt.signerKey}")
    protected String SIGNER_KEY;

    @NonFinal
    @Value("${jwt.valid-duration}")
    protected long VALID_DURATION;

    @NonFinal
    @Value("${jwt.refreshable-duration}")
    protected String REFRESHABLE_DURAITON;

    public AuthenticationResponse authenticate(AuthenticationRequest request) {

        String username = request.getUsername();

        // ✅ Log hashed username for security (not plain credentials)
        log.debug("Login attempt: {}", SecurityUtils.hashSensitiveData(username));

        // Check rate limiting: max 5 failed attempts per 15 minutes
        if (!loginAttemptService.isLoginAllowed(username)) {
            long remainingSeconds = loginAttemptService.getRemainingLockoutTime(username);
            long remainingMinutes = (remainingSeconds + 59) / 60;
            log.warn("Login blocked due to rate limiting: {}", SecurityUtils.hashSensitiveData(username));
            throw new AppException(ErrorCode.TOO_MANY_LOGIN_ATTEMPTS,
                    String.format("Quá nhiều lần đăng nhập sai. Vui lòng thử lại sau %d phút", remainingMinutes));
        }

        User user;

        if (isEmail(username)) {
            user = userRepository.findByEmail(username)
                    .orElseThrow(() -> {
                        log.warn("User not found by email: {}", SecurityUtils.hashSensitiveData(username));
                        return new AppException(ErrorCode.USER_NOT_EXISTED);
                    });
        } else {
            user = userRepository.findByPhone(username)
                    .orElseThrow(() -> {
                        log.warn("User not found by phone: {}", SecurityUtils.hashSensitiveData(username));
                        return new AppException(ErrorCode.USER_NOT_EXISTED);
                    });
        }

        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);

        boolean authenticated = passwordEncoder.matches(
                request.getPassword(),
                user.getPassword()
        );

        if (!authenticated) {
            // Record failed attempt
            int currentAttempt = loginAttemptService.recordFailedAttempt(username);
            int remainingAttempts = loginAttemptService.getRemainingAttempts(username);

            log.warn("Failed login attempt #{} for: {}", currentAttempt, SecurityUtils.hashSensitiveData(username));

            if (remainingAttempts <= 0) {
                log.warn("Account locked due to too many failed attempts: {}", SecurityUtils.hashSensitiveData(username));
                throw new AppException(ErrorCode.TOO_MANY_LOGIN_ATTEMPTS,
                        "Quá nhiều lần đăng nhập sai. Vui lòng thử lại sau 15 phút");
            }

            throw new AppException(ErrorCode.UNAUTHENTICATED,
                    String.format("Mật khẩu không đúng. Bạn còn %d lần thử", remainingAttempts));
        }

        if (!user.isEmailVerified()) {
            log.warn("Login attempt with unverified email: {}", SecurityUtils.hashSensitiveData(username));
            throw new AppException(ErrorCode.EMAIL_NOT_VERIFIED);
        }

        // Successful login: clear attempts
        loginAttemptService.clearLoginAttempts(username);
        log.info("Successful login: {}", SecurityUtils.hashSensitiveData(username));

        var token = generateToken(user);

        return AuthenticationResponse.builder()
                .token(token)
                .authenticated(true)
                .build();
    }

    private boolean isEmail(String input) {
        return input != null && input.contains("@");
    }

    private String generateToken(User user) {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);

        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                .subject(user.getEmail())
                .issuer("devteria.com")
                .issueTime(new Date())
                .expirationTime(new Date(
                        Instant.now().plus(VALID_DURATION, ChronoUnit.SECONDS).toEpochMilli()
                ))
                .jwtID(UUID.randomUUID().toString())
                .claim("scope", buildScope(user))
                // 🔥 BỔ SUNG: Nhét User ID vào Token để Frontend lấy ra upload Avatar
                .claim("userId", user.getId())
                .claim("fullName", user.getFullName())
                .build();

        Payload payload = new Payload(jwtClaimsSet.toJSONObject());

        JWSObject jwsObject = new JWSObject(header, payload);

        try {
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            log.error("Cannot create token ", e);
            throw new RuntimeException(e);
        }
    }

    private String buildScope(User user){
        StringJoiner stringJoiner = new StringJoiner(" ");
        if(!CollectionUtils.isEmpty(user.getRoles())){
            user.getRoles().forEach(role ->  {
                stringJoiner.add("ROLE_" + role.getName());
            });
        }
        return stringJoiner.toString();
    }

    public IntrospectResponse introspect(IntrospectRequest request) throws JOSEException, ParseException {
        var token = request.getToken();
        boolean isValid = true;

        try{
            verifyToken(token, false);
        }catch(AppException e) {
            isValid = false;
        }

        return IntrospectResponse.builder()
                .valid(isValid)
                .build();
    }

    private SignedJWT verifyToken(String token, boolean isReFresh) throws JOSEException, ParseException {

        JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());

        SignedJWT signedJWT = SignedJWT.parse(token);
        Date expityTime = (isReFresh)
                ? new Date(signedJWT.getJWTClaimsSet().getIssueTime().toInstant().plus(Long.parseLong(REFRESHABLE_DURAITON), ChronoUnit.SECONDS)
                .toEpochMilli())
                :signedJWT.getJWTClaimsSet().getExpirationTime();

        var verified = signedJWT.verify(verifier);
        if(!(verified && expityTime.after(new Date()))){
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        if(invalidatedRepository.existsById(signedJWT.getJWTClaimsSet().getJWTID())){
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        return signedJWT;
    }

    public void logout(LogoutRequest request) throws ParseException, JOSEException {
        try{
            var signToken = verifyToken(request.getToken(), true);
            String jit = signToken.getJWTClaimsSet().getJWTID();
            Date expiryTime = signToken.getJWTClaimsSet().getExpirationTime();

            InvalidatedToken invalidatedToken = InvalidatedToken.builder()
                    .id(jit)
                    .expiryTime(expiryTime)
                    .build();
            invalidatedRepository.save(invalidatedToken);
        }catch (AppException exception){
            log.info("Token already expired");
        }
    }

    public AuthenticationResponse refreshToken(RefreshRequest request) throws ParseException, JOSEException {
        var signJWT = verifyToken(request.getToken(), true);

        var jit = signJWT.getJWTClaimsSet().getJWTID();
        var expiryTime = signJWT.getJWTClaimsSet().getExpirationTime();

        InvalidatedToken invalidatedToken = InvalidatedToken.builder()
                .id(jit)
                .expiryTime(expiryTime)
                .build();
        invalidatedRepository.save(invalidatedToken);

        var email = signJWT.getJWTClaimsSet().getSubject();
        var user = userRepository.findByEmail(email).orElseThrow(()
                -> new AppException(ErrorCode.UNAUTHENTICATED));

        var token = generateToken(user);

        return AuthenticationResponse.builder()
                .token(token)
                .authenticated(true)
                .build();
    }

    // 🔥 TỰ ĐỘNG DỌN RÁC: Chạy ngầm mỗi giờ (3,600,000 mili-giây)
    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void cleanupExpiredTokens() {
        invalidatedRepository.deleteAllByExpiryTimeBefore(new Date());
        log.info("CronJob: Đã dọn dẹp các token hết hạn khỏi Database thành công!");
    }
}