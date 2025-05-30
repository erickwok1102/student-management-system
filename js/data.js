// 數據管理模組
class DataManager {
    constructor() {
        this.SHEET_ID = localStorage.getItem('googleSheetId') || '';
        this.API_KEY = localStorage.getItem('googleApiKey') || '';
        this.RANGE = 'Sheet1!A:Z';
        this.isGoogleSheetsEnabled = false;
        this.students = JSON.parse(localStorage.getItem('students')) || [];
        this.attendance = JSON.parse(localStorage.getItem('attendance')) || {};
        this.classSchedule = JSON.parse(localStorage.getItem('classSchedule')) || [];
        this.classDefinitions = JSON.parse(localStorage.getItem('classDefinitions')) || {
            youth: { name: '青年班', startTime: '16:00', endTime: '17:30', dayOfWeek: 6, frequency: 'weekly' },
            children: { name: '兒童班', startTime: '17:30', endTime: '19:00', dayOfWeek: 6, frequency: 'weekly' },
            family: { name: '家規班', startTime: '10:00', endTime: '11:30', dayOfWeek: 6, frequency: 'weekly' }
        };
    }

    async init() {
        try {
            // 檢查是否有Google Sheets配置
            if (this.SHEET_ID && this.API_KEY) {
                // 檢查Google API是否可用
                if (typeof gapi !== 'undefined') {
                    await this.initializeGoogleSheetsAPI();
                    this.isGoogleSheetsEnabled = true;
                    console.log('Google Sheets API 已初始化');
                } else {
                    console.log('Google API 未載入，使用本地存儲模式');
                    this.isGoogleSheetsEnabled = false;
                }
            } else {
                console.log('使用本地存儲模式');
                this.isGoogleSheetsEnabled = false;
            }
            
            // 確保數據結構完整
            this.ensureDataIntegrity();
            
        } catch (error) {
            console.warn('Google Sheets API 初始化失敗，使用本地存儲:', error);
            this.isGoogleSheetsEnabled = false;
        }
    }

    async initializeGoogleSheetsAPI() {
        return new Promise((resolve, reject) => {
            if (typeof gapi === 'undefined') {
                reject(new Error('Google API 未載入'));
                return;
            }

            gapi.load('client', async () => {
                try {
                    await gapi.client.init({
                        apiKey: this.API_KEY,
                        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4']
                    });
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    // 保存所有數據
    saveData() {
        localStorage.setItem('students', JSON.stringify(this.students));
        localStorage.setItem('attendance', JSON.stringify(this.attendance));
        localStorage.setItem('classSchedule', JSON.stringify(this.classSchedule));
        localStorage.setItem('classDefinitions', JSON.stringify(this.classDefinitions));
    }

    // 學員管理
    addStudent(studentData) {
        const student = {
            id: 'S' + Date.now(),
            ...studentData,
            joinDate: new Date().toISOString().split('T')[0],
            status: 'active'
        };
        this.students.push(student);
        this.saveData();
        return student;
    }

    updateStudent(studentId, studentData) {
        const index = this.students.findIndex(s => s.id === studentId);
        if (index !== -1) {
            this.students[index] = { ...this.students[index], ...studentData };
            this.saveData();
            return this.students[index];
        }
        return null;
    }

    deleteStudent(studentId) {
        this.students = this.students.filter(s => s.id !== studentId);
        // 刪除相關出席記錄
        Object.keys(this.attendance).forEach(key => {
            if (key.includes(studentId)) {
                delete this.attendance[key];
            }
        });
        this.saveData();
    }

    getStudents(classId = null, status = 'active') {
        let filtered = this.students.filter(s => s.status === status);
        if (classId) {
            filtered = filtered.filter(s => s.class === classId);
        }
        return filtered;
    }

    getStudent(studentId) {
        return this.students.find(s => s.id === studentId);
    }

    // 班級管理
    addClass(classData) {
        const classId = 'class_' + Date.now();
        this.classDefinitions[classId] = classData;
        this.saveData();
        return classId;
    }

    deleteClass(classId) {
        // 刪除班級定義
        delete this.classDefinitions[classId];
        
        // 刪除相關學員
        this.students = this.students.filter(s => s.class !== classId);
        
        // 刪除相關出席記錄
        Object.keys(this.attendance).forEach(key => {
            if (key.includes(classId)) {
                delete this.attendance[key];
            }
        });
        
        // 刪除相關課堂安排
        this.classSchedule = this.classSchedule.filter(c => c.classId !== classId);
        
        this.saveData();
    }

    getClassName(classId) {
        const classNames = {
            'youth': '青年班',
            'children': '兒童班',
            'family': '家規班'
        };
        return this.classDefinitions[classId]?.name || classNames[classId] || classId;
    }

    // 課堂安排管理
    addClassDate(classData) {
        // 檢查是否已存在
        const existing = this.classSchedule.find(c => 
            c.date === classData.date && c.classId === classData.classId
        );
        if (existing) {
            return false; // 已存在
        }

        this.classSchedule.push({
            ...classData,
            created: new Date().toISOString()
        });
        this.saveData();
        return true;
    }

    deleteClassDate(date, classId) {
        this.classSchedule = this.classSchedule.filter(c => 
            !(c.date === date && c.classId === classId)
        );
        this.saveData();
    }

    getClassDates(classId) {
        return this.classSchedule
            .filter(c => c.classId === classId)
            .map(c => c.date)
            .sort()
            .reverse();
    }

    getUpcomingClasses(limit = 5) {
        const today = new Date().toISOString().split('T')[0];
        return this.classSchedule
            .filter(c => c.date >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, limit);
    }

    // 出席記錄管理
    markAttendance(studentId, date, status) {
        const key = `${date}_${studentId}`;
        this.attendance[key] = status;
        this.saveData();
    }

    getAttendance(studentId, date) {
        const key = `${date}_${studentId}`;
        return this.attendance[key] || 'unmarked';
    }

    getAttendanceStats(classId, date) {
        const classStudents = this.getStudents(classId);
        const present = classStudents.filter(s => 
            this.getAttendance(s.id, date) === 'present'
        ).length;
        const absent = classStudents.filter(s => 
            this.getAttendance(s.id, date) === 'absent'
        ).length;
        
        return {
            total: classStudents.length,
            present,
            absent,
            rate: classStudents.length > 0 ? Math.round((present / classStudents.length) * 100) : 0
        };
    }

    // 統計數據
    getFilteredAttendance(startDate, endDate, classFilter, studentFilter) {
        return Object.keys(this.attendance).filter(key => {
            const [date, studentId] = key.split('_');
            
            // 日期篩選
            if (startDate && date < startDate) return false;
            if (endDate && date > endDate) return false;
            
            // 學員篩選
            const student = this.getStudent(studentId);
            if (!student) return false;
            
            if (classFilter && student.class !== classFilter) return false;
            if (studentFilter && student.id !== studentFilter) return false;
            
            return true;
        });
    }

    getStudentStats(studentId, startDate, endDate) {
        const studentAttendance = Object.keys(this.attendance).filter(key => {
            const [date, sId] = key.split('_');
            
            if (sId !== studentId) return false;
            if (startDate && date < startDate) return false;
            if (endDate && date > endDate) return false;
            
            return true;
        });
        
        const present = studentAttendance.filter(key => this.attendance[key] === 'present').length;
        const total = studentAttendance.length;
        
        return {
            present,
            total,
            rate: total > 0 ? Math.round((present / total) * 100) : 0
        };
    }

    // 數據匯出/匯入
    exportAllData() {
        return {
            students: this.students,
            attendance: this.attendance,
            classSchedule: this.classSchedule,
            classDefinitions: this.classDefinitions,
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };
    }

    importData(data) {
        if (data.students) this.students = data.students;
        if (data.attendance) this.attendance = data.attendance;
        if (data.classSchedule) this.classSchedule = data.classSchedule;
        if (data.classDefinitions) this.classDefinitions = data.classDefinitions;
        this.saveData();
    }

    clearAllData() {
        this.students = [];
        this.attendance = {};
        this.classSchedule = [];
        this.classDefinitions = {
            youth: { name: '青年班', startTime: '16:00', endTime: '17:30', dayOfWeek: 6, frequency: 'weekly' },
            children: { name: '兒童班', startTime: '17:30', endTime: '19:00', dayOfWeek: 6, frequency: 'weekly' },
            family: { name: '家規班', startTime: '10:00', endTime: '11:30', dayOfWeek: 6, frequency: 'weekly' }
        };
        localStorage.clear();
        this.saveData();
    }

    // 週期課堂生成
    generateClassSchedule(classId, startDate, endDate) {
        const classDef = this.classDefinitions[classId];
        if (!classDef) return [];
        
        const dates = [];
        let currentDate = new Date(startDate);
        
        // 找到第一個符合星期的日期
        while (currentDate.getDay() !== classDef.dayOfWeek) {
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // 生成所有課堂日期
        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            if (!this.classSchedule.find(c => c.date === dateStr && c.classId === classId)) {
                dates.push(dateStr);
                this.classSchedule.push({
                    date: dateStr,
                    classId: classId,
                    created: new Date().toISOString()
                });
            }
            
            // 根據頻率設定下一個日期
            switch (classDef.frequency) {
                case 'weekly':
                    currentDate.setDate(currentDate.getDate() + 7);
                    break;
                case 'biweekly':
                    currentDate.setDate(currentDate.getDate() + 14);
                    break;
                case 'monthly':
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    break;
            }
        }
        
        this.saveData();
        return dates;
    }

    // Google Sheets 同步
    async testGoogleSheetsConnection(sheetId, apiKey) {
        try {
            this.SHEET_ID = sheetId;
            this.API_KEY = apiKey;
            
            await this.initializeGoogleSheetsAPI();
            
            // 測試讀取
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.SHEET_ID,
                range: 'A1:A1'
            });
            
            return true;
        } catch (error) {
            throw new Error('連接失敗: ' + error.message);
        }
    }

    async syncToGoogleSheets() {
        if (!this.isGoogleSheetsEnabled) {
            throw new Error('Google Sheets 未配置');
        }

        try {
            const allData = this.exportAllData();
            
            // 將數據轉換為表格格式
            const rows = this.convertDataToRows(allData);
            
            await gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: this.SHEET_ID,
                range: this.RANGE,
                valueInputOption: 'RAW',
                resource: {
                    values: rows
                }
            });
            
            return true;
        } catch (error) {
            throw new Error('同步失敗: ' + error.message);
        }
    }

    async syncFromGoogleSheets() {
        if (!this.isGoogleSheetsEnabled) {
            throw new Error('Google Sheets 未配置');
        }

        try {
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.SHEET_ID,
                range: this.RANGE
            });
            
            const rows = response.result.values || [];
            const data = this.convertRowsToData(rows);
            
            await this.importAllData(data);
            
            return true;
        } catch (error) {
            throw new Error('同步失敗: ' + error.message);
        }
    }

    // 數據轉換
    convertDataToRows(data) {
        const rows = [];
        
        // 標題行
        rows.push(['Type', 'ID', 'Data', 'CreatedAt', 'UpdatedAt']);
        
        // 學員數據
        data.students.forEach(student => {
            rows.push([
                'student',
                student.id,
                JSON.stringify(student),
                student.createdAt || '',
                student.updatedAt || ''
            ]);
        });
        
        // 課堂數據
        data.classes.forEach(classItem => {
            rows.push([
                'class',
                classItem.id,
                JSON.stringify(classItem),
                classItem.createdAt || '',
                classItem.updatedAt || ''
            ]);
        });
        
        // 點名數據
        data.attendance.forEach(record => {
            rows.push([
                'attendance',
                record.id,
                JSON.stringify(record),
                record.createdAt || '',
                record.updatedAt || ''
            ]);
        });
        
        return rows;
    }

    convertRowsToData(rows) {
        const data = {
            students: [],
            classes: [],
            attendance: []
        };
        
        // 跳過標題行
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length < 3) continue;
            
            const type = row[0];
            const jsonData = row[2];
            
            try {
                const parsedData = JSON.parse(jsonData);
                
                switch (type) {
                    case 'student':
                        data.students.push(parsedData);
                        break;
                    case 'class':
                        data.classes.push(parsedData);
                        break;
                    case 'attendance':
                        data.attendance.push(parsedData);
                        break;
                }
            } catch (error) {
                console.warn('解析數據失敗:', error);
            }
        }
        
        return data;
    }

    async importAllData(data) {
        try {
            if (data.students) {
                this.students = data.students;
            }
            if (data.classes) {
                this.classDefinitions = data.classes;
            }
            if (data.attendance) {
                // 處理不同格式的點名數據
                if (Array.isArray(data.attendance)) {
                    const attendanceObj = {};
                    data.attendance.forEach(record => {
                        const key = `${record.date}_${record.studentId}`;
                        attendanceObj[key] = record.status;
                    });
                    this.attendance = attendanceObj;
                } else {
                    this.attendance = data.attendance;
                }
            }
            this.classSchedule = data.classSchedule || [];
            this.saveData();
            return true;
        } catch (error) {
            throw new Error('匯入數據失敗: ' + error.message);
        }
    }

    // 新增方法來支持新的模組架構
    getClasses() {
        return Object.keys(this.classDefinitions).map(id => ({
            id: id,
            name: this.classDefinitions[id].name,
            startTime: this.classDefinitions[id].startTime,
            endTime: this.classDefinitions[id].endTime,
            dayOfWeek: this.classDefinitions[id].dayOfWeek,
            description: this.classDefinitions[id].description || '',
            createdAt: this.classDefinitions[id].createdAt || new Date().toISOString(),
            updatedAt: this.classDefinitions[id].updatedAt || new Date().toISOString()
        }));
    }

    updateClass(classId, updatedData) {
        if (this.classDefinitions[classId]) {
            this.classDefinitions[classId] = { 
                ...this.classDefinitions[classId], 
                ...updatedData,
                updatedAt: new Date().toISOString()
            };
            this.saveData();
            return true;
        }
        return false;
    }

    getAttendanceByClassAndDate(classId, date) {
        const classStudents = this.getStudents(classId);
        return classStudents.map(student => {
            const status = this.getAttendance(student.id, date);
            return {
                id: `${date}_${student.id}`,
                studentId: student.id,
                classId: classId,
                date: date,
                status: status === 'unmarked' ? null : status,
                createdAt: new Date().toISOString()
            };
        }).filter(record => record.status !== null);
    }

    setAttendanceStatus(studentId, classId, date, status) {
        this.markAttendance(studentId, date, status);
        return true;
    }

    saveAttendance(attendanceArray) {
        // 將數組格式轉換回原有的對象格式
        const newAttendance = {};
        attendanceArray.forEach(record => {
            const key = `${record.date}_${record.studentId}`;
            newAttendance[key] = record.status;
        });
        this.attendance = newAttendance;
        this.saveData();
        return true;
    }

    getAttendance() {
        // 將對象格式轉換為數組格式以兼容新模組
        return Object.keys(this.attendance).map(key => {
            const [date, studentId] = key.split('_');
            return {
                id: key,
                studentId: studentId,
                date: date,
                status: this.attendance[key],
                createdAt: new Date().toISOString()
            };
        });
    }

    // 確保數據結構完整
    ensureDataIntegrity() {
        if (!Array.isArray(this.students)) {
            this.students = [];
        }
        if (typeof this.attendance !== 'object' || this.attendance === null) {
            this.attendance = {};
        }
        if (!Array.isArray(this.classSchedule)) {
            this.classSchedule = [];
        }
        if (typeof this.classDefinitions !== 'object' || this.classDefinitions === null) {
            this.classDefinitions = {
                youth: { name: '青年班', startTime: '16:00', endTime: '17:30', dayOfWeek: 6, frequency: 'weekly' },
                children: { name: '兒童班', startTime: '17:30', endTime: '19:00', dayOfWeek: 6, frequency: 'weekly' },
                family: { name: '家規班', startTime: '10:00', endTime: '11:30', dayOfWeek: 6, frequency: 'weekly' }
            };
        }
    }
}

// 創建全局數據管理實例
const dataManager = new DataManager(); 