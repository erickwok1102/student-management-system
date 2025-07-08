# 🔗 Google Sheets 連接設定指南

## 📋 概述
這個版本的學員管理系統可以連接到 Google Sheets，讓你的數據同步到雲端，多人協作更方便！

## 🚀 設定步驟

### 第一步：創建 Google Cloud 項目
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 點擊「選擇項目」→「新增項目」
3. 輸入項目名稱（例如：學員管理系統）
4. 點擊「創建」

### 第二步：啟用 Google Sheets API
1. 在 Google Cloud Console 中，前往「APIs & Services」→「Library」
2. 搜尋「Google Sheets API」
3. 點擊進入，然後點擊「Enable」

### 第三步：創建 API Key
1. 前往「APIs & Services」→「Credentials」
2. 點擊「Create Credentials」→「API key」
3. 複製生成的 API Key（稍後會用到）
4. **建議**：點擊「Restrict key」來限制 API 使用範圍，選擇「Google Sheets API」

### 第四步：創建 Google Sheet
1. 前往 [Google Sheets](https://sheets.google.com/)
2. 創建新的試算表
3. 重新命名為「學員管理系統」
4. 創建以下工作表（Sheet）：
   - `學員資料`
   - `班組資料` 
   - `出席記錄`

### 第五步：設定工作表標題行

#### 學員資料工作表
在第一行輸入以下標題：
```
A1: ID
B1: 姓名
C1: 別名
D1: 班別
E1: 電話
F1: 備註
G1: 狀態
H1: 創建日期
```

#### 班組資料工作表
在第一行輸入以下標題：
```
A1: ID
B1: 名稱
C1: 開始時間
D1: 結束時間
E1: 星期
F1: 描述
```

#### 出席記錄工作表
在第一行輸入以下標題：
```
A1: 日期
B1: 班別
C1: 學員ID
D1: 學員姓名
E1: 出席狀態
```

### 第六步：設定 Google Sheet 為公開
1. 點擊右上角「共用」按鈕
2. 點擊「變更為知道連結的任何人」
3. 權限設為「檢視者」（只讀取數據）
4. 點擊「完成」

### 第七步：取得 Sheet ID
從 Google Sheet 的網址中複製 Sheet ID：
```
https://docs.google.com/spreadsheets/d/[這裡是Sheet ID]/edit
```
例如：`1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

### 第八步：在系統中設定連接
1. 打開學員管理系統
2. 在「Google Sheets 連接設定」區域：
   - 輸入你的 API Key
   - 輸入你的 Sheet ID
3. 點擊「🔗 連接 Google Sheets」
4. 看到「✅ 成功連接」訊息即表示設定完成

## 🔄 使用方法

### 同步數據
- 點擊「🔄 同步數據」按鈕
- 系統會從 Google Sheets 讀取最新數據
- 本地修改的數據會保存在瀏覽器中

### 數據流向
```
本地系統 ←→ Google Sheets
   ↓           ↓
瀏覽器存儲   雲端存儲
```

## ⚠️ 重要注意事項

### 權限限制
- 目前版本只支援**讀取**Google Sheets 數據
- 本地新增/修改的數據不會自動寫入 Google Sheets
- 如需寫入功能，需要設定 OAuth 認證（較複雜）

### 數據安全
- API Key 會保存在瀏覽器本地存儲中
- 建議定期更換 API Key
- 不要在公共電腦上使用

### 使用建議
1. **定期備份**：定期將本地數據手動輸入到 Google Sheets
2. **團隊協作**：多人可以在 Google Sheets 中編輯，然後同步到各自的系統
3. **數據一致性**：建議指定一人負責 Google Sheets 的數據維護

## 🛠️ 故障排除

### 連接失敗
- 檢查 API Key 是否正確
- 檢查 Sheet ID 是否正確
- 確認 Google Sheets API 已啟用
- 確認 Google Sheet 已設為公開

### 同步失敗
- 檢查網路連接
- 確認工作表名稱正確（學員資料、班組資料、出席記錄）
- 確認標題行設定正確

### 數據格式問題
- 確保日期格式為 YYYY-MM-DD
- 確保數字欄位不包含文字
- 確保必填欄位不為空

## 📞 技術支援
如遇到問題，請檢查：
1. 瀏覽器控制台是否有錯誤訊息
2. Google Cloud Console 中的 API 使用量
3. Google Sheets 的權限設定

## 🔮 未來功能
- 雙向同步（讀取 + 寫入）
- 自動同步
- 衝突解決機制
- 離線模式支援 