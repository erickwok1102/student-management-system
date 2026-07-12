'use client';

import { useState, useEffect } from 'react';

const EMPTY_FORM = {
    name: '', nickname: '', class: '', phone: '', email: '',
    birthday: '', emergency_contact: '', emergency_phone: '', remarks: '',
    website: '' // 蜜罐，隱藏欄位
};

export default function RegisterPage() {
    const [classes, setClasses] = useState([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/classes')
            .then(res => res.json())
            .then(result => { if (result.success) setClasses(result.classes); })
            .catch(() => {});
    }, []);

    function setField(field, value) {
        setForm(prev => ({ ...prev, [field]: value }));
    }

    async function submit(e) {
        e.preventDefault();
        setError('');

        if (!form.name.trim() || !form.class || !form.phone.trim()) {
            setError('請填妥姓名、班別同聯絡電話');
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || '提交失敗，請再試一次');
            }

            setDone(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    if (done) {
        return (
            <div className="container" style={{ maxWidth: 640 }}>
                <div className="header">
                    <h1>學員登記</h1>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '56px 30px' }}>
                    <div style={{ fontSize: 56, marginBottom: 18 }}>✅</div>
                    <h2 style={{ marginBottom: 12 }}>登記成功！</h2>
                    <p style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>
                        我哋已經收到「{form.name.trim()}」嘅資料。<br />
                        導師核實之後會盡快聯絡你，多謝支持！
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ maxWidth: 640 }}>
            <div className="header">
                <h1>學員登記</h1>
            </div>

            <div className="card">
                <p className="hint-text" style={{ marginTop: 0, marginBottom: 24 }}>
                    請家長填寫以下資料，提交後導師會核實並聯絡你確認。
                    有 * 嘅係必填。
                </p>

                <form onSubmit={submit}>
                    <div className="form-group">
                        <label>學員姓名 *</label>
                        <input type="text" value={form.name} placeholder="學員全名"
                            onChange={e => setField('name', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>別名/英文名</label>
                        <input type="text" value={form.nickname} placeholder="平時點稱呼 (選填)"
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
                        <label>聯絡電話 *</label>
                        <input type="tel" value={form.phone} placeholder="家長或學員電話"
                            onChange={e => setField('phone', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>電子信箱</label>
                        <input type="email" value={form.email} placeholder="電郵 (選填)"
                            onChange={e => setField('email', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>學員生日</label>
                        <input type="date" value={form.birthday}
                            onChange={e => setField('birthday', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>緊急聯絡人</label>
                        <input type="text" value={form.emergency_contact} placeholder="姓名 (選填)"
                            onChange={e => setField('emergency_contact', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>緊急聯絡電話</label>
                        <input type="tel" value={form.emergency_phone} placeholder="電話 (選填)"
                            onChange={e => setField('emergency_phone', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>備註</label>
                        <textarea rows={3} value={form.remarks} placeholder="有咩想我哋知 (選填)"
                            onChange={e => setField('remarks', e.target.value)} />
                    </div>

                    {/* 蜜罐：隱藏欄位，機械人先會填 */}
                    <input
                        type="text"
                        value={form.website}
                        onChange={e => setField('website', e.target.value)}
                        style={{ position: 'absolute', left: '-9999px' }}
                        tabIndex={-1}
                        autoComplete="off"
                        aria-hidden="true"
                    />

                    {error && (
                        <p style={{ color: 'var(--danger)', marginBottom: 16, fontWeight: 600 }}>
                            {error}
                        </p>
                    )}

                    <div style={{ textAlign: 'center' }}>
                        <button type="submit" className="btn btn-primary" disabled={submitting}
                            style={{ width: '100%', maxWidth: 320 }}>
                            {submitting ? '提交中...' : '提交登記'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
