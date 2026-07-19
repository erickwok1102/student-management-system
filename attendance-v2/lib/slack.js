/**
 * Slack 通知（Incoming Webhook）
 * 未設定 SLACK_WEBHOOK_URL = 靜靜哋唔做嘢，唔會影響主流程
 */
export async function notifySlack(text) {
    const url = process.env.SLACK_WEBHOOK_URL;
    if (!url) return false;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        return response.ok;
    } catch {
        // 通知失敗唔可以搞冧登記流程
        return false;
    }
}
