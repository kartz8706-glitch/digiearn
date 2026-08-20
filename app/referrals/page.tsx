"use client";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import {
  getUserReferralData,
  initializeReferralData,
  copyReferralCode,
  getReferralShareLink,
  formatReferralUgx,
  referralStateEvent,
  type ReferralData,
} from "@/lib/referralStore";
import { fetchUserProfile } from "@/lib/firestoreData";
import { firebaseAuth } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { Copy, Link2, Users, TrendingUp, Gift } from "lucide-react";

export default function ReferralPage() {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    return firebaseAuth.onAuthStateChanged(async (user) => {
      if (!user) return;

      const profile = await fetchUserProfile<{ name?: string } | null>(user.uid, null);
      setUserName(profile?.name || user.displayName || "User");

      // Initialize referral data if not exists
      let data = getUserReferralData();
      if (!data) {
        data = initializeReferralData(user.uid, profile?.name || user.displayName || "User");
      }
      setReferralData(data);
    });
  }, []);

  useEffect(() => {
    const updateReferralData = () => {
      const data = getUserReferralData();
      setReferralData(data);
    };

    window.addEventListener(referralStateEvent, updateReferralData);
    return () => window.removeEventListener(referralStateEvent, updateReferralData);
  }, []);

  const handleCopyCode = () => {
    if (referralData) {
      copyReferralCode(referralData.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareLink = referralData ? getReferralShareLink(referralData.referralCode) : "";

  return (
    <>
      <Navbar />
      <Sidebar />

      <main className="min-h-screen pt-24 md:ml-64 px-6 pb-10">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold">Referral Program</h1>
          <p className="mt-2 text-gray-500">
            Invite friends and earn rewards when they join and invest.
          </p>

          {referralData && (
            <>
              {/* Referral Code Section */}
              <div className="mt-8 glass-card stat-card-hover rounded-2xl p-8">
                <div className="text-center">
                  <p className="text-sm text-gray-400 uppercase tracking-wider">Your Referral Code</p>
                  
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <code className="text-4xl font-bold text-[#43e58c] tracking-widest">
                      {referralData.referralCode}
                    </code>
                    <button
                      onClick={handleCopyCode}
                      className="rounded-lg bg-[#43e58c]/15 p-3 text-[#43e58c] hover:bg-[#43e58c]/25 transition"
                      title="Copy code"
                    >
                      <Copy size={20} />
                    </button>
                  </div>

                  <p className="mt-4 text-sm text-gray-400">
                    Share this code with friends to earn rewards
                  </p>

                  {copied && (
                    <p className="mt-3 text-sm text-[#43e58c] font-medium animate-pulse">
                      ✓ Code copied to clipboard!
                    </p>
                  )}
                </div>

                {/* Share Link */}
                <div className="mt-8 border-t border-[#1c3026] pt-8">
                  <p className="text-sm text-gray-400 mb-3">Share your referral link</p>
                  <div className="flex gap-2 flex-col sm:flex-row">
                    <input
                      type="text"
                      value={shareLink}
                      readOnly
                      className="flex-1 rounded-lg border border-[#1c3026] bg-[#07110d] p-3 text-sm text-gray-400 focus:border-[#43e58c]"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(shareLink);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="rounded-lg bg-[#43e58c] px-4 py-3 text-sm font-semibold text-black hover:bg-[#c7f36b] transition"
                    >
                      <Link2 size={16} className="inline mr-2" />
                      Copy Link
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="stat-card-hover rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#43e58c]/10 text-[#43e58c]">
                      <Users size={20} />
                    </div>
                    <p className="text-sm text-gray-400">Referrals</p>
                  </div>
                  <p className="text-3xl font-bold">{referralData.referralCount}</p>
                  <p className="mt-2 text-xs text-gray-500">
                    {referralData.referralCount === 1
                      ? "1 friend joined"
                      : `${referralData.referralCount} friends joined`}
                  </p>
                </div>

                <div className="stat-card-hover rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#c7f36b]/10 text-[#c7f36b]">
                      <Gift size={20} />
                    </div>
                    <p className="text-sm text-gray-400">Earned</p>
                  </div>
                  <p className="text-2xl font-bold text-[#c7f36b]">
                    {formatReferralUgx(referralData.totalRewardEarned)}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">Total rewards</p>
                </div>

                <div className="stat-card-hover rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#7dd3fc]/10 text-[#7dd3fc]">
                      <TrendingUp size={20} />
                    </div>
                    <p className="text-sm text-gray-400">Avg Reward</p>
                  </div>
                  <p className="text-2xl font-bold text-[#7dd3fc]">
                    {referralData.referralCount > 0
                      ? formatReferralUgx(
                          Math.round(referralData.totalRewardEarned / referralData.referralCount)
                        )
                      : formatReferralUgx(0)}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">Per referral</p>
                </div>
              </div>

              {/* How It Works */}
              <div className="mt-8 rounded-2xl border border-[#1c3026] bg-[#0c1813] p-6">
                <h2 className="text-lg font-semibold mb-4">How It Works</h2>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#43e58c]/10 text-[#43e58c] font-semibold">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Share your referral code</p>
                      <p className="text-sm text-gray-400">Give your code to friends or share the link</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#43e58c]/10 text-[#43e58c] font-semibold">
                      2
                    </div>
                    <div>
                      <p className="font-medium">They join using your code</p>
                      <p className="text-sm text-gray-400">Your friends sign up with your referral code</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#43e58c]/10 text-[#43e58c] font-semibold">
                      3
                    </div>
                    <div>
                      <p className="font-medium">They make their first deposit</p>
                      <p className="text-sm text-gray-400">When they deposit, you earn 5% of their deposit</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#43e58c]/10 text-[#43e58c] font-semibold">
                      4
                    </div>
                    <div>
                      <p className="font-medium">Rewards added to your balance</p>
                      <p className="text-sm text-gray-400">Referral bonuses are instantly added to your account</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Referrals List */}
              {referralData.referrers.length > 0 && (
                <div className="mt-8 rounded-2xl border border-[#1c3026] bg-[#0c1813] p-6">
                  <h2 className="text-lg font-semibold mb-6">Your Referrals</h2>
                  <div className="space-y-3">
                    {referralData.referrers.map((referral) => (
                      <div
                        key={referral.userId}
                        className="glass-card rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{referral.userName}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              Joined {new Date(referral.joinedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-[#43e58c]">
                              +{formatReferralUgx(referral.rewardEarned)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              From {formatReferralUgx(referral.depositAmount)} deposit
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {referralData.referrers.length === 0 && (
                <div className="empty-state mt-8 rounded-2xl border border-[#1c3026] bg-[#0c1813] p-12">
                  <div className="empty-state-icon">
                    <Users className="w-full h-full" />
                  </div>
                  <h2 className="empty-state-title">No Referrals Yet</h2>
                  <p className="empty-state-description">
                    Start sharing your referral code to earn rewards when friends join and invest.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
