"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ConversationPanel from "@/components/ConversationPanel";
import InvestmentTracker from "@/components/InvestmentTracker";
import { firebaseAuth } from "@/lib/firebase";
import { fetchUserProfile } from "@/lib/firestoreData";
import {
  investmentStateEvent,
  readInvestments,
  type Investment,
} from "@/lib/investmentStore";
import { onAuthStateChanged } from "firebase/auth";

export default function TrackerPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [userName, setUserName] = useState("Digi User");

  useEffect(() => {
    const updateInvestments = () => setInvestments(readInvestments());
    updateInvestments();
    window.addEventListener(investmentStateEvent, updateInvestments);
    window.addEventListener("firebase-auth-state-changed", updateInvestments);

    return () => {
      window.removeEventListener(investmentStateEvent, updateInvestments);
      window.removeEventListener("firebase-auth-state-changed", updateInvestments);
    };
  }, []);

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) return;
      setCurrentUserId(user.uid);
      const profile = await fetchUserProfile<{ name?: string } | null>(user.uid, null);
      setUserName(profile?.name || user.displayName || "Digi User");
    });
  }, []);

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="min-h-screen px-6 pb-10 pt-24 md:ml-64">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <p className="text-sm font-medium text-[#43e58c]">INVESTMENT TIMELINE</p>
            <h1 className="mt-2 text-3xl font-bold">Payout tracker</h1>
            <p className="mt-2 text-gray-500">See exactly how long each locked investment has before payout.</p>
          </div>
          <InvestmentTracker investments={investments} allowPayout />
          {currentUserId && (
            <div className="mt-8">
              <ConversationPanel
                userId={currentUserId}
                currentUserId={currentUserId}
                currentUserName={userName}
                currentRole="user"
                heading="Customer service"
                description="Chat directly with the digi.earn admin team."
              />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
