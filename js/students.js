/**
 * students.js - Student Management Functions
 */

// Global students array
let students = [];

/**
 * Generate next student ID (Y prefix)
 * @returns {string} New student ID
 */
function generateNextStudentId() {
    const existingIds = students
        .map(s => s.id)
        .filter(id => id && id.startsWith('Y'))
        .map(id => {
            const num = parseInt(id.substring(1));
            return isNaN(num) ? 0 : num;
        })
        .sort((a, b) => b - a);

    const maxId = existingIds.length > 0 ? existingIds[0] : 0;
    const nextId = maxId + 1;

    const paddedId = nextId.toString().padStart(4, '0');
    return `Y${paddedId}`;
}

/**
 * Add new student
 */
async function addStudent() {
    const name = document.getElementById('studentName').value.trim();
    const className = document.getElementById('studentClass').value.trim();

    if (!name) {
        showNotification('請輸入學員姓名', 'error');
        return;
    }

    if (!className) {
        showNotification('請選擇班別', 'error');
        return;
    }

    const birthdayInput = document.getElementById('studentBirthday').value;
    const formattedBirthday = birthdayInput ? formatBirthday(birthdayInput) : '';

    const studentData = {
        name: name,
        nickname: document.getElementById('studentNickname').value.trim(),
        class: className,
        phone: document.getElementById('studentPhone').value.trim(),
        email: document.getElementById('studentEmail').value.trim(),
        birthday: formattedBirthday,
        emergencyContact: document.getElementById('emergencyContact').value.trim(),
        emergencyPhone: document.getElementById('emergencyPhone').value.trim(),
        status: '在讀',
        remarks: document.getElementById('studentRemarks').value.trim(),
        createdAt: formatDateOnly()
    };

    showNotification('正在新增學員...', 'info');

    try {
        const getResponse = await fetch(CONFIG.API.GET_STUDENTS);
        let existingStudents = [];

        if (getResponse.ok) {
            const getResult = await getResponse.json();
            if (getResult.success && getResult.students) {
                existingStudents = getResult.students;
            }
        }

        const maxId = existingStudents
            .map(s => s.id)
            .filter(id => id && id.startsWith('Y'))
            .map(id => parseInt(id.substring(1)))
            .filter(num => !isNaN(num))
            .sort((a, b) => b - a)[0] || 0;

        const newId = `Y${(maxId + 1).toString().padStart(4, '0')}`;
        studentData.id = newId;

        const response = await fetch(CONFIG.API.SYNC_STUDENTS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'appendStudent',
                students: [studentData]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();

        if (result.success) {
            showNotification(`學員「${name}」已成功新增 (ID: ${newId})`, 'success');
            clearForm();
            await loadStudentsFromCloud();
        } else {
            throw new Error(result.message || '新增失敗');
        }
    } catch (error) {
        showNotification('新增學員失敗：' + error.message, 'error');

        const csvData = `${studentData.id}\t${studentData.name}\t${studentData.nickname}\t${studentData.class}\t${studentData.phone}\t${studentData.email}\t${studentData.birthday}\t${studentData.emergencyContact}\t${studentData.emergencyPhone}\t${studentData.status}\t${studentData.remarks}\t${studentData.createdAt}`;

        try {
            await navigator.clipboard.writeText(csvData);
            showNotification('已複製學員資料到剪貼簿，請手動貼上到 Google Sheets', 'info');
        } catch (clipError) {
            // Silent fail
        }
    }
}

/**
 * Load students (legacy function)
 */
async function loadStudents() {
    await loadStudentsFromCloud();
}

/**
 * Display students list
 * @param {Array} studentArray - Array of students
 */
function displayStudents(studentArray = students) {
    const list = document.getElementById('studentList');
    if (!list) return;

    if (studentArray.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <h3>還沒有學員資料</h3>
                <p>點擊上方的「新增學員」按鈕開始建立你的學員名冊<br>
                所有資料會直接儲存到 Google Sheets 中</p>
            </div>
        `;
        return;
    }

    const statusOptions = CONFIG.STUDENT_STATUS;

    list.innerHTML = studentArray.map(student => `
        <div class="student-item">
            <div>
                <div style="font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #333;">
                    ${student.name}
                    ${student.nickname ? `<span style="color: #666; font-weight: 400; font-size: 16px;">(${student.nickname})</span>` : ''}
                    <span style="color: #999; font-weight: 400; font-size: 14px; margin-left: 10px;">ID: ${student.id}</span>
                </div>
                <div style="color: #666; font-size: 15px; margin-bottom: 5px;">
                    <span style="margin-right: 20px; background: #e3f2fd; padding: 4px 12px; border-radius: 20px; color: #1976d2;">
                        ${student.class || '未分配班別'}
                    </span>
                    <span style="color: ${getStatusColor(student.status)}; font-weight: 600;">
                        ${student.status}
                    </span>
                </div>
                <div style="margin-bottom: 6px;">
                    <label style="font-size: 12px; color: #666; margin-right: 6px;">狀態</label>
                    <select onchange="updateStudentStatus('${student.id}', this.value)" style="padding: 6px 10px; border-radius: 8px; border: 1px solid #ddd;">
                        ${statusOptions.map(status => `
                            <option value="${status}" ${student.status === status ? 'selected' : ''}>${status}</option>
                        `).join('')}
                        ${!statusOptions.includes(student.status) && student.status ? `<option value="${student.status}" selected>${student.status}</option>` : ''}
                    </select>
                </div>
                <div style="color: #999; font-size: 13px; line-height: 1.4;">
                    ${student.createdAt} 建立
                    ${student.phone ? ` | ${student.phone}` : ''}
                    ${student.email ? ` | ${student.email}` : ''}
                    ${student.birthday ? ` | ${student.birthday}` : ''}
                </div>
                ${student.emergencyContact || student.emergencyPhone ? `
                    <div style="color: #e74c3c; font-size: 12px; margin-top: 4px;">
                        緊急聯絡: ${student.emergencyContact || ''}${student.emergencyPhone ? ` (${student.emergencyPhone})` : ''}
                    </div>
                ` : ''}
            </div>
            <div>
                <button class="btn btn-danger" onclick="deleteStudentFromCloud('${student.id}')"
                        title="刪除學員" style="padding: 10px 15px;">
                    刪除
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Update student status (syncs to cloud)
 * @param {string} studentId - Student ID
 * @param {string} newStatus - New status
 */
async function updateStudentStatus(studentId, newStatus) {
    const target = students.find(s => s.id === studentId);
    if (!target) return;

    const oldStatus = target.status;
    if (oldStatus === newStatus) return;

    // 先更新畫面（樂觀更新），失敗再還原
    target.status = newStatus;
    displayStudents(students);
    updateStatistics(students);
    showNotification(`正在更新「${target.name}」的狀態...`, 'info');

    try {
        const response = await fetch(CONFIG.API.UPDATE_STUDENT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentId: studentId,
                status: newStatus
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || '更新失敗');
        }

        showNotification(`「${target.name}」狀態已更新為「${newStatus}」`, 'success');
    } catch (error) {
        target.status = oldStatus;
        displayStudents(students);
        updateStatistics(students);
        showNotification(`更新「${target.name}」狀態失敗：${error.message}`, 'error');
    }
}

/**
 * Delete student (legacy function - local only)
 * @param {string} id - Student ID
 */
function deleteStudent(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;

    if (confirm(`確定要刪除學員「${student.name}」嗎？\n\n此操作無法復原，請謹慎考慮。`)) {
        students = students.filter(s => s.id !== id);
        localStorage.setItem('studentData', JSON.stringify(students));
        displayStudents();
        updateClassOptions();
        updateStatistics();
        showNotification(`學員「${student.name}」已刪除`, 'warning');
    }
}

/**
 * Delete student from cloud
 * @param {string} studentId - Student ID
 */
async function deleteStudentFromCloud(studentId) {
    if (!confirm('確定要刪除這位學員嗎？此操作無法復原。')) {
        return;
    }

    showNotification('正在刪除學員...', 'info');

    // Note: Currently requires manual deletion in Google Sheets
    showNotification('請手動到 Google Sheets 刪除此學員記錄', 'warning');
}
