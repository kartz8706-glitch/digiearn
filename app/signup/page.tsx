"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { ArrowRight, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase";
import { saveUserProfile } from "@/lib/firestoreData";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name || !email || !phone || password.length < 6) {
      setMessage("Enter your name, email, phone number, and a password with at least 6 characters.");
      return;
    }

    try {
      const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      await updateProfile(credential.user, { displayName: name });
      await saveUserProfile(credential.user.uid, {
        id: credential.user.uid,
        name,
        email,
        phone,
        role: "user",
        balance: 0,
        createdAt: new Date().toISOString(),
      });
      setMessage("Account created successfully. Opening your dashboard...");
      window.setTimeout(() => window.location.assign("/dashboard"), 500);
    } catch {
      setMessage("Unable to create your account. The email may already be in use.");
    }
  }

  return (
    <main className="min-h-screen bg-[#07110d] px-6 py-8 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="text-xl font-bold text-white">
          digi<span className="text-[#43e58c]">.earn</span>
        </Link>
        <Link href="/login" className="text-sm text-gray-400 hover:text-white">
          Sign in
        </Link>
      </div>

      <div className="mx-auto grid min-h-[calc(100vh-100px)] max-w-6xl items-center gap-12 py-12 lg:grid-cols-[1fr_420px]">
        <section className="hidden lg:block">
          <p className="text-sm font-medium tracking-[0.2em] text-[#43e58c]">START SIMULATING</p>
          <h1 className="mt-4 max-w-xl text-5xl font-bold tracking-tight">Learn the market by building your own portfolio.</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-gray-400">Create a free simulator account and explore investments, locked returns, deposits, and withdrawals in one place.</p>
        </section>

        <section className="rounded-2xl border border-[#1c3026] bg-[#0c1813] p-6 shadow-2xl shadow-black/20 sm:p-8">
          <div className="mb-8">
            <p className="text-lg font-bold text-white">
              digi<span className="text-[#43e58c]">.earn</span>
            </p>
            <h1 className="text-3xl font-bold">Create account</h1>
            <p className="mt-2 text-sm text-gray-500">Start with a simulated UGX portfolio.</p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <label className="block text-sm text-gray-400">
              Full name
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#1c3026] bg-[#07110d] px-4 focus-within:border-[#43e58c]">
                <UserRound size={18} className="text-gray-500" />
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className="w-full bg-transparent py-4 text-white outline-none" />
              </div>
            </label>

            <label className="block text-sm text-gray-400">
              Phone number
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#1c3026] bg-[#07110d] px-4 focus-within:border-[#43e58c]">
                <Phone size={18} className="text-gray-500" />
                <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+256 700 000 000" className="w-full bg-transparent py-4 text-white outline-none" />
              </div>
            </label>

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
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" className="w-full bg-transparent py-4 text-white outline-none" />
              </div>
            </label>

            <button type="submit" className="w-full rounded-xl bg-[#43e58c] px-5 py-4 font-semibold text-black transition hover:opacity-90">
              Create account <ArrowRight size={18} className="ml-2 inline" />
            </button>
          </form>

          {message && <p className="mt-4 text-sm text-[#43e58c]">{message}</p>}
          <p className="mt-7 text-center text-sm text-gray-500">Already have an account? <Link href="/login" className="text-[#43e58c] hover:underline">Sign in</Link></p>
        </section>
      </div>
    </main>
  );
}
