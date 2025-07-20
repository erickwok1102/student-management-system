// Vercel Serverless Function - 同步出席記錄到 Google Sheets

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

        const { attendance } = req.body;

        if (!attendance || !Array.isArray(attendance)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid request body. Expected attendance array.' 
            });
        }

        // 呼叫 Google Apps Script
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'syncAttendance',
                attendance: attendance
            }),
            redirect: 'follow'
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success) {
            res.status(200).json({
                success: true,
                message: data.message || '出席記錄同步成功',
                count: data.count || attendance.length
            });
        } else {
            throw new Error(data.error || '同步出席記錄失敗');
        }

    } catch (error) {
        console.error('Sync attendance error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.toString()
        });
    }
}
