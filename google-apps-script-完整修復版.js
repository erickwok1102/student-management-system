// 學員管理系統 Google Apps Script 完整修復版
// 請替換以下 ID 為你的實際 Google Sheets ID
const SPREADSHEET_ID = '1paCFI-QxJ3HjTrA4IOnZFQjuw2I7jh8KkTPiNSbfcoo';

// 工作表名稱配置 (使用英文名稱)
const SHEETS = {
  STUDENTS: 'students',
  SCHEDULE: 'schedule',
  ATTENDANCE: 'attendance'
};

// 每月報表設定
const REPORT_SHEET = 'monthly_report';
const REPORT_TIMEZONE = 'Asia/Hong_Kong';
const ATTENDANCE_PRESENT_STATUSES = ['出席', '遲到']; // 視為到課

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
      case 'generateMonthlyReport':
        return generateMonthlyAttendanceReportFromParams(e.parameter.year, e.parameter.month);
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
      case 'appendStudent':
        return appendStudent(data.students);  // 新增學員函數
      case 'syncAttendance':
        return syncAttendanceFixed(data.attendance);  // 使用修復版函數
      case 'updateStudentStatus':
        return updateStudentStatus(data.studentId, data.status);
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

// 解析日期（支援 Date 物件與常見字串格式）
function parseAttendanceDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const str = value.toString().trim();
  if (!str) return null;

  // YYYY-MM-DD 或 YYYY/MM/DD
  let match = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (match) {
    const y = parseInt(match[1], 10);
    const m = parseInt(match[2], 10) - 1;
    const d = parseInt(match[3], 10);
    return new Date(y, m, d);
  }

  // MM/DD/YYYY 或 M/D/YYYY
  match = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (match) {
    const m = parseInt(match[1], 10) - 1;
    const d = parseInt(match[2], 10);
    const y = parseInt(match[3], 10);
    return new Date(y, m, d);
  }

  return null;
}

// 產生上個月報表（供時間觸發器使用）
function runMonthlyAttendanceReport() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const end = new Date(today.getFullYear(), today.getMonth(), 0);
  return generateMonthlyAttendanceReport(start, end);
}

// 允許用 URL 參數手動生成報表
function generateMonthlyAttendanceReportFromParams(year, month) {
  if (!year || !month) {
    return createResponse({ success: false, error: 'Missing year or month' });
  }
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  if (!y || !m || m < 1 || m > 12) {
    return createResponse({ success: false, error: 'Invalid year or month' });
  }
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0);
  return generateMonthlyAttendanceReport(start, end);
}

// 核心：生成指定月份的出席報表與圖表
function generateMonthlyAttendanceReport(startDate, endDate) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const attendanceSheet = spreadsheet.getSheetByName(SHEETS.ATTENDANCE);

    if (!attendanceSheet) {
      return createResponse({ success: false, error: 'attendance 工作表不存在' });
    }

    const data = attendanceSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createResponse({ success: true, message: '沒有出席記錄可生成報表' });
    }

    const monthLabel = Utilities.formatDate(startDate, REPORT_TIMEZONE, 'yyyy-MM');
    const summaryMap = {};

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const dateValue = parseAttendanceDate(row[0]);
      if (!dateValue) continue;

      if (dateValue < startDate || dateValue > endDate) continue;

      const className = row[1] ? row[1].toString() : '';
      const studentId = row[2] ? row[2].toString() : '';
      const studentName = row[3] ? row[3].toString() : '';
      const status = row[4] ? row[4].toString() : '';

      if (!studentId) continue;

      if (!summaryMap[studentId]) {
        summaryMap[studentId] = {
          month: monthLabel,
          studentId: studentId,
          studentName: studentName,
          className: className,
          present: 0,
          late: 0,
          absent: 0,
          total: 0
        };
      }

      summaryMap[studentId].total += 1;

      if (status === '出席') summaryMap[studentId].present += 1;
      else if (status === '遲到') summaryMap[studentId].late += 1;
      else if (status === '缺席') summaryMap[studentId].absent += 1;
    }

    const rows = Object.values(summaryMap).sort((a, b) => {
      if (a.className === b.className) return a.studentId.localeCompare(b.studentId);
      return a.className.localeCompare(b.className);
    });

    const header = [
      '月份',
      '學員ID',
      '學員姓名',
      '班別',
      '到課次數',
      '出席次數',
      '遲到次數',
      '缺席次數',
      '總點名次數'
    ];

    const output = [header].concat(
      rows.map(r => ([
        r.month,
        r.studentId,
        r.studentName,
        r.className,
        r.present + r.late,
        r.present,
        r.late,
        r.absent,
        r.total
      ]))
    );

    let reportSheet = spreadsheet.getSheetByName(REPORT_SHEET);
    if (!reportSheet) {
      reportSheet = spreadsheet.insertSheet(REPORT_SHEET);
    }

    reportSheet.clear();
    reportSheet.getRange(1, 1, output.length, output[0].length).setValues(output);
    reportSheet.setFrozenRows(1);

    // 清除舊圖表
    reportSheet.getCharts().forEach(chart => reportSheet.removeChart(chart));

    if (rows.length > 0) {
      const nameRange = reportSheet.getRange(1, 3, output.length, 1);
      const attendanceRange = reportSheet.getRange(1, 5, output.length, 1);

      const chart = reportSheet.newChart()
        .setChartType(Charts.ChartType.COLUMN)
        .addRange(nameRange)
        .addRange(attendanceRange)
        .setPosition(1, 11, 0, 0)
        .setOption('title', `上月到課次數 (${monthLabel})`)
        .setOption('legend', { position: 'none' })
        .setOption('hAxis', { title: '學員' })
        .setOption('vAxis', { title: '到課次數' })
        .build();

      reportSheet.insertChart(chart);
    }

    return createResponse({
      success: true,
      month: monthLabel,
      count: rows.length,
      message: `已生成 ${monthLabel} 的出席報表 (${rows.length} 位學員)`
    });

  } catch (error) {
    console.error('生成每月報表失敗:', error);
    return createResponse({ success: false, error: error.toString() });
  }
}

// 建立每月自動報表觸發器（每月1號早上6點）
function createMonthlyReportTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  const exists = triggers.some(t => t.getHandlerFunction() === 'runMonthlyAttendanceReport');

  if (!exists) {
    ScriptApp.newTrigger('runMonthlyAttendanceReport')
      .timeBased()
      .onMonthDay(1)
      .atHour(6)
      .create();
  }

  return createResponse({
    success: true,
    message: '每月報表觸發器已建立 (每月1號 06:00)',
    exists: exists
  });
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
      'syncStudents', 'appendStudent', 'syncAttendanceFixed', 'syncAttendance (備用)', 
      'testScript', 'doTest'
    ]
  });
}

// 🆕 新增學員函數 - 只添加新行，不覆蓋現有資料
function appendStudent(students) {
  try {
    console.log('開始新增學員，數量:', students ? students.length : 0);
    
    if (!students || !Array.isArray(students)) {
      throw new Error('無效的學員資料格式');
    }

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(SHEETS.STUDENTS);
    
    // 如果工作表不存在，創建它並添加標題行
    if (!sheet) {
      console.log('創建學員資料工作表');
      sheet = spreadsheet.insertSheet(SHEETS.STUDENTS);
      
      // 添加標題行
      const headers = [
        'id', 'name', 'nickname', 'class', 'phone', 'email', 'birthday',
        'emergency_contact', 'emergency_phone', 'status', 'remarks', 'createdAt'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }

    // 檢查是否已有標題行
    const existingData = sheet.getDataRange().getValues();
    if (existingData.length === 0) {
      // 如果完全空白，添加標題行
      const headers = [
        'id', 'name', 'nickname', 'class', 'phone', 'email', 'birthday',
        'emergency_contact', 'emergency_phone', 'status', 'remarks', 'createdAt'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }

    // 添加新學員資料（使用 appendRow 避免覆蓋）
    students.forEach(student => {
      const rowData = [
        student.id || '',
        student.name || '',
        student.nickname || '',
        student.class || '',
        student.phone || '',
        student.email || '',
        student.birthday || '',
        student.emergencyContact || student.emergency_contact || '',  // 支援兩種欄位名稱
        student.emergencyPhone || student.emergency_phone || '',      // 支援兩種欄位名稱
        student.status || '在讀',
        student.remarks || '',
        student.createdAt || new Date().toLocaleDateString('zh-TW')
      ];
      
      sheet.appendRow(rowData);
      console.log(`新增學員: ${student.name} (${student.class})`);
    });

    console.log(`成功新增 ${students.length} 位學員`);

    return createResponse({
      success: true,
      count: students.length,
      message: `成功新增 ${students.length} 位學員`
    });

  } catch (error) {
    console.error('新增學員失敗:', error);
    return createResponse({
      success: false,
      error: error.toString()
    });
  }
}

// 更新單一學員的狀態（用 ID 搵行，只改 status 一格）
function updateStudentStatus(studentId, status) {
  try {
    console.log('更新學員狀態:', studentId, '->', status);

    if (!studentId || !status) {
      throw new Error('缺少 studentId 或 status');
    }

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEETS.STUDENTS);

    if (!sheet) {
      throw new Error('學員資料工作表不存在');
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      throw new Error('沒有學員資料');
    }

    // 用標題行搵 id 同 status 欄位位置，避免欄位順序改變時出錯
    const headers = data[0].map(h => String(h).trim().toLowerCase());
    const idCol = headers.indexOf('id');
    const statusCol = headers.indexOf('status');

    if (idCol === -1 || statusCol === -1) {
      throw new Error('工作表缺少 id 或 status 標題欄');
    }

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idCol]).trim() === String(studentId).trim()) {
        sheet.getRange(i + 1, statusCol + 1).setValue(status);
        console.log(`已更新第 ${i + 1} 行學員 ${studentId} 狀態為 ${status}`);

        return createResponse({
          success: true,
          message: `學員 ${studentId} 狀態已更新為「${status}」`,
          studentId: studentId,
          status: status
        });
      }
    }

    throw new Error(`找不到學員 ID: ${studentId}`);

  } catch (error) {
    console.error('更新學員狀態失敗:', error);
    return createResponse({
      success: false,
      error: error.toString()
    });
  }
}

