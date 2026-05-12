package com.devteria.cinemaback_end.movie.controller;

import com.devteria.cinemaback_end.common.ApiResponse;
import com.devteria.cinemaback_end.movie.dto.BannerRequest;
import com.devteria.cinemaback_end.movie.dto.BannerResponse;
import com.devteria.cinemaback_end.movie.service.BannerService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/banners")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BannerController {

    BannerService bannerService;

    // --- 1. CRUD Cơ bản ---
    @PostMapping
    public ApiResponse<BannerResponse> createBanner(@RequestBody @Valid BannerRequest request) {
        return ApiResponse.<BannerResponse>builder()
                .result(bannerService.createBanner(request))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<BannerResponse> updateBanner(@PathVariable String id, @RequestBody @Valid BannerRequest request) {
        return ApiResponse.<BannerResponse>builder()
                .result(bannerService.updateBanner(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteBanner(@PathVariable String id) {
        bannerService.deleteBanner(id);
        return ApiResponse.<Void>builder().build();
    }

    // --- 2. API TRANG CHỦ ---
    @GetMapping
    public ApiResponse<List<BannerResponse>> getActiveBanners() {
        return ApiResponse.<List<BannerResponse>>builder()
                .result(bannerService.getActiveBanners())
                .build();
    }

    @GetMapping("/all")
    public ApiResponse<List<BannerResponse>> getAllBanners() {
        return ApiResponse.<List<BannerResponse>>builder()
                .result(bannerService.getAllBanners())
                .build();
    }

    // --- 3. API RẠP CHIẾU (Thiếu cái này nên FE báo No Data) ---
    // Khách hàng xem: Chỉ lấy ảnh Active
    @GetMapping("/cinema/{cinemaId}")
    public ApiResponse<List<BannerResponse>> getActiveBannersByCinema(@PathVariable String cinemaId) {
        return ApiResponse.<List<BannerResponse>>builder()
                .result(bannerService.getActiveBannersByCinema(cinemaId))
                .build();
    }

    // Admin xem: Lấy tất cả ảnh của rạp (cả bị ẩn) để quản lý
    @GetMapping("/cinema/{cinemaId}/all")
    public ApiResponse<List<BannerResponse>> getAllBannersByCinema(@PathVariable String cinemaId) {
        return ApiResponse.<List<BannerResponse>>builder()
                .result(bannerService.getAllBannersByCinema(cinemaId))
                .build();
    }
}