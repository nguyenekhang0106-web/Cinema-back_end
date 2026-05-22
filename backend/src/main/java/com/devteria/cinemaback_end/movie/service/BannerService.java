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

    // 🔴 KHÓA: Chỉ Admin mới được TẠO
    @PreAuthorize("hasRole('ADMIN')")
    public BannerResponse createBanner(BannerRequest request) {
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

    // 🟢 MỞ: Cho phép lấy danh sách Banner đang hoạt động
    public List<BannerResponse> getActiveBanners() {
        return bannerRepository.findAllByActiveTrueAndCinemaIsNullOrderByDisplayOrderAsc().stream()
                .map(bannerMapper::toBannerResponse).toList();
    }

    // 🟢 MỞ: Đã gỡ @PreAuthorize để Frontend không bị lỗi 403 khi gọi /all
    public List<BannerResponse> getAllBanners() {
        return bannerRepository.findAllByCinemaIsNullOrderByDisplayOrderAsc().stream()
                .map(bannerMapper::toBannerResponse).toList();
    }

    // 🟢 MỞ: Cho phép lấy danh sách Banner hoạt động của Rạp
    public List<BannerResponse> getActiveBannersByCinema(String cinemaId) {
        return bannerRepository.findAllByCinemaIdAndActiveTrueOrderByDisplayOrderAsc(cinemaId).stream()
                .map(bannerMapper::toBannerResponse).toList();
    }

    // 🟢 MỞ: Đã gỡ @PreAuthorize để trang chủ load được mà không báo lỗi 403/Timeout
    public List<BannerResponse> getAllBannersByCinema(String cinemaId) {
        return bannerRepository.findAllByCinemaIdOrderByDisplayOrderAsc(cinemaId).stream()
                .map(bannerMapper::toBannerResponse).toList();
    }

    // 🔴 KHÓA: Chỉ Admin mới được CẬP NHẬT
    @PreAuthorize("hasRole('ADMIN')")
    public BannerResponse updateBanner(String id, BannerRequest request) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.BANNER_NOT_EXISTED));

        if (request.getTitle() != null && !request.getTitle().isBlank()
                && !request.getTitle().equals(banner.getTitle())
                && bannerRepository.existsByTitle(request.getTitle())) {
            throw new AppException(ErrorCode.BANNER_TITLE_EXISTED);
        }

        bannerMapper.updateBanner(banner, request);
        return bannerMapper.toBannerResponse(bannerRepository.save(banner));
    }

    // 🔴 KHÓA: Chỉ Admin mới được XÓA
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteBanner(String id) {
        bannerRepository.deleteById(id);
    }
}