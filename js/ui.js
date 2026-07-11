/**
 * ui.js - UI Interactions and Notifications
 */

/**
 * Show notification message
 * @param {string} message - Message to display
 * @param {string} type - Type: 'success', 'error', 'warning', 'info'
 */
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) return;

    notification.textContent = message;
    notification.className = `notification ${type} show`;

    // Get duration based on type
    let duration;
    switch (type) {
        case 'error':
            duration = CONFIG.NOTIFICATION_DURATION.ERROR;
            break;
        case 'success':
            duration = CONFIG.NOTIFICATION_DURATION.SUCCESS;
            break;
        case 'warning':
            duration = CONFIG.NOTIFICATION_DURATION.WARNING;
            break;
        default:
            duration = CONFIG.NOTIFICATION_DURATION.INFO;
    }

    setTimeout(() => {
        notification.classList.remove('show');
    }, duration);
}

/**
 * Switch between tabs
 * @param {string} tabName - Tab identifier
 * @param {HTMLElement} element - Clicked tab element
 */
function showTab(tabName, element) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    if (element) {
        element.classList.add('active');
    }
    document.getElementById(tabName + 'Tab').classList.add('active');

    if (tabName === 'attendance') {
        displayTodayAttendance();
    }
}

/**
 * Get status color based on student status
 * @param {string} status - Student status
 * @returns {string} Color code
 */
function getStatusColor(status) {
    switch (status) {
        case '在讀': return '#28a745';
        case '休學': return '#ffc107';
        case '畢業': return '#6c757d';
        case '退學': return '#dc3545';
        default: return '#007bff';
    }
}

/**
 * Get attendance status color
 * @param {string} status - Attendance status
 * @returns {string} Color code
 */
function getAttendanceColor(status) {
    switch (status) {
        case '出席': return '#28a745';
        case '缺席': return '#dc3545';
        case '請假': return '#6c757d';
        case '遲到': return '#ffc107';
        default: return '#007bff';
    }
}

/**
 * Get attendance status icon
 * @param {string} status - Attendance status
 * @returns {string} Icon character
 */
function getAttendanceIcon(status) {
    switch (status) {
        case '出席': return '[V]';
        case '缺席': return '[X]';
        case '請假': return '[H]';
        case '遲到': return '[L]';
        default: return '[-]';
    }
}

/**
 * Clear form inputs
 */
function clearForm() {
    document.getElementById('studentName').value = '';
    document.getElementById('studentNickname').value = '';
    document.getElementById('studentClass').value = '';
    document.getElementById('studentPhone').value = '';
    document.getElementById('studentEmail').value = '';
    document.getElementById('studentBirthday').value = '';
    document.getElementById('emergencyContact').value = '';
    document.getElementById('emergencyPhone').value = '';
    document.getElementById('studentRemarks').value = '';
}

/**
 * Format date to YYYY-MM-DD
 * @returns {string} Formatted date
 */
function formatDateOnly() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Format birthday for display (day-month format)
 * @param {string} dateString - Date string
 * @returns {string} Formatted birthday
 */
function formatBirthday(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    return `${day}-${month}`;
}

/**
 * Handle birthday input and format
 */
function handleBirthdayInput() {
    const birthdayInput = document.getElementById('studentBirthday');
    if (birthdayInput.value) {
        formatBirthday(birthdayInput.value);
    }
}

/**
 * Update class select options
 * @param {Array} classes - Array of class names or objects
 */
function updateClassSelect(classes) {
    const select = document.getElementById('studentClass');
    if (!select) return;

    select.innerHTML = '<option value="">請選擇班別</option>';

    if (Array.isArray(classes)) {
        classes.forEach(classItem => {
            const option = document.createElement('option');

            if (typeof classItem === 'string') {
                option.value = classItem;
                option.textContent = classItem;
            } else if (classItem.class_id) {
                option.value = classItem.class_id;
                option.textContent = classItem.class_name ?
                    `${classItem.class_id} (${classItem.class_name})` :
                    classItem.class_id;
            } else if (classItem.name) {
                option.value = classItem.name;
                option.textContent = classItem.name;
            }

            select.appendChild(option);
        });
    }
}

/**
 * Update class options from student data
 */
function updateClassOptions() {
    const classNames = [...new Set(students.map(s => s.class).filter(c => c && c.trim()))];

    const selectElement = document.getElementById('studentClass');
    if (selectElement) {
        const currentValue = selectElement.value;
        selectElement.innerHTML = '<option value="">請選擇班別</option>' +
            classNames.map(className => `<option value="${className}">${className}</option>`).join('');

        if (currentValue && classNames.includes(currentValue)) {
            selectElement.value = currentValue;
        }
    }

    const attendanceSelect = document.getElementById('attendanceClass');
    if (attendanceSelect) {
        const currentValue = attendanceSelect.value;
        attendanceSelect.innerHTML = '<option value="">請選擇班別</option>' +
            classNames.map(className => `<option value="${className}">${className}</option>`).join('');

        if (currentValue && classNames.includes(currentValue)) {
            attendanceSelect.value = currentValue;
        }
    }

    updateAttendanceFlowControls();
}

/**
 * Update statistics display
 * @param {Array} studentArray - Array of students
 */
function updateStatistics(studentArray = []) {
    const totalStudents = studentArray.length;
    const activeStudents = studentArray.filter(s => s.status === '在讀').length;
    const classes = [...new Set(studentArray.map(s => s.class))].filter(c => c).length;

    const totalElement = document.getElementById('totalStudents');
    if (totalElement) {
        totalElement.textContent = totalStudents;
        document.getElementById('activeStudents').textContent = activeStudents;
    }
}

/**
 * Export student list to CSV
 */
function exportStudentList() {
    if (students.length === 0) {
        showNotification('沒有學員資料可匯出', 'warning');
        return;
    }

    const csvContent = "data:text/csv;charset=utf-8,"
        + "學員ID,學員姓名,別名,班別,電話,信箱,生日,緊急聯絡人,緊急聯絡電話,狀態,建立日期,備註\n"
        + students.map(student =>
            `"${student.id || ''}","${student.name}","${student.nickname || ''}","${student.class || ''}","${student.phone || ''}","${student.email || ''}","${student.birthday ? formatBirthday(student.birthday) : ''}","${student.emergencyContact || ''}","${student.emergencyPhone || ''}","${student.status}","${student.createdAt}","${student.remarks || ''}"`
        ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `學員清單_${new Date().toLocaleDateString(CONFIG.DATE_LOCALE).replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification(`學員清單已匯出 (${students.length} 筆資料)`, 'success');
}
