// Utility functions for exporting statistics data

interface ExportData {
  dateRange: string;
  theater: string;
  tab: string;
  htmlContent?: string;
}

/**
 * Export statistics data to Excel file (CSV with UTF-8 BOM)
 */
export function exportToExcel(data: ExportData) {
  try {
    // 1. Thêm cờ BOM \uFEFF để Excel ép buộc đọc file theo chuẩn UTF-8 (Sửa lỗi font tiếng Việt)
    let csvContent = "\uFEFF";

    // 2. Tạo Header thông tin báo cáo
    const timestamp = new Date().toLocaleString("vi-VN");
    csvContent += "BÁO CÁO THỐNG KÊ KCT CINEMA\n\n";
    csvContent += `Thời gian xuất báo cáo:,${timestamp}\n`;
    csvContent += `Khoảng thời gian:,${data.dateRange}\n`;
    csvContent += `Cụm rạp:,${data.theater}\n`;
    csvContent += `Loại thống kê:,${getTabLabel(data.tab)}\n\n`;

    // 3. Thuật toán quét và trích xuất dữ liệu từ các Bảng HTML (Table)
    if (data.htmlContent) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(data.htmlContent, "text/html");
      const tables = doc.querySelectorAll("table");

      if (tables.length > 0) {
        tables.forEach((table, index) => {
          csvContent += `--- BẢNG DỮ LIỆU ${index + 1} ---\n`;
          const rows = table.querySelectorAll("tr");

          rows.forEach((row) => {
            const cols = row.querySelectorAll("th, td");
            const rowData: string[] = [];

            cols.forEach((col) => {
              let text = col.textContent?.trim() || "";
              // Xử lý chuỗi để không bị vỡ cột CSV (Bọc trong ngoặc kép nếu có dấu phẩy hoặc xuống dòng)
              text = text.replace(/"/g, '""');
              if (
                text.includes(",") ||
                text.includes("\n") ||
                text.includes('"')
              ) {
                text = `"${text}"`;
              }
              rowData.push(text);
            });
            csvContent += rowData.join(",") + "\n";
          });
          csvContent += "\n"; // Cách dòng giữa các bảng
        });
      } else {
        csvContent += "Không có dữ liệu dạng bảng trong tab báo cáo này.\n";
      }
    }

    // 4. Tạo file và ép trình duyệt tải xuống
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_Cao_${data.tab}_${Date.now()}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    throw error;
  }
}

/**
 * Export statistics data to PDF file
 */
export function exportToPDF(data: ExportData) {
  try {
    const timestamp = new Date().toLocaleString("vi-VN");
    const printWindow = window.open("", "", "height=800,width=1000");

    if (printWindow) {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Báo Cáo Thống Kê KCT Cinema</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 20px;
                color: #333;
              }
              h1 {
                color: #a61d24; /* Đổi sang màu đỏ KCT Cinema */
                text-align: center;
                border-bottom: 2px solid #a61d24;
                padding-bottom: 10px;
                text-transform: uppercase;
              }
              .info {
                background-color: #fcfcfc;
                padding: 15px;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                margin: 20px 0;
              }
              .info-row {
                display: flex;
                justify-content: space-between;
                margin: 8px 0;
                font-size: 14px;
              }
              .info-label {
                font-weight: bold;
                color: #a61d24;
              }
              .content {
                margin-top: 30px;
              }
              /* Xóa phần .note cũ */
              
              /* CSS Tối ưu cho bảng in */
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
              }
              th, td {
                border: 1px solid #e5e7eb;
                padding: 10px;
                text-align: left;
              }
              th {
                background-color: #fff1f0;
                color: #a61d24;
              }
              @media print {
                body { margin: 0; }
                .info { border: 1px solid #000; }
                th { background-color: #eee !important; -webkit-print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>
            <h1>Báo Cáo Thống Kê</h1>
            <div class="info">
              <div class="info-row">
                <span class="info-label">Thời gian xuất báo cáo:</span>
                <span>${timestamp}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Khoảng thời gian:</span>
                <span>${data.dateRange}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Cụm rạp:</span>
                <span>${data.theater}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Loại thống kê:</span>
                <span>${getTabLabel(data.tab)}</span>
              </div>
            </div>
            <div class="content">
              ${data.htmlContent || "<p>Không có nội dung để in</p>"}
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Trigger print dialog after content loads
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    throw error;
  }
}

/**
 * Get Vietnamese label for tab
 */
function getTabLabel(tab: string): string {
  const labels: { [key: string]: string } = {
    revenue: "Thống Kê Doanh Thu",
    movie: "Hiệu Suất Phim",
    user: "Thống Kê Người Dùng",
    theater: "Thống Kê Rạp & Phòng Chiếu",
  };
  return labels[tab] || tab;
}

/**
 * Format currency for Vietnamese locale
 */
export function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M₫`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K₫`;
  }
  return `${value}₫`;
}

/**
 * Format number with Vietnamese locale
 */
export function formatNumber(value: number): string {
  return value.toLocaleString("vi-VN");
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Get date range string
 */
export function getDateRangeString(startDate: Date, endDate: Date): string {
  const formatter = new Intl.DateTimeFormat("vi-VN");
  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
}
