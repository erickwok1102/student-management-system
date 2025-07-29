// Vercel Serverless Function - 同步學員資料到 Google Sheets

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

        const { students, action } = req.body;

        if (!students || !Array.isArray(students)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid request body. Expected students array.' 
            });
        }

        console.log('收到的action:', action);
        console.log('學員數量:', students.length);

        // 決定要使用的action - 預設為appendStudent來避免覆蓋資料
        const apiAction = action === 'syncStudents' ? 'syncStudents' : 'appendStudent';
        
        console.log('使用的API action:', apiAction);

        // 呼叫 Google Apps Script (添加 redirect: 'follow' 處理 302 重定向)
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: apiAction,
                students: students
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
                message: data.message || '學員資料同步成功',
                count: data.count || students.length
            });
        } else {
            throw new Error(data.error || '同步失敗');
        }

    } catch (error) {
        console.error('Sync students error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.toString()
        });
    }
} 