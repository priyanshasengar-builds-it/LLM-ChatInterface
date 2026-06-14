"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/types";
import { MessageBubble } from "./MessageBubble";

interface Props {
  messages: ChatMessage[];
  isResponding: boolean;
}

export function MessageList({ messages, isResponding }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  // Keep the latest message (and streaming tokens) in view.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isResponding]);

  if (messages.length === 0) {
    return (
      <div className="messages messages--empty">
        <p>Ask me anything to get started.</p>
      </div>
    );
  }

  return (
    <div className="messages">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      <div ref={endRef} />
    </div>
  );
}
