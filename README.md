# 🎓 學員管理系統 - Vercel 版

一個現代化的學員管理系統，支援點名、成績管理、以及與 Google Sheets 雲端同步。

## ✨ 主要功能

### 📋 學員管理
- ➕ 新增、編輯、刪除學員資料
- 🏷️ 班別分類管理  
- 📱 聯絡資訊管理
- 📊 學員狀態追蹤（在讀/休學/畢業/退學）

### ☁️ 雲端同步
- 📤 將本地資料同步到 Google Sheets
- 📥 從 Google Sheets 載入資料
- 🔄 雙向同步功能
- 🚫 解決 CORS 問題

### 📊 統計報表
- 📈 學員總數統計
- 📋 各狀態學員統計
- 📊 即時數據更新

## 🚀 技術架構

```
Frontend: Vanilla HTML/CSS/JavaScript
Backend: Vercel Serverless Functions
Database: Google Sheets
Deploy: Vercel Platform
```

## 📁 項目結構

```
student-management-vercel/
├── index.html              # 主頁面
├── package.json            # 依賴管理
├── vercel.json             # Vercel 設定
├── api/                    # Serverless Functions
│   ├── sync-students.js    # 同步學員到雲端
│   └── get-students.js     # 從雲端載入學員
├── css/                    # 樣式檔案
├── js/                     # JavaScript 檔案
└── README.md              # 說明文件
```

## 🛠️ 部署步驟

### 1. 準備 Google Sheets API
1. 到 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案  
3. 啟用 Google Sheets API
4. 建立服務帳號 (Service Account)
5. 下載 JSON 金鑰檔案
6. 將 Google Sheet 分享給服務帳號信箱

### 2. 部署到 Vercel
1. 將程式碼推送到 GitHub
2. 連接 Vercel 到你的 GitHub repository  
3. 在 Vercel 設定環境變數：
   - `GOOGLE_SHEET_ID`: 你的 Google Sheet ID
   - `GOOGLE_CLIENT_EMAIL`: 服務帳號信箱
   - `GOOGLE_PRIVATE_KEY`: 私鑰 (完整內容)

### 3. 環境變數設定

```bash
GOOGLE_SHEET_ID=1paCFI-QxJ3HjTrA4IOnZFQjuw2I7jh8KkTPiNSbfcoo
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com  
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n....\n-----END PRIVATE KEY-----\n"
```

## 🌐 使用方式

### 🖥️ Web 訪問
- 部署完成後會獲得一個 URL (例如: https://your-app.vercel.app)
- 直接在瀏覽器開啟即可使用
- 支援手機、平板、電腦等各種裝置

### 📱 手機使用  
- 響應式設計，自動適配手機屏幕
- 可以在手機瀏覽器加入書籤，像 App 一樣使用
- 支援離線瀏覽（使用 localStorage）

### 🔗 分享給其他人
- 直接分享 URL 連結
- 其他使用者無需安裝任何軟體
- 多人可同時使用（資料透過 Google Sheets 同步）

## 🎯 優勢特點

✅ **零安裝**: 純網頁版，開瀏覽器就能用  
✅ **跨平台**: 支援所有裝置和作業系統  
✅ **雲端同步**: 資料自動備份到 Google Sheets  
✅ **多人協作**: 多個使用者可同時管理  
✅ **成本低廉**: Vercel 免費方案已足夠使用  
✅ **維護簡單**: 無需管理伺服器  

## 🔧 本地開發

```bash
# 安裝依賴 (可選)
npm install

# 本地開發 (需要 Vercel CLI)
vercel dev

# 部署到 Vercel
vercel deploy
```

## 📞 技術支援

如有問題請檢查：
1. 環境變數是否正確設定
2. Google Sheets API 是否正確啟用  
3. 服務帳號是否有 Sheet 存取權限
4. 網路連線是否正常

---

🎉 **現在你有一個完全雲端化的學員管理系統了！** 