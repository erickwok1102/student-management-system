const { GoogleSpreadsheet } = require('google-spreadsheet');

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // 檢查環境變數
        const { GOOGLE_SHEET_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY } = process.env;
        
        if (!GOOGLE_SHEET_ID || !GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
            return res.status(500).json({ 
                success: false, 
                error: 'Missing Google Sheets configuration',
                debug: {
                    hasSheetId: !!GOOGLE_SHEET_ID,
                    hasClientEmail: !!GOOGLE_CLIENT_EMAIL,
                    hasPrivateKey: !!GOOGLE_PRIVATE_KEY
                }
            });
        }

        // 初始化 Google Sheets
        const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID);
        
        // 使用 Service Account 認證
        await doc.useServiceAccountAuth({
            client_email: GOOGLE_CLIENT_EMAIL,
            private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
        });

        // 載入文件資訊
        await doc.loadInfo();
        
        // 取得第一個工作表
        const sheet = doc.sheetsByIndex[0];
        
        // 讀取所有行
        const rows = await sheet.getRows();
        
        // 轉換為學員資料格式
        const students = rows.map(row => ({
            id: row.id || Date.now().toString(),
            name: row.name || row['姓名'] || '',
            nickname: row.nickname || row['別名'] || '',
            class: row.class || row['班別'] || '',
            phone: row.phone || row['電話'] || '',
            email: row.email || row['信箱'] || '',
            status: row.status || row['狀態'] || '在讀',
            remarks: row.remarks || row['備註'] || '',
            createdAt: row.createdAt || row['建立日期'] || ''
        }));

        res.status(200).json({
            success: true,
            count: students.length,
            students: students,
            message: `成功載入 ${students.length} 筆學員資料`
        });

    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.toString()
        });
    }
}
