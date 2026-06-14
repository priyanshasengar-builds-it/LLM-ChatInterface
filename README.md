# LLM Chat

A single-page, streaming chat interface powered by **Groq** running the
open-source **Llama 3.3 70B** model (`llama-3.3-70b-versatile`).

- **Next.js 15 + React 19 + TypeScript** — app router, single-page chat UI.
- **WebSockets** — assistant responses stream token-by-token from the server.
- **TanStack Query** — the send action runs as a mutation, giving clean
  pending / error states for the UI.
- **OpenAI SDK → Groq** — Groq is OpenAI-compatible, so the server uses the
  OpenAI SDK pointed at Groq's base URL and streams chat completions over the
  socket. Swap the model/baseURL/key in `src/server/websocket.ts` to use a
  different provider.

## Architecture

```
Browser (React)                 Custom Node server (server.ts)
┌────────────────────┐          ┌──────────────────────────────────┐
│ ChatInput          │          │ Next.js request handler          │
│ MessageList        │  HTTP    │                                  │
│ useChatSocket ─────┼──ws──────┼─► WebSocketServer (/api/ws)      │
│   (TanStack +      │  stream  │     └─► Groq chat.completions    │
│    reducer state)  │◄─────────┼──── text deltas ◄────────────────│
└────────────────────┘          └──────────────────────────────────┘
```

Next.js can't host a long-lived WebSocket from the app router, so `server.ts`
runs Next and a `ws` server together. The socket server keeps per-connection
conversation history so the model has context across turns.

### Key files

| File | Role |
| --- | --- |
| `server.ts` | Boots Next.js + the WebSocket server on one port. |
| `src/server/websocket.ts` | Receives user messages, streams the model's reply back. |
| `src/hooks/useChatSocket.ts` | Client socket + TanStack mutation + message state. |
| `src/components/*` | Chat shell, message list, bubbles, input. |
| `src/lib/types.ts` | Shared client/server message contracts. |

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Add your API key**

   ```bash
   cp .env.local.example .env.local
   # then edit .env.local and set GROQ_API_KEY
   ```

   Get a **free** key from <https://console.groq.com/keys>.

3. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open <http://localhost:3000>.

## Production

```bash
npm run build
npm run start
```

## States handled

- **Connecting / disconnected** — shown in the header; the socket auto-reconnects.
- **Loading** — a typing indicator + streaming caret while the model responds;
  the input is disabled until the turn completes.
- **Errors** — API/connection failures surface in the relevant message bubble
  and as a banner when the socket drops.

## Notes / possible extensions

- Responses are capped at `max_tokens: 4096` (`src/server/websocket.ts`) for
  snappy chat replies — raise it for longer outputs.
- Try other Groq models by changing `MODEL` in `src/server/websocket.ts`
  (e.g. `llama-3.1-8b-instant` for lower latency). See the list at
  <https://console.groq.com/docs/models>.
- Because the server uses the OpenAI-compatible API, you can point it at any
  compatible provider (OpenRouter, Cerebras, a local Ollama at
  `http://localhost:11434/v1`, etc.) by changing `baseURL`, the key, and `MODEL`.
- Conversation history lives in memory per connection; add a store
  (Redis/Postgres) to persist across reconnects.
