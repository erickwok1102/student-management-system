// 興趣班學員管理系統 - 主應用程式控制器

// 全局管理器實例
let studentManager;
let classManager;
let attendanceManager;
let statisticsManager;

// 應用程式初始化
document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('🚀 開始初始化應用程式...');
        
        // 檢查基本環境
        if (typeof localStorage === 'undefined') {
            throw new Error('瀏覽器不支援 localStorage');
        }
        
        if (typeof JSON === 'undefined') {
            throw new Error('瀏覽器不支援 JSON');
        }
        
        // 檢查必要的類是否存在
        if (typeof DataManager === 'undefined') {
            throw new Error('DataManager 類未載入');
        }
        
        if (typeof StudentManager === 'undefined') {
            throw new Error('StudentManager 類未載入');
        }
        
        if (typeof ClassManager === 'undefined') {
            throw new Error('ClassManager 類未載入');
        }
        
        if (typeof AttendanceManager === 'undefined') {
            throw new Error('AttendanceManager 類未載入');
        }
        
        if (typeof StatisticsManager === 'undefined') {
            throw new Error('StatisticsManager 類未載入');
        }
        
        // 檢查dataManager實例是否存在
        if (typeof dataManager === 'undefined') {
            throw new Error('dataManager 實例未創建');
        }
        
        // 初始化數據管理器
        console.log('📊 初始化數據管理器...');
        await dataManager.init();
        console.log('✅ 數據管理器初始化完成');
        
        // 初始化各個管理器
        console.log('🔧 創建管理器實例...');
        window.studentManager = new StudentManager(dataManager);
        window.classManager = new ClassManager(dataManager);
        window.attendanceManager = new AttendanceManager(dataManager);
        window.statisticsManager = new StatisticsManager(dataManager);
        
        // 同時設置全局變數以保持兼容性
        studentManager = window.studentManager;
        classManager = window.classManager;
        attendanceManager = window.attendanceManager;
        statisticsManager = window.statisticsManager;
        
        console.log('✅ 管理器實例創建完成');
        
        // 載入初始數據
        console.log('📥 載入初始數據...');
        await window.studentManager.loadStudents();
        await window.classManager.loadClasses();
        window.attendanceManager.init();
        
        // 檢查是否有課堂數據，如果沒有則創建示例數據
        const classes = window.classManager.getAllClasses();
        console.log('載入的課堂數據:', classes);
        
        if (classes.length === 0) {
            console.log('沒有課堂數據，創建示例數據...');
            try {
                await window.classManager.addClass({
                    name: '青年班',
                    startTime: '16:00',
                    endTime: '17:30',
                    dayOfWeek: 6,
                    description: '16-25歲青年興趣班'
                });
                
                await window.classManager.addClass({
                    name: '兒童班',
                    startTime: '17:30',
                    endTime: '19:00',
                    dayOfWeek: 6,
                    description: '6-15歲兒童興趣班'
                });
                
                await window.classManager.addClass({
                    name: '家規班',
                    startTime: '10:00',
                    endTime: '11:30',
                    dayOfWeek: 6,
                    description: '家庭規範教育班'
                });
                
                console.log('示例課堂數據創建完成');
            } catch (error) {
                console.error('創建示例數據失敗:', error);
            }
        }
        
        console.log('✅ 初始數據載入完成');
        
        // 創建主應用程式實例
        console.log('🎯 創建主應用程式實例...');
        window.app = new App();
        await window.app.init();
        console.log('✅ 主應用程式實例創建完成');
        
        console.log('🎉 應用程式初始化完成！');
        
        // 測試按鈕事件綁定
        console.log('測試全域函數:', {
            editClass: typeof editClass,
            deleteClass: typeof deleteClass,
            manageClassStudents: typeof manageClassStudents,
            windowApp: typeof window.app
        });
        
        // 顯示成功消息
        setTimeout(() => {
            if (window.app && window.app.showToast) {
                window.app.showToast('系統初始化成功！', 'success');
            }
        }, 500);
        
    } catch (error) {
        console.error('❌ 應用程式初始化失敗:', error);
        console.error('錯誤堆疊:', error.stack);
        
        // 顯示詳細錯誤信息
        const errorMessage = `系統初始化失敗：${error.message}\n\n請嘗試：\n1. 重新整理頁面\n2. 清除瀏覽器緩存\n3. 使用現代瀏覽器\n4. 檢查網路連接`;
        alert(errorMessage);
        
        // 嘗試基本的錯誤恢復
        try {
            console.log('🔄 嘗試基本錯誤恢復...');
            
            // 清除可能損壞的localStorage數據
            if (typeof localStorage !== 'undefined') {
                const keys = ['students', 'attendance', 'classSchedule', 'classDefinitions'];
                keys.forEach(key => {
                    try {
                        const data = localStorage.getItem(key);
                        if (data) {
                            JSON.parse(data); // 測試是否為有效JSON
                        }
                    } catch (e) {
                        console.warn(`清除損壞的數據: ${key}`);
                        localStorage.removeItem(key);
                    }
                });
            }
            
        } catch (recoveryError) {
            console.error('錯誤恢復失敗:', recoveryError);
        }
    }
});

// 主應用程式控制器
class App {
    constructor() {
        this.dataManager = dataManager;
        this.studentManager = studentManager;
        this.classManager = classManager;
        this.attendanceManager = attendanceManager;
        this.statisticsManager = statisticsManager;
        
        this.currentTab = 'students';
        this.isMobileMenuOpen = false;
        this.isLoading = false;
        
        // 不在構造函數中調用init，由外部調用
    }

    async init() {
        try {
            // 設置事件監聽器
            this.setupEventListeners();
            
            // 初始化UI
            this.initializeUI();
            
            // 載入初始數據
            await this.loadInitialData();
            
            console.log('App類初始化完成');
        } catch (error) {
            console.error('App類初始化失敗:', error);
            this.showToast('應用程式初始化失敗', 'error');
        }
    }

    setupEventListeners() {
        // 窗口大小變化事件
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // 鍵盤事件
        document.addEventListener('keydown', (e) => {
            this.handleKeydown(e);
        });

        // 點擊外部關閉模態框
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });
    }

    initializeUI() {
        // 設置當前日期
        const today = new Date().toISOString().split('T')[0];
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            if (!input.value) {
                input.value = today;
            }
        });

        // 初始化頁面
        this.switchTab('attendance');
    }

    async loadInitialData() {
        try {
            this.showLoading(true);
            
            // 渲染學員數據（數據已經在外部載入）
            this.renderStudents();
            
            // 渲染課堂數據（數據已經在外部載入）
            this.renderClasses();
            
            // 更新選擇框選項
            this.updateSelectOptions();
            
        } catch (error) {
            console.error('載入初始數據失敗:', error);
            this.showToast('載入數據失敗', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // 頁面切換
    switchTab(tabName) {
        // 隱藏所有頁面
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // 顯示選中的頁面
        const targetTab = document.getElementById(tabName);
        if (targetTab) {
            targetTab.classList.add('active');
        }
        
        // 更新導航狀態
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNavItem = document.querySelector(`[onclick="switchTab('${tabName}')"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }
        
        this.currentTab = tabName;
        
        // 關閉移動端菜單
        if (this.isMobileMenuOpen) {
            this.toggleMobileMenu();
        }
        
        // 載入頁面特定數據
        this.loadTabData(tabName);
    }

    async loadTabData(tabName) {
        switch (tabName) {
            case 'students':
                this.renderStudents();
                break;
            case 'classes':
                this.renderClasses();
                break;
            case 'attendance':
                this.loadAttendanceData();
                break;
            case 'statistics':
                this.loadStatisticsData();
                break;
            case 'settings':
                this.loadSettingsData();
                break;
        }
    }

    // 移動端菜單切換
    toggleMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        this.isMobileMenuOpen = !this.isMobileMenuOpen;
        
        if (this.isMobileMenuOpen) {
            sidebar.classList.add('show');
        } else {
            sidebar.classList.remove('show');
        }
    }

    // 學員管理
    renderStudents() {
        const studentGrid = document.getElementById('studentGrid');
        const students = this.studentManager.getAllStudents();
        
        if (students.length === 0) {
            studentGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users fa-3x"></i>
                    <h3>還沒有學員</h3>
                    <p>點擊上方的「新增學員」按鈕來添加第一個學員</p>
                </div>
            `;
            return;
        }
        
        studentGrid.innerHTML = students.map(student => `
            <div class="student-card ${student.status === 'inactive' ? 'inactive' : ''}">
                <div class="student-header">
                    <div class="student-name">
                        ${student.name}
                        ${student.nickname ? `<span class="student-nickname">(${student.nickname})</span>` : ''}
                    </div>
                    <div class="student-class ${this.getClassColorClass(student.className)}">${student.className || '未分班'}</div>
                    <div class="student-status">
                        <span class="status-badge ${student.status || 'active'}">${student.status === 'inactive' ? 'Inactive' : 'Active'}</span>
                    </div>
                </div>
                <div class="student-info">
                    <div class="student-info-item">
                        <i class="fas fa-calendar-plus"></i>
                        <span>建立日期: ${student.createdAt ? new Date(student.createdAt).toLocaleDateString('zh-TW') : '未知'}</span>
                    </div>
                </div>
                <div class="student-actions">
                    <button class="btn btn-secondary" onclick="app.editStudent('${student.id}')" type="button">
                        <i class="fas fa-edit"></i> 編輯
                    </button>
                    <button class="btn ${student.status === 'inactive' ? 'btn-success' : 'btn-warning'}" onclick="app.toggleStudentStatus('${student.id}')" type="button">
                        <i class="fas fa-${student.status === 'inactive' ? 'play' : 'pause'}"></i> ${student.status === 'inactive' ? '啟用' : '停用'}
                    </button>
                    <button class="btn btn-danger" onclick="app.deleteStudent('${student.id}')" type="button">
                        <i class="fas fa-trash"></i> 刪除
                    </button>
                </div>
            </div>
        `).join('');
    }

    // 課堂管理
    renderClasses() {
        const classList = document.getElementById('classList');
        const classes = this.classManager.getAllClasses();
        
        console.log('渲染課堂列表，課堂數量:', classes.length);
        console.log('課堂數據:', classes);
        
        if (classes.length === 0) {
            classList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chalkboard-teacher fa-3x"></i>
                    <h3>還沒有課堂</h3>
                    <p>點擊上方的「新增班組」按鈕來創建第一個課堂</p>
                </div>
            `;
            return;
        }
        
        classList.innerHTML = classes.map(classItem => {
            console.log('渲染課堂項目:', classItem);
            return `
                <div class="class-item">
                    <div class="class-header">
                        <div class="class-name">${classItem.name}</div>
                    </div>
                    <div class="class-schedule-info">
                        <div class="time-badge">${classItem.startTime} - ${classItem.endTime}</div>
                        <div class="day-badge">${this.getDayName(classItem.dayOfWeek)}</div>
                    </div>
                    ${classItem.description ? `
                        <div class="class-description">
                            <p>${classItem.description}</p>
                        </div>
                    ` : ''}
                    <div class="class-actions-buttons">
                        <button class="btn btn-secondary" onclick="editClass('${classItem.id}')" type="button">
                            <i class="fas fa-edit"></i> 編輯
                        </button>
                        <button class="btn btn-info" onclick="manageClassStudents('${classItem.id}')" type="button">
                            <i class="fas fa-users"></i> 管理學員
                        </button>
                        <button class="btn btn-danger" onclick="deleteClass('${classItem.id}')" type="button">
                            <i class="fas fa-trash"></i> 刪除
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 點名系統
    loadAttendanceData() {
        this.updateSelectOptions();
    }

    async loadAttendanceList() {
        const classId = document.getElementById('attendanceClass').value;
        const date = document.getElementById('attendanceDate').value;
        
        if (!classId || !date) {
            document.getElementById('attendanceList').innerHTML = '';
            document.getElementById('attendanceActions').style.display = 'none';
            return;
        }
        
        try {
            const students = this.studentManager.getStudentsByClass(classId);
            const attendance = await this.attendanceManager.getAttendance(classId, date);
            
            this.renderAttendanceList(students, attendance);
            
            // 只有當有學員時才顯示實時保存信息
            if (students.length > 0) {
                document.getElementById('attendanceActions').style.display = 'block';
            } else {
                document.getElementById('attendanceActions').style.display = 'none';
            }
            
        } catch (error) {
            console.error('載入點名列表失敗:', error);
            this.showToast('載入點名列表失敗', 'error');
        }
    }

    renderAttendanceList(students, attendance) {
        const attendanceList = document.getElementById('attendanceList');
        
        attendanceList.innerHTML = students.map(student => {
            const studentAttendance = attendance.find(a => a.studentId === student.id);
            const status = studentAttendance ? studentAttendance.status : null;
            
            return `
                <div class="attendance-item" data-student-id="${student.id}">
                    <div class="student-attendance-info">
                        <div class="attendance-avatar">
                            ${student.name.charAt(0)}
                        </div>
                        <div>
                            <div class="student-name">
                                ${student.name}
                                ${student.nickname ? `<span class="student-nickname">(${student.nickname})</span>` : ''}
                            </div>
                            <div class="student-class ${this.getClassColorClass(student.className)}">${student.className || '未分班'}</div>
                        </div>
                    </div>
                    <div class="attendance-toggle">
                        <button class="attendance-btn present ${status === 'present' ? 'active' : ''}" 
                                onclick="app.setAttendanceStatus('${student.id}', 'present')" type="button">
                            <i class="fas fa-check"></i> 出席
                        </button>
                        <button class="attendance-btn absent ${status === 'absent' ? 'active' : ''}" 
                                onclick="app.setAttendanceStatus('${student.id}', 'absent')" type="button">
                            <i class="fas fa-times"></i> 缺席
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }



    async setAttendanceStatus(studentId, status) {
        try {
            const classId = document.getElementById('attendanceClass').value;
            const date = document.getElementById('attendanceDate').value;
            
            if (!classId || !date) {
                this.showToast('請先選擇班別和日期', 'warning');
                return;
            }
            
            console.log('設置點名狀態:', { studentId, status, classId, date });
            
            // 設置點名狀態
            this.attendanceManager.setAttendanceStatus(studentId, classId, date, status);
            
            // 立即更新UI中的按鈕狀態
            const attendanceItem = document.querySelector(`[data-student-id="${studentId}"]`);
            if (attendanceItem) {
                const buttons = attendanceItem.querySelectorAll('.attendance-btn');
                buttons.forEach(btn => btn.classList.remove('active'));
                
                const activeButton = attendanceItem.querySelector(`.attendance-btn.${status}`);
                if (activeButton) {
                    activeButton.classList.add('active');
                }
                
                // 在學員名字旁邊顯示狀態
                const studentNameElement = attendanceItem.querySelector('.student-name');
                if (studentNameElement) {
                    // 移除之前的狀態標記
                    const existingStatus = studentNameElement.querySelector('.status-indicator');
                    if (existingStatus) {
                        existingStatus.remove();
                    }
                    
                    // 添加新的狀態標記
                    const statusIndicator = document.createElement('span');
                    statusIndicator.className = `status-indicator ${status}`;
                    statusIndicator.innerHTML = status === 'present' ? 
                        '<i class="fas fa-check-circle"></i> 出席' : 
                        '<i class="fas fa-times-circle"></i> 缺席';
                    studentNameElement.appendChild(statusIndicator);
                }
            }
            
            // 統計功能已移除，不需要更新統計數字
            
            // 實時保存到Google Sheets
            await this.saveAttendanceToGoogleSheets(studentId, classId, date, status);
            
        } catch (error) {
            console.error('設置點名狀態失敗:', error);
            this.showToast('設置點名狀態失敗: ' + error.message, 'error');
        }
    }
    

    
    async saveAttendanceToGoogleSheets(studentId, classId, date, status) {
        try {
            // 檢查是否啟用Google Sheets同步
            if (!this.dataManager.isGoogleSheetsEnabled) {
                console.log('Google Sheets未啟用，跳過同步');
                return;
            }
            
            // 獲取學員和班別信息
            const student = this.studentManager.getStudentById(studentId);
            const classData = this.classManager.getClass(classId);
            
            if (!student || !classData) {
                console.warn('找不到學員或班別信息，跳過Google Sheets同步');
                return;
            }
            
            // 準備同步數據
            const attendanceData = {
                date: date,
                studentName: student.name,
                className: classData.name,
                status: status === 'present' ? '出席' : '缺席',
                timestamp: new Date().toISOString()
            };
            
            console.log('同步點名數據到Google Sheets:', attendanceData);
            
            // 同步到Google Sheets
            await this.dataManager.syncAttendanceToGoogleSheets(attendanceData);
            
            this.showToast(`點名記錄已實時保存 (${student.name}: ${status === 'present' ? '出席' : '缺席'})`, 'success');
            
        } catch (error) {
            console.error('同步到Google Sheets失敗:', error);
            // 不要因為同步失敗而影響本地功能
            console.warn('Google Sheets同步失敗，但本地記錄已保存');
        }
    }

    async saveAttendance() {
        try {
            await this.attendanceManager.saveAttendance();
            this.showToast('點名記錄已保存', 'success');
        } catch (error) {
            console.error('保存點名記錄失敗:', error);
            this.showToast('保存點名記錄失敗', 'error');
        }
    }

    // 統計報表
    loadStatisticsData() {
        this.updateSelectOptions();
    }

    async generateStats() {
        const classId = document.getElementById('statsClass').value;
        const startDate = document.getElementById('statsStartDate').value;
        const endDate = document.getElementById('statsEndDate').value;
        
        try {
            this.showLoading(true);
            
            const stats = await this.statisticsManager.generateStatistics({
                classId,
                startDate,
                endDate
            });
            
            this.renderStatistics(stats);
            
        } catch (error) {
            console.error('生成統計報表失敗:', error);
            this.showToast('生成統計報表失敗', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    renderStatistics(stats) {
        const statsOverview = document.getElementById('statsOverview');
        
        statsOverview.innerHTML = `
            <div class="stat-card">
                <div class="stat-number">${stats.totalStudents}</div>
                <div class="stat-label">總學員數</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.totalClasses}</div>
                <div class="stat-label">總課堂數</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.averageAttendance}%</div>
                <div class="stat-label">平均出席率</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.totalAttendance}</div>
                <div class="stat-label">總出席次數</div>
            </div>
        `;
    }

    // 系統設定
    loadSettingsData() {
        const sheetId = localStorage.getItem('googleSheetId') || '';
        const apiKey = localStorage.getItem('googleApiKey') || '';
        
        document.getElementById('sheetId').value = sheetId;
        document.getElementById('apiKey').value = apiKey;
    }

    async testConnection() {
        const sheetId = document.getElementById('sheetId').value;
        const apiKey = document.getElementById('apiKey').value;
        
        if (!sheetId || !apiKey) {
            this.showToast('請輸入 Sheet ID 和 API Key', 'warning');
            return;
        }
        
        try {
            this.showLoading(true);
            
            // 保存設定
            localStorage.setItem('googleSheetId', sheetId);
            localStorage.setItem('googleApiKey', apiKey);
            
            // 測試連接
            await this.dataManager.testGoogleSheetsConnection(sheetId, apiKey);
            
            this.showToast('連接測試成功', 'success');
            
        } catch (error) {
            console.error('連接測試失敗:', error);
            this.showToast('連接測試失敗', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // 模態框管理
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'flex';
            
            // 聚焦到第一個輸入框
            const firstInput = modal.querySelector('input, select, textarea');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    }

    // 學員相關操作
    showAddStudentModal() {
        this.clearStudentForm();
        this.editingStudentId = null;
        this.updateSelectOptions();
        
        // 在新增模式時確保姓名欄位可編輯
        const nameInput = document.getElementById('studentName');
        nameInput.disabled = false;
        nameInput.style.backgroundColor = '';
        nameInput.style.cursor = '';
        
        // 重置模態框標題
        const modalTitle = document.querySelector('#addStudentModal .modal-header h3');
        if (modalTitle) {
            modalTitle.textContent = '新增學員';
        }
        
        // 重置保存按鈕文字
        const saveButton = document.querySelector('#addStudentModal .btn-primary');
        if (saveButton) {
            saveButton.innerHTML = '<i class="fas fa-save"></i> 保存';
        }
        
        this.showModal('addStudentModal');
    }

    clearStudentForm() {
        document.getElementById('studentForm').reset();
    }

    async saveStudent() {
        try {
            const classId = document.getElementById('studentClass').value;
            const classes = this.classManager.getAllClasses();
            const selectedClass = classes.find(c => c.id === classId);
            
            console.log('選擇的班別ID:', classId);
            console.log('所有班別:', classes);
            console.log('找到的班別:', selectedClass);
            
            const formData = {
                name: document.getElementById('studentName').value.trim(),
                nickname: document.getElementById('studentNickname').value.trim(),
                className: selectedClass ? selectedClass.name : '',
                classId: classId,
                notes: document.getElementById('studentNotes').value.trim()
            };

            // 只在有填寫內容時才包含敏感資料欄位
            const phone = document.getElementById('studentPhone').value.trim();
            const email = document.getElementById('studentEmail').value.trim();
            const emergencyContact = document.getElementById('emergencyContact').value.trim();
            const emergencyPhone = document.getElementById('emergencyPhone').value.trim();

            if (phone) formData.phone = phone;
            if (email) formData.email = email;
            if (emergencyContact) formData.emergencyContact = emergencyContact;
            if (emergencyPhone) formData.emergencyPhone = emergencyPhone;
            
            console.log('保存學員數據:', formData);
            console.log('編輯模式:', !!this.editingStudentId);
            
            // 驗證必要欄位
            if (!formData.name) {
                this.showToast('請輸入學員姓名', 'warning');
                return;
            }
            
            if (!classId) {
                this.showToast('請選擇班別', 'warning');
                return;
            }
            
            if (!selectedClass) {
                this.showToast('選擇的班別不存在，請重新選擇', 'error');
                return;
            }
            
            if (this.editingStudentId) {
                // 編輯模式
                console.log('編輯學員:', this.editingStudentId);
                const updatedStudent = await this.studentManager.updateStudent(this.editingStudentId, formData);
                console.log('學員更新成功:', updatedStudent);
                this.showToast('學員已成功更新', 'success');
                this.editingStudentId = null;
            } else {
                // 新增模式
                console.log('開始添加學員...');
                const newStudent = await this.studentManager.addStudent(formData);
                console.log('學員添加成功:', newStudent);
                this.showToast('學員已成功新增', 'success');
            }
            
            // 重新渲染學員列表
            this.renderStudents();
            
            // 更新選擇框選項
            this.updateSelectOptions();
            
            // 關閉模態框
            this.closeModal('addStudentModal');
            
            // 清空表單
            this.clearStudentForm();
            
        } catch (error) {
            console.error('保存學員失敗:', error);
            this.showToast('保存學員失敗: ' + error.message, 'error');
        }
    }

    // 課堂相關操作
    showAddClassModal() {
        this.clearClassForm();
        this.editingClassId = null;
        
        // 重置模態框標題
        const modalTitle = document.querySelector('#addClassModal .modal-header h3');
        if (modalTitle) {
            modalTitle.textContent = '新增班組';
        }
        
        // 重置保存按鈕文字
        const saveButton = document.querySelector('#addClassModal .btn-primary');
        if (saveButton) {
            saveButton.innerHTML = '<i class="fas fa-save"></i> 保存';
        }
        
        this.showModal('addClassModal');
    }

    clearClassForm() {
        document.getElementById('classForm').reset();
    }

    async saveClass() {
        try {
            const formData = {
                name: document.getElementById('className').value.trim(),
                startTime: document.getElementById('classStartTime').value,
                endTime: document.getElementById('classEndTime').value,
                dayOfWeek: document.getElementById('classDayOfWeek').value,
                description: document.getElementById('classDescription').value.trim()
            };
            
            console.log('保存課堂數據:', formData);
            
            if (!formData.name || !formData.startTime || !formData.endTime || !formData.dayOfWeek) {
                this.showToast('請填寫必要欄位', 'warning');
                return;
            }
            
            // 檢查時間邏輯
            if (formData.startTime >= formData.endTime) {
                this.showToast('結束時間必須晚於開始時間', 'warning');
                return;
            }
            
            if (this.editingClassId) {
                // 編輯模式
                console.log('編輯課堂:', this.editingClassId);
                const updatedClass = await this.classManager.updateClass(this.editingClassId, formData);
                console.log('課堂更新成功:', updatedClass);
                this.showToast('課堂已成功更新', 'success');
                this.editingClassId = null;
            } else {
                // 新增模式
                console.log('開始添加課堂...');
                const newClass = await this.classManager.addClass(formData);
                console.log('課堂添加成功:', newClass);
                this.showToast('課堂已成功新增', 'success');
            }
            
            this.renderClasses();
            this.updateSelectOptions();
            this.closeModal('addClassModal');
            this.clearClassForm();
            
        } catch (error) {
            console.error('保存課堂失敗:', error);
            this.showToast('保存課堂失敗: ' + error.message, 'error');
        }
    }

    // 編輯課堂
    editClass(classId) {
        const classData = this.classManager.getClass(classId);
        if (!classData) {
            this.showToast('找不到課堂資料', 'error');
            return;
        }
        
        // 填充表單
        document.getElementById('className').value = classData.name;
        document.getElementById('classStartTime').value = classData.startTime;
        document.getElementById('classEndTime').value = classData.endTime;
        document.getElementById('classDayOfWeek').value = classData.dayOfWeek;
        document.getElementById('classDescription').value = classData.description || '';
        
        // 設置編輯模式
        this.editingClassId = classId;
        
        // 更改模態框標題
        const modalTitle = document.querySelector('#addClassModal .modal-header h3');
        if (modalTitle) {
            modalTitle.textContent = '編輯課堂';
        }
        
        // 更改保存按鈕文字
        const saveButton = document.querySelector('#addClassModal .btn-primary');
        if (saveButton) {
            saveButton.innerHTML = '<i class="fas fa-save"></i> 更新';
        }
        
        this.showModal('addClassModal');
    }

    // 刪除課堂
    async deleteClass(classId) {
        const classData = this.classManager.getClass(classId);
        if (!classData) {
            this.showToast('找不到課堂資料', 'error');
            return;
        }
        
        const studentsInClass = this.studentManager.getStudentsByClass(classId);
        let confirmMessage = `確定要刪除課堂「${classData.name}」嗎？`;
        
        if (studentsInClass.length > 0) {
            confirmMessage += `\n\n注意：此課堂有 ${studentsInClass.length} 位學員，刪除後相關數據將一併刪除。`;
        }
        
        if (confirm(confirmMessage)) {
            try {
                await this.classManager.deleteClass(classId);
                this.renderClasses();
                this.renderStudents(); // 重新渲染學員列表
                this.updateSelectOptions();
                this.showToast('課堂已刪除', 'success');
            } catch (error) {
                console.error('刪除課堂失敗:', error);
                this.showToast('刪除課堂失敗', 'error');
            }
        }
    }

    // 管理課堂學員
    manageClassStudents(classId) {
        const classData = this.classManager.getClass(classId);
        if (!classData) {
            this.showToast('找不到課堂資料', 'error');
            return;
        }
        
        const students = this.studentManager.getStudentsByClass(classId);
        
        let message = `課堂：${classData.name}\n`;
        message += `時間：${this.getDayName(classData.dayOfWeek)} ${classData.startTime}-${classData.endTime}\n\n`;
        
        if (students.length === 0) {
            message += '此課堂目前沒有學員。';
        } else {
            message += `學員名單 (${students.length}人)：\n`;
            students.forEach((student, index) => {
                message += `${index + 1}. ${student.name}\n`;
            });
        }
        
        alert(message);
    }

    // 編輯學員
    editStudent(studentId) {
        const student = this.studentManager.getStudentById(studentId);
        if (!student) {
            this.showToast('找不到學員資料', 'error');
            return;
        }
        
        console.log('編輯學員數據:', student);
        
        // 填充表單
        document.getElementById('studentName').value = student.name;
        document.getElementById('studentNickname').value = student.nickname || '';
        document.getElementById('studentClass').value = student.classId || student.class;
        // 敏感資料欄位留空，只保存到Google Sheets
        document.getElementById('studentPhone').value = '';
        document.getElementById('studentEmail').value = '';
        document.getElementById('emergencyContact').value = '';
        document.getElementById('emergencyPhone').value = '';
        document.getElementById('studentNotes').value = student.notes || '';
        
        console.log('設置班別選擇框值:', student.classId || student.class);
        
        // 在編輯模式時鎖定姓名欄位
        const nameInput = document.getElementById('studentName');
        nameInput.disabled = true;
        nameInput.style.backgroundColor = '#f3f4f6';
        nameInput.style.cursor = 'not-allowed';
        
        // 設置編輯模式
        this.editingStudentId = studentId;
        
        // 更改模態框標題
        const modalTitle = document.querySelector('#addStudentModal .modal-header h3');
        if (modalTitle) {
            modalTitle.textContent = '編輯學員';
        }
        
        // 更改保存按鈕文字
        const saveButton = document.querySelector('#addStudentModal .btn-primary');
        if (saveButton) {
            saveButton.innerHTML = '<i class="fas fa-save"></i> 更新';
        }
        
        this.showModal('addStudentModal');
    }

    // 切換學員狀態
    async toggleStudentStatus(studentId) {
        const student = this.studentManager.getStudentById(studentId);
        if (!student) {
            this.showToast('找不到學員資料', 'error');
            return;
        }
        
        const newStatus = student.status === 'inactive' ? 'active' : 'inactive';
        const actionText = newStatus === 'active' ? '啟用' : '停用';
        
        try {
            await this.studentManager.updateStudent(studentId, { status: newStatus });
            this.renderStudents();
            this.showToast(`學員「${student.name}」已${actionText}`, 'success');
        } catch (error) {
            console.error('更新學員狀態失敗:', error);
            this.showToast('更新學員狀態失敗: ' + error.message, 'error');
        }
    }

    // 刪除學員
    async deleteStudent(studentId) {
        const student = this.studentManager.getStudentById(studentId);
        if (!student) {
            this.showToast('找不到學員資料', 'error');
            return;
        }
        
        const confirmMessage = `確定要刪除學員「${student.name}」嗎？\n\n此操作將同時刪除該學員的所有點名記錄。`;
        
        if (confirm(confirmMessage)) {
            try {
                await this.studentManager.deleteStudent(studentId);
                this.renderStudents();
                this.updateSelectOptions();
                this.showToast('學員已刪除', 'success');
            } catch (error) {
                console.error('刪除學員失敗:', error);
                this.showToast('刪除學員失敗: ' + error.message, 'error');
            }
        }
    }

    // 搜尋功能
    filterStudents() {
        const searchTerm = document.getElementById('studentSearch').value.toLowerCase();
        const studentCards = document.querySelectorAll('.student-card');
        
        studentCards.forEach(card => {
            const name = card.querySelector('.student-name').textContent.toLowerCase();
            const className = card.querySelector('.student-class').textContent.toLowerCase();
            
            if (name.includes(searchTerm) || className.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // 工具函數
    updateSelectOptions() {
        const classes = this.classManager.getAllClasses();
        
        // 更新所有班別選擇框
        const classSelects = document.querySelectorAll('#studentClass, #attendanceClass, #statsClass');
        classSelects.forEach(select => {
            const currentValue = select.value;
            const isRequired = select.hasAttribute('required');
            
            select.innerHTML = isRequired ? '<option value="">請選擇班別</option>' : '<option value="">所有班別</option>';
            
            classes.forEach(classItem => {
                const option = document.createElement('option');
                option.value = classItem.id;
                option.textContent = classItem.name;
                select.appendChild(option);
            });
            
            select.value = currentValue;
        });
    }

    getDayName(dayOfWeek) {
        const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        return days[parseInt(dayOfWeek)] || '';
    }

    getClassColorClass(className) {
        if (!className) return 'class-unassigned';
        
        // 根據班別名稱決定顏色類別
        if (className.includes('青年') || className.includes('Youth')) {
            return 'class-youth';
        } else if (className.includes('兒童') || className.includes('Children')) {
            return 'class-children';
        } else if (className.includes('家規') || className.includes('Family')) {
            return 'class-family';
        } else {
            return 'class-default';
        }
    }

    // UI 反饋
    showLoading(show) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (show) {
            loadingIndicator.classList.add('show');
        } else {
            loadingIndicator.classList.remove('show');
        }
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        toastMessage.textContent = message;
        toast.className = `toast show ${type}`;
        
        setTimeout(() => {
            this.hideToast();
        }, 3000);
    }

    hideToast() {
        const toast = document.getElementById('toast');
        toast.classList.remove('show');
    }

    // 事件處理
    handleResize() {
        if (window.innerWidth > 768 && this.isMobileMenuOpen) {
            this.toggleMobileMenu();
        }
    }

    handleKeydown(e) {
        // ESC 鍵關閉模態框
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                this.closeModal(openModal.id);
            }
        }
    }

    // 數據管理
    async exportData() {
        try {
            const data = await this.dataManager.exportAllData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `attendance-system-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showToast('數據已匯出', 'success');
        } catch (error) {
            console.error('匯出數據失敗:', error);
            this.showToast('匯出數據失敗', 'error');
        }
    }

    async importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                await this.dataManager.importAllData(data);
                await this.loadInitialData();
                
                this.showToast('數據已匯入', 'success');
            } catch (error) {
                console.error('匯入數據失敗:', error);
                this.showToast('匯入數據失敗', 'error');
            }
        };
        
        input.click();
    }

    async clearAllData() {
        if (confirm('確定要清除所有數據嗎？此操作無法復原。')) {
            try {
                await this.dataManager.clearAllData();
                await this.loadInitialData();
                this.showToast('所有數據已清除', 'success');
            } catch (error) {
                console.error('清除數據失敗:', error);
                this.showToast('清除數據失敗', 'error');
            }
        }
    }

    // 快速日期選擇功能
    selectAttendanceDate(offset) {
        const classId = document.getElementById('attendanceClass').value;
        if (!classId) {
            this.showToast('請先選擇班別', 'warning');
            return;
        }
        
        const classData = this.classManager.getClass(classId);
        if (!classData) {
            this.showToast('找不到課堂資料', 'error');
            return;
        }
        
        const today = new Date();
        const targetDate = this.calculateClassDate(today, classData.dayOfWeek, offset);
        const dateString = targetDate.toISOString().split('T')[0];
        
        // 設置日期
        document.getElementById('attendanceDate').value = dateString;
        
        // 更新顯示
        const displayDate = this.formatDateDisplay(targetDate, offset);
        document.getElementById('selectedDateDisplay').textContent = displayDate;
        
        // 載入點名列表
        this.loadAttendanceList();
    }
    
    calculateClassDate(baseDate, dayOfWeek, offset) {
        const today = new Date(baseDate);
        const currentDay = today.getDay();
        const targetDay = parseInt(dayOfWeek);
        
        // 計算到目標星期幾的天數差
        let daysToTarget = targetDay - currentDay;
        
        // 根據offset調整
        if (offset === 0) {
            // 今天：如果今天就是上課日，就是今天；否則找最近的上課日
            if (daysToTarget < 0) {
                daysToTarget += 7; // 下週的上課日
            }
        } else if (offset === -1) {
            // 上一堂：往前一週
            if (daysToTarget > 0) {
                daysToTarget -= 7;
            } else if (daysToTarget === 0) {
                daysToTarget = -7;
            } else {
                daysToTarget -= 7;
            }
        } else if (offset === 1) {
            // 下一堂：往後找
            if (daysToTarget <= 0) {
                daysToTarget += 7;
            }
        } else if (offset === 2) {
            // 下下堂：再往後一週
            if (daysToTarget <= 0) {
                daysToTarget += 14;
            } else {
                daysToTarget += 7;
            }
        }
        
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + daysToTarget);
        return targetDate;
    }
    
    formatDateDisplay(date, offset) {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
        };
        const dateStr = date.toLocaleDateString('zh-TW', options);
        
        let label = '';
        switch (offset) {
            case -1: label = '(上一堂)'; break;
            case 0: label = '(今天)'; break;
            case 1: label = '(下一堂)'; break;
            case 2: label = '(下下堂)'; break;
        }
        
        return `${dateStr} ${label}`;
    }
}

// 全局函數 - 為了與HTML事件處理器兼容
function switchTab(tabName) {
    if (window.app) {
        app.switchTab(tabName);
    }
}

function toggleMobileMenu() {
    if (window.app) {
        app.toggleMobileMenu();
    }
}

function showAddStudentModal() {
    if (window.app) {
        app.showAddStudentModal();
    }
}

function showAddClassModal() {
    if (window.app) {
        app.showAddClassModal();
    }
}

function closeModal(modalId) {
    if (window.app) {
        app.closeModal(modalId);
    }
}

function saveStudent() {
    if (window.app) {
        app.saveStudent();
    }
}

function saveClass() {
    if (window.app) {
        app.saveClass();
    }
}

function filterStudents() {
    if (window.app) {
        app.filterStudents();
    }
}

function loadAttendanceList() {
    if (window.app) {
        app.loadAttendanceList();
    }
}

function saveAttendance() {
    if (window.app) {
        app.saveAttendance();
    }
}

function generateStats() {
    if (window.app) {
        app.generateStats();
    }
}

function exportData() {
    if (window.app) {
        app.exportData();
    }
}

function importData() {
    if (window.app) {
        app.importData();
    }
}

function clearAllData() {
    if (window.app) {
        app.clearAllData();
    }
}

function testConnection() {
    if (window.app) {
        app.testConnection();
    }
}

function hideToast() {
    if (window.app) {
        app.hideToast();
    }
}

function selectAttendanceDate(offset) {
    if (window.app) {
        app.selectAttendanceDate(offset);
    }
}

function editClass(classId) {
    console.log('editClass called with classId:', classId);
    if (window.app && window.app.editClass) {
        window.app.editClass(classId);
    } else {
        console.error('App實例未初始化或editClass方法不存在');
        alert('系統尚未完全載入，請稍後再試');
    }
}

function deleteClass(classId) {
    console.log('deleteClass called with classId:', classId);
    if (window.app && window.app.deleteClass) {
        window.app.deleteClass(classId);
    } else {
        console.error('App實例未初始化或deleteClass方法不存在');
        alert('系統尚未完全載入，請稍後再試');
    }
}

function manageClassStudents(classId) {
    console.log('manageClassStudents called with classId:', classId);
    if (window.app && window.app.manageClassStudents) {
        window.app.manageClassStudents(classId);
    } else {
        console.error('App實例未初始化或manageClassStudents方法不存在');
        alert('系統尚未完全載入，請稍後再試');
    }
}

function editStudent(studentId) {
    if (window.app) {
        app.editStudent(studentId);
    }
}

function toggleStudentStatus(studentId) {
    if (window.app) {
        app.toggleStudentStatus(studentId);
    }
}

function deleteStudent(studentId) {
    if (window.app) {
        app.deleteStudent(studentId);
    }
}

// 防止表單提交時頁面刷新
document.addEventListener('submit', (e) => {
    e.preventDefault();
}); 