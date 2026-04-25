"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_CHART_DATA } from "@/lib/dashboard-data";
import { BarChart2, TrendingUp, CheckCircle, Zap } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const PIE_COLORS = ["#6affed", "#a080ff", "#ffc448", "#ff5da0", "#4ade80", "#60a5fa", "#fb923c"];

function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/[0.12] bg-[#12131a] px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-white/80">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || p.fill }}>{p.name}: {p.value}{p.name === "Resolution Rate" ? "%" : ""}</p>
      ))}
    </div>
  );
}

interface ImpactDashboardProps {
  expanded?: boolean;
}

export function ImpactDashboard({ expanded = false }: ImpactDashboardProps) {
  const stats = [
    { label: "Issues Resolved", value: "7", icon: CheckCircle, color: "#4ade80", sub: "out of 12 filed" },
    { label: "Response Rate", value: "83%", icon: Zap, color: "#6affed", sub: "Govt responded" },
    { label: "Avg Resolution", value: "4.2d", icon: TrendingUp, color: "#a080ff", sub: "Days to close" },
    { label: "Area Cleanliness", value: "+12%", icon: BarChart2, color: "#ffc448", sub: "vs last month" },
  ];

  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[rgba(106,255,237,0.04)] to-transparent" />
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-[rgb(var(--brand))]" />
          Impact Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex flex-col gap-1 rounded-2xl border border-white/[0.08] bg-black/20 p-3">
                <Icon className="h-4 w-4" style={{ color: s.color }} />
                <p className="text-xl font-bold text-white" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs font-semibold text-white/70">{s.label}</p>
                <p className="text-[10px] text-white/35">{s.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className={`grid gap-5 ${expanded ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
          {/* Complaints over time */}
          <div className={`rounded-2xl border border-white/[0.08] bg-black/20 p-4 ${expanded ? "" : ""}`}>
            <p className="mb-3 text-xs font-semibold text-white/60 uppercase tracking-wider">Complaints Over Time</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={MOCK_CHART_DATA.complaintsOverTime} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="count" name="Complaints" fill="#6affed" radius={[4, 4, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Resolution rate */}
          <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
            <p className="mb-3 text-xs font-semibold text-white/60 uppercase tracking-wider">Resolution Rate</p>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={MOCK_CHART_DATA.resolutionRate} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip />} />
                <Line type="monotone" dataKey="rate" name="Resolution Rate" stroke="#a080ff" strokeWidth={2.5} dot={{ fill: "#a080ff", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category breakdown – only in expanded view */}
          {expanded && (
            <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
              <p className="mb-3 text-xs font-semibold text-white/60 uppercase tracking-wider">By Category</p>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={MOCK_CHART_DATA.categoryBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} paddingAngle={3}>
                    {MOCK_CHART_DATA.categoryBreakdown.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<DarkTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {MOCK_CHART_DATA.categoryBreakdown.map((c, i) => (
                  <span key={c.name} className="flex items-center gap-1 text-[10px] text-white/50">
                    <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
