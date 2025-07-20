// Vercel 緊急更新腳本 - 在 Vercel 網站的瀏覽器 Console 中執行
// 這個腳本會檢查當前版本並嘗試強制刷新

console.log('🔍 檢查當前 Vercel 版本...');

// 檢查是否為修復版本
function checkVersion() {
    const hasNewButton = document.querySelector('button[onclick="syncAttendanceToCloud()"]');
    const buttonText = hasNewButton ? hasNewButton.textContent : '未找到';
    
    console.log('當前按鈕文字:', buttonText);
    
    if (buttonText.includes('自動上傳到 Google Sheets')) {
        console.log('✅ 已是最新版本！');
        alert('✅ 您的網站已是最新版本！\n\n功能包括：\n- 修復的點名按鈕\n- 自動上傳功能\n- 正確的記錄格式');
        return true;
    } else {
        console.log('❌ 仍是舊版本');
        alert('❌ 檢測到舊版本\n\n請按照以下步驟更新：\n1. 到 Vercel Dashboard\n2. 編輯 index.html\n3. 替換為修復版本的代碼');
        return false;
    }
}

// 嘗試強制刷新
function forceRefresh() {
    console.log('🔄 嘗試強制刷新...');
    
    // 清除所有緩存
    if ('caches' in window) {
        caches.keys().then(names => {
            names.forEach(name => {
                caches.delete(name);
            });
        });
    }
    
    // 強制重新載入
    window.location.reload(true);
}

// 顯示更新指南
function showUpdateGuide() {
    const guide = `
🚀 Vercel 更新指南

步驟 1: 打開新分頁
- 前往 https://vercel.com/dashboard

步驟 2: 找到項目
- 找到 "student-management-system-ten-lac"
- 點擊進入項目

步驟 3: 編輯代碼
- 點擊 "Functions" 或 "Source"
- 找到 "index.html" 文件
- 點擊編輯按鈕

步驟 4: 替換內容
- 刪除整個文件內容
- 聯絡開發者取得最新版本代碼
- 貼上新代碼並儲存

步驟 5: 等待部署
- Vercel 會自動重新部署
- 等待 1-2 分鐘後刷新此頁面
`;
    
    console.log(guide);
    alert(guide);
}

// 執行檢查
console.log('🚀 開始檢查版本...');
const isLatest = checkVersion();

if (!isLatest) {
    console.log('需要更新 Vercel 版本');
    showUpdateGuide();
    
    // 詢問是否嘗試強制刷新
    if (confirm('是否要嘗試強制刷新頁面？\n（這可能有助於載入最新版本）')) {
        forceRefresh();
    }
} 