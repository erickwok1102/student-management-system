import { getSupabase, errorResponse } from '@/lib/supabaseServer';

const VALID_STATUSES = ['出席', '缺席', '遲到'];

// GET /api/attendance - 查詢點名記錄
// 支援 ?date=2026-07-09（單日）或 ?from=2026-07-01&to=2026-07-31（範圍），可加 &class=青年班
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const className = searchParams.get('class');

        const supabase = getSupabase();

        // Supabase 每個請求最多返回 1000 行（伺服器端上限），所以要分頁攞齊
        const PAGE_SIZE = 1000;
        const data = [];

        for (let page = 0; ; page++) {
            let query = supabase
                .from('attendance')
                .select('*')
                .order('date', { ascending: false })
                .order('class')
                .order('student_id')
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

            if (date) query = query.eq('date', date);
            if (from) query = query.gte('date', from);
            if (to) query = query.lte('date', to);
            if (className) query = query.eq('class', className);

            const { data: batch, error } = await query;
            if (error) throw error;

            data.push(...batch);
            if (batch.length < PAGE_SIZE) break;
        }

        return Response.json({ success: true, attendance: data, count: data.length });
    } catch (error) {
        return errorResponse(error);
    }
}

// POST /api/attendance - 儲存點名記錄（整批 upsert）
// body: { date, class, records: [{ studentId, studentName, status }] }
// 同一日同一學員再儲存會直接覆蓋，唔會出現重複記錄
export async function POST(request) {
    try {
        const { date, class: className, records } = await request.json();

        if (!date || !className) {
            return errorResponse('缺少日期或班別', 400);
        }
        if (!Array.isArray(records) || records.length === 0) {
            return errorResponse('冇點名記錄可以儲存', 400);
        }

        for (const record of records) {
            if (!record.studentId || !VALID_STATUSES.includes(record.status)) {
                return errorResponse(`記錄格式錯誤：${JSON.stringify(record)}`, 400);
            }
        }

        const rows = records.map(record => ({
            date,
            class: className,
            student_id: record.studentId,
            student_name: record.studentName || '',
            status: record.status
        }));

        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('attendance')
            .upsert(rows, { onConflict: 'date,student_id' })
            .select();

        if (error) throw error;

        return Response.json({
            success: true,
            count: data.length,
            message: `已儲存 ${data.length} 筆點名記錄`
        });
    } catch (error) {
        return errorResponse(error);
    }
}
