package com.devteria.cinemaback_end.movie.service;

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

    @PreAuthorize("hasRole('ADMIN')")
    public BannerResponse createBanner(BannerRequest request) {
        Banner banner = bannerMapper.toBanner(request);
        return bannerMapper.toBannerResponse(bannerRepository.save(banner));
    }

    // Public: Chỉ lấy banner đang bật để hiển thị cho khách
    public List<BannerResponse> getActiveBanners() {
        return bannerRepository.findAllByActiveTrueOrderByDisplayOrderAsc().stream()
                .map(bannerMapper::toBannerResponse).toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<BannerResponse> getAllBanners() {
        return bannerRepository.findAllByOrderByDisplayOrderAsc().stream()
                .map(bannerMapper::toBannerResponse).toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    public BannerResponse updateBanner(String id, BannerRequest request) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.BANNER_NOT_EXISTED));
        bannerMapper.updateBanner(banner, request);
        return bannerMapper.toBannerResponse(bannerRepository.save(banner));
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteBanner(String id) {
        bannerRepository.deleteById(id);
    }
}
