package com.devteria.cinemaback_end.user.dto;

import jakarta.validation.constraints.NotBlank;
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

    @NotNull(message = "File không được để trống")
    MultipartFile file;

    @NotBlank(message = "Folder không được để trống")
    String folder; // Always "avatar"

    @NotBlank(message = "Filename không được để trống")
    String filename; // Format: "user{id}Avatar.{ext}"
}
