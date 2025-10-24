import { AgentSession } from "./agent/AgentSession";
import { ClaudeProvider } from "./agent/providers/ClaudeProvider";
import { OpenAIProvider } from "./agent/providers/OpenAIProvider";
import { RealMCPTransport } from "./mcp/RealMCPTransport";
import { Recorder } from "./utils/recorder";

const MCP_URL = process.env.MCP_URL || "http://127.0.0.1:3000/mcp";
const AUTH_TOKEN = process.env.MCP_AUTH_TOKEN;
console.log(`MCP URL: ${MCP_URL}`);

function buildProvider() {
  const provider = process.env.LLM_PROVIDER || "claude";
  if (provider === "openai") {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY not set");
    return new OpenAIProvider(key);
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");
  return new ClaudeProvider(key);
}

export async function chat(instruction) {
  try {
    const provider = buildProvider();
    const transport = new RealMCPTransport(MCP_URL, AUTH_TOKEN);
    const recorder = new Recorder();
    const session = new AgentSession(provider, transport, recorder, 5);


    console.log(`Executing: ${instruction}`);
    const result = await session.run(instruction);

    const transcript = recorder.transcript();
    console.log("Transaction transcript:", transcript);
    return {
      success: true,
      instruction: instruction,
      roundsUsed: result.roundsUsed,
      maxRoundsReached: result.maxRoundsReached,
      toolCallsCount: result.toolCalls.length,
      transcript: transcript
    };
  } catch (error) {
    console.error("Error executing chat:", error);

    return {
      success: false,
      error: error.message
    };
  }
}

export async function intent_recognition(messages, token) {
  try {
    const provider = buildProvider();
    const transport = new RealMCPTransport(MCP_URL, token);
    const recorder = new Recorder();
    const session = new AgentSession(provider, transport, recorder, 5);


    const result = await session.intent_recognition(messages);

    const transcript = recorder.transcript();
    return {
      success: true,
      roundsUsed: result.roundsUsed,
      maxRoundsReached: result.maxRoundsReached,
      toolCallsCount: result.toolCalls.length,
      transcript: transcript
    };
  } catch (error) {
    console.error("Error executing chat:", error);

    return {
      success: false,
      error: error.message
    };
  }
}


export async function chat_messages(messages, token) {
  try {
    const provider = buildProvider();
    const transport = new RealMCPTransport(MCP_URL, token);
    const recorder = new Recorder();
    const session = new AgentSession(provider, transport, recorder, 5);


    const result = await session.run_message(messages);

    const transcript = recorder.transcript();
    console.log("Transaction transcript:", transcript);
    return {
      success: true,
      roundsUsed: result.roundsUsed,
      maxRoundsReached: result.maxRoundsReached,
      toolCallsCount: result.toolCalls.length,
      transcript: transcript
    };
  } catch (error) {
    console.error("Error executing chat:", error);

    return {
      success: false,
      error: error.message
    };
  }
}
export async function handleWithdrawalRequest(amount, asset = "USDC") {
  try {
    // 检查必要的环境变量
    if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
      throw new Error("Either ANTHROPIC_API_KEY or OPENAI_API_KEY must be set");
    }

    const provider = buildProvider();
    const transport = new RealMCPTransport(MCP_URL, AUTH_TOKEN);
    const recorder = new Recorder();
    const session = new AgentSession(provider, transport, recorder, 5);

    const instruction = `Withdraw ${amount} ${asset} from custody to my wallet`;

    console.log(`Executing: ${instruction}`);
    const result = await session.run(instruction);

    const transcript = recorder.transcript();
    console.log("Transaction transcript:", transcript);

    // 查找提现调用
    const withdrawCall = result.toolCalls.find(tc => tc.name === "genalpha_withdraw_to_wallet");

    const response = {
      success: true,
      instruction: instruction,
      roundsUsed: result.roundsUsed,
      maxRoundsReached: result.maxRoundsReached,
      toolCallsCount: result.toolCalls.length,
      transcript: transcript,
      withdrawal: withdrawCall ? {
        found: true,
        amount: withdrawCall.params?.amount,
        asset: withdrawCall.params?.asset,
        source: withdrawCall.params?.source,
        error: withdrawCall.error,
        result: withdrawCall.result
      } : {
        found: false,
        message: "No withdrawal tool call found in the response"
      }
    };

    return response;

  } catch (error) {
    console.error("Error handling withdrawal request:", error);

    return {
      success: false,
      error: error.message,
      instruction: `Withdraw ${amount} ${asset} from custody to my wallet`
    };
  }
}