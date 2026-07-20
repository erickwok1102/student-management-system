'use client';

import { useState } from 'react';
import { useNotification } from './Notification';
import { api } from '../lib/api';

const STUDENT_STATUS = ['待審核', '在讀', '休學', '畢業', '退學'];

const STATUS_COLORS = {
    '待審核': '#a78bfa',
    '在讀': '#34d399',
    '休學': '#fbbf24',
    '畢業': '#38bdf8',
    '退學': '#fb7185'
};

const EMPTY_FORM = {
    name: '', nickname: '', class: '', phone: '', email: '',
    birthday: '', emergency_contact: '', emergency_phone: '', remarks: ''
};

export default function StudentsTab({ classes, students, reloadStudents, reloadClasses }) {
    const showNotification = useNotification();

    const [form, setForm] = useState(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState(EMPTY_FORM);
    const [savingEdit, setSavingEdit] = useState(false);
    const [filterClass, setFilterClass] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [sortOrder, setSortOrder] = useState('newest');

    function setField(field, value) {
        setForm(prev => ({ ...prev, [field]: value }));
    }

    async function addStudent() {
        if (!form.name.trim()) {
            showNotification('請輸入學員姓名', 'error');
            return;
        }
        if (!form.class) {
            showNotification('請選擇班別', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const result = await api('/api/students', { method: 'POST', body: form });
            showNotification(`學員「${result.student.name}」已成功新增 (ID: ${result.student.id})`, 'success');
            setForm(EMPTY_FORM);
            await reloadStudents();
        } catch (error) {
            showNotification(`新增學員失敗：${error.message}`, 'error');
        } finally {
            setSubmitting(false);
        }
    }

    async function updateStatus(student, newStatus) {
        try {
            await api(`/api/students/${student.id}`, {
                method: 'PATCH',
                body: { status: newStatus }
            });
            showNotification(`「${student.name}」狀態已更新為「${newStatus}」`, 'success');
            await reloadStudents();
        } catch (error) {
            showNotification(`更新狀態失敗：${error.message}`, 'error');
            await reloadStudents();
        }
    }

    async function deleteStudent(student) {
        if (!confirm(`確定要刪除學員「${student.name}」(${student.id}) 嗎？\n\n點名記錄會保留，但學員資料無法復原。`)) {
            return;
        }

        try {
            await api(`/api/students/${student.id}`, { method: 'DELETE' });
            showNotification(`學員「${student.name}」已刪除`, 'success');
            await reloadStudents();
        } catch (error) {
            showNotification(`刪除失敗：${error.message}`, 'error');
        }
    }

    function startEdit(student) {
        setEditingId(student.id);
        setEditForm({
            name: student.name || '',
            nickname: student.nickname || '',
            class: student.class || '',
            phone: student.phone || '',
            email: student.email || '',
            birthday: student.birthday || '',
            emergency_contact: student.emergency_contact || '',
            emergency_phone: student.emergency_phone || '',
            remarks: student.remarks || ''
        });
    }

    function setEditField(field, value) {
        setEditForm(prev => ({ ...prev, [field]: value }));
    }

    async function saveEdit(student) {
        if (!editForm.name.trim()) {
            showNotification('學員姓名唔可以留空', 'error');
            return;
        }

        setSavingEdit(true);
        try {
            await api(`/api/students/${student.id}`, {
                method: 'PATCH',
                body: editForm
            });
            showNotification(`「${editForm.name}」資料已更新`, 'success');
            setEditingId(null);
            await reloadStudents();
        } catch (error) {
            showNotification(`更新失敗：${error.message}`, 'error');
        } finally {
            setSavingEdit(false);
        }
    }

    async function addClass() {
        if (!newClassName.trim()) {
            showNotification('請輸入班別名稱', 'error');
            return;
        }

        try {
            await api('/api/classes', { method: 'POST', body: { name: newClassName } });
            showNotification(`已新增班別「${newClassName.trim()}」`, 'success');
            setNewClassName('');
            await reloadClasses();
        } catch (error) {
            showNotification(`新增班別失敗：${error.message}`, 'error');
        }
    }

    const statusCounts = students.reduce((counts, s) => {
        counts[s.status] = (counts[s.status] || 0) + 1;
        return counts;
    }, {});

    // 學員列表：篩選 + 排序（預設新至舊）
    const idNum = id => parseInt(String(id).replace(/\D/g, ''), 10) || 0;
    const visibleStudents = students
        .filter(s => (!filterClass || s.class === filterClass) && (!filterStatus || s.status === filterStatus))
        .sort((a, b) => {
            if (sortOrder === 'newest') {
                return String(b.created_at).localeCompare(String(a.created_at)) || idNum(b.id) - idNum(a.id);
            }
            if (sortOrder === 'oldest') {
                return String(a.created_at).localeCompare(String(b.created_at)) || idNum(a.id) - idNum(b.id);
            }
            return idNum(a.id) - idNum(b.id); // ID 順序
        });

    // 本月生日（在讀學員，birthday 格式 YYYY-MM-DD，只用月/日）
    const thisMonth = new Date().getMonth() + 1;
    const birthdayStudents = students
        .filter(s =>
            s.status === '在讀' &&
            (s.birthday || '').length >= 10 &&
            parseInt(s.birthday.slice(5, 7), 10) === thisMonth
        )
        .map(s => ({ ...s, birthDay: parseInt(s.birthday.slice(8, 10), 10) }))
        .sort((a, b) => a.birthDay - b.birthDay);

    return (
        <>
            {birthdayStudents.length > 0 && (
                <div className="card birthday-card">
                    <h3 className="card-title" style={{ marginBottom: 14 }}>🎂 {thisMonth} 月生日</h3>
                    <div className="birthday-list">
                        {birthdayStudents.map(s => (
                            <span key={s.id} className="birthday-chip">
                                {thisMonth}月{s.birthDay}日 · {s.name}
                                {s.nickname && ` (${s.nickname})`}
                                <span className="birthday-chip-class">{s.class}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-number">{students.length}</div>
                    <div className="stat-label">總學員</div>
                </div>
                {STUDENT_STATUS.map(status => (
                    <div className="stat-card" key={status} style={{ borderLeftColor: STATUS_COLORS[status] }}>
                        <div className="stat-number">{statusCounts[status] || 0}</div>
                        <div className="stat-label">{status}</div>
                    </div>
                ))}
            </div>

            <div className="card">
                <h3 className="card-title">新增學員</h3>
                <div className="grid-form">
                    <div className="form-group">
                        <label>學員姓名 *</label>
                        <input type="text" value={form.name} placeholder="請輸入學員姓名"
                            onChange={e => setField('name', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>別名/英文名</label>
                        <input type="text" value={form.nickname} placeholder="別名或英文名 (選填)"
                            onChange={e => setField('nickname', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>班別 *</label>
                        <select value={form.class} onChange={e => setField('class', e.target.value)}>
                            <option value="">請選擇班別</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>聯絡電話</label>
                        <input type="tel" value={form.phone} placeholder="聯絡電話"
                            onChange={e => setField('phone', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>電子信箱</label>
                        <input type="email" value={form.email} placeholder="電子信箱"
                            onChange={e => setField('email', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>生日</label>
                        <input type="date" value={form.birthday}
                            onChange={e => setField('birthday', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>緊急聯絡人</label>
                        <input type="text" value={form.emergency_contact} placeholder="緊急聯絡人姓名"
                            onChange={e => setField('emergency_contact', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>緊急聯絡電話</label>
                        <input type="tel" value={form.emergency_phone} placeholder="緊急聯絡電話"
                            onChange={e => setField('emergency_phone', e.target.value)} />
                    </div>
                </div>
                <div className="form-group">
                    <label>備註</label>
                    <textarea rows={3} value={form.remarks} placeholder="其他備註資訊"
                        onChange={e => setField('remarks', e.target.value)} />
                </div>
                <div style={{ textAlign: 'center' }}>
                    <button className="btn btn-success" onClick={addStudent} disabled={submitting}>
                        {submitting ? '新增中...' : '新增學員'}
                    </button>
                    <button className="btn btn-warning" onClick={() => setForm(EMPTY_FORM)}>
                        清空表單
                    </button>
                </div>
            </div>

            <div className="card">
                <h3 className="card-title">班別管理</h3>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        className="inline-input"
                        value={newClassName}
                        placeholder="新班別名稱"
                        onChange={e => setNewClassName(e.target.value)}
                    />
                    <button className="btn btn-primary" onClick={addClass}>新增班別</button>
                </div>
                <div style={{ marginTop: 15 }}>
                    {classes.map(c => (
                        <span key={c.id} className="class-pill" style={{ display: 'inline-block', marginBottom: 8 }}>
                            {c.name}
                        </span>
                    ))}
                </div>
            </div>

            <div className="card">
                <h3 className="card-title">
                    學員列表 ({visibleStudents.length}{visibleStudents.length !== students.length ? ` / ${students.length}` : ''})
                </h3>

                <div className="student-filters">
                    <select className="status-select" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
                        <option value="">全部班別</option>
                        {classes.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                    </select>
                    <select className="status-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="">全部狀態</option>
                        {STUDENT_STATUS.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                    <select className="status-select" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                        <option value="newest">新至舊</option>
                        <option value="oldest">舊至新</option>
                        <option value="id">ID 順序</option>
                    </select>
                </div>

                {visibleStudents.length === 0 ? (
                    <div className="empty-state">
                        <h3>{students.length === 0 ? '還沒有學員資料' : '呢個篩選條件冇學員'}</h3>
                        <p>{students.length === 0 ? '用上面的表單新增學員' : '試下轉返「全部班別 / 全部狀態」'}</p>
                    </div>
                ) : (
                    visibleStudents.map(student => (
                        editingId === student.id ? (
                            <div key={student.id} className="student-item" style={{ display: 'block' }}>
                                <div className="student-item-name" style={{ marginBottom: 16 }}>
                                    編輯學員 <span className="student-item-id">ID: {student.id}</span>
                                </div>
                                <div className="grid-form">
                                    <div className="form-group">
                                        <label>學員姓名 *</label>
                                        <input type="text" value={editForm.name}
                                            onChange={e => setEditField('name', e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>別名/英文名</label>
                                        <input type="text" value={editForm.nickname}
                                            onChange={e => setEditField('nickname', e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>班別</label>
                                        <select value={editForm.class} onChange={e => setEditField('class', e.target.value)}>
                                            {classes.map(c => (
                                                <option key={c.id} value={c.name}>{c.name}</option>
                                            ))}
                                            {!classes.some(c => c.name === editForm.class) && editForm.class && (
                                                <option value={editForm.class}>{editForm.class}</option>
                                            )}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>聯絡電話</label>
                                        <input type="tel" value={editForm.phone}
                                            onChange={e => setEditField('phone', e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>電子信箱</label>
                                        <input type="email" value={editForm.email}
                                            onChange={e => setEditField('email', e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>生日</label>
                                        <input type="date" value={editForm.birthday}
                                            onChange={e => setEditField('birthday', e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>緊急聯絡人</label>
                                        <input type="text" value={editForm.emergency_contact}
                                            onChange={e => setEditField('emergency_contact', e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>緊急聯絡電話</label>
                                        <input type="tel" value={editForm.emergency_phone}
                                            onChange={e => setEditField('emergency_phone', e.target.value)} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>備註</label>
                                    <textarea rows={2} value={editForm.remarks}
                                        onChange={e => setEditField('remarks', e.target.value)} />
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <button className="btn btn-success" onClick={() => saveEdit(student)} disabled={savingEdit}>
                                        {savingEdit ? '儲存中...' : '儲存變更'}
                                    </button>
                                    <button className="btn btn-warning" onClick={() => setEditingId(null)} disabled={savingEdit}>
                                        取消
                                    </button>
                                </div>
                            </div>
                        ) : (
                        <div key={student.id} className="student-item">
                            <div>
                                <div className="student-item-name">
                                    {student.name}
                                    {student.nickname && <span className="student-item-nickname"> ({student.nickname})</span>}
                                    <span className="student-item-id">ID: {student.id}</span>
                                </div>
                                <div style={{ marginBottom: 8 }}>
                                    <span className="class-pill">{student.class || '未分配班別'}</span>
                                    <span style={{ color: STATUS_COLORS[student.status] || 'var(--text-muted)', fontWeight: 600 }}>
                                        {student.status}
                                    </span>
                                </div>
                                <div style={{ marginBottom: 6 }}>
                                    <label style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 6 }}>狀態</label>
                                    <select
                                        className="status-select"
                                        value={student.status}
                                        onChange={e => updateStatus(student, e.target.value)}
                                    >
                                        {STUDENT_STATUS.map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                        {!STUDENT_STATUS.includes(student.status) && (
                                            <option value={student.status}>{student.status}</option>
                                        )}
                                    </select>
                                </div>
                                <div className="student-item-meta">
                                    {student.created_at} 建立
                                    {student.phone && ` | ${student.phone}`}
                                    {student.email && ` | ${student.email}`}
                                    {student.birthday && ` | ${student.birthday}`}
                                </div>
                                {(student.emergency_contact || student.emergency_phone) && (
                                    <div className="emergency-info">
                                        緊急聯絡: {student.emergency_contact}
                                        {student.emergency_phone && ` (${student.emergency_phone})`}
                                    </div>
                                )}
                            </div>
                            <div>
                                <button className="btn btn-primary btn-sm" onClick={() => startEdit(student)}>
                                    編輯
                                </button>
                                <button className="btn btn-danger btn-sm" onClick={() => deleteStudent(student)}>
                                    刪除
                                </button>
                            </div>
                        </div>
                        )
                    ))
                )}
            </div>
        </>
    );
}
