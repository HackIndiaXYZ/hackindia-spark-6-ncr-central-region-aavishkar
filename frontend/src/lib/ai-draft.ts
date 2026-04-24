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

function fallbackDraft(input: ComplaintDraftInput): DraftResult {
  const letter = generateComplaintLetter(input);
  const text = `${input.domain} ${input.issueText}`.toLowerCase();
  let score = 22;
  if (/(bribe|corruption|threat|unsafe|accident|death|fraud)/i.test(text)) score += 28;
  if (/(urgent|immediate|danger)/i.test(text)) score += 12;
  score = Math.min(100, score);
  const label =
    score >= 70 ? "High" : score >= 40 ? "Medium" : "Low";
  const routed = routeDepartmentLocal(input.domain, input.issueText);
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

export async function produceDraft(input: ComplaintDraftInput): Promise<DraftResult> {
  const base = getAiServiceUrl().replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/v1/draft`, {
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
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return fallbackDraft(input);
    const data = (await res.json()) as AiServiceJson;
    if (
      typeof data.subject !== "string" ||
      typeof data.body !== "string" ||
      typeof data.severity_score !== "number" ||
      typeof data.severity_label !== "string" ||
      typeof data.routed_department !== "string"
    ) {
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
  } catch {
    return fallbackDraft(input);
  }
}
