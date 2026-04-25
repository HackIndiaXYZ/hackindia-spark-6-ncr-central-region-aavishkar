"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MOCK_NOTIFICATIONS } from "@/lib/dashboard-data";
import { Bell } from "lucide-react";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAllRead() {
    setNotifications((ns) => ns.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: string) {
    setNotifications((ns) => ns.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.10] bg-white/[0.05] text-white/70 transition-all hover:bg-white/[0.09] hover:text-white"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[rgb(var(--brand))] text-[10px] font-bold text-black shadow-[0_0_8px_rgba(106,255,237,0.6)]"
          >
            {unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-white/[0.12] bg-[#12131a]/95 shadow-2xl backdrop-blur-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
                <span className="text-sm font-semibold text-white/90">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-[rgb(var(--brand))] hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`flex w-full items-start gap-3 border-b border-white/[0.05] px-4 py-3 text-left transition-all hover:bg-white/[0.04] ${
                      !n.read ? "bg-white/[0.03]" : ""
                    }`}
                  >
                    <span className="mt-0.5 text-lg">{n.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-relaxed ${n.read ? "text-white/55" : "text-white/85"}`}>
                        {n.message}
                      </p>
                      <p className="mt-1 text-[10px] text-white/35">{n.time}</p>
                    </div>
                    {!n.read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[rgb(var(--brand))] shadow-[0_0_5px_rgba(106,255,237,0.6)]" />
                    )}
                  </button>
                ))}
              </div>

              {notifications.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-white/40">No notifications</p>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
