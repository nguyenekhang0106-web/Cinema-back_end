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
        props.put("mail.smtp.ssl.trust", host);
        props.put("mail.smtp.connectiontimeout", "30000");
        props.put("mail.smtp.timeout", "30000");
        props.put("mail.smtp.writetimeout", "30000");

        // Gmail supports both:
        // - port 587 with STARTTLS
        // - port 465 with implicit SSL
        // Render can occasionally time out on one route, so this config supports switching by MAIL_PORT.
        if (port == 465) {
            props.put("mail.smtp.ssl.enable", "true");
            props.put("mail.smtp.starttls.enable", "false");
            props.put("mail.smtp.starttls.required", "false");
        } else {
            props.put("mail.smtp.ssl.enable", "false");
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.starttls.required", "true");
        }

        log.info("[Mail] SMTP configured host={}, port={}, username={}, ssl={}",
                host, port, username, port == 465);
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
        } catch (MessagingException | RuntimeException e) {
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

        // 1. Ảnh Poster Inline
        String posterHtml = StringUtils.hasText(movie.getPosterUrl())
                ? "<img src=\"cid:" + posterContentId(booking) + "\" alt=\"Movie poster\" style=\"width:130px;height:190px;object-fit:cover;border-radius:8px;display:block;margin: 0 auto; box-shadow: 0 4px 15px rgba(0,0,0,0.15);\"/>"
                : "";

        // 2. Danh sách ghế (VD: E11, E12)
        String seatList = String.join(", ", sortedTickets.stream().map(this::seatLabel).toList());

        String memberDiscountRow =
                booking.getMemberDiscountAmount() != null
                        && booking.getMemberDiscountAmount() > 0

                        ? """
            <tr>
                <td style="padding: 10px 0; color: #666666;">
                    Ưu đãi hạng thành viên
                </td>
                <td style="padding: 10px 0;
                           text-align:right;
                           color:#2563eb;
                           font-weight:bold;">
                    -%s
                </td>
            </tr>
          """.formatted(
                        formatMoney(booking.getMemberDiscountAmount())
                )

                        : "";

        // 🔥 3. CHỈ LẤY 1 MÃ QR DUY NHẤT LÀM ĐẠI DIỆN CHO CẢ ĐƠN HÀNG
        Ticket firstTicket = sortedTickets.get(0);
        String qrImage = StringUtils.hasText(firstTicket.getQrCodeUrl())
                ? "<img src=\"cid:" + qrContentId(firstTicket) + "\" alt=\"Ticket QR\" style=\"width:160px;height:160px;border:1px solid #eeeeee;border-radius:8px;padding:5px;background:#ffffff;\"/>"
                : "<div style=\"width:160px;height:160px;line-height:160px;text-align:center;border:1px solid #eeeeee;border-radius:8px;color:#94a3b8;font-size:12px;background:#ffffff;\">Đang tạo QR</div>";

        String singleQrHtml = """
            <div style="display: inline-block; margin: 10px; text-align: center;">
                <p style="margin: 0 0 8px 0; color: #4a3426; font-weight: bold; font-size: 15px;">Ghế: %s</p>
                %s
            </div>
            """.formatted(escape(seatList), qrImage);

        // 4. HTML Layout (Style CGV / VNPAY)
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
            </head>
            <body style="margin:0;padding:0;background-color:#f4f5f7;font-family:Arial,sans-serif;">
                <div style="background-color: #f4f5f7; padding: 40px 10px; line-height: 1.6;">
                    <table style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; width: 100%%; border-collapse: collapse; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
                        
                        <tr>
                            <td style="background-color: #a61d24; text-align: center; padding: 30px 20px;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 30px; letter-spacing: 2px;">%s</h1>
                                <p style="color: #fbd6d8; margin: 8px 0 0 0; font-size: 14px; font-weight: bold; letter-spacing: 1px;">XÁC NHẬN ĐẶT VÉ / E-TICKET</p>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 35px 30px 15px 30px; text-align: center;">
                                %s
                                <h2 style="margin: 20px 0 0 0; color: #4a3426; font-size: 24px; text-transform: uppercase;">%s</h2>
                                <p style="margin: 5px 0 20px 0; color: #888888; font-size: 14px;">Mã đặt vé / Booking Code</p>
                                <div style="background-color: #fffaf4; border: 2px dashed #c89a2b; border-radius: 8px; padding: 15px 30px; display: inline-block;">
                                    <span style="font-size: 28px; font-weight: 900; color: #a61d24; letter-spacing: 2px;">%s</span>
                                </div>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 10px 35px 25px 35px;">
                                <table style="width: 100%%; border-collapse: collapse; font-size: 15px;">
                                    <tr>
                                        <td style="padding: 14px 0; border-bottom: 1px solid #f0f0f0; color: #666666;">Rạp / Cinema</td>
                                        <td style="padding: 14px 0; border-bottom: 1px solid #f0f0f0; text-align: right; color: #222222; font-weight: bold;">%s</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 14px 0; border-bottom: 1px solid #f0f0f0; color: #666666;">Phòng chiếu / Hall</td>
                                        <td style="padding: 14px 0; border-bottom: 1px solid #f0f0f0; text-align: right; color: #222222; font-weight: bold;">%s</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 14px 0; border-bottom: 1px solid #f0f0f0; color: #666666;">Suất chiếu / Showtime</td>
                                        <td style="padding: 14px 0; border-bottom: 1px solid #f0f0f0; text-align: right; color: #a61d24; font-weight: bold;">%s | %s</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 14px 0; border-bottom: 1px solid #f0f0f0; color: #666666;">Ghế / Seats</td>
                                        <td style="padding: 14px 0; border-bottom: 1px solid #f0f0f0; text-align: right; color: #222222; font-weight: bold;">%s</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <tr>
                            <td style="background-color: #fcfcfc; padding: 30px 35px;">
                                <h3 style="margin: 0 0 18px 0; color: #4a3426; font-size: 16px; text-transform: uppercase;">Chi tiết thanh toán</h3>
                                <table style="width: 100%%; border-collapse: collapse; font-size: 15px;">
                                    <tr>
                                        <td style="padding: 10px 0; color: #666666;">Tiền vé (%d vé)</td>
                                        <td style="padding: 10px 0; text-align: right; color: #222222; font-weight: bold;">%s</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #666666;">Bắp nước (Concessions)</td>
                                        <td style="padding: 10px 0; text-align: right; color: #222222; font-weight: bold;">%s</td>
                                    </tr>
                                    <tr>
                                            <td style="padding: 10px 0; color: #666666;">
                                                Giảm giá Voucher
                                            </td>
                                            <td style="padding: 10px 0;
                                                       text-align: right;
                                                       color: #2ba24c;
                                                       font-weight: bold;">
                                                -%s
                                            </td>
                                        </tr>
                
                                        %s
                
                                    <tr>
                                        <td style="padding: 20px 0 5px 0; border-top: 2px dashed #dddddd; color: #222222; font-weight: 900; font-size: 18px;">TỔNG CỘNG</td>
                                        <td style="padding: 20px 0 5px 0; border-top: 2px dashed #dddddd; text-align: right; color: #a61d24; font-weight: 900; font-size: 22px;">%s</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 35px; text-align: center;">
                                <p style="margin: 0 0 15px 0; color: #666666; font-size: 15px;">Vui lòng xuất trình mã QR này tại cổng soát vé</p>
                                <div style="background-color: #ffffff; border-radius: 12px; padding: 10px;">
                                    %s
                                </div>
                            </td>
                        </tr>

                        <tr>
                            <td style="background-color: #4a3426; padding: 25px; text-align: center; font-size: 13px; color: #d0c4b7; line-height: 1.6;">
                                <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 15px; color: #ffffff;">Xin cảm ơn quý khách đã sử dụng dịch vụ của %s!</p>
                                <p style="margin: 0;">Lưu ý: Vé đã mua không thể hoàn hoặc hủy.<br>Vui lòng đến rạp trước suất chiếu 10 phút để nhận bắp nước và qua cổng.</p>
                            </td>
                        </tr>
                    </table>
                </div>
            </body>
            </html>
            """.formatted(
                BRAND_NAME,
                posterHtml,
                escape(movie.getTitle()),
                escape(booking.getBookingCode()),
                escape(showtime.getHall().getCinema().getName()),
                escape(showtime.getHall().getName()),
                showtime.getStartTime().format(TIME_FORMATTER),
                showtime.getStartTime().format(DATE_FORMATTER),
                seatList,
                sortedTickets.size(),
                formatMoney(booking.getTicketTotal()),
                formatMoney(booking.getConcessionTotal()),
                formatMoney(booking.getDiscountAmount()),

                memberDiscountRow,

                formatMoney(booking.getTotalAmount()),
                singleQrHtml, // Truyền khối html chứa 1 mã QR duy nhất vào đây
                BRAND_NAME
        );
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
