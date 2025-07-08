# 🚀 Google Drive 部署方法（推薦）

## 為什麼選擇Google Drive？
- ✅ 更穩定，支援完整的HTML/CSS/JS
- ✅ 與Google Sheets完美整合
- ✅ 可以設定權限控制
- ✅ 手機訪問友好

## 📋 部署步驟

### 步驟1：上傳文件到Google Drive
1. 打開 [Google Drive](https://drive.google.com)
2. 創建新文件夾，命名為「學員管理系統」
3. 上傳所有文件：
   - `index.html`
   - `css/` 文件夾（包含所有CSS文件）
   - `js/` 文件夾（包含所有JavaScript文件）

### 步驟2：設定文件為公開分享
1. 右鍵點擊 `index.html`
2. 選擇「分享」
3. 點擊「變更為任何人只要有連結即可檢視」
4. 複製分享連結

### 步驟3：取得直接訪問連結
分享連結格式：
```
https://drive.google.com/file/d/FILE_ID/view?usp=sharing
```

轉換為直接訪問連結：
```
https://drive.google.com/file/d/FILE_ID/preview
```

### 步驟4：設定權限（重要！）
回到文件夾設定：
1. 右鍵點擊整個「學員管理系統」文件夾
2. 選擇「分享」
3. 改為「限制存取」
4. 添加需要使用的人員Email
5. 設定為「檢視者」權限

## 🔒 安全性配置

### 建議設定：
- 📁 **文件夾權限**：僅限指定人員
- 👥 **使用者清單**：只加入需要使用的同事
- 🔄 **定期檢查**：每月檢查權限清單
- 🚫 **不要設為公開**：避免任何人都能訪問

## 📱 手機使用方法
1. 在手機瀏覽器打開連結
2. 登入有權限的Google帳戶
3. 系統會正常運作
4. 建議加入書籤以便快速訪問

## 🔧 Google Sheets API設定

部署完成後，你需要：

### 1. 取得API金鑰
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 創建新專案
3. 啟用「Google Sheets API」
4. 創建「API金鑰」
5. 限制API金鑰只能訪問Google Sheets API

### 2. 在應用程式中設定
1. 打開部署的網站
2. 進入「設定」頁面
3. 輸入API金鑰和Google Sheets ID
4. 測試連接

## ⚡ 快速測試
部署完成後，測試以下功能：
- ✅ 能否正常開啟網站
- ✅ 能否新增學員
- ✅ 能否編輯學員（姓名應該被鎖定）
- ✅ 班別標籤顏色是否正確
- ✅ 手機訪問是否正常

## 🆘 常見問題

**Q: 如果CSS/JS沒有載入怎麼辦？**
A: 確保css和js文件夾也設為可檢視權限

**Q: 手機上顯示不正常？**
A: 檢查是否登入了有權限的Google帳戶

**Q: 無法連接Google Sheets？**
A: 檢查API金鑰是否正確，並確認已啟用Sheets API

## 📞 下一步
部署完成後，我將協助你：
1. 設定Google Sheets API
2. 測試所有功能
3. 設定使用者權限
4. 提供使用說明 