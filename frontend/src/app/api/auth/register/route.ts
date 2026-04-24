import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/password";
import { usersRepo } from "@/lib/db";
import { signSessionToken } from "@/lib/token";
import { SESSION_COOKIE } from "@/lib/server-env";

const bodySchema = z.object({
  email: z.string().email(),
  username: z.string().min(2).max(48),
  password: z.string().min(6).max(128),
  phone: z.string().max(32).optional(),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { email, username, password, phone } = parsed.data;
  const existing = await usersRepo.findByEmail(email);
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const { id } = await usersRepo.create({ email, username, phone, passwordHash });
  const token = await signSessionToken({ sub: id, email: email.trim().toLowerCase(), username });

  const res = NextResponse.json({
    user: { id, email: email.trim().toLowerCase(), username, phone: phone?.trim() || null },
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
