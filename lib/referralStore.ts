import { firebaseAuth } from "@/lib/firebase";
import { fetchUserProfile, saveUserProfile } from "@/lib/firestoreData";
import { mirrorToDatabase } from "@/lib/firebaseData";

export type ReferralData = {
  id: string;
  userId: string;
  referralCode: string;
  referrers: {
    userId: string;
    userName: string;
    joinedAt: string;
    depositAmount: number;
    rewardEarned: number;
  }[];
  referralCount: number;
  totalRewardEarned: number;
  createdAt: string;
};

export const referralStateEvent = "referral-state-changed";

const referralPrefix = "digi-earn-referrals";

function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function getUserReferralData(): ReferralData | null {
  if (typeof window === "undefined") return null;

  const userId = firebaseAuth.currentUser?.uid;
  if (!userId) return null;

  const stored = window.localStorage.getItem(`${referralPrefix}-${userId}`);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as ReferralData;
  } catch {
    return null;
  }
}

export function initializeReferralData(userId: string, userName: string): ReferralData {
  if (typeof window === "undefined") {
    return {
      id: `ref-${Date.now()}`,
      userId,
      referralCode: generateReferralCode(),
      referrers: [],
      referralCount: 0,
      totalRewardEarned: 0,
      createdAt: new Date().toISOString(),
    };
  }

  const existingData = window.localStorage.getItem(`${referralPrefix}-${userId}`);
  if (existingData) {
    try {
      return JSON.parse(existingData) as ReferralData;
    } catch {
      // Continue to create new data
    }
  }

  const newData: ReferralData = {
    id: `ref-${Date.now()}`,
    userId,
    referralCode: generateReferralCode(),
    referrers: [],
    referralCount: 0,
    totalRewardEarned: 0,
    createdAt: new Date().toISOString(),
  };

  window.localStorage.setItem(`${referralPrefix}-${userId}`, JSON.stringify(newData));
  mirrorToDatabase(`users/${userId}/referral`, newData);
  window.dispatchEvent(new Event(referralStateEvent));

  return newData;
}

export async function processReferral(
  newUserId: string,
  newUserName: string,
  referralCode: string,
  initialDeposit: number = 0
) {
  if (typeof window === "undefined") return;

  // Find the referrer by code
  const allStorageKeys = Object.keys(window.localStorage);
  let referrerId: string | null = null;

  for (const key of allStorageKeys) {
    if (key.startsWith(referralPrefix)) {
      try {
        const data = JSON.parse(window.localStorage.getItem(key) || "") as ReferralData;
        if (data.referralCode === referralCode) {
          referrerId = data.userId;
          break;
        }
      } catch {
        continue;
      }
    }
  }

  if (!referrerId) return;

  // Get referrer's data
  const referrerData = window.localStorage.getItem(`${referralPrefix}-${referrerId}`);
  if (!referrerData) return;

  try {
    const data = JSON.parse(referrerData) as ReferralData;
    
    // Calculate reward: 5% of user's first deposit or 50 UGX minimum
    const rewardAmount = Math.max(initialDeposit * 0.05, 50);

    // Add new referral
    data.referrers.push({
      userId: newUserId,
      userName: newUserName,
      joinedAt: new Date().toISOString(),
      depositAmount: initialDeposit,
      rewardEarned: rewardAmount,
    });

    data.referralCount += 1;
    data.totalRewardEarned += rewardAmount;

    // Save referrer data
    window.localStorage.setItem(`${referralPrefix}-${referrerId}`, JSON.stringify(data));
    mirrorToDatabase(`users/${referrerId}/referral`, data);

    // Add bonus to referrer's balance
    const referrerProfile = await fetchUserProfile<{
      balance?: number;
      referralBonus?: number;
    } | null>(referrerId, null);

    const currentBalance = Number(referrerProfile?.balance ?? 0);
    const currentBonus = Number(referrerProfile?.referralBonus ?? 0);

    await saveUserProfile(referrerId, {
      balance: currentBalance + rewardAmount,
      referralBonus: currentBonus + rewardAmount,
    });

    window.dispatchEvent(new Event(referralStateEvent));
  } catch {
    return;
  }
}

export function copyReferralCode(code: string): void {
  if (typeof window === "undefined") return;
  navigator.clipboard.writeText(code);
}

export function getReferralShareLink(code: string): string {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  return `${baseUrl}/signup?ref=${code}`;
}

export function formatReferralUgx(amount: number): string {
  return `UGX ${amount.toLocaleString("en-UG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
