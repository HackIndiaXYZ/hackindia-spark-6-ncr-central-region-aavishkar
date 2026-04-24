export const SESSION_COOKIE = "jansetu_session";

export function getJwtSecretBytes(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (s && s.length >= 16) return new TextEncoder().encode(s);
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set (min 16 characters) in production");
  }
  return new TextEncoder().encode("dev-insecure-jwt-secret-min-16");
}

export function getAiServiceUrl(): string {
  return process.env.AI_SERVICE_URL?.trim() || "http://127.0.0.1:8000";
}

export function getMongoUri(): string {
  return process.env.MONGODB_URI?.trim() || "";
}
