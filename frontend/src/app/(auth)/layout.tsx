import { AmbientBackground } from "@/components/chrome/ambient";
import { Navbar } from "@/components/chrome/navbar";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-full">
      <AmbientBackground />
      <Navbar variant="marketing" />
      <main className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {children}
      </main>
    </div>
  );
}

