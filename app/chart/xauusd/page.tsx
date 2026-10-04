"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { ArrowLeft, ArrowDownRight, ArrowUpRight, LineChart, Wallet } from "lucide-react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { firebaseAuth, firestoreDatabase } from "@/lib/firebase";

type PaperOrder = {
  id: string;
  side: "Buy" | "Sell";
  amountUgx: number;
  openedAt: string;
  closedAt?: string;
};

const tradingViewUrl = "https://www.tradingview.com/widgetembed/?symbol=OANDA%3AXAUUSD&interval=60&hide_top_toolbar=0&hide_side_toolbar=1&allow_symbol_change=0&save_image=0&details=1&hotlist=0&calendar=0&theme=dark&style=1&locale=en&timezone=Etc%2FUTC";

export default function XauUsdChartPage() {
  const [amountUgx, setAmountUgx] = useState(4000);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [orders, setOrders] = useState<PaperOrder[]>([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
      unsubscribeProfile?.();

      if (!user) {
        setWalletBalance(null);
        setWalletLoading(false);
        return;
      }

      setWalletLoading(true);
      unsubscribeProfile = onSnapshot(
        doc(firestoreDatabase, "users", user.uid),
        (snapshot) => {
          const profile = snapshot.data();
          const balance = Number(profile?.availableBalance ?? profile?.balance ?? 0);
          setWalletBalance(Number.isFinite(balance) ? Math.max(0, balance) : 0);
          setWalletLoading(false);
        },
        () => {
          setWalletBalance(null);
          setWalletLoading(false);
        },
      );
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile?.();
    };
  }, []);

  function placePaperOrder(side: PaperOrder["side"]) {
    const safeAmountUgx = Math.max(4000, Math.round(Number(amountUgx) || 4000));

    if (walletBalance === null) {
      setNotice("Sign in to view your Firebase balance before placing a paper order.");
      return;
    }

    if (safeAmountUgx > walletBalance) {
      setNotice(`Insufficient balance. Available: UGX ${walletBalance.toLocaleString()}.`);
      return;
    }

    const order = {
      id: crypto.randomUUID(),
      side,
      amountUgx: safeAmountUgx,
      openedAt: new Date().toLocaleTimeString(),
    };

    setOrders((current) => [order, ...current].slice(0, 8));
    setAmountUgx(safeAmountUgx);
    setNotice(`${side} paper order opened for UGX ${safeAmountUgx.toLocaleString()}.`);
  }

  function closePaperOrder(orderId: string) {
    const closedAt = new Date().toLocaleTimeString();
    setOrders((current) => current.map((order) => order.id === orderId ? { ...order, closedAt } : order));
    setNotice("Paper order closed. No account balance was changed.");
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="page-enter min-h-screen px-3 pb-10 pt-20 text-white md:ml-64 md:px-6 md:pt-24">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href="/chart" aria-label="Back to charts" className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#29332d] bg-[#111915] text-gray-300 hover:text-white">
                <ArrowLeft size={17} />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <LineChart size={18} className="text-[#e8c968]" />
                  <h1 className="text-xl font-bold">XAU/USD</h1>
                  <span className="hidden text-sm text-gray-500 sm:inline">Gold / US Dollar</span>
                </div>
                <p className="mt-1 text-[11px] text-gray-500">Spot metals · Chart by TradingView</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-md border border-[#29332d] bg-[#101713] px-2.5 py-1.5 text-xs">
                <Wallet size={14} className="text-[#67d99e]" />
                <span className="text-gray-400">Balance</span>
                <span className="font-semibold tabular-nums text-white">
                  {walletLoading ? "Loading" : walletBalance === null ? "Sign in" : `UGX ${walletBalance.toLocaleString()}`}
                </span>
              </div>
              <span className="rounded-md border border-[#d8b65c]/30 bg-[#d8b65c]/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#e8c968]">Paper trading</span>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_280px]">
            <section aria-label="XAU/USD price chart" className="min-w-0 overflow-hidden rounded-lg border border-[#29332d] bg-[#0d1310]">
              <iframe
                title="TradingView XAU/USD chart"
                src={tradingViewUrl}
                className="h-[520px] w-full border-0 sm:h-[620px]"
                loading="eager"
                allowFullScreen
              />
            </section>

            <aside className="h-fit rounded-lg border border-[#29332d] bg-[#101713] p-4">
              <div className="border-b border-[#29332d] pb-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Order ticket</p>
                <p className="mt-1 text-lg font-semibold">XAU/USD</p>
                <p className="mt-1 text-xs text-gray-500">Paper only. Orders are limited by your Firebase balance; no funds are debited.</p>
              </div>

              <label className="mt-4 block text-xs font-medium text-gray-400" htmlFor="paper-amount">Order amount (UGX)</label>
              <div className="mt-2 flex items-center rounded-md border border-[#303b34] bg-[#0b100d]">
                <input
                  id="paper-amount"
                  aria-label="Paper order amount in UGX"
                  type="number"
                  min="4000"
                  step="100"
                  value={amountUgx}
                  onChange={(event) => setAmountUgx(Math.max(4000, Math.round(Number(event.target.value) || 4000)))}
                  className="w-full bg-transparent px-3 py-2.5 text-sm tabular-nums text-white outline-none"
                />
                <span className="pr-3 text-xs text-gray-500">UGX</span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => placePaperOrder("Buy")} disabled={walletBalance === null || walletBalance < 4000} className="flex h-11 items-center justify-center gap-2 rounded-md bg-[#46c788] text-sm font-bold text-[#07140e] transition hover:bg-[#64d69d] disabled:cursor-not-allowed disabled:opacity-50">
                  <ArrowUpRight size={17} /> Buy
                </button>
                <button type="button" onClick={() => placePaperOrder("Sell")} disabled={walletBalance === null || walletBalance < 4000} className="flex h-11 items-center justify-center gap-2 rounded-md bg-[#e16b65] text-sm font-bold text-[#1b0908] transition hover:bg-[#ef817b] disabled:cursor-not-allowed disabled:opacity-50">
                  <ArrowDownRight size={17} /> Sell
                </button>
              </div>

              <p aria-live="polite" className="mt-3 min-h-5 text-xs text-[#c7b579]">{notice}</p>

              <div className="mt-3 border-t border-[#29332d] pt-3">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-xs font-semibold text-gray-300">Paper orders</h2>
                  <span className="text-[10px] text-gray-500">This session</span>
                </div>
                {orders.length === 0 ? (
                  <p className="py-3 text-xs text-gray-500">No paper orders yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {orders.map((order) => (
                      <li key={order.id} className="flex items-center justify-between gap-2 rounded-md bg-[#0b100d] px-2.5 py-2 text-xs">
                        <div className="min-w-0">
                          <p className={order.side === "Buy" ? "font-semibold text-[#67d99e]" : "font-semibold text-[#f08a83]"}>{order.side} · UGX {order.amountUgx.toLocaleString()}</p>
                          <p className="mt-1 text-[10px] text-gray-500">{order.closedAt ? `Closed ${order.closedAt}` : `Opened ${order.openedAt}`}</p>
                        </div>
                        {order.closedAt ? (
                          <span className="shrink-0 rounded border border-[#29332d] px-2 py-1 text-[10px] text-gray-400">Closed</span>
                        ) : (
                          <button type="button" onClick={() => closePaperOrder(order.id)} className="shrink-0 rounded border border-[#e16b65]/40 px-2.5 py-1.5 font-semibold text-[#f08a83] hover:bg-[#e16b65]/10">
                            Close
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}