import { NextResponse } from "next/server";
import { z } from "zod";
import { DOMAINS, type ComplaintDomain } from "@/lib/complaint";
import { complaintsRepo } from "@/lib/db";
import { readSession } from "@/lib/session";
import { createReferenceId } from "@/lib/reference-id";
import { sendComplaintCopyEmail } from "@/lib/mail";

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
  draft: z.object({
    subject: z.string().min(1).max(500),
    body: z.string().min(1).max(20000),
  }),
  ai: z
    .object({
      severityScore: z.number(),
      severityLabel: z.string(),
      routedDepartment: z.string(),
      intent: z.string().optional(),
      entities: z.record(z.string(), z.array(z.string())).optional(),
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

  const { domain, languageLabel, issueText, fullName, email, location, draft, ai } = parsed.data;
  const referenceId = createReferenceId();
  const copyTo = email?.trim() || session.email;

  const mail = await sendComplaintCopyEmail({
    to: copyTo,
    referenceId,
    subject: draft.subject,
    body: draft.body,
  });

  await complaintsRepo.insert({
    userId: session.sub,
    domain,
    languageLabel,
    issueText,
    location,
    draft,
    ai,
    referenceId,
    emailSent: mail.ok,
  });

  return NextResponse.json({
    referenceId,
    routedDepartment: ai?.routedDepartment,
    email: {
      attempted: Boolean(process.env.RESEND_API_KEY),
      sent: mail.ok,
      provider: mail.provider,
      detail: mail.detail,
      to: copyTo,
    },
  });
}
