/**
 * main.js - Application Entry Point
 */

/**
 * Initialize application on DOM ready
 */
document.addEventListener('DOMContentLoaded', async () => {
    showNotification('歡迎使用學員管理系統！', 'success');

    // Load class list and students
    fetchClassList();
    await loadStudentsFromCloud();

    // Set default date to today
    const dateInput = document.getElementById('attendanceDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    // Initialize attendance flow controls
    initAttendanceFlowControls();

    // Setup attendance buttons
    setupAttendanceButtons();

    // Load saved attendance records
    loadTodayAttendance();
});
