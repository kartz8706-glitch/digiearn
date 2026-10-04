"use client";

import { onAuthStateChanged } from "firebase/auth";
import { onValue, ref, runTransaction, set, update } from "firebase/database";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, ChevronDown, EllipsisVertical, Menu, Trophy, Wallet } from "lucide-react";
import { firebaseAuth, firestoreDatabase, realtimeDatabase } from "@/lib/firebase";
import { fetchUserProfile, saveUserProfile } from "@/lib/firestoreData";
import { createAviatorRoundState } from "@/lib/aviatorRounds";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const NEXT_ROUND_DURATION_MS = 7000;

const startNextSharedRound = () => runTransaction(ref(realtimeDatabase, "aviator/round"), (current) => {
  if (!current) return createAviatorRoundState(1);

  const round = current as { roundNumber?: number; status?: string; nextRoundAt?: number };
  if (round.status !== "crashed" || Date.now() < Number(round.nextRoundAt ?? 0)) return;

  return createAviatorRoundState(Number(round.roundNumber ?? 0) + 1);
});

const crashSharedRound = (roundId: string) => runTransaction(ref(realtimeDatabase, "aviator/round"), (current) => {
  if (!current) return;

  const round = current as { roundId?: string; status?: string; startedAt?: number; crashAt?: number };
  if (round.status !== "flying" || round.roundId !== roundId) return;

  return {
    ...round,
    status: "crashed",
    nextRoundAt: Date.now() + NEXT_ROUND_DURATION_MS,
  };
});

const deriveMultiplierFromRound = (startedAt: number, crashAt: number) => {
  const flightDurationMs = Math.max(4000, (crashAt - 1) * 3000);
  const elapsed = Date.now() - startedAt;
  return Math.min(Number((1 + ((elapsed / flightDurationMs) * (crashAt - 1))).toFixed(2)), crashAt);
};

const quickStakeValues = [100, 500, 1000, 5000, 10000];
const initialMultiplierHistory: number[] = [];

type AviatorBet = {
  id: string;
  tradeId?: string;
  roundId: string;
  userId: string;
  displayName: string;
  stake: number;
  payout: number;
  status: "active" | "cashed_out" | "lost";
  placedAt: number;
  settledAt?: number;
  cashoutMultiplier?: number;
};

type BetCardState = {
  tradeId: string;
  stake: number;
  pendingStake: number;
  lockedStake: number;
  hasBet: boolean;
  hasCashedOut: boolean;
  cashOutValue: number | null;
  autoBet: boolean;
  autoCashout: boolean;
  autoCashoutAt: number;
};

const createBetCard = (): BetCardState => ({
  tradeId: "",
  stake: 100,
  pendingStake: 0,
  lockedStake: 0,
  hasBet: false,
  hasCashedOut: false,
  cashOutValue: null,
  autoBet: false,
  autoCashout: false,
  autoCashoutAt: 1.5,
});

export default function AviatorGamePage({ params }: { params: Promise<{ mode: string }> }) {
  const [mode, setMode] = useState("live");
  const [multiplier, setMultiplier] = useState(0.0);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [crashAt, setCrashAt] = useState(1.85);
  const [status, setStatus] = useState<"flying" | "crashed">("flying");
  const [roundId, setRoundId] = useState("");
  const [firebaseBets, setFirebaseBets] = useState<AviatorBet[]>([]);
  const [cashOutValue, setCashOutValue] = useState<number | null>(null);
  const [nextRoundProgress, setNextRoundProgress] = useState(100);
  const [multiplierHistory, setMultiplierHistory] = useState<number[]>(initialMultiplierHistory);
  const roundHistoryRef = useRef(ref(realtimeDatabase, "aviator/history"));
  const [betCards, setBetCards] = useState<BetCardState[]>([createBetCard(), createBetCard()]);
  const [betPanelMode, setBetPanelMode] = useState<"bet" | "auto">("bet");
  const [balance, setBalance] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [resultBanner, setResultBanner] = useState<{ type: "win" | "loss" | "error"; amount?: number; message?: string } | null>(null);
  const [roundDeadline, setRoundDeadline] = useState<number | null>(null);
  const betCardsRef = useRef(betCards);
  const multiplierHistoryRef = useRef(multiplierHistory);
  const hasCashedOutRefs = useRef([false, false]);
  const handledCrashRoundRef = useRef("");
  const playedCrashSoundRoundRef = useRef("");
  const resultBannerTimeoutRef = useRef<number | null>(null);
  const roundStartedAtRef = useRef<number | null>(null);
  const roundRef = useRef(ref(realtimeDatabase, "aviator/round"));
  const roundIdRef = useRef("");
  const betRecordPathRefs = useRef<(string | null)[]>([null, null]);
  const processingPendingBetsRef = useRef(false);

  function persistBetUpdate(cardIndex: number, updates: Partial<Omit<AviatorBet, "id">>) {
    const recordPath = betRecordPathRefs.current[cardIndex];
    if (recordPath) {
      void update(ref(realtimeDatabase, recordPath), updates);
    }
  }

  useEffect(() => {
    betCardsRef.current = betCards;
  }, [betCards]);

  useEffect(() => {
    multiplierHistoryRef.current = multiplierHistory;
  }, [multiplierHistory]);

  useEffect(() => {
    void params.then(({ mode: nextMode }) => setMode(nextMode));
  }, [params]);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
      unsubscribeProfile?.();
      if (!user) {
        setUserId(null);
        setBalance(0);
        return;
      }

      setUserId(user.uid);
      unsubscribeProfile = onSnapshot(doc(firestoreDatabase, "users", user.uid), (snapshot) => {
        const profile = snapshot.data();
        setBalance(Number(profile?.availableBalance ?? profile?.balance ?? 0));
      });
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile?.();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onValue(roundRef.current, (snapshot) => {
      const nextRound = snapshot.val() as { status?: "flying" | "crashed"; crashAt?: number; startedAt?: number; nextRoundAt?: number; roundId?: string; roundNumber?: number } | null;

      if (!nextRound) {
        void startNextSharedRound();
        return;
      }

      const nextStatus = nextRound.status ?? "flying";
      const nextCrashAt = Number(nextRound.crashAt ?? 1.5);
      const startedAt = Number(nextRound.startedAt ?? Date.now());
      const nextRoundAt = Number(nextRound.nextRoundAt ?? Date.now() + NEXT_ROUND_DURATION_MS);
      const nextRoundId = String(nextRound.roundId ?? "");
      roundStartedAtRef.current = startedAt;
      roundIdRef.current = nextRoundId;
      setRoundId(nextRoundId);
      setRoundDeadline(nextRoundAt);
      setCrashAt(nextCrashAt);
      setStatus(nextStatus);

      if (nextStatus === "flying") {
        setMultiplier(deriveMultiplierFromRound(startedAt, nextCrashAt));
      } else {
        setMultiplier(nextCrashAt);
      }

      const remainingMs = Math.max(0, nextRoundAt - Date.now());
      setNextRoundProgress(nextStatus === "crashed" ? clamp((remainingMs / NEXT_ROUND_DURATION_MS) * 100, 0, 100) : 100);
    });

    const historyUnsubscribe = onValue(roundHistoryRef.current, (snapshot) => {
      const value = snapshot.val() as number[] | null;
      if (Array.isArray(value) && value.length > 0) {
        multiplierHistoryRef.current = value.slice(0, 60);
        setMultiplierHistory(value.slice(0, 60));
      }
    });

    const betsUnsubscribe = onValue(ref(realtimeDatabase, "aviator/betRecords"), (snapshot) => {
      const value = snapshot.val();
      const recordsById = value && typeof value === "object"
        ? value as Record<string, Omit<AviatorBet, "id">>
        : {};
      const recordsByTrade = new Map<string, AviatorBet>();
      for (const [id, record] of Object.entries(recordsById)) {
        const betRecord = { id, ...record };
        if (!Number.isFinite(betRecord.stake) || !betRecord.roundId || !betRecord.userId) continue;
        const tradeKey = betRecord.tradeId || id;
        const existing = recordsByTrade.get(tradeKey);
        if (!existing || betRecord.placedAt > existing.placedAt) recordsByTrade.set(tradeKey, betRecord);
      }
      const records = [...recordsByTrade.values()]
        .sort((first, second) => second.placedAt - first.placedAt);
      setFirebaseBets(records);
    });

    return () => {
      unsubscribe();
      historyUnsubscribe();
      betsUnsubscribe();
    };
  }, []);

  useEffect(() => {
    if (status !== "flying") return;

    const timer = window.setInterval(() => {
      const startedAt = roundStartedAtRef.current ?? Date.now();
      const next = deriveMultiplierFromRound(startedAt, crashAt);

      setMultiplier(next);

      if (next >= crashAt) {
        void crashSharedRound(roundIdRef.current);
        window.clearInterval(timer);
        return;
      }

      const autoCashouts = betCardsRef.current
        .map((card, cardIndex) => ({ card, cardIndex }))
        .filter(({ card, cardIndex }) => card.autoCashout && card.hasBet && !hasCashedOutRefs.current[cardIndex] && next >= card.autoCashoutAt)
        .map(({ card, cardIndex }) => ({
          cardIndex,
          payout: Number((next * card.lockedStake).toFixed(2)),
        }));

      if (autoCashouts.length > 0) {
        const payoutTotal = autoCashouts.reduce((total, item) => total + item.payout, 0);
        for (const item of autoCashouts) {
          hasCashedOutRefs.current[item.cardIndex] = true;
          persistBetUpdate(item.cardIndex, { status: "cashed_out", payout: item.payout, cashoutMultiplier: next, settledAt: Date.now() });
        }
        setBetCards((current) => current.map((card, cardIndex) => {
          const result = autoCashouts.find((item) => item.cardIndex === cardIndex);
          return result ? { ...card, hasCashedOut: true, cashOutValue: result.payout } : card;
        }));
        setCashOutValue(payoutTotal);
        setResultBanner({ type: "win", amount: payoutTotal });
        if (mode === "live" && userId) {
          setBalance((currentBalance) => {
            const nextBalance = currentBalance + payoutTotal;
            void saveUserProfile(userId, { balance: nextBalance, availableBalance: nextBalance });
            return nextBalance;
          });
        }
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, [crashAt, mode, status, userId]);

  useEffect(() => {
    if (status !== "crashed" || handledCrashRoundRef.current === roundId) return;
    handledCrashRoundRef.current = roundId;

    const lostCards = betCardsRef.current
      .map((card, cardIndex) => ({ card, cardIndex }))
      .filter(({ card, cardIndex }) => card.hasBet && !hasCashedOutRefs.current[cardIndex]);

    if (lostCards.length > 0) {
      const lostTotal = lostCards.reduce((total, { card }) => total + card.lockedStake, 0);
      setResultBanner({ type: "loss", amount: lostTotal });
      for (const { cardIndex } of lostCards) {
        persistBetUpdate(cardIndex, { status: "lost", payout: 0, settledAt: Date.now() });
      }
    }

    setBetCards((current) => current.some((card) => card.pendingStake > 0 || card.hasBet)
      ? current.map((card) => ({ ...card, pendingStake: 0, lockedStake: 0, hasBet: false }))
      : current);

    const historyValue = [Number(crashAt.toFixed(2)), ...multiplierHistoryRef.current].slice(0, 60);
    multiplierHistoryRef.current = historyValue;
    setMultiplierHistory(historyValue);
    void set(roundHistoryRef.current, historyValue);

    const countdown = window.setInterval(() => {
      const remainingMs = roundDeadline ? Math.max(0, roundDeadline - Date.now()) : NEXT_ROUND_DURATION_MS;
      setNextRoundProgress(clamp((remainingMs / NEXT_ROUND_DURATION_MS) * 100, 0, 100));
      if (roundDeadline && Date.now() >= roundDeadline) {
        void startNextSharedRound();
        window.clearInterval(countdown);
      }
    }, 250);

    return () => window.clearInterval(countdown);
  }, [crashAt, roundDeadline, roundId, status]);

  useEffect(() => {
    if (status !== "crashed" || !roundId || playedCrashSoundRoundRef.current === roundId) return;

    playedCrashSoundRoundRef.current = roundId;
    const crashSound = new Audio("/aviator-vanishing.mp3");
    crashSound.volume = 0.8;
    void crashSound.play().catch(() => undefined);
  }, [roundId, status]);

  useEffect(() => {
    if (!resultBanner) return;

    if (resultBannerTimeoutRef.current) {
      window.clearTimeout(resultBannerTimeoutRef.current);
    }

    resultBannerTimeoutRef.current = window.setTimeout(() => {
      setResultBanner(null);
    }, 2500);

    return () => {
      if (resultBannerTimeoutRef.current) {
        window.clearTimeout(resultBannerTimeoutRef.current);
      }
    };
  }, [resultBanner]);

  const placeBet = async (cardIndex: number) => {
    const card = betCards[cardIndex];
    if (status === "flying" || card.hasBet || card.pendingStake > 0) return;

    const nextStake = Math.max(100, Math.round(card.stake / 100) * 100);

    if (mode === "live" && !userId) {
      setResultBanner({ type: "error", message: "Sign in to place a live bet." });
      return;
    }

    if (mode === "live" && userId) {
      const profile = await fetchUserProfile<{ balance?: number; availableBalance?: number } | null>(userId, null);
      const currentBalance = Number(profile?.availableBalance ?? profile?.balance ?? 0);

      if (currentBalance < nextStake) {
        setResultBanner({
          type: "error",
          message: `Insufficient balance. You have ${currentBalance.toLocaleString()} UGX available.`,
        });
        return;
      }
    }

    const tradeId = crypto.randomUUID();
    setBetCards((current) => current.map((item, index) => index === cardIndex
      ? { ...item, tradeId, pendingStake: nextStake, hasCashedOut: false, cashOutValue: null }
      : item));
    hasCashedOutRefs.current[cardIndex] = false;
    setCashOutValue(null);
  };

  useEffect(() => {
    if (status !== "flying" || processingPendingBetsRef.current || !betCards.some((card) => card.pendingStake > 0)) return;

    const finalizePendingStake = async () => {
      processingPendingBetsRef.current = true;
      const pendingCards = betCards
        .map((card, cardIndex) => ({ card, cardIndex }))
        .filter(({ card }) => card.pendingStake > 0);
      const activeRoundId = roundIdRef.current;
      let availableBalance = balance;
      const acceptedCards = new Set<number>();

      try {
        if (!activeRoundId) {
          setResultBanner({ type: "error", message: "Round data is not ready. Please try again." });
        } else {
          if (mode === "live" && userId) {
            const profile = await fetchUserProfile<{ balance?: number; availableBalance?: number } | null>(userId, null);
            availableBalance = Number(profile?.availableBalance ?? profile?.balance ?? 0);
          }

          for (const { card, cardIndex } of pendingCards) {
            if (mode === "live" && availableBalance < card.pendingStake) continue;

            if (mode === "live") availableBalance -= card.pendingStake;

            if (mode === "live" && userId) {
              const tradeId = card.tradeId;
              if (!tradeId) throw new Error("Missing trade ID");
              const betKey = `${activeRoundId}_${userId}_${tradeId}`;
              const betRecordPath = `aviator/betRecords/${betKey}`;
              await set(ref(realtimeDatabase, betRecordPath), {
                tradeId,
                roundId: activeRoundId,
                userId,
                displayName: firebaseAuth.currentUser?.displayName ?? firebaseAuth.currentUser?.email?.split("@")[0] ?? userId.slice(0, 8),
                stake: card.pendingStake,
                payout: 0,
                status: "active",
                placedAt: Date.now(),
              });
              betRecordPathRefs.current[cardIndex] = betRecordPath;
            }

            acceptedCards.add(cardIndex);
          }

          if (mode === "live" && userId && acceptedCards.size > 0) {
            await saveUserProfile(userId, { balance: availableBalance, availableBalance });
            setBalance(availableBalance);
          }

          if (acceptedCards.size < pendingCards.length) {
            setResultBanner({
              type: "error",
              message: `Insufficient balance. You have ${availableBalance.toLocaleString()} UGX available for the remaining bet.`,
            });
          }
        }

        setBetCards((current) => current.map((card, cardIndex) => {
          if (!pendingCards.some((item) => item.cardIndex === cardIndex)) return card;
          if (!acceptedCards.has(cardIndex)) return { ...card, pendingStake: 0 };
          hasCashedOutRefs.current[cardIndex] = false;
          return { ...card, lockedStake: card.pendingStake, pendingStake: 0, hasBet: true, hasCashedOut: false, cashOutValue: null };
        }));
      } catch {
        setBetCards((current) => current.map((card, cardIndex) => pendingCards.some((item) => item.cardIndex === cardIndex)
          ? { ...card, pendingStake: 0 }
          : card));
        setResultBanner({ type: "error", message: "Unable to lock the bet. Please try again." });
      } finally {
        processingPendingBetsRef.current = false;
      }
    };

    void finalizePendingStake();
  }, [balance, betCards, mode, status, userId]);

  const cashOut = (cardIndex: number) => {
    const card = betCards[cardIndex];
    if (status !== "flying" || !card.hasBet || hasCashedOutRefs.current[cardIndex]) return;

    const payout = Number((multiplier * card.lockedStake).toFixed(2));
    setCashOutValue(payout);
    hasCashedOutRefs.current[cardIndex] = true;
    setResultBanner({ type: "win", amount: payout });

    if (mode === "live" && userId) {
      setBalance((currentBalance) => {
        const nextBalance = currentBalance + payout;
        void saveUserProfile(userId, { balance: nextBalance, availableBalance: nextBalance });
        return nextBalance;
      });
    }

    persistBetUpdate(cardIndex, { status: "cashed_out", payout, cashoutMultiplier: multiplier });

    setBetCards((current) => current.map((item, index) => index === cardIndex
      ? { ...item, hasBet: false, hasCashedOut: true, lockedStake: 0, cashOutValue: payout }
      : item));
  };

  const updateStake = (cardIndex: number, nextStake: number) => {
    const safeStake = Math.max(100, Math.round(nextStake / 100) * 100);
    setBetCards((current) => current.map((card, index) => index === cardIndex ? { ...card, stake: safeStake } : card));
  };

  const displayMode = mode === "live" ? "Live" : "Demo";

  const betSummary = useMemo(() => {
    if (status === "crashed") return `Round closed at ${crashAt.toFixed(2)}x`;
    if (status === "flying" && betCards.some((card) => card.hasCashedOut)) return `Cash out at ${multiplier.toFixed(2)}x`;
    if (status === "flying") return "Flight in motion";
    return "Flight in motion";
  }, [betCards, crashAt, multiplier, status]);

  const currentRoundTotal = firebaseBets
    .filter((item) => item.roundId === roundId)
    .reduce((total, item) => total + item.stake, 0);

  const currentPayouts = betCards.map((card) => card.hasBet ? Number((multiplier * card.lockedStake).toFixed(2)) : 0);

  return (
    <main className="min-h-screen bg-[#090710] px-2 py-2 text-white md:px-4">
      {resultBanner && (
        <div className="pointer-events-none fixed right-4 top-24 z-[60] max-w-sm rounded-xl border border-[#3a2d4d] bg-[#191620]/95 px-4 py-3 shadow-[0_16px_35px_rgba(0,0,0,0.45)] backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className={`inline-flex h-2.5 w-2.5 rounded-full ${resultBanner.type === "error" ? "bg-[#ff6b6b]" : resultBanner.type === "win" ? "bg-[#43e58c]" : "bg-[#fbbf24]"}`} />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d8d0e5]">
              {resultBanner.type === "error" ? "Balance" : resultBanner.type === "win" ? "Win" : "Result"}
            </span>
          </div>
          <div className="mt-2 text-sm text-white">
            {resultBanner.type === "error" && resultBanner.message ? resultBanner.message : resultBanner.type === "win" ? `Won ${resultBanner.amount?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "0.00"} UGX` : `Lost ${resultBanner.amount?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "0.00"} UGX`}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[1440px] overflow-hidden rounded-[18px] border border-[#3a2d4d] bg-[#15121a] shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <header className="flex items-center justify-between border-b border-[#342a40] bg-[#1d1825] px-4 py-3 text-sm text-[#d7d2df]">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/games" aria-label="Back to games" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#3a2d4d] bg-[#201c29] text-[#f8f8f8] hover:bg-[#312b3c]">
              <ArrowLeft size={17} />
            </Link>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff2b2b] text-base font-black text-white shadow-[0_0_16px_rgba(255,43,43,0.35)]">A</span>
              <span className="text-xl font-black text-[#fb3b3b]">Aviator</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-[#3a2d4d] bg-[#201c29] px-4 py-2 sm:flex">
              <Wallet size={16} className="text-[#43e58c]" />
              <span className="font-semibold text-white">{userId ? balance.toLocaleString() : "Sign in"}</span>
              {userId && <span className="text-xs font-medium text-[#bdb4ca]">UGX</span>}
            </div>
            <Link href="/games" aria-label="Open game menu" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#3a2d4d] bg-[#201c29] text-[#d7d2df] hover:bg-[#312b3c]">
              <Menu size={17} />
            </Link>
          </div>
        </header>

        <div className="grid min-h-[820px] grid-cols-1 bg-[#17131c] lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="hidden border-r border-[#312b3c] bg-[#1b1722] p-4 lg:block">
            <div className="mb-4 flex items-center justify-between rounded-xl border border-[#3b2e4f] bg-[#2a2334] p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ff2b2b] text-xl font-black text-white shadow-[0_0_16px_rgba(255,43,43,0.45)]">
                  A
                </div>
                <div>
                  <div className="text-2xl font-black tracking-tight text-[#fb3b3b]">Aviator</div>
                </div>
              </div>
              <button type="button" className="rounded-md border border-[#3b2e4f] p-2 text-[#d8d0e6]">
                <EllipsisVertical size={18} />
              </button>
            </div>

            <div className="mb-3 flex items-center justify-between rounded-xl border border-[#352d41] bg-[#201b29] p-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#e6e0ed]">{firebaseBets.filter((item) => item.roundId === roundId).length} Bets</span>
              </div>
              <span className="text-[#f0edf1]">{currentRoundTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} UGX</span>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-[#312b3c] pt-4 text-xs text-[#b7aec7]">
              <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#2dd4bf]" /> Shared 10-round distribution</span>
              <span>Powered by SPRIBE</span>
            </div>
          </aside>

          <section className="relative overflow-hidden bg-[#0d0b10]">
            <div className="flex items-center justify-between border-b border-[#312b3c] bg-[#15131b] px-4 py-2.5 text-sm text-[#d3cedd]">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#a59bb2]">Shared round</div>
              <div className="flex items-center gap-2">
                <Trophy size={16} className="text-[#f9d257]" />
                <span className="text-[#e9e2f0]">{cashOutValue ? `${cashOutValue.toFixed(2)} UGX` : "0.00 UGX"}</span>
              </div>
            </div>

            <div className="px-4 pb-4 pt-0">
              <div className="mb-4 overflow-x-auto rounded-xl border border-[#312b3c] bg-[#1b1722] px-3 py-2">
                <div className="mb-2 flex items-center justify-between text-xs text-[#a9a1b4]">
                  <span>Round history</span>
                  <button
                    type="button"
                    aria-label={historyExpanded ? "Collapse round history" : "Expand round history"}
                    aria-expanded={historyExpanded}
                    onClick={() => setHistoryExpanded((expanded) => !expanded)}
                    className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-white/5 hover:text-white"
                  >
                    {historyExpanded ? "Less" : "More"}
                    <ChevronDown size={14} className={`transition-transform ${historyExpanded ? "rotate-180" : ""}`} />
                  </button>
                </div>
                <div className={historyExpanded
                  ? "grid min-w-[1000px] grid-cols-[repeat(20,minmax(0,1fr))] gap-x-2 gap-y-3 text-center text-xs font-medium tabular-nums"
                  : "grid w-max min-w-full grid-flow-col auto-cols-max gap-x-4 text-center text-xs font-medium tabular-nums"}
                >
                  {(historyExpanded ? multiplierHistory : multiplierHistory.slice(0, 20)).map((value, index) => (
                    <span
                      key={`${index}-${value}`}
                      className="whitespace-nowrap"
                      style={{ color: value >= 10 ? "#eb19cf" : value >= 2 ? "#8c45f5" : "#16baff" }}
                    >
                      {value.toFixed(2)}x
                    </span>
                  ))}
                </div>
              </div>

              <div className={`aviator-flight-scene relative overflow-hidden rounded-[18px] border border-[#312b3c] bg-[#0d0d12]`} data-state={status}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]" />

                <div className="relative z-10 flex min-h-[430px] items-center justify-center">
                  <div className="relative h-[260px] w-full max-w-[760px]">
                    <div className="absolute inset-x-0 bottom-8 top-0" style={{ clipPath: "polygon(0 100%, 100% 100%, 100% 0, 0 0)" }}>
                      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.2),rgba(255,255,255,0.02),rgba(0,0,0,0.2))]" />
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center text-center">
                      <div>
                        <div className={`mb-3 text-lg font-bold uppercase tracking-[0.14em] text-[#e7e0ee] ${status === "crashed" ? "aviator-crash-label" : ""}`}>
                          {status === "crashed" ? "Flew Away!" : status === "flying" ? "Flight live" : "Ready to launch"}
                        </div>
                        <div className="text-[7rem] font-black leading-none tracking-[-0.08em] text-[#ff2b2b] drop-shadow-[0_0_30px_rgba(255,43,43,0.35)]">
                          {multiplier.toFixed(2)}x
                        </div>
                        {status === "crashed" && (
                          <div className="aviator-next-round mt-5">
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b8afc8]">Next flight</div>
                            <div
                              role="progressbar"
                              aria-label="Time until next flight"
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-valuenow={Math.round(nextRoundProgress)}
                              className="mx-auto mt-3 h-2 w-48 max-w-full overflow-hidden rounded-full bg-[#342e3d]"
                            >
                              <div
                                className="h-full rounded-full bg-[#43e58c] shadow-[0_0_12px_rgba(67,229,140,0.55)] transition-[width] duration-200 ease-linear"
                                style={{ width: `${nextRoundProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 px-4 pb-4">
                  <div className="mx-auto max-w-[760px] rounded-2xl border border-[#3a3543] bg-[#242229] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <div className="mx-auto flex h-9 max-w-[360px] items-center rounded-full bg-[#2d2b30] p-1">
                      <button
                        type="button"
                        onClick={() => setBetPanelMode("bet")}
                        className={`flex h-full flex-1 items-center justify-center rounded-full text-sm font-bold transition ${betPanelMode === "bet" ? "bg-[#40414a] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" : "text-[#b7afc4]"}`}
                      >
                        Bet
                      </button>
                      <button
                        type="button"
                        onClick={() => setBetPanelMode("auto")}
                        className={`flex h-full flex-1 items-center justify-center rounded-full text-sm font-bold transition ${betPanelMode === "auto" ? "bg-[#40414a] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" : "text-[#b7afc4]"}`}
                      >
                        Auto
                      </button>
                    </div>

                    <div className="mx-auto mt-2 flex max-w-[760px] items-center justify-between rounded-lg border border-[#3a3543] bg-[#1d1b22] px-3 py-2 text-xs">
                      <span className="inline-flex items-center gap-1.5 text-[#b9b2c3]"><Wallet size={14} /> Wallet balance</span>
                      <span className="font-semibold tabular-nums text-white">
                        {userId ? `UGX ${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "Sign in to view balance"}
                      </span>
                    </div>

                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {betCards.map((card, cardIndex) => {
                        const canCashOut = card.hasBet;
                        const actionLabel = canCashOut
                          ? "Cash out"
                          : card.pendingStake > 0
                            ? "Locked"
                            : card.hasCashedOut && status === "flying"
                              ? "Cashed out"
                              : "Place bet";
                        const actionAmount = canCashOut
                          ? currentPayouts[cardIndex]
                          : card.pendingStake > 0
                            ? card.pendingStake
                            : card.stake;

                        return (
                          <article key={cardIndex} className="rounded-xl border border-[#37363d] bg-[#1d1d22] p-2">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-xs font-semibold text-[#d8d2df]">Bet {cardIndex + 1}</span>
                              <span className="text-[10px] uppercase tracking-wide text-[#a9a2af]">
                                {canCashOut ? "Live" : card.pendingStake > 0 ? "Next round" : "Ready"}
                              </span>
                            </div>

                            {betPanelMode === "bet" ? (
                              <>
                                <div className="flex items-center gap-2 rounded-lg border border-[#37363d] bg-[#17171b] p-1">
                                  <button type="button" aria-label={`Decrease Bet ${cardIndex + 1} stake`} onClick={() => updateStake(cardIndex, card.stake - 100)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#29292f] text-xl text-white">−</button>
                                  <div className="min-w-0 flex-1 text-center text-lg font-black tabular-nums text-white">{card.stake.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                  <button type="button" aria-label={`Increase Bet ${cardIndex + 1} stake`} onClick={() => updateStake(cardIndex, card.stake + 100)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#29292f] text-xl text-white">+</button>
                                </div>
                                <div className="mt-2 grid grid-cols-4 gap-1">
                                  {quickStakeValues.slice(1).map((value) => (
                                    <button key={value} type="button" onClick={() => updateStake(cardIndex, value)} className={`rounded-md border px-1 py-1 text-[10px] font-semibold ${card.stake === value ? "border-[#4eb97d] bg-[#1c4030] text-[#dfffe8]" : "border-[#34343a] bg-[#121317] text-[#f3f0f8]"}`}>
                                      {value.toLocaleString()}
                                    </button>
                                  ))}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => canCashOut ? cashOut(cardIndex) : void placeBet(cardIndex)}
                                  disabled={status === "flying" && !canCashOut || card.pendingStake > 0}
                                  className={`mt-2 flex h-12 w-full items-center justify-between rounded-lg border px-3 transition ${canCashOut ? "border-[#30af59] bg-[#32db74] text-[#071d11] hover:bg-[#4ef38b]" : "border-[#249e4c] bg-[#35d972] text-[#04180d] hover:bg-[#49eb82]"} disabled:cursor-not-allowed disabled:opacity-50`}
                                >
                                  <span className="text-sm font-black">{actionLabel}</span>
                                  <span className="text-sm font-bold tabular-nums">{actionAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} UGX</span>
                                </button>
                              </>
                            ) : (
                              <>
                                <div className="grid grid-cols-2 gap-1.5">
                                  <button type="button" onClick={() => setBetCards((current) => current.map((item, index) => index === cardIndex ? { ...item, autoBet: !item.autoBet } : item))} className={`rounded-lg border px-2 py-2 text-[11px] font-semibold ${card.autoBet ? "border-[#43e58c] bg-[#43e58c]/15 text-[#43e58c]" : "border-[#3f354d] bg-[#231f2d] text-[#f0ebf7]"}`}>
                                    Auto bet {card.autoBet ? "On" : "Off"}
                                  </button>
                                  <button type="button" onClick={() => setBetCards((current) => current.map((item, index) => index === cardIndex ? { ...item, autoCashout: !item.autoCashout } : item))} className={`rounded-lg border px-2 py-2 text-[11px] font-semibold ${card.autoCashout ? "border-[#7dd3fc] bg-[#7dd3fc]/15 text-[#7dd3fc]" : "border-[#3f354d] bg-[#231f2d] text-[#f0ebf7]"}`}>
                                    Auto cashout {card.autoCashout ? "On" : "Off"}
                                  </button>
                                </div>
                                <label className="mt-2 flex h-9 items-center justify-between rounded-lg border border-[#3f354d] bg-[#231f2d] px-2 text-xs text-[#b4aabd]">
                                  Cash out at
                                  <input type="number" min={1.1} step={0.1} value={card.autoCashoutAt} onChange={(event) => setBetCards((current) => current.map((item, index) => index === cardIndex ? { ...item, autoCashoutAt: Math.max(1.1, Number(event.target.value || 1.1)) } : item))} className="w-16 bg-transparent text-right font-semibold text-[#f0ebf7] outline-none" aria-label={`Bet ${cardIndex + 1} auto cashout multiplier`} />
                                  <span className="font-semibold text-[#7dd3fc]">x</span>
                                </label>
                                <button type="button" onClick={() => canCashOut ? cashOut(cardIndex) : void placeBet(cardIndex)} disabled={status === "flying" && !canCashOut || card.pendingStake > 0} className={`mt-2 flex h-12 w-full items-center justify-between rounded-lg border px-3 ${canCashOut ? "border-[#30af59] bg-[#32db74] text-[#071d11]" : "border-[#249e4c] bg-[#35d972] text-[#04180d]"} disabled:cursor-not-allowed disabled:opacity-50`}>
                                  <span className="text-sm font-black">{actionLabel}</span>
                                  <span className="text-sm font-bold tabular-nums">{actionAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} UGX</span>
                                </button>
                              </>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr]">
                <div className="flex items-center justify-between rounded-xl border border-[#312b3c] bg-[#17131c] px-4 py-3 text-sm">
                  <div className="flex items-center gap-2 text-[#d7d0dd]">
                    <Wallet size={16} className="text-[#7dd3fc]" />
                    Balance
                  </div>
                  <span className="font-semibold text-[#f0edf6]">{userId ? `UGX ${balance.toLocaleString()}` : "Sign in to view balance"}</span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-[#312b3c] bg-[#17131c] px-4 py-3 text-sm">
                  <div className="flex items-center gap-2 text-[#d7d0dd]">
                    <BarChart3 size={16} className="text-[#ffb84d]" />
                    Round
                  </div>
                  <span className="font-semibold text-[#ff2b2b]">{betSummary}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[#312b3c] bg-[#17131c] p-3 text-sm text-[#d7d0dd]">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[#b4aabd]">Mode</div>
                  <div className="mt-1 font-semibold text-[#f0edf6]">{displayMode} account</div>
                </div>
                <span className="text-xs text-[#a9a2af]">Two independent bet cards</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
