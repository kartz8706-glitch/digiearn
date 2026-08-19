export type Message = {
  id: string;
  from: "Admin" | "User";
  recipient: string;
  subject: string;
  body: string;
  createdAt: string;
  read: boolean;
};

import { mirrorToDatabase } from "@/lib/firebaseData";

export const messageStateEvent = "message-state-changed";
const messagesKey = "digi-earn-messages-v2";
const defaultMessages: Message[] = [];

function read<T>(fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const stored = window.localStorage.getItem(messagesKey);
  if (!stored) return fallback;

  try {
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
}

function write(messages: Message[]) {
  window.localStorage.setItem(messagesKey, JSON.stringify(messages));
  mirrorToDatabase("messages", messages);
  window.dispatchEvent(new Event(messageStateEvent));
}

export function readMessages() {
  return read<Message[]>(defaultMessages);
}

export function readUserMessages() {
  return readMessages().filter(
    (message) => message.recipient === "Digi User" || message.recipient === "All Users"
  );
}

export function readUnreadUserMessages() {
  return readUserMessages().filter((message) => !message.read);
}

export function readAdminMessages() {
  return readMessages().filter((message) => message.recipient === "Admin");
}

export function sendAdminMessage(recipient: string, subject: string, body: string) {
  write([
    ...readMessages(),
    {
      id: `message-${Date.now()}`,
      from: "Admin",
      recipient,
      subject,
      body,
      createdAt: "Just now",
      read: false,
    },
  ]);
}

export function sendUserMessage(subject: string, body: string) {
  write([
    ...readMessages(),
    {
      id: `message-${Date.now()}`,
      from: "User",
      recipient: "Admin",
      subject,
      body,
      createdAt: "Just now",
      read: false,
    },
  ]);
}

export function markMessageRead(id: string) {
  write(
    readMessages().map((message) =>
      message.id === id ? { ...message, read: true } : message
    )
  );
}
