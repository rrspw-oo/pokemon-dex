#!/bin/bash

# 寶可夢圖鑑 PWA - GitHub Pages 部署腳本
# Pokemon Dex PWA - GitHub Pages Deployment Script

echo "🔍 寶可夢圖鑑 PWA 部署腳本"
echo "=================================="

# 檢查Git是否已安裝
if ! command -v git &> /dev/null; then
    echo "❌ 錯誤: 請先安裝Git"
    echo "   下載: https://git-scm.com/"
    exit 1
fi

# 檢查是否在正確目錄
if [ ! -f "index.html" ] || [ ! -f "manifest.json" ]; then
    echo "❌ 錯誤: 請在專案根目錄執行此腳本"
    echo "   請確認目錄包含 index.html 和 manifest.json"
    exit 1
fi

# 提示用戶輸入GitHub資訊
echo ""
echo "📝 請輸入你的GitHub資訊:"
read -p "GitHub 用戶名: " GITHUB_USERNAME
read -p "倉庫名稱 (建議: pokemon-dex): " REPO_NAME

# 使用預設值
if [ -z "$REPO_NAME" ]; then
    REPO_NAME="pokemon-dex"
fi

# 確認資訊
echo ""
echo "🔍 確認部署資訊:"
echo "   GitHub用戶名: $GITHUB_USERNAME"
echo "   倉庫名稱: $REPO_NAME"
echo "   最終網址: https://$GITHUB_USERNAME.github.io/$REPO_NAME/"
echo ""
read -p "確認部署? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "❌ 部署已取消"
    exit 1
fi

# 清理開發檔案
echo ""
echo "🧹 清理開發檔案..."
rm -f pokemon-search.html
rm -f start-server.py
rm -f create_icons.py

# 初始化Git倉庫
echo "📦 初始化Git倉庫..."
git init

# 設定Git用戶資訊（如果未設定）
if [ -z "$(git config --global user.name)" ]; then
    read -p "Git 用戶名: " GIT_NAME
    git config --global user.name "$GIT_NAME"
fi

if [ -z "$(git config --global user.email)" ]; then
    read -p "Git 電子郵件: " GIT_EMAIL
    git config --global user.email "$GIT_EMAIL"
fi

# 新增檔案到Git
echo "📋 新增檔案到Git..."
git add .

# 建立初始提交
echo "💾 建立初始提交..."
git commit -m "Initial commit: Pokemon Dex PWA

🔍 Features:
- Complete Pokemon dex with 1027 Pokemon
- PWA support with offline functionality
- Responsive design for all devices
- 18 type categories with colors
- Chinese and English search support

📱 Ready for GitHub Pages deployment!"

# 設定遠端倉庫
echo "🔗 連接GitHub倉庫..."
git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

# 設定主分支
git branch -M main

# 推送到GitHub
echo "🚀 推送到GitHub..."
if git push -u origin main; then
    echo ""
    echo "🎉 部署成功！"
    echo ""
    echo "📋 下一步驟:"
    echo "1. 前往 https://github.com/$GITHUB_USERNAME/$REPO_NAME"
    echo "2. 進入 Settings > Pages"
    echo "3. 選擇 Source: Deploy from a branch"
    echo "4. 選擇 Branch: main"
    echo "5. 點擊 Save"
    echo ""
    echo "⏰ 等待5-10分鐘後，你的網站將在以下網址上線:"
    echo "🌐 https://$GITHUB_USERNAME.github.io/$REPO_NAME/"
    echo ""
    echo "📱 iPhone安裝步驟:"
    echo "1. 在iPhone Safari開啟上述網址"
    echo "2. 點擊分享按鈕 📤"
    echo "3. 選擇「加入主畫面」"
    echo "4. 確認安裝"
    echo ""
    echo "🎮 開始你的寶可夢收集之旅吧！"
else
    echo ""
    echo "❌ 推送失敗！"
    echo ""
    echo "可能原因:"
    echo "1. GitHub倉庫不存在 - 請先在GitHub建立 $REPO_NAME 倉庫"
    echo "2. 認證失敗 - 請檢查GitHub用戶名和權限"
    echo "3. 網路問題 - 請檢查網路連線"
    echo ""
    echo "🔧 手動解決步驟:"
    echo "1. 前往 https://github.com/new"
    echo "2. 建立名為 '$REPO_NAME' 的新倉庫"
    echo "3. 重新執行此腳本"
fi