const { GoogleSpreadsheet } = require('google-spreadsheet');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
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

        // 取得請求資料
        const { students } = req.body;
        
        if (!students || !Array.isArray(students)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid students data'
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
        let sheet = doc.sheetsByIndex[0];
        
        // 如果沒有工作表，創建一個
        if (!sheet) {
            sheet = await doc.addSheet({
                title: '學員資料',
                headerValues: ['id', 'name', 'nickname', 'class', 'phone', 'email', 'status', 'remarks', 'createdAt']
            });
        }

        // 清空現有資料
        await sheet.clear();
        
        // 設定標題行
        await sheet.setHeaderRow(['id', 'name', 'nickname', 'class', 'phone', 'email', 'status', 'remarks', 'createdAt']);
        
        // 新增學員資料
        if (students.length > 0) {
            const rows = students.map(student => ({
                id: student.id || '',
                name: student.name || '',
                nickname: student.nickname || '',
                class: student.class || '',
                phone: student.phone || '',
                email: student.email || '',
                status: student.status || '在讀',
                remarks: student.remarks || '',
                createdAt: student.createdAt || ''
            }));

            await sheet.addRows(rows);
        }

        res.status(200).json({
            success: true,
            message: `成功同步 ${students.length} 筆學員資料到 Google Sheets`,
            count: students.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Sync students error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.toString()
        });
    }
}
