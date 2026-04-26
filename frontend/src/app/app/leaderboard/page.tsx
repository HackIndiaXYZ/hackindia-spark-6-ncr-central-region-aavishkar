"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type LeaderboardItem = {
  rank: number;
  userId: string;
  username: string;
  points: number;
  totalComplaints: number;
  resolvedComplaints: number;
  trustScore: number;
};

export default function LeaderboardPage() {
  const [items, setItems] = useState<LeaderboardItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/leaderboard", { credentials: "include" });
        const data = (await res.json().catch(() => ({}))) as {
          items?: LeaderboardItem[];
          currentUserId?: string;
        };
        if (cancelled) return;
        setItems(Array.isArray(data.items) ? data.items : []);
        setCurrentUserId(data.currentUserId ?? "");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[#ffc448]" />
            Community Leaderboard
          </CardTitle>
          <p className="text-xs text-white/55">
            Ranked across all users by points from submitted complaints.
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-white/55">Loading leaderboard...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-white/55">No users ranked yet.</p>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => {
                const mine = item.userId === currentUserId;
                return (
                  <li
                    key={`${item.userId}-${item.rank}`}
                    className={`rounded-2xl border px-4 py-3 ${
                      mine
                        ? "border-[rgb(var(--brand))/0.35] bg-[rgb(var(--brand))/0.1]"
                        : "border-white/[0.08] bg-black/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white/90">
                          #{item.rank} {item.username} {mine ? "• You" : ""}
                        </p>
                        <p className="mt-0.5 text-xs text-white/50">
                          Complaints: {item.totalComplaints} • Resolved: {item.resolvedComplaints} •
                          Trust: {item.trustScore}%
                        </p>
                      </div>
                      <p className="text-sm font-bold text-[rgb(var(--brand))]">{item.points} pts</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
