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

    @PostMapping
    public ApiResponse<BannerResponse> create(@RequestBody @Valid BannerRequest request) {
        return ApiResponse.<BannerResponse>builder().result(bannerService.createBanner(request)).build();
    }

    @GetMapping
    public ApiResponse<List<BannerResponse>> getActiveBanners() {
        return ApiResponse.<List<BannerResponse>>builder().result(bannerService.getActiveBanners()).build();
    }

    @GetMapping("/all")
    public ApiResponse<List<BannerResponse>> getAllBanners() {
        return ApiResponse.<List<BannerResponse>>builder().result(bannerService.getAllBanners()).build();
    }

    @PutMapping("/{id}")
    public ApiResponse<BannerResponse> update(@PathVariable String id, @RequestBody @Valid BannerRequest request) {
        return ApiResponse.<BannerResponse>builder().result(bannerService.updateBanner(id, request)).build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable String id) {
        bannerService.deleteBanner(id);
        return ApiResponse.<Void>builder().message("Đã xóa banner").build();
    }
}