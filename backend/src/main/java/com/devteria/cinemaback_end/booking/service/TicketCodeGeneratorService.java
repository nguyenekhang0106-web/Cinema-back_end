package com.devteria.cinemaback_end.booking.service;

import com.devteria.cinemaback_end.booking.entity.Ticket;
import com.devteria.cinemaback_end.booking.repository.TicketRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TicketCodeGeneratorService {

    private static final String PREFIX = "MOVTIX-TK-";
    private static final int DEFAULT_CODE_CHARS = 12;
    private static final char[] HEX = "0123456789ABCDEF".toCharArray();

    TicketRepository ticketRepository;
    SecureRandom secureRandom = new SecureRandom();

    public String generateFor(Ticket ticket) {
        String compactId = ticket.getId() == null
                ? randomHex(32)
                : ticket.getId().replaceAll("[^A-Za-z0-9]", "").toUpperCase(Locale.ROOT);

        for (int length = DEFAULT_CODE_CHARS; length <= compactId.length(); length += 4) {
            String code = PREFIX + compactId.substring(0, Math.min(length, compactId.length()));
            if (!ticketRepository.existsByTicketCodeAndIdNot(code, ticket.getId())) {
                return code;
            }
        }

        String code;
        do {
            code = PREFIX + randomHex(DEFAULT_CODE_CHARS);
        } while (ticketRepository.existsByTicketCodeAndIdNot(code, ticket.getId()));
        return code;
    }

    private String randomHex(int length) {
        StringBuilder builder = new StringBuilder(length);
        for (int index = 0; index < length; index++) {
            builder.append(HEX[secureRandom.nextInt(HEX.length)]);
        }
        return builder.toString();
    }
}
