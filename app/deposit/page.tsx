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
import { useEffect, useState } from "react";

export default function DepositPage() {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [pendingRequests, setPendingRequests] = useState<AdminRequest[]>([]);

  useEffect(() => {
    const updateRequests = () => {
      const userId = firebaseAuth.currentUser?.uid;
      setPendingRequests(
        readAdminRequests().filter(
          (request) =>
            (request.userId === userId || (!request.userId && request.user === "Digi User")) &&
            request.type === "Deposit" &&
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

  function submitDeposit() {
    const value = Number(amount);
    if (!value || value < 10000) {
      setMessage("The minimum deposit is UGX 10,000.");
      return;
    }

    addAdminRequest({ user: "Digi User", type: "Deposit", amount: value });
    setAmount("");
    setMessage("Deposit request submitted for admin approval.");
  }

  return (
    <>
      <Navbar />
      <Sidebar />

      <main className="min-h-screen pt-24 md:ml-64 px-6">
        <div className="mx-auto max-w-xl">
          <h1 className="text-3xl font-bold">Deposit</h1>
          <p className="mt-2 text-gray-500">
            Add simulated funds to your account.
          </p>

          <div className="mt-8 rounded-2xl border border-[#1c3026] bg-[#0c1813] p-6">
            <label className="text-sm text-gray-400">
              Amount
            </label>

            <input
              type="number"
              min="10000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Minimum UGX 10,000"
              className="mt-2 w-full rounded-xl border border-[#1c3026] bg-[#07110d] p-4 outline-none focus:border-[#43e58c]"
            />

            <button onClick={submitDeposit} className="mt-5 w-full rounded-xl bg-[#43e58c] p-4 font-semibold text-black hover:opacity-90">
              Deposit UGX {amount || "0.00"}
            </button>
            {message && <p className="mt-3 text-sm text-[#43e58c]">{message}</p>}

            {pendingRequests.length > 0 && (
              <div className="mt-5 rounded-xl border border-amber-300/30 bg-amber-300/10 p-4">
                <p className="text-sm font-semibold text-amber-200">Pending deposits</p>
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
