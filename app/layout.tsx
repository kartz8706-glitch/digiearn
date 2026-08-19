import type { Metadata } from "next";
import FirebaseAnalytics from "@/components/FirebaseAnalytics";
import "./globals.css";

export const metadata: Metadata = {
  title: "digi.earn",
  description: "Modern digital investment dashboard",
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
        {children}
      </body>
    </html>
  );
}