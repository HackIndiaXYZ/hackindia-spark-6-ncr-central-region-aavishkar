import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/server-env";
import { verifySessionToken, type SessionPayload } from "@/lib/token";

export async function readSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
