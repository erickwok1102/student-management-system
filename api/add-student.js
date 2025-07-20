// Vercel Serverless Function - 新增單一學員到 Google Sheets

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

        const {
            id, name, nickname, class: className, phone, email, 
            birthday, emergency_contact, emergency_phone, 
            status, remarks, createdAt
        } = req.body;

        if (!id || !name) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields: id and name are required' 
            });
        }

        // 呼叫 Google Apps Script 新增學員
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'addStudentRow',
                student: {
                    id,
                    name,
                    nickname: nickname || '',
                    class: className || '',
                    phone: phone || '',
                    email: email || '',
                    birthday: birthday || '',
                    emergency_contact: emergency_contact || '',
                    emergency_phone: emergency_phone || '',
                    status: status || '在讀',
                    remarks: remarks || '',
                    createdAt: createdAt || new Date().toLocaleDateString('zh-TW')
                }
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
                message: `學員「${name}」已成功新增`,
                studentId: id
            });
        } else {
            res.status(400).json({
                success: false,
                error: data.error || '新增學員失敗',
                message: data.message || '請檢查 Google Apps Script 設定'
            });
        }

    } catch (error) {
        console.error('新增學員錯誤:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
} 