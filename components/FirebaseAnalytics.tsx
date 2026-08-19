"use client";

import { useEffect } from "react";
import { initializeAnalytics } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";
import { clearLegacyInvestmentData } from "@/lib/investmentStore";

export default function FirebaseAnalytics() {
  useEffect(() => {
    void initializeAnalytics();
    return onAuthStateChanged(firebaseAuth, () => {
      clearLegacyInvestmentData();
      window.dispatchEvent(new Event("firebase-auth-state-changed"));
    });
  }, []);

  return null;
}
