"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Home,
  LayoutDashboard,
  PenSquare,
  LogOut,
} from "lucide-react";

/**
 * Fixed nav items visible on every page.
 * Order: Home → File Complaint → Dashboard
 */
const NAV_ITEMS = [
  { href: "/",    label: "Home",           icon: Home },
  { href: "/app", label: "File Complaint", icon: PenSquare },
  { href: "/app/citizen-dashboard", label: "Dashboard", icon: LayoutDashboard },
] as const;

export function AppNavbar() {
  const router = useRouter();
  const pathname = usePathname();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
    router.refresh();
  }

  /** Match current path to a nav item — exact for "/" and "/app", startsWith for nested */
  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    if (href === "/app") return pathname === "/app";
    return pathname.startsWith(href);
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-white/[0.08] bg-black/20 backdrop-blur-xl",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/app" className="group inline-flex items-center gap-2">
          <span className="relative grid h-9 w-9 place-items-center rounded-2xl border border-white/[0.12] bg-white/[0.06]">
            <span className="h-2.5 w-2.5 rounded-full bg-[rgb(var(--brand))] shadow-[0_0_22px_rgba(106,255,237,0.55)]" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-white/95">JanSetu-AI</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all",
                  active
                    ? "border border-[rgba(106,255,237,0.25)] bg-[rgba(106,255,237,0.1)] text-[rgb(var(--brand))] shadow-[0_0_8px_rgba(106,255,237,0.15)]"
                    : "text-white/60 hover:bg-white/[0.06] hover:text-white/90",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}

          {/* Sign out */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={signOut}
            className="ml-1"
          >
            <LogOut className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </nav>
      </div>
    </header>
  );
}
