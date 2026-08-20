import type { Metadata } from "next";
import FirebaseAnalytics from "@/components/FirebaseAnalytics";
import MoneyBillBackground from "@/components/MoneyBillBackground";
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
    <html lang="en">
      <body>
        <FirebaseAnalytics />
        <MoneyBillBackground />
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
