package com.devteria.cinemaback_end.user.service;

import com.devteria.cinemaback_end.booking.dto.BookingPaidMessage;
import com.devteria.cinemaback_end.booking.entity.Booking;
import com.devteria.cinemaback_end.booking.entity.Ticket;
import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import com.devteria.cinemaback_end.movie.entity.Movie;
import com.devteria.cinemaback_end.movie.entity.Showtime;
import com.devteria.cinemaback_end.util.S3Service;
import jakarta.annotation.PostConstruct;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.text.StringEscapeUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Properties;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EmailSenderService {

    private static final String BRAND_NAME = "KCT Cinema";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    final S3Service s3Service;

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
            helper.setSubject("Mã xác thực đăng ký " + BRAND_NAME);
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

    public void sendPasswordResetLink(String toEmail, String resetLink) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(username);
            helper.setTo(toEmail);
            helper.setSubject("Yêu cầu đặt lại mật khẩu " + BRAND_NAME);
            helper.setText(buildPasswordResetBody(resetLink), true);
            mailSender.send(message);
        } catch (MessagingException e) {
            log.error("Cannot send password reset email to {}", toEmail, e);
            throw new AppException(ErrorCode.UNABLE_TO_SEND_EMAIL);
        }
    }

    public void sendBookingPaidConfirmation(BookingPaidMessage bookingPaidMessage) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(username);
            helper.setTo(bookingPaidMessage.getCustomerEmail());
            helper.setSubject(BRAND_NAME + " - Booking paid " + bookingPaidMessage.getBookingCode());
            helper.setText(buildBookingPaidBody(bookingPaidMessage), true);
            mailSender.send(message);
            log.info("Booking paid email sent bookingId={}, email={}",
                    bookingPaidMessage.getBookingId(), bookingPaidMessage.getCustomerEmail());
        } catch (MessagingException | MailException e) {
            log.error("Cannot send booking paid email bookingId={}, email={}",
                    bookingPaidMessage.getBookingId(), bookingPaidMessage.getCustomerEmail(), e);
            throw new AppException(ErrorCode.UNABLE_TO_SEND_EMAIL);
        }
    }

    public void sendBookingTicketEmail(Booking booking, List<Ticket> tickets) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(username);
            helper.setTo(booking.getCustomer().getEmail());
            helper.setSubject(BRAND_NAME + " - E-ticket " + booking.getBookingCode());
            helper.setText(buildBookingTicketBody(booking, tickets), true);
            addInlinePosterImage(helper, booking, tickets);
            addInlineQrImages(helper, tickets);
            mailSender.send(message);
            log.info("Ticket email sent bookingId={}, email={}, ticketCodes={}",
                    booking.getId(),
                    booking.getCustomer().getEmail(),
                    tickets.stream().map(Ticket::getTicketCode).toList());
        } catch (MessagingException | MailException e) {
            log.error("Cannot send ticket email bookingId={}, email={}",
                    booking.getId(), booking.getCustomer().getEmail(), e);
            throw new AppException(ErrorCode.UNABLE_TO_SEND_EMAIL);
        }
    }

    private static String buildBookingPaidBody(BookingPaidMessage bookingPaidMessage) {
        String seatList = String.join(", ", bookingPaidMessage.getSeatIds());
        String ticketList = String.join(", ", bookingPaidMessage.getTicketIds());
        String htmlTemplate = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
            </head>
            <body style="font-family: Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px;">
                    <h2 style="color: #333333; text-align: center;">%s</h2>
                    <p style="color: #555555; font-size: 16px;">Your payment was successful.</p>
                    <p style="color: #555555; font-size: 16px;"><strong>Booking code:</strong> %s</p>
                    <p style="color: #555555; font-size: 16px;"><strong>Total amount:</strong> %,.0f VND</p>
                    <p style="color: #555555; font-size: 16px;"><strong>Seats:</strong> %s</p>
                    <p style="color: #555555; font-size: 16px;"><strong>Ticket IDs:</strong> %s</p>
                    <p style="color: #999999; font-size: 13px;">Please present your ticket at the cinema counter or scanner.</p>
                </div>
            </body>
            </html>
            """;

        return String.format(
                htmlTemplate,
                BRAND_NAME,
                bookingPaidMessage.getBookingCode(),
                bookingPaidMessage.getTotalAmount(),
                seatList,
                ticketList);
    }

    private String buildBookingTicketBody(Booking booking, List<Ticket> tickets) {
        List<Ticket> sortedTickets = tickets.stream()
                .sorted(Comparator.comparing((Ticket ticket) -> ticket.getSeat().getRowName())
                        .thenComparing(ticket -> ticket.getSeat().getNumber()))
                .toList();

        Showtime showtime = sortedTickets.get(0).getShowtime();
        Movie movie = showtime.getMovie();
        String posterHtml = StringUtils.hasText(movie.getPosterUrl())
                ? "<img src=\"cid:" + posterContentId(booking) + "\" alt=\"Movie poster\" style=\"width:96px;height:140px;object-fit:cover;border-radius:8px;display:block;\"/>"
                : "";

        StringBuilder ticketCards = new StringBuilder();
        for (Ticket ticket : sortedTickets) {
            ticketCards.append(buildTicketCard(booking, ticket));
        }

        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin:0;padding:0;background:#eef2f7;font-family:Arial,Helvetica,sans-serif;color:#172033;">
                    <div style="max-width:720px;margin:0 auto;padding:24px 14px;">
                        <div style="background:#111827;color:#ffffff;border-radius:8px 8px 0 0;padding:22px 24px;">
                            <div style="font-size:22px;font-weight:800;letter-spacing:.5px;">%s</div>
                            <div style="font-size:14px;color:#cbd5e1;margin-top:6px;">Your e-ticket is ready</div>
                        </div>
                        <div style="background:#ffffff;padding:22px 24px;border-radius:0 0 8px 8px;">
                            <div style="display:flex;gap:18px;align-items:flex-start;margin-bottom:20px;">
                                %s
                                <div>
                                    <div style="font-size:22px;font-weight:800;color:#111827;margin-bottom:8px;">%s</div>
                                    <div style="font-size:14px;line-height:1.7;color:#475569;">
                                        <div><strong>Date:</strong> %s</div>
                                        <div><strong>Time:</strong> %s</div>
                                        <div><strong>Cinema:</strong> %s</div>
                                        <div><strong>Hall:</strong> %s</div>
                                        <div><strong>Booking code:</strong> %s</div>
                                        <div><strong>Total:</strong> %s</div>
                                    </div>
                                </div>
                            </div>
                            %s
                            <div style="margin-top:22px;padding:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;color:#475569;font-size:14px;line-height:1.6;">
                                Vui lòng đưa mã QR này tại quầy check-in. QR chỉ chứa ticket code, không chứa thông tin cá nhân của khách hàng.
                            </div>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(
                BRAND_NAME,
                posterHtml,
                escape(movie.getTitle()),
                showtime.getStartTime().format(DATE_FORMATTER),
                showtime.getStartTime().format(TIME_FORMATTER),
                escape(showtime.getHall().getCinema().getName()),
                escape(showtime.getHall().getName()),
                escape(booking.getBookingCode()),
                formatMoney(booking.getTotalAmount()),
                ticketCards);
    }

    private String buildTicketCard(Booking booking, Ticket ticket) {
        String qrImage = StringUtils.hasText(ticket.getQrCodeUrl())
                ? "<img src=\"cid:" + qrContentId(ticket) + "\" alt=\"Ticket QR\" style=\"width:160px;height:160px;display:block;margin:0 auto;border:1px solid #e2e8f0;border-radius:8px;padding:8px;background:#ffffff;\"/>"
                : "<div style=\"width:160px;height:160px;line-height:160px;text-align:center;border:1px solid #e2e8f0;border-radius:8px;color:#94a3b8;\">QR pending</div>";

        return """
                <div style="border:1px solid #dbe4ee;border-radius:8px;margin-top:14px;overflow:hidden;">
                    <div style="background:#f8fafc;padding:12px 16px;border-bottom:1px solid #dbe4ee;font-weight:700;color:#0f172a;">
                        Seat %s
                    </div>
                    <div style="display:flex;gap:20px;align-items:center;padding:16px;flex-wrap:wrap;">
                        <div style="flex:1;min-width:220px;font-size:14px;line-height:1.8;color:#334155;">
                            <div><strong>Ticket code:</strong> <span style="font-family:Consolas,monospace;">%s</span></div>
                            <div><strong>Booking code:</strong> %s</div>
                            <div><strong>Seat:</strong> %s</div>
                            <div><strong>Price:</strong> %s</div>
                        </div>
                        <div style="width:180px;text-align:center;">
                            %s
                        </div>
                    </div>
                </div>
                """.formatted(
                escape(seatLabel(ticket)),
                escape(ticket.getTicketCode()),
                escape(booking.getBookingCode()),
                escape(seatLabel(ticket)),
                formatMoney(ticket.getPrice()),
                qrImage);
    }

    private String seatLabel(Ticket ticket) {
        return ticket.getSeat().getRowName() + ticket.getSeat().getNumber();
    }

    private void addInlinePosterImage(MimeMessageHelper helper, Booking booking, List<Ticket> tickets) {
        if (tickets == null || tickets.isEmpty()) {
            return;
        }

        Movie movie = tickets.get(0).getShowtime().getMovie();
        if (!StringUtils.hasText(movie.getPosterUrl())) {
            return;
        }

        String key = s3Service.normalizeKey(movie.getPosterUrl());
        try {
            byte[] posterBytes = s3Service.downloadBytes(key);
            helper.addInline(posterContentId(booking), new ByteArrayResource(posterBytes), imageContentType(key));
            log.info("Movie poster inline image attached bookingId={}, movieId={}, s3Key={}",
                    booking.getId(), movie.getId(), key);
        } catch (Exception exception) {
            log.warn("Cannot attach movie poster inline, ticket email will still be sent bookingId={}, movieId={}, s3Key={}",
                    booking.getId(), movie.getId(), key, exception);
        }
    }

    private void addInlineQrImages(MimeMessageHelper helper, List<Ticket> tickets) {
        for (Ticket ticket : tickets) {
            if (!StringUtils.hasText(ticket.getQrCodeUrl())) {
                continue;
            }
            String key = s3Service.normalizeKey(ticket.getQrCodeUrl());
            try {
                byte[] qrBytes = s3Service.downloadBytes(key);
                helper.addInline(qrContentId(ticket), new ByteArrayResource(qrBytes), "image/png");
                log.info("Ticket QR inline image attached ticketId={}, ticketCode={}, s3Key={}",
                        ticket.getId(), ticket.getTicketCode(), key);
            } catch (Exception exception) {
                log.warn("Cannot attach ticket QR inline, ticket email will still be sent ticketId={}, ticketCode={}, s3Key={}",
                        ticket.getId(), ticket.getTicketCode(), key, exception);
            }
        }
    }

    private static String qrContentId(Ticket ticket) {
        return "ticket-qr-" + ticket.getTicketCode().replaceAll("[^A-Za-z0-9]", "");
    }

    private static String posterContentId(Booking booking) {
        return "movie-poster-" + booking.getBookingCode().replaceAll("[^A-Za-z0-9]", "");
    }

    private static String imageContentType(String key) {
        String lowerKey = key == null ? "" : key.toLowerCase(Locale.ROOT);
        if (lowerKey.endsWith(".png")) {
            return "image/png";
        }
        if (lowerKey.endsWith(".gif")) {
            return "image/gif";
        }
        if (lowerKey.endsWith(".webp")) {
            return "image/webp";
        }
        return "image/jpeg";
    }

    private static String formatMoney(Double value) {
        if (value == null) {
            return "0 VND";
        }
        return String.format(Locale.US, "%,.0f VND", value);
    }

    private static String escape(String value) {
        return StringEscapeUtils.escapeHtml4(value == null ? "" : value);
    }

    private static String buildPasswordResetBody(String resetLink) {
        String htmlTemplate = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
            </head>
            <body style="font-family: Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
                    <h2 style="color: #333333; text-align: center; margin-bottom: 20px;">Đặt lại mật khẩu</h2>
                    
                    <p style="color: #555555; font-size: 16px; line-height: 1.5;">Xin chào,</p>
                    
                    <p style="color: #555555; font-size: 16px; line-height: 1.5;">
                        Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng nhấn vào nút bên dưới để tiến hành đặt lại mật khẩu:
                    </p>
                    
                    <div style="text-align: center; margin: 35px 0;">
                        <a href="%s" style="display: inline-block; font-size: 16px; font-weight: bold; color: #ffffff; background-color: #3498db; padding: 15px 30px; border-radius: 8px; text-decoration: none; transition: background-color 0.3s;">
                            Đặt Lại Mật Khẩu
                        </a>
                    </div>
                    
                    <p style="color: #e74c3c; font-size: 14px; text-align: center; font-weight: bold;">
                        Link này chỉ có hiệu lực trong thời gian 15 phút kể từ lúc gửi đi. 
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">
                    
                    <p style="color: #999999; font-size: 13px; text-align: center; margin: 0;">
                        Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.
                    </p>
                    <p style="color: #999999; font-size: 13px; text-align: center; margin-top: 10px; word-break: break-all;">
                        Hoặc sao chép đường dẫn này vào trình duyệt của bạn: <br/>
                        <a href="%s" style="color: #3498db;">%s</a>
                    </p>
                </div>
            </body>
            </html>
            """;

        return String.format(htmlTemplate, resetLink, resetLink, resetLink);
    }
}
