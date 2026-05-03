package com.devteria.cinemaback_end.user.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.web.multipart.MultipartFile;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AvatarUploadRequest {

    // Ánh xạ trực tiếp sang ErrorCode "FILE_IS_EMPTY"
    @NotNull(message = "FILE_IS_EMPTY")
    MultipartFile file;

    // Đã xóa bỏ `folder` và `filename` vì Backend đã tự động xử lý an toàn
}