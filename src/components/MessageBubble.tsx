"use client";

import type { ChatMessage } from "@/lib/types";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const { role, content, status } = message;
  const isStreaming = status === "streaming";

  return (
    <div className={`bubble bubble--${role} bubble--${status}`}>
      <div className="bubble__role">{role === "user" ? "You" : "Assistant"}</div>
      <div className="bubble__content">
        {content}
        {/* While an empty assistant message streams, show a typing indicator. */}
        {isStreaming && content.length === 0 && (
          <span className="typing" aria-label="Assistant is typing">
            <span />
            <span />
            <span />
          </span>
        )}
        {isStreaming && content.length > 0 && <span className="caret" />}
      </div>
    </div>
  );
}
