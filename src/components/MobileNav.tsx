"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

const NAV_LINKS = [
  { href: "/#feed", label: "Browse" },
  { href: "/create", label: "File dispute" },
  { href: "/create?mode=solo", label: "AITA?" },
  { href: "/docs", label: "Docs" },
];

function Drawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 top-[53px] md:hidden transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ zIndex: 10000, backgroundColor: "rgba(0,0,0,0.6)" }}
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div
        className={`fixed top-[53px] right-0 bottom-0 w-64 border-l border-card-border md:hidden transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ zIndex: 10001, backgroundColor: "var(--card-bg)" }}
      >
        <nav className="flex flex-col gap-1 p-4">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="rounded-lg px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-background hover:text-accent"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </>,
    document.body
  );
}

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
        className="md:hidden relative w-9 h-9 flex items-center justify-center rounded-lg border border-card-border text-muted transition-colors hover:text-foreground hover:border-accent cursor-pointer"
      >
        <svg
          className={`w-4 h-4 absolute transition-all duration-200 ${open ? "opacity-0 rotate-45" : "opacity-100 rotate-0"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg
          className={`w-4 h-4 absolute transition-all duration-200 ${open ? "opacity-100 rotate-0" : "opacity-0 -rotate-45"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <Drawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
