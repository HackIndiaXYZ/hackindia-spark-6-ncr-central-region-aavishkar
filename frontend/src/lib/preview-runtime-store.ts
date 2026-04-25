import type { ComplaintDomain } from "@/lib/complaint";
import type { LocalAttachmentKind } from "@/lib/local-complaint-store";

export type DraftAiMeta = {
  severityScore: number;
  severityLabel: string;
  routedDepartment: string;
  intent?: string;
  entities?: Record<string, string[]>;
};

export type PendingPreviewAttachment = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  kind: LocalAttachmentKind;
  file: File;
};

export type PendingPreview = {
  domain: ComplaintDomain;
  languageLabel: string;
  issueText: string;
  fullName?: string;
  email?: string;
  location?: { lng: number; lat: number; label?: string };
  draft: { subject: string; body: string };
  ai: DraftAiMeta;
  attachments: PendingPreviewAttachment[];
};

let currentPendingPreview: PendingPreview | null = null;

export function setPendingPreview(value: PendingPreview | null) {
  currentPendingPreview = value;
}

export function getPendingPreview() {
  return currentPendingPreview;
}

export function clearPendingPreview() {
  currentPendingPreview = null;
}
