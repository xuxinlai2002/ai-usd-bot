#!/bin/bash

echo "🤖 启动 AI USD Telegram Bot..."
echo "📋 检查环境变量..."

# 检查 .env 文件是否存在
if [ ! -f .env ]; then
    echo "❌ .env 文件不存在，请先创建并配置环境变量"
    echo "📝 参考 env.example 文件"
    exit 1
fi

# 检查必要的环境变量
source .env

if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "❌ TELEGRAM_BOT_TOKEN 未设置"
    exit 1
fi

if [ -z "$CHAT_API_URL" ]; then
    echo "❌ CHAT_API_URL 未设置"
    exit 1
fi

echo "✅ 环境变量检查通过"
echo "🚀 启动 Bot..."

# 启动 Bot
yarn dev
