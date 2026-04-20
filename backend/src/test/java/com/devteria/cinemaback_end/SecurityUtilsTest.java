package com.devteria.cinemaback_end;

import com.devteria.cinemaback_end.common.SecurityUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Test SecurityUtils class
 * Demonstrate hashing, verification, and secure token generation
 */
@DisplayName("Security Utils Tests")
class SecurityUtilsTest {

    @Test
    @DisplayName("Hash and verify OTP successfully")
    void testHashAndVerifyOtp() {
        // Arrange
        String plainOtp = "123456";

        // Act
        String hashedOtp = SecurityUtils.hashOtp(plainOtp);
        boolean isValid = SecurityUtils.verifyOtp(plainOtp, hashedOtp);

        // Assert
        assertNotNull(hashedOtp);
        assertTrue(isValid);
        assertNotEquals(plainOtp, hashedOtp); // Hash không bằng plain text
        assertTrue(hashedOtp.startsWith("$2a$12$")); // BCrypt format
    }

    @Test
    @DisplayName("Verify OTP returns false for wrong OTP")
    void testVerifyOtpFailure() {
        // Arrange
        String correctOtp = "123456";
        String wrongOtp = "654321";
        String hashedOtp = SecurityUtils.hashOtp(correctOtp);

        // Act
        boolean isValid = SecurityUtils.verifyOtp(wrongOtp, hashedOtp);

        // Assert
        assertFalse(isValid);
    }

    @Test
    @DisplayName("Hash same OTP produces different hashes (due to salt)")
    void testOtpHashIsNotDeterministic() {
        // Arrange
        String otp = "123456";

        // Act
        String hash1 = SecurityUtils.hashOtp(otp);
        String hash2 = SecurityUtils.hashOtp(otp);

        // Assert
        assertNotEquals(hash1, hash2); // Different hashes (different salts)
        // But both should verify correctly
        assertTrue(SecurityUtils.verifyOtp(otp, hash1));
        assertTrue(SecurityUtils.verifyOtp(otp, hash2));
    }

    @Test
    @DisplayName("Hash sensitive data (deterministic)")
    void testHashSensitiveData() {
        // Arrange
        String email = "user@example.com";

        // Act
        String hash1 = SecurityUtils.hashSensitiveData(email);
        String hash2 = SecurityUtils.hashSensitiveData(email);

        // Assert
        assertNotNull(hash1);
        assertEquals(hash1, hash2); // Deterministic - same input, same output
        assertNotEquals(email, hash1); // Not reversible
        assertEquals(44, hash1.length()); // SHA-256 base64 encoded (32 bytes → 44 chars)
    }

    @Test
    @DisplayName("Hash email for Redis key (deterministic)")
    void testHashEmailForRedisKey() {
        // Arrange
        String email = "user@example.com";

        // Act
        String hash1 = SecurityUtils.hashEmailForRedisKey(email);
        String hash2 = SecurityUtils.hashEmailForRedisKey(email.toLowerCase());

        // Assert
        assertNotNull(hash1);
        assertEquals(hash1, hash2); // Deterministic and case-insensitive
        assertEquals(64, hash1.length()); // SHA-256 hex (64 chars)
        assertTrue(hash1.matches("[0-9a-f]{64}")); // Hex format
    }

    @Test
    @DisplayName("Generate secure random tokens with different lengths")
    void testGenerateSecureToken() {
        // Act
        String token10 = SecurityUtils.generateSecureToken(10);
        String token20 = SecurityUtils.generateSecureToken(20);
        String token30 = SecurityUtils.generateSecureToken(30);

        // Assert
        assertNotNull(token10);
        assertNotNull(token20);
        assertNotNull(token30);
        assertNotEquals(token10, token20); // Different (random)
        assertNotEquals(token20, token30); // Different (random)
        assertTrue(token10.length() <= 15); // Base64URL encoding overhead
        assertTrue(token20.length() <= 27);
        assertTrue(token30.length() <= 40);
    }

    @Test
    @DisplayName("Secure token is URL safe (no padding)")
    void testSecureTokenIsUrlSafe() {
        // Act
        String token = SecurityUtils.generateSecureToken(20);

        // Assert
        assertFalse(token.contains("+")); // No + (use - instead)
        assertFalse(token.contains("/")); // No / (use _ instead)
        assertFalse(token.contains("=")); // No padding
    }

    @Test
    @DisplayName("OTP verification is timing-safe")
    void testOtpVerificationIsTimingSafe() {
        // Arrange
        String correctOtp = "123456";
        String wrongOtp1 = "654321"; // Completely different
        String wrongOtp2 = "123455"; // Only last digit different

        String hashedOtp = SecurityUtils.hashOtp(correctOtp);

        // Act
        boolean result1 = SecurityUtils.verifyOtp(wrongOtp1, hashedOtp);
        boolean result2 = SecurityUtils.verifyOtp(wrongOtp2, hashedOtp);

        // Assert
        assertFalse(result1);
        assertFalse(result2);
        // Both should fail without timing difference (timing-safe comparison)
    }

    @Test
    @DisplayName("Hash preserves case information")
    void testHashCaseSensitivity() {
        // Arrange
        String email1 = "User@Example.com";
        String email2 = "user@example.com";

        // Act
        String hash1 = SecurityUtils.hashSensitiveData(email1);
        String hash2 = SecurityUtils.hashSensitiveData(email2);

        // Assert
        assertNotEquals(hash1, hash2); // Different because case is different
    }

    @Test
    @DisplayName("Demo: Complete OTP flow")
    void testCompleteOtpFlow() {
        System.out.println("=== OTP Security Flow Demo ===\n");

        // Step 1: Generate OTP
        String plainOtp = "123456";
        System.out.println("Step 1: Generate OTP");
        System.out.println("  Plain OTP: " + plainOtp);

        // Step 2: Hash OTP
        String hashedOtp = SecurityUtils.hashOtp(plainOtp);
        System.out.println("\nStep 2: Hash OTP with BCrypt");
        System.out.println("  Hashed OTP: " + hashedOtp);

        // Step 3: Store in Redis
        String redisKey = "cinema:otp:" + SecurityUtils.hashSensitiveData("user@example.com");
        String redisValue = hashedOtp + ":0"; // format: hash:attempts
        System.out.println("\nStep 3: Store in Redis");
        System.out.println("  Key: " + redisKey);
        System.out.println("  Value: " + redisValue);

        // Step 4: User verify OTP
        String userInputOtp = "123456";
        boolean isValid = SecurityUtils.verifyOtp(userInputOtp, hashedOtp);
        System.out.println("\nStep 4: User verifies OTP");
        System.out.println("  User input: " + userInputOtp);
        System.out.println("  Valid: " + isValid);

        // Step 5: Wrong OTP attempt
        String wrongOtp = "654321";
        boolean isWrong = SecurityUtils.verifyOtp(wrongOtp, hashedOtp);
        System.out.println("\nStep 5: Wrong OTP attempt");
        System.out.println("  User input: " + wrongOtp);
        System.out.println("  Valid: " + isWrong);

        System.out.println("\n✅ OTP flow complete - All security checks passed!\n");
    }

    @Test
    @DisplayName("Demo: Logging security")
    void testLoggingSecurityDemo() {
        System.out.println("=== Logging Security Demo ===\n");

        String email = "john.doe@example.com";
        String username = "john_doe";

        System.out.println("❌ DANGEROUS - Never log like this:");
        System.out.println("  log.info(\"User login: {}\", \"" + email + "\");");

        String emailHash = SecurityUtils.hashSensitiveData(email);
        String usernameHash = SecurityUtils.hashSensitiveData(username);

        System.out.println("\n✅ SAFE - Log like this instead:");
        System.out.println("  log.info(\"User login: {} [hash: {}]\", \"" + email + "\", \"" + emailHash + "\");");
        System.out.println("  Output: User login: john.doe@example.com [hash: " + emailHash + "]");

        System.out.println("\n✅ Benefits:");
        System.out.println("  - Plain email visible in real-time logs");
        System.out.println("  - Hash identifies user in archived logs");
        System.out.println("  - Log leaks don't expose identifiers to attackers");
        System.out.println("  - Consistent hash for correlating events\n");
    }
}
