"use client";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ConversationPanel from "@/components/ConversationPanel";
import { formatUgx } from "@/lib/investmentStore";
import {
  readTransactions,
  syncTransactionsFromProfile,
  transactionStateEvent,
  type Transaction,
} from "@/lib/transactionStore";
import { firebaseAuth } from "@/lib/firebase";
import { fetchUserProfile } from "@/lib/firestoreData";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [userName, setUserName] = useState("Digi User");

  useEffect(() => {
    const updateTransactions = () => {
      setTransactions(readTransactions());
      void syncTransactionsFromProfile().then(setTransactions);
    };

    updateTransactions();
    window.addEventListener(transactionStateEvent, updateTransactions);
    window.addEventListener("firebase-auth-state-changed", updateTransactions);

    return () => {
      window.removeEventListener(transactionStateEvent, updateTransactions);
      window.removeEventListener("firebase-auth-state-changed", updateTransactions);
    };
  }, []);

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) return;
      setCurrentUserId(user.uid);
      const profile = await fetchUserProfile<{ name?: string } | null>(user.uid, null);
      setUserName(profile?.name || user.displayName || "Digi User");
    });
  }, []);

  return (
    <>
      <Navbar />
      <Sidebar />

      <main className="min-h-screen px-6 pt-24 md:ml-64">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold">Transactions</h1>

          {currentUserId && (
            <div className="mt-8">
              <ConversationPanel
                userId={currentUserId}
                currentUserId={currentUserId}
                currentUserName={userName}
                currentRole="user"
                heading="Customer service"
                description="Chat directly with the digi.earn admin team."
              />
            </div>
          )}

          <div className="mt-8 rounded-2xl border border-[#1c3026] bg-[#0c1813]">
            {transactions.length === 0 && (
              <p className="p-8 text-sm text-gray-500">No transactions yet.</p>
            )}
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between border-b border-[#1c3026] p-5 last:border-0"
              >
                <div>
                  <p className="font-medium">{transaction.asset}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    {transaction.type} - {new Date(transaction.createdAt).toLocaleDateString()} - {transaction.status}
                  </p>
                </div>

                <p
                  className={
                    transaction.type === "Deposit"
                      ? "text-[#43e58c]"
                      : "text-red-400"
                  }
                >
                  {transaction.type === "Deposit" ? "+" : "-"}
                  {formatUgx(transaction.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
