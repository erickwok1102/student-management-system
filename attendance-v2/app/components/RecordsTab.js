'use client';

import { useState } from 'react';
import { useNotification } from './Notification';
import { api, todayString } from '../lib/api';

function firstDayOfMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

// 圖表狀態色（validate_palette.js 暗色模式全數 pass）
const CHART_COLORS = {
    '出席': '#059669',
    '遲到': '#ea580c',
    '缺席': '#f43f5e'
};
const CHART_STATUSES = ['出席', '遲到', '缺席'];

export default function RecordsTab({ classes }) {
    const showNotification = useNotification();

    const [from, setFrom] = useState(firstDayOfMonth());
    const [to, setTo] = useState(todayString());
    const [className, setClassName] = useState('');
    const [records, setRecords] = useState(null); // null = 未查詢
    const [loading, setLoading] = useState(false);
    const [showChart, setShowChart] = useState(false);

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

    // 圖表用：按出席率由高至低排
    const chartRows = [...studentRows]
        .map(row => ({
            ...row,
            rate: row.total > 0 ? Math.round(((row.出席 + row.遲到) / row.total) * 100) : 0
        }))
        .sort((a, b) => b.rate - a.rate || b.total - a.total);

    const chartSubtitle = `${from} 至 ${to}${className ? ` · ${className}` : ' · 全部班別'}`;

    /** 將圖表畫上 canvas，返回 canvas（分享/下載用） */
    function drawChartCanvas() {
        const scale = 2; // retina 清晰度
        const width = 1000;
        const headerH = 120;
        const rowH = 42;
        const footerH = 36;
        const height = headerH + chartRows.length * rowH + footerH;

        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);

        const font = "-apple-system, 'PingFang TC', 'Microsoft JhengHei', sans-serif";

        // 背景
        ctx.fillStyle = '#0a0e17';
        ctx.fillRect(0, 0, width, height);

        // 標題 + 副題
        ctx.fillStyle = '#e9edf5';
        ctx.font = `700 24px ${font}`;
        ctx.fillText('學員出席統計', 28, 44);
        ctx.fillStyle = '#8b95ab';
        ctx.font = `400 14px ${font}`;
        ctx.fillText(chartSubtitle, 28, 70);

        // 圖例
        let legendX = 28;
        CHART_STATUSES.forEach(status => {
            ctx.fillStyle = CHART_COLORS[status];
            ctx.beginPath();
            ctx.roundRect(legendX, 88, 13, 13, 3);
            ctx.fill();
            ctx.fillStyle = '#8b95ab';
            ctx.font = `500 13px ${font}`;
            ctx.fillText(status, legendX + 19, 99);
            legendX += 19 + ctx.measureText(status).width + 22;
        });

        // 每行 bar
        const barX = 190;
        const barW = width - barX - 90;
        chartRows.forEach((row, i) => {
            const y = headerH + i * rowH;

            // 名 + 堂數
            ctx.fillStyle = '#e9edf5';
            ctx.font = `600 14px ${font}`;
            const name = row.name.length > 6 ? row.name.slice(0, 6) + '…' : row.name;
            ctx.fillText(name, 28, y + 22);
            ctx.fillStyle = '#5b6478';
            ctx.font = `400 11px ${font}`;
            ctx.fillText(`${row.total}堂`, 145, y + 22);

            // stacked segments（2px 間隔，最尾圓角）
            let segX = barX;
            const segments = CHART_STATUSES
                .map(status => ({ status, count: row[status] }))
                .filter(seg => seg.count > 0);

            segments.forEach((seg, sIdx) => {
                const gapTotal = (segments.length - 1) * 2;
                const segW = (seg.count / row.total) * (barW - gapTotal);
                const isLast = sIdx === segments.length - 1;
                ctx.fillStyle = CHART_COLORS[seg.status];
                ctx.beginPath();
                ctx.roundRect(segX, y + 8, segW, 18, isLast ? [0, 4, 4, 0] : 0);
                ctx.fill();
                segX += segW + 2;
            });

            // 出席率
            ctx.fillStyle = '#e9edf5';
            ctx.font = `700 14px ${font}`;
            ctx.textAlign = 'right';
            ctx.fillText(`${row.rate}%`, width - 28, y + 22);
            ctx.textAlign = 'left';
        });

        // footer
        ctx.fillStyle = '#5b6478';
        ctx.font = `400 11px ${font}`;
        ctx.fillText(`出席率 = (出席 + 遲到) ÷ 總堂數 · 產生於 ${todayString()}`, 28, height - 14);

        return canvas;
    }

    /** 分享圖表圖片：手機出系統分享（可入 WhatsApp），電腦直接下載 */
    function shareChart() {
        const canvas = drawChartCanvas();
        canvas.toBlob(async blob => {
            if (!blob) {
                showNotification('產生圖片失敗', 'error');
                return;
            }
            const file = new File([blob], `出席統計_${from}_${to}.png`, { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({ files: [file], title: '學員出席統計' });
                    return;
                } catch (err) {
                    if (err.name === 'AbortError') return; // 用戶自己取消
                }
            }

            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = file.name;
            link.click();
            URL.revokeObjectURL(link.href);
            showNotification('圖表已下載，可以直接傳俾大家', 'success');
        }, 'image/png');
    }

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

                    {chartRows.length > 0 && (
                        <div className="card">
                            <div className="chart-header">
                                <h3 className="card-title" style={{ marginBottom: 0 }}>學員出席率圖表</h3>
                                <div>
                                    <button className="btn btn-primary btn-sm" onClick={() => setShowChart(v => !v)}>
                                        {showChart ? '收起圖表' : '📊 顯示圖表'}
                                    </button>
                                    {showChart && (
                                        <button className="btn btn-success btn-sm" onClick={shareChart}>
                                            📤 分享圖片
                                        </button>
                                    )}
                                </div>
                            </div>

                            {showChart && (
                                <div style={{ marginTop: 20 }}>
                                    <div className="hint-text" style={{ marginTop: 0, marginBottom: 12 }}>{chartSubtitle}</div>
                                    <div className="chart-legend">
                                        {CHART_STATUSES.map(status => (
                                            <span key={status} className="legend-chip">
                                                <span className="legend-swatch" style={{ background: CHART_COLORS[status] }} />
                                                {status}
                                            </span>
                                        ))}
                                        <span className="legend-chip" style={{ color: 'var(--text-faint)' }}>
                                            出席率 = (出席+遲到) ÷ 總堂數
                                        </span>
                                    </div>
                                    {chartRows.map(row => (
                                        <div key={row.id} className="chart-row">
                                            <div className="chart-row-label">
                                                {row.name}
                                                <span className="chart-row-total">{row.total}堂</span>
                                            </div>
                                            <div className="chart-bar">
                                                {CHART_STATUSES
                                                    .map(status => ({ status, count: row[status] }))
                                                    .filter(seg => seg.count > 0)
                                                    .map(seg => (
                                                        <div
                                                            key={seg.status}
                                                            className="chart-seg"
                                                            title={`${row.name} · ${seg.status} ${seg.count} 堂`}
                                                            style={{
                                                                flexGrow: seg.count,
                                                                background: CHART_COLORS[seg.status]
                                                            }}
                                                        />
                                                    ))}
                                            </div>
                                            <div className="chart-row-rate">{row.rate}%</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

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
                                                    <td>{row.name} <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>{row.id}</span></td>
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
                                                <td>{record.student_name} <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>{record.student_id}</span></td>
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
