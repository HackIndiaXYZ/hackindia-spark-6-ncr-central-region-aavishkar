import { SignJWT, jwtVerify } from "jose";
import { getJwtSecretBytes } from "@/lib/server-env";

export type SessionPayload = {
  sub: string;
  email: string;
  username: string;
};

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  const secret = getJwtSecretBytes();
  return new SignJWT({ email: payload.email, username: payload.username })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const secret = getJwtSecretBytes();
    const { payload } = await jwtVerify(token, secret);
    const sub = typeof payload.sub === "string" ? payload.sub : "";
    const email = typeof payload.email === "string" ? payload.email : "";
    const username = typeof payload.username === "string" ? payload.username : "";
    if (!sub || !email) return null;
    return { sub, email, username };
  } catch {
    return null;
  }
}
