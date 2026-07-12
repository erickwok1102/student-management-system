import crypto from 'crypto';
import { sendWhatsApp, toChatId } from '@/lib/greenApi';

// POST /api/slack/invite - Slack slash command（例如 /邀請 91234567）
// 收到家長電話 → 用團隊 WhatsApp send 學員登記 link 俾佢
// 設定方法見 README「Slack 邀請設定」一節

/** 驗證請求真係嚟自 Slack（HMAC signing secret） */
function verifySlackSignature(rawBody, headers) {
    const secret = process.env.SLACK_SIGNING_SECRET;
    if (!secret) return false;

    const timestamp = headers.get('x-slack-request-timestamp');
    const signature = headers.get('x-slack-signature');
    if (!timestamp || !signature) return false;

    // 防 replay：超過 5 分鐘嘅請求唔要
    if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

    const base = `v0:${timestamp}:${rawBody}`;
    const expected = 'v0=' + crypto.createHmac('sha256', secret).update(base).digest('hex');

    try {
        return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
        return false;
    }
}

function getRegisterUrl() {
    const base =
        process.env.APP_BASE_URL ||
        (process.env.VERCEL_PROJECT_PRODUCTION_URL
            ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
            : '');
    return base ? `${base}/register` : null;
}

export async function POST(request) {
    const rawBody = await request.text();

    if (!verifySlackSignature(rawBody, request.headers)) {
        return new Response('invalid signature', { status: 401 });
    }

    const params = new URLSearchParams(rawBody);
    const text = (params.get('text') || '').trim();
    const userName = params.get('user_name') || '';

    // Slack slash command 回應格式
    const reply = (message, inChannel = false) =>
        Response.json({
            response_type: inChannel ? 'in_channel' : 'ephemeral',
            text: message
        });

    const chatId = toChatId(text);
    if (!chatId || chatId.endsWith('@g.us')) {
        return reply('❌ 請提供有效電話號碼，例如：`/邀請 91234567`（香港號碼 8 位，其他地區請連國家碼）');
    }

    const registerUrl = getRegisterUrl();
    if (!registerUrl) {
        return reply('❌ 未設定 APP_BASE_URL 環境變數，唔知登記頁條 link 係咩');
    }

    const message =
        `你好！👋 歡迎加入我哋嘅班！\n\n` +
        `請用以下連結填寫學員資料完成登記：\n${registerUrl}\n\n` +
        `填完之後導師會核實並聯絡你確認，多謝！`;

    try {
        await sendWhatsApp(chatId, message);
        const phone = chatId.replace('@c.us', '');
        return reply(`✅ 已經 WhatsApp 登記 link 俾 +${phone}（由 ${userName} 發起）`, true);
    } catch (error) {
        return reply(`❌ WhatsApp 發送失敗：${error.message}`);
    }
}
