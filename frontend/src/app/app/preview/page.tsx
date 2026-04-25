"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Copy, Loader2, Route, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clearPendingPreview, getPendingPreview, setPendingPreview, type PendingPreview } from "@/lib/preview-runtime-store";
import { saveComplaintDraftLocal, type LocalAttachment } from "@/lib/local-complaint-store";
import { DOMAINS, type ComplaintDomain } from "@/lib/complaint";

/** Try in-memory store first; if empty, restore from localStorage. */
function getOrRestorePreview(): PendingPreview | null {
  const inMemory = getPendingPreview();
  if (inMemory) return inMemory;

  try {
    const raw = localStorage.getItem("jansetu_preview_state_v1");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    // Don't restore a draft that was already submitted
    if (parsed.isSubmitted) return null;
    const draft = parsed.draft as { subject: string; body: string } | undefined;
    const ai = parsed.ai as { severityScore: number; severityLabel: string; routedDepartment: string } | undefined;
    if (!draft?.subject || !ai) return null;

    const domainVal = DOMAINS.includes(parsed.domain as ComplaintDomain)
      ? (parsed.domain as ComplaintDomain)
      : DOMAINS[0]!;

    const restored: PendingPreview = {
      domain: domainVal,
      languageLabel: (parsed.languageLabel as string) ?? "English (India)",
      issueText: (parsed.issueText as string) ?? "",
      fullName: parsed.fullName as string | undefined,
      email: parsed.email as string | undefined,
      location: parsed.location as { lng: number; lat: number; label?: string } | undefined,
      draft,
      ai,
      attachments: [], // Files cannot be serialised to localStorage
    };
    // Persist back to in-memory store so it survives any further re-renders
    setPendingPreview(restored);
    return restored;
  } catch {
    return null;
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function accountKey(email?: string) {
  const normalized = email?.trim().toLowerCase() ?? "";
  return normalized || "guest";
}

function PendingAttachmentPreview({
  attachment,
}: {
  attachment: { name: string; size: number; kind: "image" | "video"; file: File };
}) {
  const url = useMemo(() => URL.createObjectURL(attachment.file), [attachment.file]);

  useEffect(() => {
    return () => URL.revokeObjectURL(url);
  }, [url]);

  return (
    <li className="rounded-2xl border border-white/[0.10] bg-black/20 p-3">
      <div className="mb-2 flex items-center justify-between gap-2 text-xs text-white/60">
        <span className="truncate">{attachment.name}</span>
        <span>{formatBytes(attachment.size)}</span>
      </div>
      {attachment.kind === "image" ? (
        <img src={url} alt={attachment.name} className="h-36 w-full rounded-xl object-cover" />
      ) : (
        <video src={url} className="h-36 w-full rounded-xl bg-black object-cover" controls muted />
      )}
    </li>
  );
}

export default function PreviewPage() {
  // Use the restore helper so navigation-caused memory loss is transparent
  const [pending, setPending] = useState<PendingPreview | null>(() => getOrRestorePreview());
  const [submitting, setSubmitting] = useState(false);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [statusLine, setStatusLine] = useState<string>("");
  const [sessionEmail, setSessionEmail] = useState("");

  useEffect(() => {
    // Re-run on mount (handles hard refresh and SSR hydration)
    setPending(getOrRestorePreview());
  }, []);

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

  const attachmentCountLine = useMemo(() => {
    if (!pending) return "0 proofs attached";
    return `${pending.attachments.length} proof attachment(s) ready`;
  }, [pending]);

  async function copyDraft() {
    if (!pending) return;
    try {
      await navigator.clipboard.writeText(`Subject: ${pending.draft.subject}\n\n${pending.draft.body}`);
      setStatusLine("Draft copied to clipboard.");
    } catch {
      setStatusLine("Clipboard access failed in this browser.");
    }
  }

  async function submitComplaint() {
    if (!pending) return;
    setSubmitting(true);
    setStatusLine("Submitting your complaint...");
    try {
      const res = await fetch("/api/complaints/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          domain: pending.domain,
          languageLabel: pending.languageLabel,
          issueText: pending.issueText,
          fullName: pending.fullName,
          email: pending.email || sessionEmail || undefined,
          location: pending.location,
          draft: pending.draft,
          ai: pending.ai,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        referenceId?: string;
        email?: { sent?: boolean; detail?: string; attempted?: boolean };
      };
      if (!res.ok) {
        setStatusLine(data.error || "Submission failed.");
        return;
      }

      const localAttachments: LocalAttachment[] = pending.attachments.map((a) => ({
        id: a.id,
        name: a.name,
        mimeType: a.mimeType,
        size: a.size,
        kind: a.kind,
        blob: a.file,
      }));

      await saveComplaintDraftLocal({
        id: crypto.randomUUID(),
        accountKey: accountKey(pending.email || sessionEmail),
        createdAt: new Date().toISOString(),
        referenceId: data.referenceId,
        domain: pending.domain,
        issueText: pending.issueText,
        draft: pending.draft,
        attachments: localAttachments,
      });

      setReferenceId(data.referenceId ?? null);
      setStatusLine("Submitted and backed up locally.");
      clearPendingPreview();
      // Mark localStorage as submitted so restore helper won't replay it
      try {
        const raw = localStorage.getItem("jansetu_preview_state_v1");
        if (raw) {
          const prev = JSON.parse(raw) as Record<string, unknown>;
          localStorage.setItem("jansetu_preview_state_v1", JSON.stringify({ ...prev, isSubmitted: true }));
        }
      } catch { /* ignore */ }
      setPending(null);
    } catch {
      setStatusLine("Network error while submitting.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!pending) {
    return (
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Preview workspace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-white/65">
              No active draft preview is available. Generate a draft from the dashboard first.
            </p>
            {referenceId ? (
              <p className="text-sm text-emerald-300/90">
                Last submitted reference: <span className="font-mono">{referenceId}</span>
              </p>
            ) : null}
            <Link
              href="/app"
              className="inline-flex rounded-full border border-white/[0.12] bg-white/[0.06] px-4 py-2 text-sm text-white/85 hover:bg-white/[0.09]"
            >
              Back to dashboard
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] text-white/45 uppercase">Preview</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Review before final submit</h1>
          <p className="mt-2 text-sm text-white/65">{attachmentCountLine}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" onClick={() => void copyDraft()}>
            <Copy className="h-4 w-4" />
            Copy draft
          </Button>
          <Button type="button" variant="primary" onClick={() => void submitComplaint()} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Confirm & submit
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI routing insights</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/[0.10] bg-black/20 p-4">
            <div className="flex items-center gap-2 text-white/80">
              <AlertTriangle className="h-4 w-4 text-[rgb(var(--danger))]" />
              Severity
            </div>
            <p className="mt-2 text-sm text-white/85">
              {pending.ai.severityLabel} ({pending.ai.severityScore}/100)
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.10] bg-black/20 p-4">
            <div className="flex items-center gap-2 text-white/80">
              <Route className="h-4 w-4 text-[rgb(var(--brand))]" />
              Routed desk
            </div>
            <p className="mt-2 text-sm text-white/85">{pending.ai.routedDepartment}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Complaint letter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-2xl border border-white/[0.10] bg-black/20 p-4">
            <p className="text-xs font-medium tracking-[0.2em] text-white/45 uppercase">Subject</p>
            <p className="mt-2 text-sm text-white/90">{pending.draft.subject}</p>
          </div>
          <div className="rounded-2xl border border-white/[0.10] bg-black/20 p-4">
            <p className="text-xs font-medium tracking-[0.2em] text-white/45 uppercase">Letter</p>
            <pre className="mt-2 max-h-[320px] overflow-auto whitespace-pre-wrap text-sm text-white/80">
              {pending.draft.body}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verification proofs</CardTitle>
        </CardHeader>
        <CardContent>
          {pending.attachments.length === 0 ? (
            <p className="text-sm text-white/60">No attachments added for this complaint.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {pending.attachments.map((attachment) => (
                <PendingAttachmentPreview key={attachment.id} attachment={attachment} />
              ))}
            </ul>
          )}
          {statusLine ? (
            <div className="mt-3 flex items-center gap-2 text-sm text-white/75">
              <CheckCircle2 className="h-4 w-4 text-[rgb(var(--brand))]" />
              {statusLine}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
