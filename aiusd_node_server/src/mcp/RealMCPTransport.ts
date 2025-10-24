import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

export interface MCPTransport {
  listTools(): Promise<any[]>;
  callTool(name: string, params: Record<string, unknown>): Promise<any>;
}

export class RealMCPTransport implements MCPTransport {
  private clientPromise?: Promise<Client>;

  constructor(private url: string, private authToken?: string) {}

  private async connect(): Promise<Client> {
    if (!this.clientPromise) {
      this.clientPromise = (async () => {
        const transport = new StreamableHTTPClientTransport(new URL(this.url), {
          requestInit: this.authToken
            ? { headers: { Authorization: `Bearer ${this.authToken}` } }
            : undefined,
        });

        const client = new Client({
          name: "mcp-hub-e2e-agent",
          version: "0.1.0",
        });

        await client.connect(transport);
        return client;
      })();
    }

    return this.clientPromise;
  }

  async listTools(): Promise<any[]> {
    const client = await this.connect();
    const result = await client.listTools();

    // Convert MCP tool format to Claude format
    return result.tools.map((tool: any) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema,
    }));
  }

  async callTool(name: string, params: Record<string, unknown>): Promise<any> {
    const client = await this.connect();
    const result = await client.callTool({ name, arguments: params });

    if (result.structuredContent) {
      return result.structuredContent;
    }

    if (Array.isArray(result.content)) {
      const firstTextBlock = result.content.find(
        (block: any) => block?.type === "text" && typeof block.text === "string",
      );

      if (firstTextBlock) {
        try {
          return JSON.parse(firstTextBlock.text as string);
        } catch {
          return firstTextBlock.text;
        }
      }
    }

    return result;
  }
}
