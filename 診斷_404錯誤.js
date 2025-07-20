// 診斷 Vercel 404 錯誤腳本
// 在瀏覽器 Console 中執行此腳本

console.log('🔍 開始診斷 404 錯誤...');

// 檢查當前頁面資源
function checkResources() {
    console.log('📋 檢查頁面資源載入狀態：');
    
    // 檢查所有 script 標籤
    const scripts = document.querySelectorAll('script[src]');
    console.log(`發現 ${scripts.length} 個外部 script 文件`);
    
    scripts.forEach((script, index) => {
        console.log(`Script ${index + 1}: ${script.src}`);
    });
    
    // 檢查所有 link 標籤 (CSS)
    const links = document.querySelectorAll('link[href]');
    console.log(`發現 ${links.length} 個外部 link 文件`);
    
    links.forEach((link, index) => {
        console.log(`Link ${index + 1}: ${link.href}`);
    });
    
    // 檢查所有圖片
    const images = document.querySelectorAll('img[src]');
    console.log(`發現 ${images.length} 個圖片文件`);
    
    images.forEach((img, index) => {
        console.log(`Image ${index + 1}: ${img.src}`);
    });
}

// 檢查 API 端點
async function checkAPIEndpoints() {
    console.log('🔧 檢查 API 端點...');
    
    const endpoints = [
        '/api/get-students',
        '/api/sync-students', 
        '/api/sync-attendance'
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`檢查: ${endpoint}`);
            const response = await fetch(endpoint, { method: 'HEAD' });
            console.log(`${endpoint}: ${response.status} ${response.statusText}`);
        } catch (error) {
            console.error(`${endpoint}: 錯誤 - ${error.message}`);
        }
    }
}

// 檢查網路請求
function monitorNetworkRequests() {
    console.log('🌐 開始監控網路請求...');
    
    // 覆蓋 fetch 函數來監控請求
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const url = args[0];
        console.log(`📡 發送請求: ${url}`);
        
        return originalFetch.apply(this, args)
            .then(response => {
                if (!response.ok) {
                    console.error(`❌ 請求失敗: ${url} - ${response.status} ${response.statusText}`);
                } else {
                    console.log(`✅ 請求成功: ${url} - ${response.status}`);
                }
                return response;
            })
            .catch(error => {
                console.error(`❌ 網路錯誤: ${url} - ${error.message}`);
                throw error;
            });
    };
}

// 修復常見的 404 問題
function fixCommon404Issues() {
    console.log('🔧 嘗試修復常見 404 問題...');
    
    // 檢查是否有錯誤的相對路徑
    const allLinks = document.querySelectorAll('a[href], link[href], script[src], img[src]');
    
    allLinks.forEach(element => {
        const url = element.href || element.src;
        if (url && url.includes('/-')) {
            console.warn(`⚠️ 發現可疑路徑: ${url}`);
            console.log(`元素: `, element);
        }
    });
    
    // 檢查 base 標籤
    const baseTag = document.querySelector('base');
    if (baseTag) {
        console.log(`發現 base 標籤: ${baseTag.href}`);
    }
}

// 提供修復建議
function provideFixes() {
    console.log('💡 修復建議：');
    
    const fixes = [
        '1. 檢查 Vercel 項目配置',
        '2. 確認所有文件路徑都是正確的',
        '3. 檢查 vercel.json 配置文件',
        '4. 確認 API 路由文件存在',
        '5. 重新部署項目'
    ];
    
    fixes.forEach(fix => console.log(fix));
    
    // 顯示具體的修復步驟
    const detailedFix = `
🔧 詳細修復步驟：

1. 檢查 Vercel Dashboard:
   - 前往 https://vercel.com/dashboard
   - 找到項目 "student-management-system-ten-lac"
   - 檢查部署日誌

2. 檢查項目結構:
   - 確認 index.html 在根目錄
   - 確認 api/ 文件夾存在
   - 檢查 vercel.json 配置

3. 重新部署:
   - 在 Vercel Dashboard 點擊 "Redeploy"
   - 或者推送新的 commit 觸發重新部署

4. 如果問題持續:
   - 聯絡技術支援
   - 檢查 Vercel 狀態頁面
    `;
    
    console.log(detailedFix);
    alert(detailedFix);
}

// 執行診斷
console.log('🚀 開始完整診斷...');
checkResources();
monitorNetworkRequests();
fixCommon404Issues();

// 等待一下再檢查 API
setTimeout(() => {
    checkAPIEndpoints().then(() => {
        provideFixes();
    });
}, 1000); 