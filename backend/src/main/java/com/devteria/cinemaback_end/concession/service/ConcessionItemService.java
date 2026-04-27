package com.devteria.cinemaback_end.concession.service;

import com.devteria.cinemaback_end.concession.dto.ConcessionRequest;
import com.devteria.cinemaback_end.concession.dto.ConcessionResponse;
import com.devteria.cinemaback_end.concession.entity.ConcessionItem;
import com.devteria.cinemaback_end.concession.mapper.ConcessionItemMapper;
import com.devteria.cinemaback_end.concession.repository.ConcessionItemRepository;
import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ConcessionItemService {

    ConcessionItemRepository concessionItemRepository;
    ConcessionItemMapper concessionItemMapper;

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public ConcessionResponse createItem(ConcessionRequest request) {
        ConcessionItem item = concessionItemMapper.toConcessionItem(request);
        return concessionItemMapper.toConcessionResponse(concessionItemRepository.save(item));
    }

    // PUBLIC: Lấy danh sách đang bán để hiển thị menu cho khách
    public List<ConcessionResponse> getActiveItems() {
        return concessionItemRepository.findAllByActiveTrue().stream()
                .map(concessionItemMapper::toConcessionResponse)
                .toList();
    }

    // ADMIN: Lấy tất cả để quản lý
    @PreAuthorize("hasRole('ADMIN')")
    public List<ConcessionResponse> getAllItemsForAdmin() {
        return concessionItemRepository.findAllByOrderByCategoryAscNameAsc().stream()
                .map(concessionItemMapper::toConcessionResponse)
                .toList();
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public ConcessionResponse updateItem(String id, ConcessionRequest request) {
        ConcessionItem item = concessionItemRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CONCESSION_NOT_EXISTED));

        concessionItemMapper.updateConcessionItem(item, request);

        // Cập nhật trạng thái isActive nếu Admin có truyền lên
        if (request.getActive() != null) {
            item.setActive(request.getActive());
        }

        return concessionItemMapper.toConcessionResponse(concessionItemRepository.save(item));
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteItem(String id) {
        if (!concessionItemRepository.existsById(id)) {
            throw new AppException(ErrorCode.CONCESSION_NOT_EXISTED);
        }
        // Lưu ý: Trong thực tế nên dùng isActive = false thay vì xóa hẳn
        // để tránh lỗi dữ liệu với các Booking cũ
        concessionItemRepository.deleteById(id);
    }
}