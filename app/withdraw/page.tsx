"use client";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import {
  addAdminRequest,
  adminStateEvent,
  readAdminRequests,
  type AdminRequest,
} from "@/lib/adminStore";
import { firebaseAuth } from "@/lib/firebase";
import { readBalance, investmentStateEvent, formatUgx } from "@/lib/investmentStore";
import { useEffect, useState } from "react";

export default function WithdrawPage() {
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState(0);
  const [message, setMessage] = useState("");
  const [pendingRequests, setPendingRequests] = useState<AdminRequest[]>([]);

  useEffect(() => {
    const updateBalance = () => setBalance(readBalance());
    updateBalance();
    window.addEventListener(investmentStateEvent, updateBalance);
    window.addEventListener(adminStateEvent, updateBalance);
    window.addEventListener("firebase-auth-state-changed", updateBalance);
    return () => {
      window.removeEventListener(investmentStateEvent, updateBalance);
      window.removeEventListener(adminStateEvent, updateBalance);
      window.removeEventListener("firebase-auth-state-changed", updateBalance);
    };
  }, []);

  useEffect(() => {
    const updateRequests = () => {
      const userId = firebaseAuth.currentUser?.uid;
      setPendingRequests(
        readAdminRequests().filter(
          (request) =>
            (request.userId === userId || (!request.userId && request.user === "Digi User")) &&
            request.type === "Withdrawal" &&
            request.status === "Pending"
        )
      );
    };

    updateRequests();
    window.addEventListener(adminStateEvent, updateRequests);
    window.addEventListener("firebase-auth-state-changed", updateRequests);
    return () => {
      window.removeEventListener(adminStateEvent, updateRequests);
      window.removeEventListener("firebase-auth-state-changed", updateRequests);
    };
  }, []);

  function submitWithdrawal() {
    const value = Number(amount);
    if (!value || value < 100000) {
      setMessage("The minimum withdrawal is UGX 100,000.");
      return;
    }

    if (value > balance) {
      setMessage("Enter an amount within your available balance.");
      return;
    }

    addAdminRequest({ user: "Digi User", type: "Withdrawal", amount: value });
    setAmount("");
    setMessage("Withdrawal request submitted for admin approval.");
  }

  return (
    <>
      <Navbar />
      <Sidebar />

      <main className="min-h-screen pt-24 md:ml-64 px-6">
        <div className="mx-auto max-w-xl">
          <h1 className="text-3xl font-bold">Withdraw</h1>

          <div className="mt-8 rounded-2xl border border-[#1c3026] bg-[#0c1813] p-6">
            <div className="mb-5 rounded-xl bg-[#43e58c]/10 p-4">
              <p className="text-sm text-gray-400">
                Available balance
              </p>
              <p className="mt-1 text-xl font-bold">
                {formatUgx(balance)}
              </p>
            </div>

            <label className="text-sm text-gray-400">
              Withdrawal amount
            </label>

            <input
              type="number"
              min="100000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Minimum UGX 100,000"
              className="mt-2 w-full rounded-xl border border-[#1c3026] bg-[#07110d] p-4 outline-none focus:border-[#43e58c]"
            />

            <button onClick={submitWithdrawal} className="mt-5 w-full rounded-xl border border-[#43e58c] p-4 font-semibold text-[#43e58c] hover:bg-[#43e58c] hover:text-black">
              Withdraw UGX {amount || "0.00"}
            </button>
            {message && <p className="mt-3 text-sm text-[#43e58c]">{message}</p>}

            {pendingRequests.length > 0 && (
              <div className="mt-5 rounded-xl border border-amber-300/30 bg-amber-300/10 p-4">
                <p className="text-sm font-semibold text-amber-200">Pending withdrawals</p>
                <div className="mt-2 space-y-1 text-sm text-amber-100/80">
                  {pendingRequests.map((request) => (
                    <p key={request.id}>
                      UGX {request.amount.toLocaleString()} · Waiting for approval
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
