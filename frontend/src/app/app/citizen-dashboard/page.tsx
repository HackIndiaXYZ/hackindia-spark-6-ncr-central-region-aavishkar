"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ProfileCard } from "@/components/dashboard/ProfileCard";
import { GamificationPanel } from "@/components/dashboard/GamificationPanel";
import { ComplaintTracker } from "@/components/dashboard/ComplaintTracker";
import { ImpactDashboard } from "@/components/dashboard/ImpactDashboard";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { CommunityMap } from "@/components/dashboard/CommunityMap";
import { LocalArchivePanel } from "@/components/dashboard/LocalArchivePanel";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { EditProfileModal } from "@/components/dashboard/EditProfileModal";
import {
  LayoutDashboard,
  MapPin,
  Brain,
  BarChart2,
  ShieldCheck,
  Archive,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "complaints", label: "Complaints", icon: ShieldCheck },
  { id: "archive", label: "Local Archive", icon: Archive },
  { id: "impact", label: "Impact", icon: BarChart2 },
  { id: "map", label: "Community Map", icon: MapPin },
  { id: "ai", label: "AI Insights", icon: Brain },
] as const;

type TabId = typeof TABS[number]["id"];
type DashboardComplaint = {
  id: string;
  referenceId: string;
  domain: string;
  createdAt: string;
  draftSubject: string;
  issueText: string;
  locationLabel: string | null;
  location: { lng: number; lat: number; label?: string } | null;
  ai: { severityScore: number; severityLabel: string; routedDepartment: string } | null;
  emailSent: boolean;
};

type DashboardUser = {
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
};

export default function CitizenDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [user, setUser] = useState<DashboardUser>({
    name: "Citizen",
    email: "",
    avatar: "CI",
    totalComplaints: 0,
    resolvedComplaints: 0,
    points: 0,
    streakDays: 0,
    trustScore: 0,
    joinedDate: new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
    profileCompletion: 40,
    anonymousMode: false,
  });
  const [complaints, setComplaints] = useState<DashboardComplaint[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [meRes, complaintsRes] = await Promise.all([
          fetch("/api/me", { credentials: "include" }),
          fetch("/api/complaints", { credentials: "include" }),
        ]);

        const meData = (await meRes.json().catch(() => ({}))) as {
          user?: { email?: string; username?: string } | null;
        };
        const complaintData = (await complaintsRes.json().catch(() => ({}))) as {
          items?: DashboardComplaint[];
        };

        if (cancelled) return;

        const rows = Array.isArray(complaintData.items) ? complaintData.items : [];
        setComplaints(rows);

        const resolvedCount = rows.filter((c) => c.emailSent).length;
        const points = rows.reduce((sum, c) => {
          const score = c.ai?.severityScore ?? 0;
          return sum + Math.max(5, Math.round(score / 10));
        }, 0);
        const trustScore = rows.length === 0 ? 0 : Math.min(100, Math.round((resolvedCount / rows.length) * 100));
        const profileCompletion = [meData.user?.username, meData.user?.email].filter(Boolean).length === 2 ? 85 : 60;
        const avatar = (meData.user?.username ?? "CI")
          .split(" ")
          .map((x) => x[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
        setUser((prev) => ({
          ...prev,
          name: meData.user?.username?.trim() || "Citizen",
          email: meData.user?.email?.trim().toLowerCase() || "",
          avatar: avatar || "CI",
          totalComplaints: rows.length,
          resolvedComplaints: resolvedCount,
          points,
          streakDays: rows.length > 0 ? Math.min(7, rows.length) : 0,
          trustScore,
          profileCompletion,
          joinedDate: prev.joinedDate,
          anonymousMode: prev.anonymousMode,
        }));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const headerSubtitle = useMemo(() => {
    if (loading) return "Syncing dashboard with saved complaints...";
    return `Live view from datastore • ${complaints.length} complaint${complaints.length === 1 ? "" : "s"} loaded`;
  }, [loading, complaints.length]);

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
            {headerSubtitle}
          </p>
        </div>
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
              <GamificationPanel
                points={user.points}
                streak={user.streakDays}
                complaintCount={user.totalComplaints}
                resolvedCount={user.resolvedComplaints}
              />
            </div>
            {/* Right column: Impact + AI Insights + Leaderboard */}
            <div className="lg:col-span-8 flex flex-col gap-5">
              <ImpactDashboard complaints={complaints} />
              <AIInsights complaints={complaints} />
            </div>
          </div>
        )}
        {activeTab === "complaints" && <ComplaintTracker complaints={complaints} />}
        {activeTab === "archive" && <LocalArchivePanel />}
        {activeTab === "impact" && <ImpactDashboard complaints={complaints} expanded />}
        {activeTab === "map" && <CommunityMap complaints={complaints} />}
        {activeTab === "ai" && <AIInsights complaints={complaints} expanded />}
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
