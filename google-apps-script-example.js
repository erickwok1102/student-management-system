// Google Apps Script 代碼範例
// 請將此代碼複製到 Google Apps Script 編輯器中

// 設定你的 Google Sheets ID
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // 請替換為你的 Google Sheets ID

// 工作表名稱
const STUDENTS_SHEET = '學員資料'; // 學員資料工作表
const CLASSES_SHEET = '班組資料';   // 班別資料工作表  
const SCHEDULE_SHEET = '課堂資料';  // 課堂資料工作表

function doGet(e) {
  const action = e.parameter.action;
  
  try {
    switch (action) {
      case 'getStudents':
        return getStudents();
      case 'getClasses':
        return getClasses();
      case 'getSchedule':
        return getSchedule();
      default:
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: 'Invalid action'
        })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    switch (action) {
      case 'syncStudents':
        return syncStudents(data.students);
      default:
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: 'Invalid action'
        })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 獲取學員資料
function getStudents() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(STUDENTS_SHEET);
    if (!sheet) {
      throw new Error(`找不到工作表: ${STUDENTS_SHEET}`);
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        students: [],
        count: 0
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const headers = data[0];
    const students = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0]) { // 如果有姓名
        students.push({
          id: row[0] + '_' + Date.now() + '_' + i,
          name: row[0] || '',
          nickname: row[1] || '',
          class: row[2] || '',
          phone: row[3] || '',
          email: row[4] || '',
          status: row[5] || '在讀',
          createdAt: row[6] || new Date().toISOString(),
          remarks: row[7] || ''
        });
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      students: students,
      count: students.length
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 獲取班別資料（從 B 欄讀取，從 B2 開始）
function getClasses() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(CLASSES_SHEET);
    if (!sheet) {
      throw new Error(`找不到工作表: ${CLASSES_SHEET}`);
    }
    
    // 讀取 B 欄資料，從 B2 開始
    const range = sheet.getRange('B2:B'); // 從 B2 開始讀取到最後一行
    const values = range.getValues();
    
    const classes = [];
    for (let i = 0; i < values.length; i++) {
      const className = values[i][0];
      if (className && className.toString().trim()) {
        classes.push(className.toString().trim());
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      classes: classes,
      count: classes.length
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 獲取課堂資料
function getSchedule() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SCHEDULE_SHEET);
    if (!sheet) {
      throw new Error(`找不到工作表: ${SCHEDULE_SHEET}`);
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        schedule: [],
        count: 0
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const headers = data[0];
    const schedule = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0]) { // 如果有課程名稱
        schedule.push({
          id: 'schedule_' + Date.now() + '_' + i,
          className: row[0] || '',
          teacher: row[1] || '',
          time: row[2] || '',
          date: row[3] || '',
          students: row[4] || '',
          location: row[5] || '',
          remarks: row[6] || ''
        });
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      schedule: schedule,
      count: schedule.length
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 同步學員資料到 Google Sheets
function syncStudents(students) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(STUDENTS_SHEET);
    if (!sheet) {
      throw new Error(`找不到工作表: ${STUDENTS_SHEET}`);
    }
    
    // 清空現有資料（保留標題行）
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
    }
    
    // 設定標題行（如果沒有的話）
    const headers = ['姓名', '別名', '班別', '電話', '信箱', '狀態', '建立日期', '備註'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // 添加學員資料
    if (students && students.length > 0) {
      const rows = students.map(student => [
        student.name || '',
        student.nickname || '',
        student.class || '',
        student.phone || '',
        student.email || '',
        student.status || '在讀',
        student.createdAt || new Date().toISOString(),
        student.remarks || ''
      ]);
      
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: `成功同步 ${students.length} 筆學員資料`
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
} 