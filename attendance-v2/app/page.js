'use client';

import { useState, useEffect, useCallback } from 'react';
import { NotificationProvider } from './components/Notification';
import AttendanceTab from './components/AttendanceTab';
import StudentsTab from './components/StudentsTab';
import RecordsTab from './components/RecordsTab';
import { api } from './lib/api';

const TABS = [
    { key: 'attendance', label: '點名' },
    { key: 'students', label: '學員' },
    { key: 'records', label: '記錄' }
];

export default function Home() {
    const [activeTab, setActiveTab] = useState('attendance');
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [loadError, setLoadError] = useState('');

    const reloadClasses = useCallback(async () => {
        try {
            const result = await api('/api/classes');
            setClasses(result.classes);
            setLoadError('');
        } catch (error) {
            setClasses([]);
            setLoadError(error.message);
        }
    }, []);

    const reloadStudents = useCallback(async () => {
        try {
            const result = await api('/api/students');
            setStudents(result.students);
        } catch {
            setStudents([]);
        }
    }, []);

    useEffect(() => {
        reloadClasses();
        reloadStudents();
    }, [reloadClasses, reloadStudents]);

    return (
        <NotificationProvider>
            <div className="container">
                <div className="header">
                    <h1>學員管理系統</h1>
                </div>

                {loadError && (
                    <div className="card error-banner">
                        <h3>接駁唔到資料庫</h3>
                        <p>錯誤訊息:{loadError}</p>
                        <p>
                            如果係第一次使用,請跟 README.md 完成 Supabase 設定:
                            建立 project → 行 schema.sql → 將 Project URL 同 service_role key
                            填入 <code>.env.local</code>(本地)或 Vercel 環境變數(線上),然後重新啟動。
                        </p>
                        <button className="btn btn-primary" onClick={() => { reloadClasses(); reloadStudents(); }}>
                            重試
                        </button>
                    </div>
                )}

                <div className="tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'attendance' && (
                    <div className="tab-content">
                        <AttendanceTab classes={classes} students={students} />
                    </div>
                )}
                {activeTab === 'students' && (
                    <div className="tab-content">
                        <StudentsTab
                            classes={classes}
                            students={students}
                            reloadStudents={reloadStudents}
                            reloadClasses={reloadClasses}
                        />
                    </div>
                )}
                {activeTab === 'records' && (
                    <div className="tab-content">
                        <RecordsTab classes={classes} />
                    </div>
                )}
            </div>
        </NotificationProvider>
    );
}
