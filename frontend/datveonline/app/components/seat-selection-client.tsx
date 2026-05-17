"use client";

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CreditCardOutlined,
  GiftOutlined,
  QrcodeOutlined,
  ShoppingCartOutlined,
  TagOutlined,
  TagsOutlined,
  ClockCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Input,
  InputNumber,
  Radio,
  Row,
  Space,
  Steps,
  Tag,
  Typography,
  Spin,
  message,
  Modal,
  notification,
} from "antd";
import { useLocale } from "./locale-provider";
import { useId, useMemo, useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { useAuthSession } from "./auth-session-provider";

import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

// 🔥 ĐÃ XÓA MẢNG memberPromos FAKE

export function SeatSelectionClient({ showtimeId }: { showtimeId: string }) {
  const locale = useLocale();
  const router = useRouter();
  const { token } = useAuthSession();
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [loading, setLoading] = useState(true);
  const [showtime, setShowtime] = useState<any>(null);
  const [movie, setMovie] = useState<any>(null);
  const [hallInfo, setHallInfo] = useState<any>(null);
  const [dynamicSeats, setDynamicSeats] = useState<any[]>([]);
  const [concessions, setConcessions] = useState<any[]>([]);

  // 🔥 STATE LƯU DỮ LIỆU KHUYẾN MÃI TỪ API
  const [promotions, setPromotions] = useState<any[]>([]);

  const [realtimeLocks, setRealtimeLocks] = useState<Record<string, string>>(
    {},
  );
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [snackQuantities, setSnackQuantities] = useState<
    Record<string, number>
  >({});
  const [promoCode, setPromoCode] = useState("");
  const [selectedMemberPromo, setSelectedMemberPromo] = useState<string | null>(
    null,
  );
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [paymentDone, setPaymentDone] = useState(false);
  const [finalBookingCode, setFinalBookingCode] = useState<string>("");
  const bookingId = useId();

  const copy = getBookingCopy(locale);

  // =========================================================
  // ANTI-GHOST-SEAT
  // =========================================================
  const heldSeatIdsRef = useRef<string[]>([]);
  const currentStepRef = useRef<number>(currentStep);

  // =========================================================
  // 🔥 CƠ CHẾ SAO LƯU TRẠNG THÁI NÂNG CẤP (HỖ TRỢ GIỮ BƯỚC XUẤT VÉ)
  // =========================================================

  // 1. Tự động KHÔI PHỤC dữ liệu kể cả khi đang ở bước xuất vé (Step 4)
  useEffect(() => {
    if (typeof window !== "undefined" && showtimeId) {
      const savedTempState = sessionStorage.getItem(
        `kct_temp_wizard_state_${showtimeId}`,
      );
      if (savedTempState) {
        try {
          const parsed = JSON.parse(savedTempState);

          if (parsed.selectedSeats) setSelectedSeats(parsed.selectedSeats);
          if (parsed.snackQuantities)
            setSnackQuantities(parsed.snackQuantities);
          if (parsed.currentStep) setCurrentStep(parsed.currentStep);
          if (parsed.timeLeft) setTimeLeft(parsed.timeLeft);
          if (parsed.finalBookingCode)
            setFinalBookingCode(parsed.finalBookingCode);
          if (parsed.paymentDone) setPaymentDone(parsed.paymentDone);

          console.log(
            "[i18n Sync] Đồng bộ trạng thái xuất vé qua ngôn ngữ mới thành công!",
          );
        } catch (e) {
          console.error("Lỗi khôi phục trạng thái tạm thời:", e);
        }
      }
    }
  }, [showtimeId]);

  // 2. Tự động LƯU biến động giỏ hàng và thông tin vé thành công vào Session
  useEffect(() => {
    if (typeof window !== "undefined" && showtimeId) {
      const tempState = {
        currentStep,
        selectedSeats,
        snackQuantities,
        timeLeft,
        finalBookingCode,
        paymentDone,
      };
      sessionStorage.setItem(
        `kct_temp_wizard_state_${showtimeId}`,
        JSON.stringify(tempState),
      );
    }
  }, [
    currentStep,
    selectedSeats,
    snackQuantities,
    timeLeft,
    showtimeId,
    finalBookingCode,
    paymentDone,
  ]);

  // 🔥 LẮNG NGHE SỰ KIỆN KHI VNPAY ĐẨY NGƯỜI DÙNG QUAY LẠI TRANG ĐẶT VÉ
  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const paymentStatus = searchParams.get("payment");
      const savedStateStr = sessionStorage.getItem("kct_booking_state");

      // 🛠 Hàm gọi API Hủy Booking xịn xò (Có Token hợp lệ)
      const handleCancelBooking = async (bookingIdToCancel: string) => {
        const currentToken =
          token ||
          localStorage.getItem("token") ||
          sessionStorage.getItem("token");
        if (currentToken && bookingIdToCancel) {
          try {
            await fetch(
              `http://localhost:9090/cinema/bookings/${bookingIdToCancel}/cancel`,
              {
                method: "POST",
                headers: { Authorization: `Bearer ${currentToken}` },
              },
            );
            // Tẩy trắng các ghế đang bị kẹt trên giao diện ngay lập tức
            setRealtimeLocks({});
          } catch (e) {
            console.error("Lỗi khi hủy hóa đơn:", e);
          }
        }
      };

      if (paymentStatus === "success") {
        if (savedStateStr) {
          const parsed = JSON.parse(savedStateStr);
          setFinalBookingCode(parsed.bookingCode);
          setSelectedSeats(parsed.selectedSeats || []);
          setCurrentStep(4);
          setPaymentDone(true);

          // 🔥 LƯU Ý: Không xóa dòng kct_temp_wizard_state ở đây nữa
          // để khi khách đổi ngôn ngữ, hệ thống vẫn nhớ đang ở bước xuất vé.

          message.success(
            "Thanh toán thành công! Vé điện tử đã được gửi qua email.",
          );
        }
        window.history.replaceState(null, "", window.location.pathname);
        sessionStorage.removeItem("kct_booking_state");
      } else if (paymentStatus === "failed" || paymentStatus === "error") {
        // 🔥 NẾU KHÁCH BẤM "HỦY THANH TOÁN" TỪ VNPAY
        if (savedStateStr) {
          const parsed = JSON.parse(savedStateStr);
          if (parsed.bookingId) {
            handleCancelBooking(parsed.bookingId); // Gọi API Hủy Hóa đơn để nhả ghế
          }
        }
        message.error(
          "Giao dịch VNPay bị hủy hoặc thất bại! Vui lòng chọn lại ghế.",
        );
        setCurrentStep(0);
        setSelectedSeats([]);
        setTimeLeft(null);
        window.history.replaceState(null, "", window.location.pathname);
        sessionStorage.removeItem("kct_booking_state");
      } else if (savedStateStr) {
        // 🔥 TRƯỜNG HỢP KHÁCH ÉP BUỘC BẤM NÚT BACK CỦA TRÌNH DUYỆT TỪ TRANG VNPAY
        const parsed = JSON.parse(savedStateStr);
        if (parsed.bookingId) {
          handleCancelBooking(parsed.bookingId); // Gọi API Hủy Hóa đơn
          message.warning(
            "Giao dịch bị gián đoạn. Hệ thống đã tự động hủy hóa đơn và nhả ghế!",
          );
        }
        sessionStorage.removeItem("kct_booking_state");
        setCurrentStep(0);
        setSelectedSeats([]);
        setTimeLeft(null);
      }
    }
  }, [token]);

  useEffect(() => {
    currentStepRef.current = currentStep;
    if (currentStep > 0 && currentStep < 4 && selectedSeats.length > 0) {
      const ids = selectedSeats
        .map((code) => {
          const s = dynamicSeats.find(
            (seat) => `${seat.rowName}${seat.number}` === code,
          );
          return s?.id;
        })
        .filter(Boolean) as string[];

      heldSeatIdsRef.current = ids;
    } else {
      heldSeatIdsRef.current = [];
    }
  }, [currentStep, selectedSeats, dynamicSeats]);

  const forceReleaseSeatsNow = () => {
    const seatIds = heldSeatIdsRef.current;
    if (
      seatIds.length > 0 &&
      currentStepRef.current > 0 &&
      currentStepRef.current < 4
    ) {
      const currentToken =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!currentToken) return;

      fetch("http://localhost:9090/cinema/seats/hold", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ showtimeId, seatIds }),
        keepalive: true,
      }).catch(() => {});
      heldSeatIdsRef.current = [];
    }
  };

  useEffect(() => {
    window.addEventListener("beforeunload", forceReleaseSeatsNow);
    return () => {
      window.removeEventListener("beforeunload", forceReleaseSeatsNow);
      forceReleaseSeatsNow();
    };
  }, [showtimeId]);

  useEffect(() => {
    const handleBrowserBack = () => {
      if (currentStepRef.current === 1) {
        forceReleaseSeatsNow();
        setTimeLeft(null);
        setCurrentStep(0);
      } else if (currentStepRef.current > 1 && currentStepRef.current < 4) {
        setCurrentStep((prev) => prev - 1);
      }
    };
    window.addEventListener("popstate", handleBrowserBack);
    return () => window.removeEventListener("popstate", handleBrowserBack);
  }, []);

  const showPremiumError = (title: string, desc: string) => {
    notification.error({
      message: (
        <span className="text-[#a61d24] font-black text-base uppercase">
          {title}
        </span>
      ),
      description: <span className="text-[#4a3426] font-medium">{desc}</span>,
      placement: "topRight",
      duration: 4,
      style: {
        backgroundColor: "#fffaf4",
        borderLeft: "6px solid #a61d24",
        borderRadius: "16px",
        boxShadow: "0 10px 30px rgba(74,52,38,0.15)",
      },
      closeIcon: (
        <CloseCircleOutlined className="text-[#a61d24] hover:text-red-700" />
      ),
    });
  };

  useEffect(() => {
    const checkAuthTimer = setTimeout(() => {
      const currentToken =
        token ||
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("token");
      if (!currentToken) {
        message.warning(
          locale === "vi"
            ? "Vui lòng đăng nhập để tiến hành đặt vé!"
            : "Please login to continue booking!",
        );
        router.replace(locale === "vi" ? "/dang-nhap" : "/en/dang-nhap");
      } else {
        setIsAuthChecking(false);
      }
    }, 500);
    return () => clearTimeout(checkAuthTimer);
  }, [token, router, locale]);

  // =========================================================
  // FETCH ALL DATA (Bao gồm Khuyến mãi)
  // =========================================================
  useEffect(() => {
    if (isAuthChecking) return;

    const fetchBookingDetails = async () => {
      try {
        const stRes = await fetch(
          `http://localhost:9090/cinema/showtimes/${showtimeId}`,
        );
        if (!stRes.ok) throw new Error("Không tìm thấy suất chiếu");
        const stData = await stRes.json();
        const showtimeInfo = stData.result;

        // 🔥 CHỐT CHẶN KIỂM TRA SUẤT CHIẾU QUÁ HẠN 15 PHÚT KHI RELOAD
        if (showtimeInfo && showtimeInfo.startTime) {
          const startTime = dayjs(showtimeInfo.startTime);
          const maxAllowedTime = startTime.add(15, "minute"); // Thời gian chiếu + 15 phút

          if (dayjs().isAfter(maxAllowedTime)) {
            message.error(
              locale === "vi"
                ? "Suất chiếu này đã bắt đầu quá 15 phút. Hệ thống tự động chuyển bạn về trang chủ!"
                : "This showtime has started for more than 15 minutes. Redirecting to homepage!",
            );

            // Dọn dẹp các session đặt vé dở dang (nếu có)
            sessionStorage.removeItem(`kct_temp_wizard_state_${showtimeId}`);
            sessionStorage.removeItem("kct_booking_state");

            // Đẩy thẳng về trang chủ theo đúng ngôn ngữ tương ứng
            router.replace(locale === "vi" ? "/" : "/en");
            return; // Dừng luồng xử lý không nạp thêm các dữ liệu ghế/bắp nước phía dưới
          }
        }

        // Nếu suất chiếu vẫn hợp lệ -> Tiếp tục set dữ liệu như cũ
        setShowtime(showtimeInfo);

        const movieRes = await fetch(
          `http://localhost:9090/cinema/movies/${showtimeInfo.movieId}`,
        );
        const movieData = await movieRes.json();
        setMovie(movieData.result);

        const hallRes = await fetch(
          `http://localhost:9090/cinema/halls/${showtimeInfo.hallId}`,
        );
        const hallData = await hallRes.json();
        setHallInfo(hallData.result);

        const seatsRes = await fetch(
          `http://localhost:9090/cinema/seats/hall/${showtimeInfo.hallId}`,
        );
        const seatsData = await seatsRes.json();
        setDynamicSeats(seatsData.result || []);

        const statusRes = await fetch(
          `http://localhost:9090/cinema/seats/status/${showtimeId}`,
        );
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setRealtimeLocks(statusData.result || {});
        }

        const concessionsRes = await fetch(
          `http://localhost:9090/cinema/concessions`,
        );
        if (concessionsRes.ok) {
          const concessionsData = await concessionsRes.json();
          setConcessions(concessionsData.result || []);
        }

        const promosRes = await fetch(
          `http://localhost:9090/cinema/promotions`,
        );
        if (promosRes.ok) {
          const promosData = await promosRes.json();
          setPromotions(promosData.result || []);
        }
      } catch (error) {
        showPremiumError(
          "Lỗi hệ thống",
          "Không thể tải dữ liệu rạp. Vui lòng tải lại trang!",
        );
      } finally {
        setLoading(false);
      }
    };
    if (showtimeId) fetchBookingDetails();
  }, [showtimeId, isAuthChecking, router, locale]);

  useEffect(() => {
    if (!showtimeId || isAuthChecking) return;
    const socket = new SockJS("http://localhost:9090/cinema/ws");
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        stompClient.subscribe("/topic/seats", (msg) => {
          const data = JSON.parse(msg.body);
          if (data.showtimeId === showtimeId) {
            setRealtimeLocks((prev) => {
              const newLocks = { ...prev };
              data.seatIds.forEach((id: string) => {
                if (data.status === "PENDING" || data.status === "BOOKED")
                  newLocks[id] = data.status;
                else if (data.status === "AVAILABLE") delete newLocks[id];
              });
              return newLocks;
            });
          }
        });
      },
    });
    stompClient.activate();
    return () => {
      stompClient.deactivate();
    };
  }, [showtimeId, isAuthChecking]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) {
      if (timeLeft === 0) {
        Modal.error({
          title:
            locale === "vi" ? "Hết thời gian giữ ghế" : "Seat Hold Expired",
          content:
            locale === "vi"
              ? "Thời gian giữ ghế của bạn đã hết. Giao dịch đã bị hủy, vui lòng quay lại trang chủ!"
              : "Your seat hold time has expired. The transaction is cancelled!",
          okButtonProps: { className: "bg-[#a61d24]" },
          onOk: () => {
            forceReleaseSeatsNow();
            sessionStorage.removeItem("kct_booking_state");

            // 🔥 XÓA TRẠNG THÁI TẠM THỜI VÌ SUẤT CHIẾU ĐÃ HẾT HẠN GIỮ GHẾ
            sessionStorage.removeItem(`kct_temp_wizard_state_${showtimeId}`);

            router.replace(locale === "vi" ? "/" : "/en");
          },
        });
      }
      return;
    }
    const timerId = setInterval(
      () => setTimeLeft((prev) => (prev ? prev - 1 : 0)),
      1000,
    );
    return () => clearInterval(timerId);
  }, [timeLeft, router, locale]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const cinemaName = hallInfo?.cinemaName || "KCT Cinema";
  const roomName = hallInfo?.name || "Đang cập nhật...";
  const showtimeStr = showtime
    ? dayjs(showtime.startTime).format("DD/MM/YYYY - HH:mm")
    : "";
  const dynamicRows = useMemo(
    () => Array.from(new Set(dynamicSeats.map((s) => s.rowName))).sort(),
    [dynamicSeats],
  );

  const seatMap = useMemo(() => {
    return dynamicSeats.map((s) => {
      let type = "normal";
      if (s.type === "VIP") type = "vip";
      if (s.type === "SWEETBOX") type = "couple";
      const isSoldOrBroken = s.status === "SOLD" || s.status === "BROKEN";
      const realtimeStatus = realtimeLocks[s.id];
      let finalStatus = "available";
      if (isSoldOrBroken || realtimeStatus === "BOOKED") finalStatus = "sold";
      else if (realtimeStatus === "PENDING") finalStatus = "held";

      return {
        id: s.id,
        seat: `${s.rowName}${s.number}`,
        row: s.rowName,
        col: s.number,
        type: type,
        status: finalStatus,
        disabled: finalStatus !== "available",
        rawSeat: s,
      };
    });
  }, [dynamicSeats, realtimeLocks]);

  const seatSubtotal = useMemo(() => {
    if (!showtime) return 0;
    return selectedSeats.reduce((total, seatCode) => {
      const seatObj = seatMap.find((s) => s.seat === seatCode);
      if (!seatObj) return total;
      let price = showtime.basePrice;
      if (seatObj.rawSeat.type === "VIP") price += 10000;
      if (seatObj.rawSeat.type === "SWEETBOX") price += 20000;
      return total + price;
    }, 0);
  }, [selectedSeats, seatMap, showtime]);

  const snackTotal = concessions.reduce(
    (total, item) => total + item.price * (snackQuantities[item.id] ?? 0),
    0,
  );

  // Tính discount theo hàm mới
  const discount = calculateDiscount(appliedPromo, seatSubtotal, snackTotal);
  const grandTotal = Math.max(0, seatSubtotal + snackTotal - discount);
  const selectedConcessions = concessions.filter(
    (item) => (snackQuantities[item.id] ?? 0) > 0,
  );
  const orderCode = `KCT-${bookingId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}`;

  function toggleSeat(seat: string) {
    const nextSelectedSeats = selectedSeats.includes(seat)
      ? selectedSeats.filter((item) => item !== seat)
      : [...selectedSeats, seat];
    if (nextSelectedSeats.length > 8) {
      showPremiumError(
        "Giới hạn chọn ghế",
        "Bạn chỉ được chọn tối đa 8 ghế trong 1 lần giao dịch!",
      );
      return;
    }
    setSelectedSeats(nextSelectedSeats.sort(compareSeatCode));
  }

  async function proceedToHoldSeats() {
    try {
      message.loading({
        content: "Đang kiểm tra và giữ ghế...",
        key: "holdSeat",
        duration: 0,
      });
      const currentToken =
        token ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");
      const selectedSeatIds = selectedSeats.map(
        (seatCode) => seatMap.find((s) => s.seat === seatCode)?.id,
      );
      const res = await fetch("http://localhost:9090/cinema/seats/hold", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          showtimeId: showtimeId,
          seatIds: selectedSeatIds,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.code !== 1000)
        throw new Error(
          data.message || "Ghế đã bị người khác chọn hoặc không hợp lệ!",
        );

      message.success({ content: "Đã giữ ghế thành công!", key: "holdSeat" });
      setTimeLeft(data.result.remainingSeconds || 300);
      setCurrentStep(1);
      window.history.pushState({ wizardStep: 1 }, "");
    } catch (error: any) {
      message.destroy("holdSeat");
      showPremiumError("Không thể giữ ghế", error.message);
    }
  }

  async function goNext() {
    if (currentStep === 0) {
      if (selectedSeats.length === 0) {
        showPremiumError("Chưa chọn ghế", copy.chooseSeatWarning);
        return;
      }
      const validationMessage = validateOrphanSeat(
        selectedSeats,
        seatMap,
        dynamicRows,
      );
      if (validationMessage) {
        showPremiumError(
          copy.invalidGapTitle,
          `${copy.invalidGapText}: ${validationMessage}`,
        );
        return;
      }

      if (movie && movie.ageRestriction && movie.ageRestriction !== "P") {
        const minAge = movie.ageRestriction.replace("C", "");
        Modal.confirm({
          icon: null,
          centered: true,
          width: 480,
          styles: {
            body: {
              padding: "32px 24px",
              backgroundColor: "#fffaf4",
              borderRadius: "24px",
            },
            mask: {
              backdropFilter: "blur(6px)",
              backgroundColor: "rgba(74, 52, 38, 0.4)",
            },
          },
          content: (
            <div className="flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#a61d24] to-[#e63946] text-white rounded-full flex items-center justify-center text-3xl font-black mb-5 shadow-[0_8px_20px_rgba(166,29,36,0.3)] border-4 border-[#fffaf4] outline outline-2 outline-[#a61d24]">
                {movie.ageRestriction}
              </div>
              <h2 className="text-2xl font-black text-[#4a3426] mb-3 text-center uppercase tracking-wider">
                {locale === "vi" ? "Xác nhận độ tuổi" : "Age Verification"}
              </h2>
              <div className="text-center text-[15px] text-[#8c6b45] px-2 mb-8 leading-relaxed font-medium">
                {locale === "vi" ? (
                  <>
                    Phim này được phân loại{" "}
                    <strong>{movie.ageRestriction}</strong>.<br />
                    Tôi xác nhận mua vé cho khán giả từ{" "}
                    <strong>{minAge} tuổi</strong> trở lên và đồng ý xuất trình
                    giấy tờ tùy thân tại rạp.
                  </>
                ) : (
                  <>
                    This movie is rated <strong>{movie.ageRestriction}</strong>.
                    <br />I confirm the ticket is for audiences{" "}
                    <strong>{minAge}+ years old</strong> and agree to show ID at
                    the cinema.
                  </>
                )}
              </div>
            </div>
          ),
          okText: locale === "vi" ? "Tôi Xác Nhận" : "I Confirm",
          cancelText: locale === "vi" ? "Từ Chối" : "Decline",
          okButtonProps: {
            size: "large",
            className:
              "bg-[#a61d24] hover:bg-[#8b151b] border-none px-10 h-[48px] text-base font-bold text-white rounded-[14px] shadow-[0_4px_15px_rgba(166,29,36,0.25)] transition-transform hover:scale-105",
          },
          cancelButtonProps: {
            size: "large",
            className:
              "bg-[#ead8c1] text-[#4a3426] hover:bg-[#e2cbb0] border-none px-8 h-[48px] text-base font-bold rounded-[14px] transition-all",
          },
          onOk: () => proceedToHoldSeats(),
        });
      } else {
        proceedToHoldSeats();
      }
    }
    // 🔥 XỬ LÝ LÚC BẤM NÚT HOÀN TẤT THANH TOÁN (BƯỚC 3)
    else if (currentStep === 3) {
      // Đã bỏ dòng if (!paymentDone) return; để khách bấm 1 phát ăn ngay
      try {
        message.loading({
          content: "Đang khởi tạo giao dịch VNPay...",
          key: "paymentProcess",
          duration: 0,
        });
        const currentToken =
          token ||
          localStorage.getItem("token") ||
          sessionStorage.getItem("token");

        // 1. TẠO HÓA ĐƠN TRÊN DB (Trạng thái PENDING)
        const selectedSeatIds = selectedSeats
          .map((seatCode) => seatMap.find((s) => s.seat === seatCode)?.id)
          .filter(Boolean);
        const concessionList = Object.entries(snackQuantities)
          .filter(([id, qty]) => (qty as number) > 0)
          .map(([id, qty]) => ({ concessionItemId: id, quantity: qty }));

        const bookingRes = await fetch(
          "http://localhost:9090/cinema/bookings",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${currentToken}`,
            },
            body: JSON.stringify({
              showtimeId: showtimeId,
              seatIds: selectedSeatIds,
              concessions: concessionList,
              promoCode: appliedPromo ? appliedPromo.discountCode : null,
            }),
          },
        );
        const bookingData = await bookingRes.json();
        if (!bookingRes.ok || bookingData.code !== 1000)
          throw new Error(bookingData.message || "Lỗi tạo hóa đơn!");

        const realBookingId = bookingData.result.id;
        const bCode = bookingData.result.bookingCode;

        // 2. LƯU LẠI STATE ĐỂ PHỤC HỒI SAU KHI VNPAY QUAY VỀ
        sessionStorage.setItem(
          "kct_booking_state",
          JSON.stringify({
            bookingId: realBookingId, // 🔥 BỔ SUNG DÒNG NÀY ĐỂ DỄ DÀNG HỦY
            bookingCode: bCode,
            selectedSeats: selectedSeats,
            returnUrl: window.location.pathname,
          }),
        );

        // 3. GỌI API LẤY URL VNPAY TỪ BACKEND
        const vnpayRes = await fetch(
          "http://localhost:9090/cinema/payments/vnpay/create",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${currentToken}`,
            },
            body: JSON.stringify({ bookingId: realBookingId, method: "VNPAY" }),
          },
        );
        const vnpayData = await vnpayRes.json();
        if (!vnpayRes.ok || vnpayData.code !== 1000)
          throw new Error(vnpayData.message || "Lỗi kết nối VNPay!");

        // 4. CHUYỂN HƯỚNG TRÌNH DUYỆT SANG VNPAY
        message.success({
          content: "Đang chuyển hướng...",
          key: "paymentProcess",
        });
        window.location.href = vnpayData.result.paymentUrl;
      } catch (error: any) {
        message.destroy("paymentProcess");
        showPremiumError("Giao dịch thất bại", error.message);
      }
    }
    // Các bước khác (1, 2)
    else {
      setCurrentStep((step) => Math.min(step + 1, 4));
    }
  }

  function goBack() {
    // 🔥 ĐÃ SỬA LỖI: Bấm nút Quay lại ở Bước 4 sẽ Xóa sạch session và Về trang chủ
    if (currentStep === 4) {
      sessionStorage.removeItem(`kct_temp_wizard_state_${showtimeId}`);
      router.push(locale === "vi" ? "/" : "/en");
      return;
    }

    // 🔥 Nếu khách đang ở bước 3 (Thanh toán) mà bấm nút Quay lại -> Hủy hóa đơn nháp để nhả ghế
    if (currentStep === 3) {
      const savedStateStr = sessionStorage.getItem("kct_booking_state");
      if (savedStateStr) {
        const parsed = JSON.parse(savedStateStr);
        if (parsed.bookingId) {
          const currentToken =
            token ||
            localStorage.getItem("token") ||
            sessionStorage.getItem("token");
          fetch(
            `http://localhost:9090/cinema/bookings/${parsed.bookingId}/cancel`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${currentToken}` },
            },
          ).catch(() => {});
          sessionStorage.removeItem("kct_booking_state");
        }
      }
    }

    if (currentStep === 1) {
      forceReleaseSeatsNow();
      setTimeLeft(null);
    }
    setCurrentStep((step) => Math.max(step - 1, 0));
  }

  function updateSnackQuantity(id: string, value: number | null) {
    setSnackQuantities((current) => ({ ...current, [id]: value ?? 0 }));
  }

  // 🔥 TÁCH RIÊNG HÀM KIỂM TRA ĐIỀU KIỆN ĐỂ TÁI SỬ DỤNG
  function validateAndApplyPromo(promo: any) {
    const total = seatSubtotal + snackTotal;

    // 1. Kiểm tra mức mua tối thiểu
    if (promo.minPurchaseAmount && total < promo.minPurchaseAmount) {
      setPromoMessage(
        `Đơn hàng phải từ ${formatCurrency(promo.minPurchaseAmount, locale as "vi" | "en")} để áp dụng mã này.`,
      );
      setAppliedPromo(null);
      return;
    }

    // 2. Kiểm tra xem giỏ hàng có sản phẩm phù hợp với target của mã không
    let applicableAmount = 0;
    let targetName = locale === "vi" ? "toàn bộ đơn hàng" : "entire order";

    if (promo.target === "TICKET") {
      applicableAmount = seatSubtotal;
      targetName = locale === "vi" ? "vé xem phim" : "tickets";
    } else if (promo.target === "CONCESSION") {
      applicableAmount = snackTotal;
      targetName = locale === "vi" ? "bắp nước" : "concessions";
    } else {
      applicableAmount = total;
    }

    // 🔥 CHẶN NGAY: Nếu số tiền sản phẩm được áp dụng là 0đ -> Báo lỗi
    if (applicableAmount === 0) {
      setPromoMessage(
        locale === "vi"
          ? `Mã này chỉ giảm giá cho ${targetName}. Giỏ hàng của bạn chưa có sản phẩm phù hợp!`
          : `This promo code only applies to ${targetName}.`,
      );
      setAppliedPromo(null);
      return;
    }

    // Vượt qua hết các vòng kiểm tra -> Áp dụng mã thành công
    setAppliedPromo(promo);
    setPromoCode(promo.discountCode);
    setPromoMessage(copy.appliedPromo(promo.discountCode));
  }

  // KIỂM TRA MÃ KHUYẾN MÃI (NHẬP TAY)
  function applyTypedPromo() {
    const normalized = promoCode.trim().toUpperCase();
    const promo = promotions.find(
      (item) => item.discountCode.toUpperCase() === normalized,
    );
    if (!promo) {
      setPromoMessage(copy.invalidPromo);
      setAppliedPromo(null);
      return;
    }
    validateAndApplyPromo(promo);
  }

  // KIỂM TRA MÃ KHUYẾN MÃI (CHỌN TỪ DANH SÁCH)
  function applyMemberPromo() {
    const promo = promotions.find((item) => item.id === selectedMemberPromo);
    if (!promo) {
      setPromoMessage(copy.choosePromo);
      return;
    }
    validateAndApplyPromo(promo);
  }

  // 🔥 CHỐNG LÁCH LUẬT: Tự động hủy mã nếu khách lùi bước để bỏ bớt Bắp/Vé ra khỏi giỏ
  useEffect(() => {
    if (appliedPromo) {
      const total = seatSubtotal + snackTotal;
      let applicableAmount = 0;
      if (appliedPromo.target === "TICKET") applicableAmount = seatSubtotal;
      else if (appliedPromo.target === "CONCESSION")
        applicableAmount = snackTotal;
      else applicableAmount = total;

      if (
        (appliedPromo.minPurchaseAmount &&
          total < appliedPromo.minPurchaseAmount) ||
        applicableAmount === 0
      ) {
        setAppliedPromo(null);
        setPromoMessage(
          locale === "vi"
            ? `Đã tự động hủy mã khuyến mãi do giỏ hàng thay đổi không còn đủ điều kiện.`
            : `Promo removed due to cart changes.`,
        );
      }
    }
  }, [seatSubtotal, snackTotal]);

  const stepItems = [
    { title: copy.seats, icon: <TagsOutlined /> },
    { title: copy.concessions, icon: <ShoppingCartOutlined /> },
    { title: copy.promo, icon: <GiftOutlined /> },
    { title: copy.payment, icon: <QrcodeOutlined /> },
    { title: copy.tickets, icon: <CheckCircleOutlined /> },
  ];

  if (isAuthChecking)
    return (
      <div className="flex justify-center items-center py-20">
        <Spin
          size="large"
          tip={
            locale === "vi"
              ? "Đang kiểm tra bảo mật..."
              : "Checking security..."
          }
        />
      </div>
    );
  if (loading)
    return (
      <div className="flex justify-center items-center py-20">
        <Spin
          size="large"
          tip={
            locale === "vi"
              ? "Đang tải dữ liệu rạp..."
              : "Loading cinema data..."
          }
        />
      </div>
    );
  if (!movie || !showtime)
    return (
      <div className="text-center py-20 text-red-500">
        {locale === "vi"
          ? "Suất chiếu không tồn tại hoặc đã bị hủy!"
          : "Showtime does not exist or has been cancelled!"}
      </div>
    );

  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={17}>
        <Card bordered={false} className="cinema-paper rounded-[24px]">
          <Space
            direction="vertical"
            size={22}
            className="w-full relative pt-14"
          >
            {currentStep > 0 && currentStep < 4 && timeLeft !== null && (
              <div className="absolute top-[-10px] right-0 bg-white border-2 border-[#a61d24] px-5 py-2 rounded-xl shadow-[0_4px_15px_rgba(166,29,36,0.2)] z-10 flex items-center gap-3 animate-pulse">
                <ClockCircleOutlined className="text-[#a61d24] text-2xl" />
                <div className="flex flex-col">
                  <span className="text-[11px] uppercase font-bold text-gray-500 leading-none mb-1">
                    Thời gian giữ ghế
                  </span>
                  <span className="text-2xl font-black text-[#a61d24] leading-none tracking-wider">
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>
            )}

            <Steps current={currentStep} items={stepItems} responsive />

            {currentStep === 0 ? (
              <SeatStep
                copy={copy}
                seatMap={seatMap}
                dynamicRows={dynamicRows}
                selectedSeats={selectedSeats}
                toggleSeat={toggleSeat}
              />
            ) : null}
            {currentStep === 1 ? (
              <ConcessionStep
                copy={copy}
                locale={locale}
                concessions={concessions}
                snackQuantities={snackQuantities}
                updateSnackQuantity={updateSnackQuantity}
              />
            ) : null}

            {/* 🔥 TRUYỀN promotions LẤY TỪ DB VÀO BƯỚC NÀY */}
            {currentStep === 2 ? (
              <PromoStep
                copy={copy}
                locale={locale}
                promotions={promotions}
                promoCode={promoCode}
                setPromoCode={setPromoCode}
                selectedMemberPromo={selectedMemberPromo}
                setSelectedMemberPromo={setSelectedMemberPromo}
                appliedPromo={appliedPromo}
                promoMessage={promoMessage}
                applyTypedPromo={applyTypedPromo}
                applyMemberPromo={applyMemberPromo}
                skipPromo={() => {
                  setAppliedPromo(null);
                  setPromoMessage(copy.skippedPromo);
                }}
              />
            ) : null}

            {currentStep === 3 ? (
              <PaymentStep
                copy={copy}
                grandTotal={grandTotal}
                locale={locale}
              />
            ) : null}
            {currentStep === 4 ? (
              <TicketStep
                copy={copy}
                movie={movie}
                cinemaName={cinemaName}
                roomName={roomName}
                showtime={showtimeStr}
                selectedSeats={selectedSeats}
                // 🔥 ĐÃ ĐỔI: In vé bằng mã thật trong DB
                orderCode={finalBookingCode || orderCode}
                appliedPromo={appliedPromo}
                grandTotal={grandTotal}
              />
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between pt-4 border-t border-gray-100">
              <Button
                size="large"
                disabled={currentStep === 0}
                onClick={goBack}
              >
                {/* 🔥 HIỂN THỊ CHỮ "VỀ TRANG CHỦ" KHI ĐANG Ở BƯỚC XUẤT VÉ */}
                {currentStep === 4
                  ? locale === "vi"
                    ? "Về Trang Chủ"
                    : "Back to Home"
                  : copy.back}
              </Button>

              {currentStep < 4 ? (
                <Button
                  size="large"
                  type="primary"
                  icon={
                    currentStep === 3 ? (
                      <CheckCircleOutlined />
                    ) : (
                      <CreditCardOutlined />
                    )
                  }
                  disabled={currentStep === 0 && selectedSeats.length === 0}
                  onClick={goNext}
                  className="bg-[#a61d24]"
                >
                  {currentStep === 3 ? "Thanh toán qua VNPay" : copy.next}
                </Button>
              ) : (
                // 🔥 THÊM NÚT ĐẶT THÊM VÉ (RESET TRẠNG THÁI VỀ BƯỚC 0)
                <Button
                  size="large"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    sessionStorage.removeItem(
                      `kct_temp_wizard_state_${showtimeId}`,
                    );
                    setCurrentStep(0);
                    setSelectedSeats([]);
                    setPaymentDone(false);
                    setFinalBookingCode("");
                    setTimeLeft(null);
                  }}
                  className="bg-[#a61d24] font-semibold"
                >
                  {locale === "vi"
                    ? "Đặt thêm vé suất chiếu này"
                    : "Book more tickets"}
                </Button>
              )}
            </div>
          </Space>
        </Card>
      </Col>

      <Col xs={24} lg={7}>
        <OrderSummary
          copy={copy}
          locale={locale}
          movie={movie}
          cinemaName={cinemaName}
          roomName={roomName}
          showtime={showtimeStr}
          showtimeFormat={showtime?.format}
          selectedSeats={selectedSeats}
          seatSubtotal={seatSubtotal}
          selectedConcessions={selectedConcessions}
          snackQuantities={snackQuantities}
          snackTotal={snackTotal}
          appliedPromo={appliedPromo}
          discount={discount}
          grandTotal={grandTotal}
        />
      </Col>
    </Row>
  );
}

function SeatStep({
  copy,
  seatMap,
  dynamicRows,
  selectedSeats,
  toggleSeat,
}: any) {
  return (
    <Space direction="vertical" size={18} className="w-full">
      <div className="w-full overflow-x-auto rounded-[20px] border border-[#ead8c1] shadow-sm">
        <div className="bg-[#fffaf4] p-4 sm:p-8 min-w-max flex flex-col items-center">
          <div className="mb-12 w-[80%] min-w-[400px] rounded-t-[100%] border-b-4 border-gray-400 bg-[#4a3426] px-8 py-2 text-center font-semibold text-white shadow-[0_12px_30px_rgba(74,52,38,0.18)]">
            {copy.screen}
          </div>
          <div className="flex flex-col gap-3 items-center">
            {dynamicRows.map((row: string) => {
              const rowSeats = seatMap
                .filter((s: any) => s.row === row)
                .sort((a: any, b: any) => a.col - b.col);
              return (
                <div
                  key={row}
                  className="flex items-center justify-center gap-4 flex-nowrap"
                >
                  <span className="w-6 font-bold text-center text-[#8c6b45] shrink-0">
                    {row}
                  </span>
                  <div className="flex gap-2 flex-nowrap">
                    {rowSeats.map((seatObj: any) => {
                      const isSelected = selectedSeats.includes(seatObj.seat);
                      let seatClass =
                        "border-[#e2d1bb] bg-white text-[#4a3426] hover:border-[#a61d24]";
                      if (seatObj.status === "sold")
                        seatClass =
                          "cursor-not-allowed border-transparent bg-slate-300 text-slate-500 line-through";
                      else if (seatObj.status === "held")
                        seatClass =
                          "cursor-not-allowed border-transparent bg-[#9ea1a5] text-white opacity-90";
                      else if (isSelected)
                        seatClass =
                          "border-[#a61d24] bg-[#a61d24] text-white shadow-[0_10px_20px_rgba(166,29,36,0.18)] transform scale-110";
                      else if (seatObj.type === "vip")
                        seatClass =
                          "border-[#a61d24] bg-white text-[#a61d24] font-semibold";
                      else if (seatObj.type === "couple")
                        seatClass =
                          "border-[#c89a2b] bg-[#fff7e0] text-[#8c6b45] hover:border-[#b8861c] w-14";
                      return (
                        <button
                          key={seatObj.seat}
                          type="button"
                          disabled={seatObj.disabled}
                          onClick={() => toggleSeat(seatObj.seat)}
                          className={`h-9 w-9 shrink-0 rounded-t-lg border-2 text-[10px] transition-all ${seatClass}`}
                        >
                          {seatObj.seat}
                        </button>
                      );
                    })}
                  </div>
                  <span className="w-6 font-bold text-center text-[#8c6b45] shrink-0">
                    {row}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex justify-center gap-4 sm:gap-6 p-4 bg-gray-50 rounded-xl border border-gray-100 flex-wrap mt-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-t-md border-2 border-gray-300 bg-white"></div>
          <span className="text-xs font-semibold">Ghế Thường</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-t-md border-2 border-[#a61d24] bg-white"></div>
          <span className="text-xs font-semibold text-[#a61d24]">Ghế VIP</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-5 rounded-t-md border-2 border-[#c89a2b] bg-[#fff7e0]"></div>
          <span className="text-xs font-semibold text-[#8c6b45]">Couple</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-t-md border-2 border-transparent bg-[#a61d24]"></div>
          <span className="text-xs font-semibold text-gray-800">
            Bạn đang chọn
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-t-md border-2 border-transparent bg-[#9ea1a5] opacity-90"></div>
          <span className="text-xs font-semibold text-gray-600">
            Người khác đang chọn
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-t-md border-2 border-gray-300 bg-slate-300"></div>
          <span className="text-xs font-semibold text-gray-400 line-through">
            Đã bán
          </span>
        </div>
      </div>
    </Space>
  );
}

function ConcessionStep({
  copy,
  locale,
  concessions,
  snackQuantities,
  updateSnackQuantity,
}: any) {
  return (
    <Space direction="vertical" size={16} className="w-full">
      <Alert type="info" showIcon message={copy.concessionOptional} />
      <Row gutter={[16, 16]}>
        {concessions.map((item: any) => (
          <Col xs={24} md={12} key={item.id}>
            <div className="flex h-full gap-4 rounded-[16px] border border-[#ead8c1] bg-[#fffaf4] p-4">
              <div className="flex aspect-square w-24 shrink-0 items-center justify-center rounded-[14px] border border-dashed border-[#c89a2b] bg-white text-center overflow-hidden">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#8c6b45]">
                    {copy.imageSlot}
                  </span>
                )}
              </div>
              <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
                <div className="min-w-0">
                  <Typography.Text strong>{item.name}</Typography.Text>
                  <div className="mt-1 text-sm text-[#8c6b45]">
                    {formatCurrency(item.price, locale)}
                  </div>
                  {item.description && (
                    <div className="text-[11px] text-gray-500 line-clamp-2 mt-1">
                      {item.description}
                    </div>
                  )}
                </div>
                <InputNumber
                  min={0}
                  max={99} // 🔥 ĐÃ SỬA: Cho phép nhập tối đa đến 99
                  maxLength={2} // 🔥 BỔ SUNG: Giới hạn độ dài nhập liệu đúng 2 chữ số
                  value={snackQuantities[item.id] ?? 0}
                  onChange={(value) => {
                    // Cập nhật state (nếu null/undefined thì quy về 0)
                    updateSnackQuantity(item.id, value ?? 0);
                  }}
                  // Bổ sung parser để loại bỏ các ký tự lạ, dấu + - . e
                  parser={(displayValue) => {
                    const parsed = parseInt(
                      displayValue?.replace(/\D/g, "") || "0",
                      10,
                    );
                    return isNaN(parsed) ? 0 : parsed;
                  }}
                  className="w-16 text-center"
                />
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </Space>
  );
}

// 🔥 CẬP NHẬT GIAO DIỆN HIỂN THỊ DANH SÁCH MÃ KHUYẾN MÃI
function PromoStep({
  copy,
  locale,
  promotions,
  promoCode,
  setPromoCode,
  selectedMemberPromo,
  setSelectedMemberPromo,
  appliedPromo,
  promoMessage,
  applyTypedPromo,
  applyMemberPromo,
  skipPromo,
}: any) {
  return (
    <Space direction="vertical" size={18} className="w-full">
      <Alert type="info" showIcon message={copy.promoOptional} />
      <div className="rounded-[16px] border border-[#ead8c1] bg-[#fffaf4] p-4">
        <Typography.Title level={4} style={{ marginTop: 0, color: "#4a3426" }}>
          {copy.enterPromo}
        </Typography.Title>
        <Space.Compact className="w-full">
          <Input
            size="large"
            value={promoCode}
            onChange={(event) => setPromoCode(event.target.value)}
            placeholder="Nhập mã..."
          />
          <Button
            size="large"
            type="primary"
            icon={<TagOutlined />}
            onClick={applyTypedPromo}
            className="bg-[#a61d24] border-none"
          >
            {copy.apply}
          </Button>
        </Space.Compact>
      </div>
      <div className="rounded-[16px] border border-[#ead8c1] bg-[#fffaf4] p-4">
        <Typography.Title level={4} style={{ marginTop: 0, color: "#4a3426" }}>
          {copy.memberPromos}
        </Typography.Title>

        {promotions && promotions.length > 0 ? (
          <Radio.Group
            value={selectedMemberPromo}
            onChange={(event) => setSelectedMemberPromo(event.target.value)}
            className="w-full"
          >
            <Space direction="vertical" className="w-full">
              {promotions.map((promo: any) => (
                <Radio
                  key={promo.id}
                  value={promo.id}
                  className="w-full items-start"
                >
                  <div className="flex flex-col mb-2">
                    <span>
                      <strong className="text-[#a61d24]">
                        {promo.discountCode}
                      </strong>{" "}
                      - {promo.title}
                    </span>
                    {promo.description && (
                      <span className="text-xs text-gray-500 mt-0.5">
                        {promo.description}
                      </span>
                    )}
                    <span className="text-xs font-semibold text-[#8c6b45] mt-1 bg-[#fff7e0] px-2 py-0.5 rounded w-fit border border-[#ead8c1]">
                      Giảm {promo.discountPercent}%
                      {promo.maxDiscountAmount > 0 &&
                        ` (Tối đa ${formatCurrency(promo.maxDiscountAmount, locale)})`}
                      {promo.minPurchaseAmount > 0 &&
                        ` | Đơn từ ${formatCurrency(promo.minPurchaseAmount, locale)}`}
                    </span>
                  </div>
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        ) : (
          <Typography.Text type="secondary">
            Hiện tại chưa có mã khuyến mãi nào.
          </Typography.Text>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            type="primary"
            onClick={applyMemberPromo}
            className="bg-[#a61d24]"
          >
            {copy.confirmPromo}
          </Button>
          <Button onClick={skipPromo}>{copy.skipPromo}</Button>
        </div>
      </div>
      {promoMessage && (
        <Alert
          type={appliedPromo ? "success" : "warning"}
          showIcon
          message={promoMessage}
        />
      )}
    </Space>
  );
}

function PaymentStep({ copy, grandTotal, locale }: any) {
  return (
    <div className="mx-auto max-w-3xl space-y-6 pt-4">
      {/* Cảnh báo thời gian giữ ghế */}
      <Alert
        message={
          locale === "vi"
            ? "Lưu ý: Bạn có 5 phút để hoàn tất thanh toán. Quá thời gian, hệ thống sẽ tự động hủy đơn và nhả ghế."
            : "Note: You have 5 minutes to complete the payment. Otherwise, the seats will be released."
        }
        type="warning"
        showIcon
        className="rounded-xl border-[#c89a2b] bg-[#fff7e0] text-[#8c6b45] font-medium"
      />

      <div className="rounded-[20px] border border-[#ead8c1] bg-[#fffaf4] p-6 sm:p-8 shadow-sm">
        <Typography.Title
          level={4}
          style={{ marginTop: 0, color: "#4a3426", marginBottom: 20 }}
          className="uppercase tracking-wide"
        >
          {locale === "vi" ? "Phương thức thanh toán" : "Payment Method"}
        </Typography.Title>

        {/* Hộp chọn phương thức VNPay (Mặc định chọn) */}
        <div className="flex items-center justify-between p-4 sm:p-5 rounded-2xl border-2 border-[#a61d24] bg-white shadow-[0_4px_15px_rgba(166,29,36,0.08)] cursor-pointer transition-all hover:border-red-600">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 p-2 shrink-0">
              {/* Logo VNPay */}
              <img
                src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-VNPAY-QR.png"
                alt="VNPay"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-[#4a3426]">
                Thanh toán qua VNPAY
              </span>
              <span className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">
                Quét mã QR qua App Ngân hàng hoặc thanh toán qua thẻ
                ATM/Visa/MasterCard.
              </span>
            </div>
          </div>
          <CheckCircleOutlined className="text-[#a61d24] text-2xl sm:text-3xl ml-2 shrink-0" />
        </div>

        {/* Khối tổng tiền */}
        <div className="mt-8 p-5 rounded-2xl bg-white border border-[#ead8c1] flex justify-between items-center">
          <Typography.Text className="text-gray-500 font-medium text-base">
            {locale === "vi"
              ? "Số tiền cần thanh toán:"
              : "Total amount to pay:"}
          </Typography.Text>
          <Typography.Title
            level={2}
            style={{ margin: 0, color: "#a61d24", lineHeight: 1 }}
          >
            {new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US").format(
              grandTotal,
            )}
            đ
          </Typography.Title>
        </div>

        {/* Dòng điều khoản */}
        <div className="mt-6 text-sm text-gray-500 text-center leading-relaxed">
          {locale === "vi" ? (
            <>
              Bằng việc bấm <strong>"Thanh toán qua VNPay"</strong> ở góc dưới,
              bạn đã xác nhận hiểu rõ các{" "}
              <a
                href="#"
                className="text-[#a61d24] hover:underline font-semibold"
              >
                Quy định giao dịch trực tuyến
              </a>{" "}
              của KCT Cinema.
            </>
          ) : (
            <>
              By clicking <strong>"Pay via VNPay"</strong> below, you confirm
              that you have read and understood KCT Cinema's{" "}
              <a
                href="#"
                className="text-[#a61d24] hover:underline font-semibold"
              >
                Online Transaction Terms
              </a>
              .
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TicketStep({
  copy,
  movie,
  cinemaName,
  roomName,
  showtime,
  selectedSeats,
  orderCode,
  appliedPromo,
  grandTotal,
}: any) {
  return (
    <Space direction="vertical" size={18} className="w-full">
      <Alert type="success" showIcon message={copy.ticketReady} />
      <Row gutter={[16, 16]}>
        {selectedSeats.map((seat: string, index: number) => (
          <Col xs={24} md={12} key={seat}>
            <div className="overflow-hidden rounded-[18px] border border-[#ead8c1] bg-white shadow-[0_12px_30px_rgba(74,52,38,0.08)]">
              <div className="bg-[#4a3426] px-5 py-4 text-white">
                <Typography.Text style={{ color: "white" }}>
                  {copy.eTicket}
                </Typography.Text>
                <Typography.Title
                  level={4}
                  style={{ margin: "4px 0 0", color: "white" }}
                >
                  {movie.title}
                </Typography.Title>
              </div>
              <div className="space-y-3 p-5">
                <TicketLine
                  label={copy.ticketNo}
                  value={`${orderCode}-${index + 1}`}
                />
                <TicketLine label={copy.cinema} value={cinemaName} />
                <TicketLine label={copy.room} value={roomName} />
                <TicketLine label={copy.showtime} value={showtime} />
                <TicketLine label={copy.seat} value={seat} />
                {appliedPromo && (
                  <TicketLine
                    label={copy.promo}
                    value={appliedPromo.discountCode}
                  />
                )}
                <Divider style={{ margin: "10px 0" }} />
                <div className="flex items-center justify-between">
                  <Typography.Text strong>{copy.paid}</Typography.Text>
                  <Typography.Text strong style={{ color: "#a61d24" }}>
                    {formatCurrency(
                      Math.round(grandTotal / selectedSeats.length),
                      "vi",
                    )}
                  </Typography.Text>
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </Space>
  );
}

function TicketLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Typography.Text type="secondary">{label}</Typography.Text>
      <Typography.Text strong className="text-right">
        {value}
      </Typography.Text>
    </div>
  );
}

const formatDisplayMap: Record<string, string> = {
  TWO_D: "2D",
  THREE_D: "3D",
  IMAX: "IMAX",
  FOUR_DX: "4DX",
};

function OrderSummary({
  copy,
  locale,
  movie,
  cinemaName,
  roomName,
  showtime,
  showtimeFormat,
  selectedSeats,
  seatSubtotal,
  selectedConcessions,
  snackQuantities,
  snackTotal,
  appliedPromo,
  discount,
  grandTotal,
}: any) {
  return (
    <Card bordered={false} className="cinema-paper sticky top-4 rounded-[24px]">
      <Space direction="vertical" size={16} className="w-full">
        {/* ... (Các phần hiển thị tên phim, suất chiếu giữ nguyên) ... */}
        <div className="flex gap-4">
          <div className="w-24 shrink-0 rounded-lg overflow-hidden shadow-sm border border-gray-200">
            <img
              src={movie?.posterUrl || "https://via.placeholder.com/150x220"}
              alt={movie?.title}
              className="w-full h-auto object-cover aspect-[2/3]"
            />
          </div>
          <div className="flex flex-col gap-1 text-sm">
            <Typography.Text
              strong
              className="text-base text-[#4a3426] uppercase leading-tight"
            >
              {movie?.title}
            </Typography.Text>
            {showtimeFormat && (
              <span className="text-[10px] font-bold text-gray-500 border border-gray-300 px-1.5 py-0.5 rounded inline-block w-fit mt-0.5 mb-1 bg-gray-50">
                {formatDisplayMap[showtimeFormat] || showtimeFormat}
              </span>
            )}
            <Typography.Text className="text-[13px]">
              <span className="text-gray-500">{copy.cinema}:</span>{" "}
              <strong>{cinemaName}</strong>
            </Typography.Text>
            <Typography.Text className="text-[13px]">
              <span className="text-gray-500">{copy.room}:</span>{" "}
              <strong>{roomName}</strong>
            </Typography.Text>
            <Typography.Text className="text-[13px]">
              <span className="text-gray-500">{copy.showtime}:</span>{" "}
              <strong className="text-[#a61d24]">{showtime}</strong>
            </Typography.Text>
          </div>
        </div>
        <Divider style={{ margin: "0" }} />
        <div className="flex flex-col">
          <Typography.Text className="text-gray-500 text-sm mb-1">
            {copy.selectedSeats}:
          </Typography.Text>
          <div className="flex flex-wrap gap-1">
            {selectedSeats.length > 0 ? (
              selectedSeats.map((seat: string) => (
                <span
                  key={seat}
                  className="bg-[#a61d24] text-white px-2 py-0.5 rounded text-xs font-bold"
                >
                  {seat}
                </span>
              ))
            ) : (
              <Typography.Text strong>{copy.noneSelected}</Typography.Text>
            )}
          </div>
        </div>
        <Divider style={{ margin: "0" }} />

        {/* ======================================================== */}
        {/* KHU VỰC TÍNH TIỀN (ĐÃ ĐƯỢC CHỈNH SỬA) */}
        {/* ======================================================== */}
        <SummaryRow
          label={copy.seatSubtotal}
          value={formatCurrency(seatSubtotal, locale)}
        />

        {/* Hiển thị chi tiết từng món bắp nước */}
        {selectedConcessions.map((item: any) => (
          <SummaryRow
            key={item.id}
            label={`${item.name} x${snackQuantities[item.id] ?? 0}`}
            value={formatCurrency(
              item.price * (snackQuantities[item.id] ?? 0),
              locale,
            )}
          />
        ))}

        {/* 🔥 ĐÃ XÓA DÒNG HIỂN THỊ TỔNG BẮP NƯỚC (copy.concessionTotal) Ở ĐÂY ĐỂ TRÁNH TRÙNG LẶP */}

        {/* Chỉ hiển thị dòng Giảm giá nếu có */}
        {discount > 0 && (
          <SummaryRow
            label={copy.discount}
            value={`-${formatCurrency(discount, locale)}`}
          />
        )}
        {appliedPromo && <Tag color="green">{appliedPromo.discountCode}</Tag>}
        {/* ======================================================== */}

        <Divider style={{ margin: "0" }} />
        <div className="flex items-end justify-between">
          <Typography.Text strong className="text-base">
            {copy.grandTotal}
          </Typography.Text>
          <Typography.Title
            level={2}
            style={{ margin: 0, color: "#a61d24", lineHeight: 1 }}
          >
            {formatCurrency(grandTotal, locale)}
          </Typography.Title>
        </div>
      </Space>
    </Card>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Typography.Text>{label}</Typography.Text>
      <Typography.Text strong>{value}</Typography.Text>
    </div>
  );
}

function compareSeatCode(left: string, right: string) {
  if (left[0] === right[0])
    return Number(left.slice(1)) - Number(right.slice(1));
  return left.localeCompare(right);
}

function validateOrphanSeat(
  selectedSeats: string[],
  seatMap: any[],
  dynamicRows: string[],
) {
  for (const row of dynamicRows) {
    const rowSeats = seatMap
      .filter((s) => s.row === row)
      .sort((a, b) => a.col - b.col);
    const openSeatCols = rowSeats
      .filter(
        (s) => s.status === "available" && !selectedSeats.includes(s.seat),
      )
      .map((s) => s.col);
    let streak = 0;
    for (let i = 0; i < openSeatCols.length; i++) {
      const current = openSeatCols[i];
      const prev = openSeatCols[i - 1];
      if (i === 0 || current === prev + 1) {
        streak++;
      } else {
        if (streak === 1) return `${row}${prev}`;
        streak = 1;
      }
    }
    if (streak === 1 && openSeatCols.length > 0)
      return `${row}${openSeatCols[openSeatCols.length - 1]}`;
  }
  return null;
}

// 🔥 TÍNH TOÁN THEO ĐÚNG TARGET CỦA BACKEND
function calculateDiscount(
  promo: any,
  seatSubtotal: number,
  snackTotal: number,
) {
  if (!promo) return 0;

  const total = seatSubtotal + snackTotal;

  // Nếu không đạt mức mua tối thiểu -> Từ chối giảm
  if (promo.minPurchaseAmount && total < promo.minPurchaseAmount) return 0;

  // Lọc ra số tiền được phép áp dụng giảm giá
  let applicableAmount = 0;
  if (promo.target === "TICKET") {
    applicableAmount = seatSubtotal;
  } else if (promo.target === "CONCESSION") {
    applicableAmount = snackTotal;
  } else {
    applicableAmount = total;
  }

  if (applicableAmount === 0) return 0;

  // Tính số tiền được giảm theo phần trăm
  let discountAmount =
    (applicableAmount * Number(promo.discountPercent || 0)) / 100;

  // Cắt bớt phần dư nếu có cấu hình maxDiscountAmount
  if (promo.maxDiscountAmount && promo.maxDiscountAmount > 0) {
    discountAmount = Math.min(discountAmount, Number(promo.maxDiscountAmount));
  }

  return Math.round(discountAmount);
}

function formatCurrency(value: number, locale: "vi" | "en") {
  return (
    new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US").format(value) +
    "đ"
  );
}

function getBookingCopy(locale: "vi" | "en") {
  if (locale === "en") {
    return {
      title: "Complete your booking",
      bookingFlow: "Booking flow",
      seats: "Seats",
      concessions: "Concessions",
      imageSlot: "Image",
      promo: "Promotion",
      payment: "Payment",
      tickets: "Tickets",
      screen: "SCREEN",
      summary: "Order summary",
      selectedSeats: "Selected seats",
      noneSelected: "Not selected",
      chooseSeatWarning: "Please select at least one seat before continuing.",
      invalidGapTitle: "Invalid seat gap",
      invalidGapText: "This selection leaves an isolated empty seat",
      concessionOptional:
        "Concessions are optional. You can continue without buying popcorn or drinks.",
      promoOptional:
        "Promotions are optional. Enter a code or choose one of your available vouchers.",
      enterPromo: "Enter promotion code",
      memberPromos: "Available member promotions",
      apply: "Apply",
      confirmPromo: "Confirm selected promotion",
      skipPromo: "Skip promotion",
      invalidPromo: "Promotion code is not valid.",
      choosePromo: "Please choose a promotion first.",
      appliedPromo: (code: string) => `${code} has been applied.`,
      skippedPromo: "Promotion step skipped.",
      scanToPay: "Scan QR to pay",
      qrPlaceholder: "QR code frame",
      qrDescription:
        "Place the real payment QR here when the payment gateway is connected.",
      amount: "Amount",
      markPaid: "I have completed payment",
      paymentConfirmed: "Payment confirmed",
      finishPayment: "Finish payment",
      eTicket: "E-ticket",
      ticketNo: "Ticket no.",
      cinema: "Cinema",
      showtime: "Showtime",
      seat: "Seat",
      room: "Hall",
      paid: "Paid",
      seatSubtotal: "Tickets",
      concessionTotal: "Concessions",
      discount: "Discount",
      grandTotal: "Total",
      next: "Continue",
      back: "Back",
      ticketReady:
        "Payment completed! Your e-ticket will be sent to your email and is displayed below.",
    };
  }
  return {
    title: "Hoàn tất đặt vé",
    bookingFlow: "Quy trình đặt vé",
    seats: "Chọn ghế",
    concessions: "Bắp và nước",
    imageSlot: "Ảnh",
    promo: "Khuyến mãi",
    payment: "Thanh toán",
    tickets: "Xuất vé",
    screen: "MÀN HÌNH CHÍNH",
    summary: "Tóm tắt đơn hàng",
    selectedSeats: "Ghế đã chọn",
    noneSelected: "Chưa chọn",
    chooseSeatWarning: "Hãy chọn ít nhất một ghế trước khi tiếp tục.",
    invalidGapTitle: "Không thể để ghế lẻ",
    invalidGapText: "Lựa chọn này đang chừa một ghế trống không phù hợp",
    concessionOptional:
      "Bắp và nước là tùy chọn. Khách hàng có thể bỏ qua bước này.",
    promoOptional:
      "Khuyến mãi là tùy chọn. Nhập mã code hoặc chọn voucher có sẵn.",
    enterPromo: "Nhập mã khuyến mãi",
    memberPromos: "Mã khuyến mãi có sẵn",
    apply: "Áp dụng",
    confirmPromo: "Xác nhận áp mã",
    skipPromo: "Bỏ qua khuyến mãi",
    invalidPromo: "Mã khuyến mãi không hợp lệ.",
    choosePromo: "Hãy chọn một mã khuyến mãi trước.",
    appliedPromo: (code: string) => `Đã áp dụng mã ${code}.`,
    skippedPromo: "Đã bỏ qua bước khuyến mãi.",
    scanToPay: "Quét mã QR để thanh toán",
    qrPlaceholder: "Khung mã QR",
    qrDescription:
      "Sử dụng App Ngân hàng hoặc Ví điện tử (Momo, VNPay...) để quét và thanh toán.",
    amount: "Số tiền",
    markPaid: "Tôi đã thanh toán xong",
    paymentConfirmed: "Đã xác nhận thanh toán",
    finishPayment: "Hoàn tất thanh toán",
    eTicket: "Vé điện tử",
    ticketNo: "Mã vé",
    cinema: "Rạp",
    showtime: "Suất chiếu",
    seat: "Ghế",
    room: "Phòng chiếu",
    paid: "Đã thanh toán",
    seatSubtotal: "Tiền vé",
    concessionTotal: "Bắp nước",
    discount: "Giảm giá",
    grandTotal: "Tổng cộng",
    next: "Tiếp tục",
    back: "Quay lại",
    ticketReady:
      "Thanh toán hoàn tất! Vé điện tử sẽ được gửi về email của quý khách và hiển thị chi tiết bên dưới.",
  };
}
