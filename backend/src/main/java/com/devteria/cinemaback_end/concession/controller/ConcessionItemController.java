package com.devteria.cinemaback_end.concession.controller;

import com.devteria.cinemaback_end.common.ApiResponse;
import com.devteria.cinemaback_end.concession.dto.ConcessionRequest;
import com.devteria.cinemaback_end.concession.dto.ConcessionResponse;
import com.devteria.cinemaback_end.concession.service.ConcessionItemService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
    @RequestMapping("/concessions")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ConcessionItemController {

    ConcessionItemService concessionItemService;

    @PostMapping
    public ApiResponse<ConcessionResponse> create(@RequestBody @Valid ConcessionRequest request) {
        return ApiResponse.<ConcessionResponse>builder()
                .message("Thêm món mới thành công")
                .result(concessionItemService.createItem(request))
                .build();
    }

    // API cho khách xem Menu
    @GetMapping
    public ApiResponse<List<ConcessionResponse>> getActiveItems() {
        return ApiResponse.<List<ConcessionResponse>>builder()
                .result(concessionItemService.getActiveItems())
                .build();
    }

    // API cho Admin quản lý
    @GetMapping("/admin/all")
    public ApiResponse<List<ConcessionResponse>> getAllForAdmin() {
        return ApiResponse.<List<ConcessionResponse>>builder()
                .result(concessionItemService.getAllItemsForAdmin())
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<ConcessionResponse> update(
            @PathVariable String id,
            @RequestBody @Valid ConcessionRequest request) {
        return ApiResponse.<ConcessionResponse>builder()
                .message("Cập nhật thành công")
                .result(concessionItemService.updateItem(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable String id) {
        concessionItemService.deleteItem(id);
        return ApiResponse.<Void>builder()
                .message("Đã xóa món ăn/thức uống")
                .build();
    }
}