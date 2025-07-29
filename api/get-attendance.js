// 獲取出席記錄 API
export default async function handler(req, res) {
    // 設定 CORS 標頭
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 處理 OPTIONS 請求
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 只允許 GET 請求
    if (req.method !== 'GET') {
        res.status(405).json({ success: false, error: 'Method not allowed' });
        return;
    }

    try {
        const { date, className } = req.query;
        
        console.log('獲取出席記錄請求:', { date, className });
        
        // 檢查環境變數
        const GOOGLE_APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL;
        if (!GOOGLE_APPS_SCRIPT_URL) {
            console.error('Missing Google Apps Script URL configuration');
            res.status(500).json({ 
                success: false, 
                error: 'Missing Google Apps Script URL configuration' 
            });
            return;
        }

        // 構建 Google Apps Script 請求 URL
        const scriptUrl = new URL(GOOGLE_APPS_SCRIPT_URL);
        scriptUrl.searchParams.append('action', 'getAttendance');
        if (date) scriptUrl.searchParams.append('date', date);
        if (className) scriptUrl.searchParams.append('className', className);

        console.log('調用 Google Apps Script:', scriptUrl.toString());

        // 調用 Google Apps Script
        const response = await fetch(scriptUrl.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            },
            redirect: 'follow'
        });

        console.log('Google Apps Script 響應狀態:', response.status);

        if (!response.ok) {
            throw new Error(`Google Apps Script responded with status ${response.status}`);
        }

        const result = await response.json();
        console.log('Google Apps Script 回應:', result);

        res.status(200).json(result);

    } catch (error) {
        console.error('獲取出席記錄錯誤:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || '獲取出席記錄失敗' 
        });
    }
} 