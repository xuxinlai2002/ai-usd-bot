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
      
      ctx.reply('🤖 欢迎使用 AI USD Bot！\n\n' +
        '📋 使用步骤：\n' +
        '1. 首先设置您的认证 token\n' +
        '2. 然后发送消息开始对话\n\n' +
        '💡 输入 /token <your_token> 来设置认证 token\n' +
        '💡 输入 /help 查看详细说明');
    });

    // 处理 /help 命令
    this.bot.help((ctx: Context) => {
      ctx.reply('📖 使用说明：\n\n' +
        '🔑 设置认证 token：\n' +
        '• 输入 /token <your_token>\n' +
        '• 例如：/token abc123def456\n\n' +
        '💬 开始对话：\n' +
        '• 设置 token 后，直接发送消息与我对话\n' +
        '• 我会调用 AI 接口处理您的请求\n' +
        '• 支持中文和英文对话\n\n' +
        '🔧 其他命令：\n' +
        '• /status - 查看当前状态\n' +
        '• /token - 查看当前 token 状态\n' +
        '• /start - 重新开始');
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
          ctx.reply(`🔑 当前 token 已设置\n\nToken: ${currentToken.substring(0, 8)}...`);
        } else {
          ctx.reply('❌ 尚未设置认证 token\n\n💡 使用方法：/token <your_token>');
        }
        return;
      }

      const token = args.join(' ');
      if (token.length < 10) {
        ctx.reply('❌ Token 太短，请提供有效的认证 token');
        return;
      }

      // 保存用户的 token
      this.userTokens.set(userId, token);
      ctx.reply(`✅ 认证 token 设置成功！\n\n现在您可以发送消息开始对话了。`);
    });

    // 处理 /status 命令
    this.bot.command('status', (ctx: Context) => {
      const userId = ctx.from?.id;
      if (!userId) return;

      const hasToken = this.userTokens.has(userId);
      const totalUsers = this.userTokens.size;
      
      ctx.reply(`📊 Bot 状态信息：\n\n` +
        `👤 您的状态：${hasToken ? '✅ 已设置 token' : '❌ 未设置 token'}\n` +
        `👥 总用户数：${totalUsers}\n` +
        `🌐 API 地址：${this.chatApiUrl}\n\n` +
        `${hasToken ? '💬 您可以开始对话了！' : '🔑 请先设置认证 token'}`);
    });

    // 处理所有文本消息
    this.bot.on('text', async (ctx: Context) => {
      const userId = ctx.from?.id;
      if (!userId) return;

      const message = ctx.message as any;
      const userMessage = message.text;

      if (!userMessage) {
        await ctx.reply('❌ 无法获取您的消息内容');
        return;
      }

      // 检查用户是否已设置 token
      const userToken = this.userTokens.get(userId);
      if (!userToken) {
        await ctx.reply('❌ 请先设置认证 token\n\n💡 使用方法：/token <your_token>\n💡 输入 /help 查看详细说明');
        return;
      }

      try {
        // 发送"正在处理"消息
        const processingMsg = await ctx.reply('⏳ 正在处理您的请求...');

        // 调用聊天接口
        const response = await this.callChatApi(userMessage, userToken);

        // 删除处理中消息
        await ctx.deleteMessage(processingMsg.message_id);

        // 发送回复
        if (response.success) {
          let replyText = '🤖 AI 回复：\n\n';
          
          if (response.transcript) {
            replyText += response.transcript;
          } else {
            replyText += '处理完成，但没有返回具体内容。';
          }

          // 添加处理信息
          if (response.roundsUsed) {
            replyText += `\n\n📊 处理轮次: ${response.roundsUsed}`;
          }
          if (response.toolCallsCount) {
            replyText += `\n🔧 工具调用次数: ${response.toolCallsCount}`;
          }

          await ctx.reply(replyText);
        } else {
          await ctx.reply(`❌ 处理失败：${response.error || '未知错误'}`);
        }
      } catch (error) {
        console.error('处理消息时出错:', error);
        await ctx.reply('❌ 处理您的请求时发生错误，请稍后重试。');
      }
    });

    // 处理错误
    this.bot.catch((err: any, ctx: Context) => {
      console.error('Bot 错误:', err);
      ctx.reply('❌ 机器人发生错误，请稍后重试。');
    });
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
            'Authorization': `Bearer ${userToken}`
          },
          timeout: 30000 // 30秒超时
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('调用聊天接口失败:', error);
      
      if (error.response) {
        // 服务器返回了错误响应
        return {
          success: false,
          error: `API 错误 (${error.response.status}): ${error.response.data?.error || error.response.statusText}`
        };
      } else if (error.request) {
        // 请求发送了但没有收到响应
        return {
          success: false,
          error: '无法连接到聊天服务器，请检查网络连接'
        };
      } else {
        // 其他错误
        return {
          success: false,
          error: error.message || '未知错误'
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
