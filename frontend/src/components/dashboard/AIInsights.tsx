"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface AIInsightsProps {
  expanded?: boolean;
  onViewSimilarComplaints?: () => void;
  complaints: Array<{
    domain: string;
    ai: { severityScore: number; severityLabel: string; routedDepartment: string } | null;
    createdAt: string;
  }>;
}

export function AIInsights({
  expanded = false,
  onViewSimilarComplaints,
  complaints,
}: AIInsightsProps) {
  const [renderedAt] = useState(() => Date.now());
  const total = complaints.length;
  const avgSeverity =
    total === 0
      ? 0
      : Math.round(
          complaints.reduce((sum, c) => sum + (c.ai?.severityScore ?? 0), 0) / total,
        );
  const domainCount = new Map<string, number>();
  const deptCount = new Map<string, number>();
  for (const complaint of complaints) {
    domainCount.set(complaint.domain, (domainCount.get(complaint.domain) ?? 0) + 1);
    if (complaint.ai?.routedDepartment) {
      deptCount.set(
        complaint.ai.routedDepartment,
        (deptCount.get(complaint.ai.routedDepartment) ?? 0) + 1,
      );
    }
  }
  const topDomain =
    Array.from(domainCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "No complaints yet";
  const topDepartment =
    Array.from(deptCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";
  const recent30Days = complaints.filter((c) => {
    const created = new Date(c.createdAt).getTime();
    return renderedAt - created <= 30 * 24 * 60 * 60 * 1000;
  }).length;

  const insights = [
    {
      title: "Most reported category",
      value: topDomain,
      detail: `${total} total complaint${total === 1 ? "" : "s"} recorded for this account.`,
      icon: "📌",
      color: "#ffc448",
    },
    {
      title: "Average severity",
      value: `${avgSeverity}/100`,
      detail: "Computed from AI severity scores on saved complaints.",
      icon: "📊",
      color: "#6affed",
    },
    {
      title: "Most routed department",
      value: topDepartment,
      detail: "Department that appears most in AI routing outputs.",
      icon: "🏛️",
      color: "#a080ff",
    },
    {
      title: "Recent activity",
      value: `${recent30Days} in 30 days`,
      detail: "Complaints filed in the last 30 days.",
      icon: "🗓️",
      color: "#ff5da0",
    },
  ];
  const visibleInsights = expanded ? insights : insights.slice(0, 2);

  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[rgba(160,128,255,0.06)] to-transparent" />
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-[rgb(var(--brand-2))]" />
          AI Insights
          <span className="ml-auto rounded-full border border-[rgb(var(--brand-2))/0.3] bg-[rgb(var(--brand-2))/0.12] px-2 py-0.5 text-[10px] font-bold text-[rgb(var(--brand-2))]">
            BETA
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`grid gap-3 ${expanded ? "sm:grid-cols-2" : ""}`}>
          {visibleInsights.map((insight, i) => (
            <motion.div
              key={insight.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ scale: 1.02 }}
              className="flex gap-3 rounded-2xl border border-white/[0.08] bg-black/20 p-4 transition-all hover:border-white/[0.15]"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
                style={{ background: `${insight.color}18`, border: `1px solid ${insight.color}30` }}
              >
                {insight.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: insight.color }}>
                  {insight.title}
                </p>
                <p className="mt-0.5 text-sm font-bold text-white">{insight.value}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-white/50">{insight.detail}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Suggestion CTA */}
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-[rgba(160,128,255,0.2)] bg-[rgba(160,128,255,0.08)] px-4 py-3">
          <div>
            <p className="text-xs font-semibold text-[rgb(var(--brand-2))]">Similar Complaints Near You</p>
            <p className="text-xs text-white/50 mt-0.5">Insights are now generated from your saved complaints only.</p>
          </div>
          <button
            type="button"
            onClick={onViewSimilarComplaints}
            className="flex shrink-0 items-center gap-1 rounded-xl border border-[rgba(160,128,255,0.3)] bg-[rgba(160,128,255,0.15)] px-3 py-1.5 text-xs text-[rgb(var(--brand-2))] transition-all hover:bg-[rgba(160,128,255,0.25)]"
          >
            View <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
