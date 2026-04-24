export type ComplaintDomain =
  | "Corruption / Misconduct"
  | "Electricity & Utilities"
  | "Telecom & Internet"
  | "Public Distribution & Food"
  | "Transport & Travel"
  | "Tax & Government Revenue"
  | "Identity & Documentation"
  | "Other";

export const DOMAINS: ComplaintDomain[] = [
  "Corruption / Misconduct",
  "Electricity & Utilities",
  "Telecom & Internet",
  "Public Distribution & Food",
  "Transport & Travel",
  "Tax & Government Revenue",
  "Identity & Documentation",
  "Other",
];

export type ComplaintDraftInput = {
  fullName?: string;
  email?: string;
  domain: ComplaintDomain;
  languageLabel: string;
  issueText: string;
  locationLabel?: string;
  lat?: number;
  lng?: number;
};

export function generateComplaintLetter(input: ComplaintDraftInput) {
  const date = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const locationLine = input.locationLabel
    ? `${input.locationLabel}${typeof input.lat === "number" && typeof input.lng === "number" ? ` (${input.lat.toFixed(5)}, ${input.lng.toFixed(5)})` : ""}`
    : typeof input.lat === "number" && typeof input.lng === "number"
      ? `${input.lat.toFixed(5)}, ${input.lng.toFixed(5)}`
      : "Not provided";

  const subject = `Complaint regarding ${input.domain}`;

  const nameLine = input.fullName?.trim() ? input.fullName.trim() : "A concerned citizen";

  const body = [
    `Date: ${date}`,
    ``,
    `To,`,
    `The Concerned Officer,`,
    `[Respective Department / Authority]`,
    ``,
    `Subject: ${subject}`,
    ``,
    `Respected Sir/Madam,`,
    ``,
    `I, ${nameLine}, would like to bring to your attention an issue related to "${input.domain}". I am submitting this complaint using JanSetu-AI with the following details:`,
    ``,
    `Language used: ${input.languageLabel}`,
    `Location: ${locationLine}`,
    ``,
    `Description of the issue:`,
    `${input.issueText.trim() || "[User will provide details]"}`,
    ``,
    `I request you to kindly take necessary action at the earliest. Please acknowledge receipt of this complaint and provide a reference number for tracking.`,
    ``,
    `Thank you for your time and attention.`,
    ``,
    `Sincerely,`,
    `${nameLine}`,
    `${input.email?.trim() ? input.email.trim() : ""}`.trimEnd(),
  ]
    .filter((line) => line !== "")
    .join("\n");

  return { subject, body };
}

