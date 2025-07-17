#!/bin/bash

# 學員管理系統一鍵啟動腳本

echo "🚀 啟動學員管理系統..."
echo "=============================="

# 檢查是否在正確的目錄
if [ ! -f "index.html" ]; then
    echo "❌ 錯誤：請在學員管理系統目錄中運行此腳本"
    exit 1
fi

# 啟動本地伺服器
echo "📡 啟動本地 HTTP 伺服器..."
echo "🌐 系統將在 http://localhost:8080 運行"
echo "💡 要停止伺服器，請按 Ctrl+C"
echo "=============================="

# 等待 2 秒後自動打開瀏覽器
sleep 2 && open http://localhost:8080 &

# 啟動 Python HTTP 伺服器
python3 -m http.server 8080 