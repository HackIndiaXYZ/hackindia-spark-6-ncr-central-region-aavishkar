"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { ComplaintCard } from "@/components/complaints/complaint-card";
import { ImageModal } from "@/components/complaints/image-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  listAllComplaintsLocal,
  listComplaintsLocal,
  type LocalComplaint,
} from "@/lib/local-complaint-store";

function accountKey(email: string) {
  const normalized = email.trim().toLowerCase();
  return normalized || "guest";
}

export default function LocalComplaintsPage() {
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
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] text-white/45 uppercase">Local Archive</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Past complaints with proofs
          </h1>
          <p className="mt-2 text-sm text-white/65">
            Local database keeps your generated drafts and attachments on this device for fast review.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={sessionEmail ? `Current: ${sessionEmail}` : "Filter by email (optional)"}
            className="h-10 rounded-full border border-white/[0.12] bg-white/[0.06] px-4 text-sm text-white placeholder:text-white/35"
          />
          <Button type="button" variant="secondary" onClick={() => void load()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Saved complaints</CardTitle>
            <p className="mt-1 text-xs text-white/50">
              Showing latest 3 complaints by default. Expand to inspect full draft and proofs.
            </p>
          </div>
          <div className="rounded-full border border-white/[0.10] bg-white/[0.06] px-3 py-1 text-xs text-white/70">
            Total: {rows.length}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-white/55">Loading local complaints...</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-white/55">No local complaint backups found.</p>
          ) : (
            <div className="space-y-4">
              <ul className="space-y-3">
                {visibleRows.map((row) => {
                  const isOpen = expandedId === row.id;
                  return (
                    <ComplaintCard
                      key={row.id}
                      complaint={row}
                      expanded={isOpen}
                      onToggle={() => setExpandedId((prev) => (prev === row.id ? null : row.id))}
                      onPreviewFile={(idx) => {
                        setPreviewComplaintId(row.id);
                        setPreviewIndex(idx);
                      }}
                    />
                  );
                })}
              </ul>

              {hiddenCount > 0 ? (
                <div className="flex items-center justify-center">
                  <Button type="button" variant="secondary" onClick={() => setShowAll((s) => !s)}>
                    {showAll ? "Show Recent 3" : `Show All (${hiddenCount} more)`}
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
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
