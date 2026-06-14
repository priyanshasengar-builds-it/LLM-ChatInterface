import OpenAI from "openai";
import type { WebSocket, WebSocketServer } from "ws";
import type { ClientMessage, ServerMessage } from "../lib/types";

// Groq exposes an OpenAI-compatible API, so we use the OpenAI SDK pointed at
// Groq's base URL. Swap MODEL / baseURL / key to move to another provider.
const MODEL = "llama-3.3-70b-versatile";
const MAX_TOKENS = 4096; // Chat replies are short and latency-sensitive; keep this modest.
const SYSTEM_PROMPT =
  "You are a helpful, friendly assistant. Answer clearly and concisely.";

// Lazily constructed so the client picks up GROQ_API_KEY after the server has
// loaded environment files (see server.ts).
let client: OpenAI | null = null;
function getClient(): OpenAI {
  return (client ??= new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  }));
}

function send(ws: WebSocket, message: ServerMessage): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

export function attachChatHandler(wss: WebSocketServer): void {
  wss.on("connection", (ws: WebSocket) => {
    // Per-connection conversation history gives the model context across turns.
    const history: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];
    // Guard so one connection only runs one generation at a time.
    let busy = false;

    ws.on("message", async (raw) => {
      let msg: ClientMessage;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        send(ws, { type: "error", message: "Could not parse message." });
        return;
      }

      if (msg.type !== "user_message" || typeof msg.content !== "string") {
        return;
      }

      if (busy) {
        send(ws, {
          type: "error",
          id: msg.id,
          message: "Still answering the previous message — please wait.",
        });
        return;
      }

      busy = true;
      history.push({ role: "user", content: msg.content });

      try {
        const stream = await getClient().chat.completions.create({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          messages: history,
          stream: true,
        });

        // Forward each token delta to the browser as it arrives.
        let answer = "";
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            answer += delta;
            send(ws, { type: "chunk", id: msg.id, content: delta });
          }
        }

        history.push({ role: "assistant", content: answer });
        send(ws, { type: "done", id: msg.id });
      } catch (err) {
        // Roll back the user turn so the failed exchange doesn't poison context.
        history.pop();
        const message =
          err instanceof OpenAI.APIError
            ? `Groq API error (${err.status ?? "unknown"}): ${err.message}`
            : "Something went wrong while generating a response.";
        console.error("[chat] generation failed:", err);
        send(ws, { type: "error", id: msg.id, message });
      } finally {
        busy = false;
      }
    });
  });
}
