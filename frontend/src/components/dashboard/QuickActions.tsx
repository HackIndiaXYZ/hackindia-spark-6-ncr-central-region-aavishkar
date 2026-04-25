"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Mic, MapPin, X, ChevronUp } from "lucide-react";
import Link from "next/link";

const ACTIONS = [
  {
    id: "new",
    label: "New Complaint",
    icon: Plus,
    color: "#6affed",
    href: "/app",
    description: "File a text complaint",
  },
  {
    id: "voice",
    label: "Voice Complaint",
    icon: Mic,
    color: "#a080ff",
    href: "/app",
    description: "Speak your complaint",
  },
  {
    id: "nearby",
    label: "Report Nearby",
    icon: MapPin,
    color: "#ffc448",
    href: "/app/map",
    description: "Issue near your location",
  },
];

export function QuickActions() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Action buttons */}
      <AnimatePresence>
        {open &&
          ACTIONS.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, scale: 0.7, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.7, y: 20 }}
                transition={{ delay: (ACTIONS.length - 1 - i) * 0.06, type: "spring", stiffness: 300, damping: 25 }}
                className="flex items-center gap-3"
              >
                {/* Label */}
                <div className="rounded-xl border border-white/[0.12] bg-[#12131a]/90 px-3 py-1.5 text-right shadow-xl backdrop-blur-xl">
                  <p className="text-xs font-semibold text-white/90">{action.label}</p>
                  <p className="text-[10px] text-white/40">{action.description}</p>
                </div>
                {/* Button */}
                <Link
                  href={action.href}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border shadow-lg transition-all hover:scale-105"
                  style={{
                    background: `${action.color}20`,
                    borderColor: `${action.color}40`,
                    color: action.color,
                    boxShadow: `0 0 16px ${action.color}30`,
                  }}
                >
                  <Icon className="h-5 w-5" />
                </Link>
              </motion.div>
            );
          })}
      </AnimatePresence>

      {/* FAB toggle */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-2xl transition-all"
        style={{
          background: open
            ? "rgba(255,255,255,0.1)"
            : "linear-gradient(135deg, rgb(106,255,237), rgb(160,128,255))",
          boxShadow: open ? "none" : "0 0 24px rgba(106,255,237,0.4)",
          border: open ? "1px solid rgba(255,255,255,0.15)" : "none",
          color: open ? "rgba(255,255,255,0.7)" : "#000",
        }}
      >
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6 font-bold" />}
        </motion.div>
      </motion.button>
    </div>
  );
}
