// Vercel Serverless Function - 同步學員到 Google Sheets
const { GoogleSpreadsheet } = require('google-spreadsheet');

export default async function handler(req, res) {
  // 設定 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { students, action = 'sync' } = req.body;

    if (!students || !Array.isArray(students)) {
      return res.status(400).json({ error: '無效的學員資料' });
    }

    // 連接 Google Sheets
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);
    
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
    });

    await doc.loadInfo();
    
    // 取得或創建工作表
    let sheet = doc.sheetsByTitle['學員資料'];
    if (!sheet) {
      sheet = await doc.addSheet({ title: '學員資料' });
    }

    // 清空並設定標題行
    await sheet.clear();
    await sheet.setHeaderRow([
      'ID', '姓名', '別名', '班別', '出生日期', '電話', 
      'Email', '備註', '狀態', '創建日期', '緊急聯絡人', '緊急聯絡電話'
    ]);

    // 準備資料行
    const rows = students.map(student => ({
      'ID': student.id || '',
      '姓名': student.name || '',
      '別名': student.nickname || '',
      '班別': student.class || '',
      '出生日期': student.birthDate || '',
      '電話': student.phone || '',
      'Email': student.email || '',
      '備註': student.remarks || '',
      '狀態': student.status || '在讀',
      '創建日期': student.createdAt || new Date().toLocaleDateString(),
      '緊急聯絡人': student.emergencyContactName || '',
      '緊急聯絡電話': student.emergencyContactPhone || ''
    }));

    // 批量新增資料
    if (rows.length > 0) {
      await sheet.addRows(rows);
    }

    res.status(200).json({
      success: true,
      message: `成功同步 ${rows.length} 筆學員資料`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('同步失敗:', error);
    res.status(500).json({
      success: false,
      error: '同步失敗: ' + error.message
    });
  }
} 