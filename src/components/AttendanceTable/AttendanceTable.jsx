import React from "react";
import "./AttendanceTable.scss";

export default function AttendanceTable({ data, daysInMonth }) {
  if (data.length === 0) {
    return (
      <div className="empty-state animate-fade-in">
        <div className="icon-box">📋</div>
        <h3>Chưa có dữ liệu hiển thị</h3>
        <p>
          Vui lòng click nút Import File Excel phía trên để tải dữ liệu lịch
          trực lên hệ thống.
        </p>
      </div>
    );
  }

  return (
    <div className="table-wrapper animate-slide-up">
      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th className="sticky-col stt-col">STT</th>
              <th className="sticky-col name-col">Họ và tên</th>
              {daysInMonth.map((day) => (
                <th key={day} className="day-col">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="table-row">
                <td className="sticky-col stt-col cell-center">{row.stt}</td>
                <td className="sticky-col name-col font-bold">{row.hoTen}</td>
                {daysInMonth.map((day) => {
                  const shift = row.schedule[day];
                  const hasShift = shift && shift.trim() !== "";
                  
                  return (
                    <td key={day} className="cell-shift">
                      {hasShift ? (
                        <span
                          className={`shift-badge ${shift.length <= 8 ? "half-shift" : ""}`}
                        >
                          {shift}
                        </span>
                      ) : (
                        <span className="empty-dash">−</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}