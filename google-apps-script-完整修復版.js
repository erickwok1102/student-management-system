// 學員管理系統 Google Apps Script 完整修復版
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
      case 'getAttendance':
        return getAttendance(e.parameter.date, e.parameter.className);
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
        return syncAttendanceFixed(data.attendance);  // 使用修復版函數
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
        count: 0,
        message: '沒有學員資料'
      });
    }

    // 處理學員數據 - 使用固定欄位格式
    const headers = data[0];
    console.log('標題行:', headers);
    
    const students = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // 跳過完全空白的行
      if (row.every(cell => !cell && cell !== 0)) {
        continue;
      }
      
      // 使用固定的欄位對應，與 Google Sheets 標題一致
      const student = {
        id: row[0] ? row[0].toString() : '',
        name: row[1] ? row[1].toString() : '',
        nickname: row[2] ? row[2].toString() : '',
        class: row[3] ? row[3].toString() : '',
        phone: row[4] ? row[4].toString() : '',
        email: row[5] ? row[5].toString() : '',
        birthday: row[6] ? row[6].toString() : '',
        emergency_contact: row[7] ? row[7].toString() : '',
        emergency_phone: row[8] ? row[8].toString() : '',
        status: row[9] ? row[9].toString() : '在讀',
        remarks: row[10] ? row[10].toString() : '',
        createdAt: row[11] ? row[11].toString() : ''
      };
      
      // 只添加有姓名的學員
      if (student.name) {
        students.push(student);
        console.log(`學員 ${i}: ${student.name} (${student.class})`);
      }
    }

    console.log('處理後的學員數量:', students.length);

    return createResponse({
      success: true,
      students: students,
      count: students.length,
      message: `成功載入 ${students.length} 筆學員資料`
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
      console.log('schedule 工作表不存在，返回空陣列');
      return createResponse({
        success: true,
        classes: [],
        count: 0
      });
    }

    const data = sheet.getDataRange().getValues();
    console.log('讀取到原始數據:', data.length, '行');
    
    if (data.length <= 1) {
      return createResponse({
        success: true,
        classes: [],
        count: 0,
        message: '沒有班別資料'
      });
    }

    // 處理班別數據
    const headers = data[0];
    console.log('標題行:', headers);
    
    const classes = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // 跳過完全空白的行
      if (row.every(cell => !cell && cell !== 0)) {
        continue;
      }
      
      const classData = {};
      headers.forEach((header, index) => {
        classData[header] = row[index] || '';
      });
      
      classes.push(classData);
    }

    console.log('處理後的班別數量:', classes.length);

    return createResponse({
      success: true,
      classes: classes,
      count: classes.length,
      message: `成功載入 ${classes.length} 個班別`
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
      console.log('schedule 工作表不存在，返回空陣列');
      return createResponse({
        success: true,
        schedule: [],
        count: 0
      });
    }

    const data = sheet.getDataRange().getValues();
    console.log('讀取到原始數據:', data.length, '行');
    
    if (data.length <= 1) {
      return createResponse({
        success: true,
        schedule: [],
        count: 0,
        message: '沒有課程資料'
      });
    }

    // 處理課程數據
    const headers = data[0];
    console.log('標題行:', headers);
    
    const schedule = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // 跳過完全空白的行
      if (row.every(cell => !cell && cell !== 0)) {
        continue;
      }
      
      const scheduleData = {};
      headers.forEach((header, index) => {
        scheduleData[header] = row[index] || '';
      });
      
      schedule.push(scheduleData);
    }

    console.log('處理後的課程數量:', schedule.length);

    return createResponse({
      success: true,
      schedule: schedule,
      count: schedule.length,
      message: `成功載入 ${schedule.length} 筆課程資料`
    });

  } catch (error) {
    console.error('獲取課程資料失敗:', error);
    return createResponse({
      success: false,
      error: error.toString()
    });
  }
}

// 獲取出席記錄（根據日期和班別）
function getAttendance(date, className) {
  try {
    console.log('開始獲取出席記錄 - 日期:', date, '班別:', className);
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEETS.ATTENDANCE);
    
    if (!sheet) {
      console.log('出席記錄工作表不存在，返回空陣列');
      return createResponse({
        success: true,
        attendance: [],
        count: 0
      });
    }

    const data = sheet.getDataRange().getValues();
    console.log('讀取到出席數據:', data.length, '行');
    
    if (data.length <= 1) {
      console.log('沒有出席數據，返回空陣列');
      return createResponse({
        success: true,
        attendance: [],
        count: 0
      });
    }

    // 處理數據 (跳過標題行)
    // 根據實際 Google Sheets 格式：A=日期, B=班別, C=學員ID, D=學員姓名, E=出席狀態
    const attendance = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      // 處理日期格式 - 可能是 Date 對象或字串
      let recordDate = '';
      if (row[0]) {
        if (row[0] instanceof Date) {
          recordDate = row[0].toLocaleDateString('zh-TW').replace(/\//g, '-');
          // 轉換為 YYYY-MM-DD 格式
          const parts = recordDate.split('-');
          if (parts.length === 3) {
            recordDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          }
        } else {
          recordDate = row[0].toString();
        }
      }
      
      const recordClass = row[1] ? row[1].toString() : '';
      const studentId = row[2] ? row[2].toString() : '';
      const studentName = row[3] ? row[3].toString() : '';
      const status = row[4] ? row[4].toString() : '';
      
      console.log(`處理記錄 ${i}: 日期=${recordDate}, 班別=${recordClass}, 學員ID=${studentId}, 狀態=${status}`);
      
      // 如果指定了日期和班別，則過濾匹配的記錄
      if (date && className) {
        console.log(`比較: 目標日期=${date}, 記錄日期=${recordDate}, 目標班別=${className}, 記錄班別=${recordClass}`);
        if (recordDate === date && recordClass === className) {
          const record = {
            date: recordDate,
            className: recordClass,
            studentId: studentId,
            studentName: studentName,
            status: status
          };
          attendance.push(record);
          console.log(`✅ 匹配記錄:`, record);
        }
      } else {
        // 如果沒有指定過濾條件，返回所有記錄
        attendance.push({
          date: recordDate,
          className: recordClass,
          studentId: studentId,
          studentName: studentName,
          status: status
        });
      }
    }

    console.log('成功解析出席數據:', attendance.length, '筆');
    return createResponse({
      success: true,
      attendance: attendance,
      count: attendance.length,
      query: { date: date, className: className }
    });
    
  } catch (error) {
    console.error('獲取出席記錄錯誤:', error);
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

    // 清空現有數據
    sheet.clear();

    if (students.length > 0) {
      // 準備標題行
      const firstStudent = students[0];
      const headers = Object.keys(firstStudent);
      
      // 準備數據行
      const rows = [headers];
      students.forEach(student => {
        const row = headers.map(header => student[header] || '');
        rows.push(row);
      });

      // 寫入數據
      sheet.getRange(1, 1, rows.length, headers.length).setValues(rows);
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

// 【修復版】同步出席記錄到 Google Sheets  
function syncAttendanceFixed(attendance) {
  try {
    console.log('【修復版】開始同步出席記錄，數量:', attendance ? attendance.length : 0);
    console.log('收到的出席記錄數據:', JSON.stringify(attendance));
    
    if (!attendance || !Array.isArray(attendance)) {
      throw new Error('無效的出席記錄格式 - 期望陣列格式');
    }

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // 嘗試獲取出席記錄工作表
    let sheet = spreadsheet.getSheetByName(SHEETS.ATTENDANCE);
    
    // 如果工作表不存在，創建它
    if (!sheet) {
      console.log('出席記錄工作表不存在，正在創建...');
      try {
        sheet = spreadsheet.insertSheet(SHEETS.ATTENDANCE);
        console.log('成功創建出席記錄工作表');
      } catch (createError) {
        console.error('創建工作表失敗:', createError);
        
        // 嘗試使用英文名稱創建
        try {
          sheet = spreadsheet.insertSheet('Attendance');
          console.log('使用英文名稱創建工作表成功');
        } catch (createError2) {
          throw new Error('無法創建出席記錄工作表: ' + createError2.toString());
        }
      }
    }

    // 確保有標題行
    const expectedHeaders = ['日期', '班別', '學員ID', '學員姓名', '出席狀態'];
    if (sheet.getLastRow() === 0) {
      console.log('添加標題行');
      sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
    }

    // 驗證並處理出席記錄數據
    if (attendance.length > 0) {
      console.log('處理出席記錄數據...');
      
      const rows = attendance.map((record, index) => {
        console.log(`處理第 ${index + 1} 筆記錄:`, record);
        
        return [
          record.date || new Date().toLocaleDateString('zh-TW'),
          record.class || record.className || '',
          record.studentId || '',
          record.studentName || '',
          record.status || ''
        ];
      });

      console.log('準備寫入的數據行:', rows);

      // 寫入數據到工作表
      const nextRow = sheet.getLastRow() + 1;
      console.log('寫入起始行號:', nextRow);
      
      try {
        sheet.getRange(nextRow, 1, rows.length, 5).setValues(rows);
        console.log('數據寫入成功');
      } catch (writeError) {
        console.error('數據寫入失敗:', writeError);
        throw new Error('寫入出席記錄失敗: ' + writeError.toString());
      }
    }

    console.log('出席記錄同步完成');
    
    return createResponse({
      success: true,
      message: `成功同步 ${attendance.length} 筆出席記錄到工作表 "${sheet.getName()}"`,
      count: attendance.length,
      sheetName: sheet.getName()
    });
    
  } catch (error) {
    console.error('【修復版】同步出席記錄失敗:', error);
    return createResponse({
      success: false,
      error: '出席記錄同步失敗: ' + error.toString(),
      details: {
        message: error.message,
        stack: error.stack
      }
    });
  }
}

// 【保留原有功能】舊版同步出席記錄 - 備用
function syncAttendance(attendance) {
  console.log('使用舊版同步函數，建議使用 syncAttendanceFixed');
  return syncAttendanceFixed(attendance);
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

// 新的測試函數
function doTest() {
  return createResponse({
    success: true,
    message: '學員管理系統 Google Apps Script 完整修復版運行正常',
    timestamp: new Date().toISOString(),
    version: '完整修復版 v1.2',
    functions: [
      'doGet', 'doPost', 'getStudents', 'getClasses', 'getSchedule', 
      'syncStudents', 'syncAttendanceFixed', 'syncAttendance (備用)', 
      'testScript', 'doTest'
    ]
  });
} 