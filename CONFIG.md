# 配置说明

## 环境变量配置

### 1. Telegram Bot Token
✅ **已配置**: `TELEGRAM_BOT_TOKEN=8469267764:AAE8PnEzWBYRvQFapYIwHKLxTJadybefWL4`

### 2. Chat API Token (需要配置)
❌ **需要配置**: `CHAT_API_TOKEN`

您需要将 `.env` 文件中的 `your_actual_auth_token_here` 替换为实际的认证 token。

## 如何获取 Chat API Token

根据现有代码分析，`/chat` 接口需要 Bearer token 认证。您需要：

1. **联系 API 提供方** 获取有效的认证 token
2. **或者** 检查现有服务器是否有默认的 token
3. **或者** 查看服务器配置文件中是否有 token 设置

## 测试步骤

### 1. 配置 Token
```bash
# 编辑 .env 文件
nano .env

# 将 CHAT_API_TOKEN 替换为实际值
CHAT_API_TOKEN=your_real_token_here
```

### 2. 测试 API 连接
```bash
# 测试 API 是否可用
yarn test-api
```

### 3. 测试 Bot 功能
```bash
# 启动测试 Bot（不依赖外部 API）
yarn test-bot

# 或者启动完整 Bot
yarn dev
```

## 当前状态

- ✅ Telegram Bot Token 已配置
- ✅ 项目结构完整
- ✅ TypeScript 配置正确
- ❌ Chat API Token 需要配置
- ❌ 外部 API 连接需要验证

## 下一步

1. 获取正确的 `CHAT_API_TOKEN`
2. 更新 `.env` 文件
3. 运行 `yarn test-api` 验证连接
4. 启动 Bot 进行测试
