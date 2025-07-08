// 點名管理模組
class AttendanceManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.currentAttendance = new Map(); // 當前點名狀態的臨時存儲
    }

    // 初始化點名管理
    init() {
        this.loadClassDates();
    }

    // 載入課堂日期選項
    loadClassDates() {
        const classId = document.getElementById('attendanceClass').value;
        const dateSelect = document.getElementById('attendanceDate');
        
        // 獲取該班級的所有課堂日期
        const classDates = this.dataManager.getClassDates(classId);
        
        dateSelect.innerHTML = '<option value="">請選擇日期</option>';
        classDates.forEach(date => {
            const option = document.createElement('option');
            option.value = date;
            option.textContent = date + (date === new Date().toISOString().split('T')[0] ? ' (今日)' : '');
            dateSelect.appendChild(option);
        });
        
        // 自動選擇今日如果有課
        const today = new Date().toISOString().split('T')[0];
        if (classDates.includes(today)) {
            dateSelect.value = today;
            this.loadAttendance();
        }
    }

    // 載入點名列表
    loadAttendance() {
        const date = document.getElementById('attendanceDate').value;
        const classId = document.getElementById('attendanceClass').value;
        
        if (!date) {
            document.getElementById('attendanceList').innerHTML = '<p>請選擇課堂日期</p>';
            this.updateStats(0, 0, 0, 0);
            return;
        }

        const classStudents = this.dataManager.getStudents(classId);
        const container = document.getElementById('attendanceList');

        // 更新班級統計
        const stats = this.dataManager.getAttendanceStats(classId, date);
        this.updateStats(stats.total, stats.present, stats.absent, stats.rate);

        if (classStudents.length === 0) {
            container.innerHTML = '<p>此班別暫無學員</p>';
            return;
        }

        container.innerHTML = classStudents.map(student => {
            const status = this.dataManager.getAttendance(student.id, date);
            
            return `
                <div class="attendance-card">
                    <h4>${student.name}</h4>
                    <div class="attendance-status">
                        <button class="btn ${status === 'present' ? 'status-present' : ''}" 
                                onclick="attendanceManager.markAttendance('${student.id}', '${date}', 'present')">
                            出席
                        </button>
                        <button class="btn ${status === 'absent' ? 'status-absent' : ''}" 
                                onclick="attendanceManager.markAttendance('${student.id}', '${date}', 'absent')">
                            缺席
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 標記出席
    markAttendance(studentId, date, status) {
        this.dataManager.markAttendance(studentId, date, status);
        this.loadAttendance(); // 重新載入以更新統計
    }

    // 更新統計顯示
    updateStats(total, present, absent, rate) {
        document.getElementById('classStudentCount').textContent = total;
        document.getElementById('todayPresent').textContent = present;
        document.getElementById('todayAbsent').textContent = absent;
        document.getElementById('attendanceRate').textContent = rate + '%';
    }

    // 獲取指定課堂和日期的點名記錄
    async getAttendance(classId, date) {
        try {
            const attendance = this.dataManager.getAttendanceByClassAndDate(classId, date);
            
            // 將數據載入到當前點名狀態
            this.currentAttendance.clear();
            attendance.forEach(record => {
                this.currentAttendance.set(record.studentId, record.status);
            });
            
            return attendance;
        } catch (error) {
            console.error('獲取點名記錄失敗:', error);
            throw error;
        }
    }

    // 設置學員的點名狀態（臨時存儲）
    setAttendanceStatus(studentId, classId, date, status) {
        try {
            // 驗證狀態值
            if (!['present', 'absent'].includes(status)) {
                throw new Error('無效的點名狀態');
            }

            // 更新臨時存儲
            this.currentAttendance.set(studentId, status);
            
            // 同時更新數據管理器
            this.dataManager.setAttendanceStatus(studentId, classId, date, status);
            
            return true;
        } catch (error) {
            console.error('設置點名狀態失敗:', error);
            throw error;
        }
    }

    // 保存當前的點名記錄
    async saveAttendance() {
        try {
            // 數據已經在 setAttendanceStatus 中保存到數據管理器
            // 這裡可以添加額外的保存邏輯，如同步到雲端
            
            return true;
        } catch (error) {
            console.error('保存點名記錄失敗:', error);
            throw error;
        }
    }

    // 獲取學員的出席統計
    getStudentAttendanceStats(studentId, startDate = null, endDate = null) {
        try {
            const allAttendance = this.dataManager.getAttendance();
            let studentAttendance = allAttendance.filter(record => record.studentId === studentId);
            
            // 應用日期篩選
            if (startDate) {
                studentAttendance = studentAttendance.filter(record => record.date >= startDate);
            }
            if (endDate) {
                studentAttendance = studentAttendance.filter(record => record.date <= endDate);
            }
            
            const total = studentAttendance.length;
            const present = studentAttendance.filter(record => record.status === 'present').length;
            const absent = studentAttendance.filter(record => record.status === 'absent').length;
            const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
            
            return {
                total,
                present,
                absent,
                attendanceRate
            };
        } catch (error) {
            console.error('獲取學員出席統計失敗:', error);
            throw error;
        }
    }

    // 獲取課堂的出席統計
    getClassAttendanceStats(classId, startDate = null, endDate = null) {
        try {
            const allAttendance = this.dataManager.getAttendance();
            const classStudents = this.dataManager.getStudents(classId);
            
            let classAttendance = allAttendance.filter(record => {
                const student = classStudents.find(s => s.id === record.studentId);
                if (!student) return false;
                if (startDate && record.date < startDate) return false;
                if (endDate && record.date > endDate) return false;
                return true;
            });
            
            // 按日期分組統計
            const attendanceByDate = {};
            classAttendance.forEach(record => {
                if (!attendanceByDate[record.date]) {
                    attendanceByDate[record.date] = {
                        date: record.date,
                        total: 0,
                        present: 0,
                        absent: 0
                    };
                }
                
                attendanceByDate[record.date].total++;
                if (record.status === 'present') {
                    attendanceByDate[record.date].present++;
                } else if (record.status === 'absent') {
                    attendanceByDate[record.date].absent++;
                }
            });
            
            // 計算每日出席率
            Object.values(attendanceByDate).forEach(dayStats => {
                dayStats.attendanceRate = dayStats.total > 0 ? 
                    Math.round((dayStats.present / dayStats.total) * 100) : 0;
            });
            
            // 計算總體統計
            const total = classAttendance.length;
            const present = classAttendance.filter(record => record.status === 'present').length;
            const absent = classAttendance.filter(record => record.status === 'absent').length;
            const averageAttendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
            
            return {
                total,
                present,
                absent,
                averageAttendanceRate,
                byDate: Object.values(attendanceByDate).sort((a, b) => a.date.localeCompare(b.date))
            };
        } catch (error) {
            console.error('獲取課堂出席統計失敗:', error);
            throw error;
        }
    }

    // 獲取指定日期範圍內的出席統計
    getAttendanceStatsByDateRange(startDate, endDate, classId = null) {
        try {
            let attendance = this.dataManager.getAttendance();
            
            // 應用篩選條件
            attendance = attendance.filter(record => 
                record.date >= startDate && record.date <= endDate
            );
            
            if (classId) {
                attendance = attendance.filter(record => record.classId === classId);
            }
            
            // 按日期分組
            const statsByDate = {};
            attendance.forEach(record => {
                if (!statsByDate[record.date]) {
                    statsByDate[record.date] = {
                        date: record.date,
                        total: 0,
                        present: 0,
                        absent: 0,
                        students: new Set()
                    };
                }
                
                statsByDate[record.date].total++;
                statsByDate[record.date].students.add(record.studentId);
                
                if (record.status === 'present') {
                    statsByDate[record.date].present++;
                } else if (record.status === 'absent') {
                    statsByDate[record.date].absent++;
                }
            });
            
            // 轉換為數組並計算出席率
            const results = Object.values(statsByDate).map(dayStats => ({
                date: dayStats.date,
                total: dayStats.total,
                present: dayStats.present,
                absent: dayStats.absent,
                uniqueStudents: dayStats.students.size,
                attendanceRate: dayStats.total > 0 ? 
                    Math.round((dayStats.present / dayStats.total) * 100) : 0
            }));
            
            return results.sort((a, b) => a.date.localeCompare(b.date));
        } catch (error) {
            console.error('獲取日期範圍出席統計失敗:', error);
            throw error;
        }
    }

    // 獲取缺席次數最多的學員
    getMostAbsentStudents(limit = 10, startDate = null, endDate = null) {
        try {
            const students = this.dataManager.getStudents();
            const studentStats = students.map(student => {
                const stats = this.getStudentAttendanceStats(student.id, startDate, endDate);
                return {
                    ...student,
                    ...stats
                };
            });
            
            return studentStats
                .filter(student => student.total > 0)
                .sort((a, b) => b.absent - a.absent)
                .slice(0, limit);
        } catch (error) {
            console.error('獲取缺席最多學員失敗:', error);
            throw error;
        }
    }

    // 獲取出席率最低的學員
    getLowestAttendanceStudents(limit = 10, minClasses = 3) {
        try {
            const students = this.dataManager.getStudents();
            const studentStats = students.map(student => {
                const stats = this.getStudentAttendanceStats(student.id);
                return {
                    ...student,
                    ...stats
                };
            });
            
            return studentStats
                .filter(student => student.total >= minClasses)
                .sort((a, b) => a.attendanceRate - b.attendanceRate)
                .slice(0, limit);
        } catch (error) {
            console.error('獲取出席率最低學員失敗:', error);
            throw error;
        }
    }

    // 批量設置點名狀態
    setBatchAttendanceStatus(studentIds, classId, date, status) {
        try {
            const results = {
                success: 0,
                failed: 0,
                errors: []
            };
            
            studentIds.forEach(studentId => {
                try {
                    this.setAttendanceStatus(studentId, classId, date, status);
                    results.success++;
                } catch (error) {
                    results.failed++;
                    results.errors.push(`學員 ${studentId}: ${error.message}`);
                }
            });
            
            return results;
        } catch (error) {
            console.error('批量設置點名狀態失敗:', error);
            throw error;
        }
    }

    // 複製上次點名記錄
    copyLastAttendance(classId, targetDate) {
        try {
            // 獲取該課堂的所有點名記錄
            const allAttendance = this.dataManager.getAttendance();
            const classStudents = this.dataManager.getStudents(classId);
            
            const classAttendance = allAttendance
                .filter(record => {
                    const student = classStudents.find(s => s.id === record.studentId);
                    return student && record.date < targetDate;
                })
                .sort((a, b) => b.date.localeCompare(a.date));
            
            if (classAttendance.length === 0) {
                throw new Error('找不到可複製的點名記錄');
            }
            
            // 獲取最近一次的點名記錄
            const lastDate = classAttendance[0].date;
            const lastAttendance = classAttendance.filter(record => record.date === lastDate);
            
            // 複製到目標日期
            const results = {
                success: 0,
                failed: 0,
                errors: []
            };
            
            lastAttendance.forEach(record => {
                try {
                    this.setAttendanceStatus(record.studentId, classId, targetDate, record.status);
                    results.success++;
                } catch (error) {
                    results.failed++;
                    results.errors.push(`學員 ${record.studentId}: ${error.message}`);
                }
            });
            
            return {
                ...results,
                sourceDate: lastDate,
                targetDate: targetDate
            };
        } catch (error) {
            console.error('複製點名記錄失敗:', error);
            throw error;
        }
    }

    // 匯出點名記錄為CSV
    exportAttendanceToCSV(startDate = null, endDate = null, classId = null) {
        try {
            let attendance = this.dataManager.getAttendance();
            const students = this.dataManager.getStudents();
            const classes = this.dataManager.getClasses();
            
            // 應用篩選條件
            if (startDate) {
                attendance = attendance.filter(record => record.date >= startDate);
            }
            if (endDate) {
                attendance = attendance.filter(record => record.date <= endDate);
            }
            if (classId) {
                const classStudents = this.dataManager.getStudents(classId);
                const classStudentIds = classStudents.map(s => s.id);
                attendance = attendance.filter(record => classStudentIds.includes(record.studentId));
            }
            
            // 創建學員和課堂的查找映射
            const studentMap = new Map(students.map(s => [s.id, s]));
            
            // 準備CSV數據
            const headers = ['日期', '課堂', '學員姓名', '出席狀態', '記錄時間'];
            const rows = attendance.map(record => {
                const student = studentMap.get(record.studentId);
                const className = student ? this.dataManager.getClassName(student.class) : '未知課堂';
                
                return [
                    record.date,
                    className,
                    student ? student.name : '未知學員',
                    record.status === 'present' ? '出席' : '缺席',
                    new Date(record.createdAt).toLocaleString('zh-TW')
                ];
            });
            
            const csvContent = [headers, ...rows]
                .map(row => row.map(field => `"${field}"`).join(','))
                .join('\n');
            
            return csvContent;
        } catch (error) {
            console.error('匯出點名記錄失敗:', error);
            throw error;
        }
    }

    // 從CSV匯入點名記錄
    async importAttendanceFromCSV(csvContent) {
        try {
            const lines = csvContent.split('\n');
            const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
            
            const students = this.dataManager.getStudents();
            const classes = this.dataManager.getClasses();
            
            // 創建名稱到ID的映射
            const studentNameMap = new Map(students.map(s => [s.name, s.id]));
            const classNameMap = new Map(classes.map(c => [c.name, c.id]));
            
            const importedRecords = [];
            const errors = [];
            
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                
                try {
                    const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
                    
                    const date = values[0];
                    const className = values[1];
                    const studentName = values[2];
                    const statusText = values[3];
                    
                    // 驗證和轉換數據
                    const classId = classNameMap.get(className);
                    const studentId = studentNameMap.get(studentName);
                    const status = statusText === '出席' ? 'present' : 'absent';
                    
                    if (!classId) {
                        throw new Error(`找不到課堂: ${className}`);
                    }
                    if (!studentId) {
                        throw new Error(`找不到學員: ${studentName}`);
                    }
                    if (!date || !this.isValidDate(date)) {
                        throw new Error(`無效的日期格式: ${date}`);
                    }
                    
                    // 設置點名狀態
                    this.setAttendanceStatus(studentId, classId, date, status);
                    importedRecords.push({ date, className, studentName, status });
                    
                } catch (error) {
                    errors.push(`第 ${i + 1} 行: ${error.message}`);
                }
            }
            
            return {
                success: importedRecords.length,
                errors: errors,
                total: lines.length - 1
            };
        } catch (error) {
            throw new Error('CSV 格式錯誤: ' + error.message);
        }
    }

    // 清除指定日期的點名記錄
    clearAttendanceByDate(date, classId = null) {
        try {
            const allAttendance = this.dataManager.getAttendance();
            let filteredAttendance;
            
            if (classId) {
                filteredAttendance = allAttendance.filter(record => 
                    !(record.date === date && record.classId === classId)
                );
            } else {
                filteredAttendance = allAttendance.filter(record => record.date !== date);
            }
            
            const deletedCount = allAttendance.length - filteredAttendance.length;
            this.dataManager.saveAttendance(filteredAttendance);
            
            return deletedCount;
        } catch (error) {
            console.error('清除點名記錄失敗:', error);
            throw error;
        }
    }

    // 工具函數
    isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    // 獲取點名記錄的摘要統計
    getAttendanceSummary(classId = null, startDate = null, endDate = null) {
        try {
            let attendance = this.dataManager.getAttendance();
            
            // 應用篩選條件
            if (classId) {
                attendance = attendance.filter(record => record.classId === classId);
            }
            if (startDate) {
                attendance = attendance.filter(record => record.date >= startDate);
            }
            if (endDate) {
                attendance = attendance.filter(record => record.date <= endDate);
            }
            
            const totalRecords = attendance.length;
            const presentCount = attendance.filter(record => record.status === 'present').length;
            const absentCount = attendance.filter(record => record.status === 'absent').length;
            const uniqueStudents = new Set(attendance.map(record => record.studentId)).size;
            const uniqueDates = new Set(attendance.map(record => record.date)).size;
            const overallAttendanceRate = totalRecords > 0 ? 
                Math.round((presentCount / totalRecords) * 100) : 0;
            
            return {
                totalRecords,
                presentCount,
                absentCount,
                uniqueStudents,
                uniqueDates,
                overallAttendanceRate
            };
        } catch (error) {
            console.error('獲取點名摘要失敗:', error);
            throw error;
        }
    }
}

// 全局函數
function loadClassDates() {
    attendanceManager.loadClassDates();
}

function loadAttendance() {
    attendanceManager.loadAttendance();
}

function markAttendance(studentId, date, status) {
    attendanceManager.markAttendance(studentId, date, status);
} 