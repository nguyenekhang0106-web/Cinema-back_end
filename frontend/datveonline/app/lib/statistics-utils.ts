// Utility functions for exporting statistics data

interface ExportData {
  dateRange: string;
  theater: string;
  tab: string;
  htmlContent?: string;
}

/**
 * Export statistics data to Excel file
 */
export function exportToExcel(data: ExportData) {
  try {
    // Create a simple CSV format that can be opened in Excel
    const timestamp = new Date().toLocaleString("vi-VN");
    const csvContent = [
      ["Báo Cáo Thống Kê Rạp Chiếu Phim"],
      [],
      ["Thời gian xuất báo cáo:", timestamp],
      ["Khoảng thời gian:", data.dateRange],
      ["Cụm rạp:", data.theater],
      ["Loại thống kê:", data.tab],
      [],
      ["Ghi chú: Dữ liệu này là dữ liệu mô phỏng (Mock Data)"],
      ["Để có dữ liệu thực tế, vui lòng kết nối với backend API"],
    ]
      .map((row) => row.join(","))
      .join("\n");

    // Create a blob and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `thong-ke-${Date.now()}.csv`);
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
 * Note: This is a simplified version that opens print dialog
 * For production, use libraries like jsPDF or html2pdf
 */
export function exportToPDF(data: ExportData) {
  try {
    const timestamp = new Date().toLocaleString("vi-VN");
    const printWindow = window.open("", "", "height=600,width=800");

    if (printWindow) {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Báo Cáo Thống Kê</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 20px;
                color: #333;
              }
              h1 {
                color: #1890ff;
                text-align: center;
                border-bottom: 2px solid #1890ff;
                padding-bottom: 10px;
              }
              .info {
                background-color: #f5f5f5;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
              }
              .info-row {
                display: flex;
                justify-content: space-between;
                margin: 8px 0;
              }
              .info-label {
                font-weight: bold;
                color: #1890ff;
              }
              .content {
                margin-top: 30px;
              }
              .note {
                background-color: #fffbe6;
                padding: 10px;
                border-left: 4px solid #faad14;
                margin-top: 20px;
              }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            <h1>📊 Báo Cáo Thống Kê Rạp Chiếu Phim</h1>
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
            <div class="note">
              <strong>📝 Ghi chú:</strong> Báo cáo này chứa dữ liệu mô phỏng. 
              Để có dữ liệu thực tế, vui lòng kết nối với backend API.
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Trigger print dialog after content loads
      setTimeout(() => {
        printWindow.print();
      }, 250);
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
    revenue: "💰 Thống Kê Doanh Thu",
    movie: "🎬 Hiệu Suất Phim",
    user: "👥 Thống Kê Người Dùng",
    theater: "🏢 Thống Kê Rạp & Phòng Chiếu",
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
