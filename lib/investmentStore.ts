export type Investment = {
  id: string;
  name: string;
  symbol: string;
  amount: number;
  maturityValue: number;
  price: string;
  change: string;
  investedAt: string;
  unlocksAt: string;
};

import { mirrorToDatabase } from "@/lib/firebaseData";
import { firebaseAuth } from "@/lib/firebase";
import { fetchUserProfile, saveUserProfile } from "@/lib/firestoreData";

export const startingBalance = 0;
export const investmentStateEvent = "investment-state-changed";

export function getMaturityMultiplier(lockDays: number) {
  return 6.97 + Math.max(0, lockDays - 30) * 0.5;
}

const balanceKeyPrefix = "digi-earn-balance";
const investmentsKeyPrefix = "digi-earn-investments";

function getUserStorageKeys() {
  const userId = firebaseAuth.currentUser?.uid || "anonymous";
  return {
    userId,
    balanceKey: `${balanceKeyPrefix}-${userId}`,
    investmentsKey: `${investmentsKeyPrefix}-${userId}`,
  };
}

function cacheBalance(balance: number) {
  const { balanceKey } = getUserStorageKeys();
  window.localStorage.setItem(balanceKey, String(balance));
}

function writeSharedBalance(balance: number) {
  const { userId } = getUserStorageKeys();
  if (typeof window !== "undefined") cacheBalance(balance);
  mirrorToDatabase(`users/${userId}/balance`, balance);
  if (userId !== "anonymous") {
    void saveUserProfile(userId, {
      balance,
      availableBalance: balance,
    });
  }
}

export function clearLegacyInvestmentData() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("kartz-invest-balance");
  window.localStorage.removeItem("kartz-invest-investments");
}

export function readBalance() {
  if (typeof window === "undefined") return startingBalance;

  const { balanceKey } = getUserStorageKeys();
  const storedBalance = window.localStorage.getItem(balanceKey);
  return storedBalance === null ? startingBalance : Number(storedBalance);
}

export async function syncBalanceFromProfile() {
  if (typeof window === "undefined") return startingBalance;

  const userId = firebaseAuth.currentUser?.uid;
  if (!userId) return readBalance();

  const profile = await fetchUserProfile<{
    balance?: number;
    availableBalance?: number;
  } | null>(userId, null);
  const sharedBalance = Number(
    profile?.availableBalance ?? profile?.balance ?? readBalance()
  );
  cacheBalance(sharedBalance);
  window.dispatchEvent(new Event(investmentStateEvent));
  return sharedBalance;
}

export function readInvestments(): Investment[] {
  if (typeof window === "undefined") return [];

  const { investmentsKey } = getUserStorageKeys();
  const storedInvestments = window.localStorage.getItem(investmentsKey);
  if (!storedInvestments) return [];

  try {
    const parsedInvestments = JSON.parse(storedInvestments) as Partial<Investment>[];

    return parsedInvestments.map((investment) => {
      const amount = Number(investment.amount) || 0;
      const investedAt = new Date(investment.investedAt || Date.now());
      const unlocksAt = new Date(investment.unlocksAt || investedAt);
      const lockDays = Math.max(
        30,
        Math.round((unlocksAt.getTime() - investedAt.getTime()) / 86400000)
      );

      return {
        ...investment,
        amount,
        maturityValue:
          Number(investment.maturityValue) ||
          amount * getMaturityMultiplier(lockDays),
        investedAt: investedAt.toISOString(),
        unlocksAt: unlocksAt.toISOString(),
      } as Investment;
    });
  } catch {
    return [];
  }
}

export function saveInvestment(investment: Investment) {
  const investments = readInvestments();
  investments.push(investment);
  localStorage.setItem("investments", JSON.stringify(investments));

  // Shared wallet balance
  const currentBalance = readBalance();
  const newBalance = Math.max(0, currentBalance - investment.amount);

  localStorage.setItem("balance", JSON.stringify(newBalance));

  window.dispatchEvent(new Event(investmentStateEvent));
}

export function adjustBalance(amount: number) {
  const nextBalance = readBalance() + amount;
  writeSharedBalance(nextBalance);
  window.dispatchEvent(new Event(investmentStateEvent));
}

export function formatUgx(amount: number | undefined | null) {
  const safeAmount = Number(amount) || 0;

  return `UGX ${safeAmount.toLocaleString("en-UG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
