import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyPassword } from "@/lib/password";
import { usersRepo } from "@/lib/db";
import { signSessionToken } from "@/lib/token";
import { SESSION_COOKIE } from "@/lib/server-env";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const user = await usersRepo.findByEmail(email);
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const id = "_id" in user ? user._id.toHexString() : user.id;
  const token = await signSessionToken({
    sub: id,
    email: user.email,
    username: user.username,
  });

  const res = NextResponse.json({
    user: usersRepo.toPublic(user),
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
