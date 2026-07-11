'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNotification } from './Notification';
import { api, todayString } from '../lib/api';

const STATUS_OPTIONS = [
    { value: '出席', className: 'present' },
    { value: '缺席', className: 'absent' },
    { value: '遲到', className: 'late' }
];

export default function AttendanceTab({ classes, students }) {
    const showNotification = useNotification();

    const [date, setDate] = useState(todayString());
    const [className, setClassName] = useState('');
    const [rollCallStudents, setRollCallStudents] = useState(null); // null = 未開始
    const [choices, setChoices] = useState({});
    const [saving, setSaving] = useState(false);
    const [todayRecords, setTodayRecords] = useState([]);

    const loadTodayRecords = useCallback(async () => {
        try {
            const result = await api(`/api/attendance?date=${todayString()}`);
            setTodayRecords(result.attendance);
        } catch {
            setTodayRecords([]);
        }
    }, []);

    useEffect(() => {
        loadTodayRecords();
    }, [loadTodayRecords]);

    async function startAttendance() {
        const classStudents = students.filter(s => s.class === className);
        const activeStudents = classStudents.filter(s => s.status === '在讀');

        if (classStudents.length === 0) {
            showNotification(`${className} 沒有學員資料`, 'warning');
            return;
        }
        if (activeStudents.length === 0) {
            showNotification(`${className} 沒有「在讀」狀態的學員`, 'warning');
            return;
        }

        // 載入該日該班已有嘅記錄，方便補改
        let existing = {};
        try {
            const result = await api(`/api/attendance?date=${date}&class=${encodeURIComponent(className)}`);
            result.attendance.forEach(record => {
                existing[record.student_id] = record.status;
            });
        } catch {
            // 載入唔到就當新點名
        }

        setChoices(existing);
        setRollCallStudents(activeStudents);
        showNotification(`開始 ${className} 的點名 (${activeStudents.length} 位在讀學員)`, 'success');
    }

    function selectStatus(studentId, status) {
        setChoices(prev => ({ ...prev, [studentId]: status }));
    }

    async function saveAttendance() {
        const records = Object.entries(choices).map(([studentId, status]) => {
            const student = students.find(s => s.id === studentId);
            return {
                studentId,
                studentName: student ? student.name : `未知學員(${studentId})`,
                status
            };
        });

        if (records.length === 0) {
            showNotification('請先為學員選擇出席狀態', 'warning');
            return;
        }

        setSaving(true);
        try {
            const result = await api('/api/attendance', {
                method: 'POST',
                body: { date, class: className, records }
            });

            showNotification(result.message, 'success');
            setRollCallStudents(null);
            setChoices({});
            await loadTodayRecords();
        } catch (error) {
            showNotification(`儲存失敗：${error.message}`, 'error');
        } finally {
            setSaving(false);
        }
    }

    function resetAttendance() {
        if (confirm('確定要重新點名嗎？這會清除目前未儲存的選擇。')) {
            setChoices({});
            showNotification('已清除選擇，重新點名', 'success');
        }
    }

    async function deleteRecord(record) {
        if (!confirm(`確定要刪除「${record.student_name}」的點名記錄嗎？`)) return;

        try {
            await api(`/api/attendance/${record.id}`, { method: 'DELETE' });
            showNotification('已刪除點名記錄', 'success');
            await loadTodayRecords();
        } catch (error) {
            showNotification(`刪除失敗：${error.message}`, 'error');
        }
    }

    // 今日記錄按班別分組
    const recordsByClass = todayRecords.reduce((groups, record) => {
        (groups[record.class] = groups[record.class] || []).push(record);
        return groups;
    }, {});

    const allChosen = rollCallStudents && rollCallStudents.every(s => choices[s.id]);

    return (
        <>
            <div className="card">
                <h3 className="card-title">點名系統</h3>
                <div className="grid-form">
                    <div className="form-group">
                        <label>日期 *</label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>班別 *</label>
                        <select
                            value={className}
                            onChange={e => setClassName(e.target.value)}
                            disabled={!date}
                        >
                            <option value="">請選擇班別</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="hint-text">
                    步驟：先選日期 → 再選班別 → 最後開始點名
                </div>
                <div style={{ marginTop: 20, textAlign: 'center' }}>
                    <button
                        className="btn btn-primary"
                        onClick={startAttendance}
                        disabled={!date || !className}
                    >
                        開始點名
                    </button>
                </div>
            </div>

            {rollCallStudents && (
                <div className="card">
                    <h3 className="card-title">
                        點名列表 — {className} ({Object.keys(choices).length}/{rollCallStudents.length})
                    </h3>
                    {rollCallStudents.map(student => (
                        <div key={student.id} className="student-attendance-item">
                            <div className="student-info">
                                <div className="student-name">
                                    {student.name}
                                    {student.nickname && <span className="nickname"> ({student.nickname})</span>}
                                </div>
                                <div className="student-class">班別: {student.class}</div>
                            </div>
                            <div className="attendance-buttons">
                                {STATUS_OPTIONS.map(option => (
                                    <button
                                        key={option.value}
                                        className={`attendance-choice-btn ${option.className} ${choices[student.id] === option.value ? 'selected' : ''}`}
                                        onClick={() => selectStatus(student.id, option.value)}
                                    >
                                        {option.value}
                                        {choices[student.id] === option.value ? ' ✓' : ''}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                    <div style={{ marginTop: 25, textAlign: 'center' }}>
                        <button
                            className="btn btn-success"
                            onClick={saveAttendance}
                            disabled={saving}
                        >
                            {saving ? '儲存中...' : allChosen ? '儲存點名記錄' : `儲存 (${Object.keys(choices).length}/${rollCallStudents.length})`}
                        </button>
                        <button className="btn btn-warning" onClick={resetAttendance} disabled={saving}>
                            重新點名
                        </button>
                    </div>
                </div>
            )}

            <div className="card">
                <h3 className="card-title">今日點名記錄</h3>
                {todayRecords.length === 0 ? (
                    <div className="empty-state">
                        <h3>還沒有今日的點名記錄</h3>
                        <p>選擇班別並開始點名</p>
                    </div>
                ) : (
                    Object.keys(recordsByClass).map(cls => (
                        <div key={cls} style={{ marginBottom: 25 }}>
                            <h4 className="class-group-title">{cls}</h4>
                            {recordsByClass[cls].map(record => (
                                <div key={record.id} className="student-item" style={{ padding: 15 }}>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{record.student_name}</span>
                                        <span className={`record-status-${record.status}`} style={{ marginLeft: 12 }}>
                                            {record.status}
                                        </span>
                                    </div>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => deleteRecord(record)}
                                    >
                                        刪除
                                    </button>
                                </div>
                            ))}
                        </div>
                    ))
                )}
            </div>
        </>
    );
}
