import { cn } from "@/lib/utils";

export function AmbientBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div className="absolute -top-40 -left-40 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgb(var(--brand)_/_0.35),transparent_62%)] blur-2xl" />
      <div className="absolute -bottom-48 -right-48 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgb(var(--brand-2)_/_0.32),transparent_62%)] blur-2xl" />
      <div className="absolute top-[28%] left-[55%] h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,93,160,0.18),transparent_60%)] blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(10,10,14,0.86),rgba(10,10,14,0.96))]" />
      <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:18px_18px]" />
    </div>
  );
}

