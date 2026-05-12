package com.devteria.cinemaback_end.movie.service;

import com.devteria.cinemaback_end.cinema.entity.Cinema;
import com.devteria.cinemaback_end.cinema.repository.CinemaRepository;
import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import com.devteria.cinemaback_end.movie.dto.BannerRequest;
import com.devteria.cinemaback_end.movie.dto.BannerResponse;
import com.devteria.cinemaback_end.movie.entity.Banner;
import com.devteria.cinemaback_end.movie.mapper.BannerMapper;
import com.devteria.cinemaback_end.movie.repository.BannerRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BannerService {
    BannerRepository bannerRepository;
    BannerMapper bannerMapper;
    CinemaRepository cinemaRepository;

    @PreAuthorize("hasRole('ADMIN')")
    public BannerResponse createBanner(BannerRequest request) {
        // 🔥 KIỂM TRA TRÙNG TÊN TRƯỚC KHI TẠO
        if (request.getTitle() != null && !request.getTitle().isBlank() && bannerRepository.existsByTitle(request.getTitle())) {
            throw new AppException(ErrorCode.BANNER_TITLE_EXISTED);
        }

        Banner banner = bannerMapper.toBanner(request);

        if (request.getCinemaId() != null && !request.getCinemaId().isBlank()) {
            Cinema cinema = cinemaRepository.findById(request.getCinemaId())
                    .orElseThrow(() -> new AppException(ErrorCode.CINEMA_NOT_EXISTED));
            banner.setCinema(cinema);
        }

        return bannerMapper.toBannerResponse(bannerRepository.save(banner));
    }

    // Các hàm GET giữ nguyên...
    public List<BannerResponse> getActiveBanners() {
        return bannerRepository.findAllByActiveTrueAndCinemaIsNullOrderByDisplayOrderAsc().stream()
                .map(bannerMapper::toBannerResponse).toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<BannerResponse> getAllBanners() {
        return bannerRepository.findAllByCinemaIsNullOrderByDisplayOrderAsc().stream()
                .map(bannerMapper::toBannerResponse).toList();
    }

    public List<BannerResponse> getActiveBannersByCinema(String cinemaId) {
        return bannerRepository.findAllByCinemaIdAndActiveTrueOrderByDisplayOrderAsc(cinemaId).stream()
                .map(bannerMapper::toBannerResponse).toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<BannerResponse> getAllBannersByCinema(String cinemaId) {
        return bannerRepository.findAllByCinemaIdOrderByDisplayOrderAsc(cinemaId).stream()
                .map(bannerMapper::toBannerResponse).toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    public BannerResponse updateBanner(String id, BannerRequest request) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.BANNER_NOT_EXISTED));

        // 🔥 KIỂM TRA TRÙNG TÊN (Ngoại trừ chính nó)
        if (request.getTitle() != null && !request.getTitle().isBlank()
                && !request.getTitle().equals(banner.getTitle())
                && bannerRepository.existsByTitle(request.getTitle())) {
            throw new AppException(ErrorCode.BANNER_TITLE_EXISTED);
        }

        bannerMapper.updateBanner(banner, request);
        return bannerMapper.toBannerResponse(bannerRepository.save(banner));
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteBanner(String id) {
        bannerRepository.deleteById(id);
    }
}