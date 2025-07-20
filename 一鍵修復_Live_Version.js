// 🚀 一鍵修復 Vercel Live Version
// 直接在 https://student-management-system-ten-lac.vercel.app/ 的控制台執行

console.log('🚀 開始修復 Vercel Live Version...');

// 1. 修復 loadClasses 函數
window.loadClasses = async function() {
    try {
        console.log('🎯 從現有學員資料提取班別...');
        
        if (!window.students || window.students.length === 0) {
            console.log('⚠️ 沒有學員資料，先載入學員');
            if (typeof window.loadFromCloud === 'function') {
                await window.loadFromCloud();
            }
        }
        
        // 直接從現有學員陣列提取班別
        const classSet = new Set();
        window.students.forEach(student => {
            // 檢查班別欄位
            const className = student.class || student['班別'] || student.class_id || student['班組'];
            if (className && typeof className === 'string' && className.trim()) {
                classSet.add(className.trim());
            }
        });
        
        const uniqueClasses = Array.from(classSet).sort();
        console.log('🎯 提取的班別:', uniqueClasses);
        
        if (uniqueClasses.length > 0) {
            updateClassSelectSimple(uniqueClasses);
            if (typeof window.showNotification === 'function') {
                window.showNotification(`✅ 從 ${window.students.length} 位學員中找到 ${uniqueClasses.length} 個班別`, 'success');
            }
        } else {
            if (typeof window.showNotification === 'function') {
                window.showNotification('⚠️ 學員資料中沒有班別資訊', 'warning');
            }
        }
        
    } catch (error) {
        console.error('提取班別失敗:', error);
        if (typeof window.showNotification === 'function') {
            window.showNotification('❌ 提取班別失敗: ' + error.message, 'error');
        }
    }
};

// 2. 添加 updateClassSelectSimple 函數
window.updateClassSelectSimple = function(classes) {
    const selects = [
        document.getElementById('studentClass'),
        document.getElementById('attendanceClass')
    ];
    
    selects.forEach(select => {
        if (select) {
            select.innerHTML = '<option value="">請選擇班別</option>';
            classes.forEach(className => {
                const option = document.createElement('option');
                option.value = className;
                option.textContent = className;
                select.appendChild(option);
            });
        }
    });
    console.log('✅ 班別選單已更新');
};

// 3. 修復 startAttendance 函數
window.startAttendance = function() {
    const date = document.getElementById('attendanceDate').value;
    const className = document.getElementById('attendanceClass').value;
    
    if (!date || !className) {
        if (typeof window.showNotification === 'function') {
            window.showNotification('請選擇日期和班別', 'error');
        }
        return;
    }
    
    // 直接從學員陣列過濾該班別的學員
    const classStudents = window.students.filter(student => {
        const studentClass = student.class || student['班別'] || student.class_id || student['班組'];
        return studentClass && studentClass.trim() === className;
    });
    
    console.log(`🎯 ${className} 班找到 ${classStudents.length} 位學員:`, classStudents);
    
    if (classStudents.length === 0) {
        if (typeof window.showNotification === 'function') {
            window.showNotification(`${className} 班沒有學員資料`, 'warning');
        }
        return;
    }
    
    window.currentAttendanceDate = date;
    window.currentAttendanceClass = className;
    
    // 顯示點名列表
    if (typeof window.displayAttendanceList === 'function') {
        window.displayAttendanceList(classStudents);
    }
    
    const attendanceCard = document.getElementById('attendanceListCard');
    if (attendanceCard) {
        attendanceCard.style.display = 'block';
    }
    
    // 設置點名按鈕事件監聽器
    if (typeof window.setupAttendanceButtons === 'function') {
        window.setupAttendanceButtons();
    }
    
    if (typeof window.showNotification === 'function') {
        window.showNotification(`開始 ${className} 班的點名 (${classStudents.length} 位學員)`, 'success');
    }
};

// 4. 修復可能的 updateClassOptions 函數 (移除有問題的版本)
if (typeof window.updateClassOptions === 'function') {
    console.log('🔧 移除有問題的 updateClassOptions 函數');
    window.updateClassOptions = window.updateClassSelectSimple;
}

// 5. 自動執行修復
setTimeout(() => {
    console.log('✅ 修復完成！正在自動載入班別...');
    
    // 如果有學員資料，立即提取班別
    if (window.students && window.students.length > 0) {
        window.loadClasses();
    }
    
    console.log('🎯 Live Version 修復完成！');
    console.log('📋 修復內容:');
    console.log('  ✅ 修復 className.trim 錯誤');
    console.log('  ✅ 簡化班別載入邏輯');
    console.log('  ✅ 修復點名功能');
    console.log('  ✅ 只使用學員資料，避免複雜邏輯');
    
    // 彈出確認
    if (confirm('🎉 Live Version 修復完成！\n\n現在可以正常使用班別載入和點名功能了。\n\n是否要測試載入班別？')) {
        window.loadClasses();
    }
    
}, 1000);

console.log('🔄 修復腳本已載入，1秒後完成...'); 