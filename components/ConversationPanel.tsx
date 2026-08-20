"use client";

import { MessageCircle, Send } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import {
  sendConversationMessage,
  subscribeToConversation,
  type ConversationMessage,
  type ConversationRole,
} from "@/lib/conversationStore";

type ConversationPanelProps = {
  userId: string;
  currentUserId: string;
  currentUserName: string;
  currentRole: ConversationRole;
  heading: string;
  description: string;
};

export default function ConversationPanel({
  userId,
  currentUserId,
  currentUserName,
  currentRole,
  heading,
  description,
}: ConversationPanelProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setMessages([]);
    setError("");
    return subscribeToConversation(userId, setMessages, () => {
      setError("Messages could not be loaded. Check Firebase permissions.");
    });
  }, [userId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    try {
      setError("");
      await sendConversationMessage({
        userId,
        senderId: currentUserId,
        senderName: currentUserName,
        senderRole: currentRole,
        text,
      });
      setDraft("");
    } catch {
      setError("Your message could not be sent. Check Firebase permissions.");
    }
  }

  return (
    <section className="surface lift-on-hover overflow-hidden rounded-2xl">
      <div className="border-b border-[#1c3026] p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-[#43e58c]/10 p-3 text-[#43e58c]"><MessageCircle size={20} /></div>
          <div>
            <h2 className="font-semibold">{heading}</h2>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          </div>
        </div>
      </div>

      <div className="max-h-[28rem] min-h-48 space-y-3 overflow-y-auto p-5">
        {messages.length === 0 && <p className="text-sm text-gray-500">No messages yet. Start the conversation.</p>}
        {messages.map((message) => {
          const fromCurrentUser = message.senderRole === currentRole;
          return (
            <div key={message.id} className={`flex ${fromCurrentUser ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${fromCurrentUser ? "bg-[#43e58c] text-black" : "border border-[#1c3026] bg-[#07110d]/60"}`}>
                <p className={`mb-1 text-xs font-semibold ${fromCurrentUser ? "text-black/65" : "text-[#43e58c]"}`}>
                  {message.senderRole === "admin" ? "Customer service" : message.senderName}
                </p>
                <p className="whitespace-pre-wrap">{message.text}</p>
              </div>
            </div>
          );
        })}
      </div>

      {error && <p className="px-5 pb-3 text-sm text-red-400">{error}</p>}
      <form onSubmit={submit} className="flex gap-3 border-t border-[#1c3026] p-4">
        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message..." className="min-w-0 flex-1 rounded-xl border border-[#1c3026] bg-[#07110d] px-4 py-3 text-sm outline-none focus:border-[#43e58c]" />
        <button type="submit" aria-label="Send message" className="rounded-xl bg-[#43e58c] px-4 text-black hover:bg-[#c7f36b]"><Send size={18} /></button>
      </form>
    </section>
  );
}