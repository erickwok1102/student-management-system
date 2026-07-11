// Vercel Serverless Function - 更新單一學員狀態到 Google Sheets

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

        const { studentId, status } = req.body;

        if (!studentId || !status) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: studentId and status are required'
            });
        }

        // 呼叫 Google Apps Script 更新學員狀態
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'updateStudentStatus',
                studentId: studentId,
                status: status
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
                message: data.message || '學員狀態更新成功',
                studentId: data.studentId,
                status: data.status
            });
        } else {
            throw new Error(data.error || '更新失敗');
        }

    } catch (error) {
        console.error('Update student error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.toString()
        });
    }
}
