'use client';

import { useState } from 'react';
import { useNotification } from './Notification';
import { api, todayString } from '../lib/api';

function firstDayOfMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

export default function RecordsTab({ classes }) {
    const showNotification = useNotification();

    const [from, setFrom] = useState(firstDayOfMonth());
    const [to, setTo] = useState(todayString());
    const [className, setClassName] = useState('');
    const [records, setRecords] = useState(null); // null = 未查詢
    const [loading, setLoading] = useState(false);

    async function search() {
        if (!from || !to) {
            showNotification('請選擇日期範圍', 'error');
            return;
        }

        setLoading(true);
        try {
            let url = `/api/attendance?from=${from}&to=${to}`;
            if (className) url += `&class=${encodeURIComponent(className)}`;

            const result = await api(url);
            setRecords(result.attendance);
            showNotification(`搵到 ${result.count} 筆記錄`, 'success');
        } catch (error) {
            showNotification(`查詢失敗：${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }

    // 總計
    const totals = (records || []).reduce((counts, r) => {
        counts[r.status] = (counts[r.status] || 0) + 1;
        return counts;
    }, {});

    // 每位學員統計
    const byStudent = {};
    (records || []).forEach(r => {
        if (!byStudent[r.student_id]) {
            byStudent[r.student_id] = {
                name: r.student_name,
                class: r.class,
                出席: 0, 缺席: 0, 遲到: 0, total: 0
            };
        }
        byStudent[r.student_id][r.status]++;
        byStudent[r.student_id].total++;
    });

    const studentRows = Object.entries(byStudent)
        .map(([id, stats]) => ({ id, ...stats }))
        .sort((a, b) => a.class.localeCompare(b.class) || a.id.localeCompare(b.id));

    return (
        <>
            <div className="card">
                <h3 className="card-title">查詢點名記錄</h3>
                <div className="grid-form">
                    <div className="form-group">
                        <label>由</label>
                        <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>至</label>
                        <input type="date" value={to} onChange={e => setTo(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>班別（可留空 = 全部）</label>
                        <select value={className} onChange={e => setClassName(e.target.value)}>
                            <option value="">全部班別</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <button className="btn btn-primary" onClick={search} disabled={loading}>
                        {loading ? '查詢中...' : '查詢'}
                    </button>
                </div>
            </div>

            {records !== null && (
                <>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-number">{records.length}</div>
                            <div className="stat-label">總記錄</div>
                        </div>
                        <div className="stat-card" style={{ borderLeftColor: '#28a745' }}>
                            <div className="stat-number">{totals['出席'] || 0}</div>
                            <div className="stat-label">出席</div>
                        </div>
                        <div className="stat-card" style={{ borderLeftColor: '#fd7e14' }}>
                            <div className="stat-number">{totals['遲到'] || 0}</div>
                            <div className="stat-label">遲到</div>
                        </div>
                        <div className="stat-card" style={{ borderLeftColor: '#dc3545' }}>
                            <div className="stat-number">{totals['缺席'] || 0}</div>
                            <div className="stat-label">缺席</div>
                        </div>
                    </div>

                    {studentRows.length > 0 && (
                        <div className="card">
                            <h3 className="card-title">學員出席統計</h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="records-table">
                                    <thead>
                                        <tr>
                                            <th>學員</th>
                                            <th>班別</th>
                                            <th>出席</th>
                                            <th>遲到</th>
                                            <th>缺席</th>
                                            <th>出席率</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {studentRows.map(row => {
                                            const attendedRate = row.total > 0
                                                ? Math.round(((row.出席 + row.遲到) / row.total) * 100)
                                                : 0;
                                            return (
                                                <tr key={row.id}>
                                                    <td>{row.name} <span style={{ color: '#999', fontSize: 12 }}>{row.id}</span></td>
                                                    <td>{row.class}</td>
                                                    <td className="record-status-出席">{row.出席}</td>
                                                    <td className="record-status-遲到">{row.遲到}</td>
                                                    <td className="record-status-缺席">{row.缺席}</td>
                                                    <td style={{ fontWeight: 600 }}>{attendedRate}%</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="card">
                        <h3 className="card-title">記錄明細 ({records.length})</h3>
                        {records.length === 0 ? (
                            <div className="empty-state">
                                <h3>呢段時間冇點名記錄</h3>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="records-table">
                                    <thead>
                                        <tr>
                                            <th>日期</th>
                                            <th>班別</th>
                                            <th>學員</th>
                                            <th>狀態</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {records.map(record => (
                                            <tr key={record.id}>
                                                <td>{record.date}</td>
                                                <td>{record.class}</td>
                                                <td>{record.student_name} <span style={{ color: '#999', fontSize: 12 }}>{record.student_id}</span></td>
                                                <td className={`record-status-${record.status}`}>{record.status}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </>
    );
}
