"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username,
          email,
          password,
          phone: phone.trim() ? phone.trim() : undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }
      router.push("/app");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-lg gap-5">
      <div>
        <p className="text-xs font-medium tracking-[0.2em] text-white/45 uppercase">Get started</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Create your JanSetu-AI account
        </h1>
        <p className="mt-2 text-sm text-white/65">
          Register once, then use text or voice to draft complaints.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Register</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-white/70" htmlFor="username">
                  Username
                </label>
                <Input
                  id="username"
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="yourname"
                  autoComplete="username"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70" htmlFor="phone">
                  Phone (optional)
                </label>
                <Input
                  id="phone"
                  name="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 ..."
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/70" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/70" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                minLength={6}
              />
            </div>

            {error ? (
              <p className="text-sm text-[rgb(var(--danger))]" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex items-center justify-between">
              <Link
                href="/login"
                className="text-sm text-white/60 underline underline-offset-4 hover:text-white/80"
              >
                Already have an account?
              </Link>
              <span className="text-xs text-white/45">Creates session</span>
            </div>

            <Button type="submit" className="w-full justify-center" size="lg" disabled={loading}>
              {loading ? "Creating…" : "Create account"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-xs text-white/45">
        Data is stored in MongoDB when <span className="text-white/70">MONGODB_URI</span> is set;
        otherwise an in-memory store is used for local demos (resets on server restart).
      </p>
    </div>
  );
}
