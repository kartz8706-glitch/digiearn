import type { Metadata } from "next";
import FirebaseAnalytics from "@/components/FirebaseAnalytics";
import MoneyBillBackground from "@/components/MoneyBillBackground";
import NotificationCenter from "@/components/NotificationCenter";
import RealtimeSync from "@/components/RealtimeSync";
import "./globals.css";

export const metadata: Metadata = {
  title: "digi.earn",
  description: "Modern digital investment dashboard",
  icons: {
    icon: "/digiearn-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try { const theme = localStorage.getItem("digi-earn-theme"); document.documentElement.dataset.theme = theme === "light" ? "light" : "dark"; } catch (_) { document.documentElement.dataset.theme = "dark"; } })();`,
          }}
        />
      </head>
      <body>
        <FirebaseAnalytics />
        <MoneyBillBackground />
        <NotificationCenter />
        <RealtimeSync />
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
