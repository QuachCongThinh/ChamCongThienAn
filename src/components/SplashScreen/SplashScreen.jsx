import { useEffect, useState } from "react";
import "./SplashScreen.scss";

function SplashScreen({ isExiting }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let value = 0;

    const interval = setInterval(() => {
      value += 1;

      if (value > 100) {
        clearInterval(interval);
        return;
      }

      setProgress(value);
    }, 30);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`splash-screen ${isExiting ? "splash-screen-exit" : ""}`}>
      <div className="splash-content">
        <img src="/logo.png" alt="Thiên Ân" className="splash-logo" />

        <h1>PHÒNG KHÁM ĐA KHOA THIÊN ÂN</h1>

        <p>Hệ thống kiểm tra chấm công nhân sự</p>

        <div className="loading-wrapper">
          <div className="loading-bar">
            <div
              className="loading-progress"
              style={{
                width: `${progress}%`,
              }}
            />

            <div className="progress-percent">{progress}%</div>
          </div>

          <div className="loading-text">Đang tải dữ liệu...</div>
        </div>
      </div>
    </div>
  );
}

export default SplashScreen;
