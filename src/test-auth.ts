import axios from 'axios';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatApiResponse {
  success: boolean;
  roundsUsed?: number;
  maxRoundsReached?: boolean;
  toolCallsCount?: number;
  transcript?: string;
  error?: string;
}

async function testChatApiWithAuth(): Promise<void> {
  const chatApiUrl = process.env.CHAT_API_URL || 'http://64.176.82.230:3001/chat';
  
  console.log('🧪 测试聊天接口（包含 auth 字段）...');
  console.log(`📡 API URL: ${chatApiUrl}`);
  
  // 从命令行参数获取 token
  const args = process.argv.slice(2);
  const token = args[0];
  
  if (!token) {
    console.log('❌ 请提供认证 token');
    console.log('💡 使用方法: yarn test-auth <your_token>');
    console.log('💡 例如: yarn test-auth abc123def456');
    return;
  }

  console.log(`🔑 Token: ${token.substring(0, 8)}...`);

  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: '你好，这是一个测试消息'
    }
  ];

  const requestBody = {
    messages,
    auth: token
  };

  console.log('📤 发送的请求体:', JSON.stringify(requestBody, null, 2));

  try {
    const response = await axios.post(
      chatApiUrl,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        timeout: 10000 // 10秒超时
      }
    );

    console.log('✅ 接口调用成功！');
    console.log('📊 响应数据:', JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error('❌ 接口调用失败:', error.message);
    
    if (error.response) {
      console.error('📋 错误详情:', error.response.data);
      console.error('🔢 状态码:', error.response.status);
    }
  }
}

// 运行测试
testChatApiWithAuth().catch(console.error);
