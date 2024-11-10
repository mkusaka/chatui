// src/types.d.ts
export interface Message {
  role: "system" | "user" | "assistant";
  text: string;
}
