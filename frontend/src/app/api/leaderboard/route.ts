import { NextResponse } from "next/server";
import { readSession } from "@/lib/session";
import { complaintsRepo, usersRepo } from "@/lib/db";
import type { ComplaintRecord, UserRecord } from "@/lib/db";
import type { MemoryComplaint, MemoryUser } from "@/lib/memory-db";

type LeaderboardItem = {
  rank: number;
  userId: string;
  username: string;
  points: number;
  totalComplaints: number;
  resolvedComplaints: number;
  trustScore: number;
};

export async function GET() {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [users, complaints] = await Promise.all([
    usersRepo.listAll(1000),
    complaintsRepo.listCommunity(5000),
  ]);

  const userMap = new Map<string, { username: string }>();
  for (const user of users) {
    if ("_id" in user) {
      const row = user as UserRecord;
      userMap.set(row._id.toHexString(), { username: row.username });
    } else {
      const row = user as MemoryUser;
      userMap.set(row.id, { username: row.username });
    }
  }

  const aggregate = new Map<
    string,
    {
      points: number;
      totalComplaints: number;
      resolvedComplaints: number;
    }
  >();

  for (const complaint of complaints as Array<ComplaintRecord | MemoryComplaint>) {
    const key = complaint.userId;
    const current = aggregate.get(key) ?? {
      points: 0,
      totalComplaints: 0,
      resolvedComplaints: 0,
    };
    const score = complaint.ai?.severityScore ?? 0;
    current.points += Math.max(5, Math.round(score / 10));
    current.totalComplaints += 1;
    if (complaint.emailSent) current.resolvedComplaints += 1;
    aggregate.set(key, current);
  }

  const ranked: LeaderboardItem[] = Array.from(aggregate.entries())
    .map(([userId, metrics]) => {
      const trustScore =
        metrics.totalComplaints === 0
          ? 0
          : Math.round((metrics.resolvedComplaints / metrics.totalComplaints) * 100);
      return {
        rank: 0,
        userId,
        username: userMap.get(userId)?.username ?? "Unknown User",
        points: metrics.points,
        totalComplaints: metrics.totalComplaints,
        resolvedComplaints: metrics.resolvedComplaints,
        trustScore,
      };
    })
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.resolvedComplaints - a.resolvedComplaints ||
        b.totalComplaints - a.totalComplaints,
    )
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  return NextResponse.json({
    items: ranked,
    currentUserId: session.sub,
  });
}
