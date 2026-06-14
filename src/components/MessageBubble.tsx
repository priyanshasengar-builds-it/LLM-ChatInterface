"use client";

import type { ChatMessage } from "@/lib/types";

// Avatar initials. Change USER_INITIALS to your own (e.g. "PS").
const USER_INITIALS = "U";
const AI_INITIALS = "AI";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const { role, content, status } = message;
  const isUser = role === "user";
  const isStreaming = status === "streaming";

  return (
    <div className={`row row--${role}`}>
      <div className={`avatar avatar--${role}`} aria-hidden>
        {isUser ? USER_INITIALS : AI_INITIALS}
      </div>
      <div className={`bubble bubble--${role} bubble--${status}`}>
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
    </div>
  );
}
