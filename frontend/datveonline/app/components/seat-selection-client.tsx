"use client";

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CreditCardOutlined,
  GiftOutlined,
  HeartOutlined,
  QrcodeOutlined,
  ShoppingCartOutlined,
  TagOutlined,
  TagsOutlined,
} from "@ant-design/icons";
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
  message
} from "antd";
import { useLocale } from "./locale-provider";
import { useId, useMemo, useState, useEffect } from "react";
import dayjs from "dayjs";

const concessions = [
  { id: "popcorn", nameVi: "Bắp rang bơ lớn", nameEn: "Large butter popcorn", price: 69000 },
  { id: "cola", nameVi: "Nước ngọt lớn", nameEn: "Large soft drink", price: 45000 },
  { id: "combo", nameVi: "Combo bắp + 2 nước", nameEn: "Popcorn + 2 drinks combo", price: 129000 },
  { id: "nachos", nameVi: "Nachos phô mai", nameEn: "Cheese nachos", price: 59000 },
];

const memberPromos = [
  {
    id: "member10",
    code: "KCTMEMBER10",
    labelVi: "Giảm 10% cho thành viên",
    labelEn: "10% member discount",
    type: "percent",
    value: 10,
  },
  {
    id: "combo20",
    code: "COMBO20K",
    labelVi: "Giảm 20.000đ cho đơn có bắp nước",
    labelEn: "20,000d off orders with concessions",
    type: "fixed",
    value: 20000,
  },
] as const;

type Promo = (typeof memberPromos)[number] | null;

export function SeatSelectionClient({
  showtimeId
}: {
  showtimeId: string;
}) {
  const locale = useLocale();
  
  // --- STATE DỮ LIỆU TỪ API ---
  const [loading, setLoading] = useState(true);
  const [showtime, setShowtime] = useState<any>(null);
  const [movie, setMovie] = useState<any>(null);
  const [hallInfo, setHallInfo] = useState<any>(null); // 🔥 THÊM STATE LƯU THÔNG TIN PHÒNG & RẠP
  const [dynamicSeats, setDynamicSeats] = useState<any[]>([]);

  // --- STATE WIZARD ---
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [seatWarning, setSeatWarning] = useState<string | null>(null);
  const [snackQuantities, setSnackQuantities] = useState<Record<string, number>>({});
  const [promoCode, setPromoCode] = useState("");
  const [selectedMemberPromo, setSelectedMemberPromo] = useState<string | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<Promo>(null);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [paymentDone, setPaymentDone] = useState(false);
  const bookingId = useId();

  const copy = getBookingCopy(locale);

  // --- 1. FETCH API ---
  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        // Lấy Suất chiếu
        const stRes = await fetch(`http://localhost:9090/cinema/showtimes/${showtimeId}`);
        if (!stRes.ok) throw new Error("Không tìm thấy suất chiếu");
        const stData = await stRes.json();
        const showtimeInfo = stData.result;
        setShowtime(showtimeInfo);

        // Lấy Phim
        const movieRes = await fetch(`http://localhost:9090/cinema/movies/${showtimeInfo.movieId}`);
        const movieData = await movieRes.json();
        setMovie(movieData.result);

        // 🔥 Lấy chi tiết Phòng Chiếu (để lấy tên Phòng và tên Rạp)
        const hallRes = await fetch(`http://localhost:9090/cinema/halls/${showtimeInfo.hallId}`);
        const hallData = await hallRes.json();
        setHallInfo(hallData.result);

        // Lấy Ghế
        const seatsRes = await fetch(`http://localhost:9090/cinema/seats/hall/${showtimeInfo.hallId}`);
        const seatsData = await seatsRes.json();
        setDynamicSeats(seatsData.result || []);

      } catch (error) {
        message.error("Lỗi khi tải dữ liệu rạp!");
      } finally {
        setLoading(false);
      }
    };

    if (showtimeId) fetchBookingDetails();
  }, [showtimeId]);

  // --- 2. XỬ LÝ DỮ LIỆU ĐỘNG ---
  // 🔥 Lấy thông tin Tên Rạp và Tên Phòng chiếu từ HallInfo
  const cinemaName = hallInfo?.cinemaName || "KCT Cinema";
  const roomName = hallInfo?.name || "Đang cập nhật...";
  const showtimeStr = showtime ? dayjs(showtime.startTime).format("DD/MM/YYYY - HH:mm") : "";

  // Lấy danh sách tên Hàng (A, B, C...)
  const dynamicRows = useMemo(() => {
    return Array.from(new Set(dynamicSeats.map(s => s.rowName))).sort();
  }, [dynamicSeats]);

  // Map dữ liệu API vào cấu trúc UI
  const seatMap = useMemo(() => {
    return dynamicSeats.map(s => {
      let type = 'normal';
      if (s.type === 'VIP') type = 'vip';
      if (s.type === 'SWEETBOX') type = 'couple';
      
      return {
        id: s.id,
        seat: `${s.rowName}${s.number}`,
        row: s.rowName,
        col: s.number,
        type: type,
        sold: s.status === 'SOLD' || s.status === 'BROKEN',
        rawSeat: s
      };
    });
  }, [dynamicSeats]);

  // Tính tiền ghế (Động theo giá BasePrice từ DB)
  const seatSubtotal = useMemo(() => {
    if (!showtime) return 0;
    return selectedSeats.reduce((total, seatCode) => {
      const seatObj = seatMap.find(s => s.seat === seatCode);
      if (!seatObj) return total;
      
      let price = showtime.basePrice;
      if (seatObj.rawSeat.type === "VIP") price += 10000;
      if (seatObj.rawSeat.type === "SWEETBOX") price += 20000;
      return total + price;
    }, 0);
  }, [selectedSeats, seatMap, showtime]);

  // --- CÁC HÀM XỬ LÝ KHÁC ---
  const snackTotal = concessions.reduce(
    (total, item) => total + item.price * (snackQuantities[item.id] ?? 0),
    0,
  );
  const discount = calculateDiscount(appliedPromo, seatSubtotal + snackTotal, snackTotal);
  const grandTotal = Math.max(0, seatSubtotal + snackTotal - discount);
  const selectedConcessions = concessions.filter((item) => (snackQuantities[item.id] ?? 0) > 0);
  const orderCode = `KCT-${bookingId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}`;

  function toggleSeat(seat: string) {
    const nextSelectedSeats = selectedSeats.includes(seat)
      ? selectedSeats.filter((item) => item !== seat)
      : [...selectedSeats, seat];

    if (nextSelectedSeats.length > 8) {
        setSeatWarning("Chỉ được chọn tối đa 8 ghế trong 1 lần giao dịch!");
        return;
    }

    const validationMessage = validateOrphanSeat(nextSelectedSeats, seatMap, dynamicRows);
    if (validationMessage) {
      setSeatWarning(`${copy.invalidGapText}: ${validationMessage}`);
      return;
    }

    setSeatWarning(null);
    setSelectedSeats(nextSelectedSeats.sort(compareSeatCode));
  }

  function goNext() {
    if (currentStep === 0 && selectedSeats.length === 0) {
      setSeatWarning(copy.chooseSeatWarning);
      return;
    }
    if (currentStep === 3 && !paymentDone) return;
    setCurrentStep((step) => Math.min(step + 1, 4));
  }

  function goBack() {
    setCurrentStep((step) => Math.max(step - 1, 0));
  }

  function updateSnackQuantity(id: string, value: number | null) {
    setSnackQuantities((current) => ({ ...current, [id]: value ?? 0 }));
  }

  function applyTypedPromo() {
    const normalized = promoCode.trim().toUpperCase();
    const promo = memberPromos.find((item) => item.code === normalized);
    if (!promo) { setPromoMessage(copy.invalidPromo); return; }
    setAppliedPromo(promo); setSelectedMemberPromo(promo.id); setPromoMessage(copy.appliedPromo(promo.code));
  }

  function applyMemberPromo() {
    const promo = memberPromos.find((item) => item.id === selectedMemberPromo);
    if (!promo) { setPromoMessage(copy.choosePromo); return; }
    setAppliedPromo(promo); setPromoCode(promo.code); setPromoMessage(copy.appliedPromo(promo.code));
  }

  const stepItems = [
    { title: copy.seats, icon: <TagsOutlined /> },
    { title: copy.concessions, icon: <ShoppingCartOutlined /> },
    { title: copy.promo, icon: <GiftOutlined /> },
    { title: copy.payment, icon: <QrcodeOutlined /> },
    { title: copy.tickets, icon: <CheckCircleOutlined /> },
  ];

  if (loading) return <div className="flex justify-center items-center py-20"><Spin size="large" tip="Đang tải dữ liệu rạp..." /></div>;
  if (!movie || !showtime) return <div className="text-center py-20 text-red-500">Suất chiếu không tồn tại hoặc đã bị hủy!</div>;

  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={17}>
        <Card bordered={false} className="cinema-paper rounded-[24px]">
          <Space direction="vertical" size={22} className="w-full">
            <Steps current={currentStep} items={stepItems} responsive />

            {currentStep === 0 ? (
              <SeatStep
                copy={copy}
                seatMap={seatMap}
                dynamicRows={dynamicRows}
                selectedSeats={selectedSeats}
                seatWarning={seatWarning}
                toggleSeat={toggleSeat}
              />
            ) : null}

            {currentStep === 1 ? (
              <ConcessionStep copy={copy} locale={locale} snackQuantities={snackQuantities} updateSnackQuantity={updateSnackQuantity} />
            ) : null}

            {currentStep === 2 ? (
              <PromoStep
                copy={copy} locale={locale} promoCode={promoCode} setPromoCode={setPromoCode} selectedMemberPromo={selectedMemberPromo} setSelectedMemberPromo={setSelectedMemberPromo} appliedPromo={appliedPromo} promoMessage={promoMessage} applyTypedPromo={applyTypedPromo} applyMemberPromo={applyMemberPromo}
                skipPromo={() => { setAppliedPromo(null); setPromoMessage(copy.skippedPromo); }}
              />
            ) : null}

            {currentStep === 3 ? (
              <PaymentStep copy={copy} orderCode={orderCode} grandTotal={grandTotal} paymentDone={paymentDone} setPaymentDone={setPaymentDone} />
            ) : null}

            {currentStep === 4 ? (
              <TicketStep copy={copy} movie={movie} cinemaName={cinemaName} roomName={roomName} showtime={showtimeStr} selectedSeats={selectedSeats} orderCode={orderCode} appliedPromo={appliedPromo} grandTotal={grandTotal} />
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between pt-4 border-t border-gray-100">
              <Button size="large" disabled={currentStep === 0} onClick={goBack}>
                {copy.back}
              </Button>
              {currentStep < 4 ? (
                <Button
                  size="large" type="primary" icon={currentStep === 3 ? <CheckCircleOutlined /> : <CreditCardOutlined />}
                  disabled={(currentStep === 0 && selectedSeats.length === 0) || (currentStep === 3 && !paymentDone)}
                  onClick={goNext}
                  className="bg-[#a61d24]"
                >
                  {currentStep === 3 ? copy.finishPayment : copy.next}
                </Button>
              ) : null}
            </div>
          </Space>
        </Card>
      </Col>

      <Col xs={24} lg={7}>
        <OrderSummary
          copy={copy} locale={locale} movie={movie} cinemaName={cinemaName} roomName={roomName} showtime={showtimeStr} showtimeFormat={showtime?.format} selectedSeats={selectedSeats} seatSubtotal={seatSubtotal} selectedConcessions={selectedConcessions} snackQuantities={snackQuantities} snackTotal={snackTotal} appliedPromo={appliedPromo} discount={discount} grandTotal={grandTotal}
        />
      </Col>
    </Row>
  );
}

// --- SUB COMPONENTS ---

function SeatStep({
  copy, seatMap, dynamicRows, selectedSeats, seatWarning, toggleSeat,
}: {
  copy: ReturnType<typeof getBookingCopy>;
  seatMap: Array<{ seat: string; row: string; col: number; type: string; sold: boolean }>;
  dynamicRows: string[];
  selectedSeats: string[];
  seatWarning: string | null;
  toggleSeat: (seat: string) => void;
}) {
  return (
    <Space direction="vertical" size={18} className="w-full">
      {seatWarning ? <Alert type="warning" showIcon message={copy.invalidGapTitle} description={seatWarning} /> : null}
      
      <div className="w-full overflow-x-auto rounded-[20px] border border-[#ead8c1] shadow-sm">
        <div className="bg-[#fffaf4] p-4 sm:p-8 min-w-max flex flex-col items-center">
          <div className="mb-12 w-[80%] min-w-[400px] rounded-t-[100%] border-b-4 border-gray-400 bg-[#4a3426] px-8 py-2 text-center font-semibold text-white shadow-[0_12px_30px_rgba(74,52,38,0.18)]">
            {copy.screen}
          </div>

          <div className="flex flex-col gap-3 items-center">
            {dynamicRows.map((row) => {
              const rowSeats = seatMap.filter(s => s.row === row).sort((a,b) => a.col - b.col);
              return (
                <div key={row} className="flex items-center justify-center gap-4 flex-nowrap">
                  <span className="w-6 font-bold text-center text-[#8c6b45] shrink-0">{row}</span>
                  <div className="flex gap-2 flex-nowrap">
                    {rowSeats.map((seatObj) => {
                      const isSelected = selectedSeats.includes(seatObj.seat);
                      
                      let seatClass = "border-[#e2d1bb] bg-white text-[#4a3426] hover:border-[#a61d24]";
                      if (seatObj.sold) seatClass = "cursor-not-allowed border-transparent bg-slate-300 text-slate-500 line-through";
                      else if (isSelected) seatClass = "border-[#a61d24] bg-[#a61d24] text-white shadow-[0_10px_20px_rgba(166,29,36,0.18)] transform scale-110";
                      else if (seatObj.type === "vip") seatClass = "border-[#a61d24] bg-white text-[#a61d24] font-semibold";
                      else if (seatObj.type === "couple") seatClass = "border-[#c89a2b] bg-[#fff7e0] text-[#8c6b45] hover:border-[#b8861c] w-14";

                      return (
                        <button
                          key={seatObj.seat}
                          type="button"
                          disabled={seatObj.sold}
                          onClick={() => toggleSeat(seatObj.seat)}
                          className={`h-9 w-9 shrink-0 rounded-t-lg border-2 text-[10px] transition-all ${seatClass}`}
                        >
                          {seatObj.seat}
                        </button>
                      );
                    })}
                  </div>
                  <span className="w-6 font-bold text-center text-[#8c6b45] shrink-0">{row}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="flex justify-center gap-4 sm:gap-6 p-4 bg-gray-50 rounded-xl border border-gray-100 flex-wrap mt-4">
          <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-t-md border-2 border-gray-300 bg-white"></div><span className="text-xs font-semibold">Ghế Thường</span></div>
          <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-t-md border-2 border-[#a61d24] bg-white"></div><span className="text-xs font-semibold text-[#a61d24]">Ghế VIP</span></div>
          <div className="flex items-center gap-2"><div className="w-10 h-5 rounded-t-md border-2 border-[#c89a2b] bg-[#fff7e0]"></div><span className="text-xs font-semibold text-[#8c6b45]">Couple</span></div>
          <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-t-md border-2 border-transparent bg-[#a61d24]"></div><span className="text-xs font-semibold text-gray-800">Đang Chọn</span></div>
          <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-t-md border-2 border-gray-300 bg-slate-300"></div><span className="text-xs font-semibold text-gray-400">Đã bán</span></div>
      </div>
    </Space>
  );
}

function ConcessionStep({ copy, locale, snackQuantities, updateSnackQuantity }: any) {
  return (
    <Space direction="vertical" size={16} className="w-full">
      <Alert type="info" showIcon message={copy.concessionOptional} />
      <Row gutter={[16, 16]}>
        {concessions.map((item) => (
          <Col xs={24} md={12} key={item.id}>
            <div className="flex h-full gap-4 rounded-[16px] border border-[#ead8c1] bg-[#fffaf4] p-4">
              <div className="flex aspect-square w-24 shrink-0 items-center justify-center rounded-[14px] border border-dashed border-[#c89a2b] bg-white text-center text-xs font-semibold uppercase tracking-wide text-[#8c6b45]">
                {copy.imageSlot}
              </div>
              <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
                <div className="min-w-0">
                  <Typography.Text strong>{locale === "vi" ? item.nameVi : item.nameEn}</Typography.Text>
                  <div className="mt-1 text-sm text-[#8c6b45]">{formatCurrency(item.price, locale)}</div>
                </div>
                <InputNumber min={0} max={9} value={snackQuantities[item.id] ?? 0} onChange={(value) => updateSnackQuantity(item.id, value)} />
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </Space>
  );
}

function PromoStep({ copy, locale, promoCode, setPromoCode, selectedMemberPromo, setSelectedMemberPromo, appliedPromo, promoMessage, applyTypedPromo, applyMemberPromo, skipPromo }: any) {
  return (
    <Space direction="vertical" size={18} className="w-full">
      <Alert type="info" showIcon message={copy.promoOptional} />
      <div className="rounded-[16px] border border-[#ead8c1] bg-[#fffaf4] p-4">
        <Typography.Title level={4} style={{ marginTop: 0, color: "#4a3426" }}>{copy.enterPromo}</Typography.Title>
        <Space.Compact className="w-full">
          <Input size="large" value={promoCode} onChange={(event) => setPromoCode(event.target.value)} placeholder="KCTMEMBER10" />
          <Button size="large" type="primary" icon={<TagOutlined />} onClick={applyTypedPromo} className="bg-[#a61d24] border-none">{copy.apply}</Button>
        </Space.Compact>
      </div>

      <div className="rounded-[16px] border border-[#ead8c1] bg-[#fffaf4] p-4">
        <Typography.Title level={4} style={{ marginTop: 0, color: "#4a3426" }}>{copy.memberPromos}</Typography.Title>
        <Radio.Group value={selectedMemberPromo} onChange={(event) => setSelectedMemberPromo(event.target.value)}>
          <Space direction="vertical">
            {memberPromos.map((promo) => (
              <Radio key={promo.id} value={promo.id}>
                <strong>{promo.code}</strong> - {locale === "vi" ? promo.labelVi : promo.labelEn}
              </Radio>
            ))}
          </Space>
        </Radio.Group>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="primary" onClick={applyMemberPromo} className="bg-[#a61d24]">{copy.confirmPromo}</Button>
          <Button onClick={skipPromo}>{copy.skipPromo}</Button>
        </div>
      </div>
      {promoMessage && <Alert type={appliedPromo ? "success" : "warning"} showIcon message={promoMessage} />}
    </Space>
  );
}

function PaymentStep({ copy, orderCode, grandTotal, paymentDone, setPaymentDone }: any) {
  return (
    <Row gutter={[20, 20]} align="middle">
      <Col xs={24} md={12}>
        <div className="mx-auto flex aspect-square max-w-[320px] items-center justify-center rounded-[20px] border-2 border-dashed border-[#a61d24] bg-white p-8">
          <div className="text-center">
            <QrcodeOutlined style={{ fontSize: 96, color: "#4a3426" }} />
            <Typography.Title level={4} style={{ color: "#4a3426" }}>{copy.qrPlaceholder}</Typography.Title>
            <Typography.Text type="secondary">{orderCode}</Typography.Text>
          </div>
        </div>
      </Col>
      <Col xs={24} md={12}>
        <Space direction="vertical" size={16} className="w-full">
          <Typography.Title level={3} style={{ margin: 0, color: "#4a3426" }}>{copy.scanToPay}</Typography.Title>
          <Typography.Text>{copy.qrDescription}</Typography.Text>
          <div className="rounded-[16px] bg-[#fffaf4] p-4">
            <Typography.Text>{copy.amount}</Typography.Text>
            <Typography.Title level={2} style={{ margin: 0, color: "#a61d24" }}>{formatCurrency(grandTotal, "vi")}</Typography.Title>
          </div>
          <Button size="large" type={paymentDone ? "default" : "primary"} icon={<CheckCircleOutlined />} onClick={() => setPaymentDone(true)} className={paymentDone ? "" : "bg-[#a61d24]"}>
            {paymentDone ? copy.paymentConfirmed : copy.markPaid}
          </Button>
        </Space>
      </Col>
    </Row>
  );
}

function TicketStep({ copy, movie, cinemaName, roomName, showtime, selectedSeats, orderCode, appliedPromo, grandTotal }: any) {
  return (
    <Space direction="vertical" size={18} className="w-full">
      <Alert type="success" showIcon message={copy.ticketReady} />
      <Row gutter={[16, 16]}>
        {selectedSeats.map((seat: string, index: number) => (
          <Col xs={24} md={12} key={seat}>
            <div className="overflow-hidden rounded-[18px] border border-[#ead8c1] bg-white shadow-[0_12px_30px_rgba(74,52,38,0.08)]">
              <div className="bg-[#4a3426] px-5 py-4 text-white">
                <Typography.Text style={{ color: "white" }}>{copy.eTicket}</Typography.Text>
                <Typography.Title level={4} style={{ margin: "4px 0 0", color: "white" }}>{movie.title}</Typography.Title>
              </div>
              <div className="space-y-3 p-5">
                <TicketLine label={copy.ticketNo} value={`${orderCode}-${index + 1}`} />
                <TicketLine label={copy.cinema} value={cinemaName} />
                <TicketLine label={copy.room} value={roomName} />
                <TicketLine label={copy.showtime} value={showtime} />
                <TicketLine label={copy.seat} value={seat} />
                {appliedPromo && <TicketLine label={copy.promo} value={appliedPromo.code} />}
                <Divider style={{ margin: "10px 0" }} />
                <div className="flex items-center justify-between">
                  <Typography.Text strong>{copy.paid}</Typography.Text>
                  <Typography.Text strong style={{ color: "#a61d24" }}>
                    {formatCurrency(Math.round(grandTotal / selectedSeats.length), "vi")}
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
      <Typography.Text strong className="text-right">{value}</Typography.Text>
    </div>
  );
}

const formatDisplayMap: Record<string, string> = {
  TWO_D: "2D",
  THREE_D: "3D",
  IMAX: "IMAX",
  FOUR_DX: "4DX"
};

function OrderSummary({ copy, locale, movie, cinemaName, roomName, showtime, showtimeFormat, selectedSeats, seatSubtotal, selectedConcessions, snackQuantities, snackTotal, appliedPromo, discount, grandTotal }: any) {
  return (
    <Card bordered={false} className="cinema-paper sticky top-4 rounded-[24px]">
      <Space direction="vertical" size={16} className="w-full">
        
        <div className="flex gap-4">
          <div className="w-24 shrink-0 rounded-lg overflow-hidden shadow-sm border border-gray-200">
            <img src={movie?.posterUrl || "https://via.placeholder.com/150x220"} alt={movie?.title} className="w-full h-auto object-cover aspect-[2/3]" />
          </div>
          
          <div className="flex flex-col gap-1 text-sm">
            <Typography.Text strong className="text-base text-[#4a3426] uppercase leading-tight">
              {movie?.title}
            </Typography.Text>
            
            {showtimeFormat && (
              <span className="text-[10px] font-bold text-gray-500 border border-gray-300 px-1.5 py-0.5 rounded inline-block w-fit mt-0.5 mb-1 bg-gray-50">
                {formatDisplayMap[showtimeFormat] || showtimeFormat}
              </span>
            )}
            
            <Typography.Text className="text-[13px]">
              <span className="text-gray-500">{copy.cinema}:</span> <strong>{cinemaName}</strong>
            </Typography.Text>
            <Typography.Text className="text-[13px]">
              <span className="text-gray-500">{copy.room}:</span> <strong>{roomName}</strong>
            </Typography.Text>
            <Typography.Text className="text-[13px]">
              <span className="text-gray-500">{copy.showtime}:</span> <strong className="text-[#a61d24]">{showtime}</strong>
            </Typography.Text>
          </div>
        </div>

        <Divider style={{ margin: "0" }} />
        
        <div className="flex flex-col">
          <Typography.Text className="text-gray-500 text-sm mb-1">{copy.selectedSeats}:</Typography.Text>
          <div className="flex flex-wrap gap-1">
            {selectedSeats.length > 0 ? (
              selectedSeats.map((seat: string) => (
                <span key={seat} className="bg-[#a61d24] text-white px-2 py-0.5 rounded text-xs font-bold">
                  {seat}
                </span>
              ))
            ) : (
              <Typography.Text strong>{copy.noneSelected}</Typography.Text>
            )}
          </div>
        </div>

        <Divider style={{ margin: "0" }} />
        
        <SummaryRow label={copy.seatSubtotal} value={formatCurrency(seatSubtotal, locale)} />
        {selectedConcessions.map((item: any) => (
          <SummaryRow key={item.id} label={`${locale === "vi" ? item.nameVi : item.nameEn} x${snackQuantities[item.id] ?? 0}`} value={formatCurrency(item.price * (snackQuantities[item.id] ?? 0), locale)} />
        ))}
        <SummaryRow label={copy.concessionTotal} value={formatCurrency(snackTotal, locale)} />
        <SummaryRow label={copy.discount} value={`-${formatCurrency(discount, locale)}`} />
        {appliedPromo && <Tag color="green">{appliedPromo.code}</Tag>}
        
        <Divider style={{ margin: "0" }} />
        
        <div className="flex items-end justify-between">
          <Typography.Text strong className="text-base">{copy.grandTotal}</Typography.Text>
          <Typography.Title level={2} style={{ margin: 0, color: "#a61d24", lineHeight: 1 }}>
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
  if (left[0] === right[0]) return Number(left.slice(1)) - Number(right.slice(1));
  return left.localeCompare(right);
}

function validateOrphanSeat(selectedSeats: string[], seatMap: any[], dynamicRows: string[]) {
  for (const row of dynamicRows) {
    const rowSeats = seatMap.filter(s => s.row === row).sort((a,b) => a.col - b.col);
    const openSeatCols = rowSeats.filter(s => !s.sold && !selectedSeats.includes(s.seat)).map(s => s.col);

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
    if (streak === 1 && openSeatCols.length > 0) {
      return `${row}${openSeatCols[openSeatCols.length - 1]}`;
    }
  }
  return null;
}

function calculateDiscount(promo: Promo, subtotal: number, snackTotal: number) {
  if (!promo) return 0;
  if (promo.id === "combo20" && snackTotal === 0) return 0;
  if (promo.type === "percent") return Math.round((subtotal * promo.value) / 100);
  return Math.min(promo.value, subtotal);
}

function formatCurrency(value: number, locale: "vi" | "en") {
  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US").format(value) + "đ";
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
      concessionOptional: "Concessions are optional. You can continue without buying popcorn or drinks.",
      promoOptional: "Promotions are optional. Enter a code or choose one of your available vouchers.",
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
      qrDescription: "Place the real payment QR here when the payment gateway is connected.",
      amount: "Amount",
      markPaid: "I have completed payment",
      paymentConfirmed: "Payment confirmed",
      finishPayment: "Finish payment",
      ticketReady: "Payment completed. Tickets have been generated below.",
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
    concessionOptional: "Bắp và nước là tùy chọn. Khách hàng có thể bỏ qua bước này.",
    promoOptional: "Khuyến mãi là tùy chọn. Nhập mã code hoặc chọn voucher có sẵn.",
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
    qrDescription: "Sử dụng App Ngân hàng hoặc Ví điện tử (Momo, VNPay...) để quét và thanh toán.",
    amount: "Số tiền",
    markPaid: "Tôi đã thanh toán xong",
    paymentConfirmed: "Đã xác nhận thanh toán",
    finishPayment: "Hoàn tất thanh toán",
    ticketReady: "Thanh toán hoàn tất. Vé của khách hàng đã được tạo bên dưới.",
    eTicket: "Vé điện tử",
    ticketNo: "Mã vé",
    cinema: "Rạp",
    showtime: "Suất chiếu",
    seat: "Ghế",
    room: "Phòng chiếu", // 🔥 ĐÃ SỬA TỪ "PHÒNG" THÀNH "PHÒNG CHIẾU"
    paid: "Đã thanh toán",
    seatSubtotal: "Tiền vé",
    concessionTotal: "Bắp nước",
    discount: "Giảm giá",
    grandTotal: "Tổng cộng",
    next: "Tiếp tục",
    back: "Quay lại",
  };
}