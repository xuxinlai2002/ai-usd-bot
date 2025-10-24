# AI USD Telegram Bot

这是一个基于 TypeScript 的 Telegram Bot，用于与 AI USD 聊天接口进行交互。

## 功能特性

- 🤖 接收 Telegram 用户消息
- 🔑 支持用户输入认证 token
- 🔗 调用 AI USD 聊天接口 (`http://64.176.82.230:3001/chat`)
- 📱 将 AI 回复发送回 Telegram
- ⚡ 支持实时消息处理
- 🛡️ 错误处理和超时保护
- 👥 多用户支持，每个用户独立的认证 token

## 环境配置

创建 `.env` 文件并配置以下环境变量：

```env
# Telegram Bot API Key
TELEGRAM_BOT_TOKEN=8469267764:AAE8PnEzWBYRvQFapYIwHKLxTJadybefWL4

# Chat API Configuration
CHAT_API_URL=http://64.176.82.230:3001/chat
# 注意：认证 token 现在由用户在 Telegram 中输入，不需要在此配置

# Bot Configuration
BOT_PORT=3000
NODE_ENV=development
```

## 安装依赖

```bash
yarn install
```

## 开发模式

```bash
# 直接启动开发模式
yarn dev

# 使用启动脚本（包含环境检查）
yarn bot
```

## 构建和运行

```bash
# 构建项目
yarn build

# 运行生产版本
yarn start

# 清理构建文件
yarn clean

# 重新构建
yarn rebuild
```

## 测试

```bash
# 测试聊天接口连接（需要提供 token）
yarn test-api <your_token>

# 测试聊天接口（包含 auth 字段）
yarn test-auth <your_token>

# 测试 Bot 功能（不依赖外部 API）
yarn test-bot
```

## 项目结构

```
src/
├── index.ts          # 主入口文件
package.json          # 项目配置
tsconfig.json         # TypeScript 配置
.env                  # 环境变量（需要手动创建）
```

## API 接口说明

Bot 会调用 `/chat` 接口，发送以下格式的数据：

```json
{
  "messages": [
    {
      "role": "user",
      "content": "用户消息内容"
    }
  ],
  "auth": "用户认证token"
}
```

接口返回格式：

```json
{
  "success": true,
  "roundsUsed": 1,
  "maxRoundsReached": false,
  "toolCallsCount": 0,
  "transcript": "AI 回复内容"
}
```

## 使用说明

1. 启动 Bot 后，在 Telegram 中找到您的 Bot
2. 发送 `/start` 开始对话
3. 使用 `/token <your_token>` 设置认证 token
4. 设置 token 后，直接发送任何消息与 AI 对话
5. Bot 会调用 AI 接口并返回回复

### Bot 命令

- `/start` - 开始使用 Bot
- `/help` - 查看详细使用说明
- `/token <token>` - 设置认证 token
- `/token` - 查看当前 token 状态
- `/status` - 查看 Bot 状态信息

## 重要配置说明

### ✅ 新的认证方式

**认证 token 现在由用户在 Telegram 中输入**，无需在 `.env` 文件中配置：

1. 用户在 Telegram 中使用 `/token <your_token>` 命令设置认证 token
2. 每个用户都有独立的认证 token
3. 支持多用户同时使用
4. Token 在 Bot 重启后会丢失（内存存储）

### 其他注意事项

- ✅ `TELEGRAM_BOT_TOKEN` 已正确配置
- ✅ 用户认证 token 通过 Telegram 输入
- Bot 支持中文和英文对话
- 接口调用超时时间为 30 秒
- 详细配置说明请查看 `CONFIG.md` 文件
