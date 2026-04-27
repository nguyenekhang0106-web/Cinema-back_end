package com.devteria.cinemaback_end.concession.repository;

import com.devteria.cinemaback_end.concession.entity.ConcessionItem;
import com.devteria.cinemaback_end.concession.entity.enums.ConcessionCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConcessionItemRepository extends JpaRepository<ConcessionItem, String> {

    // Đổi từ findAllByIsActiveTrue -> findAllByActiveTrue
    List<ConcessionItem> findAllByActiveTrue();

    // Đổi từ findByCategoryAndIsActiveTrue -> findByCategoryAndActiveTrue
    List<ConcessionItem> findByCategoryAndActiveTrue(ConcessionCategory category);

    List<ConcessionItem> findAllByOrderByCategoryAscNameAsc();
}