// 學員管理系統 Google Apps Script API (完全修復版)
// 請將 YOUR_SHEET_ID 替換為你的實際 Google Sheets ID

const SHEET_ID = 'YOUR_SHEET_ID'; // 替換為你的 Google Sheets ID

function doPost(e) {
  // 設置 CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  try {
    console.log('收到 POST 請求');
    
    if (!e.postData || !e.postData.contents) {
      throw new Error('沒有收到數據');
    }

    const requestData = JSON.parse(e.postData.contents);
    console.log('請求數據:', requestData);

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
    console.error('處理請求時發生錯誤:', error);
    
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
  // 設置 CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  console.log('收到 GET 請求');

  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      message: '學員管理系統 API 運行中 (CORS 完全修復版)',
      timestamp: new Date().toISOString(),
      version: '2.0'
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(headers);
}

function doOptions(e) {
  // 處理 CORS preflight 請求
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };

  return ContentService
    .createTextOutput('')
    .setHeaders(headers);
}

function updateWorksheet(worksheetName, data) {
  try {
    console.log(`開始更新工作表: ${worksheetName}`);
    
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    let worksheet = spreadsheet.getSheetByName(worksheetName);
    
    // 如果工作表不存在，創建新的
    if (!worksheet) {
      console.log(`工作表 ${worksheetName} 不存在，正在創建...`);
      worksheet = spreadsheet.insertSheet(worksheetName);
    }
    
    // 清空現有數據
    worksheet.clear();
    console.log(`已清空工作表 ${worksheetName}`);
    
    if (data && data.length > 0) {
      // 寫入新數據
      const range = worksheet.getRange(1, 1, data.length, data[0].length);
      range.setValues(data);
      
      console.log(`${worksheetName} 更新完成，共寫入 ${data.length} 行數據`);
      return data.length;
    }
    
    console.log(`${worksheetName} 沒有數據需要寫入`);
    return 0;
    
  } catch (error) {
    console.error(`更新工作表 ${worksheetName} 時發生錯誤:`, error);
    throw new Error(`更新工作表失敗: ${error.toString()}`);
  }
}

// 測試函數
function testFunction() {
  console.log('測試函數運行正常');
  return 'Google Apps Script 運行正常';
} 