#!/bin/bash

echo "🔧 AI USD Telegram Bot 配置助手"
echo "=================================="

# 检查 .env 文件是否存在
if [ ! -f .env ]; then
    echo "❌ .env 文件不存在，正在创建..."
    cp env.example .env
    echo "✅ .env 文件已创建"
fi

echo ""
echo "📋 当前配置状态："
echo "----------------"

# 检查 Telegram Bot Token
if grep -q "TELEGRAM_BOT_TOKEN=8469267764" .env; then
    echo "✅ Telegram Bot Token: 已配置"
else
    echo "❌ Telegram Bot Token: 未配置"
fi

# 检查 Chat API Token
if grep -q "CHAT_API_TOKEN=your_actual_auth_token_here" .env; then
    echo "❌ Chat API Token: 需要配置"
    echo ""
    echo "🔑 请输入您的 Chat API Token:"
    read -p "Token: " api_token
    
    if [ ! -z "$api_token" ]; then
        # 替换 token
        sed -i.bak "s/CHAT_API_TOKEN=your_actual_auth_token_here/CHAT_API_TOKEN=$api_token/" .env
        echo "✅ Chat API Token 已更新"
    else
        echo "⚠️  未输入 token，请稍后手动配置"
    fi
else
    echo "✅ Chat API Token: 已配置"
fi

echo ""
echo "🧪 测试配置..."
echo "--------------"

# 测试 API 连接
echo "测试 Chat API 连接..."
yarn test-api

echo ""
echo "📱 启动选项："
echo "------------"
echo "1. 测试 Bot (不依赖外部 API): yarn test-bot"
echo "2. 启动完整 Bot: yarn dev"
echo "3. 查看配置说明: cat CONFIG.md"
