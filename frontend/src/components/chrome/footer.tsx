import Link from "next/link";
import { Mail, Heart } from "lucide-react";

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
      <path d="M9 18c-4.51 2-5-2-7-2"/>
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
      <rect width="4" height="12" x="2" y="9"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-black/40 backdrop-blur-lg">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-4">
            <p className="text-lg font-bold text-white tracking-tight">JanSetu-AI</p>
            <p className="text-sm text-white/50 max-w-xs leading-relaxed">
              A modern citizen complaint portal designed to reduce friction and route issues intelligently using AI.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="text-white/40 hover:text-white transition-colors" title="Twitter"><TwitterIcon className="h-5 w-5" /></a>
              <a href="#" className="text-white/40 hover:text-white transition-colors" title="GitHub"><GithubIcon className="h-5 w-5" /></a>
              <a href="#" className="text-white/40 hover:text-white transition-colors" title="LinkedIn"><LinkedinIcon className="h-5 w-5" /></a>
              <a href="#" className="text-white/40 hover:text-white transition-colors" title="Email"><Mail className="h-5 w-5" /></a>
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm font-semibold text-white">Product</p>
            <ul className="space-y-3 text-sm text-white/50">
              <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href="#about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/app" className="hover:text-white transition-colors">Demo Dashboard</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm font-semibold text-white">Resources</p>
            <ul className="space-y-3 text-sm text-white/50">
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Guidelines</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold text-white">Legal</p>
            <ul className="space-y-3 text-sm text-white/50">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 flex flex-col gap-4 border-t border-white/[0.08] pt-8 sm:flex-row sm:items-center sm:justify-between text-sm text-white/40">
          <p>
            © {new Date().getFullYear()} JanSetu-AI. Frontend demo build.
          </p>
          <p className="flex items-center gap-1.5">
            Made with <Heart className="h-3.5 w-3.5 text-red-500" /> in India 🇮🇳
          </p>
        </div>
      </div>
    </footer>
  );
}
