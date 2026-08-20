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
import { CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useEffect, useState } from "react";

export default function DepositPage() {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [allRequests, setAllRequests] = useState<AdminRequest[]>([]);

  useEffect(() => {
    const updateRequests = () => {
      const userId = firebaseAuth.currentUser?.uid;
      setAllRequests(
        readAdminRequests().filter(
          (request) =>
            (request.userId === userId || (!request.userId && request.user === "Digi User")) &&
            request.type === "Deposit"
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

      <main className="min-h-screen pt-24 md:ml-64 px-6 pb-10">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold">Deposit</h1>
          <p className="mt-2 text-gray-500">
            Add simulated funds to your account.
          </p>

          <div className="mt-8 glass-card stat-card-hover rounded-2xl p-6">
            <label className="text-sm text-gray-400">
              Amount
            </label>

            <input
              type="number"
              min="10000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Minimum UGX 10,000"
              className="mt-2 w-full rounded-xl border border-[#1c3026] bg-[#07110d] p-4 outline-none focus:border-[#43e58c] focus:ring-2 focus:ring-[#43e58c]/20 transition"
            />

            <button onClick={submitDeposit} className="mt-5 w-full rounded-xl bg-[#43e58c] p-4 font-semibold text-black hover:bg-[#c7f36b] transition transform hover:-translate-y-0.5">
              Deposit UGX {amount || "0.00"}
            </button>
            {message && <p className="mt-3 text-sm text-[#43e58c] animate-pulse">{message}</p>}
          </div>

          {/* Completed Deposits */}
          {completedRequests.length > 0 && (
            <div className="mt-8 rounded-2xl border border-[#43e58c]/30 bg-[#43e58c]/5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={20} className="text-[#43e58c]" />
                <h2 className="text-lg font-semibold text-[#43e58c]">Approved Deposits</h2>
              </div>
              <div className="space-y-3">
                {completedRequests.map((request) => (
                  <div key={request.id} className="glass-card rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{formatAdminUgx(request.amount)}</p>
                        <p className="text-sm text-gray-400">✓ Deposited on {request.createdAt}</p>
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

          {/* Pending Deposits */}
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

          {/* Rejected Deposits */}
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
