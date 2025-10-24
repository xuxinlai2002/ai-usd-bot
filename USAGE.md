# 使用示例

## 1. 启动 Bot

```bash
# 开发模式
yarn dev

# 或者使用启动脚本
yarn bot
```

## 2. 在 Telegram 中使用

### 首次使用
1. 在 Telegram 中找到您的 Bot
2. 发送 `/start`
3. Bot 会显示欢迎信息和设置说明

### 设置认证 Token
```
/token your_actual_auth_token_here
```

### 开始对话
设置 token 后，直接发送消息：
```
你好，请帮我分析一下市场情况
```

### 查看状态
```
/status
```

## 3. 测试 API 连接

```bash
# 测试 API（需要提供 token）
yarn test-api your_actual_auth_token_here
```

## 4. 测试 Bot 功能

```bash
# 测试 Bot（不依赖外部 API）
yarn test-bot
```

## 5. 完整流程示例

1. **启动 Bot**
   ```bash
   yarn dev
   ```

2. **在 Telegram 中操作**
   ```
   用户: /start
   Bot: 🤖 欢迎使用 AI USD Bot！...
   
   用户: /token abc123def456
   Bot: ✅ 认证 token 设置成功！...
   
   用户: /chat 你好，请帮我分析一下市场
   Bot: ⏳ 正在处理您的请求...
   Bot: 🤖 AI 回复：...
   
   或者直接发送消息：
   用户: 你好，请帮我分析一下市场
   Bot: ⏳ 正在处理您的请求...
   Bot: 🤖 AI 回复：...
   ```

3. **查看状态**
   ```
   用户: /status
   Bot: 📊 Bot 状态信息：...
   ```

## 注意事项

- 每个用户需要单独设置认证 token
- Token 在 Bot 重启后会丢失（当前使用内存存储）
- 支持多用户同时使用
- 所有用户共享同一个聊天接口
