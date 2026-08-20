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
          <h1 className="text-3xl font-bold mb-8">Portfolio</h1>

          {investments.length === 0 ? (
            <div className="empty-state rounded-2xl border border-[#1c3026] bg-[#0c1813] p-12">
              <div className="empty-state-icon">
                <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                </svg>
              </div>
              <h2 className="empty-state-title">No Investments Yet</h2>
              <p className="empty-state-description">
                Your portfolio is empty. Start investing to see your assets here.
              </p>
              <a href="/investments" className="empty-state-action">
                Browse Investments
              </a>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#1c3026] bg-[#0c1813] hidden md:block">
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
                    className="glass-card grid grid-cols-4 border-b border-[#1c3026] p-5 last:border-0"
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
            </div>
          )}

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {investments.map((investment) => {
              const isLocked = new Date(investment.unlocksAt) > new Date();

              return (
                <div
                  key={investment.id}
                  className="glass-card table-card-mobile"
                >
                  <div className="table-card-mobile-row">
                    <div className="table-card-mobile-cell">
                      <span className="table-card-mobile-cell-label">Asset</span>
                      <div className="text-right">
                        <span className="font-medium block">{investment.name}</span>
                        <p className="mt-1 text-xs text-amber-300">
                          {isLocked
                            ? `Locked until ${new Date(investment.unlocksAt).toLocaleDateString()}`
                            : "Unlocked"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="table-card-mobile-row">
                    <div className="table-card-mobile-cell">
                      <span className="table-card-mobile-cell-label">Symbol</span>
                      <span className="text-gray-500">{investment.symbol}</span>
                    </div>
                  </div>

                  <div className="table-card-mobile-row">
                    <div className="table-card-mobile-cell">
                      <span className="table-card-mobile-cell-label">Value</span>
                      <div className="text-right">
                        <span className="block">{formatUgx(investment.amount)}</span>
                        <p className="mt-1 text-xs text-[#43e58c]">
                          Matures at {formatUgx(investment.maturityValue)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="table-card-mobile-row">
                    <div className="table-card-mobile-cell">
                      <span className="table-card-mobile-cell-label">Return</span>
                      <span className="text-gray-500">{investment.change}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}