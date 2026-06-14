"use client";

import { useChatSocket } from "@/hooks/useChatSocket";
import { ChatInput } from "./ChatInput";
import { MessageList } from "./MessageList";

const STATUS_LABEL: Record<string, string> = {
  connecting: "Connecting…",
  open: "Connected",
  closed: "Disconnected — retrying…",
};

export function Chat() {
  const { messages, status, sendMessage, isResponding, canSend } =
    useChatSocket();

  return (
    <main className="chat">
      <header className="chat__header">
        <h1>LLM Chat</h1>
        <span className={`status status--${status}`}>
          <span className="status__dot" aria-hidden />
          {STATUS_LABEL[status]}
        </span>
      </header>

      {status === "closed" && (
        <div className="banner banner--error" role="alert">
          Lost connection to the server. Trying to reconnect…
        </div>
      )}

      <MessageList messages={messages} isResponding={isResponding} />

      <ChatInput onSend={sendMessage} disabled={!canSend} />
    </main>
  );
}
