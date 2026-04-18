package com.devteria.cinemaback_end.user.service;

import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import jakarta.annotation.PostConstruct;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.Properties;

@Service
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EmailSenderService {

    @Value("${mail.host}")
    String host;

    @Value("${mail.port}")
    int port;

    @Value("${mail.username}")
    String username;

    @Value("${mail.password}")
    String password;

    JavaMailSenderImpl mailSender;

    @PostConstruct
    void initMailSender() {
        mailSender = new JavaMailSenderImpl();
        mailSender.setHost(host);
        mailSender.setPort(port);
        mailSender.setUsername(username);
        mailSender.setPassword(password);
        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
    }

    public void sendVerificationCode(String toEmail, String fullName, String sixDigitCode) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(username);
            helper.setTo(toEmail);
            helper.setSubject("Mã xác thực đăng ký Cinema");
            helper.setText(buildVerificationBody(fullName, sixDigitCode), false);
            mailSender.send(message);
        } catch (MessagingException e) {
            log.error("Cannot send verification email to {}", toEmail, e);
            throw new AppException(ErrorCode.UNABLE_TO_SEND_EMAIL);
        }
    }

    private static String buildVerificationBody(String fullName, String sixDigitCode) {
        return "Xin chào " + fullName + ",\n\n"
                + "Mã xác thực email của bạn là: " + sixDigitCode + "\n\n"
                + "Mã có hiệu lực trong thời gian giới hạn. Không chia sẻ mã này với người khác.\n\n"
                + "Nếu bạn không thực hiện đăng ký, hãy bỏ qua email này.\n";
    }
}
