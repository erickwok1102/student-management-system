# 📝 Google Apps Script 設定指南

## 🎯 解決 API Key 寫入權限問題

你遇到的問題是 **API Key 只能讀取，不能寫入** Google Sheets。解決方案是使用 **Google Apps Script** 作為中介。

## 🚀 設定步驟

### 第一步：創建 Google Apps Script

1. 前往 [Google Apps Script](https://script.google.com/)
2. 點擊「新增專案」
3. 將專案重新命名為「學員管理系統API」

### 第二步：添加程式碼

將以下程式碼貼到 Apps Script 編輯器中：

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const spreadsheetId = 'YOUR_SHEET_ID_HERE'; // 替換為你的 Sheet ID
    
    const ss = SpreadsheetApp.openById(spreadsheetId);
    
    switch(action) {
      case 'updateStudents':
        return updateSheet(ss, '學員資料', data.rows);
      case 'updateClasses':
        return updateSheet(ss, '班組資料', data.rows);
      case 'updateAttendance':
        return updateSheet(ss, '出席記錄', data.rows);
      case 'getStudents':
        return getSheetData(ss, '學員資料');
      case 'getClasses':
        return getSheetData(ss, '班組資料');
      case 'getAttendance':
        return getSheetData(ss, '出席記錄');
      default:
        return ContentService.createTextOutput(JSON.stringify({error: '未知操作'}));
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({error: error.toString()}));
  }
}

function updateSheet(spreadsheet, sheetName, rows) {
  try {
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    // 如果工作表不存在，創建它
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
    }
    
    // 清空現有數據
    sheet.clear();
    
    // 寫入新數據
    if (rows && rows.length > 0) {
      const range = sheet.getRange(1, 1, rows.length, rows[0].length);
      range.setValues(rows);
    }
    
    return ContentService.createTextOutput(JSON.stringify({success: true, message: `${sheetName} 更新成功`}));
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({error: error.toString()}));
  }
}

function getSheetData(spreadsheet, sheetName) {
  try {
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({data: []}));
    }
    
    const data = sheet.getDataRange().getValues();
    return ContentService.createTextOutput(JSON.stringify({data: data}));
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({error: error.toString()}));
  }
}

function doGet(e) {
  return ContentService.createTextOutput('學員管理系統 API 運行中');
}
```

### 第三步：替換 Sheet ID

在程式碼中找到 `YOUR_SHEET_ID_HERE`，替換為你的 Google Sheet ID。

### 第四步：部署為 Web App

1. 點擊右上角「部署」→「新增部署作業」
2. 選擇類型：「網頁應用程式」
3. 說明：「學員管理系統API」
4. 執行身分：「我」
5. 存取權限：「任何人」
6. 點擊「部署」
7. **複製 Web App URL**（很重要！）

### 第五步：授權權限

1. 第一次部署會要求授權
2. 點擊「授權存取權限」
3. 選擇你的 Google 帳號
4. 點擊「進階」→「前往 [專案名稱] (不安全)」
5. 點擊「允許」

## 🔧 更新管理員系統

現在我們需要修改管理員系統來使用 Apps Script API：

### 新的連接設定

- **Google Apps Script URL**: 你剛才複製的 Web App URL
- **Google Sheet ID**: 你的 Sheet ID（用於讀取）

### 功能說明

- **讀取數據**: 仍使用 API Key（快速）
- **寫入數據**: 使用 Apps Script（有完整權限）

## ⚠️ 重要注意事項

1. **安全性**: Apps Script URL 是公開的，但只能存取你指定的 Sheet
2. **權限**: Apps Script 以你的身分運行，有完整的 Google Sheets 權限
3. **限制**: 每天有使用配額限制，但對一般使用足夠

## 🎉 優點

- ✅ 無需複雜的 OAuth 設定
- ✅ 可以讀寫 Google Sheets
- ✅ 免費使用
- ✅ 穩定可靠

## 📞 需要幫助？

如果設定過程中遇到問題，請提供：
1. 錯誤訊息截圖
2. Apps Script URL
3. 你的 Sheet ID

這樣我可以幫你調試！ 