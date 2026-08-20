"use client";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { formatUgx } from "@/lib/investmentStore";
import {
  readTransactions,
  syncTransactionsFromProfile,
  transactionStateEvent,
  type Transaction,
} from "@/lib/transactionStore";
import { useEffect, useState } from "react";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

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

  return (
    <>
      <Navbar />
      <Sidebar />

      <main className="min-h-screen px-6 pt-24 md:ml-64">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold">Transactions</h1>

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
