// 學員管理模組
class StudentManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.students = [];
    }

    async loadStudents() {
        try {
            const studentsData = this.dataManager.getStudents();
            this.students = studentsData.map(student => {
                // 獲取班別名稱
                const className = this.dataManager.getClassName(student.class);
                
                return {
                    ...student,
                    classId: student.class,
                    className: className,
                    status: student.status || 'active',
                    nickname: student.nickname || '',
                    emergencyContact: student.emergencyContactName || '',
                    emergencyPhone: student.emergencyContactPhone || ''
                };
            });
            console.log('學員數據載入完成:', this.students);
            return this.students;
        } catch (error) {
            console.error('載入學員失敗:', error);
            throw error;
        }
    }

    getAllStudents() {
        return this.students;
    }

    getActiveStudents() {
        return this.students.filter(student => student.status !== 'inactive');
    }

    getStudentById(studentId) {
        return this.students.find(student => student.id === studentId);
    }

    getStudentsByClass(classId) {
        return this.students.filter(student => student.class === classId && student.status !== 'inactive');
    }

    async addStudent(studentData) {
        try {
            console.log('StudentManager.addStudent 接收到的數據:', studentData);
            
            // 驗證必要欄位
            if (!studentData.name || !studentData.className) {
                throw new Error('姓名和班別為必填欄位');
            }

            // 使用傳入的classId，如果沒有則嘗試通過className查找
            let classId = studentData.classId;
            if (!classId) {
                classId = this.getClassIdByName(studentData.className);
            }
            
            if (!classId) {
                throw new Error('找不到對應的班別');
            }

            // 檢查是否已存在相同姓名的學員
            const existingStudent = this.students.find(s => 
                s.name === studentData.name && s.classId === classId
            );
            
            if (existingStudent) {
                throw new Error('該班別中已存在同名學員');
            }

            // 創建學員對象
            const studentForDataManager = {
                name: studentData.name.trim(),
                nickname: studentData.nickname || '',
                class: classId,
                phone: studentData.phone || '',
                email: studentData.email || '',
                emergencyContactName: studentData.emergencyContact || '',
                emergencyContactPhone: studentData.emergencyPhone || '',
                notes: studentData.notes || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            console.log('準備保存到數據管理器的學員數據:', studentForDataManager);

            // 保存到數據管理器
            const student = this.dataManager.addStudent(studentForDataManager);
            
            if (student) {
                // 轉換為統一格式
                const formattedStudent = {
                    ...student,
                    className: studentData.className,
                    classId: classId,
                    nickname: student.nickname || '',
                    emergencyContact: student.emergencyContactName,
                    emergencyPhone: student.emergencyContactPhone
                };
                
                console.log('格式化後的學員數據:', formattedStudent);
                this.students.push(formattedStudent);
                return formattedStudent;
            } else {
                throw new Error('保存學員失敗');
            }
        } catch (error) {
            console.error('新增學員失敗:', error);
            throw error;
        }
    }

    async updateStudent(studentId, updatedData) {
        try {
            const studentIndex = this.students.findIndex(s => s.id === studentId);
            
            if (studentIndex === -1) {
                throw new Error('找不到指定學員');
            }

            // 驗證必要欄位
            if (updatedData.name && !updatedData.name.trim()) {
                throw new Error('姓名不能為空');
            }

            // 檢查是否與其他學員重名
            if (updatedData.name || updatedData.className) {
                const name = updatedData.name || this.students[studentIndex].name;
                const className = updatedData.className || this.students[studentIndex].className;
                
                const existingStudent = this.students.find(s => 
                    s.id !== studentId && s.name === name && s.className === className
                );
                
                if (existingStudent) {
                    throw new Error('該班別中已存在同名學員');
                }
            }

            // 更新學員資料，但保留原本的敏感資料（如果新資料中沒有提供）
            const updatedStudent = {
                ...this.students[studentIndex],
                ...updatedData,
                updatedAt: new Date().toISOString()
            };

            // 如果是編輯模式且敏感資料欄位為空，保留原始資料
            if (this.students[studentIndex].phone && !updatedData.phone) {
                updatedStudent.phone = this.students[studentIndex].phone;
            }
            if (this.students[studentIndex].email && !updatedData.email) {
                updatedStudent.email = this.students[studentIndex].email;
            }
            if (this.students[studentIndex].emergencyContact && !updatedData.emergencyContact) {
                updatedStudent.emergencyContact = this.students[studentIndex].emergencyContact;
            }
            if (this.students[studentIndex].emergencyPhone && !updatedData.emergencyPhone) {
                updatedStudent.emergencyPhone = this.students[studentIndex].emergencyPhone;
            }

            // 如果班別改變，更新classId
            if (updatedData.className) {
                updatedStudent.classId = this.getClassIdByName(updatedData.className);
            }

            // 保存到數據管理器
            const success = this.dataManager.updateStudent(studentId, updatedStudent);
            
            if (success) {
                this.students[studentIndex] = updatedStudent;
                return updatedStudent;
            } else {
                throw new Error('更新學員失敗');
            }
        } catch (error) {
            console.error('更新學員失敗:', error);
            throw error;
        }
    }

    async deleteStudent(studentId) {
        try {
            const studentIndex = this.students.findIndex(s => s.id === studentId);
            
            if (studentIndex === -1) {
                throw new Error('找不到指定學員');
            }

            // 檢查是否有相關的點名記錄
            const attendanceRecords = this.dataManager.getAttendance().filter(a => a.studentId === studentId);
            
            if (attendanceRecords.length > 0) {
                const confirmDelete = confirm(
                    `該學員有 ${attendanceRecords.length} 筆點名記錄，刪除學員將同時刪除所有相關記錄。確定要繼續嗎？`
                );
                
                if (!confirmDelete) {
                    return false;
                }
            }

            // 從數據管理器中刪除
            this.dataManager.deleteStudent(studentId);
            this.students.splice(studentIndex, 1);
            return true;
        } catch (error) {
            console.error('刪除學員失敗:', error);
            throw error;
        }
    }

    searchStudents(searchTerm) {
        if (!searchTerm || !searchTerm.trim()) {
            return this.students;
        }

        const term = searchTerm.toLowerCase().trim();
        
        return this.students.filter(student => 
            student.name.toLowerCase().includes(term) ||
            (student.nickname && student.nickname.toLowerCase().includes(term)) ||
            student.className.toLowerCase().includes(term) ||
            (student.phone && student.phone.includes(term)) ||
            (student.email && student.email.toLowerCase().includes(term)) ||
            (student.emergencyContact && student.emergencyContact.toLowerCase().includes(term))
        );
    }

    getStudentsByClassId(classId) {
        return this.students.filter(student => student.classId === classId);
    }

    getStudentsCount() {
        return this.students.length;
    }

    getStudentsCountByClass() {
        const classCounts = {};
        
        this.students.forEach(student => {
            const className = student.className || '未分班';
            classCounts[className] = (classCounts[className] || 0) + 1;
        });
        
        return classCounts;
    }

    // 匯出學員資料為CSV
    exportStudentsToCSV() {
        const headers = ['姓名', '班別', '聯絡電話', '電子郵件', '緊急聯絡人', '緊急聯絡電話', '備註', '建立日期'];
        const rows = this.students.map(student => [
            student.name,
            student.className,
            student.phone || '',
            student.email || '',
            student.emergencyContact || '',
            student.emergencyPhone || '',
            student.notes || '',
            new Date(student.createdAt).toLocaleDateString('zh-TW')
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        return csvContent;
    }

    // 從CSV匯入學員資料
    async importStudentsFromCSV(csvContent) {
        try {
            const lines = csvContent.split('\n');
            const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
            
            const importedStudents = [];
            const errors = [];

            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;

                try {
                    const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
                    
                    const studentData = {
                        name: values[0],
                        className: values[1],
                        phone: values[2],
                        email: values[3],
                        emergencyContact: values[4],
                        emergencyPhone: values[5],
                        notes: values[6]
                    };

                    if (studentData.name && studentData.className) {
                        const student = await this.addStudent(studentData);
                        importedStudents.push(student);
                    }
                } catch (error) {
                    errors.push(`第 ${i + 1} 行: ${error.message}`);
                }
            }

            return {
                success: importedStudents.length,
                errors: errors,
                total: lines.length - 1
            };
        } catch (error) {
            throw new Error('CSV 格式錯誤: ' + error.message);
        }
    }

    // 驗證學員資料
    validateStudentData(studentData) {
        const errors = [];

        if (!studentData.name || !studentData.name.trim()) {
            errors.push('姓名為必填欄位');
        }

        if (!studentData.className || !studentData.className.trim()) {
            errors.push('班別為必填欄位');
        }

        if (studentData.email && !this.isValidEmail(studentData.email)) {
            errors.push('電子郵件格式不正確');
        }

        if (studentData.phone && !this.isValidPhone(studentData.phone)) {
            errors.push('電話號碼格式不正確');
        }

        return errors;
    }

    // 工具函數
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getClassIdByName(className) {
        try {
            // 使用dataManager的getClasses方法獲取所有班別
            const classes = this.dataManager.getClasses();
            console.log('可用班別:', classes);
            console.log('尋找班別名稱:', className);
            
            const foundClass = classes.find(classItem => classItem.name === className);
            console.log('找到的班別:', foundClass);
            
            return foundClass ? foundClass.id : null;
        } catch (error) {
            console.error('獲取班別ID失敗:', error);
            return null;
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 8;
    }

    // 獲取學員統計資料
    getStudentStatistics() {
        const total = this.students.length;
        const byClass = this.getStudentsCountByClass();
        const withPhone = this.students.filter(s => s.phone).length;
        const withEmail = this.students.filter(s => s.email).length;
        const withEmergencyContact = this.students.filter(s => s.emergencyContact).length;

        return {
            total,
            byClass,
            withPhone,
            withEmail,
            withEmergencyContact,
            completionRate: total > 0 ? Math.round((withEmergencyContact / total) * 100) : 0
        };
    }

    // 獲取最近新增的學員
    getRecentStudents(limit = 5) {
        return this.students
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit);
    }

    // 獲取需要更新資料的學員（缺少重要資訊）
    getIncompleteStudents() {
        return this.students.filter(student => 
            !student.phone || 
            !student.emergencyContact || 
            !student.emergencyPhone
        );
    }
}

// 全局函數 (為了向後兼容)
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    if (modalId === 'addStudentModal') {
        studentManager.closeModal();
    } else {
        document.getElementById(modalId).style.display = 'none';
    }
}

function exportStudents() {
    studentManager.exportStudents();
} 