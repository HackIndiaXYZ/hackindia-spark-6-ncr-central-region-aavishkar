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
  email: z.string().email().optional(),
  location: z
    .object({
      lng: z.number(),
      lat: z.number(),
      label: z.string().max(500).optional(),
    })
    .optional(),
});

export async function POST(req: Request) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { domain, languageLabel, issueText, fullName, email, location } = parsed.data;
  const letterEmail = email?.trim() || session.email;
  const letterName = fullName?.trim() || session.username;

  const result = await produceDraft({
    fullName: letterName,
    email: letterEmail,
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
}
