import type { LLMProvider, LLMResponse } from "./types";

export class ClaudeProvider implements LLMProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = "claude-3-5-haiku-latest") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generate(messages: any[], tools: any[] = []): Promise<LLMResponse> {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1024,
        messages,
        tools,
      }),
    });

    const data: any = await res.json();

    if (!res.ok) {
      throw new Error(`Claude API error: ${res.status} ${res.statusText} - ${JSON.stringify(data)}`);
    }

    const content = data?.content;
    if (!content || !Array.isArray(content) || content.length === 0) {
      throw new Error(`No content from Claude. Response: ${JSON.stringify(data)}`);
    }

    // Look for tool_use block first (prioritize tool calls)
    const toolUseBlock = content.find((block: any) => block.type === "tool_use");
    if (toolUseBlock) {
      return {
        type: "tool",
        name: toolUseBlock.name,
        id: toolUseBlock.id,
        params: toolUseBlock.input || {},
      };
    }

    // Fall back to text blocks
    const textBlock = content.find((block: any) => block.type === "text");
    if (textBlock) {
      return { type: "message", text: textBlock.text };
    }

    throw new Error(`No supported content blocks found. Content: ${JSON.stringify(content)}`);
  }
}
