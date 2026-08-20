import { firebaseAuth } from "@/lib/firebase";
import { mirrorToDatabase } from "@/lib/firebaseData";
import { fetchUserProfile, saveUserProfile } from "@/lib/firestoreData";

export type Transaction = {
  id: string;
  type: "Deposit" | "Withdrawal" | "Investment";
  asset: string;
  amount: number;
  createdAt: string;
  status: "Approved" | "Completed";
};

export const transactionStateEvent = "transaction-state-changed";

const transactionsKeyPrefix = "digi-earn-transactions";

function getUserTransactionsKey(userId = firebaseAuth.currentUser?.uid || "anonymous") {
  return `${transactionsKeyPrefix}-${userId}`;
}

function cacheTransactions(userId: string, transactions: Transaction[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getUserTransactionsKey(userId), JSON.stringify(transactions));
}

export function readTransactions() {
  if (typeof window === "undefined") return [];

  const storedTransactions = window.localStorage.getItem(getUserTransactionsKey());
  if (!storedTransactions) return [];

  try {
    return JSON.parse(storedTransactions) as Transaction[];
  } catch {
    return [];
  }
}

export async function syncTransactionsFromProfile() {
  if (typeof window === "undefined") return [];

  const userId = firebaseAuth.currentUser?.uid;
  if (!userId) return readTransactions();

  const profile = await fetchUserProfile<{ transactions?: Transaction[] } | null>(userId, null);
  const transactions = profile?.transactions ?? readTransactions();
  cacheTransactions(userId, transactions);
  window.dispatchEvent(new Event(transactionStateEvent));
  return transactions;
}

export async function addUserTransaction(userId: string, transaction: Transaction) {
  const profile = await fetchUserProfile<{ transactions?: Transaction[] } | null>(userId, null);
  const transactions = [transaction, ...(profile?.transactions ?? [])];

  cacheTransactions(userId, transactions);
  mirrorToDatabase(`users/${userId}/transactions`, transactions);
  await saveUserProfile(userId, { transactions });

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(transactionStateEvent));
  }
}

export function addCurrentUserTransaction(transaction: Transaction) {
  const userId = firebaseAuth.currentUser?.uid;
  if (!userId) return;
  void addUserTransaction(userId, transaction);
}
