import React, { useState } from "react";
import * as XLSX from "xlsx";
import FileUpload from "./components/FileUpload/FileUpload";
import AttendanceTable from "./components/AttendanceTable/AttendanceTable";
import "./styles/main.scss";

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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();

    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary", cellDates: true });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });

      processRawLogData(rawData);
    };

    reader.readAsBinaryString(file);
  };

  // Hàm chuyển đổi giờ thập phân sang dạng text hiển thị chu đáo (ví dụ: 11.5 -> 11h30)
  const formatDecimalToTimeStr = (dec) => {
    const h = Math.floor(dec);
    const m = Math.round((dec - h) * 60);
    return m === 0 ? `${h}h` : `${h}h${m}`;
  };

  //Hàm check quan trọng
  const matchStandardShift = (hoursArray) => {
    if (!hoursArray || hoursArray.length === 0) return "";

    // Lấy chính xác giờ nhỏ nhất (vào) và lớn nhất (ra) trong ngày mà không phụ thuộc thứ tự log
    const minHour = Math.min(...hoursArray);
    const maxHour = Math.max(...hoursArray);

    // Làm tròn số để giảm bớt sai số hệ thống quẹt thẻ (làm tròn đến 1 chữ số thập phân)
    const start = Math.round(minHour * 10) / 10;
    const end = Math.round(maxHour * 10) / 10;

    if (start >= end) return "";

    // KIỂM TRA LÀM XUYÊN TRƯA: Có lượt khám/quẹt thẻ trong khung nghỉ trưa từ 11h05 đến 12h55 không
    const hasWorkDuringLunch = hoursArray.some(
      (hour) => hour > 11.08 && hour < 12.92,
    );

    // Hàm định dạng giờ chuẩn hóa (Ví dụ: 11.1 -> 11h06, 11.5 -> 11h30)
    const fmt = (dec) => {
      const h = Math.floor(dec);
      const m = Math.round((dec - h) * 60);
      if (m === 0) return `${h}h`;
      return `${h}h${m < 10 ? "0" + m : m}`; // Sửa lỗi 16h6 thành 16h06 bằng cách thêm padStart '0'
    };

    // Mở rộng biên độ sai số lên 1.5 giờ đối với ca thẳng 7h-17h để nhận diện chính xác
    // ngay cả khi nhân sự vào muộn (ví dụ 11h) hoặc về sớm, miễn là có làm xuyên trưa.
    if (hasWorkDuringLunch) {
      // Ưu tiên kiểm tra tuyệt đối xem có khớp ca thẳng 7h-17h không
      const matchStart7h17h = Math.abs(start - 7.0) <= 4.5; // Cho phép linh hoạt giờ vào từ sáng đến trưa
      const matchEnd7h17h = Math.abs(end - 17.0) <= 1.0;

      if (matchStart7h17h && matchEnd7h17h) {
        return "7h-17h";
      }
    }

    // DUYỆT KHỚP VỚI CÁC CA MẪU ĐÃ SETUP TRONG STANDARD_SHIFTS
    for (const shift of STANDARD_SHIFTS) {
      // Kiểm tra giờ vào và giờ ra có khớp biên độ sai số thông thường (tối đa 45 phút ~ 0.75h)
      const matchStart = Math.abs(start - shift.startHour) <= 0.75;
      const matchEnd = Math.abs(end - shift.endHour) <= 0.75;

      if (matchStart && matchEnd) {
        // Nếu là ca gãy (có nghỉ trưa) nhưng dữ liệu thực tế lại làm xuyên trưa -> Bỏ qua để tìm ca thẳng
        if (shift.isSplitShift && hasWorkDuringLunch) {
          continue;
        }
        // Nếu là ca thẳng (xuyên trưa) nhưng thực tế không làm việc giờ trưa -> Bỏ qua để tìm ca gãy
        if (
          !shift.isSplitShift &&
          shift.label === "7h-17h" &&
          !hasWorkDuringLunch
        ) {
          continue;
        }

        return shift.label;
      }
    }

    // BẢO HIỂM: Nếu không khớp bất kỳ ca cấu hình sẵn nào, tự sinh chuỗi hiển thị linh hoạt
    if (hasWorkDuringLunch) {
      return `${fmt(start)}-${fmt(end)}`;
    } else {
      // Tách chuỗi hiển thị dạng ca gãy nếu có khoảng trống lớn ở giữa giờ trưa
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
          // THAY ĐỔI Ở ĐÂY: Truyền cả mảng hoursArray vào thay vì min/max
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

  return (
    <div className="container">
      <header className="header-tool">
        <div>
          <h1>CHECK CHẤM CÔNG - PHÒNG KHÁM THIÊN ÂN</h1>
          <p>
            {thang
              ? `📅 ${thang.toUpperCase()}`
              : "Vui lòng nạp file Excel hệ thống log"}
          </p>
        </div>

        <div
          className="action-groups"
          style={{ display: "flex", gap: "12px", alignItems: "center" }}
        >
          <FileUpload onUpload={handleFileUpload} loading={loading} />

          {data.length > 0 && (
            <button className="btn-export" onClick={handleExportExcel}>
              📥 Xuất file Excel
            </button>
          )}
        </div>
      </header>

      <main>
        <AttendanceTable data={data} daysInMonth={daysInMonth} />
      </main>
    </div>
  );
}

export default App;
