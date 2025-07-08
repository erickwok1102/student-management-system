// 最簡單的 CORS 修復版本 - Google Apps Script
// 只需要替換你的 Google Sheets ID

const SHEET_ID = '你的Google_Sheets_ID';  // 在這裡填入你的 Google Sheets ID

function doPost(e) {
  // 加入 CORS headers - 這是修復的關鍵
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const worksheet = data.worksheet;
    const sheetData = data.data;
    
    if (action === 'update') {
      updateSheet(worksheet, sheetData);
      
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          message: '同步成功'
        }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders(headers);  // 加入 CORS headers
    }
    
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: '錯誤: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);  // 錯誤回應也要加入 CORS headers
  }
}

function doGet(e) {
  // GET 請求也要加入 CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      message: 'Apps Script 運行正常'
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(headers);
}

function updateSheet(worksheetName, data) {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  let sheet = spreadsheet.getSheetByName(worksheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(worksheetName);
  }
  
  sheet.clear();
  
  if (data && data.length > 0) {
    sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
  }
} 