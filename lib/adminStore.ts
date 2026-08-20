import {
  adjustBalance,
  investmentStateEvent,
  readBalance,
} from "@/lib/investmentStore";
import { fetchFromDatabase, mirrorToDatabase } from "@/lib/firebaseData";
import { firebaseAuth } from "@/lib/firebase";
import { deleteUserProfile, fetchUserProfile, saveUserProfile } from "@/lib/firestoreData";
import { addUserTransaction } from "@/lib/transactionStore";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  balance: number;
  portfolioValue?: number;
  totalInvested?: number;
  availableBalance?: number;
  todaysReturn?: number;
  status: "Active" | "Suspended";
};

export type AdminInvestment = {
  id: string;
  name: string;
  symbol: string;
  lockDays: number;
  multiplier: number;
  status: "Active" | "Paused";
};

export type AdminRequest = {
  id: string;
  userId?: string;
  user: string;
  type: "Deposit" | "Withdrawal";
  amount: number;
  status: "Pending" | "Approved" | "Rejected" | "Completed";
  createdAt: string;
};

export const adminStateEvent = "admin-state-changed";

const usersKey = "digi-earn-admin-users-v2";
const investmentsKey = "digi-earn-admin-investments-v2";
const requestsKey = "digi-earn-admin-requests-v2";

const defaultUsers: AdminUser[] = [];
const defaultInvestments: AdminInvestment[] = [];
const defaultRequests: AdminRequest[] = [];

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const stored = window.localStorage.getItem(key);
  if (!stored) return fallback;

  try {
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
}

async function write(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
  const databasePath = key.includes("users")
    ? "admin/users"
    : key.includes("investments")
      ? "admin/investments"
      : "admin/requests";
  await mirrorToDatabase(databasePath, value, { throwOnError: true });
  window.dispatchEvent(new Event(adminStateEvent));
}

export function readAdminUsers() {
  return read(usersKey, defaultUsers);
}

export function readAdminInvestments() {
  return read(investmentsKey, defaultInvestments);
}

export function readAdminRequests() {
  return read(requestsKey, defaultRequests);
}

export function addAdminUser(user: Omit<AdminUser, "id" | "balance" | "status">) {
  const createdUser = {
    ...user,
    id: `user-${Date.now()}`,
    balance: 0,
    status: "Active" as const,
  };
  write(usersKey, [...readAdminUsers(), createdUser]);
  void saveUserProfile(createdUser.id, createdUser);
}

export function addAdminInvestment(investment: Omit<AdminInvestment, "id" | "status">) {
  write(investmentsKey, [
    ...readAdminInvestments(),
    { ...investment, id: `asset-${Date.now()}`, status: "Active" },
  ]);
}

export function addAdminRequest(request: Omit<AdminRequest, "id" | "status" | "createdAt">) {
  const currentUser = firebaseAuth.currentUser;
  write(requestsKey, [
    ...readAdminRequests(),
    {
      ...request,
      userId: request.userId ?? currentUser?.uid,
      user: currentUser?.displayName || request.user,
      id: `request-${Date.now()}`,
      status: "Pending",
      createdAt: "Just now",
    },
  ]);
}

export function updateAdminUserStatus(id: string, status: AdminUser["status"]) {
  write(
    usersKey,
    readAdminUsers().map((user) => (user.id === id ? { ...user, status } : user))
  );
  void saveUserProfile(id, { status });
}

export function updateAdminUserBalance(id: string, balance: number) {
  void saveUserProfile(id, { balance });
  window.dispatchEvent(new Event(adminStateEvent));
}

export function updateAdminUserFinancials(
  id: string,
  financials: Pick<AdminUser, "portfolioValue" | "totalInvested" | "availableBalance" | "todaysReturn">
) {
  void saveUserProfile(id, financials);
  window.dispatchEvent(new Event(adminStateEvent));
}

export function deleteAdminUser(id: string) {
  void deleteUserProfile(id);
  window.dispatchEvent(new Event(adminStateEvent));
}

export function deleteAdminInvestment(id: string, investments: AdminInvestment[]) {
  write(
    investmentsKey,
    investments.filter((investment) => investment.id !== id)
  );
}

export async function updateRequestStatus(id: string, status: AdminRequest["status"]) {
  const remoteRequests = await fetchFromDatabase<
    AdminRequest[] | Record<string, AdminRequest>
  >("admin/requests", []);
  const requests = Array.isArray(remoteRequests)
    ? remoteRequests
    : Object.values(remoteRequests).length > 0
      ? Object.values(remoteRequests)
      : readAdminRequests();
  const request = requests.find((item) => item.id === id);

  if (!request) {
    return;
  }

  const users = readAdminUsers();
  const matchedUser =
    users.find((user) => user.id === request.userId) ??
    users.find((user) => user.name === request.user || user.email === request.user) ??
    null;
  const targetUserId = request.userId ?? matchedUser?.id ?? null;

  if (request.status === "Pending" && status === "Approved") {
    const profile = targetUserId
      ? await fetchUserProfile<{
          balance?: number;
          availableBalance?: number;
        } | null>(targetUserId, null)
      : null;

    const currentBalance = Number(
      profile?.availableBalance ??
        profile?.balance ??
        matchedUser?.availableBalance ??
        matchedUser?.balance ??
        readBalance()
    );

    if (request.type === "Withdrawal" && request.amount > currentBalance) {
      await write(
        requestsKey,
        requests.map((item) =>
          item.id === id ? { ...item, status: "Rejected" } : item
        )
      );
      return;
    }

    const nextBalance =
      request.type === "Deposit"
        ? currentBalance + request.amount
        : currentBalance - request.amount;

    if (targetUserId) {
      await saveUserProfile(targetUserId, {
        balance: nextBalance,
        availableBalance: nextBalance,
      });
      await addUserTransaction(targetUserId, {
        id: `transaction-${request.id}`,
        type: request.type,
        asset: request.type,
        amount: request.amount,
        createdAt: new Date().toISOString(),
        status: "Completed",
      });
    } else {
      adjustBalance(request.type === "Deposit" ? request.amount : -request.amount);
    }

    const nextUsers = users.map((user) => {
      if (!targetUserId && user.name !== request.user && user.id !== request.userId) {
        return user;
      }

      if (targetUserId && user.id !== targetUserId) {
        return user;
      }

      return {
        ...user,
        balance: nextBalance,
        availableBalance: nextBalance,
      };
    });

    await write(usersKey, nextUsers);
    await write(
      requestsKey,
      requests.map((item) =>
        item.id === id ? { ...item, status: "Completed" } : item
      )
    );
    window.dispatchEvent(new Event(investmentStateEvent));
    return;
  }

  await write(
    requestsKey,
    requests.map((item) => (item.id === id ? { ...item, status } : item))
  );
}

export function formatAdminUgx(amount: number) {
  return `UGX ${amount.toLocaleString("en-UG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
