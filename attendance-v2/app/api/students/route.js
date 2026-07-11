import { getSupabase, errorResponse } from '@/lib/supabaseServer';

// GET /api/students - 攞學員列表（可選 ?class=青年班&status=在讀）
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const className = searchParams.get('class');
        const status = searchParams.get('status');

        const supabase = getSupabase();
        let query = supabase.from('students').select('*').order('id');

        if (className) query = query.eq('class', className);
        if (status) query = query.eq('status', status);

        const { data, error } = await query;
        if (error) throw error;

        return Response.json({ success: true, students: data, count: data.length });
    } catch (error) {
        return errorResponse(error);
    }
}

// POST /api/students - 新增學員（ID 由伺服器生成，Y0001 格式）
export async function POST(request) {
    try {
        const body = await request.json();
        const name = (body.name || '').trim();
        const className = (body.class || '').trim();

        if (!name) return errorResponse('請輸入學員姓名', 400);
        if (!className) return errorResponse('請選擇班別', 400);

        const supabase = getSupabase();

        const student = {
            name,
            class: className,
            nickname: (body.nickname || '').trim(),
            phone: (body.phone || '').trim(),
            email: (body.email || '').trim(),
            birthday: (body.birthday || '').trim(),
            emergency_contact: (body.emergency_contact || '').trim(),
            emergency_phone: (body.emergency_phone || '').trim(),
            status: body.status || '在讀',
            remarks: (body.remarks || '').trim()
        };

        // 生成下一個 ID；如果同時有人新增撞咗 unique key，重試多兩次
        let inserted = null;
        let lastError = null;

        for (let attempt = 0; attempt < 3; attempt++) {
            const { data: ids, error: idError } = await supabase
                .from('students')
                .select('id')
                .like('id', 'Y%');

            if (idError) throw idError;

            const maxNum = ids
                .map(row => parseInt(row.id.substring(1), 10))
                .filter(num => !isNaN(num))
                .reduce((max, num) => Math.max(max, num), 0);

            const newId = `Y${String(maxNum + 1).padStart(4, '0')}`;

            const { data, error } = await supabase
                .from('students')
                .insert({ ...student, id: newId })
                .select()
                .single();

            if (!error) {
                inserted = data;
                break;
            }
            if (error.code !== '23505') throw error; // 唔係撞 ID 就直接報錯
            lastError = error;
        }

        if (!inserted) throw lastError || new Error('新增學員失敗');

        return Response.json({ success: true, student: inserted });
    } catch (error) {
        return errorResponse(error);
    }
}
