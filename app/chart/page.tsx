import Link from "next/link";
import { ArrowUpRight, LineChart } from "lucide-react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

export default function ChartPage() {
  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="page-enter min-h-screen px-5 pb-12 pt-24 md:ml-64 md:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d8b65c]">Markets</p>
            <h1 className="mt-2 text-3xl font-bold text-white">Charts</h1>
          </div>

          <Link
            href="/chart/xauusd"
            className="group grid gap-6 rounded-xl border border-[#3b3423] bg-[linear-gradient(115deg,rgba(216,182,92,0.12),rgba(12,18,15,0.96)_48%)] p-5 transition hover:border-[#d8b65c]/60 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#d8b65c]/30 bg-[#d8b65c]/10 text-[#e8c968]">
                <LineChart size={22} />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold text-white">Gold / US Dollar</h2>
                  <span className="rounded border border-[#d8b65c]/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#e8c968]">XAU/USD</span>
                </div>
                <p className="mt-2 max-w-xl text-sm leading-6 text-gray-400">Open the spot-gold chart and try Buy or Sell paper orders.</p>
              </div>
            </div>
            <span className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#d8b65c] px-4 py-3 text-sm font-semibold text-[#17150d] transition group-hover:bg-[#f0d47f]">
              Open chart <ArrowUpRight size={17} />
            </span>
          </Link>
        </div>
      </main>
    </>
  );
}