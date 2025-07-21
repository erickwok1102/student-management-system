export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // 檢查環境變數
        const { GOOGLE_APPS_SCRIPT_URL } = process.env;
        
        if (!GOOGLE_APPS_SCRIPT_URL) {
            return res.status(500).json({ 
                success: false, 
                error: 'Missing Google Apps Script URL configuration',
                message: '請先設定 Google Apps Script Web App URL'
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

        // 呼叫 Google Apps Script
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'appendStudent',  // ✅ 改成這樣
                students: students
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.success) {
            res.status(200).json({
                success: true,
                message: `成功新增 ${students.length} 筆學員資料到 Google Sheets`,
                count: students.length,
                timestamp: new Date().toISOString()
            });
        } else {
            throw new Error(data.error || '新增失敗');
        }

    } catch (error) {
        console.error('Add students error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.toString()
        });
    }
}
