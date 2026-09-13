"use client";

import { useEffect, useState } from "react";
import { Clock3, LockKeyhole, WalletCards } from "lucide-react";
import { claimInvestmentPayout, formatUgx, type Investment } from "@/lib/investmentStore";

function getRemaining(unlocksAt: string, now: number) {
  const milliseconds = Math.max(0, new Date(unlocksAt).getTime() - now);
  const totalSeconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { milliseconds, days, hours, minutes, seconds };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function InvestmentCountdown({ unlocksAt }: { unlocksAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  const remaining = getRemaining(unlocksAt, now);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (remaining.milliseconds === 0) {
    return <span className="font-semibold text-[#43e58c]">Ready for payout</span>;
  }

  return (
    <span className="font-mono font-semibold text-amber-300">
      {remaining.days}d {pad(remaining.hours)}h {pad(remaining.minutes)}m {pad(remaining.seconds)}s
    </span>
  );
}

export default function InvestmentTracker({ investments, allowPayout = false }: { investments: Investment[]; allowPayout?: boolean }) {
  return (
    <section className="surface overflow-hidden rounded-2xl">
      <div className="border-b border-[#1c3026] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#43e58c]">Payout tracker</p>
            <h2 className="mt-2 text-xl font-semibold">Investment lock periods</h2>
            <p className="mt-1 text-sm text-gray-500">Track each investment until its payout window opens.</p>
          </div>
          <Clock3 className="mt-1 text-[#43e58c]" size={22} />
        </div>
      </div>

      {investments.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-500">No active investments to track yet.</div>
      ) : (
        <div className="divide-y divide-[#1c3026]">
          {investments.map((investment) => {
            const unlocked = new Date(investment.unlocksAt).getTime() <= Date.now();
            const paidOut = Boolean(investment.paidOutAt);

            return (
              <div key={investment.id} className="grid gap-5 p-5 md:grid-cols-[1.4fr_1fr_1fr] md:items-center">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-[#43e58c]/10 p-3 text-[#43e58c]">
                    {paidOut || unlocked ? <WalletCards size={19} /> : <LockKeyhole size={19} />}
                  </div>
                  <div>
                    <p className="font-semibold">{investment.name}</p>
                    <p className="text-sm text-gray-500">{investment.symbol} · Invested {new Date(investment.investedAt).toLocaleDateString()}</p>
                    <p className="mt-2 text-sm text-[#43e58c]">Payout value: {formatUgx(investment.maturityValue)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Time remaining</p>
                  <p className="mt-2 text-sm">
                    {paidOut ? <span className="font-semibold text-[#43e58c]">Paid out</span> : <InvestmentCountdown unlocksAt={investment.unlocksAt} />}
                  </p>
                </div>
                <div className="md:text-right">
                  <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Payout date</p>
                  <p className="mt-2 text-sm text-gray-300">{new Date(investment.unlocksAt).toLocaleString()}</p>
                  {allowPayout && unlocked && !paidOut && (
                    <button
                      type="button"
                      onClick={() => claimInvestmentPayout(investment.id)}
                      className="mt-3 rounded-lg bg-[#43e58c] px-3 py-2 text-xs font-semibold text-black hover:bg-[#c7f36b]"
                    >
                      Claim payout
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
