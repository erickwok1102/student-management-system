// Google Apps Script 代碼範例
// 請將此代碼複製到 Google Apps Script 編輯器中

// 設定你的 Google Sheets ID
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // 請替換為你的 Google Sheets ID

// 工作表名稱
const STUDENTS_SHEET = '學員資料'; // 學員資料工作表
const CLASSES_SHEET = 'schedule';   // 班別資料工作表（和課堂資料是同一個）
const SCHEDULE_SHEET = 'schedule';  // 課堂資料工作表（和班別資料是同一個）
const ATTENDANCE_SHEET = '出席記錄'; // 出席記錄工作表

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
      case 'getAttendance':
        return getAttendance();
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
      case 'syncAttendance':
        return syncAttendance(data.attendance);
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
      if (row[1]) { // 如果有姓名（B 欄）
        students.push({
          id: row[0] || ('student_' + Date.now() + '_' + i),  // A 欄: id
          name: row[1] || '',         // B 欄: name
          nickname: row[2] || '',     // C 欄: nickname
          class: row[3] || '',        // D 欄: class
          phone: row[4] || '',        // E 欄: phone
          email: row[5] || '',        // F 欄: email
          status: row[6] || '在讀',   // G 欄: status
          remarks: row[7] || '',      // H 欄: remarks
          createdAt: row[8] || new Date().toISOString() // I 欄: createdAt
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
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        classes: [],
        count: 0
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const classes = [];
    // 從第二行開始讀取 B 欄（名稱）
    for (let i = 1; i < data.length; i++) {
      const className = data[i][1]; // B 欄是 index 1
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
    
    const schedule = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0]) { // 如果有 ID
        schedule.push({
          id: row[0] || '',           // A 欄: ID
          name: row[1] || '',         // B 欄: 名稱
          startTime: row[2] || '',    // C 欄: 開始時間
          endTime: row[3] || '',      // D 欄: 結束時間
          weekday: row[4] || '',      // E 欄: 星期
          description: row[5] || ''   // F 欄: 描述
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

// 獲取出席記錄
function getAttendance() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ATTENDANCE_SHEET);
    if (!sheet) {
      throw new Error(`找不到工作表: ${ATTENDANCE_SHEET}`);
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        attendance: [],
        count: 0
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const attendance = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0]) { // 如果有日期
        attendance.push({
          date: row[0] || '',         // A 欄: 日期
          class: row[1] || '',        // B 欄: 班別
          studentId: row[2] || '',    // C 欄: 學員ID
          studentName: row[3] || '',  // D 欄: 學員姓名
          status: row[4] || ''        // E 欄: 出席狀態
        });
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      attendance: attendance,
      count: attendance.length
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
    const headers = ['id', 'name', 'nickname', 'class', 'phone', 'email', 'status', 'remarks', 'createdAt'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // 添加學員資料
    if (students && students.length > 0) {
      const rows = students.map(student => [
        student.id || '',
        student.name || '',
        student.nickname || '',
        student.class || '',
        student.phone || '',
        student.email || '',
        student.status || '在讀',
        student.remarks || '',
        student.createdAt || new Date().toISOString()
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

// 同步出席記錄到 Google Sheets
function syncAttendance(attendanceData) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ATTENDANCE_SHEET);
    if (!sheet) {
      throw new Error(`找不到工作表: ${ATTENDANCE_SHEET}`);
    }
    
    // 設定標題行（如果沒有的話）
    const headers = ['日期', '班別', '學員ID', '學員姓名', '出席狀態'];
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
    
    // 添加出席記錄
    if (attendanceData && attendanceData.length > 0) {
      const rows = attendanceData.map(record => [
        record.date || '',
        record.class || '',
        record.studentId || '',
        record.studentName || '',
        record.status || ''
      ]);
      
      const nextRow = sheet.getLastRow() + 1;
      sheet.getRange(nextRow, 1, rows.length, headers.length).setValues(rows);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: `成功同步 ${attendanceData.length} 筆出席記錄`,
      count: attendanceData.length
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
} 