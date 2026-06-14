"use client";

import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { ChatMessage, ClientMessage, ServerMessage } from "@/lib/types";

export type ConnectionStatus = "connecting" | "open" | "closed";

type Action =
  | { type: "user"; message: ChatMessage }
  | { type: "assistant-start"; id: string }
  | { type: "chunk"; id: string; content: string }
  | { type: "done"; id: string }
  | { type: "error"; id: string; message: string };

function messagesReducer(state: ChatMessage[], action: Action): ChatMessage[] {
  switch (action.type) {
    case "user":
      return [...state, action.message];
    case "assistant-start":
      return [
        ...state,
        { id: action.id, role: "assistant", content: "", status: "streaming" },
      ];
    case "chunk":
      return state.map((m) =>
        m.id === action.id ? { ...m, content: m.content + action.content } : m,
      );
    case "done":
      return state.map((m) =>
        m.id === action.id ? { ...m, status: "complete" } : m,
      );
    case "error":
      return state.map((m) =>
        m.id === action.id
          ? {
              ...m,
              status: "error",
              content: m.content || action.message,
            }
          : m,
      );
    default:
      return state;
  }
}

function wsUrl(): string {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${window.location.host}/api/ws`;
}

export function useChatSocket() {
  const [messages, dispatch] = useReducer(messagesReducer, []);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");

  const wsRef = useRef<WebSocket | null>(null);
  // Tracks in-flight requests so a server `done`/`error` can settle the mutation.
  const pending = useRef(
    new Map<string, { resolve: () => void; reject: (e: Error) => void }>(),
  );
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let closedByUnmount = false;

    const connect = () => {
      setStatus("connecting");
      const ws = new WebSocket(wsUrl());
      wsRef.current = ws;

      ws.onopen = () => setStatus("open");

      ws.onmessage = (event) => {
        let msg: ServerMessage;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }

        switch (msg.type) {
          case "chunk":
            dispatch({ type: "chunk", id: msg.id, content: msg.content });
            break;
          case "done":
            dispatch({ type: "done", id: msg.id });
            pending.current.get(msg.id)?.resolve();
            pending.current.delete(msg.id);
            break;
          case "error": {
            const id = msg.id;
            if (id) {
              dispatch({ type: "error", id, message: msg.message });
              pending.current.get(id)?.reject(new Error(msg.message));
              pending.current.delete(id);
            }
            break;
          }
        }
      };

      ws.onclose = () => {
        setStatus("closed");
        // Fail any outstanding requests so the UI doesn't hang.
        pending.current.forEach(({ reject }) =>
          reject(new Error("Connection closed.")),
        );
        pending.current.clear();

        if (!closedByUnmount) {
          reconnectTimer.current = setTimeout(connect, 1500);
        }
      };

      ws.onerror = () => ws.close();
    };

    connect();

    return () => {
      closedByUnmount = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, []);

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      new Promise<void>((resolve, reject) => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== ws.OPEN) {
          reject(new Error("Not connected to the server."));
          return;
        }

        const id = crypto.randomUUID();
        dispatch({
          type: "user",
          message: {
            id: crypto.randomUUID(),
            role: "user",
            content,
            status: "complete",
          },
        });
        dispatch({ type: "assistant-start", id });
        pending.current.set(id, { resolve, reject });

        const payload: ClientMessage = { type: "user_message", id, content };
        ws.send(JSON.stringify(payload));
      }),
  });

  const sendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || sendMutation.isPending || status !== "open") return;
      // Swallow rejection here; the error surfaces via the message bubble.
      sendMutation.mutate(trimmed);
    },
    [sendMutation, status],
  );

  return {
    messages,
    status,
    sendMessage,
    isResponding: sendMutation.isPending,
    canSend: status === "open" && !sendMutation.isPending,
  };
}
