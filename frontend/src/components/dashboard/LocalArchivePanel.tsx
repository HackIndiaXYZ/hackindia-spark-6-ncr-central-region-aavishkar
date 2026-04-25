"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Archive, ChevronDown, ChevronUp, FileText, Clock } from "lucide-react";
import { ComplaintCard } from "@/components/complaints/complaint-card";
import { ImageModal } from "@/components/complaints/image-modal";
import {
  listAllComplaintsLocal,
  listComplaintsLocal,
  type LocalComplaint,
} from "@/lib/local-complaint-store";

function accountKey(email: string) {
  const normalized = email.trim().toLowerCase();
  return normalized || "guest";
}

export function LocalArchivePanel() {
  const [email, setEmail] = useState("");
  const [sessionEmail, setSessionEmail] = useState("");
  const [rows, setRows] = useState<LocalComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewComplaintId, setPreviewComplaintId] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const lookupEmail = email.trim() || sessionEmail.trim();
      if (!lookupEmail) {
        setRows(await listAllComplaintsLocal());
      } else {
        setRows(await listComplaintsLocal(accountKey(lookupEmail)));
      }
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [email, sessionEmail]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        const data = (await res.json()) as { user?: { email?: string } | null };
        if (cancelled) return;
        setSessionEmail(data.user?.email?.trim().toLowerCase() ?? "");
      } catch {
        if (!cancelled) setSessionEmail("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setShowAll(false);
    setExpandedId(null);
  }, [email]);

  const visibleRows = useMemo(() => (showAll ? rows : rows.slice(0, 3)), [rows, showAll]);
  const hiddenCount = Math.max(rows.length - 3, 0);

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20">
            <Archive className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/90">Local Archive</h3>
            <p className="text-xs text-white/45">
              {loading ? "Loading…" : `${rows.length} saved complaint${rows.length === 1 ? "" : "s"} on this device`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={sessionEmail ? `${sessionEmail}` : "Filter by email"}
            className="h-8 w-44 rounded-xl border border-white/[0.10] bg-white/[0.04] px-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[rgb(var(--brand))]/40"
          />
          <button
            type="button"
            onClick={() => void load()}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.04] text-white/50 transition-all hover:bg-white/[0.08] hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-white/40">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading local archive…</span>
          </div>
        </div>
      ) : rows.length === 0 ? (
        <div className="grid min-h-[140px] place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 text-center">
          <div className="max-w-xs">
            <FileText className="mx-auto h-8 w-8 text-white/30" />
            <p className="mt-3 text-sm font-medium text-white/60">No saved complaints</p>
            <p className="mt-1 text-xs text-white/35">
              Filed complaints and drafts will appear here automatically.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <ul className="space-y-3">
            {visibleRows.map((row, i) => {
              const isOpen = expandedId === row.id;
              return (
                <motion.li
                  key={row.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <ComplaintCard
                    complaint={row}
                    expanded={isOpen}
                    onToggle={() => setExpandedId((prev) => (prev === row.id ? null : row.id))}
                    onPreviewFile={(idx) => {
                      setPreviewComplaintId(row.id);
                      setPreviewIndex(idx);
                    }}
                  />
                </motion.li>
              );
            })}
          </ul>

          {hiddenCount > 0 && (
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => setShowAll((s) => !s)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/60 transition-all hover:bg-white/[0.08] hover:text-white/80"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" />
                    Show recent 3
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" />
                    Show all ({hiddenCount} more)
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Image modal */}
      <ImageModal
        open={Boolean(previewComplaintId)}
        attachments={rows.find((x) => x.id === previewComplaintId)?.attachments ?? []}
        index={previewIndex}
        onClose={() => {
          setPreviewComplaintId(null);
          setPreviewIndex(0);
        }}
        onNavigate={setPreviewIndex}
      />
    </div>
  );
}
