import Link from "next/link";
import { LinkButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Navbar({ variant = "marketing" }: { variant?: "marketing" | "app" }) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-white/[0.08] bg-black/20 backdrop-blur-xl",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group inline-flex items-center gap-2">
          <span className="relative grid h-9 w-9 place-items-center rounded-2xl border border-white/[0.12] bg-white/[0.06]">
            <span className="h-2.5 w-2.5 rounded-full bg-[rgb(var(--brand))] shadow-[0_0_22px_rgba(106,255,237,0.55)]" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-white/95">
            JanSetu-AI
          </span>
          <span className="hidden text-xs text-white/45 sm:inline">
            Citizen Complaint Portal
          </span>
        </Link>

        {variant === "marketing" ? (
          <nav className="flex items-center gap-2">
            <Link
              href="#features"
              className="hidden rounded-full px-3 py-2 text-sm text-white/70 hover:text-white/90 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 sm:inline-flex"
            >
              Features
            </Link>
            <Link
              href="#about"
              className="hidden rounded-full px-3 py-2 text-sm text-white/70 hover:text-white/90 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 sm:inline-flex"
            >
              About
            </Link>
            <LinkButton href="/login" variant="secondary" size="sm">
              Log in
            </LinkButton>
            <LinkButton href="/register" variant="primary" size="sm">
              Get started
            </LinkButton>
          </nav>
        ) : (
          <nav className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-full px-3 py-2 text-sm text-white/70 hover:text-white/90 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              Home
            </Link>
            <LinkButton href="/login" variant="secondary" size="sm">
              Sign out
            </LinkButton>
          </nav>
        )}
      </div>
    </header>
  );
}

