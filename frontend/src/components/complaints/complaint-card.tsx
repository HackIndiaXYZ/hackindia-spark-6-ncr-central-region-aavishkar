"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { DraftPreview } from "@/components/complaints/draft-preview";
import { FileList } from "@/components/complaints/file-list";
import type { LocalComplaint } from "@/lib/local-complaint-store";

type ComplaintCardProps = {
  complaint: LocalComplaint;
  expanded: boolean;
  onToggle: () => void;
  onPreviewFile: (index: number) => void;
};

export function ComplaintCard({ complaint, expanded, onToggle, onPreviewFile }: ComplaintCardProps) {
  return (
    <li className="rounded-3xl border border-white/[0.10] bg-black/20 p-3 shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition hover:border-white/[0.16]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 rounded-2xl px-2 py-2 text-left transition hover:bg-white/[0.04]"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white/90">{complaint.draft.subject}</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.10] bg-white/[0.04] px-2 py-1 text-xs text-white/70">
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              Hide
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              Details
            </>
          )}
        </span>
      </button>

      <div
        className={`grid transition-all duration-300 ease-out ${expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="mt-2 rounded-2xl border border-white/[0.10] bg-black/25 p-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-mono text-xs text-white/70">
                {complaint.referenceId ?? "Local backup (not submitted)"}
              </p>
              <p className="text-xs text-white/45">
                {complaint.domain} • {new Date(complaint.createdAt).toLocaleString()}
              </p>
            </div>
            <DraftPreview subject={complaint.draft.subject} body={complaint.draft.body} />
            <FileList files={complaint.attachments} onPreview={onPreviewFile} />
          </div>
        </div>
      </div>
    </li>
  );
}
