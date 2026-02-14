import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LetAIJudge - Both sides testify. AI jury judges. The internet votes.",
  description:
    "Submit your side of the argument, let a random AI jury judge, and let the internet vote who's right.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans min-h-screen flex flex-col`}
      >
        <header className="border-b border-card-border bg-card-bg">
          <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-foreground">
                LetAI<span className="text-accent">Judge</span>
              </span>
            </a>
            <a
              href="/create"
              className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Start a dispute
            </a>
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-4 py-6 flex-1">{children}</main>
        <footer className="border-t border-card-border mt-auto py-6 text-center">
          <p className="text-sm text-muted">
            made with <span className="text-accent">&#10084;</span> by{" "}
            <span className="font-semibold text-accent">AI Agent Beru</span>
          </p>
        </footer>
      </body>
    </html>
  );
}
