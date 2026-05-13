package com.devteria.cinemaback_end.booking.service;

import com.devteria.cinemaback_end.booking.entity.Ticket;
import com.devteria.cinemaback_end.util.S3Service;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class TicketQrCodeService {

    private static final String QR_FOLDER = "qrticket";
    private static final String QR_CONTENT_TYPE = "image/png";

    TicketCodeGeneratorService ticketCodeGeneratorService;
    QrCodeGeneratorService qrCodeGeneratorService;
    S3Service s3Service;

    public boolean ensureQrTicket(Ticket ticket) {
        boolean changed = false;

        if (!StringUtils.hasText(ticket.getTicketCode())) {
            ticket.setTicketCode(ticketCodeGeneratorService.generateFor(ticket));
            changed = true;
            log.info("[Ticket QR] ticketCode generated ticketId={}, ticketCode={}",
                    ticket.getId(), ticket.getTicketCode());
        }

        if (ticket.getIssuedAt() == null) {
            ticket.setIssuedAt(LocalDateTime.now());
            changed = true;
        }

        if (!StringUtils.hasText(ticket.getQrCodeUrl())) {
            byte[] qrImage = qrCodeGeneratorService.generatePng(ticket.getTicketCode());
            String qrKey = QR_FOLDER + "/" + ticket.getTicketCode() + ".png";
            String qrCodeUrl = s3Service.uploadBytes(qrKey, qrImage, QR_CONTENT_TYPE);
            ticket.setQrCodeUrl(qrCodeUrl);
            changed = true;
            log.info("[Ticket QR] QR uploaded S3 ticketId={}, ticketCode={}, qrCodeUrl={}",
                    ticket.getId(), ticket.getTicketCode(), qrCodeUrl);
        }

        if (changed) {
            log.info("[Ticket QR] qrCodeUrl saved ticketId={}, ticketCode={}",
                    ticket.getId(), ticket.getTicketCode());
        }

        return changed;
    }
}
