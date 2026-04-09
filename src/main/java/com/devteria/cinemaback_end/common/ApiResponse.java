package com.devteria.cinemaback_end.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL) // Cực kỳ quan trọng: Nếu trường nào bị null (ví dụ ko có message) thì nó sẽ giấu đi, không trả về Frontend cho đỡ rác.
public class ApiResponse<T> {
    @Builder.Default // Set giá trị mặc định khi tạo thành công là 1000
    int code = 1000;
    String message; // Bạn nên thêm trường này để báo lỗi cho dễ ("Sai mật khẩu", "Phim không tồn tại")
    T result; // Đây chính là lõi dữ liệu (Movie, User, Booking...)
}