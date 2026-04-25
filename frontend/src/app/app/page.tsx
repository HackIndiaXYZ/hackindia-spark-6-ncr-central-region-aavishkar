"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  Loader2,
  Mic,
  MicOff,
  Send,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { LocationPicker } from "@/components/map/location-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DOMAINS, type ComplaintDomain } from "@/lib/complaint";
import {
  findLocalComplaint,
  listLocalComplaints,
  mergeLocalComplaints,
  type LocalComplaintItem as HistoryItem,
  type DraftAiMeta,
} from "@/lib/local-complaints";
import { getSpeechRecognitionCtor, startSpeechRecognition } from "@/lib/speech";
import { cn } from "@/lib/utils";
import { setPendingPreview } from "@/lib/preview-runtime-store";

type Message = {
  role: "user" | "assistant";
  content: string;
};



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
  const [userId, setUserId] = useState<string | null>(null);
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
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      if (userId) {
        // Immediately show local history (works even offline / without DB)
        setHistory(listLocalComplaints(userId, 25));
      }

      const res = await fetch("/api/complaints", { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as { items?: HistoryItem[] };
      setHistory(data.items ?? []);

      if (userId && Array.isArray(data.items)) {
        mergeLocalComplaints(
          userId,
          data.items.map((x) => ({
            id: x.id,
            referenceId: x.referenceId,
            domain: x.domain as ComplaintDomain,
            createdAt: x.createdAt,
            draftSubject: x.draftSubject,
            draftBody: x.draftBody,
            issueText: x.issueText,
            locationLabel: x.locationLabel,
            ai: x.ai,
            emailSent: x.emailSent,
            languageLabel: x.languageLabel,
          })),
        );
      }
    } finally {
      setHistoryLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/me", { credentials: "include" });
      const data = (await res.json()) as {
        user?: { id?: string; email?: string; username?: string } | null;
      };
      if (cancelled) return;
      if (data.user?.id) setUserId(data.user.id);
      if (data.user?.email) setEmail((e) => e || data.user!.email!);
      if (data.user?.username) setFullName((n) => n || data.user!.username!);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  function pushUser(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((m) => [...m, { role: "user", content: trimmed }]);
  }

  function pushAssistant(text: string) {
    setMessages((m) => [...m, { role: "assistant", content: text }]);
  }

  async function handleSend() {
    if (!issueText.trim()) return;

    setDraft(null);
    setDraftMeta(null);
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

      // ── Write to BOTH localStorage AND the in-memory store ──
      // localStorage survives navigation; in-memory store survives re-renders.
      const previewPayload = {
        domain,
        languageLabel,
        issueText: userText,
        fullName: fullName.trim() || undefined,
        email: email.trim() || undefined,
        location: location
          ? { lng: location.lng, lat: location.lat, label: location.label }
          : undefined,
        draft: data.draft,
        ai: data.ai,
        source: data.source,
      };
      try {
        localStorage.setItem("jansetu_preview_state_v1", JSON.stringify(previewPayload));
      } catch {
        // ignore localStorage failures
      }
      // Set in-memory store so navigating to /app/preview in the same session works instantly
      setPendingPreview({
        domain,
        languageLabel,
        issueText: userText,
        fullName: fullName.trim() || undefined,
        email: email.trim() || undefined,
        location: location
          ? { lng: location.lng, lat: location.lat, label: location.label }
          : undefined,
        draft: data.draft,
        ai: data.ai,
        attachments: [],
      });

      pushAssistant(
        `Draft ready! Severity: ${data.ai.severityLabel} (${data.ai.severityScore}/100) • Routed to: ${data.ai.routedDepartment}. Click "Review & Submit" below.`,
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
            <CardTitle>Draft review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {draftMeta ? (
              <>
                {/* AI meta summary */}
                <div className="rounded-3xl border border-white/[0.10] bg-black/20 p-4">
                  <p className="text-xs font-medium tracking-[0.2em] text-white/45 uppercase">
                    Draft ready ✓
                  </p>
                  <p className="mt-2 text-sm text-white/80">
                    Severity{" "}
                    <span className="font-semibold text-white/90">{draftMeta.ai.severityLabel}</span>{" "}
                    <span className="text-white/55">({draftMeta.ai.severityScore}/100)</span>
                    {" "}• Routed to{" "}
                    <span className="font-semibold text-white/90">{draftMeta.ai.routedDepartment}</span>
                  </p>
                  {draft && (
                    <p className="mt-2 line-clamp-2 text-xs text-white/50 italic">
                      Subject: {draft.subject}
                    </p>
                  )}
                </div>

                {/* Prominent CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col gap-2 sm:flex-row"
                >
                  <Link
                    href="/app/preview"
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[rgb(var(--brand))] to-[rgb(var(--brand-2))] px-4 py-3 text-sm font-semibold text-black shadow-[0_0_20px_rgba(106,255,237,0.35)] transition-all hover:opacity-90 hover:shadow-[0_0_28px_rgba(106,255,237,0.5)]"
                  >
                    <Send className="h-4 w-4" />
                    Review &amp; Submit
                  </Link>
                  <button
                    type="button"
                    onClick={() => { setDraft(null); setDraftMeta(null); }}
                    className="rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-xs text-white/50 transition-all hover:bg-white/[0.08] hover:text-white/70"
                  >
                    Discard draft
                  </button>
                </motion.div>
              </>
            ) : (
              <div className="grid min-h-[120px] place-items-center rounded-3xl border border-white/[0.10] bg-black/20 p-5 text-center">
                <div className="max-w-sm">
                  <FileText className="mx-auto h-6 w-6 text-white/60" />
                  <p className="mt-2 text-sm font-semibold text-white/85">No draft yet</p>
                  <p className="mt-1 text-sm text-white/60">
                    Describe your issue above and click <strong className="text-white/80">Generate draft</strong>.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Recent submissions</CardTitle>
              <p className="mt-1 text-xs text-white/45">Stored per account (MongoDB or memory)</p>
            </div>
            <Link
              href="/app/local-complaints"
              className="inline-flex items-center gap-1 rounded-full border border-white/[0.12] bg-white/[0.06] px-3 py-1.5 text-xs text-white/80 hover:bg-white/[0.09]"
            >
              Archive
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <p className="text-sm text-white/55">Loading…</p>
            ) : history.length === 0 ? (
              <p className="text-sm text-white/55">No submissions yet.</p>
            ) : (
              <ul className="space-y-3">
                {history.map((h) => (
                  <li
                    key={h.id}
                    className="rounded-2xl border border-white/[0.10] bg-black/20 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-xs text-white/70">{h.referenceId}</p>
                      <div className="flex items-center gap-2">
                        {h.emailSent ? (
                          <span className="text-[10px] text-emerald-300/90">Emailed</span>
                        ) : (
                          <span className="text-[10px] text-white/45">No email</span>
                        )}
                        <Link
                          href="/app/preview"
                          onClick={() => {
                            // Find the most complete version of this complaint (local or list item)
                            const local = userId ? findLocalComplaint(userId, h.referenceId) : null;
                            const saved = { ...h, ...local }; // Local often has more data if sync was partial

                            const domain = DOMAINS.includes(saved.domain as ComplaintDomain)
                              ? (saved.domain as ComplaintDomain)
                              : DOMAINS[0]!;

                            try {
                              localStorage.setItem(
                                "jansetu_preview_state_v1",
                                JSON.stringify({
                                  domain,
                                  languageLabel: saved.languageLabel ?? "English (India)",
                                  issueText: saved.issueText ?? "",
                                  fullName: fullName.trim() || undefined,
                                  email: email.trim() || undefined,
                                  location: saved.locationLabel
                                    ? { lng: 0, lat: 0, label: saved.locationLabel }
                                    : undefined,
                                  draft: {
                                    subject: saved.draftSubject,
                                    body: saved.draftBody ?? "",
                                  },
                                  ai: saved.ai ?? {
                                    severityScore: 0,
                                    severityLabel: "Medium",
                                    routedDepartment: "—",
                                  },
                                  source: "fallback",
                                  isSubmitted: true,
                                }),
                              );
                            } catch {
                              // ignore
                            }
                          }}
                          className="rounded-full border border-white/[0.12] bg-white/[0.06] px-2.5 py-1 text-[10px] font-medium text-white/80 hover:bg-white/[0.09]"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-white/85">{h.draftSubject}</p>
                    <p className="mt-1 text-xs text-white/45">
                      {h.domain} • {new Date(h.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

