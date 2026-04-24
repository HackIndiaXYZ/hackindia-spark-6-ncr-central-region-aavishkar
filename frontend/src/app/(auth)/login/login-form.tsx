"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      const next = searchParams.get("next");
      router.push(next && next.startsWith("/") ? next : "/app");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-lg gap-5">
      <div>
        <p className="text-xs font-medium tracking-[0.2em] text-white/45 uppercase">Welcome back</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Sign in to JanSetu-AI
        </h1>
        <p className="mt-2 text-sm text-white/65">
          Use your account to continue the complaint flow.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
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
                autoComplete="current-password"
                required
              />
            </div>

            {error ? (
              <p className="text-sm text-[rgb(var(--danger))]" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex items-center justify-between">
              <Link
                href="/register"
                className="text-sm text-white/60 underline underline-offset-4 hover:text-white/80"
              >
                Create an account
              </Link>
              <span className="text-xs text-white/45">Secured session</span>
            </div>

            <Button type="submit" className="w-full justify-center" size="lg" disabled={loading}>
              {loading ? "Signing in…" : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-xs text-white/45">
        Sessions use an HTTP-only cookie. Set <span className="text-white/70">JWT_SECRET</span> in
        production.
      </p>
    </div>
  );
}
