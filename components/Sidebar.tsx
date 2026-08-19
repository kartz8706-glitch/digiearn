"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  ReceiptText,
  ArrowDownToLine,
  ArrowUpFromLine,
  User,
  Settings,
} from "lucide-react";

const userLinks = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Investments",
    href: "/investments",
    icon: TrendingUp,
  },
  {
    name: "Portfolio",
    href: "/portfolio",
    icon: Wallet,
  },
  {
    name: "Transactions",
    href: "/transactions",
    icon: ReceiptText,
  },
  {
    name: "Deposit",
    href: "/deposit",
    icon: ArrowDownToLine,
  },
  {
    name: "Withdraw",
    href: "/withdraw",
    icon: ArrowUpFromLine,
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 bottom-0 hidden w-64 border-r border-[#1c3026] bg-[#09130f] p-4 md:block">
      <nav className="space-y-2">
        {userLinks.map((link) => {
          const Icon = link.icon;

          const active =
            pathname === link.href ||
            (link.href !== "/dashboard" &&
              pathname.startsWith(link.href));

          return (
            <Link
              key={link.href}
              href={link.href}
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
      </nav>

      <div className="absolute bottom-6 left-4 right-4">
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-xl border border-[#1c3026] p-3 text-sm text-gray-400 hover:text-white"
        >
          <Settings size={18} />
          Settings
        </Link>
      </div>
    </aside>
  );
}