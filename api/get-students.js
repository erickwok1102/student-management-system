// Vercel Serverless Function - 從 Google Sheets 讀取學員資料
const { GoogleSpreadsheet } = require('google-spreadsheet');

export default async function handler(req, res) {
  // 設定 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 連接 Google Sheets
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);
    
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
    });

    await doc.loadInfo();
    
    // 取得學員資料工作表
    const sheet = doc.sheetsByTitle['學員資料'];
    if (!sheet) {
      return res.status(200).json({
        success: true,
        students: [],
        message: '學員資料工作表不存在'
      });
    }

    // 讀取所有行
    const rows = await sheet.getRows();
    
    // 轉換為前端格式
    const students = rows.map(row => ({
      id: row.get('ID') || '',
      name: row.get('姓名') || '',
      nickname: row.get('別名') || '',
      class: row.get('班別') || '',
      birthDate: row.get('出生日期') || '',
      phone: row.get('電話') || '',
      email: row.get('Email') || '',
      remarks: row.get('備註') || '',
      status: row.get('狀態') || '在讀',
      createdAt: row.get('創建日期') || '',
      emergencyContactName: row.get('緊急聯絡人') || '',
      emergencyContactPhone: row.get('緊急聯絡電話') || ''
    }));

    res.status(200).json({
      success: true,
      students: students,
      count: students.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('讀取失敗:', error);
    res.status(500).json({
      success: false,
      error: '讀取失敗: ' + error.message,
      students: []
    });
  }
} 