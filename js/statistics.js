// 統計管理模組
class StatisticsManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    // 生成綜合統計報表
    async generateStatistics(filters = {}) {
        try {
            const { classId, startDate, endDate } = filters;
            
            // 獲取基礎數據
            const students = this.dataManager.getStudents();
            const classes = this.dataManager.classDefinitions;
            const attendance = this.dataManager.attendance;
            
            // 應用篩選條件
            let filteredStudents = students;
            let filteredAttendance = Object.keys(attendance);
            
            if (classId) {
                filteredStudents = students.filter(s => s.class === classId);
                filteredAttendance = filteredAttendance.filter(key => {
                    const studentId = key.split('_')[1];
                    const student = students.find(s => s.id === studentId);
                    return student && student.class === classId;
                });
            }
            
            if (startDate) {
                filteredAttendance = filteredAttendance.filter(key => {
                    const date = key.split('_')[0];
                    return date >= startDate;
                });
            }
            
            if (endDate) {
                filteredAttendance = filteredAttendance.filter(key => {
                    const date = key.split('_')[0];
                    return date <= endDate;
                });
            }
            
            // 計算統計數據
            const totalStudents = filteredStudents.length;
            const totalClasses = classId ? 1 : Object.keys(classes).length;
            const totalAttendanceRecords = filteredAttendance.length;
            const presentCount = filteredAttendance.filter(key => attendance[key] === 'present').length;
            const absentCount = filteredAttendance.filter(key => attendance[key] === 'absent').length;
            const averageAttendance = totalAttendanceRecords > 0 ? 
                Math.round((presentCount / totalAttendanceRecords) * 100) : 0;
            
            return {
                totalStudents,
                totalClasses,
                totalAttendance: presentCount,
                totalAbsent: absentCount,
                averageAttendance,
                totalAttendanceRecords,
                period: {
                    startDate: startDate || '開始',
                    endDate: endDate || '現在'
                }
            };
        } catch (error) {
            console.error('生成統計報表失敗:', error);
            throw error;
        }
    }

    // 獲取學員出席率排名
    getStudentAttendanceRanking(limit = 10, classId = null, startDate = null, endDate = null) {
        try {
            let students = this.dataManager.getStudents();
            
            if (classId) {
                students = students.filter(s => s.class === classId);
            }
            
            const studentStats = students.map(student => {
                const stats = this.getStudentAttendanceStats(student.id, startDate, endDate);
                return {
                    id: student.id,
                    name: student.name,
                    className: this.dataManager.getClassName(student.class),
                    ...stats
                };
            });
            
            return studentStats
                .filter(s => s.total > 0)
                .sort((a, b) => b.attendanceRate - a.attendanceRate)
                .slice(0, limit);
        } catch (error) {
            console.error('獲取學員出席率排名失敗:', error);
            throw error;
        }
    }

    // 獲取課堂出席率統計
    getClassAttendanceStats(startDate = null, endDate = null) {
        try {
            const classes = this.dataManager.classDefinitions;
            
            return Object.keys(classes).map(classId => {
                const stats = this.getClassAttendanceStatsById(classId, startDate, endDate);
                return {
                    id: classId,
                    name: classes[classId].name,
                    dayOfWeek: classes[classId].dayOfWeek,
                    time: `${classes[classId].startTime} - ${classes[classId].endTime}`,
                    ...stats
                };
            }).sort((a, b) => b.averageAttendanceRate - a.averageAttendanceRate);
        } catch (error) {
            console.error('獲取課堂出席率統計失敗:', error);
            throw error;
        }
    }

    // 獲取單個學員的出席統計
    getStudentAttendanceStats(studentId, startDate = null, endDate = null) {
        try {
            const attendance = this.dataManager.attendance;
            let studentAttendance = Object.keys(attendance).filter(key => {
                const [date, sId] = key.split('_');
                if (sId !== studentId) return false;
                if (startDate && date < startDate) return false;
                if (endDate && date > endDate) return false;
                return true;
            });
            
            const total = studentAttendance.length;
            const present = studentAttendance.filter(key => attendance[key] === 'present').length;
            const absent = studentAttendance.filter(key => attendance[key] === 'absent').length;
            const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
            
            return { total, present, absent, attendanceRate };
        } catch (error) {
            console.error('獲取學員出席統計失敗:', error);
            throw error;
        }
    }

    // 獲取單個課堂的出席統計
    getClassAttendanceStatsById(classId, startDate = null, endDate = null) {
        try {
            const attendance = this.dataManager.attendance;
            const students = this.dataManager.getStudents(classId);
            
            let classAttendance = Object.keys(attendance).filter(key => {
                const [date, studentId] = key.split('_');
                const student = students.find(s => s.id === studentId);
                if (!student) return false;
                if (startDate && date < startDate) return false;
                if (endDate && date > endDate) return false;
                return true;
            });
            
            const total = classAttendance.length;
            const present = classAttendance.filter(key => attendance[key] === 'present').length;
            const absent = classAttendance.filter(key => attendance[key] === 'absent').length;
            const averageAttendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
            
            // 計算學員數量
            const studentCount = students.length;
            
            // 計算課堂次數
            const uniqueDates = new Set(classAttendance.map(key => key.split('_')[0])).size;
            
            return {
                total,
                present,
                absent,
                averageAttendanceRate,
                studentCount,
                classCount: uniqueDates
            };
        } catch (error) {
            console.error('獲取課堂出席統計失敗:', error);
            throw error;
        }
    }

    // 獲取每日出席統計
    getDailyAttendanceStats(startDate, endDate, classId = null) {
        try {
            const attendance = this.dataManager.attendance;
            let filteredKeys = Object.keys(attendance).filter(key => {
                const [date, studentId] = key.split('_');
                if (date < startDate || date > endDate) return false;
                
                if (classId) {
                    const student = this.dataManager.getStudent(studentId);
                    if (!student || student.class !== classId) return false;
                }
                
                return true;
            });
            
            // 按日期分組統計
            const dailyStats = {};
            filteredKeys.forEach(key => {
                const [date] = key.split('_');
                if (!dailyStats[date]) {
                    dailyStats[date] = {
                        date: date,
                        total: 0,
                        present: 0,
                        absent: 0
                    };
                }
                
                dailyStats[date].total++;
                if (attendance[key] === 'present') {
                    dailyStats[date].present++;
                } else if (attendance[key] === 'absent') {
                    dailyStats[date].absent++;
                }
            });
            
            // 計算出席率並排序
            return Object.values(dailyStats)
                .map(day => ({
                    ...day,
                    attendanceRate: day.total > 0 ? Math.round((day.present / day.total) * 100) : 0
                }))
                .sort((a, b) => a.date.localeCompare(b.date));
        } catch (error) {
            console.error('獲取每日出席統計失敗:', error);
            throw error;
        }
    }

    // 獲取統計摘要
    getStatisticsSummary() {
        try {
            const students = this.dataManager.getStudents();
            const classes = this.dataManager.classDefinitions;
            const attendance = this.dataManager.attendance;
            
            const totalStudents = students.length;
            const totalClasses = Object.keys(classes).length;
            const totalAttendanceRecords = Object.keys(attendance).length;
            const presentCount = Object.values(attendance).filter(status => status === 'present').length;
            const overallAttendanceRate = totalAttendanceRecords > 0 ? 
                Math.round((presentCount / totalAttendanceRecords) * 100) : 0;
            
            // 最近7天的統計
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
            
            const recentAttendanceKeys = Object.keys(attendance).filter(key => {
                const date = key.split('_')[0];
                return date >= sevenDaysAgoStr;
            });
            
            const recentPresentCount = recentAttendanceKeys.filter(key => attendance[key] === 'present').length;
            const recentAttendanceRate = recentAttendanceKeys.length > 0 ? 
                Math.round((recentPresentCount / recentAttendanceKeys.length) * 100) : 0;
            
            return {
                totalStudents,
                totalClasses,
                totalAttendanceRecords,
                overallAttendanceRate,
                recentAttendanceRate,
                trend: recentAttendanceRate - overallAttendanceRate
            };
        } catch (error) {
            console.error('獲取統計摘要失敗:', error);
            throw error;
        }
    }

    // 匯出統計報表為CSV
    exportStatisticsToCSV(type, filters = {}) {
        try {
            let csvContent = '';
            
            switch (type) {
                case 'student_ranking':
                    csvContent = this.exportStudentRankingCSV(filters);
                    break;
                case 'class_stats':
                    csvContent = this.exportClassStatsCSV(filters);
                    break;
                case 'daily_stats':
                    csvContent = this.exportDailyStatsCSV(filters);
                    break;
                default:
                    throw new Error('不支援的匯出類型');
            }
            
            return csvContent;
        } catch (error) {
            console.error('匯出統計報表失敗:', error);
            throw error;
        }
    }

    // 匯出學員排名CSV
    exportStudentRankingCSV(filters) {
        const ranking = this.getStudentAttendanceRanking(100, filters.classId, filters.startDate, filters.endDate);
        
        const headers = ['排名', '學員姓名', '班別', '總課堂數', '出席次數', '缺席次數', '出席率'];
        const rows = ranking.map((student, index) => [
            index + 1,
            student.name,
            student.className,
            student.total,
            student.present,
            student.absent,
            `${student.attendanceRate}%`
        ]);
        
        return [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
    }

    // 匯出課堂統計CSV
    exportClassStatsCSV(filters) {
        const classStats = this.getClassAttendanceStats(filters.startDate, filters.endDate);
        
        const headers = ['課堂名稱', '上課時間', '學員數', '課堂次數', '總出席次數', '總缺席次數', '平均出席率'];
        const rows = classStats.map(classItem => [
            classItem.name,
            classItem.time,
            classItem.studentCount,
            classItem.classCount,
            classItem.present,
            classItem.absent,
            `${classItem.averageAttendanceRate}%`
        ]);
        
        return [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
    }

    // 匯出每日統計CSV
    exportDailyStatsCSV(filters) {
        const dailyStats = this.getDailyAttendanceStats(
            filters.startDate, 
            filters.endDate, 
            filters.classId
        );
        
        const headers = ['日期', '總出席記錄', '出席次數', '缺席次數', '出席率'];
        const rows = dailyStats.map(day => [
            day.date,
            day.total,
            day.present,
            day.absent,
            `${day.attendanceRate}%`
        ]);
        
        return [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
    }
} 