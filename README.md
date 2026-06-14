# LLM Chat

A single-page, streaming chat interface powered by **Claude** (`claude-opus-4-8`).

- **Next.js 15 + React 19 + TypeScript** — app router, single-page chat UI.
- **WebSockets** — assistant responses stream token-by-token from the server.
- **TanStack Query** — the send action runs as a mutation, giving clean
  pending / error states for the UI.
- **Anthropic SDK** — `client.messages.stream()` on the server forwards each
  text delta over the socket.

## Architecture

```
Browser (React)                 Custom Node server (server.ts)
┌────────────────────┐          ┌──────────────────────────────────┐
│ ChatInput          │          │ Next.js request handler          │
│ MessageList        │  HTTP    │                                  │
│ useChatSocket ─────┼──ws──────┼─► WebSocketServer (/api/ws)      │
│   (TanStack +      │  stream  │     └─► Anthropic messages.stream│
│    reducer state)  │◄─────────┼──── text deltas ◄────────────────│
└────────────────────┘          └──────────────────────────────────┘
```

Next.js can't host a long-lived WebSocket from the app router, so `server.ts`
runs Next and a `ws` server together. The socket server keeps per-connection
conversation history so Claude has context across turns.

### Key files

| File | Role |
| --- | --- |
| `server.ts` | Boots Next.js + the WebSocket server on one port. |
| `src/server/websocket.ts` | Receives user messages, streams Claude's reply back. |
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
   # then edit .env.local and set ANTHROPIC_API_KEY
   ```

   Get a key from <https://console.anthropic.com/>.

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
- **Loading** — a typing indicator + streaming caret while Claude responds;
  the input is disabled until the turn completes.
- **Errors** — API/connection failures surface in the relevant message bubble
  and as a banner when the socket drops.

## Notes / possible extensions

- Responses are capped at `max_tokens: 4096` (`src/server/websocket.ts`) for
  snappy chat replies — raise it for longer outputs.
- To show Claude's reasoning, enable adaptive thinking on the stream
  (`thinking: { type: "adaptive", display: "summarized" }`) and forward
  `thinking` deltas as a separate message type.
- Conversation history lives in memory per connection; add a store
  (Redis/Postgres) to persist across reconnects.
