import { Telegraf, Context } from 'telegraf';
import axios from 'axios';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 接口类型定义
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

class TelegramBot {
  private bot: Telegraf;
  private chatApiUrl: string;
  private userTokens: Map<number, string> = new Map(); // 存储用户的认证 token

  constructor() {
    // 验证必要的环境变量
//    const config = JSON.parse(fs.readFileSync('config/config.json', 'utf8'));
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.chatApiUrl = process.env.CHAT_API_URL || 'http://64.176.82.230:3001/chat';

    console.log(this.chatApiUrl);
    console.log(botToken);
    console.log(process.env.CHAT_API_URL);
    console.log(process.env.TELEGRAM_BOT_TOKEN);
    
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN 环境变量未设置');
    }

    this.bot = new Telegraf(botToken);
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // 处理 /start 命令
    this.bot.start((ctx: Context) => {
      const userId = ctx.from?.id;
      if (!userId) return;
      
      ctx.reply('🤖 Welcome to AI USD Bot!\n\n' +
        'What can this bot do?\n' +
        'Your Friendly-AI powered Crypto AIUSD Bot. Buy, Sell, Swap, Transfer.\n\n' +
        '📋 Usage Steps:\n' +
        '1. First, set your authentication token\n' +
        '2. Then start chatting\n\n' +
        '💡 Type /token <your_token> to set authentication token\n' +
        '💡 Type /chat <message> to send a message\n' +
        '💡 Type /help for detailed instructions');
    });

    // 处理 /help 命令
    this.bot.help((ctx: Context) => {
      ctx.reply('📖 Usage Instructions:\n\n' +
        '🔑 Set Authentication Token:\n' +
        '• Type /token <your_token>\n' +
        '• Example: /token abc123def456\n\n' +
        '💬 Start Chatting:\n' +
        '• Method 1: Directly send messages to start chatting\n' +
        '• Method 2: Use /chat <message content>\n' +
        '• Example: /chat Hello, help me analyze the market\n' +
        '• Supports both Chinese and English conversations\n\n' +
        '🔧 Other Commands:\n' +
        '• /status - Check current status\n' +
        '• /token - Check current token status\n' +
        '• /start - Start over');
    });

    // 处理 /token 命令
    this.bot.command('token', (ctx: Context) => {
      const userId = ctx.from?.id;
      if (!userId) return;

      const message = ctx.message as any;
      const args = message.text.split(' ').slice(1);
      
      if (args.length === 0) {
        // 显示当前 token 状态
        const currentToken = this.userTokens.get(userId);
        if (currentToken) {
          ctx.reply(`🔑 Current token is set\n\nToken: ${currentToken.substring(0, 8)}...`);
        } else {
          ctx.reply('❌ Authentication token not set yet\n\n💡 Usage: /token <your_token>');
        }
        return;
      }

      const token = args.join(' ');
      if (token.length < 10) {
        ctx.reply('❌ Token is too short, please provide a valid authentication token');
        return;
      }

      // 保存用户的 token
      this.userTokens.set(userId, token);
      ctx.reply(`✅ Authentication token set successfully!\n\nNow you can send messages to start chatting.`);
    });

    // 处理 /status 命令
    this.bot.command('status', (ctx: Context) => {
      const userId = ctx.from?.id;
      if (!userId) return;

      const hasToken = this.userTokens.has(userId);
      const totalUsers = this.userTokens.size;
      
      ctx.reply(`📊 Bot Status Information:\n\n` +
        `👤 Your Status: ${hasToken ? '✅ Token Set' : '❌ Token Not Set'}\n` +
        `👥 Total Users: ${totalUsers}\n` +
        `🌐 API URL: ${this.chatApiUrl}\n\n` +
        `${hasToken ? '💬 You can start chatting now!' : '🔑 Please set authentication token first'}`);
    });

    // 处理 /chat 命令 - 简化版本
    this.bot.command('chat', (ctx: Context) => {
      const userId = ctx.from?.id;
      if (!userId) return;

      const message = ctx.message as any;
      const args = message.text.split(' ').slice(1);
      
      if (args.length === 0) {
        ctx.reply('💬 Usage: /chat <message content>\n\nExample: /chat Hello, help me analyze the market');
        return;
      }

      const userMessage = args.join(' ');
      const userToken = this.userTokens.get(userId);
      
      if (!userToken) {
        ctx.reply('🤖 Welcome to AI USD Bot!\n\n' +
          'What can this bot do?\n' +
          'Your Friendly-AI powered Crypto AIUSD Bot. Buy, Sell, Swap, Transfer.\n\n' +
          '❌ Please set authentication token first\n\n' +
          '💡 Usage: /token <your_token>\n' +
          '💡 Type /help for detailed instructions');
        return;
      }

      // 调用聊天接口
      this.processChatMessage(ctx, userMessage, userToken);
    });

    // 处理所有文本消息
    this.bot.on('text', async (ctx: Context) => {
      const userId = ctx.from?.id;
      if (!userId) return;

      const message = ctx.message as any;
      const userMessage = message.text;

      if (!userMessage) {
        await ctx.reply('❌ Unable to get your message content');
        return;
      }

      // 检查用户是否已设置 token
      const userToken = this.userTokens.get(userId);
      if (!userToken) {
        await ctx.reply('🤖 Welcome to AI USD Bot!\n\n' +
          'What can this bot do?\n' +
          'Your Friendly-AI powered Crypto AIUSD Bot. Buy, Sell, Swap, Transfer.\n\n' +
          '❌ Please set authentication token first to start\n\n' +
          '💡 Usage: /token <your_token>\n' +
          '💡 Type /help for detailed instructions');
        return;
      }

      try {
        // 发送"正在处理"消息
        const processingMsg = await ctx.reply('⏳ Processing your request...');

        // 调用聊天接口
        const response = await this.callChatApi(userMessage, userToken);

        // 删除处理中消息
        await ctx.deleteMessage(processingMsg.message_id);

        // 发送回复
        if (response.success) {
          let replyText = '🤖 AI Reply:\n\n';
          
          if (response.transcript) {
            // 移除所有 ** 加粗标记
            let transcript = response.transcript;
            transcript = transcript.replace(/\*\*/g, '');
            replyText += transcript;
          } else {
            replyText += 'Processing completed, but no specific content was returned.';
          }

          await ctx.reply(replyText);
        } else {
          await ctx.reply(`❌ Processing failed: ${response.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Processing message error:', error);
        await ctx.reply('❌ An error occurred while processing your request, please try again later.');
      }
    });

    // 处理错误
    this.bot.catch((err: any, ctx: Context) => {
      console.error('Bot error:', err);
      ctx.reply('❌ Bot encountered an error, please try again later.');
    });
  }

  private async processChatMessage(ctx: Context, userMessage: string, userToken: string): Promise<void> {
    try {
      // 发送"正在处理"消息
      const processingMsg = await ctx.reply('⏳ Processing your request...');

      // 调用聊天接口
      const response = await this.callChatApi(userMessage, userToken);

      // 删除处理中消息
      await ctx.deleteMessage(processingMsg.message_id);

      // 发送回复
      if (response.success) {
        let replyText = '🤖 AI Reply:\n\n';
        
        if (response.transcript) {
          // 移除所有 ** 加粗标记
          let transcript = response.transcript;
          transcript = transcript.replace(/\*\*/g, '');
          replyText += transcript;
        } else {
          replyText += 'Processing completed, but no specific content was returned.';
        }

        await ctx.reply(replyText);
      } else {
        await ctx.reply(`❌ Processing failed: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Processing message error:', error);
      await ctx.reply('❌ An error occurred while processing your request, please try again later.');
    }
  }

  private async callChatApi(userMessage: string, userToken: string): Promise<ChatApiResponse> {
    try {
      const messages: ChatMessage[] = [
        {
          role: 'user',
          content: userMessage
        }
      ];

      const response = await axios.post(
        this.chatApiUrl,
        { 
          messages,
          auth: userToken
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': userToken.startsWith('Bearer ') ? userToken : `Bearer ${userToken}`
          },
          timeout: 30000 // 30秒超时
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Failed to call chat API:', error);
      
      if (error.response) {
        // 服务器返回了错误响应
        return {
          success: false,
          error: `API error (${error.response.status}): ${error.response.data?.error || error.response.statusText}`
        };
      } else if (error.request) {
        // 请求发送了但没有收到响应
        return {
          success: false,
          error: 'Unable to connect to chat server, please check your network connection'
        };
      } else {
        // 其他错误
        return {
          success: false,
          error: error.message || 'Unknown error'
        };
      }
    }
  }

  public async start(): Promise<void> {
    try {
      await this.bot.launch();
      console.log('🤖 Telegram Bot 启动成功！');
      console.log(`📡 聊天接口: ${this.chatApiUrl}`);
      console.log('🔑 用户需要输入认证 token 才能使用');
      console.log('💡 用户可以使用 /token <token> 命令设置认证 token');
      
      // 优雅关闭
      process.once('SIGINT', () => this.stop('SIGINT'));
      process.once('SIGTERM', () => this.stop('SIGTERM'));
    } catch (error) {
      console.error('启动 Bot 失败:', error);
      process.exit(1);
    }
  }

  private async stop(signal: string): Promise<void> {
    console.log(`\n收到 ${signal} 信号，正在关闭 Bot...`);
    await this.bot.stop(signal);
    console.log('Bot 已关闭');
    process.exit(0);
  }
}

// 启动 Bot
const bot = new TelegramBot();
bot.start().catch((error) => {
  console.error('启动失败:', error);
  process.exit(1);
});
