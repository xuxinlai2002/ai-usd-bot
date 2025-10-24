#!/bin/bash

echo "🚀 使用 PM2 启动 AI USD Telegram Bot"
echo "=================================="

# 检查是否已构建
if [ ! -d "dist" ]; then
    echo "📦 构建项目..."
    yarn build
fi

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "❌ .env 文件不存在，请先创建并配置环境变量"
    echo "📝 参考 env.example 文件"
    exit 1
fi

# 检查 PM2 是否安装
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 未安装，请先安装 PM2"
    echo "💡 运行: npm install -g pm2"
    exit 1
fi

# 创建日志目录
mkdir -p logs

echo "🔧 启动选项："
echo "1. 开发环境: yarn pm2:dev"
echo "2. 生产环境: yarn pm2:prod"
echo "3. 默认启动: yarn pm2:start"
echo ""

# 根据参数选择启动方式
case "$1" in
    "dev")
        echo "🛠️  启动开发环境..."
        yarn pm2:dev
        ;;
    "prod")
        echo "🏭 启动生产环境..."
        yarn pm2:prod
        ;;
    *)
        echo "🚀 启动默认环境..."
        yarn pm2:start
        ;;
esac

echo ""
echo "📊 查看状态: yarn pm2:status"
echo "📋 查看日志: yarn pm2:logs"
echo "📈 监控面板: yarn pm2:monit"
echo "🔄 重启服务: yarn pm2:restart"
echo "⏹️  停止服务: yarn pm2:stop"
