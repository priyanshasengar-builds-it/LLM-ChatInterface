"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";

interface Props {
  onSend: (content: string) => void;
  /** True when sending isn't currently possible (disconnected or responding). */
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // The button is always enabled and always looks active — no `disabled`
  // attribute and no greyed-out state. We just handle the edge cases on submit.
  const submit = () => {
    if (value.trim().length === 0) {
      // Nothing to send — guide the user to the input instead of failing silently.
      textareaRef.current?.focus();
      return;
    }
    if (disabled) return; // disconnected or already responding — safely no-op
    onSend(value);
    setValue("");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };

  // Enter sends; Shift+Enter inserts a newline.
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <textarea
        ref={textareaRef}
        className="composer__input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message…"
        rows={1}
        aria-label="Message"
      />
      <button type="submit" className="composer__send">
        Send
      </button>
    </form>
  );
}
