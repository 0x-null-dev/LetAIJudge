"use client";

import { useState, useEffect } from "react";

interface AxiomDeliberationProps {
  mode: "solo" | "dispute";
}

interface Phase {
  text: string;
  delay: number;
}

const DISPUTE_PHASES: Phase[] = [
  { text: "Initializing adjudication protocol", delay: 0 },
  { text: "Scanning argument payloads", delay: 1500 },
  { text: "Cross-referencing precedent database", delay: 3000 },
  { text: "Detecting logical fallacies", delay: 5000 },
  { text: "Calculating emotional bias coefficients", delay: 7000 },
  { text: "Weighing evidence vectors", delay: 9000 },
  { text: "Rendering verdict", delay: 11000 },
];

const SOLO_PHASES: Phase[] = [
  { text: "Initializing adjudication protocol", delay: 0 },
  { text: "Ingesting subject testimony", delay: 1500 },
  { text: "Flagging self-serving narratives", delay: 3000 },
  { text: "Scanning for omitted context", delay: 5000 },
  { text: "Running asshole probability model", delay: 7000 },
  { text: "Calibrating moral compass (synthetic)", delay: 9000 },
  { text: "Rendering verdict", delay: 11000 },
];

export default function AxiomDeliberation({ mode }: AxiomDeliberationProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const phases = mode === "solo" ? SOLO_PHASES : DISPUTE_PHASES;

  useEffect(() => {
    const timers = phases.map((phase, i) =>
      setTimeout(() => setVisibleCount(i + 1), phase.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [phases]);

  return (
    <div className="py-12 flex flex-col items-center gap-4">
      <div className="w-full max-w-lg rounded-xl border border-card-border bg-card-bg overflow-hidden font-mono">
        {/* Terminal header */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-card-border bg-accent/5">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-accent/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-muted/30" />
            <div className="w-2.5 h-2.5 rounded-full bg-muted/30" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-accent animate-flicker ml-2">
            [AXIOM-9] Adjudication in progress
          </span>
        </div>

        {/* Log lines */}
        <div className="px-4 py-4 flex flex-col gap-2 min-h-[220px]">
          {phases.slice(0, visibleCount).map((phase, i) => {
            const isFinal = i === phases.length - 1;
            const isLatest = i === visibleCount - 1;

            return (
              <div
                key={i}
                className="flex items-center gap-2 text-xs animate-slide-up"
              >
                <span className="text-accent shrink-0">&gt;&gt;</span>
                <span
                  className={`flex-1 ${
                    isFinal
                      ? "text-accent animate-pulse-slow"
                      : "text-muted"
                  }`}
                >
                  {phase.text}
                  {isFinal && (
                    <span className="animate-blink ml-0.5">_</span>
                  )}
                </span>
                {!isFinal &&
                  (isLatest ? (
                    <svg
                      className="w-3 h-3 text-accent animate-spin shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : (
                    <span className="text-success text-[10px] shrink-0">
                      [OK]
                    </span>
                  ))}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-3">
          <div className="w-full h-1 bg-card-border rounded-full overflow-hidden">
            <div className="h-full bg-accent/60 rounded-full animate-progress-crawl" />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-card-border">
          <p className="text-[10px] text-muted tracking-wider">
            AXIOM-9 <span className="text-accent">//</span> the court is in
            session
          </p>
        </div>
      </div>
    </div>
  );
}
