import { getSupabase, errorResponse } from '@/lib/supabaseServer';
import { sendWhatsApp, toChatId } from '@/lib/greenApi';

// GET /api/cron/birthday - Vercel Cron 每日 09:00 HKT 執行
// 1. 今日正日生日嘅在讀學員 → 逐個 WhatsApp DM 祝賀
// 2. 如果今日係 1 號 → 額外 send 成個月嘅生日名單去指定 group
// ?dryRun=1 淨係回報會send咩，唔會真係send（測試用）

function hktToday() {
    const now = new Date(Date.now() + 8 * 60 * 60 * 1000); // UTC+8
    return {
        month: now.getUTCMonth() + 1,
        day: now.getUTCDate(),
        mm: String(now.getUTCMonth() + 1).padStart(2, '0'),
        dd: String(now.getUTCDate()).padStart(2, '0')
    };
}

export async function GET(request) {
    try {
        // Vercel Cron 會自動帶 Authorization: Bearer <CRON_SECRET>
        const cronSecret = process.env.CRON_SECRET;
        const auth = request.headers.get('authorization') || '';
        if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
            return errorResponse('Unauthorized', 401);
        }

        const { searchParams } = new URL(request.url);

        // 總開關：BIRTHDAY_AUTOMATION_ENABLED 唔係 'true' 就永遠只綵排、唔會真 send
        // （即係就算 cron 每日照行，都只係回報「本應 send 乜」）
        const enabled = process.env.BIRTHDAY_AUTOMATION_ENABLED === 'true';
        const dryRun = !enabled || searchParams.get('dryRun') === '1';

        const today = hktToday();
        const supabase = getSupabase();

        const { data: students, error } = await supabase
            .from('students')
            .select('id, name, nickname, class, phone, birthday')
            .eq('status', '在讀');

        if (error) throw error;

        const withBirthday = students.filter(s => (s.birthday || '').length >= 10);

        // ===== 1. 今日生日 → DM =====
        const todayBirthdays = withBirthday.filter(s =>
            s.birthday.slice(5, 7) === today.mm && s.birthday.slice(8, 10) === today.dd
        );

        const dmResults = [];
        for (const s of todayBirthdays) {
            const chatId = toChatId(s.phone);
            const displayName = s.nickname || s.name;
            const message =
                `🎂 ${displayName}，生日快樂！\n\n` +
                `願你新一歲身心靈都健康成長，繼續喺${s.class}開開心心咁學嘢！\n\n` +
                `—— 導師團隊 ❤️`;

            if (!chatId) {
                dmResults.push({ name: s.name, sent: false, reason: '冇有效電話' });
                continue;
            }

            if (dryRun) {
                dmResults.push({ name: s.name, chatId, message, sent: false, reason: 'dryRun' });
                continue;
            }

            try {
                await sendWhatsApp(chatId, message);
                dmResults.push({ name: s.name, chatId, sent: true });
            } catch (err) {
                dmResults.push({ name: s.name, chatId, sent: false, reason: err.message });
            }
        }

        // ===== 2. 每月 1 號 → group 名單 =====
        let groupResult = null;
        const groupId = process.env.GREEN_API_BIRTHDAY_GROUP_ID;

        if (today.day === 1 && groupId) {
            const monthBirthdays = withBirthday
                .filter(s => s.birthday.slice(5, 7) === today.mm)
                .sort((a, b) => a.birthday.slice(8, 10).localeCompare(b.birthday.slice(8, 10)));

            if (monthBirthdays.length > 0) {
                const lines = monthBirthdays.map(s => {
                    const nick = s.nickname ? ` (${s.nickname})` : '';
                    return `🎂 ${today.month}月${parseInt(s.birthday.slice(8, 10), 10)}日 · ${s.name}${nick} · ${s.class}`;
                });
                const message =
                    `📅 ${today.month} 月生日之星（${monthBirthdays.length} 位）\n\n` +
                    lines.join('\n') +
                    `\n\n大家記得同佢哋講返聲生日快樂！🎉`;

                if (dryRun) {
                    groupResult = { groupId, message, sent: false, reason: 'dryRun' };
                } else {
                    try {
                        await sendWhatsApp(groupId, message);
                        groupResult = { groupId, sent: true, count: monthBirthdays.length };
                    } catch (err) {
                        groupResult = { groupId, sent: false, reason: err.message };
                    }
                }
            } else {
                groupResult = { sent: false, reason: '本月冇生日學員' };
            }
        }

        return Response.json({
            success: true,
            date: `${today.mm}-${today.dd}`,
            enabled,
            dryRun,
            todayBirthdayCount: todayBirthdays.length,
            dms: dmResults,
            group: groupResult
        });
    } catch (error) {
        return errorResponse(error);
    }
}
