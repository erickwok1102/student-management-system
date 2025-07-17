// Vercel 版本修復腳本 - 在瀏覽器控制台執行
// 使用方法：
// 1. 打開 https://student-management-system-ten-lac.vercel.app/
// 2. 按 F12 打開開發者工具
// 3. 切換到 Console 標籤
// 4. 複製並貼上下面的代碼，按 Enter 執行

console.log('🔧 開始修復 Vercel 版本的 className.trim 問題...');

// 修復 updateClassOptions 函數
window.updateClassOptions = function(classData) {
    console.log('📊 收到的班別資料:', classData);
    
    const selects = [
        document.getElementById('studentClass'),
        document.getElementById('attendanceClass')
    ];
    
    selects.forEach(select => {
        if (select) {
            select.innerHTML = '<option value="">請選擇班別</option>';
            
            // 處理不同的資料格式
            let classNames = [];
            
            if (Array.isArray(classData)) {
                classNames = classData.map(item => {
                    // 處理對象格式 (Google Apps Script 返回)
                    if (typeof item === 'object' && item !== null) {
                        return item.class_id || item['名稱'] || item.name || item.className || '';
                    }
                    // 處理字符串格式
                    return item || '';
                });
            }
            
            console.log('📝 提取的班別名稱:', classNames);
            
            classNames.forEach(className => {
                if (className && typeof className === 'string' && className.trim()) {
                    const option = document.createElement('option');
                    option.value = className.trim();
                    option.textContent = className.trim();
                    select.appendChild(option);
                    console.log('✅ 添加班別選項:', className.trim());
                }
            });
        }
    });
    
    console.log('🎉 updateClassOptions 修復完成！');
};

// 修復 loadClasses 函數
window.loadClasses = async function() {
    try {
        console.log('📚 開始載入班別資料...');
        
        if (typeof showNotification === 'function') {
            showNotification('正在載入班別資料...', 'warning');
        }
        
        const statusElement = document.getElementById('syncStatus');
        if (statusElement) {
            statusElement.textContent = '正在從 Google Sheets 載入班別資料...';
        }
        
        const response = await fetch(window.location.origin + '/api/get-classes');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📊 API 返回結果:', result);
        
        if (result.success && result.classes) {
            // 使用修復後的函數
            updateClassOptions(result.classes);
            
            if (typeof showNotification === 'function') {
                showNotification(`✅ 成功載入 ${result.count} 個班別`, 'success');
            }
            
            if (statusElement) {
                statusElement.textContent = `✅ 成功載入 ${result.count} 個班別 (${new Date().toLocaleString('zh-TW')})`;
            }
            
            console.log('🎉 班別載入完成！');
        } else {
            throw new Error(result.error || '載入班別失敗');
        }
    } catch (error) {
        console.error('❌ 載入班別失敗:', error);
        
        if (typeof showNotification === 'function') {
            showNotification('❌ 載入班別失敗，請檢查 Google Apps Script 設定', 'error');
        }
        
        const statusElement = document.getElementById('syncStatus');
        if (statusElement) {
            statusElement.textContent = `❌ 載入班別失敗: ${error.message}`;
        }
    }
};

console.log('✅ 修復腳本載入完成！');
console.log('🎯 現在可以點擊「載入班別資料」按鈕測試了');
console.log('📋 如果需要手動測試，執行: loadClasses()');

// 自動嘗試載入班別（如果頁面已完全載入）
if (document.readyState === 'complete') {
    console.log('🚀 自動載入班別資料...');
    setTimeout(() => {
        loadClasses();
    }, 1000);
} else {
    console.log('⏳ 等待頁面載入完成後再自動載入班別...');
    window.addEventListener('load', () => {
        setTimeout(() => {
            console.log('🚀 頁面載入完成，自動載入班別資料...');
            loadClasses();
        }, 1000);
    });
} 