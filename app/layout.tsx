import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mylo AI",
  description: "Mylo AI — a calm space to think, create, and get things done.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
