'use client';

/**
 * 前端 API helper - 統一處理 fetch 同錯誤
 */
export async function api(path, options = {}) {
    const response = await fetch(path, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
        body: options.body ? JSON.stringify(options.body) : undefined
    });

    let result;
    try {
        result = await response.json();
    } catch {
        throw new Error(`伺服器回應錯誤 (HTTP ${response.status})`);
    }

    if (!response.ok || !result.success) {
        throw new Error(result.error || `HTTP ${response.status}`);
    }

    return result;
}

/** 今日日期 YYYY-MM-DD（本地時區） */
export function todayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
