import type { MCPTransport } from "../mcp/RealMCPTransport";
import type { LLMProvider, LLMResponse } from "./providers/types";
import { Recorder } from "../utils/recorder";

export interface ToolCall {
  name: string;
  params: Record<string, unknown>;
  arguments?: Record<string, unknown>; // Alias for params for compatibility
  result?: any;
  error?: string;
}

export interface RunResult {
  final: string;
  toolCalls: ToolCall[];
  roundsUsed: number;
  maxRoundsReached?: boolean;
}

function convertToolsToOpenAIFormat(mcpTools: any[]) {
  return mcpTools.map(tool => {
    const openAITool = {
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description || ""
      }
    };

    if (tool.input_schema) {
      openAITool.function.parameters = convertInputSchemaToParameters(tool.input_schema);
    } else {
      openAITool.function.parameters = {
        type: "object",
        properties: {},
        required: []
      };
    }

    return openAITool;
  });
}

function convertInputSchemaToParameters(inputSchema: any) {
  const parameters = {
    type: "object",
    properties: {} as Record<string, any>,
    required: [] as string[]
  };

  if (inputSchema.properties) {
    for (const [key, prop] of Object.entries(inputSchema.properties)) {
      const property: any = {
        type: (prop as any).type || "string",
        description: (prop as any).description || ""
      };

      if ((prop as any).enum) {
        property.enum = (prop as any).enum;
      }

      if ((prop as any).type === "object" && (prop as any).properties) {
        property.properties = (prop as any).properties;
      }

      if ((prop as any).type === "array" && (prop as any).items) {
        property.items = (prop as any).items;
      }

      parameters.properties[key] = property;
    }
  }

  if (inputSchema.required) {
    parameters.required = inputSchema.required;
  }

  return parameters;
}

export class AgentSession {
  private recorder?: Recorder;
  constructor(
    private provider: LLMProvider,
    private transport: MCPTransport,
    recorder?: Recorder,
    private maxRounds?: number,
  ) {
    this.recorder = recorder;
  }

  async run(prompt: string): Promise<RunResult> {
    const mcp_tools = await this.transport.listTools();
    const tools = convertToolsToOpenAIFormat(mcp_tools);
    const messages: any[] = [{ role: "user", content: prompt }];
    const toolCalls: ToolCall[] = [];
    let roundsUsed = 0;

    while (true) {
      if (this.maxRounds && roundsUsed >= this.maxRounds) {
        const maxRoundsMessage = `Maximum rounds (${this.maxRounds}) reached. Completed ${toolCalls.length} tool calls. Unable to complete the request within the round limit.`;
        this.recorder?.log(`System> ${maxRoundsMessage}`);
        return {
          final: maxRoundsMessage,
          toolCalls,
          roundsUsed,
          maxRoundsReached: true
        };
      }

      const response: LLMResponse = await this.provider.generate(messages, tools);
      roundsUsed++;
      console.log("response is ", response);

      if (response.type === "message") {
        this.recorder?.log(`${response.text}`);
        return {
          final: response.text,
          toolCalls,
          roundsUsed
        };
      }

      // OpenAI格式的工具调用处理

      const toolCall: ToolCall = {
        name: response.name,
        params: response.params,
        arguments: response.params,
      };

      // 对于OpenAI，我们需要将工具调用添加到消息中
      messages.push({
        role: "assistant",
        content: null,
        tool_calls: [
          {
            id: response.id,
            type: "function",
            function: {
              name: response.name,
              arguments: JSON.stringify(response.params)
            }
          }
        ]
      });

      try {
        const result = await this.transport.callTool(response.name, response.params);
        toolCall.result = result;

        // 添加工具执行结果到消息
        messages.push({
          role: "tool",
          tool_call_id: response.id,
          content: JSON.stringify(result)
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        toolCall.error = errorMessage;

        messages.push({
          role: "tool",
          tool_call_id: response.id,
          content: JSON.stringify({ error: errorMessage })
        });
      }

      toolCalls.push(toolCall);
    }
  }

  async run_message(messages: any[]): Promise<RunResult> {
    const mcp_tools = await this.transport.listTools();
    const tools = convertToolsToOpenAIFormat(mcp_tools);
    // const messages: any[] = [{ role: "user", content: prompt }];
    const toolCalls: ToolCall[] = [];
    let roundsUsed = 0;
    const hasSystemMessage = messages.some(msg => msg.role === "system");
    if (!hasSystemMessage) {
      const systemPrompt = `你是一个专业的AI助手，专门帮助用户进行加密货币交易和资产管理。
请根据用户的需求，使用可用的工具来帮助他们完成操作。如果用户的问题需要多个步骤，请逐步执行。最后在聊天的结尾给出用户一定的下一步意图的预测`;

      // 在消息数组的开头插入system消息
      messages.unshift({
        role: "system",
        content: systemPrompt
      });

    } else {
      console.log("消息中已包含system消息，无需添加");
    }
    while (true) {
      if (this.maxRounds && roundsUsed >= this.maxRounds) {
        const maxRoundsMessage = `Maximum rounds (${this.maxRounds}) reached. Completed ${toolCalls.length} tool calls. Unable to complete the request within the round limit.`;
        // this.recorder?.log(`System> ${maxRoundsMessage}`);
        return {
          final: maxRoundsMessage,
          toolCalls,
          roundsUsed,
          maxRoundsReached: true
        };
      }
      const response: LLMResponse = await this.provider.generate(messages, tools);
      roundsUsed++;
      console.log("response is ", response);

      if (response.type === "message") {
        this.recorder?.log(`${response.text}`);
        return {
          final: response.text,
          toolCalls,
          roundsUsed
        };
      }

      // OpenAI格式的工具调用处理

      const toolCall: ToolCall = {
        name: response.name,
        params: response.params,
        arguments: response.params,
      };

      // 对于OpenAI，我们需要将工具调用添加到消息中
      messages.push({
        role: "assistant",
        content: null,
        tool_calls: [
          {
            id: response.id,
            type: "function",
            function: {
              name: response.name,
              arguments: JSON.stringify(response.params)
            }
          }
        ]
      });

      try {
        const result = await this.transport.callTool(response.name, response.params);
        toolCall.result = result;

        // 添加工具执行结果到消息
        messages.push({
          role: "tool",
          tool_call_id: response.id,
          content: JSON.stringify(result)
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        // this.recorder?.log(`MCP< Error: ${errorMessage}`);
        toolCall.error = errorMessage;

        messages.push({
          role: "tool",
          tool_call_id: response.id,
          content: JSON.stringify({ error: errorMessage })
        });
      }

      toolCalls.push(toolCall);
    }
  }

  async intent_recognition(messages: any[]): Promise<RunResult> {
    const toolCalls: ToolCall[] = [];
    let roundsUsed = 0;
    const hasSystemMessage = messages.some(msg => msg.role === "system");
    if (!hasSystemMessage) {
      const systemPrompt = `你是一个意图识别专家，分析聊天内容，预测3到5条，将预测内容存到一个数组中，并以json格式返回，例如：["买入比特币","卖出以太坊"] ，不要做任何额外解释`;

      // 在消息数组的开头插入system消息
      messages.unshift({
        role: "system",
        content: systemPrompt
      });

    } else {
      console.log("消息中已包含system消息，无需添加");
    }
    while (true) {
      if (this.maxRounds && roundsUsed >= this.maxRounds) {
        const maxRoundsMessage = `Maximum rounds (${this.maxRounds}) reached. Completed ${toolCalls.length} tool calls. Unable to complete the request within the round limit.`;
        // this.recorder?.log(`System> ${maxRoundsMessage}`);
        return {
          final: maxRoundsMessage,
          toolCalls,
          roundsUsed,
          maxRoundsReached: true
        };
      }
      const response: LLMResponse = await this.provider.generate(messages, []);
      roundsUsed++;

      if (response.type === "message") {
        try {
          const parsedText = JSON.parse(response.text);
          this.recorder?.log(Array.isArray(parsedText) ? parsedText : [parsedText]);
        } catch (e) {
          this.recorder?.log([response.text]);
        }
        return {
          final: response.text,
          toolCalls,
          roundsUsed
        };
      }

      // OpenAI格式的工具调用处理

      const toolCall: ToolCall = {
        name: response.name,
        params: response.params,
        arguments: response.params,
      };

      // 对于OpenAI，我们需要将工具调用添加到消息中
      messages.push({
        role: "assistant",
        content: null,
        tool_calls: [
          {
            id: response.id,
            type: "function",
            function: {
              name: response.name,
              arguments: JSON.stringify(response.params)
            }
          }
        ]
      });

      try {
        const result = await this.transport.callTool(response.name, response.params);
        toolCall.result = result;

        // 添加工具执行结果到消息
        messages.push({
          role: "tool",
          tool_call_id: response.id,
          content: JSON.stringify(result)
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        // this.recorder?.log(`MCP< Error: ${errorMessage}`);
        toolCall.error = errorMessage;

        messages.push({
          role: "tool",
          tool_call_id: response.id,
          content: JSON.stringify({ error: errorMessage })
        });
      }

      toolCalls.push(toolCall);
    }
  }
}


