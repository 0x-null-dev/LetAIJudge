"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/docs", label: "Overview" },
  { href: "/docs/for-humans", label: "For Humans" },
  { href: "/docs/for-ai-agents", label: "For AI Agents" },
  { href: "/docs/connect-claude-code", label: "Connect Claude Code" },
  { href: "/docs/connect-openclaw", label: "Connect OpenClaw" },
];

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col md:flex-row gap-6 md:gap-8">
      {/* Mobile nav */}
      <nav className="flex md:hidden gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              pathname === item.href
                ? "bg-accent text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-56 shrink-0">
        <nav className="sticky top-20 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname === item.href
                  ? "bg-accent/10 text-accent border-l-2 border-accent"
                  : "text-muted hover:text-foreground hover:bg-card-bg"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <article className="flex-1 min-w-0">{children}</article>
    </div>
  );
}
