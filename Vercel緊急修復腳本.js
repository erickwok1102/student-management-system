// 🚨 Vercel 版本緊急修復腳本
// 在瀏覽器控制台中運行此腳本來立即修復班別載入問題

console.log('🔧 開始修復 Vercel 版本的班別載入問題...');

// 1. 修復 loadClasses 函數
window.loadClasses = async function() {
    try {
        showNotification('正在載入班別資料...', 'warning');
        document.getElementById('syncStatus').textContent = '正在從 Google Sheets 載入班別資料...';
        
        // 從學員資料中提取班別資訊 (更穩定的方法)
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
            // 從學員資料中提取唯一的班別名稱
            const classNames = new Set();
            
            result.students.forEach(student => {
                if (student && typeof student === 'object') {
                    // 檢查多種可能的班別欄位名稱
                    const className = student.class || student['班別'] || student.class_id || student['class'] || student['班組'];
                    if (className && typeof className === 'string' && className.trim()) {
                        classNames.add(className.trim());
                    }
                }
            });
            
            const uniqueClasses = Array.from(classNames);
            console.log('🎯 從學員資料提取的班別:', uniqueClasses);
            
            if (uniqueClasses.length > 0) {
                updateClassOptions(uniqueClasses); // 直接傳遞字符串陣列
                showNotification(`✅ 成功載入 ${uniqueClasses.length} 個班別`, 'success');
                document.getElementById('syncStatus').textContent = `✅ 成功載入 ${uniqueClasses.length} 個班別 (${new Date().toLocaleString('zh-TW')})`;
            } else {
                showNotification('⚠️ 沒有找到班別資料，請檢查學員資料中的班別欄位', 'warning');
                document.getElementById('syncStatus').textContent = '⚠️ 沒有找到班別資料';
            }
        } else {
            throw new Error(result.error || '載入學員資料失敗');
        }
    } catch (error) {
        console.error('載入班別失敗:', error);
        showNotification('❌ 載入班別失敗，請檢查 Google Apps Script 設定', 'error');
        document.getElementById('syncStatus').textContent = `❌ 載入班別失敗: ${error.message}`;
    }
};

// 2. 修復 updateClassOptions 函數
window.updateClassOptions = function(classData) {
    const selects = [
        document.getElementById('studentClass'),
        document.getElementById('attendanceClass')
    ];
    
    selects.forEach(select => {
        if (select) {
            select.innerHTML = '<option value="">請選擇班別</option>';
            
            let classNames = [];
            
            // 如果傳入的直接是字符串陣列 (新的簡化方式)
            if (Array.isArray(classData) && classData.length > 0 && typeof classData[0] === 'string') {
                classNames = classData.filter(name => name && name.trim());
            }
            // 如果是物件陣列 (舊的複雜方式)
            else if (Array.isArray(classData)) {
                classNames = classData.map(item => {
                    // 如果是對象，提取 class_id 或其他可能的班別名稱欄位
                    if (typeof item === 'object' && item !== null) {
                        return item.class_id || item['class_name'] || item['名稱'] || item.name || item.className || item['班別'] || '';
                    }
                    // 如果是字符串，直接使用
                    return item || '';
                }).filter(name => name && typeof name === 'string' && name.trim()); // 確保是有效的字符串
            }
            
            // 去重並排序
            const uniqueClassNames = [...new Set(classNames)].sort();
            
            uniqueClassNames.forEach(className => {
                const option = document.createElement('option');
                option.value = className.trim();
                option.textContent = className.trim();
                select.appendChild(option);
            });
            
            console.log('🎯 班別選項已更新:', uniqueClassNames);
        }
    });
};

// 3. 修復所有 API 調用，改為直接連接 Google Apps Script
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw_m3SjHokYxU-eUkFrMtcrVXnoxSGhRAfuUxYDt6P81UwmxcMrkKjz-h7A4teL8kKIjQ/exec';

// 修復 loadFromCloud 函數
window.loadFromCloud = async function() {
    try {
        showNotification('正在從雲端載入...', 'warning');
        document.getElementById('syncStatus').textContent = '正在從 Google Sheets 載入資料...';
        
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL + '?action=getStudents', {
            method: 'GET',
            redirect: 'follow',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success && result.students) {
            students = result.students;
            localStorage.setItem('studentData', JSON.stringify(students));
            displayStudents();
            updateStatistics();
            showNotification(`✅ 成功載入 ${result.count} 筆學員資料`, 'success');
            document.getElementById('syncStatus').textContent = `✅ 成功載入 ${result.count} 筆資料 (${new Date().toLocaleString('zh-TW')})`;
        } else {
            throw new Error(result.error || '載入失敗');
        }
    } catch (error) {
        console.error('載入失敗:', error);
        showNotification('❌ 載入失敗: ' + error.message, 'error');
        document.getElementById('syncStatus').textContent = `❌ 載入失敗: ${error.message}`;
    }
};

console.log('✅ Vercel 版本修復腳本載入完成！');
console.log('📋 現在可以點擊「📥 載入班別」按鈕測試了');

// 自動載入班別 (可選)
if (confirm('🤖 是否立即測試載入班別？')) {
    loadClasses();
} 