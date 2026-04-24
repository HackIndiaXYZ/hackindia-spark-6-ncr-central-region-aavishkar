"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  FileText,
  Loader2,
  Mic,
  MicOff,
  Route,
  Send,
  Sparkles,
} from "lucide-react";
import { LocationPicker } from "@/components/map/location-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DOMAINS, type ComplaintDomain } from "@/lib/complaint";
import { getSpeechRecognitionCtor, startSpeechRecognition } from "@/lib/speech";
import { cn } from "@/lib/utils";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type DraftAiMeta = {
  severityScore: number;
  severityLabel: string;
  routedDepartment: string;
  intent?: string;
  entities?: Record<string, string[]>;
};

type HistoryItem = {
  id: string;
  referenceId: string;
  domain: string;
  createdAt: string;
  draftSubject: string;
  emailSent: boolean;
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
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastReference, setLastReference] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/complaints", { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as { items?: HistoryItem[] };
      setHistory(data.items ?? []);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

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

    setConfirmed(false);
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

  async function copyDraft() {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`);
      pushAssistant("Draft copied to clipboard.");
    } catch {
      pushAssistant("Copy failed. Your browser may block clipboard access.");
    }
  }

  async function confirmAndSubmit() {
    if (!draft || !draftMeta) return;
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) {
      pushAssistant("Missing original issue text. Generate the draft again.");
      return;
    }

    setSubmitting(true);
    setConfirmed(false);
    pushAssistant("Submitting complaint and saving a copy to your account…");

    try {
      const res = await fetch("/api/complaints/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          domain,
          languageLabel,
          issueText: lastUser.content,
          fullName: fullName.trim() || undefined,
          email: email.trim() || undefined,
          location: location
            ? { lng: location.lng, lat: location.lat, label: location.label }
            : undefined,
          draft,
          ai: draftMeta.ai,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        referenceId?: string;
        email?: { sent?: boolean; detail?: string; attempted?: boolean };
      };

      if (!res.ok) {
        pushAssistant(data.error || "Submission failed.");
        return;
      }

      setLastReference(data.referenceId ?? null);
      setConfirmed(true);
      const mail = data.email;
      const mailLine = mail?.sent
        ? "A copy was emailed to you (Resend)."
        : mail?.attempted
          ? `Email was not delivered: ${mail.detail || "check RESEND_* env"}.`
          : "Email copy skipped (configure RESEND_API_KEY + RESEND_FROM to enable).";
      pushAssistant(
        `Submitted successfully. Reference: ${data.referenceId}. ${mailLine} Government portal filing can be wired when official APIs are available.`,
      );
      await loadHistory();
    } catch {
      pushAssistant("Network error while submitting. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Preview</CardTitle>
              <p className="mt-1 text-xs text-white/45">
                Verify first • Then confirm submission
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => void copyDraft()}
                disabled={!draft}
                aria-label="Copy draft"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {draftMeta ? (
              <div className="grid gap-3 rounded-3xl border border-white/[0.10] bg-black/20 p-4 sm:grid-cols-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-[rgb(var(--danger))]" />
                  <div>
                    <p className="text-xs font-medium tracking-[0.2em] text-white/45 uppercase">
                      Severity
                    </p>
                    <p className="mt-1 text-sm text-white/85">
                      {draftMeta.ai.severityLabel}{" "}
                      <span className="text-white/55">({draftMeta.ai.severityScore}/100)</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Route className="mt-0.5 h-4 w-4 text-[rgb(var(--brand))]" />
                  <div>
                    <p className="text-xs font-medium tracking-[0.2em] text-white/45 uppercase">
                      Routed desk
                    </p>
                    <p className="mt-1 text-sm text-white/85">{draftMeta.ai.routedDepartment}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {!draft ? (
              <div className="grid min-h-[160px] place-items-center rounded-3xl border border-white/[0.10] bg-black/20 p-5 text-center">
                <div className="max-w-sm">
                  <FileText className="mx-auto h-6 w-6 text-white/60" />
                  <p className="mt-2 text-sm font-semibold text-white/85">No draft yet</p>
                  <p className="mt-1 text-sm text-white/60">
                    Generate a draft to see a formal complaint letter preview.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-3xl border border-white/[0.10] bg-black/20 p-4">
                  <p className="text-xs font-medium tracking-[0.2em] text-white/45 uppercase">
                    Subject
                  </p>
                  <p className="mt-2 text-sm text-white/85">{draft.subject}</p>
                </div>
                <div className="rounded-3xl border border-white/[0.10] bg-black/20 p-4">
                  <p className="text-xs font-medium tracking-[0.2em] text-white/45 uppercase">
                    Letter
                  </p>
                  <pre className="mt-2 max-h-[220px] overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-white/80">
                    {draft.body}
                  </pre>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => void confirmAndSubmit()}
                    className="flex-1"
                    disabled={submitting || !draftMeta}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      "Confirm & submit"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setDraft(null);
                      setDraftMeta(null);
                      setConfirmed(false);
                      setLastReference(null);
                      pushAssistant("Draft cleared. Update details and generate again.");
                    }}
                    className="flex-1"
                  >
                    Clear
                  </Button>
                </div>
                {confirmed && lastReference ? (
                  <div className="flex items-center gap-2 rounded-3xl border border-white/[0.10] bg-white/[0.06] px-4 py-3 text-sm text-white/80">
                    <CheckCircle2 className="h-4 w-4 text-[rgb(var(--brand))]" />
                    Submitted. Reference <span className="font-mono text-white/90">{lastReference}</span>
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent submissions</CardTitle>
            <p className="mt-1 text-xs text-white/45">Stored per account (MongoDB or memory)</p>
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
                      {h.emailSent ? (
                        <span className="text-[10px] text-emerald-300/90">Emailed</span>
                      ) : (
                        <span className="text-[10px] text-white/45">No email</span>
                      )}
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
