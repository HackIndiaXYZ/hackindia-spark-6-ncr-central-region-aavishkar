"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ProfileCard } from "@/components/dashboard/ProfileCard";
import { GamificationPanel } from "@/components/dashboard/GamificationPanel";
import { ComplaintTracker } from "@/components/dashboard/ComplaintTracker";
import { ImpactDashboard } from "@/components/dashboard/ImpactDashboard";
import { Leaderboard } from "@/components/dashboard/Leaderboard";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { CommunityMap } from "@/components/dashboard/CommunityMap";
import { LocalArchivePanel } from "@/components/dashboard/LocalArchivePanel";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { EditProfileModal } from "@/components/dashboard/EditProfileModal";
import { MOCK_USER } from "@/lib/dashboard-data";
import {
  LayoutDashboard, Trophy, MapPin, Brain, BarChart2, ShieldCheck, Archive,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "overview",     label: "Overview",       icon: LayoutDashboard },
  { id: "complaints",   label: "Complaints",     icon: ShieldCheck },
  { id: "archive",      label: "Local Archive",  icon: Archive },
  { id: "impact",       label: "Impact",         icon: BarChart2 },
  { id: "leaderboard",  label: "Leaderboard",    icon: Trophy },
  { id: "map",          label: "Community Map",   icon: MapPin },
  { id: "ai",           label: "AI Insights",    icon: Brain },
] as const;

type TabId = typeof TABS[number]["id"];

export default function CitizenDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [user, setUser] = useState(MOCK_USER);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="relative min-h-screen pb-32">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-white sm:text-3xl"
          >
            Citizen Dashboard
          </motion.h1>
          <p className="mt-1 text-sm text-white/50">
            Your civic impact hub — track, engage, and lead.
          </p>
        </div>
        <NotificationBell />
      </div>

      {/* Tab nav */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-white/[0.08] bg-white/[0.03] p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all sm:text-sm",
                activeTab === tab.id
                  ? "bg-[rgb(var(--brand))/0.15] text-[rgb(var(--brand))] shadow-[inset_0_0_0_1px_rgb(var(--brand)/0.3)]"
                  : "text-white/50 hover:bg-white/[0.05] hover:text-white/80"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
      >
        {activeTab === "overview" && (
          <div className="grid gap-5 lg:grid-cols-12">
            {/* Left column: Profile + Gamification + Local Archive summary */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              <ProfileCard user={user} onEdit={() => setEditOpen(true)} />
              <GamificationPanel points={user.points} streak={user.streakDays} />
            </div>
            {/* Right column: Impact + AI Insights + Leaderboard */}
            <div className="lg:col-span-8 flex flex-col gap-5">
              <ImpactDashboard />
              <div className="grid gap-5 md:grid-cols-2">
                <AIInsights />
                <Leaderboard />
              </div>
            </div>
          </div>
        )}
        {activeTab === "complaints" && <ComplaintTracker />}
        {activeTab === "archive" && <LocalArchivePanel />}
        {activeTab === "impact" && <ImpactDashboard expanded />}
        {activeTab === "leaderboard" && <Leaderboard />}
        {activeTab === "map" && <CommunityMap />}
        {activeTab === "ai" && <AIInsights expanded />}
      </motion.div>

      {/* Floating quick actions */}
      <QuickActions />

      {/* Edit profile modal */}
      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        user={user}
        onSave={(updated) => { setUser((u) => ({ ...u, ...updated })); setEditOpen(false); }}
      />
    </div>
  );
}
