# 🚨 Google Apps Script 緊急修復指南

## 問題：Failed to fetch

診斷工具顯示 "Failed to fetch"，表示無法連接到 Google Apps Script。

## 🔧 立即修復步驟

### 第一步：重新部署 Google Apps Script

1. **打開 Google Apps Script**
   - 前往 [https://script.google.com](https://script.google.com)
   - 找到你的學員管理系統專案

2. **檢查代碼**
   - 確認有 `doGet()` 和 `doPost()` 函數
   - 如果代碼是空的或錯誤的，請使用 `google-apps-script-完整修復版.js` 的完整內容

3. **更新 Google Sheets ID**
   ```javascript
   // 第3行，替換為你的實際 Google Sheets ID
   const SPREADSHEET_ID = 'YOUR_GOOGLE_SHEETS_ID_HERE';
   ```

4. **保存代碼**
   - 按 `Ctrl+S` (Windows) 或 `Cmd+S` (Mac)

5. **重新部署**
   - 點擊右上角「部署」
   - 選擇「新增部署作業」
   - 類型：**網頁應用程式**
   - 執行身分：**我**
   - 具有存取權的使用者：**任何人**
   - 點擊「部署」

6. **授權權限**（如果需要）
   - 點擊「授權存取權限」
   - 選擇你的 Google 帳號
   - 可能會看到「Google 尚未驗證這個應用程式」
   - 點擊「進階」→「前往 [專案名稱] (不安全)」
   - 點擊「允許」

7. **複製新的 Web App URL**
   - 部署成功後會顯示 Web App URL
   - **重要：確保 URL 以 `/exec` 結尾**
   - 複製完整的 URL

### 第二步：測試 Google Apps Script

1. **直接測試**
   - 在瀏覽器新分頁貼上你的 Web App URL
   - 應該看到類似這樣的回應：
     ```json
     {"success":false,"error":"Invalid action: undefined"}
     ```
   - 如果看到 HTML 頁面或錯誤頁面，表示部署有問題

2. **測試特定功能**
   - 在 URL 後面加上 `?action=test`
   - 例如：`https://script.google.com/macros/s/.../exec?action=test`
   - 應該看到錯誤訊息而不是空白頁面

### 第三步：更新系統設定

1. **在學員管理系統中**
   - 點擊「系統設定」
   - 將新的 Google Apps Script URL 貼入
   - 點擊「保存設定」

2. **測試連接**
   - 點擊「📚 載入班別資料」
   - 應該看到成功訊息或具體錯誤（不再是 "Failed to fetch"）

## 🔍 常見問題排解

### 問題 1：看到 HTML 頁面而不是 JSON

**解決方案：**
- 檢查部署設定：執行身分必須是「我」，存取權限必須是「任何人」
- 重新授權權限
- 確認使用的是 `/exec` URL 而不是 `/dev` URL

### 問題 2：仍然顯示 "Failed to fetch"

**可能原因：**
- URL 複製錯誤
- 網絡防火牆阻擋
- Google Apps Script 服務暫時不可用

**解決方案：**
- 重新複製 URL，確保沒有多餘的空格
- 嘗試不同的網絡環境
- 等待幾分鐘後重試

### 問題 3：權限錯誤

**解決方案：**
- 確保 Google Apps Script 有存取 Google Sheets 的權限
- 重新運行授權流程
- 檢查 Google Sheets ID 是否正確

## ⚡ 快速檢查清單

- [ ] Google Apps Script 代碼是完整的
- [ ] SPREADSHEET_ID 已正確設定
- [ ] 已重新部署為網頁應用程式
- [ ] 執行身分設為「我」
- [ ] 存取權限設為「任何人」  
- [ ] 已完成權限授權
- [ ] Web App URL 以 `/exec` 結尾
- [ ] 直接訪問 URL 能看到 JSON 回應
- [ ] 系統設定中的 URL 已更新

## 🆘 如果仍然失敗

請提供以下信息：

1. **Google Apps Script URL**（可隱藏中間部分）
2. **直接訪問 URL 時看到什麼**
3. **Google Sheets ID**（可隱藏中間部分）
4. **任何錯誤訊息的截圖**

這樣我可以提供更精確的幫助！ 