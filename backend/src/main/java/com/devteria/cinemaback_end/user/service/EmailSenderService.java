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
            helper.setText(buildVerificationBody(fullName, sixDigitCode), true);
            mailSender.send(message);
        } catch (MessagingException e) {
            log.error("Cannot send verification email to {}", toEmail, e);
            throw new AppException(ErrorCode.UNABLE_TO_SEND_EMAIL);
        }
    }

//    private static String buildVerificationBody(String fullName, String sixDigitCode) {
//        return "Xin chào " + fullName + ",\n\n"
//                + "Mã xác thực email của bạn là: " + sixDigitCode + "\n\n"
//                + "Mã có hiệu lực trong thời gian giới hạn. Không chia sẻ mã này với người khác.\n\n"
//                + "Nếu bạn không thực hiện đăng ký, hãy bỏ qua email này.\n";
//    }
private static String buildVerificationBody(String fullName, String sixDigitCode) {
    String htmlTemplate = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
                <h2 style="color: #333333; text-align: center; margin-bottom: 20px;">Xác thực địa chỉ email</h2>
                
                <p style="color: #555555; font-size: 16px; line-height: 1.5;">Xin chào <strong>%s</strong>,</p>
                
                <p style="color: #555555; font-size: 16px; line-height: 1.5;">
                    Cảm ơn bạn đã đăng ký tài khoản. Để hoàn tất quá trình, vui lòng sử dụng mã xác thực gồm 6 chữ số dưới đây:
                </p>
                
                <div style="text-align: center; margin: 35px 0;">
                    <span style="display: inline-block; font-size: 32px; font-weight: bold; color: #2c3e50; background-color: #f8f9fa; padding: 15px 30px; border-radius: 8px; letter-spacing: 8px; border: 2px dashed #cbd5e1;">
                        %s
                    </span>
                </div>
                
                <p style="color: #e74c3c; font-size: 14px; text-align: center; font-weight: bold;">
                    Mã này có hiệu lực trong thời gian 10 phút kể từ lúc gửi đi. Tuyệt đối không chia sẻ mã này với người khác.
                </p>
                
                <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">
                
                <p style="color: #999999; font-size: 13px; text-align: center; margin: 0;">
                    Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email và đảm bảo an toàn cho tài khoản của mình.
                </p>
            </div>
        </body>
        </html>
        """;

    return String.format(htmlTemplate, fullName, sixDigitCode);
}
}
