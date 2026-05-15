package com.devteria.cinemaback_end.booking.service;

public class DuplicateBookingPaidMessageException extends RuntimeException {

    public DuplicateBookingPaidMessageException(String message) {
        super(message);
    }
}
