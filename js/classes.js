// 課堂管理模組
class ClassManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.classes = [];
    }

    async loadClasses() {
        try {
            this.classes = this.dataManager.getClasses();
            return this.classes;
        } catch (error) {
            console.error('載入課堂失敗:', error);
            throw error;
        }
    }

    getAllClasses() {
        return this.classes;
    }

    getClassById(classId) {
        return this.classes.find(classItem => classItem.id === classId);
    }

    getClassByName(className) {
        return this.classes.find(classItem => classItem.name === className);
    }

    async addClass(classData) {
        try {
            // 驗證必要欄位
            if (!classData.name || !classData.startTime || !classData.endTime || !classData.dayOfWeek) {
                throw new Error('班組名稱、上課時間和上課日期為必填欄位');
            }

            // 檢查班組名稱是否已存在
            const existingClass = this.classes.find(c => c.name === classData.name);
            if (existingClass) {
                throw new Error('班組名稱已存在');
            }

            // 驗證時間格式
            if (!this.isValidTime(classData.startTime) || !this.isValidTime(classData.endTime)) {
                throw new Error('時間格式不正確');
            }

            // 檢查結束時間是否晚於開始時間
            if (classData.startTime >= classData.endTime) {
                throw new Error('結束時間必須晚於開始時間');
            }

            // 檢查時間衝突
            const hasConflict = this.checkTimeConflict(classData);
            if (hasConflict) {
                throw new Error('該時段與其他課堂時間衝突');
            }

            // 創建課堂對象
            const classForDataManager = {
                name: classData.name.trim(),
                startTime: classData.startTime,
                endTime: classData.endTime,
                dayOfWeek: parseInt(classData.dayOfWeek),
                description: classData.description || '',
                frequency: 'weekly',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // 保存到數據管理器
            const classId = this.dataManager.addClass(classForDataManager);
            
            if (classId) {
                const newClass = {
                    id: classId,
                    ...classForDataManager
                };
                this.classes.push(newClass);
                return newClass;
            } else {
                throw new Error('保存課堂失敗');
            }
        } catch (error) {
            console.error('新增課堂失敗:', error);
            throw error;
        }
    }

    async updateClass(classId, updatedData) {
        try {
            const classIndex = this.classes.findIndex(c => c.id === classId);
            
            if (classIndex === -1) {
                throw new Error('找不到指定課堂');
            }

            // 驗證必要欄位
            if (updatedData.name && !updatedData.name.trim()) {
                throw new Error('班組名稱不能為空');
            }

            // 檢查班組名稱是否與其他課堂重複
            if (updatedData.name) {
                const existingClass = this.classes.find(c => 
                    c.id !== classId && c.name === updatedData.name
                );
                if (existingClass) {
                    throw new Error('班組名稱已存在');
                }
            }

            // 驗證時間格式
            if (updatedData.startTime && !this.isValidTime(updatedData.startTime)) {
                throw new Error('開始時間格式不正確');
            }
            if (updatedData.endTime && !this.isValidTime(updatedData.endTime)) {
                throw new Error('結束時間格式不正確');
            }

            // 檢查時間邏輯
            const startTime = updatedData.startTime || this.classes[classIndex].startTime;
            const endTime = updatedData.endTime || this.classes[classIndex].endTime;
            
            if (startTime >= endTime) {
                throw new Error('結束時間必須晚於開始時間');
            }

            // 檢查時間衝突（排除當前課堂）
            const tempClassData = {
                ...this.classes[classIndex],
                ...updatedData
            };
            const hasConflict = this.checkTimeConflict(tempClassData, classId);
            if (hasConflict) {
                throw new Error('該時段與其他課堂時間衝突');
            }

            // 更新課堂資料
            const updatedClass = {
                ...this.classes[classIndex],
                ...updatedData,
                updatedAt: new Date().toISOString()
            };

            // 保存到數據管理器
            const success = this.dataManager.updateClass(classId, updatedClass);
            
            if (success) {
                this.classes[classIndex] = updatedClass;
                return updatedClass;
            } else {
                throw new Error('更新課堂失敗');
            }
        } catch (error) {
            console.error('更新課堂失敗:', error);
            throw error;
        }
    }

    async deleteClass(classId) {
        try {
            const classIndex = this.classes.findIndex(c => c.id === classId);
            
            if (classIndex === -1) {
                throw new Error('找不到指定課堂');
            }

            const classItem = this.classes[classIndex];

            // 檢查是否有學員在此課堂
            const students = this.dataManager.getStudents(classId);
            
            if (students.length > 0) {
                const confirmDelete = confirm(
                    `該課堂有 ${students.length} 位學員，刪除課堂將會影響這些學員的班別資訊。確定要繼續嗎？`
                );
                
                if (!confirmDelete) {
                    return false;
                }
            }

            // 檢查是否有相關的點名記錄
            const attendanceRecords = this.dataManager.getAttendance().filter(a => {
                const student = this.dataManager.getStudent(a.studentId);
                return student && student.class === classId;
            });
            
            if (attendanceRecords.length > 0) {
                const confirmDeleteAttendance = confirm(
                    `該課堂有 ${attendanceRecords.length} 筆點名記錄，刪除課堂將同時刪除所有相關記錄。確定要繼續嗎？`
                );
                
                if (!confirmDeleteAttendance) {
                    return false;
                }
            }

            // 從數據管理器中刪除
            this.dataManager.deleteClass(classId);
            this.classes.splice(classIndex, 1);
            return true;
        } catch (error) {
            console.error('刪除課堂失敗:', error);
            throw error;
        }
    }

    // 檢查時間衝突
    checkTimeConflict(classData, excludeClassId = null) {
        return this.classes.some(existingClass => {
            // 排除指定的課堂（用於更新時）
            if (excludeClassId && existingClass.id === excludeClassId) {
                return false;
            }

            // 只檢查同一天的課堂
            if (existingClass.dayOfWeek !== parseInt(classData.dayOfWeek)) {
                return false;
            }

            // 檢查時間重疊
            const newStart = classData.startTime;
            const newEnd = classData.endTime;
            const existingStart = existingClass.startTime;
            const existingEnd = existingClass.endTime;

            return (
                (newStart >= existingStart && newStart < existingEnd) ||
                (newEnd > existingStart && newEnd <= existingEnd) ||
                (newStart <= existingStart && newEnd >= existingEnd)
            );
        });
    }

    // 獲取指定日期的課堂
    getClassesByDay(dayOfWeek) {
        return this.classes.filter(classItem => classItem.dayOfWeek === dayOfWeek);
    }

    // 獲取今日課堂
    getTodayClasses() {
        const today = new Date().getDay();
        return this.getClassesByDay(today);
    }

    // 獲取即將到來的課堂
    getUpcomingClasses(days = 7) {
        const today = new Date();
        const upcomingClasses = [];

        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dayOfWeek = date.getDay();
            
            const dayClasses = this.getClassesByDay(dayOfWeek);
            dayClasses.forEach(classItem => {
                upcomingClasses.push({
                    ...classItem,
                    date: date.toISOString().split('T')[0],
                    dayName: this.getDayName(dayOfWeek)
                });
            });
        }

        return upcomingClasses.sort((a, b) => {
            if (a.date === b.date) {
                return a.startTime.localeCompare(b.startTime);
            }
            return a.date.localeCompare(b.date);
        });
    }

    // 獲取課堂統計
    getClassStatistics() {
        const total = this.classes.length;
        const byDay = {};
        
        // 初始化每天的計數
        for (let i = 0; i < 7; i++) {
            byDay[this.getDayName(i)] = 0;
        }
        
        // 計算每天的課堂數
        this.classes.forEach(classItem => {
            const dayName = this.getDayName(classItem.dayOfWeek);
            byDay[dayName]++;
        });

        // 計算平均課堂時長
        const totalDuration = this.classes.reduce((sum, classItem) => {
            const duration = this.getClassDuration(classItem);
            return sum + duration;
        }, 0);
        
        const averageDuration = total > 0 ? Math.round(totalDuration / total) : 0;

        return {
            total,
            byDay,
            averageDuration
        };
    }

    // 獲取課堂時長（分鐘）
    getClassDuration(classItem) {
        const start = new Date(`2000-01-01T${classItem.startTime}`);
        const end = new Date(`2000-01-01T${classItem.endTime}`);
        return (end - start) / (1000 * 60); // 轉換為分鐘
    }

    // 生成課堂時間表
    generateSchedule() {
        const schedule = {};
        
        // 初始化一週的時間表
        for (let day = 0; day < 7; day++) {
            schedule[day] = {
                dayName: this.getDayName(day),
                classes: []
            };
        }
        
        // 填入課堂資料
        this.classes.forEach(classItem => {
            schedule[classItem.dayOfWeek].classes.push({
                ...classItem,
                duration: this.getClassDuration(classItem)
            });
        });
        
        // 按時間排序
        Object.values(schedule).forEach(day => {
            day.classes.sort((a, b) => a.startTime.localeCompare(b.startTime));
        });
        
        return schedule;
    }

    // 匯出課堂資料為CSV
    exportClassesToCSV() {
        const headers = ['班組名稱', '上課日期', '開始時間', '結束時間', '課堂時長(分鐘)', '描述', '建立日期'];
        const rows = this.classes.map(classItem => [
            classItem.name,
            this.getDayName(classItem.dayOfWeek),
            classItem.startTime,
            classItem.endTime,
            this.getClassDuration(classItem),
            classItem.description || '',
            new Date(classItem.createdAt).toLocaleDateString('zh-TW')
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        return csvContent;
    }

    // 從CSV匯入課堂資料
    async importClassesFromCSV(csvContent) {
        try {
            const lines = csvContent.split('\n');
            const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
            
            const importedClasses = [];
            const errors = [];

            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;

                try {
                    const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
                    
                    const classData = {
                        name: values[0],
                        dayOfWeek: this.getDayOfWeekByName(values[1]),
                        startTime: values[2],
                        endTime: values[3],
                        description: values[5]
                    };

                    if (classData.name && classData.startTime && classData.endTime && classData.dayOfWeek !== -1) {
                        const classItem = await this.addClass(classData);
                        importedClasses.push(classItem);
                    }
                } catch (error) {
                    errors.push(`第 ${i + 1} 行: ${error.message}`);
                }
            }

            return {
                success: importedClasses.length,
                errors: errors,
                total: lines.length - 1
            };
        } catch (error) {
            throw new Error('CSV 格式錯誤: ' + error.message);
        }
    }

    // 工具函數
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    isValidTime(timeString) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(timeString);
    }

    getDayName(dayOfWeek) {
        const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        return days[dayOfWeek] || '';
    }

    getDayOfWeekByName(dayName) {
        const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        return days.indexOf(dayName);
    }

    // 驗證課堂資料
    validateClassData(classData) {
        const errors = [];

        if (!classData.name || !classData.name.trim()) {
            errors.push('班組名稱為必填欄位');
        }

        if (!classData.startTime) {
            errors.push('開始時間為必填欄位');
        } else if (!this.isValidTime(classData.startTime)) {
            errors.push('開始時間格式不正確');
        }

        if (!classData.endTime) {
            errors.push('結束時間為必填欄位');
        } else if (!this.isValidTime(classData.endTime)) {
            errors.push('結束時間格式不正確');
        }

        if (classData.startTime && classData.endTime && classData.startTime >= classData.endTime) {
            errors.push('結束時間必須晚於開始時間');
        }

        if (classData.dayOfWeek === undefined || classData.dayOfWeek === null || classData.dayOfWeek === '') {
            errors.push('上課日期為必填欄位');
        }

        return errors;
    }

    // 獲取課堂的學員數量
    getClassStudentCount(classId) {
        const students = this.dataManager.getStudents(classId);
        return students.length;
    }

    // 獲取所有課堂的學員數量統計
    getClassStudentCounts() {
        const counts = {};
        
        this.classes.forEach(classItem => {
            counts[classItem.id] = this.getClassStudentCount(classItem.id);
        });
        
        return counts;
    }

    // 獲取最受歡迎的課堂（學員數最多）
    getMostPopularClasses(limit = 5) {
        const classCounts = this.classes.map(classItem => ({
            ...classItem,
            studentCount: this.getClassStudentCount(classItem.id)
        }));
        
        return classCounts
            .sort((a, b) => b.studentCount - a.studentCount)
            .slice(0, limit);
    }

    // 獲取空課堂（沒有學員的課堂）
    getEmptyClasses() {
        return this.classes.filter(classItem => 
            this.getClassStudentCount(classItem.id) === 0
        );
    }
}

// 全局函數
function manageClass(classId) {
    classManager.manageClass(classId);
}

function deleteClass(classId) {
    classManager.deleteClass(classId);
}

function addClassDate() {
    classManager.addClassDate();
}

function generateWeeklyClasses() {
    classManager.generateWeeklyClasses();
}

function generateClassSchedule() {
    classManager.generateClassSchedule();
} 