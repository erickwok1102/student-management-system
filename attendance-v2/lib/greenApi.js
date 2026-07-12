/**
 * Green API - WhatsApp 發送（非官方渠道，credentials 只喺伺服器端用）
 */

function getConfig() {
    const instanceId = process.env.GREEN_API_INSTANCE_ID;
    const token = process.env.GREEN_API_TOKEN;
    if (!instanceId || !token) {
        throw new Error('未設定 GREEN_API_INSTANCE_ID 或 GREEN_API_TOKEN');
    }
    return { instanceId, token };
}

/**
 * 電話號碼轉 Green API chatId
 * - 8 位香港號碼自動加 852
 * - 已有 @c.us / @g.us 就原樣用（group id）
 */
export function toChatId(raw) {
    const str = String(raw || '').trim();
    if (str.includes('@')) return str;

    const digits = str.replace(/\D/g, '');
    if (digits.length === 8) return `852${digits}@c.us`;
    if (digits.length >= 10) return `${digits}@c.us`; // 已包含國家碼
    return null;
}

/**
 * Send WhatsApp 訊息
 * @param {string} chatId - toChatId() 嘅結果
 * @param {string} message
 */
export async function sendWhatsApp(chatId, message) {
    const { instanceId, token } = getConfig();

    const response = await fetch(
        `https://api.green-api.com/waInstance${instanceId}/sendMessage/${token}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatId, message })
        }
    );

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Green API HTTP ${response.status}: ${text.slice(0, 200)}`);
    }

    return response.json();
}
