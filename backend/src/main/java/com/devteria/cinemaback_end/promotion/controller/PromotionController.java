package com.devteria.cinemaback_end.promotion.controller;

import com.devteria.cinemaback_end.common.ApiResponse;
import com.devteria.cinemaback_end.promotion.dto.PromotionRequest;
import com.devteria.cinemaback_end.promotion.dto.PromotionResponse;
import com.devteria.cinemaback_end.promotion.service.PromotionService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/promotions")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PromotionController {

    PromotionService promotionService;

    @PostMapping
    public ApiResponse<PromotionResponse> create(@RequestBody @Valid PromotionRequest request) {
        return ApiResponse.<PromotionResponse>builder()
                .result(promotionService.createPromotion(request))
                .build();
    }

    @GetMapping
    public ApiResponse<List<PromotionResponse>> getActivePromotions() {
        return ApiResponse.<List<PromotionResponse>>builder()
                .result(promotionService.getActivePromotions())
                .build();
    }

    @GetMapping("/admin/all")
    public ApiResponse<List<PromotionResponse>> getAllForAdmin() {
        return ApiResponse.<List<PromotionResponse>>builder()
                .result(promotionService.getAllForAdmin())
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<PromotionResponse> update(
            @PathVariable String id,
            @RequestBody @Valid PromotionRequest request) {
        return ApiResponse.<PromotionResponse>builder()
                .result(promotionService.updatePromotion(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable String id) {
        promotionService.deletePromotion(id);
        return ApiResponse.<Void>builder().message("Đã xóa mã khuyến mãi").build();
    }
}