package com.devteria.cinemaback_end.movie.repository;

import com.devteria.cinemaback_end.movie.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, String> {
    boolean existsByCustomer_IdAndMovie_Id(String customerId, String movieId);
    List<Review> findByMovieId(String movieId);

    // THÊM HÀM NÀY: Tìm tất cả review của 1 user cụ thể
    List<Review> findByCustomerId(String customerId);
}