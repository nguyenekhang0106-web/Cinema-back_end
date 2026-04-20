package com.devteria.cinemaback_end.movie.entity.enums;

import lombok.Getter;

@Getter
public enum Area {
    HA_NOI("Hà Nội"),
    TUYEN_QUANG("Tuyên Quang"),
    LAO_CAI("Lào Cai"),
    THAI_NGUYEN("Thái Nguyên"),
    PHU_THO("Phú Thọ"),
    BAC_NINH("Bắc Ninh"),
    HUNG_YEN("Hưng Yên"),
    HAI_PHONG("Hải Phòng"),
    NINH_BINH("Ninh Bình"),
    QUANG_TRI("Quảng Trị"),
    DA_NANG("Đà Nẵng"),
    QUANG_NGAI("Quảng Ngãi"),
    GIA_LAI("Gia Lai"),
    KHANH_HOA("Khánh Hòa"),
    LAM_DONG("Lâm Đồng"),
    DAK_LAK("Đắk Lắk"),
    HO_CHI_MINH("TP.HCM"),
    DONG_NAI("Đồng Nai"),
    TAY_NINH("Tây Ninh"),
    CAN_THO("Cần Thơ"),
    VINH_LONG("Vĩnh Long"),
    DONG_THAP("Đồng Tháp"),
    CA_MAU("Cà Mau"),
    AN_GIANG("An Giang"),
    HUE("Huế"),
    LAI_CHAU("Lai Châu"),
    DIEN_BIEN("Điện Biên"),
    SON_LA("Sơn La"),
    LANG_SON("Lạng Sơn"),
    QUANG_NINH("Quảng Ninh"),
    THANH_HOA("Thanh Hóa"),
    NGHE_AN("Nghệ An"),
    HA_TINH("Hà Tĩnh"),
    CAO_BANG("Cao Bằng");

    private final String displayName;

    Area(String displayName) {
        this.displayName = displayName;
    }
}
