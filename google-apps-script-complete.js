// 學員管理系統 Google Apps Script 完整版
// 請替換以下 ID 為你的實際 Google Sheets ID
const SPREADSHEET_ID = 'YOUR_GOOGLE_SHEETS_ID_HERE';

// 工作表名稱配置
const SHEETS = {
  STUDENTS: '學員資料',
  SCHEDULE: 'schedule',
  ATTENDANCE: '出席記錄'
};

// 主要處理函數 - 處理 GET 請求
function doGet(e) {
  try {
    const action = e.parameter.action;
    console.log('收到 GET 請求:', action);

    switch (action) {
      case 'getStudents':
        return getStudents();
      case 'getClasses':
        return getClasses();
      case 'getSchedule':
        return getSchedule();
      default:
        return createResponse({
          success: false,
          error: 'Invalid action: ' + action
        });
    }
  } catch (error) {
    console.error('doGet 錯誤:', error);
    return createResponse({
      success: false,
      error: error.toString()
    });
  }
}

// 主要處理函數 - 處理 POST 請求
function doPost(e) {
  try {
    console.log('收到 POST 請求');
    
    if (!e.postData || !e.postData.contents) {
      throw new Error('沒有收到數據');
    }

    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    console.log('POST Action:', action);

    switch (action) {
      case 'syncStudents':
        return syncStudents(data.students);
      case 'syncAttendance':
        return syncAttendance(data.attendance);
      default:
        return createResponse({
          success: false,
          error: 'Invalid action: ' + action
        });
    }
  } catch (error) {
    console.error('doPost 錯誤:', error);
    return createResponse({
      success: false,
      error: error.toString()
    });
  }
}

// 創建統一的回應格式
function createResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// 獲取學員資料
function getStudents() {
  try {
    console.log('開始獲取學員資料');
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEETS.STUDENTS);
    
    if (!sheet) {
      console.log('學員資料工作表不存在，返回空陣列');
      return createResponse({
        success: true,
        students: [],
        count: 0
      });
    }

    const data = sheet.getDataRange().getValues();
    console.log('讀取到原始數據:', data.length, '行');
    
    if (data.length <= 1) {
      return createResponse({
        success: true,
        students: [],
        count: 0
      });
    }

    // 假設第一行是標題
    const headers_row = data[0];
    const students = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0]) { // 如果 ID 不為空
        students.push({
          id: row[0] || '',
          name: row[1] || '',
          nickname: row[2] || '',
          class: row[3] || '',
          phone: row[4] || '',
          email: row[5] || '',
          status: row[6] || '在讀',
          remarks: row[7] || '',
          createdAt: row[8] || new Date().toISOString()
        });
      }
    }

    console.log('轉換後的學員數量:', students.length);
    
    return createResponse({
      success: true,
      students: students,
      count: students.length
    });
    
  } catch (error) {
    console.error('獲取學員資料失敗:', error);
    return createResponse({
      success: false,
      error: error.toString()
    });
  }
}

// 獲取班別資料
function getClasses() {
  try {
    console.log('開始獲取班別資料');
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEETS.SCHEDULE);
    
    if (!sheet) {
      console.log('schedule 工作表不存在');
      return createResponse({
        success: true,
        classes: [],
        count: 0
      });
    }

    const data = sheet.getDataRange().getValues();
    console.log('schedule 工作表數據行數:', data.length);
    
    if (data.length <= 1) {
      return createResponse({
        success: true,
        classes: [],
        count: 0
      });
    }

    // 從 B 欄獲取班別名稱 (從第2行開始)
    const classes = [];
    const classNames = new Set(); // 用來去重複
    
    for (let i = 1; i < data.length; i++) {
      const className = data[i][1]; // B 欄
      if (className && className.trim() && !classNames.has(className.trim())) {
        classNames.add(className.trim());
        classes.push(className.trim());
      }
    }

    console.log('找到的班別:', classes);
    
    return createResponse({
      success: true,
      classes: classes,
      count: classes.length
    });
    
  } catch (error) {
    console.error('獲取班別資料失敗:', error);
    return createResponse({
      success: false,
      error: error.toString()
    });
  }
}

// 獲取課程資料
function getSchedule() {
  try {
    console.log('開始獲取課程資料');
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEETS.SCHEDULE);
    
    if (!sheet) {
      return createResponse({
        success: true,
        schedule: [],
        count: 0
      });
    }

    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return createResponse({
        success: true,
        schedule: [],
        count: 0
      });
    }

    // 轉換課程資料
    const schedule = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0]) { // 如果 ID 不為空
        schedule.push({
          id: row[0] || '',
          name: row[1] || '',
          startTime: row[2] || '',
          endTime: row[3] || '',
          dayOfWeek: row[4] || '',
          description: row[5] || ''
        });
      }
    }

    return createResponse({
      success: true,
      schedule: schedule,
      count: schedule.length
    });
    
  } catch (error) {
    console.error('獲取課程資料失敗:', error);
    return createResponse({
      success: false,
      error: error.toString()
    });
  }
}

// 同步學員資料到 Google Sheets
function syncStudents(students) {
  try {
    console.log('開始同步學員資料，數量:', students ? students.length : 0);
    
    if (!students || !Array.isArray(students)) {
      throw new Error('無效的學員資料格式');
    }

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(SHEETS.STUDENTS);
    
    // 如果工作表不存在，創建它
    if (!sheet) {
      console.log('創建學員資料工作表');
      sheet = spreadsheet.insertSheet(SHEETS.STUDENTS);
    }

    // 清空工作表並設置標題
    sheet.clear();
    const headerRow = ['id', 'name', 'nickname', 'class', 'phone', 'email', 'status', 'remarks', 'createdAt'];
    sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);

    // 添加學員資料
    if (students.length > 0) {
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

      sheet.getRange(2, 1, rows.length, headerRow.length).setValues(rows);
    }

    console.log('學員資料同步完成');
    
    return createResponse({
      success: true,
      message: `成功同步 ${students.length} 筆學員資料`,
      count: students.length
    });
    
  } catch (error) {
    console.error('同步學員資料失敗:', error);
    return createResponse({
      success: false,
      error: error.toString()
    });
  }
}

// 同步出席記錄到 Google Sheets
function syncAttendance(attendance) {
  try {
    console.log('開始同步出席記錄，數量:', attendance ? attendance.length : 0);
    
    if (!attendance || !Array.isArray(attendance)) {
      throw new Error('無效的出席記錄格式');
    }

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(SHEETS.ATTENDANCE);
    
    // 如果工作表不存在，創建它
    if (!sheet) {
      console.log('創建出席記錄工作表');
      sheet = spreadsheet.insertSheet(SHEETS.ATTENDANCE);
      
      // 設置標題行
      const headerRow = ['日期', '班別', '學員ID', '學員姓名', '出席狀態'];
      sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
    }

    // 確保有標題行
    if (sheet.getLastRow() === 0) {
      const headerRow = ['日期', '班別', '學員ID', '學員姓名', '出席狀態'];
      sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
    }

    // 添加出席記錄
    if (attendance.length > 0) {
      const rows = attendance.map(record => [
        record.date || new Date().toLocaleDateString('zh-TW'),
        record.class || '',
        record.studentId || '',
        record.studentName || '',
        record.status || ''
      ]);

      const nextRow = sheet.getLastRow() + 1;
      sheet.getRange(nextRow, 1, rows.length, 5).setValues(rows);
    }

    console.log('出席記錄同步完成');
    
    return createResponse({
      success: true,
      message: `成功同步 ${attendance.length} 筆出席記錄`,
      count: attendance.length
    });
    
  } catch (error) {
    console.error('同步出席記錄失敗:', error);
    return createResponse({
      success: false,
      error: error.toString()
    });
  }
}

// 測試函數 - 可以在 Apps Script 編輯器中手動執行
function testScript() {
  console.log('測試 Google Apps Script');
  console.log('SPREADSHEET_ID:', SPREADSHEET_ID);
  
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    console.log('成功連接到 Google Sheets:', spreadsheet.getName());
    
    // 測試獲取班別
    const classes = getClasses();
    console.log('測試獲取班別結果:', classes.getBlob().getDataAsString());
    
  } catch (error) {
    console.error('測試失敗:', error);
  }
} 