import { getSupabase, errorResponse } from '@/lib/supabaseServer';

// DELETE /api/attendance/:id - 刪除單筆點名記錄
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('attendance')
            .delete()
            .eq('id', id)
            .select();

        if (error) throw error;
        if (!data || data.length === 0) {
            return errorResponse(`找不到點名記錄 ID: ${id}`, 404);
        }

        return Response.json({ success: true, deleted: data[0] });
    } catch (error) {
        return errorResponse(error);
    }
}
