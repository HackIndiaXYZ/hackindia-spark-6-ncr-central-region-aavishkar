export async function sendComplaintCopyEmail(opts: {
  to: string;
  referenceId: string;
  subject: string;
  body: string;
}): Promise<{ ok: boolean; provider: "resend" | "none"; detail?: string }> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim() || "JanSetu <onboarding@resend.dev>";
  if (!key) {
    return { ok: false, provider: "none", detail: "RESEND_API_KEY not configured" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [opts.to],
      subject: `JanSetu copy • ${opts.referenceId} • ${opts.subject}`,
      text: [
        `Reference: ${opts.referenceId}`,
        "",
        "Complaint letter (copy):",
        "",
        `Subject: ${opts.subject}`,
        "",
        opts.body,
      ].join("\n"),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return { ok: false, provider: "resend", detail: detail || res.statusText };
  }
  return { ok: true, provider: "resend" };
}
