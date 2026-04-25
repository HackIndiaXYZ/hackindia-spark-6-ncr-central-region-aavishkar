import { getAiServiceUrl } from "@/lib/server-env";
import {
  DOMAINS,
  generateComplaintLetter,
  type ComplaintDomain,
  type ComplaintDraftInput,
} from "@/lib/complaint";

export type DraftAiMeta = {
  severityScore: number;
  severityLabel: string;
  routedDepartment: string;
  intent?: string;
  entities?: Record<string, string[]>;
};

export type DraftResult = {
  subject: string;
  body: string;
  ai: DraftAiMeta;
  source: "ai_service" | "fallback";
};

type AiServiceJson = {
  subject?: string;
  body?: string;
  severity_score?: number;
  severity_label?: string;
  routed_department?: string;
  intent?: string;
  entities?: Record<string, string[]>;
};

// ---------------------------------------------------------------------------
// Local fallback helpers
// ---------------------------------------------------------------------------

function routeDepartmentLocal(domain: ComplaintDomain, issue: string): string {
  const d = domain.toLowerCase();
  const t = issue.toLowerCase();
  if (d.includes("electric")) return "State Electricity Board / DISCOM";
  if (d.includes("telecom")) return "Department of Telecommunications / TRAI (as applicable)";
  if (d.includes("tax")) return "Local Tax / Revenue Office";
  if (d.includes("transport")) return "Regional Transport Authority / Municipal Transport";
  if (d.includes("distribution") || d.includes("food")) return "Food & Civil Supplies / PDS Cell";
  if (d.includes("identity")) return "UIDAI / Regional Registrar (as applicable)";
  if (d.includes("corruption")) return "Vigilance / Anti-Corruption Authority (as applicable)";
  if (t.includes("water")) return "Municipal Water / Jal Board";
  if (t.includes("garbage") || t.includes("waste") || t.includes("sanitation"))
    return "Municipal Corporation / Sanitation Department";
  return "Concerned Department (auto-routed by JanSetu)";
}

function inferIntentLocal(issue: string): string {
  const t = issue.toLowerCase();
  if (t.includes("not working") || t.includes("outage")) return "service_failure";
  if (t.includes("bribe") || t.includes("corruption")) return "misconduct_report";
  if (t.includes("delay") || t.includes("pending")) return "delay_escalation";
  return "general_complaint";
}

function extractEntitiesLocal(issue: string): Record<string, string[]> {
  const entities: Record<string, string[]> = {};
  const phones = issue.match(/\+?\d[\d\s-]{8,}\d/g);
  if (phones?.length) entities.phone = phones;
  const emails = issue.match(/[^\s@]+@[^\s@]+\.[^\s@]+/g);
  if (emails?.length) entities.email = emails;
  const money = issue.match(/(?:₹|rs\.?|inr)\s*\d[\d,]*/gi);
  if (money?.length) entities.money = money;
  return entities;
}

function computeSeverity(domain: string, issue: string): { score: number; label: string } {
  const text = `${domain} ${issue}`.toLowerCase();
  let score = 22;
  if (/(bribe|bribery|corruption|extortion)/i.test(text)) score += 26;
  if (/(threat|unsafe|accident|injury|death)/i.test(text)) score += 30;
  if (/(fraud|forgery|fake)/i.test(text)) score += 18;
  if (/(urgent|emergency|immediate|danger)/i.test(text)) score += 12;
  score = Math.min(100, score);
  const label = score >= 70 ? "High" : score >= 40 ? "Medium" : "Low";
  return { score, label };
}

function fallbackDraft(input: ComplaintDraftInput): DraftResult {
  const letter = generateComplaintLetter(input);
  const { score, label } = computeSeverity(input.domain, input.issueText);
  const routed = routeDepartmentLocal(input.domain as ComplaintDomain, input.issueText);
  return {
    subject: letter.subject,
    body: letter.body,
    ai: {
      severityScore: score,
      severityLabel: label,
      routedDepartment: routed,
      intent: inferIntentLocal(input.issueText),
      entities: extractEntitiesLocal(input.issueText),
    },
    source: "fallback",
  };
}

// ---------------------------------------------------------------------------
// Main producer — tries AI microservice, always falls back safely
// ---------------------------------------------------------------------------

export async function produceDraft(input: ComplaintDraftInput): Promise<DraftResult> {
  const base = getAiServiceUrl().replace(/\/$/, "");

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000); // 20 s timeout

    let res: Response;
    try {
      res = await fetch(`${base}/v1/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issue_text: input.issueText,
          domain: input.domain,
          language_label: input.languageLabel,
          full_name: input.fullName ?? "",
          email: input.email ?? "",
          location_label: input.locationLabel ?? "",
          lat: input.lat ?? null,
          lng: input.lng ?? null,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      console.warn(`[ai-draft] AI service returned ${res.status} — using local fallback`);
      return fallbackDraft(input);
    }

    let data: AiServiceJson;
    try {
      data = (await res.json()) as AiServiceJson;
    } catch {
      console.warn("[ai-draft] AI service response was not valid JSON — using local fallback");
      return fallbackDraft(input);
    }

    // Validate required fields
    if (
      typeof data.subject !== "string" ||
      typeof data.body !== "string" ||
      typeof data.severity_score !== "number" ||
      typeof data.severity_label !== "string" ||
      typeof data.routed_department !== "string" ||
      !data.subject.trim() ||
      !data.body.trim()
    ) {
      console.warn("[ai-draft] AI service response missing required fields — using local fallback");
      return fallbackDraft(input);
    }

    if (!DOMAINS.includes(input.domain)) return fallbackDraft(input);

    return {
      subject: data.subject,
      body: data.body,
      ai: {
        severityScore: Math.round(data.severity_score),
        severityLabel: data.severity_label,
        routedDepartment: data.routed_department,
        intent: data.intent,
        entities: data.entities,
      },
      source: "ai_service",
    };
  } catch (err) {
    // Network error, timeout, or anything else — silently fall back
    const reason = err instanceof Error ? err.message : String(err);
    console.warn(`[ai-draft] AI service unreachable (${reason}) — using local fallback`);
    return fallbackDraft(input);
  }
}
