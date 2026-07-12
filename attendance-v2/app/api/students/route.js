import { getSupabase, errorResponse } from '@/lib/supabaseServer';
import { insertStudentWithGeneratedId } from '@/lib/createStudent';

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

        const inserted = await insertStudentWithGeneratedId(supabase, student);

        return Response.json({ success: true, student: inserted });
    } catch (error) {
        return errorResponse(error);
    }
}
