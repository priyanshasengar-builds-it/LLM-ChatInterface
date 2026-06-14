// Shared message contracts between the browser and the WebSocket server.
// Kept free of server-only imports so both sides can use it.

export type Role = "user" | "assistant";

export type MessageStatus = "streaming" | "complete" | "error";

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  status: MessageStatus;
}

/** Sent from browser -> server. */
export type ClientMessage = {
  type: "user_message";
  /** Correlates the request with the assistant message it produces. */
  id: string;
  content: string;
};

/** Sent from server -> browser. */
export type ServerMessage =
  | { type: "chunk"; id: string; content: string }
  | { type: "done"; id: string }
  | { type: "error"; id?: string; message: string };
