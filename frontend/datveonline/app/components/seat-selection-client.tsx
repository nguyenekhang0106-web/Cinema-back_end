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
} from "antd";
import { MovieItem } from "../data/cgv-template";
import { useLocale } from "./locale-provider";
import { useId, useMemo, useState } from "react";

const rows = ["A", "B", "C", "D", "E", "F", "G"];
const cols = [1, 2, 3, 4, 5, 6, 7, 8];
const COUPLE_PRICE = 180000;
const STANDARD_PRICE = 110000;
const SOLD_SEATS = new Set(["A4", "B4", "C4", "D4", "E4", "F4"]);

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
    labelVi: "Giam 10% cho thanh vien",
    labelEn: "10% member discount",
    type: "percent",
    value: 10,
  },
  {
    id: "combo20",
    code: "COMBO20K",
    labelVi: "Giam 20.000d cho don co bap nuoc",
    labelEn: "20,000d off orders with concessions",
    type: "fixed",
    value: 20000,
  },
] as const;

type Promo = (typeof memberPromos)[number] | null;

export function SeatSelectionClient({
  movie,
  selectedCinemaId,
  selectedCinemaName,
  selectedTime,
}: {
  movie: MovieItem;
  selectedCinemaId?: string;
  selectedCinemaName?: string;
  selectedTime?: string;
}) {
  const locale = useLocale();
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
  const cinemaName =
    selectedCinemaName ||
    selectedCinemaId ||
    (locale === "vi" ? "KCT Cinema" : "KCT Cinema");
  const showtime = selectedTime || (locale === "vi" ? "Suat chieu dang chon" : "Selected showtime");

  const seatMap = useMemo(
    () =>
      rows.flatMap((row) =>
        cols.map((col) => {
          const seat = `${row}${col}`;
          const type = row === "G" && col >= 3 && col <= 6 ? "couple" : "normal";
          return {
            seat,
            row,
            col,
            type,
            sold: SOLD_SEATS.has(seat),
          };
        }),
      ),
    [],
  );

  const seatSubtotal = selectedSeats.reduce((total, seat) => {
    const isCoupleSeat = seat.startsWith("G") && Number(seat.slice(1)) >= 3 && Number(seat.slice(1)) <= 6;
    return total + (isCoupleSeat ? COUPLE_PRICE : STANDARD_PRICE);
  }, 0);

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

    const validationMessage = validateOrphanSeat(nextSelectedSeats);
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

    if (currentStep === 3 && !paymentDone) {
      return;
    }

    setCurrentStep((step) => Math.min(step + 1, 4));
  }

  function goBack() {
    setCurrentStep((step) => Math.max(step - 1, 0));
  }

  function updateSnackQuantity(id: string, value: number | null) {
    setSnackQuantities((current) => ({
      ...current,
      [id]: value ?? 0,
    }));
  }

  function applyTypedPromo() {
    const normalized = promoCode.trim().toUpperCase();
    const promo = memberPromos.find((item) => item.code === normalized);

    if (!promo) {
      setPromoMessage(copy.invalidPromo);
      return;
    }

    setAppliedPromo(promo);
    setSelectedMemberPromo(promo.id);
    setPromoMessage(copy.appliedPromo(promo.code));
  }

  function applyMemberPromo() {
    const promo = memberPromos.find((item) => item.id === selectedMemberPromo);
    if (!promo) {
      setPromoMessage(copy.choosePromo);
      return;
    }

    setAppliedPromo(promo);
    setPromoCode(promo.code);
    setPromoMessage(copy.appliedPromo(promo.code));
  }

  const stepItems = [
    { title: copy.seats, icon: <TagsOutlined /> },
    { title: copy.concessions, icon: <ShoppingCartOutlined /> },
    { title: copy.promo, icon: <GiftOutlined /> },
    { title: copy.payment, icon: <QrcodeOutlined /> },
    { title: copy.tickets, icon: <CheckCircleOutlined /> },
  ];

  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={17}>
        <Card bordered={false} className="cinema-paper rounded-[24px]">
          <Space direction="vertical" size={22} className="w-full">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <Typography.Title level={2} style={{ margin: 0, color: "#4a3426" }}>
                  {copy.title}
                </Typography.Title>
                <Typography.Paragraph style={{ color: "#6d5a46", margin: "8px 0 0" }}>
                  {movie.title} | {cinemaName} | {showtime}
                </Typography.Paragraph>
              </div>
              <Tag color="red">{copy.bookingFlow}</Tag>
            </div>

            <Steps current={currentStep} items={stepItems} responsive />

            {currentStep === 0 ? (
              <SeatStep
                copy={copy}
                seatMap={seatMap}
                selectedSeats={selectedSeats}
                seatWarning={seatWarning}
                toggleSeat={toggleSeat}
              />
            ) : null}

            {currentStep === 1 ? (
              <ConcessionStep
                copy={copy}
                locale={locale}
                snackQuantities={snackQuantities}
                updateSnackQuantity={updateSnackQuantity}
              />
            ) : null}

            {currentStep === 2 ? (
              <PromoStep
                copy={copy}
                locale={locale}
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
                orderCode={orderCode}
                grandTotal={grandTotal}
                paymentDone={paymentDone}
                setPaymentDone={setPaymentDone}
              />
            ) : null}

            {currentStep === 4 ? (
              <TicketStep
                copy={copy}
                movie={movie}
                cinemaName={cinemaName}
                showtime={showtime}
                selectedSeats={selectedSeats}
                orderCode={orderCode}
                appliedPromo={appliedPromo}
                grandTotal={grandTotal}
              />
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <Button size="large" disabled={currentStep === 0} onClick={goBack}>
                {copy.back}
              </Button>
              {currentStep < 4 ? (
                <Button
                  size="large"
                  type="primary"
                  icon={currentStep === 3 ? <CheckCircleOutlined /> : <CreditCardOutlined />}
                  disabled={(currentStep === 0 && selectedSeats.length === 0) || (currentStep === 3 && !paymentDone)}
                  onClick={goNext}
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
          copy={copy}
          locale={locale}
          movie={movie}
          cinemaName={cinemaName}
          showtime={showtime}
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
  selectedSeats,
  seatWarning,
  toggleSeat,
}: {
  copy: ReturnType<typeof getBookingCopy>;
  seatMap: Array<{ seat: string; type: string; sold: boolean }>;
  selectedSeats: string[];
  seatWarning: string | null;
  toggleSeat: (seat: string) => void;
}) {
  return (
    <Space direction="vertical" size={18} className="w-full">
      {seatWarning ? <Alert type="warning" showIcon message={copy.invalidGapTitle} description={seatWarning} /> : null}
      <div className="rounded-[20px] border border-[#ead8c1] bg-[#fffaf4] p-4 sm:p-5">
        <div className="mx-auto mb-8 max-w-[540px] rounded-full bg-[#4a3426] px-8 py-3 text-center font-semibold text-white shadow-[0_12px_30px_rgba(74,52,38,0.18)]">
          {copy.screen}
        </div>
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row} className="flex items-center gap-3">
              <span className="w-5 font-semibold text-[#8c6b45]">{row}</span>
              <div className="grid flex-1 grid-cols-8 gap-2">
                {cols.map((col) => {
                  const seat = `${row}${col}`;
                  const seatConfig = seatMap.find((item) => item.seat === seat);
                  const isSelected = selectedSeats.includes(seat);
                  const seatType = seatConfig?.sold ? "sold" : seatConfig?.type ?? "normal";
                  return (
                    <button
                      key={seat}
                      type="button"
                      disabled={seatType === "sold"}
                      onClick={() => toggleSeat(seat)}
                      className={`h-11 rounded-lg border text-xs font-semibold opacity-90 ${
                        seatType === "sold"
                          ? "cursor-not-allowed border-transparent bg-slate-300 text-slate-500"
                          : isSelected
                            ? "border-[#a61d24] bg-[#a61d24] text-white shadow-[0_10px_20px_rgba(166,29,36,0.18)]"
                            : seatType === "couple"
                              ? "border-[#c89a2b] bg-[#fff7e0] text-[#8c6b45] hover:border-[#b8861c]"
                              : "border-[#e2d1bb] bg-white text-[#4a3426] hover:border-[#a61d24]"
                      }`}
                    >
                      {seat}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Space wrap size={[16, 12]}>
        <Tag icon={<CheckCircleOutlined />} color="success">
          {copy.available}
        </Tag>
        <Tag icon={<CloseCircleOutlined />} color="default">
          {copy.sold}
        </Tag>
        <Tag icon={<HeartOutlined />} color="gold">
          {copy.couple}
        </Tag>
      </Space>
    </Space>
  );
}

function ConcessionStep({
  copy,
  locale,
  snackQuantities,
  updateSnackQuantity,
}: {
  copy: ReturnType<typeof getBookingCopy>;
  locale: "vi" | "en";
  snackQuantities: Record<string, number>;
  updateSnackQuantity: (id: string, value: number | null) => void;
}) {
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
                <InputNumber
                  min={0}
                  max={9}
                  value={snackQuantities[item.id] ?? 0}
                  onChange={(value) => updateSnackQuantity(item.id, value)}
                />
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </Space>
  );
}

function PromoStep({
  copy,
  locale,
  promoCode,
  setPromoCode,
  selectedMemberPromo,
  setSelectedMemberPromo,
  appliedPromo,
  promoMessage,
  applyTypedPromo,
  applyMemberPromo,
  skipPromo,
}: {
  copy: ReturnType<typeof getBookingCopy>;
  locale: "vi" | "en";
  promoCode: string;
  setPromoCode: (value: string) => void;
  selectedMemberPromo: string | null;
  setSelectedMemberPromo: (value: string | null) => void;
  appliedPromo: Promo;
  promoMessage: string | null;
  applyTypedPromo: () => void;
  applyMemberPromo: () => void;
  skipPromo: () => void;
}) {
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
            placeholder="KCTMEMBER10"
          />
          <Button size="large" type="primary" icon={<TagOutlined />} onClick={applyTypedPromo}>
            {copy.apply}
          </Button>
        </Space.Compact>
      </div>

      <div className="rounded-[16px] border border-[#ead8c1] bg-[#fffaf4] p-4">
        <Typography.Title level={4} style={{ marginTop: 0, color: "#4a3426" }}>
          {copy.memberPromos}
        </Typography.Title>
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
          <Button type="primary" onClick={applyMemberPromo}>
            {copy.confirmPromo}
          </Button>
          <Button onClick={skipPromo}>{copy.skipPromo}</Button>
        </div>
      </div>

      {promoMessage ? (
        <Alert
          type={appliedPromo ? "success" : "warning"}
          showIcon
          message={promoMessage}
        />
      ) : null}
    </Space>
  );
}

function PaymentStep({
  copy,
  orderCode,
  grandTotal,
  paymentDone,
  setPaymentDone,
}: {
  copy: ReturnType<typeof getBookingCopy>;
  orderCode: string;
  grandTotal: number;
  paymentDone: boolean;
  setPaymentDone: (value: boolean) => void;
}) {
  return (
    <Row gutter={[20, 20]} align="middle">
      <Col xs={24} md={12}>
        <div className="mx-auto flex aspect-square max-w-[320px] items-center justify-center rounded-[20px] border-2 border-dashed border-[#a61d24] bg-white p-8">
          <div className="text-center">
            <QrcodeOutlined style={{ fontSize: 96, color: "#4a3426" }} />
            <Typography.Title level={4} style={{ color: "#4a3426" }}>
              {copy.qrPlaceholder}
            </Typography.Title>
            <Typography.Text type="secondary">{orderCode}</Typography.Text>
          </div>
        </div>
      </Col>
      <Col xs={24} md={12}>
        <Space direction="vertical" size={16} className="w-full">
          <Typography.Title level={3} style={{ margin: 0, color: "#4a3426" }}>
            {copy.scanToPay}
          </Typography.Title>
          <Typography.Text>{copy.qrDescription}</Typography.Text>
          <div className="rounded-[16px] bg-[#fffaf4] p-4">
            <Typography.Text>{copy.amount}</Typography.Text>
            <Typography.Title level={2} style={{ margin: 0, color: "#a61d24" }}>
              {formatCurrency(grandTotal, "vi")}
            </Typography.Title>
          </div>
          <Button
            size="large"
            type={paymentDone ? "default" : "primary"}
            icon={<CheckCircleOutlined />}
            onClick={() => setPaymentDone(true)}
          >
            {paymentDone ? copy.paymentConfirmed : copy.markPaid}
          </Button>
        </Space>
      </Col>
    </Row>
  );
}

function TicketStep({
  copy,
  movie,
  cinemaName,
  showtime,
  selectedSeats,
  orderCode,
  appliedPromo,
  grandTotal,
}: {
  copy: ReturnType<typeof getBookingCopy>;
  movie: MovieItem;
  cinemaName: string;
  showtime: string;
  selectedSeats: string[];
  orderCode: string;
  appliedPromo: Promo;
  grandTotal: number;
}) {
  return (
    <Space direction="vertical" size={18} className="w-full">
      <Alert type="success" showIcon message={copy.ticketReady} />
      <Row gutter={[16, 16]}>
        {selectedSeats.map((seat, index) => (
          <Col xs={24} md={12} key={seat}>
            <div className="overflow-hidden rounded-[18px] border border-[#ead8c1] bg-white shadow-[0_12px_30px_rgba(74,52,38,0.08)]">
              <div className="bg-[#4a3426] px-5 py-4 text-white">
                <Typography.Text style={{ color: "white" }}>{copy.eTicket}</Typography.Text>
                <Typography.Title level={4} style={{ margin: "4px 0 0", color: "white" }}>
                  {movie.title}
                </Typography.Title>
              </div>
              <div className="space-y-3 p-5">
                <TicketLine label={copy.ticketNo} value={`${orderCode}-${index + 1}`} />
                <TicketLine label={copy.cinema} value={cinemaName} />
                <TicketLine label={copy.showtime} value={showtime} />
                <TicketLine label={copy.seat} value={seat} />
                <TicketLine label={copy.room} value="KCT 01" />
                {appliedPromo ? <TicketLine label={copy.promo} value={appliedPromo.code} /> : null}
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
      <Typography.Text strong className="text-right">
        {value}
      </Typography.Text>
    </div>
  );
}

function OrderSummary({
  copy,
  locale,
  movie,
  cinemaName,
  showtime,
  selectedSeats,
  seatSubtotal,
  selectedConcessions,
  snackQuantities,
  snackTotal,
  appliedPromo,
  discount,
  grandTotal,
}: {
  copy: ReturnType<typeof getBookingCopy>;
  locale: "vi" | "en";
  movie: MovieItem;
  cinemaName: string;
  showtime: string;
  selectedSeats: string[];
  seatSubtotal: number;
  selectedConcessions: typeof concessions;
  snackQuantities: Record<string, number>;
  snackTotal: number;
  appliedPromo: Promo;
  discount: number;
  grandTotal: number;
}) {
  return (
    <Card bordered={false} className="cinema-paper sticky top-4 rounded-[24px]">
      <Typography.Title level={4} style={{ marginTop: 0, color: "#4a3426" }}>
        {copy.summary}
      </Typography.Title>
      <Space direction="vertical" size={10} className="w-full">
        <Typography.Text strong>{movie.title}</Typography.Text>
        <Typography.Text>{cinemaName}</Typography.Text>
        <Typography.Text>
          {copy.showtime}: {showtime}
        </Typography.Text>
        <Typography.Text>
          {copy.selectedSeats}: {selectedSeats.length > 0 ? selectedSeats.join(", ") : copy.noneSelected}
        </Typography.Text>
        <Divider style={{ margin: "6px 0" }} />
        <SummaryRow label={copy.seatSubtotal} value={formatCurrency(seatSubtotal, locale)} />
        {selectedConcessions.map((item) => (
          <SummaryRow
            key={item.id}
            label={`${locale === "vi" ? item.nameVi : item.nameEn} x${snackQuantities[item.id] ?? 0}`}
            value={formatCurrency(item.price * (snackQuantities[item.id] ?? 0), locale)}
          />
        ))}
        <SummaryRow label={copy.concessionTotal} value={formatCurrency(snackTotal, locale)} />
        <SummaryRow label={copy.discount} value={`-${formatCurrency(discount, locale)}`} />
        {appliedPromo ? <Tag color="green">{appliedPromo.code}</Tag> : null}
        <Divider style={{ margin: "6px 0" }} />
        <div className="flex items-center justify-between">
          <Typography.Text strong>{copy.grandTotal}</Typography.Text>
          <Typography.Title level={4} style={{ margin: 0, color: "#a61d24" }}>
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
  if (left[0] === right[0]) {
    return Number(left.slice(1)) - Number(right.slice(1));
  }

  return left.localeCompare(right);
}

function validateOrphanSeat(selectedSeats: string[]) {
  for (const row of rows) {
    const openSeats = cols.filter((col) => {
      const seat = `${row}${col}`;
      return !SOLD_SEATS.has(seat) && !selectedSeats.includes(seat);
    });

    let streak = 0;
    for (let index = 0; index < openSeats.length; index += 1) {
      const current = openSeats[index];
      const previous = openSeats[index - 1];

      if (index === 0 || current === previous + 1) {
        streak += 1;
      } else {
        if (streak === 1) {
          return `${row}${previous}`;
        }
        streak = 1;
      }
    }

    if (streak === 1 && openSeats.length > 0) {
      return `${row}${openSeats[openSeats.length - 1]}`;
    }
  }

  return null;
}

function calculateDiscount(promo: Promo, subtotal: number, snackTotal: number) {
  if (!promo) {
    return 0;
  }

  if (promo.id === "combo20" && snackTotal === 0) {
    return 0;
  }

  if (promo.type === "percent") {
    return Math.round((subtotal * promo.value) / 100);
  }

  return Math.min(promo.value, subtotal);
}

function formatCurrency(value: number, locale: "vi" | "en") {
  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US").format(value) + "d";
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
      available: "Available",
      sold: "Sold",
      couple: "Couple seat",
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
      room: "Room",
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
    screen: "MÀN HÌNH",
    available: "Ghế trống",
    sold: "Ghế đã bán",
    couple: "Ghế đôi",
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
    qrDescription: "Đặt mã QR thanh toán thật vào khung này khi đã nối cổng thanh toán.",
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
    room: "Phòng",
    paid: "Đã thanh toán",
    seatSubtotal: "Tiền vé",
    concessionTotal: "Bắp nước",
    discount: "Giảm giá",
    grandTotal: "Tổng cộng",
    next: "Tiếp tục",
    back: "Quay lại",
  };
}
