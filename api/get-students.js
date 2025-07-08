export default async function handler(req, res) {
    if (req.method !== 'GET') {
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

        // 呼叫 Google Apps Script
        const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?action=getStudents`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.success) {
            res.status(200).json({
                success: true,
                count: data.students ? data.students.length : 0,
                students: data.students || [],
                message: `成功載入 ${data.students ? data.students.length : 0} 筆學員資料`
            });
        } else {
            throw new Error(data.error || '載入失敗');
        }

    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.toString()
        });
    }
}
