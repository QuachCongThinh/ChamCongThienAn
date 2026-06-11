import React, { useEffect, useState } from "react";
import "./AttendanceTable.scss";

export default function AttendanceTable({ data, daysInMonth }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 576);
  const [expandedCards, setExpandedCards] = useState({});

  const toggleCard = (id) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 576);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

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

  //MOBILE VIEW
  if (isMobile) {
    return (
      <div className="mobile-attendance-list animate-slide-up">
        {data.map((row) => {
          const workingDays = daysInMonth.filter(
            (day) => row.schedule[day] && row.schedule[day].trim() !== "",
          );

          const expanded = expandedCards[row.stt];

          return (
            <div key={row.stt} className="staff-card">
              <div
                className="staff-header clickable"
                onClick={() => toggleCard(row.stt)}
              >
                <div className="staff-index">{row.stt}</div>

                <div className="staff-info">
                  <div className="staff-name">{row.hoTen}</div>

                  <div className="working-summary">
                    Có {workingDays.length} ngày làm việc
                  </div>
                </div>

                <div className="expand-icon">{expanded ? "▲" : "▼"}</div>
              </div>

              {expanded && (
                <div className="staff-schedule">
                  {workingDays.map((day) => (
                    <div key={day} className="day-item">
                      <span className="day-label">Ngày {day}</span>

                      <span className="day-shift has-shift">
                        {row.schedule[day]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // DESKTOP VIEW
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
                          className={`shift-badge ${
                            shift.length <= 8 ? "half-shift" : ""
                          }`}
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
