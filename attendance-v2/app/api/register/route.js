import { getSupabase, errorResponse } from '@/lib/supabaseServer';
import { insertStudentWithGeneratedId } from '@/lib/createStudent';

// POST /api/register - 家長自助登記（公開 endpoint）
// 新登記一律入「待審核」狀態，管理員喺學員 tab 過目先轉「在讀」
export async function POST(request) {
    try {
        const body = await request.json();

        // 蜜罐欄位：正常家長唔會填到，填咗 = 機械人，扮成功打發佢走
        if (body.website) {
            return Response.json({ success: true });
        }

        const name = (body.name || '').trim();
        const className = (body.class || '').trim();
        const phone = (body.phone || '').trim();

        if (!name) return errorResponse('請輸入學員姓名', 400);
        if (!className) return errorResponse('請選擇班別', 400);
        if (!phone) return errorResponse('請輸入聯絡電話', 400);

        if (name.length > 50 || className.length > 50) {
            return errorResponse('輸入內容過長', 400);
        }

        const supabase = getSupabase();

        // 確認班別真係存在（防止亂填）
        const { data: classRow, error: classError } = await supabase
            .from('classes')
            .select('name')
            .eq('name', className)
            .maybeSingle();

        if (classError) throw classError;
        if (!classRow) return errorResponse('班別唔存在，請重新選擇', 400);

        const student = {
            name,
            class: className,
            phone,
            nickname: (body.nickname || '').trim().slice(0, 50),
            email: (body.email || '').trim().slice(0, 100),
            birthday: (body.birthday || '').trim().slice(0, 10),
            emergency_contact: (body.emergency_contact || '').trim().slice(0, 50),
            emergency_phone: (body.emergency_phone || '').trim().slice(0, 20),
            status: '待審核',
            remarks: (body.remarks || '').trim().slice(0, 500)
        };

        const inserted = await insertStudentWithGeneratedId(supabase, student);

        return Response.json({
            success: true,
            message: `登記成功！我哋收到 ${inserted.name} 嘅資料，核實後會通知你。`,
            id: inserted.id
        });
    } catch (error) {
        return errorResponse(error);
    }
}
