package com.devteria.cinemaback_end.booking.service;

public class NonRetryableBookingPaidException extends RuntimeException {

    public NonRetryableBookingPaidException(String message) {
        super(message);
    }
}
