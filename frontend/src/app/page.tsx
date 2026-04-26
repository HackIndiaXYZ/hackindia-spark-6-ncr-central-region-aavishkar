"use client";

import { AmbientBackground } from "@/components/chrome/ambient";
import { Footer } from "@/components/chrome/footer";
import { Navbar } from "@/components/chrome/navbar";
import { LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Globe,
  MapPin,
  Mic,
  ShieldCheck,
  Sparkles,
  Wand2,
  Lock
} from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        const data = (await res.json().catch(() => ({}))) as {
          user?: { id?: string } | null;
        };
        if (cancelled) return;
        setIsAuthenticated(Boolean(data.user?.id));
      } catch {
        if (cancelled) return;
        setIsAuthenticated(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative min-h-full overflow-hidden">
      <AmbientBackground />
      <Navbar variant="marketing" />

      <main className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
        {/* HERO SECTION */}
        <section className="py-14 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-7"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.06] px-4 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm shadow-sm transition-all hover:bg-white/[0.08]">
                <Sparkles className="h-4 w-4 text-[rgb(var(--brand))]" />
                Local language input • Smart drafting • Guided routing
              </div>
              <h1 className="mt-6 text-balance text-4xl font-bold tracking-tight text-white sm:text-6xl sm:leading-[1.1]">
                File citizen complaints with <br className="hidden sm:block" />
                <motion.span 
                  className="bg-[linear-gradient(135deg,rgb(var(--brand)_/_1),rgb(var(--brand-2)_/_1))] bg-clip-text text-transparent inline-block"
                  animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                  transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}
                  style={{ backgroundSize: "200% 200%" }}
                >
                  AI precision
                </motion.span>{" "}
                and human control.
              </h1>
              <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-white/70 sm:text-lg">
                JanSetu-AI helps people describe problems in their own language
                (text or voice), pick an exact location, preview an AI-generated
                complaint letter, and route it to the right department.
              </p>

              {/* INTERACTIVE DEMO INPUT */}
              <div className="mt-8 flex flex-col sm:flex-row items-center gap-2 rounded-3xl border border-white/[0.12] bg-black/40 p-2 shadow-2xl backdrop-blur-xl transition-all hover:border-white/[0.25] hover:bg-black/50 focus-within:border-[rgb(var(--brand)_/_0.5)] focus-within:shadow-[0_0_30px_rgb(var(--brand)_/_0.2)] max-w-xl">
                <div className="flex w-full items-center bg-transparent px-3 py-1">
                   <input 
                     type="text"
                     placeholder="Describe your issue in any language..." 
                     className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none" 
                   />
                   <button type="button" className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white/70 transition-all hover:bg-white/15 hover:text-white hover:scale-105 active:scale-95" title="Voice Input">
                     <Mic className="h-4 w-4" />
                   </button>
                </div>
                <LinkButton href="/app" variant="primary" className="w-full sm:w-auto shrink-0 rounded-2xl px-6 transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgb(var(--brand)_/_0.3)]">
                  Generate Complaint
                </LinkButton>
              </div>

              <div className="mt-6 flex items-center gap-4 text-sm font-medium text-white/50">
                 <LinkButton
                   href={isAuthenticated ? "/app" : "/register"}
                   variant="secondary"
                   className="px-5 py-2 hover:bg-white/10 hover:text-white transition-all"
                 >
                   {isAuthenticated ? "Open Dashboard" : "Start Filing Complaint"}{" "}
                   <ArrowRight className="ml-2 h-4 w-4" />
                 </LinkButton>
                 <span className="hidden sm:inline-block">•</span>
                 <a href="/app" className="hidden sm:inline-block hover:text-white transition-colors underline underline-offset-4">Try Demo</a>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <MiniStat icon={<Mic className="h-4 w-4 text-[rgb(var(--brand))]" />} label="Voice to text" value="Web Speech" />
                <MiniStat icon={<MapPin className="h-4 w-4 text-[rgb(var(--brand-2))]" />} label="Location" value="OSM + Leaflet" />
                <MiniStat icon={<ShieldCheck className="h-4 w-4 text-[rgb(var(--brand))]" />} label="Preview" value="Before submit" />
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-5"
            >
              {/* VISUAL PROOF - MOCKUP */}
              <div className="relative rounded-[2rem] border border-white/[0.12] bg-black/40 p-2 shadow-2xl backdrop-blur-xl group overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-tr from-[rgb(var(--brand)_/_0.1)] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                 <div className="relative overflow-hidden rounded-[1.5rem] border border-white/[0.08] bg-[#0A0A0B]">
                    <img src="/mockup-complaint.png" alt="Complaint UI Preview" className="w-full h-auto object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" />
                 </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* TRUST SECTION */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="border-t border-b border-white/[0.08] py-10 my-10"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-white tracking-tight">10,000+</div>
              <div className="text-xs font-medium text-white/50 uppercase tracking-widest leading-snug">Complaints<br/>Processed</div>
            </div>
            <div className="hidden h-12 w-px bg-white/10 sm:block"></div>
            <div className="flex-1 max-w-xl text-sm text-white/70 italic border-l-2 border-[rgb(var(--brand))] pl-4 sm:border-0 sm:pl-0">
              "This portal saved me hours of running around. My street light was fixed in 2 days without having to write a formal letter myself!"
              <span className="block mt-2 text-xs font-semibold text-white/50 not-italic">— Rahul S., Citizen</span>
            </div>
            <div className="hidden h-12 w-px bg-white/10 lg:block"></div>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Lock className="h-4 w-4" />
              <span>100% secure & private.<br/>Your data is protected.</span>
            </div>
          </div>
        </motion.section>

        {/* 90 SECONDS SECTION */}
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-14 sm:py-20 grid gap-12 lg:grid-cols-2 lg:items-center"
        >
           <div>
             <SectionTitle
                kicker="Speed & Simplicity"
                title="What you’ll do in 90 seconds"
                subtitle="A streamlined, step-by-step process designed to minimize friction and ensure accuracy."
              />
              <div className="mt-10 pl-2">
                <div className="relative border-s-2 border-white/[0.1] space-y-8 pl-8 pb-4">
                   <StepNode 
                     title="Explain your issue" 
                     icon={<Wand2 className="h-5 w-5" />} 
                     body="Type or speak in your local language." 
                   />
                   <StepNode 
                     title="Pick the exact place" 
                     icon={<MapPin className="h-5 w-5" />} 
                     body="Select on map for better routing." 
                   />
                   <StepNode 
                     title="Verify the letter" 
                     icon={<BadgeCheck className="h-5 w-5" />} 
                     body="Confirm before anything is sent." 
                   />
                   <StepNode 
                     title="Route to department" 
                     icon={<Globe className="h-5 w-5" />} 
                     body="Ready to connect with govt portals." 
                     isLast
                   />
                </div>
              </div>
           </div>
           
           <div className="relative rounded-[2rem] border border-white/[0.12] bg-black/40 p-2 shadow-2xl backdrop-blur-xl group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-bl from-[rgb(var(--brand-2)_/_0.1)] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative overflow-hidden rounded-[1.5rem] border border-white/[0.08] bg-[#0A0A0B]">
                 <img src="/mockup-dashboard.png" alt="Dashboard UI Preview" className="w-full h-auto object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" />
              </div>
           </div>
        </motion.section>

        {/* FEATURES SECTION */}
        <section id="features" className="scroll-mt-20 pb-14 pt-10 sm:pb-24">
          <SectionTitle
            kicker="Why JanSetu-AI"
            title="Designed for real people."
            subtitle="Minimal steps, clear confirmation, and better routing signals."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard icon={<Mic className="h-5 w-5" />} title="Voice-first accessibility" body="Speak naturally in your language—use voice when typing is hard." delay={0.1} />
            <FeatureCard icon={<Wand2 className="h-5 w-5" />} title="AI drafting + tone control" body="Generate formal complaint letters while keeping your intent intact." delay={0.2} />
            <FeatureCard icon={<MapPin className="h-5 w-5" />} title="Location-aware routing" body="Pin a location to reduce misrouting and speed up resolution." delay={0.3} />
            <FeatureCard icon={<ShieldCheck className="h-5 w-5" />} title="Preview before submit" body="No surprise submissions—review, edit, then confirm." delay={0.4} />
            <FeatureCard icon={<BadgeCheck className="h-5 w-5" />} title="Clean audit trail" body="Keep copies and references ready for follow-ups and escalation." delay={0.5} />
            <FeatureCard icon={<Globe className="h-5 w-5" />} title="Full stack flow" body="Auth, complaint storage, and a FastAPI drafting microservice." delay={0.6} />
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section id="about" className="scroll-mt-20 pb-16 sm:pb-24">
          <SectionTitle
            kicker="About"
            title="A bridge between citizens and systems."
            subtitle="JanSetu-AI focuses on clarity, dignity, and speed—so everyday people can be heard."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-12 lg:items-stretch">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-7"
            >
              <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0_0_0_/_0.5)] group">
                <CardHeader>
                  <CardTitle className="text-xl group-hover:text-[rgb(var(--brand))] transition-colors">Design principles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-white/70">
                  <ul className="space-y-4">
                    <li className="flex gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[rgb(var(--brand))]" />
                      <span><strong>Reduce cognitive load</strong> with a guided, single-screen flow.</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[rgb(var(--brand-2))]" />
                      <span><strong>Use micro-interactions</strong> to confirm state changes and avoid accidental actions.</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[rgb(var(--danger))]" />
                      <span><strong>Keep submission explicit</strong> with a clear preview + confirm step.</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-5"
            >
              <Card className="h-full relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(var(--brand)_/_0.15)] group hover:border-[rgb(var(--brand)_/_0.3)]">
                <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--brand)_/_0.05)] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <CardHeader className="relative">
                  <CardTitle className="text-xl">Try the demo flow</CardTitle>
                </CardHeader>
                <CardContent className="relative space-y-5 text-sm text-white/70">
                  <p>
                    Open the dashboard, speak or type your complaint, pick a
                    location, and generate a letter preview.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <LinkButton href="/app" variant="primary" size="md" className="transition-transform hover:scale-105">
                      Open dashboard <ArrowRight className="h-4 w-4" />
                    </LinkButton>
                    {isAuthenticated ? null : (
                      <LinkButton href="/login" variant="secondary" size="md" className="transition-colors hover:bg-white/10 hover:text-white">
                        Log in
                      </LinkButton>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function SectionTitle({ kicker, title, subtitle }: { kicker: string; title: string; subtitle: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
    >
      <p className="text-xs font-bold tracking-[0.2em] text-[rgb(var(--brand))] uppercase">
        {kicker}
      </p>
      <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-white/60">
        {subtitle}
      </p>
    </motion.div>
  );
}

function FeatureCard({ icon, title, body, delay = 0 }: { icon: ReactNode; title: string; body: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay }}
    >
      <Card className="h-full transition-all duration-300 hover:-translate-y-1.5 hover:bg-white/[0.08] hover:border-[rgb(var(--brand)_/_0.3)] hover:shadow-[0_12px_30px_rgb(var(--brand)_/_0.1)] group cursor-default">
        <CardContent className="pt-6">
          <div className="flex flex-col items-start gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/[0.12] bg-white/[0.04] text-white/80 transition-colors duration-300 group-hover:bg-[rgb(var(--brand)_/_0.1)] group-hover:text-[rgb(var(--brand))] group-hover:border-[rgb(var(--brand)_/_0.2)]">
              {icon}
            </div>
            <div>
              <p className="font-semibold text-white/95 text-lg group-hover:text-white transition-colors">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/60 group-hover:text-white/70 transition-colors">{body}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function MiniStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="group rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 transition-all duration-300 hover:bg-white/[0.06] hover:border-white/[0.2] hover:scale-[1.02]">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/50">
        <span className="transition-transform group-hover:scale-110">{icon}</span>
        <span>{label}</span>
      </div>
      <p className="mt-1.5 text-sm font-semibold text-white/90">{value}</p>
    </div>
  );
}

function StepNode({ icon, title, body, isLast }: { icon: ReactNode; title: string; body: string; isLast?: boolean }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="relative"
    >
      <span className="absolute -left-[45px] flex h-8 w-8 items-center justify-center rounded-full border border-[rgb(var(--brand)_/_0.3)] bg-black shadow-[0_0_15px_rgb(var(--brand)_/_0.2)] text-[rgb(var(--brand))]">
        {icon}
      </span>
      <div className="pt-1">
        <h3 className="text-base font-semibold text-white/90">{title}</h3>
        <p className="mt-1 text-sm text-white/60">{body}</p>
      </div>
      {isLast && <div className="absolute -left-[30px] top-8 bottom-0 w-1 bg-[#0A0A0B]" />}
    </motion.div>
  );
}
