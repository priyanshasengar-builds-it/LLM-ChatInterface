import Anthropic from "@anthropic-ai/sdk";
import type { WebSocket, WebSocketServer } from "ws";
import type { ClientMessage, ServerMessage } from "../lib/types";

const MODEL = "claude-opus-4-8";
const MAX_TOKENS = 4096; // Chat replies are short and latency-sensitive; keep this modest.
const SYSTEM_PROMPT =
  "You are a helpful, friendly assistant. Answer clearly and concisely.";

// Lazily constructed so the Anthropic client picks up ANTHROPIC_API_KEY after
// the server has loaded environment files (see server.ts).
let client: Anthropic | null = null;
function getClient(): Anthropic {
  return (client ??= new Anthropic());
}

function send(ws: WebSocket, message: ServerMessage): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

export function attachChatHandler(wss: WebSocketServer): void {
  wss.on("connection", (ws: WebSocket) => {
    // Per-connection conversation history gives Claude context across turns.
    const history: Anthropic.MessageParam[] = [];
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
        const stream = getClient().messages.stream({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: SYSTEM_PROMPT,
          messages: history,
        });

        // Forward each token delta to the browser as it arrives.
        stream.on("text", (delta) => {
          send(ws, { type: "chunk", id: msg.id, content: delta });
        });

        const final = await stream.finalMessage();
        const text = final.content
          .filter((block): block is Anthropic.TextBlock => block.type === "text")
          .map((block) => block.text)
          .join("");

        history.push({ role: "assistant", content: text });
        send(ws, { type: "done", id: msg.id });
      } catch (err) {
        // Roll back the user turn so the failed exchange doesn't poison context.
        history.pop();
        const message =
          err instanceof Anthropic.APIError
            ? `Anthropic API error (${err.status ?? "unknown"}): ${err.message}`
            : "Something went wrong while generating a response.";
        console.error("[chat] generation failed:", err);
        send(ws, { type: "error", id: msg.id, message });
      } finally {
        busy = false;
      }
    });
  });
}
