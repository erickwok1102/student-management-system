/**
 * api.js - API Call Functions
 */

/**
 * Fetch class list from server
 */
async function fetchClassList() {
    try {
        const response = await fetch(CONFIG.API.GET_CLASSES, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        if (result.success && result.classes) {
            updateClassSelect(result.classes);
        } else {
            throw new Error('無法獲取班別列表');
        }
    } catch (error) {
        showNotification('無法載入班別列表，使用預設選項', 'warning');

        const select = document.getElementById('studentClass');
        if (select) {
            select.innerHTML = `
                <option value="">請選擇班別</option>
                ${CONFIG.DEFAULT_CLASSES.map(c => `<option value="${c}">${c}</option>`).join('')}
            `;
        }
    }
}

/**
 * Load students from cloud
 */
async function loadStudentsFromCloud() {
    showNotification('正在載入學員列表...', 'info');

    try {
        const response = await fetch(CONFIG.API.GET_STUDENTS, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();

        if (result.success && result.students) {
            const mappedStudents = result.students.map(student => ({
                ...student,
                emergencyContact: student.emergency_contact || '',
                emergencyPhone: student.emergency_phone || ''
            }));

            students = mappedStudents;
            displayStudents(mappedStudents);
            updateStatistics(mappedStudents);
            updateClassOptions();
            showNotification(`已載入 ${mappedStudents.length} 筆學員資料`, 'success');
        } else {
            throw new Error('無法載入學員列表');
        }
    } catch (error) {
        showNotification('載入學員列表失敗：' + error.message, 'error');

        const list = document.getElementById('studentList');
        if (list) {
            list.innerHTML = `
                <div class="empty-state">
                    <h3>無法載入學員資料</h3>
                    <p>請檢查網路連線或聯繫系統管理員<br>
                    錯誤詳情：${error.message}</p>
                    <button class="btn btn-primary" onclick="loadStudentsFromCloud()" style="margin-top: 15px;">
                        重新載入
                    </button>
                </div>
            `;
        }
    }
}

/**
 * Load from cloud (legacy function)
 */
async function loadFromCloud() {
    try {
        showNotification('正在從雲端載入...', 'warning');
        document.getElementById('syncStatus').textContent = '正在從 Google Sheets 載入資料...';

        const response = await fetch(CONFIG.API.GET_STUDENTS);
        const result = await response.json();

        if (result.success && result.students) {
            const mappedStudents = result.students.map(student => ({
                ...student,
                emergencyContact: student.emergency_contact || '',
                emergencyPhone: student.emergency_phone || ''
            }));

            students = mappedStudents;
            localStorage.setItem('studentData', JSON.stringify(students));
            displayStudents();
            updateClassOptions();
            updateStatistics();
            showNotification(`成功載入 ${result.count} 筆學員資料`, 'success');
            document.getElementById('syncStatus').textContent = `成功載入 ${result.count} 筆資料 (${new Date().toLocaleString(CONFIG.DATE_LOCALE)})`;
        } else {
            throw new Error(result.error || '載入失敗');
        }
    } catch (error) {
        showNotification('載入失敗: ' + error.message, 'error');
        document.getElementById('syncStatus').textContent = `載入失敗: ${error.message}`;
    }
}

/**
 * Sync students to cloud
 */
async function syncToCloud() {
    if (students.length === 0) {
        showNotification('沒有學員資料需要同步', 'warning');
        return;
    }

    showNotification('正在同步到雲端...', 'info');

    const data = students.map(student => ({
        id: student.id || '',
        name: student.name || '',
        nickname: student.nickname || '',
        class: student.class || '',
        phone: student.phone || '',
        email: student.email || '',
        birthday: student.birthday || '',
        emergency_contact: student.emergencyContact || '',
        emergency_phone: student.emergencyPhone || '',
        status: student.status || '',
        remarks: student.remarks || '',
        createdAt: student.createdAt || ''
    }));

    try {
        const response = await fetch(CONFIG.GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ students: data })
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const result = await response.json();

        if (result.success) {
            showNotification(`成功同步 ${data.length} 筆學員資料到雲端`, 'success');
        } else {
            throw new Error(result.message || '同步失敗');
        }
    } catch (error) {
        showNotification('同步失敗：' + error.message, 'error');

        const csvData = data.map(s =>
            `${s.id}\t${s.name}\t${s.nickname}\t${s.class}\t${s.phone}\t${s.email}\t${s.birthday}\t${s.emergency_contact}\t${s.emergency_phone}\t${s.status}\t${s.remarks}\t${s.createdAt}`
        ).join('\n');

        navigator.clipboard.writeText(csvData);
        showNotification('已複製資料到剪貼簿，請手動貼上到 Google Sheets', 'info');
    }
}

/**
 * Save students to cloud (overwrite)
 */
async function saveStudentsToCloud() {
    if (!students || students.length === 0) {
        showNotification('沒有學員資料可以儲存', 'warning');
        return;
    }

    if (!confirm('此操作會覆蓋 Google Sheets 的學員資料。確定要儲存嗎？')) {
        return;
    }

    try {
        const payload = students.map(student => ({
            id: student.id || '',
            name: student.name || '',
            nickname: student.nickname || '',
            class: student.class || '',
            phone: student.phone || '',
            email: student.email || '',
            birthday: student.birthday || '',
            emergencyContact: student.emergencyContact || '',
            emergencyPhone: student.emergencyPhone || '',
            status: student.status || '',
            remarks: student.remarks || '',
            createdAt: student.createdAt || ''
        }));

        const response = await fetch(CONFIG.API.SYNC_STUDENTS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'syncStudents',
                students: payload
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        if (result.success) {
            showNotification(`已儲存 ${payload.length} 筆學員資料到雲端`, 'success');
        } else {
            throw new Error(result.error || '儲存失敗');
        }
    } catch (error) {
        showNotification('儲存失敗：' + error.message, 'error');
    }
}

/**
 * Load existing attendance records
 * @param {string} date - Date string
 * @param {string} className - Class name
 * @returns {Promise<Array>} Attendance records
 */
async function loadExistingAttendance(date, className) {
    try {
        const directUrl = `${CONFIG.GOOGLE_APPS_SCRIPT_URL}?action=getAttendance&date=${encodeURIComponent(date)}&className=${encodeURIComponent(className)}`;

        const response = await fetch(directUrl, {
            method: 'GET',
            redirect: 'follow'
        });

        if (response.ok) {
            const result = await response.json();

            if (result.success) {
                return result.attendance || [];
            } else {
                throw new Error(result.error || '載入出席記錄失敗');
            }
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

    } catch (error) {
        try {
            const localData = localStorage.getItem('todayAttendance');
            if (localData) {
                const attendanceArray = JSON.parse(localData);
                const filtered = attendanceArray.filter(record =>
                    record.date === date && record.className === className
                );
                return filtered;
            }
        } catch (localError) {
            // Silent fail
        }

        return [];
    }
}

/**
 * Sync attendance to cloud
 */
async function syncAttendanceToCloud() {
    if (todayAttendance.length === 0) {
        showNotification('沒有點名記錄可同步', 'warning');
        return;
    }

    const recordCount = todayAttendance.length;
    if (!confirm(`準備上傳 ${recordCount} 筆點名記錄到 Google Sheets\n\n上傳成功後將清空本地記錄，避免重複上傳\n\n確定要繼續嗎？`)) {
        showNotification('已取消上傳', 'warning');
        return;
    }

    try {
        showNotification('正在上傳點名記錄...', 'warning');

        const attendanceForSync = todayAttendance.map(record => ({
            date: record.date,
            class: record.className,
            studentId: record.studentId,
            studentName: record.studentName,
            status: record.status
        }));

        const response = await fetch(CONFIG.API.SYNC_ATTENDANCE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            },
            body: JSON.stringify({
                attendance: attendanceForSync
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success) {
            showNotification(`已成功上傳 ${recordCount} 筆點名記錄`, 'success');

            todayAttendance = [];
            localStorage.setItem('todayAttendance', JSON.stringify(todayAttendance));

            displayTodayAttendance();
            updateAttendanceCount();

            showNotification('上傳完成！本地記錄已清空', 'success');

        } else {
            throw new Error(result.error || '上傳失敗');
        }

    } catch (error) {
        if (error.message.includes('Unexpected token') || error.message.includes('not valid JSON') || error.message.includes('404')) {
            showNotification('上傳失敗，為您準備手動上傳資料...', 'warning');

            const recordsForCopy = todayAttendance.map(record =>
                `${record.date}\t${record.className}\t${record.studentId}\t${record.studentName}\t${record.status}`
            ).join('\n');

            const header = '日期\t班別\t學員ID\t學員姓名\t出席狀態\n';
            const fullData = header + recordsForCopy;

            try {
                await navigator.clipboard.writeText(fullData);
                showNotification('已複製到剪貼板，請手動貼到 Google Sheets', 'warning');

                if (confirm('自動上傳失敗，但資料已複製到剪貼板！\n\n請到 Google Sheets 手動貼上資料。\n\n是否要清空本地記錄？')) {
                    todayAttendance = [];
                    localStorage.setItem('todayAttendance', JSON.stringify(todayAttendance));
                    displayTodayAttendance();
                    updateAttendanceCount();
                    showNotification('本地記錄已清空', 'success');
                }

                alert('自動上傳失敗，但資料已複製到剪貼板！\n\n請到您的 Google Sheets 手動貼上：\n1. 開啟您的 Google Sheets\n2. 選擇「attendance」工作表\n3. 按 Ctrl+V 貼上資料');
            } catch (clipboardError) {
                showNotification('上傳和複製都失敗，請檢查網路連接', 'error');
            }
        } else {
            showNotification('上傳失敗: ' + error.message, 'error');
        }
    }
}
