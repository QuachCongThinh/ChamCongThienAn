const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  mainWindow.maximize();
  if (process.env.ELECTRON_START_URL) {
    // 1. Môi trường Dev: Chạy qua local server của React (http://localhost:3000)
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
  } else {
    // 2. Môi trường Production (Sau khi đóng gói thành app): Load thẳng link Vercel
    // HÃY THAY LINK DƯỚI ĐÂY THÀNH LINK VERCEL CHÍNH THỨC CỦA BẠN
    const vercelUrl = "https://chamcongthienan.vercel.app/";

    mainWindow.loadURL(vercelUrl);
  }

  // mainWindow.webContents.openDevTools(); // Bỏ comment nếu muốn mở tab inspect khi dev
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
