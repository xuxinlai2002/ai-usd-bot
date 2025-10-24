import express from 'express';
import cors from 'cors';
import {chat, chat_messages, handleWithdrawalRequest, intent_recognition} from './test-handler.js';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Withdrawal API',
    timestamp: new Date().toISOString()
  });
});

app.post('/intent/recognition', async (req, res) => {
  try {
    const { messages } = req.body;
    const authorization = req.headers.authorization;

    // const token = '';
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    const token = authorization.slice(7);
    // 验证输入
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'messages字段是必需的，且必须是数组格式'
      });
    }

    // 验证消息格式
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg.role || !msg.content) {
        return res.status(400).json({
          success: false,
          error: `消息 ${i + 1} 格式不正确，必须包含role和content字段`
        });
      }
    }


    const result = await intent_recognition(messages, token);

    // 处理提现请求


    // 返回响应
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
});

// 简化的聊天接口 - GET 请求
app.get('/chat', async (req, res) => {
  try {
    const { message, auth } = req.query;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'message 参数是必需的'
      });
    }

    if (!auth) {
      return res.status(401).json({
        success: false,
        error: 'auth 参数是必需的'
      });
    }

    const messages = [
      {
        role: 'user',
        content: message
      }
    ];

    const result = await chat_messages(messages, auth);
    console.log(result);

    // 返回响应
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
});

// 原始的聊天API端点（保留兼容性）
app.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    const authorization = req.headers.authorization;

    // const token = '';
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    const token = authorization.slice(7);
    // 验证输入
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'messages字段是必需的，且必须是数组格式'
      });
    }

    // 验证消息格式
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg.role || !msg.content) {
        return res.status(400).json({
          success: false,
          error: `消息 ${i + 1} 格式不正确，必须包含role和content字段`
        });
      }
    }


    const result = await chat_messages(messages, token);
    console.log(result);

    // 处理提现请求


    // 返回响应
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
});

// 获取环境信息端点（用于调试）
app.get('/api/environment', (req, res) => {
  const envInfo = {
    mcpUrl: process.env.MCP_URL || 'Not set',
    mcpAuthToken: process.env.MCP_AUTH_TOKEN ? 'Set' : 'Not set',
    llmProvider: process.env.LLM_PROVIDER || 'claude',
    anthropicKey: process.env.ANTHROPIC_API_KEY ? 'Set' : 'Not set',
    openaiKey: process.env.OPENAI_API_KEY ? 'Set' : 'Not set'
  };
  res.json(envInfo);
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Withdrawal API server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});