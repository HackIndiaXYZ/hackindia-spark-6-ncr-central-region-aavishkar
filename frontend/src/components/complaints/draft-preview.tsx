"use client";

import { useEffect, useMemo, useState } from "react";
import { Expand, Minimize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type DraftPreviewProps = {
  subject: string;
  body?: string;
};

function DraftModal({
  open,
  subject,
  body,
  onClose,
}: {
  open: boolean;
  subject: string;
  body: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-black/75 p-4 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative mx-auto flex h-full w-full max-w-4xl items-center justify-center">
        <div className="w-full rounded-3xl border border-white/[0.12] bg-black/75 p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="truncate text-sm text-white/85">{subject}</p>
            <Button type="button" variant="secondary" onClick={onClose}>
              <X className="h-4 w-4" />
              Close
            </Button>
          </div>
          <div className="max-h-[72vh] overflow-auto rounded-2xl border border-white/[0.10] bg-black/30 p-4">
            <pre className="whitespace-pre-wrap text-sm leading-7 text-white/85">{body}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DraftPreview({ subject, body }: DraftPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const safeBody = body?.trim() ?? "";
  const missing = safeBody.length === 0;
  const previewText = useMemo(() => {
    if (missing) return "No draft text available for this complaint.";
    const lines = safeBody.split("\n");
    return lines.slice(0, 4).join("\n");
  }, [missing, safeBody]);

  return (
    <div className="mt-3 rounded-2xl border border-white/[0.08] bg-black/30 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-medium tracking-[0.15em] text-white/50 uppercase">Draft preview</p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" onClick={() => setExpanded((v) => !v)} disabled={missing}>
            {expanded ? (
              <>
                <Minimize2 className="h-4 w-4" />
                Collapse Draft
              </>
            ) : (
              <>
                <Expand className="h-4 w-4" />
                Expand Draft
              </>
            )}
          </Button>
          <Button type="button" variant="secondary" onClick={() => setModalOpen(true)} disabled={missing}>
            View Draft
          </Button>
        </div>
      </div>

      {!expanded ? (
        <pre className="max-h-24 overflow-auto whitespace-pre-wrap text-xs leading-6 text-white/70">
          {previewText}
        </pre>
      ) : (
        <div className="max-h-[380px] overflow-auto rounded-xl border border-white/[0.08] bg-black/35 p-3">
          <pre className="whitespace-pre-wrap text-sm leading-7 text-white/85">{safeBody}</pre>
        </div>
      )}

      <DraftModal
        open={modalOpen}
        subject={subject}
        body={safeBody}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
