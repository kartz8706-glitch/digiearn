"use client";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { onAuthStateChanged } from "firebase/auth";
import { FormEvent, useEffect, useState } from "react";
import { firebaseAuth } from "@/lib/firebase";
import { fetchUserProfile, saveUserProfile } from "@/lib/firestoreData";

type Profile = { name?: string; email?: string; phone?: string };

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>({});
  const [message, setMessage] = useState("");

  useEffect(() => onAuthStateChanged(firebaseAuth, async (user) => {
    if (!user) return;
    const stored = await fetchUserProfile<Profile>(user.uid, {});
    setProfile({
      name: stored.name || user.displayName || "",
      email: stored.email || user.email || "",
      phone: stored.phone || "",
    });
  }), []);

  async function save(event: FormEvent) {
    event.preventDefault();
    const user = firebaseAuth.currentUser;
    if (!user) {
      setMessage("Sign in to update your profile.");
      return;
    }
    await saveUserProfile(user.uid, profile);
    setMessage("Profile saved to Firebase.");
  }

  return <>
    <Navbar />
    <Sidebar />
    <main className="min-h-screen px-6 pt-24">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">Profile</h1>
        <form onSubmit={save} className="mt-8 rounded-2xl border border-[#1c3026] bg-[#0c1813] p-6">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#43e58c] text-3xl font-bold text-black">{(profile.name || "D").charAt(0).toUpperCase()}</div>
            <div><h2 className="text-xl font-semibold">{profile.name || "Your profile"}</h2><p className="text-gray-500">{profile.email || "Signed-in Firebase user"}</p></div>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <label className="text-sm text-gray-500">Full name<input value={profile.name || ""} onChange={(event) => setProfile({ ...profile, name: event.target.value })} className="mt-2 w-full rounded-xl border border-[#1c3026] bg-[#07110d] p-3 text-white outline-none focus:border-[#43e58c]" /></label>
            <label className="text-sm text-gray-500">Email<input value={profile.email || ""} readOnly className="mt-2 w-full rounded-xl border border-[#1c3026] bg-[#07110d] p-3 text-gray-400 outline-none" /></label>
            <label className="text-sm text-gray-500">Phone number<input value={profile.phone || ""} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} className="mt-2 w-full rounded-xl border border-[#1c3026] bg-[#07110d] p-3 text-white outline-none focus:border-[#43e58c]" /></label>
          </div>
          <button type="submit" className="mt-6 rounded-xl bg-[#43e58c] px-6 py-3 font-semibold text-black">Save changes</button>
          {message && <p className="mt-3 text-sm text-[#43e58c]">{message}</p>}
        </form>
      </div>
    </main>
  </>;
}
