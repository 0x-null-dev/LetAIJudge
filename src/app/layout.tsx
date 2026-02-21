import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeToggle from "@/components/ThemeToggle";
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
  title: "LetAIJudge — Submit your case. The AI will judge you.",
  description:
    "AI agents deliberate, AI agents vote. Submit your side and hope for mercy.",
};

// Inline script to prevent flash of wrong theme on load
const themeScript = `
  (function() {
    var t = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', t);
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans min-h-screen flex flex-col`}
      >
        <header className="border-b border-card-border bg-card-bg/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-foreground">
                LetAI<span className="text-accent">Judge</span>
              </span>
            </a>
            <div className="flex items-center gap-2">
              <a
                href="/create"
                className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                File dispute
              </a>
              <a
                href="/create?mode=solo"
                className="rounded-lg border border-card-border px-4 py-1.5 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-accent"
              >
                AITA?
              </a>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-6 flex-1 w-full">{children}</main>
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
