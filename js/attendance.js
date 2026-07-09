/**
 * attendance.js - Attendance Management Functions
 */

// Global attendance variables
let todayAttendance = [];
let currentAttendanceClass = '';
let currentAttendanceDate = '';
let tempAttendanceChoices = {};

/**
 * Start attendance process
 */
async function startAttendance() {
    const date = document.getElementById('attendanceDate').value;
    const className = document.getElementById('attendanceClass').value;

    if (!date || !className) {
        showNotification('請選擇日期和班別', 'error');
        return;
    }

    currentAttendanceDate = date;
    currentAttendanceClass = className;

    const allClassStudents = students.filter(s => s.class === className);
    const activeStudents = allClassStudents.filter(s => s.status === '在讀');

    if (allClassStudents.length === 0) {
        showNotification(`${className} 沒有學員資料`, 'warning');
        return;
    }

    if (activeStudents.length === 0) {
        showNotification(`${className} 沒有「在讀」狀態的學員`, 'warning');
        return;
    }

    await displayAttendanceList(activeStudents);
    document.getElementById('attendanceListCard').style.display = 'block';

    setupAttendanceButtons();

    showNotification(`開始 ${className} 的點名 (${activeStudents.length} 位在讀學員)`, 'success');
}

/**
 * Display attendance list
 * @param {Array} classStudents - Students in the class
 */
async function displayAttendanceList(classStudents) {
    const container = document.getElementById('attendanceStudentsList');

    tempAttendanceChoices = {};

    let existingAttendance = {};
    try {
        const attendanceData = await loadExistingAttendance(currentAttendanceDate, currentAttendanceClass);

        attendanceData.forEach(record => {
            existingAttendance[record.studentId] = record.status;
        });

    } catch (error) {
        // Silent fail - use new attendance mode
    }

    container.innerHTML = classStudents.map(student => {
        const existingStatus = existingAttendance[student.id];

        return `
        <div class="student-attendance-item">
            <div class="student-info">
                <div class="student-name">
                    ${student.name}
                    ${student.nickname ? `<span style="color: #999; font-size: 14px;">(${student.nickname})</span>` : ''}
                    ${existingStatus ? `<span style="color: #666; font-size: 12px; margin-left: 8px;">[已點名: ${existingStatus}]</span>` : ''}
                </div>
                <div class="student-class">
                    班別: ${student.class}
                </div>
            </div>
            <div class="attendance-buttons">
                <button class="attendance-choice-btn btn btn-success ${existingStatus === '出席' ? 'selected' : ''}"
                        onclick="selectAttendanceStatus('${student.id}', '出席', this)"
                        data-student-id="${student.id}"
                        data-status="出席"
                        title="出席"
                        style="${existingStatus === '出席' ? 'background-color: #198754; border-color: #146c43;' : ''}">
                    <span class="btn-text">出席</span>
                    <span class="btn-check">V</span>
                </button>
                <button class="attendance-choice-btn btn btn-danger ${existingStatus === '缺席' ? 'selected' : ''}"
                        onclick="selectAttendanceStatus('${student.id}', '缺席', this)"
                        data-student-id="${student.id}"
                        data-status="缺席"
                        title="缺席"
                        style="${existingStatus === '缺席' ? 'background-color: #dc3545; border-color: #dc3545;' : ''}">
                    <span class="btn-text">缺席</span>
                    <span class="btn-check">V</span>
                </button>
                <button class="attendance-choice-btn btn btn-warning ${existingStatus === '遲到' ? 'selected' : ''}"
                        onclick="selectAttendanceStatus('${student.id}', '遲到', this)"
                        data-student-id="${student.id}"
                        data-status="遲到"
                        title="遲到"
                        style="${existingStatus === '遲到' ? 'background-color: #fd7e14; border-color: #fd7e14;' : ''}">
                    <span class="btn-text">遲到</span>
                    <span class="btn-check">V</span>
                </button>
            </div>
        </div>
        `;
    }).join('');

    Object.keys(existingAttendance).forEach(studentId => {
        tempAttendanceChoices[studentId] = existingAttendance[studentId];
    });
}

/**
 * Select attendance status
 * @param {string} studentId - Student ID
 * @param {string} status - Attendance status
 * @param {HTMLElement} clickedButton - Clicked button element
 */
function selectAttendanceStatus(studentId, status, clickedButton) {
    tempAttendanceChoices[studentId] = status;

    const studentButtons = document.querySelectorAll(`button[data-student-id="${studentId}"]`);

    studentButtons.forEach(btn => {
        btn.classList.remove('selected');
        btn.style.backgroundColor = '';
        btn.style.borderColor = '';
        btn.style.transform = 'scale(1)';
        btn.style.boxShadow = '';
    });

    if (clickedButton) {
        clickedButton.classList.add('selected');

        switch (status) {
            case '出席':
                clickedButton.style.backgroundColor = '#198754';
                clickedButton.style.borderColor = '#146c43';
                break;
            case '缺席':
                clickedButton.style.backgroundColor = '#dc3545';
                clickedButton.style.borderColor = '#dc3545';
                break;
            case '遲到':
                clickedButton.style.backgroundColor = '#fd7e14';
                clickedButton.style.borderColor = '#fd7e14';
                break;
        }
    }

    const student = students.find(s => s.id === studentId);
    const studentName = student ? student.name : `學員${studentId}`;

    showNotification(`${studentName}: ${status}`, 'success');

    updateSaveButtonStatus();
}

/**
 * Update save button status
 */
function updateSaveButtonStatus() {
    const totalStudents = document.querySelectorAll('[data-student-id]').length / 3;
    const selectedCount = Object.keys(tempAttendanceChoices).length;

    if (selectedCount === totalStudents && totalStudents > 0) {
        showNotification(`已為所有 ${totalStudents} 位學員選擇狀態，可以儲存了！`, 'success');
    }
}

/**
 * Setup attendance buttons
 */
function setupAttendanceButtons() {
    // Using direct onclick events
}

/**
 * Save attendance records
 */
async function saveAttendance() {
    if (Object.keys(tempAttendanceChoices).length === 0) {
        showNotification('請先為學員選擇出席狀態', 'warning');
        return;
    }

    if (!currentAttendanceDate || !currentAttendanceClass) {
        showNotification('缺少日期或班別資訊，請重新開始點名', 'error');
        return;
    }

    try {
        todayAttendance = todayAttendance.filter(att =>
            !(att.date === currentAttendanceDate && att.className === currentAttendanceClass)
        );

        const newRecords = [];
        for (const [studentId, status] of Object.entries(tempAttendanceChoices)) {
            const student = students.find(s => s.id === studentId);
            const studentName = student ? student.name : `未知學員(${studentId})`;

            const record = {
                id: 'ATT_' + Date.now() + '_' + studentId,
                date: currentAttendanceDate,
                className: currentAttendanceClass,
                studentId: studentId,
                studentName: studentName,
                status: status,
                createdAt: new Date().toLocaleString(CONFIG.DATE_LOCALE)
            };

            newRecords.push(record);
            todayAttendance.push(record);
        }

        localStorage.setItem('todayAttendance', JSON.stringify(todayAttendance));

        tempAttendanceChoices = {};

        displayTodayAttendance();
        updateAttendanceCount();

        showNotification(`已儲存 ${newRecords.length} 筆點名記錄`, 'success');

        document.getElementById('attendanceListCard').style.display = 'none';

    } catch (error) {
        showNotification('儲存失敗: ' + error.message, 'error');
    }
}

/**
 * Reset attendance
 */
function resetAttendance() {
    if (confirm('確定要重新點名嗎？這會清除目前的點名狀態。')) {
        todayAttendance = todayAttendance.filter(att =>
            !(att.date === currentAttendanceDate && att.className === currentAttendanceClass)
        );

        startAttendance();
        showNotification('已重新開始點名', 'success');
    }
}

/**
 * Load today's attendance from localStorage
 */
function loadTodayAttendance() {
    const saved = localStorage.getItem('todayAttendance');
    if (saved) {
        todayAttendance = JSON.parse(saved);
    }
    displayTodayAttendance();
    updateAttendanceCount();
}

/**
 * Update attendance count display
 */
function updateAttendanceCount() {
    const countElement = document.getElementById('attendanceCount');
    if (countElement) {
        countElement.textContent = todayAttendance.length;
    }
}

/**
 * Show attendance records
 */
function showAttendanceRecords() {
    if (todayAttendance.length === 0) {
        showNotification('沒有點名記錄', 'warning');
        return;
    }

    let recordsText = '本地點名記錄：\n\n';
    todayAttendance.forEach(record => {
        recordsText += `${record.date} | ${record.className}\n`;
        recordsText += `${record.studentName} (ID: ${record.studentId}) - ${record.status}\n`;
        recordsText += `${record.createdAt}\n\n`;
    });

    alert(recordsText);
}

/**
 * Display today's attendance
 */
function displayTodayAttendance() {
    const list = document.getElementById('todayAttendanceList');
    if (!list) return;

    const today = new Date().toISOString().split('T')[0];
    const todayRecords = todayAttendance.filter(att => att.date === today);

    if (todayRecords.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <h3>還沒有今日的點名記錄</h3>
                <p>選擇班別並開始點名</p>
            </div>
        `;
        return;
    }

    const groupedByClass = {};
    todayRecords.forEach(att => {
        if (!groupedByClass[att.className]) {
            groupedByClass[att.className] = [];
        }
        groupedByClass[att.className].push(att);
    });

    let html = '';
    Object.keys(groupedByClass).forEach(className => {
        const classRecords = groupedByClass[className];
        html += `
            <div style="margin-bottom: 30px;">
                <h4 style="color: #333; margin-bottom: 15px; font-size: 18px;">${className}</h4>
                ${classRecords.map(att => `
                    <div class="student-item" style="margin-bottom: 10px;">
                        <div>
                            <div style="font-size: 16px; font-weight: 600; color: #333;">
                                ${att.studentName}
                                <span style="color: ${getAttendanceColor(att.status)}; font-weight: 600; margin-left: 10px;">
                                    ${getAttendanceIcon(att.status)} ${att.status}
                                </span>
                            </div>
                            <div style="color: #999; font-size: 13px;">
                                ${att.createdAt}
                            </div>
                        </div>
                        <div>
                            <button class="btn btn-danger" onclick="deleteAttendance('${att.id}')"
                                    title="刪除記錄" style="padding: 8px 12px; font-size: 12px;">
                                刪除
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    });

    list.innerHTML = html;
}

/**
 * Delete attendance record
 * @param {string} id - Attendance record ID
 */
function deleteAttendance(id) {
    const att = todayAttendance.find(a => a.id === id);
    if (!att) return;

    if (confirm(`確定要刪除「${att.studentName}」的點名記錄嗎？`)) {
        todayAttendance = todayAttendance.filter(a => a.id !== id);
        localStorage.setItem('todayAttendance', JSON.stringify(todayAttendance));
        displayTodayAttendance();
        showNotification('已刪除點名記錄', 'warning');
    }
}

/**
 * Save and upload attendance (one-click)
 */
async function saveAndUploadAttendance() {
    await saveAttendance();

    setTimeout(async () => {
        if (todayAttendance.length > 0) {
            await syncAttendanceToCloud();
        }
    }, 1000);
}

/**
 * Initialize attendance flow controls
 */
let attendanceFlowInitialized = false;
function initAttendanceFlowControls() {
    const dateInput = document.getElementById('attendanceDate');
    const classSelect = document.getElementById('attendanceClass');
    const startBtn = document.getElementById('startAttendanceBtn');

    if (!dateInput || !classSelect || !startBtn) return;

    if (!attendanceFlowInitialized) {
        dateInput.addEventListener('change', updateAttendanceFlowControls);
        classSelect.addEventListener('change', updateAttendanceFlowControls);
        attendanceFlowInitialized = true;
    }
    updateAttendanceFlowControls();
}

/**
 * Update attendance flow controls state
 */
function updateAttendanceFlowControls() {
    const dateInput = document.getElementById('attendanceDate');
    const classSelect = document.getElementById('attendanceClass');
    const startBtn = document.getElementById('startAttendanceBtn');

    if (!dateInput || !classSelect || !startBtn) return;

    const hasDate = !!dateInput.value;
    classSelect.disabled = !hasDate;
    startBtn.disabled = !(hasDate && classSelect.value);
}
