# Google Apps Script 設定指南

## 📋 **設定步驟**

### 1. **開啟 Google Apps Script**
1. 前往 [Google Apps Script](https://script.google.com/)
2. 點擊「新增專案」

### 2. **複製代碼**
1. 刪除預設的 `myFunction()` 代碼
2. 複製 `google-apps-script-example.js` 的完整代碼
3. 貼上到 Google Apps Script 編輯器

### 3. **設定 Google Sheets ID**
1. 開啟你的 Google Sheets
2. 從網址複製 Sheets ID：
   ```
   https://docs.google.com/spreadsheets/d/[SHEETS_ID]/edit
   ```
3. 在 Google Apps Script 代碼中，替換：
   ```javascript
   const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
   ```

### 4. **確認工作表名稱**
確保你的 Google Sheets 有以下工作表：
- `學員資料` - 存放學員資訊
- `schedule` - 存放班組資料和課堂資料

### 5. **部署 Web App**
1. 點擊「部署」→「新增部署作業」
2. 選擇類型：「網頁應用程式」
3. 設定：
   - 說明：學員管理系統 API
   - 執行身分：我
   - 存取權限：任何人
4. 點擊「部署」
5. **複製 Web App URL**（重要！）

### 6. **設定 Vercel 環境變數**
1. 前往 [Vercel Dashboard](https://vercel.com/dashboard)
2. 選擇你的專案
3. 前往「Settings」→「Environment Variables」
4. 新增變數：
   - **Name**: `GOOGLE_APPS_SCRIPT_URL`
   - **Value**: 你的 Web App URL
   - **Environment**: Production, Preview, Development
5. 點擊「Save」

### 7. **重新部署**
1. 回到 Vercel 專案頁面
2. 點擊「Redeploy」或推送新的 commit

## 📊 **Google Sheets 結構**

### **學員資料工作表**
```
A: id | B: name | C: nickname | D: class | E: phone | F: email | G: status | H: remarks | I: createdAt
```

### **schedule 工作表**
```
A: ID | B: 名稱 | C: 開始時間 | D: 結束時間 | E: 星期 | F: 描述
```

## 🔧 **測試設定**

設定完成後，在學員管理系統中：
1. 點擊「📚 載入班別資料」
2. 如果看到「✅ 成功載入 X 個班別」，表示設定成功
3. 如果看到錯誤訊息，請檢查上述步驟

## ❓ **常見問題**

### Q: 看到「Invalid action」錯誤
**A:** Google Apps Script 代碼沒有更新，請重新複製最新的代碼

### Q: 看到「Missing Google Apps Script URL configuration」
**A:** Vercel 環境變數沒有設定，請按步驟 6 設定

### Q: 班別選項沒有載入
**A:** 檢查 Google Sheets 的 `schedule` 工作表是否有資料，且 B 欄有班別名稱

### Q: 學員資料無法同步
**A:** 檢查 Google Sheets 的 `學員資料` 工作表是否存在，且權限設定正確

## 🚀 **完成！**

設定完成後，你的學員管理系統將可以：
- ✅ 從 Google Sheets 載入班別選項
- ✅ 同步學員資料到 Google Sheets
- ✅ 載入課堂資料
- ✅ 完整的雲端功能 