"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type TooltipEntry = { color?: string; fill?: string; name?: string; value?: string | number };
function DarkTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/[0.12] bg-[#12131a] px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-white/80">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }}>{p.name}: {p.value}{p.name === "Resolution Rate" ? "%" : ""}</p>
      ))}
    </div>
  );
}

interface ImpactDashboardProps {
  expanded?: boolean;
  complaints: Array<{
    createdAt: string;
    domain: string;
    emailSent: boolean;
  }>;
}

export function ImpactDashboard({ expanded = false, complaints }: ImpactDashboardProps) {
  const monthMap = new Map<string, { month: string; count: number; resolved: number }>();
  for (const complaint of complaints) {
    const date = new Date(complaint.createdAt);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const month = date.toLocaleDateString("en-IN", { month: "short" });
    const current = monthMap.get(key) ?? { month, count: 0, resolved: 0 };
    current.count += 1;
    if (complaint.emailSent) current.resolved += 1;
    monthMap.set(key, current);
  }

  const complaintsOverTime = Array.from(monthMap.values()).slice(-6).map((x) => ({ month: x.month, count: x.count }));
  const resolutionRate = Array.from(monthMap.values())
    .slice(-6)
    .map((x) => ({ month: x.month, rate: x.count === 0 ? 0 : Math.round((x.resolved / x.count) * 100) }));
  const categoryByCount = new Map<string, number>();
  for (const complaint of complaints) {
    categoryByCount.set(complaint.domain, (categoryByCount.get(complaint.domain) ?? 0) + 1);
  }
  const categoryBreakdown = Array.from(categoryByCount.entries()).map(([name, value]) => ({ name, value }));
  const total = complaints.length;
  const resolved = complaints.filter((x) => x.emailSent).length;
  const responseRate = total === 0 ? 0 : Math.round((resolved / total) * 100);

  const stats = [
    { label: "Issues Resolved", value: String(resolved), icon: CheckCircle, color: "#4ade80", sub: `out of ${total} filed` },
    { label: "Response Rate", value: `${responseRate}%`, icon: Zap, color: "#6affed", sub: "Based on sent complaint emails" },
    { label: "Complaints Filed", value: String(total), icon: TrendingUp, color: "#a080ff", sub: "Stored in your account" },
    { label: "Domains Covered", value: String(categoryBreakdown.length), icon: BarChart2, color: "#ffc448", sub: "Unique complaint categories" },
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
              <BarChart data={complaintsOverTime} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
              <LineChart data={resolutionRate} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
                  <Pie data={categoryBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} paddingAngle={3}>
                    {categoryBreakdown.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<DarkTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {categoryBreakdown.map((c, i) => (
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
