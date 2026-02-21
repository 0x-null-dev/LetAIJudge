"use client";

import { useState, useEffect } from "react";

interface FeedDispute {
  id: string;
  type: "dispute" | "solo";
  topic: string;
  person_a_name: string;
  person_b_name: string | null;
  vote_count: number;
}

export default function FeedSection() {
  const [disputes, setDisputes] = useState<FeedDispute[]>([]);
  const [sort, setSort] = useState<"newest" | "most_votes">("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/feed?sort=${sort}&page=${page}`)
      .then((res) => res.json())
      .then((data) => {
        setDisputes(data.disputes || []);
        setTotalPages(data.totalPages || 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sort, page]);

  function handleSortChange(newSort: "newest" | "most_votes") {
    setSort(newSort);
    setPage(1);
  }

  if (loading && disputes.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="animate-pulse-slow text-muted text-sm font-mono">
          Retrieving case files...
        </div>
      </div>
    );
  }

  if (disputes.length === 0) return null;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted">
          Active cases
        </p>
        <div className="flex gap-1 rounded-lg border border-card-border bg-card-bg p-0.5">
          <button
            onClick={() => handleSortChange("newest")}
            className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
              sort === "newest"
                ? "bg-accent text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            New
          </button>
          <button
            onClick={() => handleSortChange("most_votes")}
            className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
              sort === "most_votes"
                ? "bg-accent text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            Hot
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        {disputes.map((d) => (
          <a
            key={d.id}
            href={`/dispute/${d.id}`}
            className="group flex flex-col justify-between rounded-lg border border-card-border bg-card-bg p-4 transition-all hover:border-accent/40 active:scale-[0.99]"
          >
            <p className="text-sm font-medium leading-snug group-hover:text-accent transition-colors line-clamp-2">
              &ldquo;{d.topic}&rdquo;
            </p>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-muted">
                {d.type === "solo" ? (
                  <>
                    {d.person_a_name}&apos;s testimony{" "}
                    <span className="font-semibold text-accent">&middot; AITA</span>
                  </>
                ) : (
                  <>
                    {d.person_a_name}{" "}
                    <span className="font-semibold text-accent">vs</span>{" "}
                    {d.person_b_name}
                  </>
                )}
              </p>
              <div className="flex items-center gap-2">
                {d.vote_count > 0 && (
                  <span className="text-xs text-muted tabular-nums">
                    {d.vote_count} vote{d.vote_count !== 1 ? "s" : ""}
                  </span>
                )}
                <span className="rounded-md bg-accent/10 px-3 py-1 text-xs font-semibold text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                  {d.type === "solo" ? "Judge" : "Vote"}
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-card-border px-4 py-1.5 text-xs font-medium transition-colors hover:border-accent disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-xs text-muted">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-card-border px-4 py-1.5 text-xs font-medium transition-colors hover:border-accent disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
