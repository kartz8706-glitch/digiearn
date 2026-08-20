"use client";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import StatCard from "@/components/StatCard";
import PortfolioChart from "@/components/PortfolioChart";
import { Mail } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import {
  formatUgx,
  investmentStateEvent,
  readBalance,
  readInvestments,
} from "@/lib/investmentStore";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  markMessageRead,
  messageStateEvent,
  readUserMessages,
  sendUserMessage,
  type Message,
} from "@/lib/messageStore";
import { fetchUserProfile } from "@/lib/firestoreData";
import { firebaseAuth } from "@/lib/firebase";

export default function Dashboard() {
  const [balance, setBalance] = useState(0);
  const [totalInvested, setTotalInvested] = useState(0);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [todaysReturn, setTodaysReturn] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [replyStatus, setReplyStatus] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [userName, setUserName] = useState("Digi User");

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
      setMessages(readUserMessages());
    };

    updateSummary();
    window.addEventListener(investmentStateEvent, updateSummary);
    window.addEventListener(messageStateEvent, updateSummary);
    window.addEventListener("firebase-auth-state-changed", updateSummary);

    return () => {
      window.removeEventListener(investmentStateEvent, updateSummary);
      window.removeEventListener(messageStateEvent, updateSummary);
      window.removeEventListener("firebase-auth-state-changed", updateSummary);
    };
  }, []);

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) return;
      const profile = await fetchUserProfile<{
        name?: string;
        portfolioValue?: number;
        totalInvested?: number;
        availableBalance?: number;
        todaysReturn?: number;
      } | null>(
        user.uid,
        null
      );
      setUserName(profile?.name || user.displayName || "Digi User");
      if (profile?.availableBalance !== undefined) setBalance(profile.availableBalance);
      if (profile?.totalInvested !== undefined) setTotalInvested(profile.totalInvested);
      setPortfolioValue(profile?.portfolioValue ?? (profile?.availableBalance ?? 0) + (profile?.totalInvested ?? 0));
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

            <StatCard
              title="Total Invested"
              value={formatUgx(totalInvested)}
              change=""
            />

            <StatCard
              title="Available Balance"
              value={formatUgx(balance)}
            />

            <StatCard
              title="Today's Return"
              value={formatUgx(todaysReturn)}
              change=""
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="surface lift-on-hover mobile-card rounded-2xl p-6 lg:col-span-2">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    Portfolio performance
                  </h2>
                  <p className="text-sm text-gray-500">
                    Simulated portfolio value
                  </p>
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
              <h2 className="text-lg font-semibold">
                Quick actions
              </h2>

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

          <section id="messages" className="surface lift-on-hover mobile-card mt-6 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Messages</h2>
                <p className="mt-1 text-sm text-gray-500">Updates from the digi.earn team.</p>
              </div>
              <Mail size={19} className="text-[#43e58c]" />
            </div>

            <div className="mt-5 space-y-3">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!newSubject.trim() || !newMessage.trim()) return;
                  sendUserMessage(newSubject.trim(), newMessage.trim());
                  setNewSubject("");
                  setNewMessage("");
                  setReplyStatus("Message sent to admin.");
                }}
                className="rounded-xl border border-[#1c3026] bg-[#07110d]/60 p-4"
              >
                <p className="text-sm font-medium">Start a conversation</p>
                <input value={newSubject} onChange={(event) => setNewSubject(event.target.value)} placeholder="Subject" className="mt-3 w-full rounded-lg border border-[#1c3026] bg-[#07110d] px-3 py-2 text-sm outline-none focus:border-[#43e58c]" />
                <textarea value={newMessage} onChange={(event) => setNewMessage(event.target.value)} placeholder="Write to admin..." rows={3} className="mt-2 w-full resize-none rounded-lg border border-[#1c3026] bg-[#07110d] px-3 py-2 text-sm outline-none focus:border-[#43e58c]" />
                <button type="submit" className="mt-3 rounded-lg bg-[#43e58c] px-3 py-2 text-sm font-semibold text-black">Send message</button>
              </form>
              {messages.length === 0 && (
                <p className="rounded-xl border border-dashed border-[#1c3026] p-4 text-sm text-gray-500">No messages yet.</p>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-xl border p-4 ${message.read ? "border-[#1c3026]" : "border-[#43e58c]/50 bg-[#43e58c]/[0.06]"}`}
                >
                  <button type="button" onClick={() => markMessageRead(message.id)} className="block w-full text-left">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{message.subject}</p>
                        <p className="mt-1 text-sm text-gray-400">{message.body}</p>
                      </div>
                      <span className="shrink-0 text-xs text-gray-500">{message.createdAt}</span>
                    </div>
                    {!message.read && <p className="mt-3 text-xs font-semibold text-[#43e58c]">Unread · click to mark read</p>}
                  </button>

                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (!reply.trim()) return;
                      sendUserMessage(`Re: ${message.subject}`, reply.trim());
                      setReply("");
                      setReplyStatus("Reply sent to admin.");
                    }}
                    className="mt-4 flex gap-2 border-t border-[#1c3026] pt-4"
                  >
                    <input
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      placeholder="Reply to admin..."
                      className="min-w-0 flex-1 rounded-lg border border-[#1c3026] bg-[#07110d] px-3 py-2 text-sm outline-none focus:border-[#43e58c]"
                    />
                    <button type="submit" className="rounded-lg bg-[#43e58c] px-3 py-2 text-sm font-semibold text-black">Reply</button>
                  </form>
                  {replyStatus && <p className="mt-2 text-xs text-[#43e58c]">{replyStatus}</p>}
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
