# Google Apps Script CORS 修復指南

## 問題說明
當從 WordPress 網站 (yatonsa.com) 訪問 Google Apps Script 時，出現 CORS 錯誤：
```
Access to fetch at 'https://script.google.com/...' from origin 'https://yatonsa.com' has been blocked by CORS policy
```

## 解決方案

### 1. 更新 Google Apps Script 代碼

請將你的 Apps Script 代碼**完全替換**為以下內容：

```javascript
// 學員管理系統 Google Apps Script API (CORS 修復版)

// 你的 Google Sheets ID
const SHEET_ID = '你的Google_Sheets_ID';

function doPost(e) {
  try {
    // 設置 CORS headers
    const response = {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
      }
    };
    
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const sheetData = data.data;
    const worksheetName = data.worksheet;
    
    console.log('收到請求:', action, worksheetName);
    
    if (action === 'update') {
      const result = updateSheet(worksheetName, sheetData);
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          message: '數據同步成功',
          updated: result
        }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders(response.headers);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: '未知操作'
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(response.headers);
      
  } catch (error) {
    console.error('Apps Script 錯誤:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: '服務器錯誤: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
      });
  }
}

function doGet(e) {
  // 處理 OPTIONS 請求 (CORS preflight)
  const response = {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    }
  };
  
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      message: '學員管理系統 API 運行中 (CORS 支援)',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(response.headers);
}

function updateSheet(worksheetName, data) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    let worksheet = spreadsheet.getSheetByName(worksheetName);
    
    if (!worksheet) {
      worksheet = spreadsheet.insertSheet(worksheetName);
    }
    
    // 清空現有數據
    worksheet.clear();
    
    if (data && data.length > 0) {
      // 寫入新數據
      const range = worksheet.getRange(1, 1, data.length, data[0].length);
      range.setValues(data);
      
      console.log(`${worksheetName} 更新完成，共 ${data.length} 行數據`);
      return data.length;
    }
    
    return 0;
  } catch (error) {
    console.error('更新工作表錯誤:', error);
    throw error;
  }
}

// 處理 CORS preflight 請求
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    });
}
```

### 2. 重新部署 Apps Script

1. 將上面的代碼**完全替換**你現有的 Apps Script 代碼
2. 記得將 `SHEET_ID` 替換為你的實際 Google Sheets ID
3. 點擊「部署」→「新增部署作業」
4. 選擇類型：「網頁應用程式」
5. 執行身分：「我」
6. 具有存取權的使用者：「任何人」
7. 點擊「部署」
8. **複製新的網頁應用程式 URL**

### 3. 更新系統設定

在你的管理員系統中：
1. 點擊「系統設定」
2. 將新的 Apps Script URL 貼入
3. 測試連線
4. 再次嘗試同步數據

### 4. 如果仍有問題

如果 CORS 錯誤持續，可能需要：

1. **確認部署設定**：
   - 執行身分必須是「我」
   - 存取權限必須是「任何人」

2. **檢查 URL**：
   - 確保使用的是最新部署的 URL
   - URL 應該以 `/exec` 結尾

3. **清除瀏覽器快取**：
   - 按 Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac)

## 測試方法

1. 直接在瀏覽器訪問你的 Apps Script URL
2. 應該看到：`{"status":"ok","message":"學員管理系統 API 運行中 (CORS 支援)"}`
3. 在管理員系統中測試連線應該顯示綠色
4. 嘗試同步學員數據

## 常見問題

**Q: 為什麼會出現 CORS 錯誤？**
A: 瀏覽器安全政策阻止跨域請求，需要服務器端設置允許跨域的 headers。

**Q: 新代碼有什麼不同？**
A: 加入了完整的 CORS headers 支援，包括 preflight 請求處理。

**Q: 需要重新授權嗎？**
A: 是的，更新代碼後需要重新部署並可能需要重新授權。 