"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  LayoutDashboard,
  Mail,
  Plus,
  ShieldCheck,
  TrendingUp,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  addAdminInvestment,
  addAdminUser,
  adminStateEvent,
  formatAdminUgx,
  updateAdminUserStatus,
  updateRequestStatus,
  type AdminInvestment,
  type AdminRequest,
  type AdminUser,
} from "@/lib/adminStore";
import { readAdminMessages, sendAdminMessage, type Message } from "@/lib/messageStore";
import { fetchFromDatabase } from "@/lib/firebaseData";
import { fetchFirestoreUsers, fetchUserProfile } from "@/lib/firestoreData";
import { firebaseAuth } from "@/lib/firebase";

type AdminTab = "overview" | "users" | "investments" | "requests" | "messages";

export default function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>("overview");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [investments, setInvestments] = useState<AdminInvestment[]>([]);
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [adminName, setAdminName] = useState("Administrator");

  const refresh = async () => {
    const [firebaseInvestments, firebaseRequests] = await Promise.all([
      fetchFromDatabase<AdminInvestment[] | Record<string, AdminInvestment>>("admin/investments", []),
      fetchFromDatabase<AdminRequest[] | Record<string, AdminRequest>>("admin/requests", []),
    ]);

    const toArray = <T,>(value: T[] | Record<string, T>) =>
      Array.isArray(value) ? value : Object.values(value);

    setUsers(await fetchFirestoreUsers());
    setInvestments(toArray(firebaseInvestments));
    setRequests(toArray(firebaseRequests));
  };

  useEffect(() => {
    refresh();
    window.addEventListener(adminStateEvent, refresh);
    return () => window.removeEventListener(adminStateEvent, refresh);
  }, []);

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) return;
      const profile = await fetchUserProfile<{ name?: string } | null>(
        user.uid,
        null
      );
      setAdminName(profile?.name || user.displayName || "Administrator");
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#050d09] text-white">
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-[#1c3026] bg-[#07110d]/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-6">
          <Link href="/" className="text-xl font-bold tracking-tight">
            digi<span className="text-[#43e58c]">.earn</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-gray-500 md:block">{adminName}</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#43e58c] font-bold text-black">A</span>
          </div>
        </div>
      </header>

      <aside className="fixed bottom-0 left-0 top-16 hidden w-64 border-r border-[#1c3026] bg-[#07110d] p-4 md:block">
        <div className="mb-6 rounded-xl border border-[#43e58c]/20 bg-[#43e58c]/5 p-4">
          <div className="flex items-center gap-3">
            <ShieldCheck size={22} className="text-[#43e58c]" />
            <div><p className="text-sm font-semibold">Admin workspace</p><p className="text-xs text-gray-500">Platform control</p></div>
          </div>
        </div>
        <nav className="space-y-2">
          <AdminNavButton active={tab === "overview"} onClick={() => setTab("overview")} icon={<LayoutDashboard size={18} />}>Overview</AdminNavButton>
          <AdminNavButton active={tab === "users"} onClick={() => setTab("users")} icon={<Users size={18} />}>Users</AdminNavButton>
          <AdminNavButton active={tab === "investments"} onClick={() => setTab("investments")} icon={<TrendingUp size={18} />}>Investments</AdminNavButton>
          <AdminNavButton active={tab === "requests"} onClick={() => setTab("requests")} icon={<ArrowDownToLine size={18} />}>Approvals</AdminNavButton>
          <AdminNavButton active={tab === "messages"} onClick={() => setTab("messages")} icon={<Mail size={18} />}>Messages</AdminNavButton>
        </nav>
        <Link href="/dashboard" className="absolute bottom-5 left-4 right-4 rounded-xl border border-[#1c3026] px-4 py-3 text-center text-sm text-gray-400 hover:bg-[#102019] hover:text-white">Back to user dashboard</Link>
      </aside>

      <main className="page-enter px-6 pb-12 pt-24 md:ml-64">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div><p className="text-sm font-medium text-[#43e58c]">DIGI.EARN ADMINISTRATION</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Management center</h1><p className="mt-2 text-gray-500">Manage users, investment products, and account requests.</p></div>
            <div className="rounded-xl border border-[#1c3026] bg-[#0c1813] px-4 py-2"><p className="text-xs text-gray-500">Platform status</p><p className="mt-1 text-sm font-medium text-[#43e58c]">Operational</p></div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 md:hidden">
            <AdminNavButton active={tab === "overview"} onClick={() => setTab("overview")} icon={<LayoutDashboard size={17} />}>Overview</AdminNavButton>
            <AdminNavButton active={tab === "users"} onClick={() => setTab("users")} icon={<Users size={17} />}>Users</AdminNavButton>
            <AdminNavButton active={tab === "investments"} onClick={() => setTab("investments")} icon={<TrendingUp size={17} />}>Investments</AdminNavButton>
            <AdminNavButton active={tab === "requests"} onClick={() => setTab("requests")} icon={<ArrowDownToLine size={17} />}>Approvals</AdminNavButton>
            <AdminNavButton active={tab === "messages"} onClick={() => setTab("messages")} icon={<Mail size={17} />}>Messages</AdminNavButton>
          </div>

          {tab === "overview" && <Overview users={users} investments={investments} requests={requests} setTab={setTab} />}
          {tab === "users" && <UsersPanel users={users} />}
          {tab === "investments" && <InvestmentsPanel investments={investments} />}
          {tab === "requests" && <RequestsPanel requests={requests} />}
          {tab === "messages" && <MessagesPanel />}
        </div>
      </main>
    </div>
  );
}

function Overview({ users, investments, requests, setTab }: { users: AdminUser[]; investments: AdminInvestment[]; requests: AdminRequest[]; setTab: (tab: AdminTab) => void }) {
  const pending = requests.filter((request) => request.status === "Pending").length;
  const totalBalance = users.reduce((total, user) => total + user.balance, 0);

  return <>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric title="Users" value={String(users.length)} icon={<Users size={20} />} />
      <Metric title="User balances" value={formatAdminUgx(totalBalance)} icon={<WalletIcon />} />
      <Metric title="Investment products" value={String(investments.length)} icon={<TrendingUp size={20} />} />
      <Metric title="Pending approvals" value={String(pending)} icon={<ShieldCheck size={20} />} />
    </div>
    <div className="mt-6 grid gap-4 md:grid-cols-3">
      <ActionCard title="Add user" description="Create a user account with an active status." onClick={() => setTab("users")} icon={<UserPlus size={21} />} />
      <ActionCard title="Create investment" description="Publish a new lock period and multiplier." onClick={() => setTab("investments")} icon={<Plus size={21} />} />
      <ActionCard title="Review approvals" description="Approve or reject deposits and withdrawals." onClick={() => setTab("requests")} icon={<Check size={21} />} />
    </div>
  </>;
}

function UsersPanel({ users }: { users: AdminUser[] }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !email.trim()) return;
    addAdminUser({ name: name.trim(), email: email.trim() });
    setName("");
    setEmail("");
  }

  return <Panel title="Users" description="Create accounts and control account access.">
    <form onSubmit={submit} className="grid gap-3 border-b border-[#1c3026] p-5 md:grid-cols-[1fr_1fr_auto]">
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" className="rounded-xl border border-[#1c3026] bg-[#07110d] p-3 outline-none focus:border-[#43e58c]" />
      <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" className="rounded-xl border border-[#1c3026] bg-[#07110d] p-3 outline-none focus:border-[#43e58c]" />
      <button className="rounded-xl bg-[#43e58c] px-5 py-3 font-semibold text-black"><UserPlus size={17} className="mr-2 inline" />Add user</button>
    </form>
    <div className="divide-y divide-[#1c3026]">
      {users.map((user) => <div key={user.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{user.name}</p><p className="text-sm text-gray-500">{user.email} · {formatAdminUgx(user.balance)}</p></div><button onClick={() => updateAdminUserStatus(user.id, user.status === "Active" ? "Suspended" : "Active")} className={`rounded-lg px-3 py-2 text-sm ${user.status === "Active" ? "bg-[#43e58c]/10 text-[#43e58c]" : "bg-red-500/10 text-red-400"}`}>{user.status === "Active" ? "Suspend" : "Activate"}</button></div>)}
    </div>
  </Panel>;
}

function InvestmentsPanel({ investments }: { investments: AdminInvestment[] }) {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [lockDays, setLockDays] = useState("30");
  const [multiplier, setMultiplier] = useState("6.97");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !symbol.trim() || Number(lockDays) <= 0 || Number(multiplier) <= 0) return;
    addAdminInvestment({ name: name.trim(), symbol: symbol.trim().toUpperCase(), lockDays: Number(lockDays), multiplier: Number(multiplier) });
    setName("");
    setSymbol("");
  }

  return <Panel title="Investment products" description="Create the products users can invest in.">
    <form onSubmit={submit} className="grid gap-3 border-b border-[#1c3026] p-5 md:grid-cols-2 xl:grid-cols-5">
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Investment name" className="rounded-xl border border-[#1c3026] bg-[#07110d] p-3 outline-none focus:border-[#43e58c]" />
      <input value={symbol} onChange={(event) => setSymbol(event.target.value)} placeholder="Symbol" className="rounded-xl border border-[#1c3026] bg-[#07110d] p-3 outline-none focus:border-[#43e58c]" />
      <input type="number" min="1" value={lockDays} onChange={(event) => setLockDays(event.target.value)} placeholder="Lock days" className="rounded-xl border border-[#1c3026] bg-[#07110d] p-3 outline-none focus:border-[#43e58c]" />
      <input type="number" min="0.01" step="0.01" value={multiplier} onChange={(event) => setMultiplier(event.target.value)} placeholder="Multiplier" className="rounded-xl border border-[#1c3026] bg-[#07110d] p-3 outline-none focus:border-[#43e58c]" />
      <button className="rounded-xl bg-[#43e58c] px-5 py-3 font-semibold text-black"><Plus size={17} className="mr-2 inline" />Create</button>
    </form>
    <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">{investments.map((investment) => <div key={investment.id} className="rounded-xl border border-[#1c3026] p-4"><div className="flex justify-between"><div><p className="font-semibold">{investment.name}</p><p className="text-sm text-gray-500">{investment.symbol}</p></div><span className="text-sm text-[#43e58c]">{investment.status}</span></div><p className="mt-4 text-sm text-gray-400">Locked for {investment.lockDays} days</p><p className="mt-1 text-sm text-gray-400">Maturity multiplier: <span className="text-white">x {investment.multiplier.toFixed(2)}</span></p></div>)}</div>
  </Panel>;
}

function RequestsPanel({ requests }: { requests: AdminRequest[] }) {
  return <Panel title="Deposit and withdrawal approvals" description="Review pending requests before changing user balances.">
    <div className="divide-y divide-[#1c3026]">{requests.map((request) => <div key={request.id} className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-3"><div className={`rounded-xl p-3 ${request.type === "Deposit" ? "bg-[#43e58c]/10 text-[#43e58c]" : "bg-amber-400/10 text-amber-300"}`}>{request.type === "Deposit" ? <ArrowDownToLine size={19} /> : <ArrowUpFromLine size={19} />}</div><div><p className="font-medium">{request.type} · {request.user}</p><p className="text-sm text-gray-500">{formatAdminUgx(request.amount)} · {request.createdAt}</p></div></div><div className="flex items-center gap-2">{request.status === "Pending" ? <><button onClick={() => updateRequestStatus(request.id, "Approved")} className="rounded-lg bg-[#43e58c] px-3 py-2 text-sm font-semibold text-black"><Check size={15} className="mr-1 inline" />Approve</button><button onClick={() => updateRequestStatus(request.id, "Rejected")} className="rounded-lg border border-red-400/40 px-3 py-2 text-sm text-red-300"><X size={15} className="mr-1 inline" />Reject</button></> : <span className={request.status === "Approved" ? "text-sm text-[#43e58c]" : "text-sm text-red-300"}>{request.status}</span>}</div></div>)}</div>
  </Panel>;
}

function MessagesPanel() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [replies, setReplies] = useState<Message[]>([]);

  useEffect(() => {
    const updateReplies = () => setReplies(readAdminMessages());
    updateReplies();
    window.addEventListener("message-state-changed", updateReplies);
    return () => window.removeEventListener("message-state-changed", updateReplies);
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!subject.trim() || !body.trim()) {
      setMessage("Enter a subject and message before sending.");
      return;
    }

    sendAdminMessage(subject.trim(), body.trim());
    setSubject("");
    setBody("");
    setMessage("Message sent to Digi User.");
  }

  return <Panel title="Messages" description="Send announcements and read user replies.">
    <form onSubmit={submit} className="space-y-4 p-5">
      <label className="block text-sm text-gray-400">Recipient
        <select className="mt-2 w-full rounded-xl border border-[#1c3026] bg-[#07110d] p-3 text-white outline-none focus:border-[#43e58c]">
          <option>Digi User</option>
        </select>
      </label>
      <label className="block text-sm text-gray-400">Subject
        <input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Message subject" className="mt-2 w-full rounded-xl border border-[#1c3026] bg-[#07110d] p-3 text-white outline-none focus:border-[#43e58c]" />
      </label>
      <label className="block text-sm text-gray-400">Message
        <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write an update for the user..." rows={5} className="mt-2 w-full resize-none rounded-xl border border-[#1c3026] bg-[#07110d] p-3 text-white outline-none focus:border-[#43e58c]" />
      </label>
      <button className="rounded-xl bg-[#43e58c] px-5 py-3 font-semibold text-black">Send message</button>
      {message && <p className="text-sm text-[#43e58c]">{message}</p>}
    </form>
    <div className="border-t border-[#1c3026] p-5">
      <h3 className="font-semibold">User replies</h3>
      <div className="mt-4 space-y-3">
        {replies.length === 0 && <p className="text-sm text-gray-500">No user replies yet.</p>}
        {replies.map((reply) => (
          <div key={reply.id} className="rounded-xl border border-[#1c3026] p-4">
            <div className="flex justify-between gap-3"><p className="font-medium">{reply.subject}</p><span className="text-xs text-gray-500">{reply.createdAt}</span></div>
            <p className="mt-2 text-sm text-gray-400">{reply.body}</p>
          </div>
        ))}
      </div>
    </div>
  </Panel>;
}

function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="surface lift-on-hover overflow-hidden rounded-2xl"><div className="border-b border-[#1c3026] p-6"><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm text-gray-500">{description}</p></div>{children}</section>;
}

function Metric({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return <div className="surface lift-on-hover stagger-item rounded-2xl p-5"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#43e58c]/10 text-[#43e58c]">{icon}</div><p className="mt-5 text-sm text-gray-500">{title}</p><p className="mt-1 text-2xl font-bold tracking-tight">{value}</p></div>;
}

function ActionCard({ title, description, icon, onClick }: { title: string; description: string; icon: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className="surface lift-on-hover stagger-item rounded-2xl p-5 text-left"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#43e58c]/10 text-[#43e58c]">{icon}</span><h2 className="mt-5 font-semibold">{title}</h2><p className="mt-2 text-sm text-gray-500">{description}</p></button>;
}

function AdminNavButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition hover:translate-x-1 ${active ? "bg-[#43e58c] font-semibold text-black" : "text-gray-400 hover:bg-[#102019] hover:text-white"}`}>{icon}{children}</button>;
}

function WalletIcon() {
  return <span className="text-lg">UGX</span>;
}

