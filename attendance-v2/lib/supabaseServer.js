import { createClient } from '@supabase/supabase-js';

/**
 * 伺服器端 Supabase client（用 service role key，只可以喺 API route 用）
 */
export function getSupabase() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        throw new Error('未設定 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 環境變數');
    }

    return createClient(url, key, {
        auth: { persistSession: false }
    });
}

/**
 * 統一嘅 API 錯誤回應
 */
export function errorResponse(error, status = 500) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ success: false, error: message }, { status });
}
