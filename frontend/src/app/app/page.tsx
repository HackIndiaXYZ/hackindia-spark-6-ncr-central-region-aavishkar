"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Loader2,
  Mic,
  MicOff,
  Paperclip,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { LocationPicker } from "@/components/map/location-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DOMAINS, type ComplaintDomain } from "@/lib/complaint";
import type { LocalAttachmentKind } from "@/lib/local-complaint-store";
import { setPendingPreview, type DraftAiMeta } from "@/lib/preview-runtime-store";
import { getSpeechRecognitionCtor, startSpeechRecognition } from "@/lib/speech";
import { cn } from "@/lib/utils";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type AttachmentDraftItem = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  kind: LocalAttachmentKind;
  file: File;
  previewUrl: string;
};

const MAX_FILES = 5;
const MAX_IMAGE_SIZE_MB = 5;
const MAX_VIDEO_SIZE_MB = 25;
const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_MIMES = ["video/mp4", "video/webm", "video/quicktime"];
const ACCEPT_ATTR = [...IMAGE_MIMES, ...VIDEO_MIMES].join(",");

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

const LANGUAGES = [
  { label: "Hindi (India)", code: "hi-IN" },
  { label: "English (India)", code: "en-IN" },
  { label: "Bengali (India)", code: "bn-IN" },
  { label: "Marathi (India)", code: "mr-IN" },
  { label: "Tamil (India)", code: "ta-IN" },
  { label: "Telugu (India)", code: "te-IN" },
  { label: "Gujarati (India)", code: "gu-IN" },
  { label: "Kannada (India)", code: "kn-IN" },
  { label: "Malayalam (India)", code: "ml-IN" },
  { label: "Punjabi (India)", code: "pa-IN" },
  { label: "Urdu (India)", code: "ur-IN" },
];

export default function DashboardPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [domain, setDomain] = useState<ComplaintDomain>(DOMAINS[0]!);
  const [lang, setLang] = useState(LANGUAGES[0]!.code);
  const languageLabel = useMemo(
    () => LANGUAGES.find((l) => l.code === lang)?.label ?? lang,
    [lang],
  );

  const [issueText, setIssueText] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Describe your problem in your local language. Choose a domain and pin your location. I’ll draft a formal complaint letter for you to review.",
    },
  ]);

  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const speechSupported = useMemo(() => Boolean(getSpeechRecognitionCtor()), []);

  const [location, setLocation] = useState<{
    lng: number;
    lat: number;
    label?: string;
  } | null>(null);

  const [drafting, setDrafting] = useState(false);
  const [draft, setDraft] = useState<{ subject: string; body: string } | null>(null);
  const [draftMeta, setDraftMeta] = useState<{
    ai: DraftAiMeta;
    source: "ai_service" | "fallback";
  } | null>(null);
  const [draftIssueText, setDraftIssueText] = useState("");
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<AttachmentDraftItem[]>([]);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentsRef = useRef<AttachmentDraftItem[]>([]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/me", { credentials: "include" });
      const data = (await res.json()) as {
        user?: { email?: string; username?: string } | null;
      };
      if (cancelled) return;
      if (data.user?.email) setEmail((e) => e || data.user!.email!);
      if (data.user?.username) setFullName((n) => n || data.user!.username!);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(() => {
    if (!draft || !draftMeta || !draftIssueText) {
      setPendingPreview(null);
      return;
    }
    setPendingPreview({
      domain,
      languageLabel,
      issueText: draftIssueText,
      fullName: fullName.trim() || undefined,
      email: email.trim() || undefined,
      location: location ?? undefined,
      draft,
      ai: draftMeta.ai,
      attachments: attachments.map((a) => ({
        id: a.id,
        name: a.name,
        mimeType: a.mimeType,
        size: a.size,
        kind: a.kind,
        file: a.file,
      })),
    });
  }, [attachments, domain, draft, draftIssueText, draftMeta, email, fullName, languageLabel, location]);

  useEffect(() => {
    return () => {
      for (const file of attachmentsRef.current) {
        URL.revokeObjectURL(file.previewUrl);
      }
    };
  }, []);

  function pushUser(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((m) => [...m, { role: "user", content: trimmed }]);
  }

  function pushAssistant(text: string) {
    setMessages((m) => [...m, { role: "assistant", content: text }]);
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => {
      const next = prev.filter((a) => a.id !== id);
      const removed = prev.find((a) => a.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
  }

  function normalizeIncomingFiles(incoming: File[]) {
    const next: AttachmentDraftItem[] = [];
    let error: string | null = null;

    for (const file of incoming) {
      if (attachments.length + next.length >= MAX_FILES) {
        error = `You can attach up to ${MAX_FILES} files.`;
        break;
      }

      const kind: LocalAttachmentKind | null = IMAGE_MIMES.includes(file.type)
        ? "image"
        : VIDEO_MIMES.includes(file.type)
          ? "video"
          : null;

      if (!kind) {
        error = `Unsupported file type: ${file.name}`;
        continue;
      }

      const maxBytes = (kind === "image" ? MAX_IMAGE_SIZE_MB : MAX_VIDEO_SIZE_MB) * 1024 * 1024;
      if (file.size > maxBytes) {
        error = `${file.name} exceeds ${kind === "image" ? MAX_IMAGE_SIZE_MB : MAX_VIDEO_SIZE_MB} MB.`;
        continue;
      }

      const isDuplicate = [...attachments, ...next].some(
        (a) =>
          a.name === file.name &&
          a.size === file.size &&
          a.file.lastModified === file.lastModified,
      );
      if (isDuplicate) continue;

      next.push({
        id: crypto.randomUUID(),
        name: file.name,
        mimeType: file.type,
        size: file.size,
        kind,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    setAttachmentError(error);
    if (next.length > 0) setAttachments((prev) => [...prev, ...next]);
  }

  function onPickFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    normalizeIncomingFiles(Array.from(fileList));
  }

  async function handleSend() {
    if (!issueText.trim()) return;

    setDraft(null);
    setDraftMeta(null);
    setDraftIssueText("");
    setDrafting(true);

    const userText = issueText.trim();
    pushUser(userText);
    setIssueText("");
    setInterim("");

    pushAssistant(
      "Drafting your formal complaint letter. Please verify the preview carefully before confirming.",
    );

    try {
      const res = await fetch("/api/complaints/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          domain,
          languageLabel,
          issueText: userText,
          fullName: fullName.trim() || undefined,
          email: email.trim() || undefined,
          location: location
            ? { lng: location.lng, lat: location.lat, label: location.label }
            : undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        draft?: { subject: string; body: string };
        ai?: DraftAiMeta;
        source?: "ai_service" | "fallback";
      };

      if (!res.ok) {
        pushAssistant(data.error || "Could not generate a draft. Please try again.");
        return;
      }

      if (!data.draft || !data.ai || !data.source) {
        pushAssistant("Draft response was incomplete. Please try again.");
        return;
      }

      setDraft(data.draft);
      setDraftMeta({ ai: data.ai, source: data.source });
      setDraftIssueText(userText);
      pushAssistant(
        `Preview is ready. Severity: ${data.ai.severityLabel} (${data.ai.severityScore}/100). Routed desk: ${data.ai.routedDepartment}.`,
      );
    } catch {
      pushAssistant("Network error while drafting. Check your connection and try again.");
    } finally {
      setDrafting(false);
    }
  }

  function toggleListening() {
    setSpeechError(null);
    if (!speechSupported) return;

    if (listening) {
      try {
        recognitionRef.current?.stop?.();
      } catch {
        // ignore
      }
      setListening(false);
      setInterim("");
      return;
    }

    const recognition = startSpeechRecognition({
      lang,
      onInterim: (t) => setInterim(t),
      onFinal: (t) => {
        setIssueText((prev) => (prev ? `${prev} ${t}` : t));
        setInterim("");
      },
      onError: (err) => setSpeechError(err),
      onEnd: () => setListening(false),
    });

    if (!recognition) return;
    recognitionRef.current = recognition;
    setListening(true);
  }

  const composedText = issueText + (interim ? ` ${interim}` : "");

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <Card className="lg:col-span-7">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Complaint Assistant</CardTitle>
            <p className="mt-1 text-xs text-white/45">
              Text or voice • Local language • Preview-first
            </p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.06] px-3 py-1 text-xs text-white/70">
              <Sparkles className="h-4 w-4 text-[rgb(var(--brand))]" />
              {draftMeta?.source === "ai_service" ? "AI microservice" : "AI + local fallback"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-[360px] overflow-auto rounded-3xl border border-white/[0.10] bg-black/20 p-4">
            <div className="space-y-3">
              {messages.map((m, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className={cn(
                    "max-w-[92%] rounded-3xl px-4 py-3 text-sm leading-relaxed",
                    m.role === "assistant"
                      ? "border border-white/[0.10] bg-white/[0.06] text-white/80"
                      : "ml-auto border border-white/[0.12] bg-[linear-gradient(135deg,rgb(var(--brand)_/_0.20),rgb(var(--brand-2)_/_0.18))] text-white/90",
                  )}
                >
                  {m.content}
                </motion.div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-white/70" htmlFor="domain">
                Domain
              </label>
              <div className="relative">
                <Select
                  id="domain"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value as ComplaintDomain)}
                >
                  {DOMAINS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
                <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-xs text-white/45">
                  ▼
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/70" htmlFor="lang">
                Language (voice + draft label)
              </label>
              <div className="relative">
                <Select id="lang" value={lang} onChange={(e) => setLang(e.target.value)}>
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </Select>
                <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-xs text-white/45">
                  ▼
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-white/70" htmlFor="issue">
              Describe your issue
            </label>
            <Textarea
              id="issue"
              value={composedText}
              onChange={(e) => setIssueText(e.target.value)}
              placeholder="Explain what happened, who/what is involved, and what outcome you want…"
            />
            <div className="rounded-3xl border border-white/[0.10] bg-black/20 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-white/80">Add verification proof (optional)</p>
                  <p className="text-xs text-white/50">
                    Attach up to {MAX_FILES} files. Images up to {MAX_IMAGE_SIZE_MB}MB, videos up to{" "}
                    {MAX_VIDEO_SIZE_MB}MB.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                  Add files
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_ATTR}
                multiple
                className="hidden"
                onChange={(e) => {
                  onPickFiles(e.target.files);
                  e.currentTarget.value = "";
                }}
              />
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  onPickFiles(e.dataTransfer.files);
                }}
                className="mt-3 rounded-2xl border border-dashed border-white/[0.16] px-4 py-5 text-center text-xs text-white/55"
              >
                Drag and drop photo/video files here
              </div>
              {attachmentError ? (
                <p className="mt-2 text-xs text-[rgb(var(--danger))]">{attachmentError}</p>
              ) : null}
              {attachments.length > 0 ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="rounded-2xl border border-white/[0.10] bg-white/[0.04] p-3"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="line-clamp-1 text-xs text-white/70">{attachment.name}</p>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => removeAttachment(attachment.id)}
                          aria-label="Remove attachment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="mb-2 text-[11px] text-white/45">{formatBytes(attachment.size)}</p>
                      {attachment.kind === "image" ? (
                        <img
                          src={attachment.previewUrl}
                          alt={attachment.name}
                          className="h-28 w-full rounded-xl object-cover"
                        />
                      ) : (
                        <video
                          src={attachment.previewUrl}
                          className="h-28 w-full rounded-xl bg-black object-cover"
                          controls
                          muted
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={toggleListening}
                  disabled={!speechSupported}
                >
                  {listening ? (
                    <>
                      <MicOff className="h-4 w-4" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" />
                      Voice
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => void handleSend()}
                  disabled={drafting || !issueText.trim()}
                >
                  {drafting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Drafting…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Generate draft
                    </>
                  )}
                </Button>
              </div>
              <div className="text-xs text-white/45">
                {speechError
                  ? `Voice error: ${speechError}`
                  : listening
                    ? "Listening… speak naturally."
                    : speechSupported
                      ? "Tip: Use voice in your local language."
                      : "Voice not supported in this browser."}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:col-span-5">
        <Card>
          <CardHeader>
            <CardTitle>Citizen Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="space-y-2">
                <label className="text-sm text-white/70" htmlFor="name">
                  Full name
                </label>
                <Input
                  id="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70" htmlFor="email">
                  Email (for letter + copy)
                </label>
                <Input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  autoComplete="email"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent>
            <LocationPicker value={location} onChange={setLocation} />
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-xs text-white/45">
                Need a bigger map? Use the dedicated picker page.
              </p>
              <a
                href="/app/map"
                className="rounded-full border border-white/[0.12] bg-white/[0.06] px-3 py-1.5 text-xs text-white/80 hover:bg-white/[0.09]"
              >
                Open map page
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview workspace</CardTitle>
            <p className="mt-1 text-xs text-white/45">
              Full-page review with AI insights, attachments, and submission action.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-3xl border border-white/[0.10] bg-black/20 p-4">
              <p className="text-sm text-white/75">
                {draft
                  ? "Draft is ready. Open the dedicated preview page to validate and submit."
                  : "Generate a draft first, then open the preview page for final verification."}
              </p>
            </div>
            <Link
              href="/app/preview"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-[linear-gradient(135deg,rgb(var(--brand)_/_0.24),rgb(var(--brand-2)_/_0.16))] px-4 py-2 text-sm text-white/90 hover:bg-white/[0.10]"
            >
              Open preview page
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Past complaints</CardTitle>
            <p className="mt-1 text-xs text-white/45">
              Open the dedicated archive page to inspect all local proofs and complaint drafts.
            </p>
          </CardHeader>
          <CardContent>
            <Link
              href="/app/local-complaints"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.06] px-4 py-2 text-sm text-white/85 hover:bg-white/[0.10]"
            >
              Open local complaints page
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
