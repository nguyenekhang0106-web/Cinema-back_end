package com.devteria.cinemaback_end.movie.dto;
import com.devteria.cinemaback_end.movie.entity.enums.AgeRestriction;
import com.devteria.cinemaback_end.movie.entity.enums.Genre;
import com.devteria.cinemaback_end.movie.entity.enums.Language;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MovieRequest {
    @NotBlank(message = "Tên phim không được để trống")
    String title;

    @NotNull(message = "Thời lượng không được để trống")
    @Min(value = 1, message = "Thời lượng phải lớn hơn 0")
    Integer durationMin;

    @NotNull(message = "Thể loại không được để trống")
    Genre genre;

    @NotNull(message = "Ngôn ngữ không được để trống")
    Language language;

    @NotNull(message = "Giới hạn độ tuổi không được để trống")
    AgeRestriction ageRestriction;

    String posterUrl;
    String trailerUrl;
    String description;

    @NotNull(message = "Ngày phát hành không được để trống")
    LocalDate releaseDate;

    @NotBlank(message = "ID Người quản lý không được để trống")
    String managerId;
}