"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_LEADERBOARD } from "@/lib/dashboard-data";
import { Trophy } from "lucide-react";

type Period = "weekly" | "alltime";

export function Leaderboard() {
  const [period, setPeriod] = useState<Period>("alltime");

  // For demo, weekly just shows a reshuffled subset
  const data =
    period === "alltime"
      ? MOCK_LEADERBOARD
      : [...MOCK_LEADERBOARD].sort(() => Math.random() - 0.5).slice(0, 8).map((u, i) => ({ ...u, rank: i + 1 }));

  const currentUser = MOCK_LEADERBOARD.find((u) => u.isCurrentUser);

  const rankBg = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-500/20 to-yellow-400/10 border-yellow-400/30";
    if (rank === 2) return "bg-gradient-to-r from-slate-400/10 to-slate-300/5 border-slate-400/20";
    if (rank === 3) return "bg-gradient-to-r from-orange-600/15 to-orange-500/8 border-orange-500/25";
    return "bg-black/20 border-white/[0.06]";
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-bl from-[rgba(255,196,72,0.05)] to-transparent" />
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-[#ffc448]" />
            Leaderboard
          </CardTitle>
          <div className="flex gap-1 rounded-xl border border-white/[0.08] bg-white/[0.04] p-1">
            {(["weekly", "alltime"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                  period === p
                    ? "bg-[rgb(var(--brand))/0.15] text-[rgb(var(--brand))] ring-1 ring-[rgb(var(--brand))/0.3]"
                    : "text-white/50 hover:text-white/70"
                }`}
              >
                {p === "weekly" ? "Weekly" : "All Time"}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Current user highlight */}
        {currentUser && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-[rgb(var(--brand))/0.3] bg-[rgb(var(--brand))/0.08] px-4 py-3">
            <span className="text-sm font-bold text-[rgb(var(--brand))]">#{currentUser.rank}</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[rgb(var(--brand))] to-[rgb(var(--brand-2))] text-sm font-bold text-black">
              {currentUser.avatar}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">You • {currentUser.name}</p>
              <p className="text-xs text-white/50">{currentUser.points.toLocaleString()} pts • {currentUser.level}</p>
            </div>
            <span className="text-xl">{currentUser.badge}</span>
          </div>
        )}

        <div className="space-y-2">
          {data.map((entry, i) => (
            <motion.div
              key={`${period}-${entry.rank}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all hover:scale-[1.01] ${
                entry.isCurrentUser
                  ? "border-[rgb(var(--brand))/0.3] bg-[rgb(var(--brand))/0.08]"
                  : rankBg(entry.rank)
              }`}
            >
              {/* Rank */}
              <div className="w-7 text-center">
                {entry.rank <= 3 ? (
                  <span className="text-lg">{entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}</span>
                ) : (
                  <span className="text-sm font-bold text-white/40">#{entry.rank}</span>
                )}
              </div>

              {/* Avatar */}
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold"
                style={{
                  background: entry.isCurrentUser
                    ? "linear-gradient(135deg, rgb(106,255,237), rgb(160,128,255))"
                    : "rgba(255,255,255,0.08)",
                  color: entry.isCurrentUser ? "#000" : "rgba(255,255,255,0.8)",
                }}
              >
                {entry.avatar}
              </div>

              {/* Name + level */}
              <div className="flex-1 min-w-0">
                <p className={`truncate text-sm font-semibold ${entry.isCurrentUser ? "text-[rgb(var(--brand))]" : "text-white/90"}`}>
                  {entry.name} {entry.isCurrentUser && <span className="text-[10px] text-white/40">(You)</span>}
                </p>
                <p className="text-xs text-white/45">{entry.level}</p>
              </div>

              {/* Points */}
              <div className="text-right">
                <p className="text-sm font-bold text-white">{entry.points.toLocaleString()}</p>
                <p className="text-[10px] text-white/35">pts</p>
              </div>

              {/* Badge */}
              <span className="text-lg">{entry.badge}</span>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
