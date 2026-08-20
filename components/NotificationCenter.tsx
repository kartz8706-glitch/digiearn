"use client";

import { collection, collectionGroup, doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import { firestoreDatabase, firebaseAuth } from "@/lib/firebase";
import { showNotification } from "@/lib/notificationService";

type Transaction = {
  id: string;
  type?: string;
  amount?: number;
  status?: string;
};

export default function NotificationCenter() {
  useEffect(() => {
    let unsubscribeData: (() => void) | undefined;
    let unsubscribeMessages: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
      unsubscribeData?.();
      unsubscribeMessages?.();
      if (!user) return;

      const isAdmin = user.email?.toLowerCase() === "kartz8706@gmail.com" || window.localStorage.getItem("digi-earn-role") === "admin";
      const seenTransactions = new Set<string>();
      const seenMessages = new Set<string>();
      let transactionsReady = false;
      let messagesReady = false;
      let usersReady = false;

      const handleTransactions = (transactions: Transaction[], ownerName = "Your account") => {
        const newTransactions = transactions.filter((transaction) => !seenTransactions.has(transaction.id));
        if (transactionsReady) {
          newTransactions.forEach((transaction) => {
            showNotification(
              `${transaction.type || "Transaction"} update`,
              `${ownerName}: UGX ${Number(transaction.amount || 0).toLocaleString()} ${transaction.status || "updated"}.`
            );
            window.dispatchEvent(new Event("digi-earn-transaction-notification"));
          });
        }
        transactions.forEach((transaction) => seenTransactions.add(transaction.id));
        transactionsReady = true;
      };

      if (isAdmin) {
        const unsubscribeUsers = onSnapshot(collection(firestoreDatabase, "users"), (snapshot) => {
          if (usersReady) {
            snapshot.docChanges().filter((change) => change.type === "added").forEach((change) => {
              const data = change.doc.data();
              const name = String(data.name || data.email || "New user");
              showNotification("New user joined", `${name} created an account.`);
              window.dispatchEvent(new CustomEvent("digi-earn-new-user", { detail: { userId: change.doc.id, name } }));
            });
          }
          usersReady = true;
        });
        unsubscribeMessages = unsubscribeUsers;

        unsubscribeData = onSnapshot(collection(firestoreDatabase, "users"), (snapshot) => {
          snapshot.docs.forEach((userDoc) => {
            const data = userDoc.data();
            handleTransactions((data.transactions || []) as Transaction[], String(data.name || data.email || "Customer"));
          });
        });
        const unsubscribeConversationMessages = onSnapshot(collectionGroup(firestoreDatabase, "messages"), (snapshot) => {
          const newMessages = snapshot.docChanges().filter((change) => change.type === "added");
          if (messagesReady) {
            newMessages.forEach((change) => {
              const data = change.doc.data();
              if (data.senderId !== user.uid && data.senderRole === "user") {
                showNotification(`Message from ${data.senderName || "customer"}`, String(data.text || "New message"));
                window.dispatchEvent(new Event("digi-earn-message-notification"));
              }
            });
          }
          newMessages.forEach((change) => seenMessages.add(change.doc.id));
          messagesReady = true;
        });
        const previousUnsubscribeMessages = unsubscribeMessages;
        unsubscribeMessages = () => {
          previousUnsubscribeMessages?.();
          unsubscribeConversationMessages();
        };
      } else {
        unsubscribeData = onSnapshot(doc(firestoreDatabase, "users", user.uid), (snapshot) => {
          handleTransactions((snapshot.data()?.transactions || []) as Transaction[]);
        });
        unsubscribeMessages = onSnapshot(collection(firestoreDatabase, "conversations", user.uid, "messages"), (snapshot) => {
          const newMessages = snapshot.docChanges().filter((change) => change.type === "added");
          if (messagesReady) {
            newMessages.forEach((change) => {
              const data = change.doc.data();
              if (data.senderId !== user.uid) {
                showNotification("Customer service message", String(data.text || "You have a new message."));
                window.dispatchEvent(new Event("digi-earn-message-notification"));
              }
            });
          }
          newMessages.forEach((change) => seenMessages.add(change.doc.id));
          messagesReady = true;
        });
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeData?.();
      unsubscribeMessages?.();
    };
  }, []);

  return null;
}