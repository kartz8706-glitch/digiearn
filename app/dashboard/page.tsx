"use client";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import StatCard from "@/components/StatCard";
import PortfolioChart from "@/components/PortfolioChart";
import { onAuthStateChanged } from "firebase/auth";
import {
  formatUgx,
  investmentStateEvent,
  readBalance,
  readInvestments,
} from "@/lib/investmentStore";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchUserProfile } from "@/lib/firestoreData";
import { firebaseAuth } from "@/lib/firebase";
import ConversationPanel from "@/components/ConversationPanel";

export default function Dashboard() {
  const [balance, setBalance] = useState(0);
  const [totalInvested, setTotalInvested] = useState(0);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [todaysReturn, setTodaysReturn] = useState(0);
  const [userName, setUserName] = useState("Digi User");
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => {
    const updateSummary = () => {
      const investments = readInvestments();
      const currentBalance = readBalance();
      const investedTotal = investments.reduce(
        (total, investment) => total + investment.amount,
        0
      );
      setBalance(currentBalance);
      setTotalInvested(investedTotal);
      setPortfolioValue(currentBalance + investedTotal);
    };

    updateSummary();
    window.addEventListener(investmentStateEvent, updateSummary);
    window.addEventListener("firebase-auth-state-changed", updateSummary);

    return () => {
      window.removeEventListener(investmentStateEvent, updateSummary);
      window.removeEventListener("firebase-auth-state-changed", updateSummary);
    };
  }, []);

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) return;
      setCurrentUserId(user.uid);
      const profile = await fetchUserProfile<{
        name?: string;
        portfolioValue?: number;
        totalInvested?: number;
        availableBalance?: number;
        todaysReturn?: number;
      } | null>(user.uid, null);

      setUserName(profile?.name || user.displayName || "Digi User");
      if (profile?.availableBalance !== undefined) setBalance(profile.availableBalance);
      if (profile?.totalInvested !== undefined) setTotalInvested(profile.totalInvested);
      setPortfolioValue(
        profile?.portfolioValue ??
          (profile?.availableBalance ?? 0) + (profile?.totalInvested ?? 0)
      );
      setTodaysReturn(profile?.todaysReturn ?? 0);
    });
  }, []);

  return (
    <>
      <Navbar />
      <Sidebar />

      <main className="page-enter min-h-screen px-6 pb-10 pt-24 md:ml-64">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 stagger-item">
            <p className="text-gray-500">Welcome back</p>
            <h1 className="mt-1 text-3xl font-bold">Good evening, {userName}.</h1>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              title="Portfolio Value"
              value={formatUgx(portfolioValue || balance + totalInvested)}
            />
            <StatCard title="Total Invested" value={formatUgx(totalInvested)} change="" />
            <StatCard title="Available Balance" value={formatUgx(balance)} />
            <StatCard title="Today's Return" value={formatUgx(todaysReturn)} change="" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="surface lift-on-hover mobile-card rounded-2xl p-6 lg:col-span-2">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Portfolio performance</h2>
                  <p className="text-sm text-gray-500">Simulated portfolio value</p>
                </div>

                <div className="flex gap-2">
                  {["1M", "3M", "6M", "1Y"].map((period) => (
                    <button
                      key={period}
                      className="rounded-lg border border-[#1c3026] px-3 py-1 text-xs text-gray-400 hover:border-[#43e58c]/50 hover:bg-[#43e58c]/[0.06] hover:text-white"
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              <PortfolioChart />
            </div>

            <div className="surface lift-on-hover mobile-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold">Quick actions</h2>

              <div className="mt-5 space-y-3">
                <Link
                  href="/deposit"
                  className="shimmer block rounded-xl bg-[#43e58c] p-4 text-center font-semibold text-black hover:-translate-y-1 hover:bg-[#c7f36b]"
                >
                  Deposit funds
                </Link>

                <Link
                  href="/investments"
                  className="block rounded-xl border border-[#1c3026] p-4 text-center hover:-translate-y-1 hover:border-[#43e58c]/50 hover:bg-[#102019]"
                >
                  Explore investments
                </Link>

                <Link
                  href="/portfolio"
                  className="block rounded-xl border border-[#1c3026] p-4 text-center hover:-translate-y-1 hover:border-[#43e58c]/50 hover:bg-[#102019]"
                >
                  View portfolio
                </Link>
              </div>
            </div>
          </div>

          <div className="surface lift-on-hover mobile-card mt-6 rounded-2xl p-6">
            <h2 className="text-lg font-semibold">Recent activity</h2>

            <div className="mt-5">
              <p className="rounded-xl border border-dashed border-[#1c3026] p-4 text-sm text-gray-500">
                No activity yet. Your approved requests and investments will appear here.
              </p>
            </div>
          </div>

          {currentUserId && (
            <div id="messages" className="mt-6">
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
        </div>
      </main>
    </>
  );
}
