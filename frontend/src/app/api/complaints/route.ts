import { NextResponse } from "next/server";
import { readSession } from "@/lib/session";
import { complaintsRepo } from "@/lib/db";
import type { MemoryComplaint } from "@/lib/memory-db";
import type { ComplaintRecord } from "@/lib/db";

export async function GET() {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await complaintsRepo.listForUser(session.sub, 25);
  const items = rows.map((r: ComplaintRecord | MemoryComplaint) => {
    const id =
      "_id" in r && r._id ? r._id.toHexString() : (r as MemoryComplaint).id;
    const createdAt =
      r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt);
    return {
      id,
      referenceId: r.referenceId,
      domain: r.domain,
      createdAt,
      draftSubject: r.draft.subject,
      emailSent: r.emailSent,
    };
  });

  return NextResponse.json({ items });
}
