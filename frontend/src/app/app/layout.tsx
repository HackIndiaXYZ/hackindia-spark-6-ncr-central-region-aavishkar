import { AmbientBackground } from "@/components/chrome/ambient";
import { AppNavbar } from "@/components/chrome/app-navbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-full">
      <AmbientBackground />
      <AppNavbar />
      <main className="relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}

