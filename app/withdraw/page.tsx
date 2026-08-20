"use client";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import {
  addAdminRequest,
  adminStateEvent,
  readAdminRequests,
  type AdminRequest,
  formatAdminUgx,
} from "@/lib/adminStore";
import { firebaseAuth } from "@/lib/firebase";
import { readBalance, investmentStateEvent, formatUgx } from "@/lib/investmentStore";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useEffect, useState } from "react";

export default function WithdrawPage() {
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState(0);
  const [message, setMessage] = useState("");
  const [allRequests, setAllRequests] = useState<AdminRequest[]>([]);

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
      setAllRequests(
        readAdminRequests().filter(
          (request) =>
            (request.userId === userId || (!request.userId && request.user === "Digi User")) &&
            request.type === "Withdrawal"
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

  const pendingRequests = allRequests.filter((r) => r.status === "Pending");
  const completedRequests = allRequests.filter((r) => r.status === "Completed");
  const rejectedRequests = allRequests.filter((r) => r.status === "Rejected");

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

      <main className="min-h-screen pt-24 md:ml-64 px-6 pb-10">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold">Withdraw</h1>
          <p className="mt-2 text-gray-500">
            Request to withdraw funds from your account.
          </p>

          <div className="mt-8 glass-card stat-card-hover rounded-2xl p-6">
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
              className="mt-2 w-full rounded-xl border border-[#1c3026] bg-[#07110d] p-4 outline-none focus:border-[#43e58c] focus:ring-2 focus:ring-[#43e58c]/20 transition"
            />

            <button onClick={submitWithdrawal} className="mt-5 w-full rounded-xl bg-[#43e58c] p-4 font-semibold text-black hover:bg-[#c7f36b] transition transform hover:-translate-y-0.5">
              Withdraw UGX {amount || "0.00"}
            </button>
            {message && <p className="mt-3 text-sm text-[#43e58c] animate-pulse">{message}</p>}
          </div>

          {/* Completed Withdrawals */}
          {completedRequests.length > 0 && (
            <div className="mt-8 rounded-2xl border border-[#43e58c]/30 bg-[#43e58c]/5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={20} className="text-[#43e58c]" />
                <h2 className="text-lg font-semibold text-[#43e58c]">Approved Withdrawals</h2>
              </div>
              <div className="space-y-3">
                {completedRequests.map((request) => (
                  <div key={request.id} className="glass-card rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{formatAdminUgx(request.amount)}</p>
                        <p className="text-sm text-gray-400">✓ Withdrawn on {request.createdAt}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-[#43e58c]/10 px-3 py-1 text-sm text-[#43e58c] font-medium">
                        Completed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Withdrawals */}
          {pendingRequests.length > 0 && (
            <div className="mt-6 rounded-2xl border border-amber-300/30 bg-amber-300/5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={20} className="text-amber-300" />
                <h2 className="text-lg font-semibold text-amber-300">Pending Approval</h2>
              </div>
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="rounded-lg border border-amber-300/20 bg-amber-300/5 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{formatAdminUgx(request.amount)}</p>
                        <p className="text-sm text-amber-100/80">Submitted on {request.createdAt}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-amber-300/10 px-3 py-1 text-sm text-amber-300 font-medium">
                        Pending
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rejected Withdrawals */}
          {rejectedRequests.length > 0 && (
            <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={20} className="text-red-400" />
                <h2 className="text-lg font-semibold text-red-400">Rejected</h2>
              </div>
              <div className="space-y-3">
                {rejectedRequests.map((request) => (
                  <div key={request.id} className="rounded-lg border border-red-400/20 bg-red-400/5 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{formatAdminUgx(request.amount)}</p>
                        <p className="text-sm text-red-200/80">Rejected on {request.createdAt}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-red-400/10 px-3 py-1 text-sm text-red-300 font-medium">
                        Rejected
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
