import { useEffect, useState } from "react";
import "./SplashScreen.scss";

function SplashScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let value = 0;

    const interval = setInterval(() => {
      value += 1;
      setProgress(value);

      if (value >= 100) {
        clearInterval(interval);
      }
    }, 30); // 100 x 30ms = 3000ms

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="splash-screen">
      <div className="splash-content">
        <img src="/logo.png" alt="Thiên Ân" className="splash-logo" />

        <h1>PHÒNG KHÁM ĐA KHOA THIÊN ÂN</h1>

        <p>Hệ thống kiểm tra chấm công nhân sự</p>

        <div className="loading-wrapper">
          <div className="loading-bar">
            <div
              className="loading-progress"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="loading-info">
            <span>Đang tải dữ liệu...</span>
            <span>{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SplashScreen;
