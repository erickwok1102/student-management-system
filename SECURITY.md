# 安全說明

## Google Sheets API 設定

### ⚠️ 重要安全提醒

1. **絕對不要在代碼中硬編碼 API Key**
2. **不要將 API Key 提交到 Git 倉庫**
3. **使用環境變數或本地配置文件存儲敏感資訊**

### 🔐 安全的 API Key 管理

#### 方法一：使用系統設定頁面（推薦）
1. 在應用程式中點擊「系統設定」
2. 在「Google Sheets 同步」區域輸入你的 API Key
3. API Key 會安全地存儲在瀏覽器的 localStorage 中

#### 方法二：創建本地配置文件
1. 創建 `config.js` 文件（已在 .gitignore 中）
2. 添加以下內容：
```javascript
// config.js - 此文件不會被提交到 Git
window.CONFIG = {
    GOOGLE_API_KEY: 'your-api-key-here',
    GOOGLE_SHEET_ID: 'your-sheet-id-here'
};
```
3. 在 `index.html` 中引用：
```html
<script src="config.js"></script>
```

### 🛡️ API Key 限制設定

在 Google Cloud Console 中設定 API Key 限制：

1. **應用程式限制**：
   - 選擇「HTTP 引用者（網站）」
   - 添加你的網站域名

2. **API 限制**：
   - 限制為「Google Sheets API」

3. **其他安全措施**：
   - 定期輪換 API Key
   - 監控 API 使用情況
   - 設定使用配額限制

### 🚨 如果 API Key 洩露

1. 立即在 Google Cloud Console 中刪除洩露的 API Key
2. 創建新的 API Key
3. 更新應用程式配置
4. 檢查 Git 歷史記錄，如有必要請清理

### 📝 最佳實踐

- 使用最小權限原則
- 定期審查 API 使用情況
- 為不同環境使用不同的 API Key
- 實施適當的錯誤處理和日誌記錄 