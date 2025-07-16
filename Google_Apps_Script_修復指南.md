# 🚨 解決上載問題 - Google Apps Script 修復指南

## 問題診斷

你看到的錯誤訊息：
```
Unexpected token 'T', "The page c"... is not valid JSON
```

這表示 Google Apps Script 沒有正確返回 JSON 格式，通常是因為：

1. **Google Apps Script URL 配置錯誤**
2. **Google Apps Script 程式碼不完整或有錯誤**
3. **Vercel 環境變數沒有設定**

## 🔧 完整解決方案

### 第一步：更新 Google Apps Script 程式碼

1. **打開 Google Apps Script**
   - 前往 [https://script.google.com/](https://script.google.com/)
   - 找到你的學員管理系統項目

2. **完全替換現有程式碼**
   - 刪除所有現有程式碼
   - 複製並貼上 `google-apps-script-complete.js` 文件中的完整程式碼

3. **替換 Spreadsheet ID**
   ```javascript
   // 找到這一行並替換
   const SPREADSHEET_ID = 'YOUR_GOOGLE_SHEETS_ID_HERE';
   
   // 替換為你的實際 Google Sheets ID
   const SPREADSHEET_ID = '你的實際Google_Sheets_ID';
   ```

4. **保存程式碼**
   - 按 `Ctrl+S` (Windows) 或 `Cmd+S` (Mac)
   - 確保沒有語法錯誤

### 第二步：重新部署 Web App

1. **部署新版本**
   - 點擊右上角「部署」
   - 選擇「新增部署作業」
   - 類型：**網頁應用程式**
   
2. **重要設定**
   ```
   說明：學員管理系統 API v2.0
   執行身分：我
   具有存取權的使用者：任何人
   ```

3. **授權權限**
   - 點擊「部署」
   - 如果要求授權，點擊「授權存取權限」
   - 選擇你的 Google 帳號
   - 可能會看到「Google 尚未驗證這個應用程式」
   - 點擊「進階」→「前往 [專案名稱] (不安全)」
   - 點擊「允許」

4. **複製新的 Web App URL**
   - 部署成功後會顯示 Web App URL
   - **重要：** 這個 URL 必須以 `/exec` 結尾
   - 複製完整的 URL

### 第三步：設定 Vercel 環境變數

**選項 A：透過 Vercel 網站設定**

1. 前往 [Vercel Dashboard](https://vercel.com/dashboard)
2. 選擇你的 `student-management-vercel` 項目
3. 點擊「Settings」標籤
4. 點擊左側的「Environment Variables」
5. 點擊「Add New」
6. 設定：
   ```
   Name: GOOGLE_APPS_SCRIPT_URL
   Value: 你的Web_App_URL (以/exec結尾)
   Environment: Production, Preview, Development (全選)
   ```
7. 點擊「Save」

**選項 B：透過指令（如果你有 Vercel CLI）**

```bash
vercel env add GOOGLE_APPS_SCRIPT_URL
# 然後輸入你的 Web App URL
```

### 第四步：重新部署 Vercel 項目

1. **方法 A：透過 Git**
   ```bash
   git add .
   git commit -m "fix: 更新 Google Apps Script 設定"
   git push
   ```

2. **方法 B：透過 Vercel 網站**
   - 在 Vercel Dashboard 中
   - 點擊「Deployments」
   - 點擊最新部署旁邊的「⋯」
   - 選擇「Redeploy」

### 第五步：測試功能

1. **測試 Google Apps Script**
   - 直接在瀏覽器訪問你的 Web App URL
   - 應該看到錯誤或空白回應（這是正常的，因為沒有提供 action 參數）

2. **測試班別載入**
   - 在學員管理系統中點擊「載入班別資料」
   - 應該看到成功載入班別或「成功載入 0 個班別」

3. **測試學員同步**
   - 添加一個測試學員
   - 點擊「同步到雲端」
   - 應該看到「成功同步 1 筆學員資料到 Google Sheets」

## 🔍 問題排查

### 如果還是看到 JSON 錯誤

1. **檢查 Web App URL**
   - 確保 URL 以 `/exec` 結尾
   - 不是以 `/dev` 結尾

2. **檢查 Google Sheets ID**
   - 打開你的 Google Sheets
   - 從 URL 複製正確的 ID：
     ```
     https://docs.google.com/spreadsheets/d/[這裡是你的ID]/edit
     ```

3. **檢查工作表名稱**
   - 確保有名為「學員資料」的工作表
   - 確保有名為「schedule」的工作表
   - 確保有名為「出席記錄」的工作表

### 如果看到「Missing Google Apps Script URL configuration」

1. **檢查環境變數**
   - 在 Vercel Dashboard 確認環境變數已設定
   - 確認變數名稱是 `GOOGLE_APPS_SCRIPT_URL`

2. **重新部署**
   - 設定環境變數後必須重新部署

### 如果看到「Invalid action」

1. **更新 Google Apps Script 程式碼**
   - 確保使用了最新的完整程式碼
   - 確保沒有語法錯誤

## ✅ 成功指標

當一切設定正確時，你應該看到：

1. **載入班別**：✅ 成功載入 X 個班別
2. **同步學員**：✅ 成功同步 X 筆學員資料到 Google Sheets  
3. **Google Sheets**：看到資料正確出現在對應的工作表中

## 🆘 需要幫助？

如果按照以上步驟還是有問題，請提供：

1. **錯誤訊息截圖**
2. **你的 Web App URL**（可以隱藏中間部分）
3. **Google Sheets ID**（可以隱藏中間部分）
4. **Vercel 環境變數截圖**

這樣我就能更精確地幫你診斷問題！ 