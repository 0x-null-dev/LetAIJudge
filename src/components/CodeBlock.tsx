"use client";

import { useState, useRef } from "react";

export default function CodeBlock({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  function handleCopy() {
    navigator.clipboard.writeText(children);
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative group rounded-xl border border-card-border bg-card-bg">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 rounded-md border border-card-border bg-background/80 px-2 py-1 text-xs text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-accent hover:border-accent cursor-pointer"
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <pre className="overflow-x-auto p-4 text-sm custom-scrollbar">
        <code>{children}</code>
      </pre>
    </div>
  );
}
