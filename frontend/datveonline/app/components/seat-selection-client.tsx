"use client";

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CreditCardOutlined,
  HeartOutlined,
  ApiOutlined,
} from "@ant-design/icons";
import { Alert, Button, Card, Col, Divider, Row, Space, Tag, Typography } from "antd";
import { MovieItem } from "../data/cgv-template";
import { useDictionary, useLocale } from "./locale-provider";
import { useMemo, useState } from "react";

const rows = ["A", "B", "C", "D", "E", "F", "G"];
const cols = [1, 2, 3, 4, 5, 6, 7, 8];
const COUPLE_PRICE = 180000;
const STANDARD_PRICE = 110000;
const SOLD_SEATS = new Set(["A4", "B4", "C4", "D4", "E4", "F4"]);

export function SeatSelectionClient({
  movie,
  selectedTime,
}: {
  movie: MovieItem;
  selectedCinemaId?: string;
  selectedTime?: string;
}) {
  const locale = useLocale();
  const dictionary = useDictionary();
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [seatWarning, setSeatWarning] = useState<string | null>(null);
  const invalidGapTitle = locale === "vi" ? "Khong the de ghe le" : "Invalid seat gap";
  const invalidGapText =
    locale === "vi"
      ? "Lua chon nay dang chua mot ghe trong khong phu hop"
      : "This selection leaves an isolated empty seat";

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

  const subtotal = selectedSeats.reduce((total, seat) => {
    const isCoupleSeat = seat.startsWith("G") && Number(seat.slice(1)) >= 3 && Number(seat.slice(1)) <= 6;
    return total + (isCoupleSeat ? COUPLE_PRICE : STANDARD_PRICE);
  }, 0);

  function toggleSeat(seat: string) {
    const nextSelectedSeats = selectedSeats.includes(seat)
      ? selectedSeats.filter((item) => item !== seat)
      : [...selectedSeats, seat];

    const validationMessage = validateOrphanSeat(nextSelectedSeats);
    if (validationMessage) {
      setSeatWarning(
        `${invalidGapText}: ${validationMessage}`,
      );
      return;
    }

    setSeatWarning(null);
    setSelectedSeats(nextSelectedSeats.sort(compareSeatCode));
  }

  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={16}>
        <Card bordered={false} className="cinema-paper rounded-[28px]">
          <Space direction="vertical" size={18} className="w-full">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <Typography.Title level={2} style={{ margin: 0, color: "#4a3426" }}>
                  {dictionary.seatSelection.title}
                </Typography.Title>
                <Typography.Paragraph style={{ color: "#6d5a46", margin: "8px 0 0" }}>
                  {movie.title} | {selectedTime || (locale === "vi" ? "Chờ lịch chiếu từ API" : "Waiting for API showtime")}
                </Typography.Paragraph>
              </div>
              <Tag color="red">{dictionary.seatSelection.seatMapTag}</Tag>
            </div>

            <Alert
              type="info"
              showIcon
              icon={<ApiOutlined />}
              message={dictionary.seatSelection.integrationTitle}
              description={dictionary.seatSelection.integrationDescription}
            />

            {seatWarning ? (
              <Alert
                type="warning"
                showIcon
                message={invalidGapTitle}
                description={seatWarning}
              />
            ) : null}

            <div className="rounded-[24px] border border-[#ead8c1] bg-[#fffaf4] p-5">
              <div className="mx-auto mb-8 max-w-[540px] rounded-full bg-[#4a3426] px-8 py-3 text-center font-semibold text-white shadow-[0_12px_30px_rgba(74,52,38,0.18)]">
                {dictionary.seatSelection.screen}
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
                            className={`h-11 rounded-xl border text-xs font-semibold opacity-90 ${
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
                {dictionary.seatSelection.available}
              </Tag>
              <Tag icon={<CloseCircleOutlined />} color="default">
                {dictionary.seatSelection.sold}
              </Tag>
              <Tag icon={<HeartOutlined />} color="gold">
                {dictionary.seatSelection.couple}
              </Tag>
            </Space>
          </Space>
        </Card>
      </Col>

      <Col xs={24} lg={8}>
        <Space direction="vertical" size={24} className="w-full">
          <Card bordered={false} className="cinema-paper rounded-[28px]">
            <Typography.Title level={4} style={{ marginTop: 0, color: "#4a3426" }}>
              {dictionary.seatSelection.summary}
            </Typography.Title>
            <Space direction="vertical" size={10} className="w-full">
              <Typography.Text strong>{movie.title}</Typography.Text>
              <Typography.Text>{selectedTime || dictionary.seatSelection.noneSelected}</Typography.Text>
              <Divider style={{ margin: "6px 0" }} />
              <Typography.Text>
                {dictionary.seatSelection.selectedSeats}:{" "}
                {selectedSeats.length > 0 ? selectedSeats.join(", ") : dictionary.seatSelection.noneSelected}
              </Typography.Text>
              <Typography.Text>
                {dictionary.seatSelection.subtotal}: {subtotal > 0 ? formatCurrency(subtotal, locale) : "--"}
              </Typography.Text>
              <Typography.Text style={{ color: "#8c6b45" }}>
                {dictionary.seatSelection.seatStatusNote}
              </Typography.Text>
            </Space>
            <Button
              className="mt-5"
              block
              size="large"
              type="primary"
              icon={<CreditCardOutlined />}
              disabled={selectedSeats.length === 0}
            >
              {selectedSeats.length === 0
                ? dictionary.seatSelection.chooseSeatWarning
                : dictionary.seatSelection.continuePayment}
            </Button>
          </Card>
        </Space>
      </Col>
    </Row>
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

function formatCurrency(value: number, locale: "vi" | "en") {
  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US").format(value) + "d";
}
