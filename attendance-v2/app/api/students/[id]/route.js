import { getSupabase, errorResponse } from '@/lib/supabaseServer';

// 可以更新嘅欄位（白名單）
const UPDATABLE_FIELDS = [
    'name', 'nickname', 'class', 'phone', 'email', 'birthday',
    'emergency_contact', 'emergency_phone', 'status', 'remarks'
];

// PATCH /api/students/:id - 更新學員（例如改狀態）
export async function PATCH(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();

        const updates = {};
        for (const field of UPDATABLE_FIELDS) {
            if (field in body) updates[field] = body[field];
        }

        if (Object.keys(updates).length === 0) {
            return errorResponse('冇提供可以更新嘅欄位', 400);
        }

        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('students')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return errorResponse(`找不到學員 ID: ${id}`, 404);
            }
            throw error;
        }

        return Response.json({ success: true, student: data });
    } catch (error) {
        return errorResponse(error);
    }
}

// DELETE /api/students/:id - 刪除學員
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('students')
            .delete()
            .eq('id', id)
            .select();

        if (error) throw error;
        if (!data || data.length === 0) {
            return errorResponse(`找不到學員 ID: ${id}`, 404);
        }

        return Response.json({ success: true, deleted: data[0] });
    } catch (error) {
        return errorResponse(error);
    }
}
