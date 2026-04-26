import { AmbientBackground } from "@/components/chrome/ambient";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-full items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
      <AmbientBackground />
      <main className="relative w-full max-w-lg">
        {children}
      </main>
    </div>
  );
}

