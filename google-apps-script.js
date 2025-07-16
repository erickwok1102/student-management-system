// Google Apps Script 代碼
// 請複製此代碼到 Google Apps Script 編輯器中

// Google Sheets ID
const SHEET_ID = '1paCFI-QxJ3HjTrA4IOnZFQjuw2I7jh8KkTPiNSbfcoo';

// 主要處理函數
function doGet(e) {
  const action = e.parameter.action;
  
  try {
    switch (action) {
      case 'getStudents':
        return getStudents();
      default:
        return ContentService
          .createTextOutput(JSON.stringify({ success: false, error: 'Invalid action' }))
          .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
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
        return ContentService
          .createTextOutput(JSON.stringify({ success: false, error: 'Invalid action' }))
          .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 讀取學員資料
function getStudents() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: true, 
          students: [], 
          message: '沒有學員資料' 
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const headers = data[0];
    const students = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const student = {};
      
      headers.forEach((header, index) => {
        student[header] = row[index] || '';
      });
      
      students.push(student);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        students: students,
        count: students.length,
        message: `成功載入 ${students.length} 筆學員資料`
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 同步學員資料
function syncStudents(students) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    
    // 清空現有資料
    sheet.clear();
    
    // 設定標題行
    const headers = ['id', 'name', 'nickname', 'class', 'phone', 'email', 'status', 'remarks', 'createdAt'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // 新增學員資料
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
        student.createdAt || ''
      ]);
      
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        message: `成功同步 ${students.length} 筆學員資料`,
        count: students.length,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 測試函數
function testGetStudents() {
  const result = getStudents();
  console.log(result.getContent());
}

function testSyncStudents() {
  const testData = [
    {
      id: '1',
      name: '測試學員',
      nickname: 'Test',
      class: '數學班',
      phone: '0912345678',
      email: 'test@example.com',
      status: '在讀',
      remarks: '測試資料',
      createdAt: '2024/01/01'
    }
  ];
  
  const result = syncStudents(testData);
  console.log(result.getContent());
} 