export interface LLMResponseMessage {
  type: "message";
  text: string;
}

export interface LLMResponseTool {
  type: "tool";
  name: string;
  id: string;
  params: Record<string, unknown>;
}

export type LLMResponse = LLMResponseMessage | LLMResponseTool;

export interface LLMProvider {
  generate(
    messages: any[],
    tools?: any[],
  ): Promise<LLMResponse>;
}


