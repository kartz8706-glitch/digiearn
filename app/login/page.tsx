"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  ArrowRight,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { firebaseAuth } from "@/lib/firebase";

const adminEmail = "kartz8706@gmail.com";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!email || !password) {
      setMessage("Enter your email and password to continue.");
      return;
    }

    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const isAdmin = credential.user.email?.toLowerCase() === adminEmail;
      if (role === "admin" && !isAdmin) {
        await signOut(firebaseAuth);
        setMessage("This account is not authorized for the admin workspace.");
        return;
      }

      const destination = isAdmin ? "/admin" : "/dashboard";
      const resolvedRole = isAdmin ? "admin" : "user";
      window.localStorage.setItem("digi-earn-role", resolvedRole);
      setMessage(`Signed in as ${isAdmin ? "administrator" : "user"}. Opening your dashboard...`);
      window.setTimeout(() => window.location.assign(destination), 500);
    } catch {
      setMessage("Unable to sign in. Check your email and password.");
    }
  }

  return (
    <main className="min-h-screen bg-[#07110d] px-6 py-8 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="text-xl font-bold text-white">
          digi<span className="text-[#43e58c]">.earn</span>
        </Link>
        <Link href="/signup" className="text-sm text-gray-400 hover:text-white">
          Create account
        </Link>
      </div>

      <div className="mx-auto grid min-h-[calc(100vh-100px)] max-w-6xl items-center gap-12 py-12 lg:grid-cols-[1fr_420px]">
        <section className="hidden lg:block">
          <p className="text-sm font-medium tracking-[0.2em] text-[#43e58c]">WELCOME BACK</p>
          <h1 className="mt-4 max-w-xl text-5xl font-bold tracking-tight">Build your next investing habit.</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-gray-400">Return to your simulated portfolio, monitor locked investments, and keep learning at your own pace.</p>
        </section>

        <section className="rounded-2xl border border-[#1c3026] bg-[#0c1813] p-6 shadow-2xl shadow-black/20 sm:p-8">
          <div className="mb-8">
            <p className="text-lg font-bold text-white">
              digi<span className="text-[#43e58c]">.earn</span>
            </p>
            <h1 className="text-3xl font-bold">Sign in</h1>
            <p className="mt-2 text-sm text-gray-500">Choose your workspace to continue.</p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <fieldset>
              <legend className="text-sm text-gray-400">Account type</legend>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("user")}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm ${
                    role === "user"
                      ? "border-[#43e58c] bg-[#43e58c]/10 text-[#43e58c]"
                      : "border-[#1c3026] text-gray-400 hover:border-[#43e58c]/50"
                  }`}
                >
                  <UserRound size={17} />
                  User
                </button>
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm ${
                    role === "admin"
                      ? "border-[#43e58c] bg-[#43e58c]/10 text-[#43e58c]"
                      : "border-[#1c3026] text-gray-400 hover:border-[#43e58c]/50"
                  }`}
                >
                  <ShieldCheck size={17} />
                  Admin
                </button>
              </div>
            </fieldset>

            <label className="block text-sm text-gray-400">
              Email address
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#1c3026] bg-[#07110d] px-4 focus-within:border-[#43e58c]">
                <Mail size={18} className="text-gray-500" />
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="w-full bg-transparent py-4 text-white outline-none" />
              </div>
            </label>

            <label className="block text-sm text-gray-400">
              Password
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#1c3026] bg-[#07110d] px-4 focus-within:border-[#43e58c]">
                <LockKeyhole size={18} className="text-gray-500" />
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="w-full bg-transparent py-4 text-white outline-none" />
              </div>
            </label>

            <button type="submit" className="w-full rounded-xl bg-[#43e58c] px-5 py-4 font-semibold text-black transition hover:opacity-90">
              Sign in <ArrowRight size={18} className="ml-2 inline" />
            </button>
          </form>

          {message && <p className="mt-4 text-sm text-[#43e58c]">{message}</p>}
          <p className="mt-7 text-center text-sm text-gray-500">New to digi.earn? <Link href="/signup" className="text-[#43e58c] hover:underline">Create an account</Link></p>
        </section>
      </div>
    </main>
  );
}
