import type { LLMProvider, LLMResponse } from "./types";

export class OpenAIProvider implements LLMProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = "gpt-4o-mini") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generate(messages: any[], tools: any[] = []): Promise<LLMResponse> {

    const requestBody: any = {
      model: this.model,
      messages: messages,
    };

    // 只有在有工具的情况下才添加tools字段
    if (tools && tools.length > 0) {
      requestBody.tools = tools;
      requestBody.tool_choice = "auto";
    }

    const res = await fetch("https://aihubmix.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });


    if (!res.ok) {
      const errorText = await res.text();
      console.error("API请求失败:", res.status, errorText);
      throw new Error(`API请求失败: ${res.status} ${errorText}`);
    }

    const data: any = await res.json();

    const choice = data?.choices?.[0];
    if (!choice) {
      throw new Error("No content from OpenAI");
    }

    const msg = choice.message;

    // 检查是否有工具调用
    if (msg.tool_calls && msg.tool_calls.length > 0) {
      const tool = msg.tool_calls[0];
      try {
        const params = tool.function.arguments ? JSON.parse(tool.function.arguments) : {};
        return {
          type: "tool_call",  // 注意：这里应该是 "tool_call" 而不是 "tool"
          name: tool.function.name,
          id: tool.id,
          params: params,
        };
      } catch (error) {
        throw new Error(`解析工具参数失败: ${error}`);
      }
    }

    // 返回普通消息
    return {
      type: "message",
      text: msg.content || ""
    };
  }
}