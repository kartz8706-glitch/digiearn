"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useEffect } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Bell,
  LayoutDashboard,
  Menu,
  MessageCircle,
  ReceiptText,
  Search,
  TrendingUp,
  User,
  Wallet,
  X,
} from "lucide-react";
import {
  messageStateEvent,
  readUnreadUserMessages,
} from "@/lib/messageStore";

const links = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Investments", href: "/investments", icon: TrendingUp },
  { name: "Portfolio", href: "/portfolio", icon: Wallet },
  { name: "Transactions", href: "/transactions", icon: ReceiptText },
  { name: "Deposit", href: "/deposit", icon: ArrowDownToLine },
  { name: "Withdraw", href: "/withdraw", icon: ArrowUpFromLine },
  { name: "Profile", href: "/profile", icon: User },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const updateUnreadCount = () => setUnreadCount(readUnreadUserMessages().length);
    updateUnreadCount();
    window.addEventListener(messageStateEvent, updateUnreadCount);
    return () => window.removeEventListener(messageStateEvent, updateUnreadCount);
  }, []);

  return (
    <header className="nav-enter fixed top-0 left-0 right-0 z-50 border-b border-[#1c3026]/80 bg-[#07110d]/90 shadow-lg shadow-black/10 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6">
        <Link href="/" className="text-xl font-bold tracking-tight transition hover:-translate-y-0.5">
          digi<span className="text-[#43e58c]">.earn</span>
        </Link>

        <div className="hidden md:flex w-96 items-center gap-3 rounded-xl border border-[#1c3026] bg-[#0c1813] px-4 py-2">
          <Search size={18} className="text-gray-500" />
          <input
            placeholder="Search investments..."
            className="w-full bg-transparent outline-none text-sm"
          />
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden text-sm text-gray-400 hover:text-white md:block">
            Sign in
          </Link>

          <button
            type="button"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-lg p-2 text-gray-400 hover:bg-[#102019] hover:text-white md:hidden"
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>

          <button type="button" aria-label={`${unreadCount} unread messages`} className="relative rounded-lg p-2">
            <Bell size={20} className="text-gray-400 hover:text-white" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c7f36b] px-1 text-[10px] font-bold text-black">
                {unreadCount}
              </span>
            )}
          </button>

          <Link
            href="/dashboard#messages"
            aria-label="Open messages"
            title="Messages"
            className="relative rounded-lg p-2 text-gray-400 hover:bg-[#102019] hover:text-white"
          >
            <MessageCircle size={20} />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#c7f36b]" />
            )}
          </Link>

          <Link
            href="/profile"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#43e58c] font-bold text-black"
          >
            K
          </Link>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-[#1c3026] bg-[#09130f] p-4 md:hidden">
          <div className="space-y-2">
            {links.map((link) => {
              const Icon = link.icon;
              const active =
                pathname === link.href ||
                (link.href !== "/dashboard" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                    active
                      ? "bg-[#43e58c] font-semibold text-black"
                      : "text-gray-400 hover:bg-[#102019] hover:text-white"
                  }`}
                >
                  <Icon size={19} />
                  {link.name}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}