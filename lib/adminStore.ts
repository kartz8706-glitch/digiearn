import { adjustBalance, readBalance } from "@/lib/investmentStore";
import { mirrorToDatabase } from "@/lib/firebaseData";
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
  status: "Pending" | "Approved" | "Rejected";
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

function write(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
  const databasePath = key.includes("users")
    ? "admin/users"
    : key.includes("investments")
      ? "admin/investments"
      : "admin/requests";
  mirrorToDatabase(databasePath, value);
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
  const requests = readAdminRequests();
  const request = requests.find((item) => item.id === id);
  const users = readAdminUsers();

  if (request?.status === "Pending" && status === "Approved") {
    const profile = request.userId
      ? await fetchUserProfile<{
          balance?: number;
          availableBalance?: number;
        } | null>(request.userId, null)
      : null;
    const currentBalance = Number(
      profile?.availableBalance ?? profile?.balance ?? readBalance()
    );

    if (request.type === "Withdrawal" && request.amount > currentBalance) {
      write(
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

    if (request.userId) {
      await saveUserProfile(request.userId, {
        balance: nextBalance,
        availableBalance: nextBalance,
      });
      await addUserTransaction(request.userId, {
        id: `transaction-${request.id}`,
        type: request.type,
        asset: request.type,
        amount: request.amount,
        createdAt: new Date().toISOString(),
        status: "Approved",
      });
    } else {
      adjustBalance(request.type === "Deposit" ? request.amount : -request.amount);
    }

    write(
      usersKey,
      users.map((user) =>
        user.id !== request.userId && user.name !== request.user
          ? user
          : {
              ...user,
              balance: nextBalance,
              availableBalance: nextBalance,
            }
      )
    );
  }

  write(
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
