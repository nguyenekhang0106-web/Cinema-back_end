package com.devteria.cinemaback_end.booking.repository;

import com.devteria.cinemaback_end.booking.entity.ProcessedMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProcessedMessageRepository extends JpaRepository<ProcessedMessage, String> {
}
