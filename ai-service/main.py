from __future__ import annotations

import re
from datetime import date
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="JanSetu AI Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DraftRequest(BaseModel):
    issue_text: str = Field(min_length=3, max_length=8000)
    domain: str = Field(min_length=2, max_length=120)
    language_label: str = Field(min_length=1, max_length=80)
    full_name: str = ""
    email: str = ""
    location_label: str = ""
    lat: float | None = None
    lng: float | None = None


class DraftResponse(BaseModel):
    subject: str
    body: str
    severity_score: float
    severity_label: str
    routed_department: str
    intent: str
    entities: dict[str, list[str]]


RISK_KEYWORDS = [
    (r"\b(bribe|bribery|corruption|extortion)\b", 26),
    (r"\b(threat|unsafe|accident|injury|death)\b", 30),
    (r"\b(fraud|forgery|fake)\b", 18),
    (r"\b(urgent|emergency|immediate|danger)\b", 12),
]


def infer_intent(text: str) -> str:
    t = text.lower()
    if "not working" in t or "outage" in t:
        return "service_failure"
    if "bribe" in t or "corruption" in t:
        return "misconduct_report"
    if "delay" in t or "pending" in t:
        return "delay_escalation"
    return "general_complaint"


def extract_entities(text: str) -> dict[str, list[str]]:
    entities: dict[str, list[str]] = {}
    phones = re.findall(r"\+?\d[\d\s-]{8,}\d", text)
    if phones:
        entities["phone"] = phones[:5]
    emails = re.findall(r"[^\s@]+@[^\s@]+\.[^\s@]+", text)
    if emails:
        entities["email"] = emails[:5]
    money = re.findall(r"(?:₹|rs\.?|inr)\s*\d[\d,]*", text, flags=re.I)
    if money:
        entities["money"] = money[:5]
    return entities


def severity_score(text: str, domain: str) -> tuple[float, str]:
    score = 22.0
    blob = f"{domain} {text}".lower()
    for pattern, w in RISK_KEYWORDS:
        if re.search(pattern, blob, flags=re.I):
            score += w
    score = min(100.0, score)
    label = "High" if score >= 70 else "Medium" if score >= 40 else "Low"
    return score, label


def route_department(domain: str, issue: str) -> str:
    d = domain.lower()
    t = issue.lower()
    if "electric" in d:
        return "State Electricity Board / DISCOM"
    if "telecom" in d:
        return "Department of Telecommunications / TRAI (as applicable)"
    if "tax" in d:
        return "Local Tax / Revenue Office"
    if "transport" in d:
        return "Regional Transport Authority / Municipal Transport"
    if "distribution" in d or "food" in d:
        return "Food & Civil Supplies / PDS Cell"
    if "identity" in d or "documentation" in d:
        return "UIDAI / Regional Registrar (as applicable)"
    if "corruption" in d or "misconduct" in d:
        return "Vigilance / Anti-Corruption Authority (as applicable)"
    if "water" in t:
        return "Municipal Water / Jal Board"
    return "Concerned Department (auto-routed by JanSetu)"


def build_letter(req: DraftRequest) -> tuple[str, str]:
    today = date.today().strftime("%B %d, %Y")
    name = req.full_name.strip() or "A concerned citizen"
    subject = f"Complaint regarding {req.domain}"

    loc = req.location_label.strip()
    if req.lat is not None and req.lng is not None:
        coord = f" ({req.lat:.5f}, {req.lng:.5f})"
        loc = f"{loc}{coord}" if loc else f"{req.lat:.5f}, {req.lng:.5f}"
    if not loc:
        loc = "Not provided"

    body_lines = [
        f"Date: {today}",
        "",
        "To,",
        "The Concerned Officer,",
        "[Respective Department / Authority]",
        "",
        f"Subject: {subject}",
        "",
        "Respected Sir/Madam,",
        "",
        f'I, {name}, would like to bring to your attention an issue related to "{req.domain}". '
        "I am submitting this complaint using JanSetu-AI with the following details:",
        "",
        f"Language used: {req.language_label}",
        f"Location: {loc}",
        "",
        "Description of the issue:",
        req.issue_text.strip(),
        "",
        "I request you to kindly take necessary action at the earliest. Please acknowledge receipt "
        "of this complaint and provide a reference number for tracking.",
        "",
        "Thank you for your time and attention.",
        "",
        "Sincerely,",
        name,
    ]
    if req.email.strip():
        body_lines.append(req.email.strip())
    body = "\n".join([ln for ln in body_lines if ln is not None])
    return subject, body


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/v1/draft", response_model=DraftResponse)
def draft(req: DraftRequest) -> DraftResponse:
    score, label = severity_score(req.issue_text, req.domain)
    routed = route_department(req.domain, req.issue_text)
    intent = infer_intent(req.issue_text)
    entities = extract_entities(req.issue_text)
    subject, body = build_letter(req)
    return DraftResponse(
        subject=subject,
        body=body,
        severity_score=score,
        severity_label=label,
        routed_department=routed,
        intent=intent,
        entities=entities,
    )


@app.get("/")
def root() -> dict[str, Any]:
    return {"service": "jansetu-ai", "docs": "/docs"}
