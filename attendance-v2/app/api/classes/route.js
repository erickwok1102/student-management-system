import { getSupabase, errorResponse } from '@/lib/supabaseServer';

// GET /api/classes - 攞班別列表
// ?registration=1 只返回開放俾家長自助登記嘅班（/register 頁用）
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const registrationOnly = searchParams.get('registration') === '1';

        const supabase = getSupabase();
        let query = supabase
            .from('classes')
            .select('id, name, sort_order')
            .order('sort_order')
            .order('name');

        if (registrationOnly) query = query.eq('open_for_registration', true);

        const { data, error } = await query;
        if (error) throw error;

        return Response.json({ success: true, classes: data });
    } catch (error) {
        return errorResponse(error);
    }
}

// POST /api/classes - 新增班別 { name }
export async function POST(request) {
    try {
        const { name } = await request.json();
        const trimmed = (name || '').trim();

        if (!trimmed) {
            return errorResponse('請輸入班別名稱', 400);
        }

        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('classes')
            .insert({ name: trimmed })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return errorResponse(`班別「${trimmed}」已經存在`, 409);
            }
            throw error;
        }

        return Response.json({ success: true, class: data });
    } catch (error) {
        return errorResponse(error);
    }
}
