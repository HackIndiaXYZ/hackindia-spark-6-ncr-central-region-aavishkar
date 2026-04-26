"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLevel, getLevelProgress } from "@/lib/dashboard-data";
import { Zap, Share2 } from "lucide-react";

interface GamificationPanelProps {
  points: number;
  streak: number;
  complaintCount: number;
  resolvedCount: number;
}

const LEVELS = [
  { label: "Civic Rookie", min: 0, max: 50, color: "#6affed" },
  { label: "Contributor", min: 50, max: 150, color: "#a080ff" },
  { label: "Active Citizen", min: 150, max: 400, color: "#ffc448" },
  { label: "City Guardian", min: 400, max: Infinity, color: "#ff5da0" },
];

export function GamificationPanel({
  points,
  streak,
  complaintCount,
  resolvedCount,
}: GamificationPanelProps) {
  const [sharedId, setSharedId] = useState<string | null>(null);
  const level = getLevel(points);
  const progress = getLevelProgress(points);
  const achievements = [
    { id: "a1", title: "First Complaint", description: "Filed your first complaint", icon: "🌱", earned: complaintCount >= 1, color: "#4ade80" },
    { id: "a2", title: "5 Issues Reported", description: "Reported 5 civic issues", icon: "⭐", earned: complaintCount >= 5, color: "#ffc448" },
    { id: "a3", title: "Fast Resolver", description: "At least 1 complaint marked as resolved", icon: "⚡", earned: resolvedCount >= 1, color: "#6affed" },
    { id: "a4", title: "Streak Builder", description: "Maintained 3-day dashboard streak", icon: "🔥", earned: streak >= 3, color: "#a080ff" },
    { id: "a5", title: "10 Issues Reported", description: "Reported 10 civic issues", icon: "🔟", earned: complaintCount >= 10, color: "#9ca3af" },
    { id: "a6", title: "City Guardian", description: "Reach 400+ points", icon: "🛡️", earned: points >= 400, color: "#9ca3af" },
  ];

  function handleShare(achievementTitle: string, id: string) {
    const text = `🏆 I just earned the "${achievementTitle}" badge on JanSetu-AI! Join me in making our city better. #JanSetuAI #CivicEngagement`;
    if (navigator.share) {
      navigator.share({ title: "JanSetu-AI Achievement", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setSharedId(id);
        setTimeout(() => setSharedId(null), 2000);
      });
    }
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[rgba(160,128,255,0.06)] to-transparent" />
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-[rgb(var(--brand))]" />
          Gamification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Animated points counter */}
        <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3">
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wider">Total Points</p>
            <motion.p
              key={points}
              initial={{ scale: 1.3, color: "#6affed" }}
              animate={{ scale: 1, color: "#ffffff" }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold text-white"
            >
              {points.toLocaleString()}
            </motion.p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/50">🔥 Streak</p>
            <p className="text-2xl font-bold" style={{ color: "#ffc448" }}>{streak}d</p>
          </div>
        </div>

        {/* Level progression road */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Level Progression</p>
          <div className="flex items-center gap-2">
            {LEVELS.map((l, i) => {
              const isActive = level.label === l.label;
              const isPast = points >= l.max;
              return (
                <div key={l.label} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all"
                    style={{
                      background: isPast || isActive ? l.color : "rgba(255,255,255,0.06)",
                      color: isPast || isActive ? "#000" : "rgba(255,255,255,0.3)",
                      boxShadow: isActive ? `0 0 12px ${l.color}80` : "none",
                    }}
                  >
                    {i + 1}
                  </div>
                  <p className="text-center text-[9px] leading-tight text-white/40">{l.label.split(" ")[0]}</p>
                  {i < LEVELS.length - 1 && (
                    <div className="absolute" />
                  )}
                </div>
              );
            })}
          </div>
          {/* progress bar */}
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${level.color}, rgba(160,128,255,1))` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-white/40">
            <span style={{ color: level.color }}>{level.label}</span>
            {level.next !== Infinity && <span>{points}/{level.next} pts</span>}
          </div>
        </div>

        {/* Point logic reference */}
        <div className="rounded-2xl border border-white/[0.06] bg-black/10 p-3">
          <p className="mb-2 text-xs font-semibold text-white/50 uppercase tracking-wider">Point System</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-white/60">
            <span>🟢 Low complaint: <b className="text-white/80">+5</b></span>
            <span>🟡 Medium: <b className="text-white/80">+10</b></span>
            <span>🟠 High: <b className="text-white/80">+20</b></span>
            <span>🔴 Critical: <b className="text-white/80">+40</b></span>
            <span>✅ Resolved: <b className="text-green-400">+30</b></span>
            <span>❌ Rejected: <b className="text-red-400">-10</b></span>
            <span>📷 Evidence: <b className="text-white/80">+10</b></span>
            <span>📍 Location: <b className="text-white/80">+5</b></span>
          </div>
        </div>

        {/* Achievements */}
        <div>
          <p className="mb-3 text-xs font-semibold text-white/60 uppercase tracking-wider">Achievements</p>
          <div className="grid grid-cols-4 gap-2">
            {achievements.map((a) => (
              <div key={a.id} className="group relative">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  title={a.title}
                  className={`flex h-12 w-12 cursor-pointer flex-col items-center justify-center rounded-2xl border text-xl transition-all ${
                    a.earned
                      ? "border-white/[0.15] bg-white/[0.08]"
                      : "border-white/[0.05] bg-white/[0.02] opacity-40 grayscale"
                  }`}
                  style={a.earned ? { boxShadow: `0 0 10px ${a.color}40` } : {}}
                >
                  {a.icon}
                </motion.div>
                {/* tooltip */}
                <div className="pointer-events-none absolute bottom-14 left-1/2 z-10 hidden w-32 -translate-x-1/2 rounded-xl border border-white/[0.12] bg-[#12131a] p-2 text-center text-xs text-white/80 shadow-xl group-hover:block">
                  <p className="font-semibold">{a.title}</p>
                  <p className="mt-0.5 text-white/50">{a.description}</p>
                  {a.earned && (
                    <button
                      onClick={() => handleShare(a.title, a.id)}
                      className="mt-1 flex w-full items-center justify-center gap-1 rounded-lg bg-white/[0.08] py-1 hover:bg-white/[0.14]"
                    >
                      <Share2 className="h-3 w-3" />
                      {sharedId === a.id ? "Copied!" : "Share"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
