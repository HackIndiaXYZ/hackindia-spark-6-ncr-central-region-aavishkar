"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_AI_INSIGHTS } from "@/lib/dashboard-data";
import { Brain, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface AIInsightsProps {
  expanded?: boolean;
}

export function AIInsights({ expanded = false }: AIInsightsProps) {
  const insights = expanded ? MOCK_AI_INSIGHTS : MOCK_AI_INSIGHTS.slice(0, 2);

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
          {MOCK_AI_INSIGHTS.map((insight, i) => (
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
            <p className="text-xs text-white/50 mt-0.5">7 active reports within 2km of your last complaint</p>
          </div>
          <button className="flex shrink-0 items-center gap-1 rounded-xl border border-[rgba(160,128,255,0.3)] bg-[rgba(160,128,255,0.15)] px-3 py-1.5 text-xs text-[rgb(var(--brand-2))] transition-all hover:bg-[rgba(160,128,255,0.25)]">
            View <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
