"use client";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import {
  formatUgx,
  investmentStateEvent,
  readInvestments,
  type Investment,
} from "@/lib/investmentStore";
import { useEffect, useState } from "react";

export default function PortfolioPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);

  useEffect(() => {
    const updateInvestments = () => setInvestments(readInvestments());
    updateInvestments();
    window.addEventListener(investmentStateEvent, updateInvestments);
    window.addEventListener("firebase-auth-state-changed", updateInvestments);

    return () => {
      window.removeEventListener(investmentStateEvent, updateInvestments);
      window.removeEventListener("firebase-auth-state-changed", updateInvestments);
    };
  }, []);

  return (
    <>
      <Navbar />
      <Sidebar />

      <main className="min-h-screen pt-24 md:ml-64 px-6 pb-10">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold">Portfolio</h1>

          <div className="mt-8 overflow-hidden rounded-2xl border border-[#1c3026] bg-[#0c1813]">
            <div className="grid grid-cols-4 border-b border-[#1c3026] p-5 text-sm text-gray-500">
              <span>Asset</span>
              <span>Symbol</span>
              <span>Value</span>
              <span>Return</span>
            </div>

            {investments.map((investment) => {
              const isLocked = new Date(investment.unlocksAt) > new Date();

              return (
                <div
                  key={investment.id}
                  className="grid grid-cols-4 border-b border-[#1c3026] p-5 last:border-0"
                >
                  <div>
                    <span className="font-medium">{investment.name}</span>
                    <p className="mt-1 text-xs text-amber-300">
                      {isLocked
                        ? `Locked until ${new Date(investment.unlocksAt).toLocaleDateString()}`
                        : "Unlocked"}
                    </p>
                  </div>
                  <span className="text-gray-500">{investment.symbol}</span>
                  <div>
                    <span>{formatUgx(investment.amount)}</span>
                    <p className="mt-1 text-xs text-[#43e58c]">
                      Matures at {formatUgx(investment.maturityValue)}
                    </p>
                  </div>
                  <span className="text-gray-500">{investment.change}</span>
                </div>
              );
            })}

            {investments.length === 0 && (
              <p className="col-span-4 p-8 text-center text-sm text-gray-500">
                Your portfolio is empty. Approved investments will appear here.
              </p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}