"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, ref } from "firebase/database";
import { firebaseAuth, realtimeDatabase } from "@/lib/firebase";
import { getAviatorCrashPoint } from "@/lib/aviatorRounds";

const adminEmail = "kartz8706@gmail.com";

type AviatorRound = {
  roundNumber?: number;
};

export default function AdminGamesPage() {
  const [authorized, setAuthorized] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [round, setRound] = useState<AviatorRound | null>(null);

  useEffect(() => {
    let unsubscribeRound: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
      unsubscribeRound?.();
      unsubscribeRound = undefined;

      const isAdmin = user?.email?.toLowerCase() === adminEmail;
      setAuthorized(isAdmin);
      setAuthReady(true);

      if (!isAdmin) {
        setRound(null);
        return;
      }

      unsubscribeRound = onValue(ref(realtimeDatabase, "aviator/round"), (snapshot) => {
        setRound(snapshot.exists() ? (snapshot.val() as AviatorRound) : null);
      });
    });

    return () => {
      unsubscribeAuth();
      unsubscribeRound?.();
    };
  }, []);

  const nextRoundNumber = Number(round?.roundNumber ?? 0) + 1;
  const nextCrashPoint = getAviatorCrashPoint(nextRoundNumber);

  return (
    <main className="admin-next-round-screen relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12 text-white">
      <Link href="/kate" aria-label="Back to admin dashboard" className="admin-next-round-back absolute left-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white/70 backdrop-blur transition hover:border-white/25 hover:bg-white/10 hover:text-white sm:left-8 sm:top-8">
        <ArrowLeft size={18} />
      </Link>

      {!authReady ? (
        <p className="text-sm text-white/50">Checking admin access...</p>
      ) : !authorized ? (
        <div className="flex items-center gap-3 rounded-xl border border-rose-300/20 bg-rose-950/30 px-5 py-4 text-sm text-rose-100">
          <ShieldAlert size={18} />
          Admin access required.
        </div>
      ) : (
        <section className="admin-next-round-panel text-center" aria-live="polite">
          <p className="admin-next-round-label text-xs font-semibold uppercase tracking-[0.22em] text-[#80e7ac]">Aviator · Next round</p>
          <p className="admin-next-round-number mt-5 text-sm font-medium text-white/45">Round {nextRoundNumber}</p>
          <p key={nextRoundNumber} className="admin-next-round-value mt-2 font-black tabular-nums text-white">
            {nextCrashPoint.toFixed(2)}<span className="ml-2 text-3xl font-semibold text-white/55">x</span>
          </p>
        </section>
      )}
    </main>
  );
}