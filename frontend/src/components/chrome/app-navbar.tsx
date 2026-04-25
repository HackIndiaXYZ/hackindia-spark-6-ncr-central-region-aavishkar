"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppNavbar() {
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-white/[0.08] bg-black/20 backdrop-blur-xl",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/app" className="group inline-flex items-center gap-2">
          <span className="relative grid h-9 w-9 place-items-center rounded-2xl border border-white/[0.12] bg-white/[0.06]">
            <span className="h-2.5 w-2.5 rounded-full bg-[rgb(var(--brand))] shadow-[0_0_22px_rgba(106,255,237,0.55)]" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-white/95">JanSetu-AI</span>
          <span className="hidden text-xs text-white/45 sm:inline">Dashboard</span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/app/preview"
            className="rounded-full px-3 py-2 text-sm text-white/70 hover:bg-white/[0.06] hover:text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            Preview
          </Link>
          <Link
            href="/app/local-complaints"
            className="rounded-full px-3 py-2 text-sm text-white/70 hover:bg-white/[0.06] hover:text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            Local archive
          </Link>
          <Link
            href="/"
            className="rounded-full px-3 py-2 text-sm text-white/70 hover:bg-white/[0.06] hover:text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            Home
          </Link>
          <Button type="button" variant="secondary" size="sm" onClick={signOut}>
            Sign out
          </Button>
        </nav>
      </div>
    </header>
  );
}
