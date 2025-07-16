// 測試環境變數的 API 端點
export default async function handler(req, res) {
    // 檢查環境變數
    const { GOOGLE_APPS_SCRIPT_URL } = process.env;
    
    // 返回診斷信息
    res.status(200).json({
        hasGoogleAppsScriptUrl: !!GOOGLE_APPS_SCRIPT_URL,
        urlLength: GOOGLE_APPS_SCRIPT_URL ? GOOGLE_APPS_SCRIPT_URL.length : 0,
        urlEndsWithExec: GOOGLE_APPS_SCRIPT_URL ? GOOGLE_APPS_SCRIPT_URL.endsWith('/exec') : false,
        urlSample: GOOGLE_APPS_SCRIPT_URL ? 
            GOOGLE_APPS_SCRIPT_URL.substring(0, 50) + '...' : 
            'Not Set',
        timestamp: new Date().toISOString(),
        message: GOOGLE_APPS_SCRIPT_URL ? 
            'Environment variable is set' : 
            'GOOGLE_APPS_SCRIPT_URL environment variable is missing'
    });
} 