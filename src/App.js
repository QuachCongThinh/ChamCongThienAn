import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import FileUpload from "./components/FileUpload/FileUpload";
import AttendanceTable from "./components/AttendanceTable/AttendanceTable";
import "./styles/main.scss";
import SplashScreen from "./components/SplashScreen/SplashScreen.jsx";

// Danh sách các khung giờ chuẩn được setup sẵn của viện
const STANDARD_SHIFTS = [
  {
    label: "6h30-11h/13h-16h30",
    startHour: 6.5,
    endHour: 16.5,
    isSplitShift: true,
  },
  {
    label: "7h-11h/13h-17h",
    startHour: 7.0,
    endHour: 17.0,
    isSplitShift: true,
  },
  { label: "7h-17h", startHour: 7.0, endHour: 17.0, isSplitShift: false },
  { label: "7h-11h", startHour: 7.0, endHour: 11.0, isSplitShift: false },
  { label: "13h-17h", startHour: 13.0, endHour: 17.0, isSplitShift: false },
  { label: "7h30-12h", startHour: 7.5, endHour: 12.0, isSplitShift: false },
  {
    label: "7h30-12h/13h-16h30",
    startHour: 7.5,
    endHour: 16.5,
    isSplitShift: true,
  },
  { label: "7h30-16h30", startHour: 7.5, endHour: 16.5, isSplitShift: false },
  { label: "11h-17h", startHour: 11.0, endHour: 17.0, isSplitShift: false },
  { label: "7h-15h", startHour: 7.0, endHour: 15.0, isSplitShift: false },
];

function App() {
  const [data, setData] = useState([]);
  const [thang, setThang] = useState("");
  const [daysInMonth, setDaysInMonth] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const startExit = setTimeout(() => {
      setIsExiting(true);
    }, 3000);

    const removeSplash = setTimeout(() => {
      setShowSplash(false);
    }, 3500);

    return () => {
      clearTimeout(startExit);
      clearTimeout(removeSplash);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Lưu lại bản sao của target để tránh lỗi React Event Pooling
    const targetInput = e.target;

    setLoading(true);
    const reader = new FileReader();

    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary", cellDates: true });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });

      // 1. Xử lý dữ liệu và cập nhật State của React trước
      processRawLogData(rawData);

      // 2. ✅ HOÃN RESET VALUE: Đợi React render xong dữ liệu mới giải phóng input
      setTimeout(() => {
        if (targetInput) {
          targetInput.value = "";
        }
        setLoading(false);
      }, 100);
    };

    reader.onerror = () => {
      if (targetInput) targetInput.value = "";
      setLoading(false);
    };

    reader.readAsBinaryString(file);
  };

  // Hàm check quan trọng
  const matchStandardShift = (hoursArray) => {
    if (!hoursArray || hoursArray.length === 0) return "";

    // 1. Lấy chính xác giờ nhỏ nhất (vào) và lớn nhất (ra) trong ngày từ log nguyên bản
    const minHour = Math.min(...hoursArray);
    const maxHour = Math.max(...hoursArray);

    const start = minHour;
    const end = maxHour;

    if (start >= end) return "";

    // 2. KIỂM TRA LÀM TRONG GIỜ TRƯA (Từ 11h01 đến 12h59 ~ 11.016 đến 12.983)
    const hasWorkDuringLunch = hoursArray.some(
      (hour) => hour >= 11.016 && hour <= 12.983,
    );

    // Hàm định dạng chuỗi giờ bảo hiểm phòng hờ
    const fmt = (dec) => {
      const h = Math.floor(dec);
      const m = Math.round((dec - h) * 60);
      if (m === 0) return `${h}h`;
      return `${h}h${m < 10 ? "0" + m : m}`;
    };

    // --- ƯU TIÊN ĐẶC BIỆT 1: ĐI SỚM TRƯỚC 7H (CA 6h30) ---
    if (start >= 6.3 && start < 7.0 && end >= 15.5) {
      return "6h30-11h/13h-16h30";
    }

    // --- ƯU TIÊN ĐẶC BIỆT 2: CA CHIỀU ĐỘC LẬP ---
    if (start >= 13.0) {
      return "13h-17h";
    }

    // --- ƯU TIÊN ĐẶC BIỆT 3: CA SÁNG MUỘN (7H30 - 12H) (MỚI THÊM) ---
    // Nếu bắt đầu sau 7h30 và kết thúc hẳn trước hoặc bằng 12h00 (Không có log chiều)
    if (start > 7.5 && end <= 12.0) {
      return "7h30-12h";
    }

    // --- ƯU TIÊN ĐẶC BIỆT 4: CA SÁNG SỚM/NGẮN VỀ TRƯỚC 11H ---
    if (end <= 11.0) {
      return "7h-11h";
    }

    // --- ƯU TIÊN ĐẶC BIỆT 5: CA LIỀN MẠCH KẾT THÚC SỚM (7H-15H) ---
    if (start >= 7.0 && end <= 15.25) {
      return "7h-15h";
    }

    // --- ƯU TIÊN ĐẶC BIỆT 6: NHÓM KHÔNG CÓ LÀM GIỜ TRƯA (Nghỉ trưa sạch) ---
    if (!hasWorkDuringLunch) {
      return "7h-11h/13h-17h";
    }

    // --- ƯU TIÊN ĐẶC BIỆT 7: NHÓM CÓ PHÁT SINH LÀM GIỜ TRƯA ---
    if (hasWorkDuringLunch) {
      // Tìm giờ quẹt cuối cùng của ca sáng (nằm trong khoảng từ 11h01 đến trước 12h05)
      const morningLogs = hoursArray.filter((h) => h >= 11.016 && h <= 12.083);
      const lastMorningLog =
        morningLogs.length > 0 ? Math.max(...morningLogs) : 0;

      // TH A: Nếu có quẹt giờ trưa nhưng giờ đó vẫn < 12h và bắt đầu sau 7h30 (Ca gãy đi cả ngày)
      if (start > 7.5 && lastMorningLog > 0 && lastMorningLog <= 12.0) {
        return "7h30-12h/13h-16h30";
      }

      // TH B: Nếu có quẹt giờ trưa xuyên suốt từ 11h - 13h (Làm full cả trưa), đi cả ngày
      if (end >= 16.0) {
        return "7h-17h";
      }
    }

    // 3. THUẬT TOÁN ĐÁNH GIÁ ĐỘ KHỚP (BEST MATCHING) CHO CÁC TRƯỜNG HỢP CÒN LẠI
    let bestShift = null;
    let minScore = Infinity;

    for (const shift of STANDARD_SHIFTS) {
      let startDiff = 0;
      if (start >= shift.startHour) {
        startDiff = (start - shift.startHour) * 0.2;
      } else {
        startDiff = shift.startHour - start;
      }

      const endDiff = Math.abs(end - shift.endHour);
      const totalScore = startDiff + endDiff;

      if (start - shift.startHour > 1.5) continue;

      if (totalScore < minScore) {
        minScore = totalScore;
        bestShift = shift;
      }
    }

    // 4. TRẢ VỀ KẾT QUẢ
    if (bestShift && minScore <= 3.0) {
      return bestShift.label;
    }

    // 5. BẢO HIỂM TỰ ĐỘNG (FALLBACK)
    if (hasWorkDuringLunch) {
      return `${fmt(start)}-${fmt(end)}`;
    } else {
      const morningHours = hoursArray.filter((h) => h <= 11.5);
      const afternoonHours = hoursArray.filter((h) => h >= 12.5);

      if (morningHours.length > 0 && afternoonHours.length > 0) {
        const p1Start = Math.min(...morningHours);
        const p1End = Math.max(...morningHours);
        const p2Start = Math.min(...afternoonHours);
        const p2End = Math.max(...afternoonHours);
        return `${fmt(p1Start)}-${fmt(p1End)}/${fmt(p2Start)}-${fmt(p2End)}`;
      }
    }

    return `${fmt(start)}-${fmt(end)}`;
  };

  const processRawLogData = (rawData) => {
    if (rawData.length <= 1) {
      setLoading(false);
      return;
    }

    const groupedData = {};
    const monthYearCounter = {};

    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length < 4) continue; // Phải có ít nhất đến cột D

      // ĐÚNG INDEX THEO FILE:
      // row[0]: STT, row[1]: Họ tên BS, row[2]: Họ tên KTV, row[3]: Ngày Làm
      const bsName = row[1] ? String(row[1]).trim() : "";
      const ktvName = row[2] ? String(row[2]).trim() : "";
      const rawDateCell = row[3];

      if (!rawDateCell) continue;

      // Trích xuất danh sách nhân sự trên dòng này (Có thể có cả BS, cả KTV hoặc chỉ 1 trong 2)
      const namesInRow = [];
      if (bsName && !bsName.startsWith("Họ Tên") && bsName !== "0")
        namesInRow.push(bsName);
      if (ktvName && !ktvName.startsWith("Họ tên") && ktvName !== "0")
        namesInRow.push(ktvName);

      if (namesInRow.length === 0) continue;

      let dayNum = null;
      let monthNum = null;
      let yearNum = null;
      let hourDecimal = null;

      // TH1: Thư viện ép kiểu thành Object Date thành công
      if (rawDateCell instanceof Date && !isNaN(rawDateCell)) {
        dayNum = rawDateCell.getDate();
        monthNum = rawDateCell.getMonth() + 1;
        yearNum = rawDateCell.getFullYear();
        hourDecimal = rawDateCell.getHours() + rawDateCell.getMinutes() / 60;
      }
      // TH2: Ô dữ liệu là chuỗi văn bản (String)
      else {
        const rawDateStr = String(rawDateCell).trim();
        let datePart = rawDateStr;
        let timePart = "";

        if (rawDateStr.includes(" ")) {
          const parts = rawDateStr.split(" ");
          datePart = parts[0];
          timePart = parts[1] + (parts[2] ? ` ${parts[2]}` : ""); // Xử lý cả đuôi AM/PM nếu có
        }

        // Phân tích ngày tháng năm (Định dạng DD/MM/YYYY)
        const dateSplit = datePart.split("/");
        dayNum = parseInt(dateSplit[0], 10);
        monthNum = parseInt(dateSplit[1], 10);
        if (dateSplit[2]) yearNum = parseInt(dateSplit[2], 10);

        // Phân tích giờ phút
        if (timePart) {
          // Xử lý định dạng 12 giờ có AM/PM (Ví dụ: 07:03:00 AM)
          let isPM = timePart.toUpperCase().includes("PM");
          let isAM = timePart.toUpperCase().includes("AM");

          let cleanTime = timePart.replace(/AM|PM/gi, "").trim();
          const [hStr, mStr] = cleanTime.split(":");
          let hour = parseInt(hStr, 10);

          if (isPM && hour < 12) hour += 12;
          if (isAM && hour === 12) hour = 0;

          hourDecimal = hour + (parseInt(mStr, 10) || 0) / 60;
        }
      }

      // Đưa dữ liệu giờ quét vào tất cả nhân sự xuất hiện ở dòng hiện tại
      if (dayNum && monthNum && yearNum && hourDecimal !== null) {
        namesInRow.forEach((fullName) => {
          if (!groupedData[fullName]) groupedData[fullName] = {};
          if (!groupedData[fullName][dayNum])
            groupedData[fullName][dayNum] = [];

          groupedData[fullName][dayNum].push(hourDecimal);
        });

        // Đếm tần suất tháng để tự động nhận diện tháng làm việc của file
        const key = `${monthNum}/${yearNum}`;
        monthYearCounter[key] = (monthYearCounter[key] || 0) + 1;
      }
    }

    // Xác định tháng/năm có mật độ bản ghi cao nhất
    let detectedMonth = 6;
    let detectedYear = 2026;
    let maxCount = 0;

    Object.keys(monthYearCounter).forEach((key) => {
      if (monthYearCounter[key] > maxCount) {
        maxCount = monthYearCounter[key];
        const [m, y] = key.split("/");
        detectedMonth = parseInt(m, 10);
        detectedYear = parseInt(y, 10);
      }
    });

    const totalDaysInMonth = new Date(detectedYear, detectedMonth, 0).getDate();
    const daysArray = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);

    setDaysInMonth(daysArray);
    setThang(`Tháng ${detectedMonth}/${detectedYear}`);

    // Đổ dữ liệu ra cấu trúc mảng cho Table
    const finalStaffList = Object.keys(groupedData).map((name, index) => {
      const schedule = {};

      daysArray.forEach((day) => {
        const hoursArray = groupedData[name][day] || [];
        if (hoursArray.length === 0) {
          schedule[day] = "";
        } else {
          schedule[day] = matchStandardShift(hoursArray);
        }
      });

      return {
        stt: index + 1,
        hoTen: name,
        schedule: schedule,
      };
    });

    // Sắp xếp danh sách tên theo thứ tự bảng chữ cái ABC cho chuyên nghiệp
    finalStaffList.sort((a, b) => a.hoTen.localeCompare(b.hoTen, "vi"));
    // Cập nhật lại số thứ tự (STT) sau khi sắp xếp
    finalStaffList.forEach((item, idx) => {
      item.stt = idx + 1;
    });

    setData(finalStaffList);
    setLoading(false);
  };

  const handleExportExcel = () => {
    if (data.length === 0) return;

    const headerRow = [
      "STT",
      "Họ và tên",
      ...daysInMonth.map((d) => `Ngày ${d}`),
    ];

    const dataRows = data.map((item) => {
      const row = [item.stt, item.hoTen];
      daysInMonth.forEach((day) => {
        row.push(item.schedule[day] || "");
      });
      return row;
    });

    const worksheetData = [headerRow, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    const colWidths = [
      { wch: 6 },
      { wch: 28 },
      ...daysInMonth.map(() => ({ wch: 16 })),
    ];
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    const fileName = `Bang_Cham_Cong_${thang.replace(/\s+/g, "").replace("/", "_")}`;
    XLSX.utils.book_append_sheet(wb, ws, "Chấm Công");

    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  if (showSplash) {
    return <SplashScreen isExiting={isExiting} />;
  }
  return (
    <>
      <div
        className={`app-shell ${!showSplash ? "app-shell-visible" : ""}`}
      ></div>
      <div className="clinic-dashboard-container">
        <header className="clinic-header">
          <div className="brand-area">
            <div className="medical-logo">
              <span>✦</span>
            </div>
            <div className="title-group">
              <h1>HỆ THỐNG KIỂM TRA CHẤM CÔNG NHÂN SỰ</h1>
              <p className="subtitle">
                <span className="clinic-name">PHÒNG KHÁM ĐA KHOA THIÊN ÂN</span>
                {thang && (
                  <span className="calendar-badge">
                    📅 {thang.toUpperCase()}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="action-control-group">
            <FileUpload onUpload={handleFileUpload} loading={loading} />

            {data.length > 0 && (
              <button className="btn-clinic-export" onClick={handleExportExcel}>
                <span className="icon">📥</span> Xuất Báo Cáo Excel
              </button>
            )}
          </div>
        </header>

        {data.length > 0 && (
          <section className="quick-stats-cards animate-fade-in">
            <div className="stat-card">
              <span className="stat-icon bs">🩺</span>
              <div className="stat-info">
                <span className="stat-label">Tổng nhân sự</span>
                <span className="stat-value">{data.length} thành viên</span>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon range">📅</span>
              <div className="stat-info">
                <span className="stat-label">Thời gian hiển thị</span>
                <span className="stat-value">{daysInMonth.length} ngày</span>
              </div>
            </div>
          </section>
        )}

        <main className="clinic-main-content">
          <AttendanceTable data={data} daysInMonth={daysInMonth} />
        </main>
      </div>
      {showSplash && <SplashScreen isExiting={isExiting} />}
    </>
  );
}

export default App;
