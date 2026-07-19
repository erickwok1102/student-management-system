// 補錄 script：由舊 Google Sheets 抽點名記錄，只插入 Supabase 冇嘅（唔覆蓋）
// 用法：node scripts/sync-missing-attendance.mjs [--write]
// 唔加 --write = 淨係報告會補啲乜，唔會寫入

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbw_m3SjHokYxU-eUkFrMtcrVXnoxSGhRAfuUxYDt6P81UwmxcMrkKjz-h7A4teL8kKIjQ/exec';
const ENV_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local');

const env = {};
for (const line of readFileSync(ENV_PATH, 'utf8').split('\n')) {
    const match = line.match(/^([A-Z_]+)=(.+)$/);
    if (match) env[match[1]] = match[2].trim();
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
});

function toDateString(value) {
    const str = String(value || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const parsed = new Date(str);
    if (isNaN(parsed.getTime())) return '';
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
}

async function main() {
    const write = process.argv.includes('--write');
    const validStatuses = ['出席', '缺席', '遲到'];

    // 舊系統全部記錄
    const res = await fetch(`${GAS_URL}?action=getAttendance`, { redirect: 'follow' });
    const data = await res.json();
    if (!data.success) throw new Error('攞唔到舊記錄');

    const sheetRecords = new Map();
    for (const r of data.attendance) {
        const date = toDateString(r.date);
        const studentId = String(r.studentId || '').trim();
        const status = String(r.status || '').trim();
        if (!date || !studentId || !validStatuses.includes(status)) continue;
        sheetRecords.set(`${date}|${studentId}`, {
            date,
            class: String(r.className || r.class || '').trim(),
            student_id: studentId,
            student_name: String(r.studentName || '').trim(),
            status
        });
    }
    console.log(`舊 Sheets 有效記錄: ${sheetRecords.size} 筆`);

    // 新系統全部記錄（分頁攞齊）
    const existing = new Map();
    for (let page = 0; ; page++) {
        const { data: batch, error } = await supabase
            .from('attendance')
            .select('date, student_id, status')
            .range(page * 1000, (page + 1) * 1000 - 1);
        if (error) throw error;
        batch.forEach(r => existing.set(`${r.date}|${r.student_id}`, r.status));
        if (batch.length < 1000) break;
    }
    console.log(`新系統現有記錄: ${existing.size} 筆`);

    // 分類
    const missing = [];
    const conflicts = [];
    for (const [key, record] of sheetRecords) {
        if (!existing.has(key)) {
            missing.push(record);
        } else if (existing.get(key) !== record.status) {
            conflicts.push({ ...record, newSystemStatus: existing.get(key) });
        }
    }

    console.log(`\n新系統冇、需要補录: ${missing.length} 筆`);
    missing.sort((a, b) => a.date.localeCompare(b.date));
    missing.forEach(r => console.log(`  + ${r.date} · ${r.class} · ${r.student_name} · ${r.status}`));

    if (conflicts.length) {
        console.log(`\n⚠️ 兩邊都有但狀態唔同（唔會郁，以新系統為準）: ${conflicts.length} 筆`);
        conflicts.forEach(r => console.log(`  ! ${r.date} · ${r.student_name} · Sheets=${r.status} 新系統=${r.newSystemStatus}`));
    }

    if (!write) {
        console.log('\n（綵排模式，未寫入。確認冇問題就加 --write 再行一次）');
        return;
    }

    if (missing.length === 0) {
        console.log('\n冇嘢需要補，收工。');
        return;
    }

    const { error: insertError } = await supabase.from('attendance').insert(missing);
    if (insertError) throw insertError;
    console.log(`\n✓ 已補錄 ${missing.length} 筆`);
}

main().catch(err => { console.error('失敗:', err.message); process.exit(1); });
