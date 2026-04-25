from __future__ import annotations

import logging
import os
import re
from datetime import date
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger("jansetu")

# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------
# picks up .env in the working directory (or any parent)
load_dotenv()
# common local-dev convention; safe if missing
load_dotenv(".env.local")

MONGO_URL = os.getenv("MONGO_URL", "")
DB_NAME = os.getenv("DB_NAME", "")
JWT_SECRET = os.getenv("JWT_SECRET", "")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_HOURS = 24 * 7

_raw_llm_key = (os.getenv("EMERGENT_LLM_KEY") or os.getenv("OPENAI_API_KEY") or "").strip()
OPENAI_API_KEY: str = _raw_llm_key
OPENAI_MODEL: str = os.environ.get("OPENAI_MODEL", "gpt-3.5-turbo")

if not MONGO_URL or not DB_NAME:
    log.warning("Mongo env not set (MONGO_URL/DB_NAME) — DB features may not work.")
if not JWT_SECRET:
    log.warning("JWT_SECRET not set — auth features may not work.")

# ---------------------------------------------------------------------------
# OpenAI client (optional — falls back to rule-based if key absent)
# ---------------------------------------------------------------------------
try:
    from openai import OpenAI, OpenAIError  # type: ignore[import]

    _client: OpenAI | None = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None
except ImportError:
    OpenAIError = Exception  # type: ignore[misc,assignment]
    _client = None

if _client:
    log.info("OpenAI client ready  (model=%s)", OPENAI_MODEL)
else:
    log.warning(
        "EMERGENT_LLM_KEY / OPENAI_API_KEY not set or openai package missing — "
        "falling back to rule-based letter generation."
    )

# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(title="JanSetu AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------


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


# ---------------------------------------------------------------------------
# Pure-logic helpers (always available, used as metadata + fallback)
# ---------------------------------------------------------------------------

_RISK = [
    (r"\b(bribe|bribery|corruption|extortion)\b", 26),
    (r"\b(threat|unsafe|accident|injury|death)\b", 30),
    (r"\b(fraud|forgery|fake)\b", 18),
    (r"\b(urgent|emergency|immediate|danger)\b", 12),
]


def _severity(text: str, domain: str) -> tuple[float, str]:
    score = 22.0
    blob = f"{domain} {text}".lower()
    for pat, w in _RISK:
        if re.search(pat, blob, re.I):
            score += w
    score = min(100.0, score)
    label = "High" if score >= 70 else "Medium" if score >= 40 else "Low"
    return score, label


def _route(domain: str, issue: str) -> str:
    d, t = domain.lower(), issue.lower()
    if "electric" in d:
        return "State Electricity Board / DISCOM"
    if "telecom" in d:
        return "Department of Telecommunications / TRAI"
    if "tax" in d:
        return "Local Tax / Revenue Office"
    if "transport" in d:
        return "Regional Transport Authority / Municipal Transport"
    if "distribution" in d or "food" in d:
        return "Food & Civil Supplies / PDS Cell"
    if "identity" in d or "documentation" in d:
        return "UIDAI / Regional Registrar"
    if "corruption" in d or "misconduct" in d:
        return "Vigilance / Anti-Corruption Authority"
    if "water" in t:
        return "Municipal Water / Jal Board"
    if "garbage" in t or "waste" in t or "sanitation" in t:
        return "Municipal Corporation / Sanitation Department"
    return "Concerned Department (auto-routed by JanSetu)"


def _intent(text: str) -> str:
    t = text.lower()
    if "not working" in t or "outage" in t:
        return "service_failure"
    if "bribe" in t or "corruption" in t:
        return "misconduct_report"
    if "delay" in t or "pending" in t:
        return "delay_escalation"
    return "general_complaint"


def _entities(text: str) -> dict[str, list[str]]:
    out: dict[str, list[str]] = {}
    phones = re.findall(r"\+?\d[\d\s-]{8,}\d", text)
    if phones:
        out["phone"] = phones[:5]
    emails = re.findall(r"[^\s@]+@[^\s@]+\.[^\s@]+", text)
    if emails:
        out["email"] = emails[:5]
    money = re.findall(r"(?:₹|rs\.?|inr)\s*\d[\d,]*", text, re.I)
    if money:
        out["money"] = money[:5]
    return out


# ---------------------------------------------------------------------------
# Rule-based letter builder (guaranteed fallback)
# ---------------------------------------------------------------------------


def _build_local(req: DraftRequest) -> tuple[str, str]:
    today = date.today().strftime("%B %d, %Y")
    name = req.full_name.strip() or "A concerned citizen"
    subject = f"Complaint regarding {req.domain}"

    loc = req.location_label.strip()
    if req.lat is not None and req.lng is not None:
        coord = f" ({req.lat:.5f}, {req.lng:.5f})"
        loc = f"{loc}{coord}" if loc else f"{req.lat:.5f}, {req.lng:.5f}"
    loc = loc or "Not provided"

    lines = [
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
        "I am submitting this complaint through JanSetu-AI with the following details:",
        "",
        f"Language used: {req.language_label}",
        f"Location: {loc}",
        "",
        "Description of the issue:",
        req.issue_text.strip(),
        "",
        "I request you to kindly look into this matter and take appropriate action at the earliest. "
        "Please acknowledge receipt of this complaint and provide a reference number for tracking.",
        "",
        "Thank you for your time and attention.",
        "",
        "Sincerely,",
        name,
    ]
    if req.email.strip():
        lines.append(req.email.strip())
    return subject, "\n".join(lines)


# ---------------------------------------------------------------------------
# OpenAI-powered letter builder
# ---------------------------------------------------------------------------

_SYSTEM = """\
You are JanSetu-AI, an expert assistant that drafts formal complaint letters \
addressed to Indian government departments on behalf of Indian citizens. \
Follow the standard Indian government complaint format strictly: \
(1) Date line, (2) To/Designation block, (3) Subject line prefixed with "Subject:", \
(4) Salutation "Respected Sir/Madam,", (5) Body paragraphs, \
(6) Closing "Thank you for your time and attention.", (7) "Sincerely," and the name. \
Write in clear, polite, formal English unless a different language is explicitly requested. \
Output ONLY the letter text — no preamble, explanation, or markdown. \
Start the very first line with "Date:".\
"""


def _build_ai(req: DraftRequest) -> tuple[str, str]:
    assert _client is not None
    today = date.today().strftime("%B %d, %Y")
    name = req.full_name.strip() or "A concerned citizen"

    loc = req.location_label.strip()
    if req.lat is not None and req.lng is not None:
        coord = f" ({req.lat:.5f}, {req.lng:.5f})"
        loc = f"{loc}{coord}" if loc else f"{req.lat:.5f}, {req.lng:.5f}"
    loc = loc or "Not provided"

    user_msg = (
        f"Today's date: {today}\n"
        f"Complainant name: {name}\n"
        f"Complainant email: {req.email.strip() or 'Not provided'}\n"
        f"Domain / service area: {req.domain}\n"
        f"Location: {loc}\n"
        f"Preferred language for the letter: {req.language_label}\n\n"
        f"Issue (as described by the citizen):\n{req.issue_text.strip()}\n\n"
        "Please draft the formal complaint letter now. "
        "Make sure the Subject line starts exactly with 'Subject:' on its own line."
    )

    response = _client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": _SYSTEM},
            {"role": "user", "content": user_msg},
        ],
        temperature=0.3,
        max_tokens=1000,
    )

    letter = (response.choices[0].message.content or "").strip()

    # Extract subject from the generated letter
    subject = f"Complaint regarding {req.domain}"
    for line in letter.splitlines():
        stripped = line.strip()
        if stripped.lower().startswith("subject:"):
            subject = stripped.split(":", 1)[1].strip()
            break

    return subject, letter


# ---------------------------------------------------------------------------
# Unified builder — tries OpenAI, falls back gracefully
# ---------------------------------------------------------------------------


def build_letter(req: DraftRequest) -> tuple[str, str]:
    if _client:
        try:
            subject, body = _build_ai(req)
            if subject and body:
                return subject, body
            log.warning("OpenAI returned empty content — using local fallback")
        except OpenAIError as exc:
            log.warning("OpenAI API error (%s) — using local fallback", exc)
        except Exception as exc:  # noqa: BLE001
            log.warning("Unexpected error calling OpenAI (%s) — using local fallback", exc)
    return _build_local(req)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "letter_engine": "openai" if _client else "rule-based",
        "model": OPENAI_MODEL if _client else None,
    }


@app.post("/v1/draft", response_model=DraftResponse)
def draft(req: DraftRequest) -> DraftResponse:
    score, label = _severity(req.issue_text, req.domain)
    routed = _route(req.domain, req.issue_text)
    intent = _intent(req.issue_text)
    entities = _entities(req.issue_text)
    subject, body = build_letter(req)
    log.info(
        "draft  domain=%r  severity=%s  engine=%s",
        req.domain,
        label,
        "openai" if _client else "local",
    )
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
    return {"service": "jansetu-ai", "version": "1.0.0", "docs": "/docs"}
