import { NextResponse } from "next/server";
import { z } from "zod";
import { DOMAINS, type ComplaintDomain } from "@/lib/complaint";
import { produceDraft } from "@/lib/ai-draft";
import { readSession } from "@/lib/session";

const domainEnum = z.enum(DOMAINS as [ComplaintDomain, ...ComplaintDomain[]]);

const bodySchema = z.object({
  domain: domainEnum,
  languageLabel: z.string().min(1).max(80),
  issueText: z.string().min(3).max(8000),
  fullName: z.string().max(120).optional(),
  email: z.string().email().optional().or(z.literal("")),
  location: z
    .object({
      lng: z.number(),
      lat: z.number(),
      label: z.string().max(500).optional(),
    })
    .optional(),
});

export async function POST(req: Request) {
  // Session is optional for drafting — only final submission requires auth.
  // We use session data as convenient defaults for name/email, nothing more.
  const session = await readSession().catch(() => null);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request fields.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { domain, languageLabel, issueText, fullName, email, location } = parsed.data;

  // Prefer explicitly provided values; fall back to session data.
  const letterEmail = email?.trim() || session?.email || "";
  const letterName = fullName?.trim() || session?.username || "";

  try {
    const result = await produceDraft({
      fullName: letterName || undefined,
      email: letterEmail || undefined,
      domain,
      languageLabel,
      issueText,
      locationLabel: location?.label,
      lat: location?.lat,
      lng: location?.lng,
    });

    return NextResponse.json({
      draft: { subject: result.subject, body: result.body },
      ai: result.ai,
      source: result.source,
    });
  } catch (err) {
    console.error("[draft] produceDraft threw unexpectedly:", err);
    return NextResponse.json(
      { error: "Draft generation failed. Please try again." },
      { status: 500 },
    );
  }
}
