"use client";

import { motion } from "framer-motion";
import { Edit2, Star, CheckCircle, FileText, Zap, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getLevel, getLevelProgress } from "@/lib/dashboard-data";

interface UserData {
  name: string;
  email: string;
  avatar: string;
  totalComplaints: number;
  resolvedComplaints: number;
  points: number;
  streakDays: number;
  trustScore: number;
  joinedDate: string;
  profileCompletion: number;
  anonymousMode: boolean;
}

interface ProfileCardProps {
  user: UserData;
  onEdit: () => void;
}

export function ProfileCard({ user, onEdit }: ProfileCardProps) {
  const level = getLevel(user.points);
  const progress = getLevelProgress(user.points);

  const stats = [
    { label: "Filed", value: user.totalComplaints, icon: FileText, color: "#6affed" },
    { label: "Resolved", value: user.resolvedComplaints, icon: CheckCircle, color: "#4ade80" },
    { label: "Points", value: user.points, icon: Star, color: "#ffc448" },
    { label: "Trust", value: `${user.trustScore}%`, icon: Shield, color: "#a080ff" },
  ];

  return (
    <Card className="relative overflow-hidden">
      {/* neon glow background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[rgb(106,255,237,0.06)] to-transparent" />

      <CardContent className="relative pt-6">
        {/* Avatar + edit */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[rgb(106,255,237)] to-[rgb(160,128,255)] text-xl font-bold text-black shadow-[0_0_20px_rgba(106,255,237,0.4)]">
                {user.avatar}
              </div>
              {/* online dot */}
              <span className="absolute -right-1 -bottom-1 h-3.5 w-3.5 rounded-full border-2 border-[#12131a] bg-green-400 shadow-[0_0_6px_#4ade80]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{user.name}</h2>
              <p className="text-xs text-white/50">{user.email}</p>
              <div className="mt-1 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                style={{ borderColor: `${level.color}50`, color: level.color, background: `${level.color}15` }}>
                <Zap className="h-3 w-3" />
                {level.label}
              </div>
            </div>
          </div>
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.12] bg-white/[0.06] px-3 py-1.5 text-xs text-white/70 transition-all hover:bg-white/[0.10] hover:text-white"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit
          </button>
        </div>

        {/* Stats grid */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                whileHover={{ scale: 1.04 }}
                className="flex flex-col items-center gap-1 rounded-2xl border border-white/[0.08] bg-black/20 p-3 text-center"
              >
                <Icon className="h-4 w-4" style={{ color: s.color }} />
                <span className="text-lg font-bold text-white">{s.value}</span>
                <span className="text-[10px] text-white/50 uppercase tracking-wider">{s.label}</span>
              </motion.div>
            );
          })}
        </div>

        {/* Level progress */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium" style={{ color: level.color }}>{level.label}</span>
            {level.next !== Infinity && (
              <span className="text-white/50">{user.points} / {level.next} pts to next level</span>
            )}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${level.color}, rgb(160,128,255))` }}
            />
          </div>
        </div>

        {/* Profile completion */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-white/50">
            <span>Profile completion</span>
            <span className="font-semibold text-white/80">{user.profileCompletion}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${user.profileCompletion}%` }}
              transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
              className="h-full rounded-full bg-[rgb(var(--brand))]"
            />
          </div>
        </div>

        {/* Streak + joined */}
        <div className="mt-4 flex items-center justify-between text-xs text-white/40">
          <span>🔥 {user.streakDays}-day streak</span>
          <span>Joined {user.joinedDate}</span>
        </div>
      </CardContent>
    </Card>
  );
}
