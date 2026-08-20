"use client";

import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { onValue, ref } from "firebase/database";
import { firebaseAuth, firestoreDatabase, realtimeDatabase } from "@/lib/firebase";

const balanceKeyPrefix = "digi-earn-balance";
const investmentsKeyPrefix = "digi-earn-investments";
const transactionsKeyPrefix = "digi-earn-transactions";

function dispatch(name: string) {
  window.dispatchEvent(new Event(name));
}

function cacheProfile(userId: string, profile: Record<string, unknown>) {
  const balance = Number(profile.availableBalance ?? profile.balance ?? 0);
  const investments = Array.isArray(profile.investments) ? profile.investments : [];
  const transactions = Array.isArray(profile.transactions) ? profile.transactions : [];

  window.localStorage.setItem(`${balanceKeyPrefix}-${userId}`, String(balance));
  window.localStorage.setItem(`${investmentsKeyPrefix}-${userId}`, JSON.stringify(investments));
  window.localStorage.setItem(`${transactionsKeyPrefix}-${userId}`, JSON.stringify(transactions));

  dispatch("investment-state-changed");
  dispatch("transaction-state-changed");
  dispatch("firebase-auth-state-changed");
}

function cacheAdminData(path: string, value: unknown) {
  const key = path === "users" ? "digi-earn-admin-users-v2" :
    path === "investments" ? "digi-earn-admin-investments-v2" : "digi-earn-admin-requests-v2";
  window.localStorage.setItem(key, JSON.stringify(value ?? (path === "users" || path === "investments" ? [] : [])));
  dispatch("admin-state-changed");
}

export function startRealtimeSync() {
  if (typeof window === "undefined") return () => undefined;

  let stopProfile: (() => void) | undefined;
  const stopAdminListeners: Array<() => void> = [];

  const stopAuth = onAuthStateChanged(firebaseAuth, (user) => {
    stopProfile?.();
    stopProfile = undefined;
    stopAdminListeners.splice(0).forEach((unsubscribe) => unsubscribe());

    if (!user) return;

    stopProfile = onSnapshot(doc(firestoreDatabase, "users", user.uid), (snapshot) => {
      if (snapshot.exists()) cacheProfile(user.uid, snapshot.data());
    });

    const stopRequests = onValue(ref(realtimeDatabase, "admin/requests"), (snapshot) => {
      cacheAdminData("requests", snapshot.exists() ? snapshot.val() : []);
    });
    stopAdminListeners.push(stopRequests);

    if (window.localStorage.getItem("digi-earn-role") === "admin") {
      (["users", "investments"] as const).forEach((path) => {
        const unsubscribe = onValue(ref(realtimeDatabase, `admin/${path}`), (snapshot) => {
          cacheAdminData(path, snapshot.exists() ? snapshot.val() : []);
        });
        stopAdminListeners.push(unsubscribe);
      });
    }
  });

  return () => {
    stopAuth();
    stopProfile?.();
    stopAdminListeners.forEach((unsubscribe) => unsubscribe());
  };
}