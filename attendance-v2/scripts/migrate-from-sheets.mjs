// 一次性遷移 script：Google Sheets (Apps Script) → Supabase
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbw_m3SjHokYxU-eUkFrMtcrVXnoxSGhRAfuUxYDt6P81UwmxcMrkKjz-h7A4teL8kKIjQ/exec';
const ENV_PATH = '/Users/erickwok/Desktop/Claude Code/Attendance App/attendance-v2/.env.local';

// 讀 .env.local
const env = {};
for (const line of readFileSync(ENV_PATH, 'utf8').split('\n')) {
    const match = line.match(/^([A-Z_]+)=(.+)$/);
    if (match) env[match[1]] = match[2].trim();
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
});

// "Wed Sep 24 2025 00:00:00 GMT+0800 (香港標準時間)" → "2025-09-24"
function toDateString(value) {
    if (!value) return '';
    const str = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const parsed = new Date(str);
    if (isNaN(parsed.getTime())) return str; // 解析唔到就原樣保留
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

async function main() {
    // ===== 1. 學員 =====
    console.log('抽取舊學員資料...');
    const studentsRes = await fetch(`${GAS_URL}?action=getStudents`, { redirect: 'follow' });
    const studentsData = await studentsRes.json();
    if (!studentsData.success) throw new Error('攞唔到學員: ' + JSON.stringify(studentsData));

    const students = studentsData.students.map(s => ({
        id: String(s.id || '').trim(),
        name: String(s.name || '').trim(),
        nickname: String(s.nickname || '').trim(),
        class: String(s.class || '').trim(),
        phone: String(s.phone || '').trim(),
        email: String(s.email || '').trim(),
        birthday: toDateString(s.birthday),
        emergency_contact: String(s.emergency_contact || '').trim(),
        emergency_phone: String(s.emergency_phone || '').trim(),
        status: String(s.status || '在讀').trim(),
        remarks: String(s.remarks || '').trim(),
        created_at: toDateString(s.createdAt) || new Date().toISOString().slice(0, 10)
    })).filter(s => s.id && s.name);

    console.log(`  攞到 ${students.length} 位學員`);

    const { error: stuError } = await supabase
        .from('students')
        .upsert(students, { onConflict: 'id' });
    if (stuError) throw new Error('學員寫入失敗: ' + stuError.message);
    console.log(`  ✓ 已寫入 ${students.length} 位學員`);

    // ===== 2. 補班別 =====
    const classNames = [...new Set(students.map(s => s.class).filter(Boolean))];
    for (const name of classNames) {
        await supabase.from('classes').upsert({ name }, { onConflict: 'name', ignoreDuplicates: true });
    }
    console.log(`  ✓ 班別檢查完成 (${classNames.join(', ')})`);

    // ===== 3. 點名記錄 =====
    console.log('抽取舊點名記錄...');
    const attRes = await fetch(`${GAS_URL}?action=getAttendance`, { redirect: 'follow' });
    const attData = await attRes.json();
    if (!attData.success) throw new Error('攞唔到點名記錄: ' + JSON.stringify(attData));

    const validStatuses = ['出席', '缺席', '遲到'];
    const seen = new Map(); // (date|studentId) → record，後出現嘅覆蓋先出現嘅
    let skipped = 0;

    for (const r of attData.attendance) {
        const date = toDateString(r.date);
        const studentId = String(r.studentId || '').trim();
        const status = String(r.status || '').trim();

        if (!date || !studentId || !validStatuses.includes(status)) {
            skipped++;
            continue;
        }

        seen.set(`${date}|${studentId}`, {
            date,
            class: String(r.className || r.class || '').trim(),
            student_id: studentId,
            student_name: String(r.studentName || '').trim(),
            status
        });
    }

    const records = [...seen.values()];
    console.log(`  攞到 ${attData.attendance.length} 筆，去重/過濾後 ${records.length} 筆${skipped ? `（跳過 ${skipped} 筆無效）` : ''}`);

    // 分批寫入（每批 500）
    for (let i = 0; i < records.length; i += 500) {
        const batch = records.slice(i, i + 500);
        const { error } = await supabase
            .from('attendance')
            .upsert(batch, { onConflict: 'date,student_id' });
        if (error) throw new Error(`點名記錄第 ${i} 批寫入失敗: ` + error.message);
        console.log(`  ✓ 已寫入 ${Math.min(i + 500, records.length)}/${records.length}`);
    }

    // ===== 4. 核對 =====
    const { count: stuCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
    const { count: attCount } = await supabase.from('attendance').select('*', { count: 'exact', head: true });
    console.log('\n===== 遷移完成 =====');
    console.log(`Supabase students: ${stuCount} 行`);
    console.log(`Supabase attendance: ${attCount} 行`);
}

main().catch(err => {
    console.error('遷移失敗:', err.message);
    process.exit(1);
});
