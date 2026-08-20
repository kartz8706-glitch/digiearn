import {
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { firestoreDatabase } from "@/lib/firebase";

export type ConversationRole = "user" | "admin";

export type ConversationMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: ConversationRole;
  text: string;
  createdAt: Date | null;
};

function messagesCollection(userId: string) {
  return collection(firestoreDatabase, "conversations", userId, "messages");
}

function mapMessage(id: string, data: DocumentData): ConversationMessage {
  const createdAt = data.createdAt?.toDate?.() ?? null;
  return {
    id,
    senderId: String(data.senderId || ""),
    senderName: String(data.senderName || "Unknown"),
    senderRole: data.senderRole === "admin" ? "admin" : "user",
    text: String(data.text || ""),
    createdAt,
  };
}

export function subscribeToConversation(
  userId: string,
  onMessages: (messages: ConversationMessage[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    messagesCollection(userId),
    (snapshot) => {
      const messages = snapshot.docs
        .map((item) => mapMessage(item.id, item.data()))
        .sort((left, right) => {
          const leftTime = left.createdAt?.getTime() ?? 0;
          const rightTime = right.createdAt?.getTime() ?? 0;
          return leftTime - rightTime;
        });
      onMessages(messages);
    },
    (error) => onError?.(error)
  );
}

export async function sendConversationMessage({
  userId,
  senderId,
  senderName,
  senderRole,
  text,
}: {
  userId: string;
  senderId: string;
  senderName: string;
  senderRole: ConversationRole;
  text: string;
}) {
  await addDoc(messagesCollection(userId), {
    senderId,
    senderName,
    senderRole,
    text: text.trim(),
    createdAt: serverTimestamp(),
  });
}