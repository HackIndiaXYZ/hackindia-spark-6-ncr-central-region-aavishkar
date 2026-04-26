"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getStatusColor,
  getSeverityColor,
  type ComplaintStatus,
} from "@/lib/dashboard-data";
import { MapPin, ChevronDown, ChevronUp, Filter, X } from "lucide-react";

const ALL_STATUSES: ComplaintStatus[] = ["Pending", "In Progress", "Resolved", "Rejected"];
type TrackerComplaint = {
  id: string;
  domain: string;
  draftSubject: string;
  issueText: string;
  createdAt: string;
  locationLabel: string | null;
  ai: { severityLabel: string } | null;
  emailSent: boolean;
};

function StatusBadge({ status }: { status: ComplaintStatus }) {
  const color = getStatusColor(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {status}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: "Low" | "Medium" | "High" | "Critical" }) {
  const color = getSeverityColor(severity);
  return (
    <span
      className="inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{ background: `${color}20`, color }}
    >
      {severity}
    </span>
  );
}

function Timeline({ status }: { status: ComplaintStatus }) {
  const steps = [
    { label: "Filed", done: true, active: status === "Pending" },
    { label: "In Progress", done: status === "In Progress" || status === "Resolved", active: status === "In Progress" },
    { label: "Resolved", done: status === "Resolved", active: status === "Resolved" },
  ];
  return (
    <div className="mt-3 flex items-center gap-0">
      {steps.map((step, i) => (
        <div key={i} className="flex flex-1 flex-col items-center">
          <div className="flex w-full items-center">
            <div
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold transition-all"
              style={{
                background: step.done ? "#6affed" : step.active ? "#ffc448" : "rgba(255,255,255,0.06)",
                color: step.done || step.active ? "#000" : "rgba(255,255,255,0.3)",
                boxShadow: step.active ? "0 0 8px #ffc44880" : step.done ? "0 0 6px #6affed40" : "none",
              }}
            >
              {step.done ? "✓" : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className="h-0.5 flex-1" style={{ background: step.done ? "#6affed60" : "rgba(255,255,255,0.08)" }} />
            )}
          </div>
          <p className="mt-1 text-center text-[9px] text-white/40 leading-tight">{step.label}</p>
          <p className="text-center text-[8px] text-white/25"> </p>
        </div>
      ))}
    </div>
  );
}

export function ComplaintTracker({ complaints }: { complaints: TrackerComplaint[] }) {
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | "All">("All");
  const [categoryFilter, setCategoryFilter] = useState<string | "All">("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const allCategories = useMemo(
    () => Array.from(new Set(complaints.map((c) => c.domain))).sort(),
    [complaints],
  );

  const filtered = useMemo(() => {
    return complaints
      .map((c) => {
        const severityText = c.ai?.severityLabel?.toLowerCase() ?? "medium";
        const severity: "Low" | "Medium" | "High" | "Critical" =
          severityText.includes("critical")
            ? "Critical"
            : severityText.includes("high")
              ? "High"
              : severityText.includes("low")
                ? "Low"
                : "Medium";
        const status: ComplaintStatus = c.emailSent ? "Resolved" : "Pending";
        return { ...c, severity, status };
      })
      .filter((c) => {
      if (statusFilter !== "All" && c.status !== statusFilter) return false;
      if (categoryFilter !== "All" && c.domain !== categoryFilter) return false;
      return true;
    });
  }, [complaints, statusFilter, categoryFilter]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Complaint Tracker</CardTitle>
            <p className="mt-0.5 text-xs text-white/50">{filtered.length} complaints</p>
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.10] bg-white/[0.05] px-3 py-1.5 text-xs text-white/70 transition-all hover:bg-white/[0.09] hover:text-white"
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
            {(statusFilter !== "All" || categoryFilter !== "All") && (
              <span className="ml-1 h-2 w-2 rounded-full bg-[rgb(var(--brand))]" />
            )}
          </button>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 flex flex-wrap gap-2 border-t border-white/[0.06] pt-3">
                <div className="flex flex-wrap gap-1.5">
                  <span className="self-center text-xs text-white/40">Status:</span>
                  {["All", ...ALL_STATUSES].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s as ComplaintStatus | "All")}
                      className={`rounded-lg px-2.5 py-1 text-xs transition-all ${
                        statusFilter === s
                          ? "bg-[rgb(var(--brand))/0.15] text-[rgb(var(--brand))] ring-1 ring-[rgb(var(--brand))/0.3]"
                          : "bg-white/[0.05] text-white/50 hover:bg-white/[0.09]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="self-center text-xs text-white/40">Category:</span>
                  {["All", ...allCategories].map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategoryFilter(c as string | "All")}
                      className={`rounded-lg px-2.5 py-1 text-xs transition-all ${
                        categoryFilter === c
                          ? "bg-[rgb(var(--brand-2))/0.15] text-[rgb(var(--brand-2))] ring-1 ring-[rgb(var(--brand-2))/0.3]"
                          : "bg-white/[0.05] text-white/50 hover:bg-white/[0.09]"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                {(statusFilter !== "All" || categoryFilter !== "All") && (
                  <button
                    onClick={() => { setStatusFilter("All"); setCategoryFilter("All"); }}
                    className="flex items-center gap-1 rounded-lg bg-red-500/10 px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/20"
                  >
                    <X className="h-3 w-3" /> Clear
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-white/40">No complaints match your filters.</p>
          )}
          {filtered.map((c) => {
            const isExpanded = expandedId === c.id;
            return (
              <motion.div
                key={c.id}
                layout
                className="overflow-hidden rounded-2xl border border-white/[0.08] bg-black/20 transition-all hover:border-white/[0.14]"
              >
                <button
                  className="w-full px-4 py-3 text-left"
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-white/90">{c.draftSubject}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-xs text-white/45">{c.domain}</span>
                        <span className="flex items-center gap-1 text-xs text-white/40">
                          <MapPin className="h-3 w-3" />{c.locationLabel ?? "Location not set"}
                        </span>
                        <span className="text-xs text-white/35">{new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <StatusBadge status={c.status} />
                      <SeverityBadge severity={c.severity} />
                    </div>
                    <div className="shrink-0 text-white/30">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-white/[0.06] px-4 pb-4"
                    >
                      <p className="mt-3 text-sm leading-relaxed text-white/60">{c.issueText}</p>
                      <div className="mt-2 flex gap-3 text-xs text-white/40">
                        <span>🧾 Ref: {c.id}</span>
                        {c.locationLabel ? <span>📍 Precise location</span> : null}
                        <span>⚡ Severity: {c.severity}</span>
                      </div>
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">Progress Timeline</p>
                        <Timeline status={c.status} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
