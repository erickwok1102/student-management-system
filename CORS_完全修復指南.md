# CORS 完全修復指南

## 🚨 問題分析
你的 Console 錯誤顯示：
```
Access to fetch at 'https://script.google.com/macros/s/...' from origin 'https://yatonsa.com' has been blocked by CORS policy
```

這是典型的跨域請求被阻擋問題。

## 🔧 解決方案

### 第一步：更新 Google Apps Script

1. **打開你的 Google Apps Script 項目**
2. **完全刪除現有代碼**
3. **複製以下代碼並貼入**：

```javascript
// 學員管理系統 Google Apps Script API (完全修復版)
const SHEET_ID = '你的Google_Sheets_ID'; // 替換為你的實際 Sheet ID

function doPost(e) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  try {
    if (!e.postData || !e.postData.contents) {
      throw new Error('沒有收到數據');
    }

    const requestData = JSON.parse(e.postData.contents);
    const { action, worksheet, data } = requestData;

    if (action === 'update' && worksheet && data) {
      const result = updateWorksheet(worksheet, data);
      
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          message: `${worksheet} 更新成功`,
          rowsUpdated: result
        }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders(headers);
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: '無效的操作'
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: '服務器錯誤: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
  }
}

function doGet(e) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      message: '學員管理系統 API 運行中',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(headers);
}

function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    });
}

function updateWorksheet(worksheetName, data) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    let worksheet = spreadsheet.getSheetByName(worksheetName);
    
    if (!worksheet) {
      worksheet = spreadsheet.insertSheet(worksheetName);
    }
    
    worksheet.clear();
    
    if (data && data.length > 0) {
      const range = worksheet.getRange(1, 1, data.length, data[0].length);
      range.setValues(data);
      return data.length;
    }
    
    return 0;
  } catch (error) {
    throw new Error(`更新工作表失敗: ${error.toString()}`);
  }
}
```

4. **記得將 `SHEET_ID` 替換為你的實際 Google Sheets ID**

### 第二步：重新部署

1. **點擊「部署」→「新增部署作業」**
2. **選擇類型：「網頁應用程式」**
3. **執行身分：「我」**
4. **具有存取權的使用者：「任何人」**
5. **點擊「部署」**
6. **複製新的網頁應用程式 URL**

### 第三步：使用新的管理員系統

1. **將 `CORS_修復版_管理員系統.html` 上傳到你的 WordPress**
2. **路徑：`/wp-content/uploads/student-system/`**
3. **在系統中設置新的 Apps Script URL**
4. **測試連接**

## 🎯 關鍵修復點

1. **完整的 CORS Headers**：
   - `Access-Control-Allow-Origin: *`
   - `Access-Control-Allow-Methods: GET, POST, OPTIONS`
   - `Access-Control-Allow-Headers: Content-Type, Authorization`

2. **處理 OPTIONS 請求**：
   - 瀏覽器會先發送 OPTIONS 請求檢查權限
   - 必須正確回應這個請求

3. **統一的錯誤處理**：
   - 所有回應都包含 CORS headers
   - 統一的 JSON 格式回應

## 🔍 測試步驟

1. **直接測試 Apps Script URL**：
   - 在瀏覽器中打開你的 Apps Script URL
   - 應該看到：`{"status":"ok","message":"學員管理系統 API 運行中"}`

2. **測試系統連接**：
   - 在管理員系統中點擊「測試連接」
   - 應該顯示綠色連接狀態

3. **測試同步功能**：
   - 新增一個測試學員
   - 點擊「同步學員到雲端」
   - 檢查 Google Sheets 是否有新數據

## ⚠️ 重要提醒

1. **必須重新部署**：更新代碼後一定要重新部署
2. **使用新 URL**：使用新部署的 URL，不是舊的
3. **檢查權限**：確保執行身分是「我」，存取權限是「任何人」
4. **清除快取**：如果仍有問題，清除瀏覽器快取

## 🆘 如果仍有問題

如果按照以上步驟操作後仍有 CORS 錯誤，請：

1. **檢查 Apps Script 代碼**：確保完全替換了舊代碼
2. **確認部署設定**：執行身分和存取權限設定正確
3. **使用新系統**：使用 `CORS_修復版_管理員系統.html`
4. **清除快取**：按 Ctrl+Shift+R 強制刷新

完成以上步驟後，CORS 問題應該完全解決！ 