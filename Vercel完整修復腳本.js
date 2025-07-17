// 🚨 Vercel 版本完整修復腳本
// 修復所有問題並添加缺失的功能

console.log('🔧 開始完整修復 Vercel 版本...');

// 1. 修復 className.trim 錯誤 - 重寫 updateClassOptions 函數
window.updateClassOptions = function(classData) {
    const selects = [
        document.getElementById('studentClass'),
        document.getElementById('attendanceClass')
    ];
    
    selects.forEach(select => {
        if (select) {
            select.innerHTML = '<option value="">請選擇班別</option>';
            
            let classNames = [];
            
            // 處理字符串陣列 (新方式)
            if (Array.isArray(classData) && classData.length > 0 && typeof classData[0] === 'string') {
                classNames = classData.filter(name => name && name.trim());
            }
            // 處理物件陣列 (舊方式，容錯處理)
            else if (Array.isArray(classData)) {
                classNames = classData.map(item => {
                    if (typeof item === 'object' && item !== null) {
                        return item.class_id || item['class_name'] || item['名稱'] || item.name || item.className || item['班別'] || '';
                    }
                    return item || '';
                }).filter(name => name && typeof name === 'string' && name.trim());
            }
            
            // 去重並排序
            const uniqueClassNames = [...new Set(classNames)].sort();
            
            uniqueClassNames.forEach(className => {
                if (typeof className === 'string' && className.trim()) {
                    const option = document.createElement('option');
                    option.value = className.trim();
                    option.textContent = className.trim();
                    select.appendChild(option);
                }
            });
            
            console.log('🎯 班別選項已更新:', uniqueClassNames);
        }
    });
};

// 2. 添加 loadClasses 函數 (從學員資料提取班別)
window.loadClasses = async function() {
    try {
        if (typeof showNotification !== 'undefined') {
            showNotification('正在載入班別資料...', 'warning');
        }
        
        const statusElement = document.getElementById('syncStatus');
        if (statusElement) {
            statusElement.textContent = '正在從 Google Sheets 載入班別資料...';
        }
        
        // 從學員資料中提取班別
        const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw_m3SjHokYxU-eUkFrMtcrVXnoxSGhRAfuUxYDt6P81UwmxcMrkKjz-h7A4teL8kKIjQ/exec';
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL + '?action=getStudents', {
            method: 'GET',
            redirect: 'follow',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success && result.students) {
            // 從學員資料中提取班別
            const classNames = new Set();
            
            result.students.forEach(student => {
                if (student && typeof student === 'object') {
                    const className = student.class || student['班別'] || student.class_id || student['class'] || student['班組'];
                    if (className && typeof className === 'string' && className.trim()) {
                        classNames.add(className.trim());
                    }
                }
            });
            
            const uniqueClasses = Array.from(classNames);
            console.log('🎯 從學員資料提取的班別:', uniqueClasses);
            
            if (uniqueClasses.length > 0) {
                updateClassOptions(uniqueClasses);
                if (typeof showNotification !== 'undefined') {
                    showNotification(`✅ 成功載入 ${uniqueClasses.length} 個班別`, 'success');
                }
                if (statusElement) {
                    statusElement.textContent = `✅ 成功載入 ${uniqueClasses.length} 個班別 (${new Date().toLocaleString('zh-TW')})`;
                }
            } else {
                if (typeof showNotification !== 'undefined') {
                    showNotification('⚠️ 沒有找到班別資料', 'warning');
                }
                if (statusElement) {
                    statusElement.textContent = '⚠️ 沒有找到班別資料';
                }
            }
        } else {
            throw new Error(result.error || '載入學員資料失敗');
        }
    } catch (error) {
        console.error('載入班別失敗:', error);
        if (typeof showNotification !== 'undefined') {
            showNotification('❌ 載入班別失敗: ' + error.message, 'error');
        }
        const statusElement = document.getElementById('syncStatus');
        if (statusElement) {
            statusElement.textContent = `❌ 載入班別失敗: ${error.message}`;
        }
    }
};

// 3. 添加載入班別按鈕到界面
function addLoadClassesButton() {
    // 找到載入學員按鈕
    const loadStudentsButton = document.querySelector('button[onclick*="loadFromCloud"]');
    if (loadStudentsButton && !document.getElementById('loadClassesBtn')) {
        // 創建載入班別按鈕
        const loadClassesBtn = document.createElement('button');
        loadClassesBtn.id = 'loadClassesBtn';
        loadClassesBtn.className = loadStudentsButton.className;
        loadClassesBtn.innerHTML = '📥 載入班別';
        loadClassesBtn.onclick = loadClasses;
        
        // 插入到載入學員按鈕後面
        loadStudentsButton.parentNode.insertBefore(loadClassesBtn, loadStudentsButton.nextSibling);
        
        console.log('✅ 已添加載入班別按鈕');
    }
}

// 4. 修復現有的 loadFromCloud 函數 (如果需要)
const originalLoadFromCloud = window.loadFromCloud;
window.loadFromCloud = async function() {
    try {
        // 使用直接連接方式而不是 Vercel API
        const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw_m3SjHokYxU-eUkFrMtcrVXnoxSGhRAfuUxYDt6P81UwmxcMrkKjz-h7A4teL8kKIjQ/exec';
        
        if (typeof showNotification !== 'undefined') {
            showNotification('正在從雲端載入...', 'warning');
        }
        
        const statusElement = document.getElementById('syncStatus');
        if (statusElement) {
            statusElement.textContent = '正在從 Google Sheets 載入資料...';
        }
        
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL + '?action=getStudents', {
            method: 'GET',
            redirect: 'follow',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success && result.students) {
            if (typeof students !== 'undefined') {
                students = result.students;
            }
            localStorage.setItem('studentData', JSON.stringify(result.students));
            
            // 調用顯示函數
            if (typeof displayStudents === 'function') {
                displayStudents();
            }
            if (typeof updateStatistics === 'function') {
                updateStatistics();
            }
            
            if (typeof showNotification !== 'undefined') {
                showNotification(`✅ 成功載入 ${result.count} 筆學員資料`, 'success');
            }
            if (statusElement) {
                statusElement.textContent = `✅ 成功載入 ${result.count} 筆資料 (${new Date().toLocaleString('zh-TW')})`;
            }
        } else {
            throw new Error(result.error || '載入失敗');
        }
    } catch (error) {
        console.error('載入失敗:', error);
        if (typeof showNotification !== 'undefined') {
            showNotification('❌ 載入失敗: ' + error.message, 'error');
        }
        const statusElement = document.getElementById('syncStatus');
        if (statusElement) {
            statusElement.textContent = `❌ 載入失敗: ${error.message}`;
        }
    }
};

// 5. 立即執行修復
setTimeout(() => {
    addLoadClassesButton();
    console.log('✅ Vercel 版本完整修復完成！');
    console.log('📋 新功能：');
    console.log('  - 修復了 className.trim 錯誤');
    console.log('  - 添加了載入班別按鈕');
    console.log('  - 修復了 API 調用問題');
    
    // 詢問是否測試
    if (confirm('🤖 修復完成！是否立即測試載入班別功能？')) {
        loadClasses();
    }
}, 1000);

console.log('🔄 修復腳本已載入，1秒後完成初始化...'); 