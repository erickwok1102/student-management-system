# 學員管理系統 v2

Next.js + Supabase 版本,取代舊有 Google Sheets + Apps Script 架構。

## 架構

- **前端 + 後端**:Next.js(App Router),一個 project 包晒
- **資料庫**:Supabase(PostgreSQL)
- **部署**:Vercel

資料庫只可以由伺服器端(API routes)用 service role key 存取,瀏覽器攞唔到條 key,所有表都開咗 RLS。

## 初次設定(大約 15 分鐘)

### 1. 開 Supabase project

1. 去 [supabase.com](https://supabase.com) 用 Google 帳號登入(免費)
2. 撳 **New project**,名求其改(例如 `attendance`),揀 region **Southeast Asia (Singapore)**,設一個資料庫密碼(記低佢)
3. 等一兩分鐘 project 起好

### 2. 建立資料表

1. 開 project 左邊選單嘅 **SQL Editor**
2. 開呢個 repo 嘅 [`supabase/schema.sql`](supabase/schema.sql),成個檔案複製貼上去
3. 撳 **Run** — 會建立 `classes`、`students`、`attendance` 三張表,同埋三個預設班別

### 3. 設定環境變數

1. 喺 Supabase 開 **Project Settings → API**
2. 複製 **Project URL** 同 **service_role key**(注意:唔係 anon key)
3. 喺 `attendance-v2/` 資料夾將 `.env.local.example` 複製一份改名做 `.env.local`,填入兩個值

### 4. 本地試行

```bash
cd attendance-v2
npm install
npm run dev
```

開 http://localhost:3000 — 應該見到三個預設班別,可以新增學員試下。

### 5. 由舊系統遷移學員資料

1. 開你舊嘅 Google Sheets,去 `students` 工作表
2. **檔案 → 下載 → CSV**
3. 用試算表或文字編輯器將標題行嘅 `createdAt` 改做 `created_at`(其他欄位名一樣,唔使改)
4. 喺 Supabase 開 **Table Editor → students → Insert → Import data from CSV**,上載個檔案

舊點名記錄想遷移嘅話可以之後再做(Sheets 嗰邊標題係中文,要轉換一次,需要嘅話搵 Claude 幫手)。

### 6. 部署上 Vercel

1. 將 code push 上 GitHub
2. 喺 [vercel.com](https://vercel.com) **Add New → Project**,揀個 repo
3. **Root Directory** 設做 `attendance-v2`
4. 喺 **Environment Variables** 加入 `SUPABASE_URL` 同 `SUPABASE_SERVICE_ROLE_KEY`
5. Deploy

之後每次 push 都會自動重新部署,唔使再手動更新 Apps Script。

## 同舊版嘅分別

| | 舊版 | v2 |
|---|---|---|
| 點名儲存 | 先存本地再手動「同步」 | 撳一下直接入資料庫 |
| 重複點名 | 可能出現重複記錄 | 同日同學員自動覆蓋 |
| 改學員狀態 | 要整批覆蓋上傳 | 即時更新單一學員 |
| 刪除學員 | 要手動去 Sheets 刪 | 撳掣即刪 |
| 學員 ID | 前端計,可能撞號 | 伺服器生成,撞號自動重試 |
| 出席統計 | 冇 | 記錄 tab 有日期範圍查詢 + 每人出席率 |

## 資料喺邊度睇

Supabase Dashboard → **Table Editor**,似 Google Sheets 咁直接睇同改資料。
