package com.devteria.cinemaback_end.common;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

/**
 * Utility class cho các thao tác bảo mật
 * - Hash OTP với BCrypt
 * - Verify OTP
 * - Hash email cho Redis keys
 */
public class SecurityUtils {
    
    private static final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(12);

    /**
     * Hash OTP using BCrypt (an toàn nhất)
     * @param otp Plain text OTP (6 digits)
     * @return Hashed OTP
     */
    public static String hashOtp(String otp) {
        return passwordEncoder.encode(otp);
    }

    /**
     * Verify OTP with hashed value
     * @param plainOtp User input OTP
     * @param hashedOtp Stored hashed OTP
     * @return true if matches
     */
    public static boolean verifyOtp(String plainOtp, String hashedOtp) {
        return passwordEncoder.matches(plainOtp.trim(), hashedOtp);
    }

    /**
     * Hash email for Redis key (không cần reversible, chỉ để obscure)
     * Dùng SHA-256 vì nó deterministic (email cố định → hash cố định)
     * @param email Plain email
     * @return Hashed email (hex string)
     */
    public static String hashEmailForRedisKey(String email) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(email.toLowerCase().trim().getBytes(StandardCharsets.UTF_8));
            
            // Convert bytes to hex string
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }

    /**
     * Hash sensitive data (for logging/debugging - one-way hash)
     * @param data Sensitive data to hash
     * @return Base64 encoded SHA-256 hash
     */
    public static String hashSensitiveData(String data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }

    /**
     * Generate secure random token (for verification tokens, reset tokens)
     * @param length Token length
     * @return Random token
     */
    public static String generateSecureToken(int length) {
        byte[] randomBytes = new byte[length];
        new java.security.SecureRandom().nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }
}
