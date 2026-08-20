"use client";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import {
  formatUgx,
  investmentStateEvent,
  readBalance,
  saveInvestment,
  syncBalanceFromProfile,
} from "@/lib/investmentStore";
import {
  adminStateEvent,
  readAdminInvestments,
  type AdminInvestment,
} from "@/lib/adminStore";
import { fetchFromDatabase } from "@/lib/firebaseData";
import { useEffect, useState } from "react";

function toInvestmentArray(
  value: AdminInvestment[] | Record<string, AdminInvestment>
) {
  return (Array.isArray(value) ? value : Object.values(value)).filter(
    (investment) => investment.status === "Active"
  );
}

export default function InvestmentsPage() {
  const [balance, setBalance] = useState(0);
  const [investments, setInvestments] = useState<AdminInvestment[]>([]);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    const updateBalance = () => {
      setBalance(readBalance());
      void syncBalanceFromProfile().then(setBalance);
    };
    updateBalance();
    window.addEventListener(investmentStateEvent, updateBalance);
    window.addEventListener("firebase-auth-state-changed", updateBalance);

    return () => {
      window.removeEventListener(investmentStateEvent, updateBalance);
      window.removeEventListener("firebase-auth-state-changed", updateBalance);
    };
  }, []);

  useEffect(() => {
    const updateInvestments = async () => {
      const localInvestments = readAdminInvestments();
      setInvestments(toInvestmentArray(localInvestments));

      const firebaseInvestments = await fetchFromDatabase<
        AdminInvestment[] | Record<string, AdminInvestment>
      >("admin/investments", localInvestments);
      setInvestments(toInvestmentArray(firebaseInvestments));
    };

    void updateInvestments();
    window.addEventListener(adminStateEvent, updateInvestments);
    window.addEventListener("firebase-auth-state-changed", updateInvestments);

    return () => {
      window.removeEventListener(adminStateEvent, updateInvestments);
      window.removeEventListener("firebase-auth-state-changed", updateInvestments);
    };
  }, []);

function handleInvest(investment: AdminInvestment) {
  const amount = Number(amounts[investment.symbol]);

  if (!amount || amount <= 0) {
    setMessage("Enter an investment amount first.");
    return;
  }

  if (amount > balance) {
    setMessage("That amount is higher than your available balance.");
    return;
  }

  const investedAt = new Date();
  const unlocksAt = new Date(investedAt);
  unlocksAt.setDate(unlocksAt.getDate() + investment.lockDays);

  // Save investment (this will also reduce the shared balance)
  saveInvestment({
    id: `${investment.symbol}-${investedAt.getTime()}`,
    name: investment.name,
    symbol: investment.symbol,
    amount,
    maturityValue: amount * investment.multiplier,
    price: `x ${investment.multiplier.toFixed(2)}`,
    change: investment.status,
    investedAt: investedAt.toISOString(),
    unlocksAt: unlocksAt.toISOString(),
  });

  setAmounts((current) => ({ ...current, [investment.symbol]: "" }));
  setMessage(
    `${formatUgx(amount)} invested in ${investment.symbol}. Unlocks on ${unlocksAt.toLocaleDateString()}.`
  );
}
  return (
    <>
      <Navbar />
      <Sidebar />

      <main className="min-h-screen pt-24 md:ml-64 px-6 pb-10">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold">Investments</h1>
          <p className="mt-2 text-gray-500">
            Explore simulated investment assets.
          </p>

          <div className="mt-6 rounded-2xl border border-[#1c3026] bg-[#0c1813] p-5">
            <p className="text-sm text-gray-500">Available balance</p>
            <p className="mt-1 text-2xl font-bold">{formatUgx(balance)}</p>
            {message && (
              <p className="mt-3 text-sm text-[#43e58c]">{message}</p>
            )}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {investments.length === 0 && (
              <p className="rounded-2xl border border-dashed border-[#1c3026] p-8 text-sm text-gray-500 md:col-span-2 lg:col-span-3">
                No investment products are available yet.
              </p>
            )}
            {investments.map((investment) => (
              <div
                key={investment.symbol}
                className="rounded-2xl border border-[#1c3026] bg-[#0c1813] p-6 transition hover:-translate-y-1"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">
                      {investment.name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {investment.symbol}
                    </p>
                  </div>

                  <span className="rounded-full bg-[#43e58c]/10 px-3 py-1 text-xs text-[#43e58c]">
                    {investment.status}
                  </span>
                </div>

                <p className="mt-6 text-2xl font-bold">
                  x {investment.multiplier.toFixed(2)}
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Locked for {investment.lockDays} days after investing
                </p>

                <div className="mt-5 rounded-xl border border-[#1c3026] bg-[#07110d] p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Maturity calculator</span>
                    <span className="text-[#43e58c]">
                      x {investment.multiplier.toFixed(2)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-400">
                    After {investment.lockDays} days
                  </p>
                  <p className="mt-1 text-xl font-bold">
                    {formatUgx(
                      Number(amounts[investment.symbol] || 0) *
                      investment.multiplier
                    )}
                  </p>
                </div>

                <label className="mt-5 block text-sm text-gray-400">
                  Amount to invest
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={amounts[investment.symbol] || ""}
                    onChange={(event) =>
                      setAmounts((current) => ({
                        ...current,
                        [investment.symbol]: event.target.value,
                      }))
                    }
                    placeholder="0.00"
                    className="mt-2 w-full rounded-xl border border-[#1c3026] bg-[#07110d] p-3 text-white outline-none focus:border-[#43e58c]"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => handleInvest(investment)}
                  className="mt-4 w-full rounded-xl bg-[#43e58c] py-3 text-center text-sm font-semibold text-black hover:opacity-90"
                >
                  Invest now
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
