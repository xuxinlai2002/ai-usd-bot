import { Telegraf, Context } from 'telegraf';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

class TestTelegramBot {
  private bot: Telegraf;

  constructor() {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN 环境变量未设置');
    }

    this.bot = new Telegraf(botToken);
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // 处理 /start 命令
    this.bot.start((ctx: Context) => {
      ctx.reply('🤖 测试 Bot 启动成功！\n\n这是一个测试版本，用于验证 Bot 基本功能。');
    });

    // 处理所有文本消息
    this.bot.on('text', async (ctx: Context) => {
      const message = ctx.message as any;
      const userMessage = message.text;

      if (!userMessage) {
        await ctx.reply('❌ 无法获取您的消息内容');
        return;
      }

      // 模拟 API 调用
      await ctx.reply('⏳ 正在处理您的请求...');
      
      // 模拟处理时间
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 返回模拟回复
      await ctx.reply(`🤖 模拟回复：\n\n您发送的消息是："${userMessage}"\n\n这是一个测试回复，实际的 AI 接口调用功能需要配置正确的 API Token。`);
    });

    // 处理错误
    this.bot.catch((err: any, ctx: Context) => {
      console.error('Bot 错误:', err);
      ctx.reply('❌ 机器人发生错误，请稍后重试。');
    });
  }

  public async start(): Promise<void> {
    try {
      await this.bot.launch();
      console.log('🤖 测试 Telegram Bot 启动成功！');
      console.log('📱 请在 Telegram 中测试 Bot 功能');
      
      // 优雅关闭
      process.once('SIGINT', () => this.stop('SIGINT'));
      process.once('SIGTERM', () => this.stop('SIGTERM'));
    } catch (error) {
      console.error('启动测试 Bot 失败:', error);
      process.exit(1);
    }
  }

  private async stop(signal: string): Promise<void> {
    console.log(`\n收到 ${signal} 信号，正在关闭测试 Bot...`);
    await this.bot.stop(signal);
    console.log('测试 Bot 已关闭');
    process.exit(0);
  }
}

// 启动测试 Bot
const testBot = new TestTelegramBot();
testBot.start().catch((error) => {
  console.error('启动失败:', error);
  process.exit(1);
});
