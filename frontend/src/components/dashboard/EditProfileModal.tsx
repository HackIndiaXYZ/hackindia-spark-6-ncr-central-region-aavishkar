"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, User, Mail, Eye, EyeOff } from "lucide-react";

interface UserData {
  name: string;
  email: string;
  anonymousMode: boolean;
}

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  user: UserData;
  onSave: (data: Partial<UserData>) => void;
}

export function EditProfileModal({ open, onClose, user, onSave }: EditProfileModalProps) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [anonymous, setAnonymous] = useState(user.anonymousMode);

  function handleSave() {
    onSave({ name, email, anonymousMode: anonymous });
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-white/[0.14] bg-[#12131a]/98 p-6 shadow-2xl backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Edit Profile</h2>
                <p className="text-xs text-white/45">Update your citizen profile</p>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.10] text-white/50 transition-all hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Avatar preview */}
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[rgb(106,255,237)] to-[rgb(160,128,255)] text-2xl font-bold text-black shadow-[0_0_24px_rgba(106,255,237,0.35)]">
                {name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">Full Name</label>
                <div className="flex items-center gap-2 rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 focus-within:border-[rgb(var(--brand))/0.5] transition-all">
                  <User className="h-4 w-4 text-white/35" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
                    placeholder="Your full name"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">Email</label>
                <div className="flex items-center gap-2 rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 focus-within:border-[rgb(var(--brand))/0.5] transition-all">
                  <Mail className="h-4 w-4 text-white/35" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Anonymous toggle */}
              <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                <div className="flex items-center gap-3">
                  {anonymous ? <EyeOff className="h-4 w-4 text-[rgb(var(--brand-2))]" /> : <Eye className="h-4 w-4 text-white/40" />}
                  <div>
                    <p className="text-sm font-semibold text-white/85">Anonymous Mode</p>
                    <p className="text-xs text-white/40">Hide your name from public complaint view</p>
                  </div>
                </div>
                <button
                  onClick={() => setAnonymous((v) => !v)}
                  className={`relative h-6 w-11 rounded-full transition-all ${anonymous ? "bg-[rgb(var(--brand-2))]" : "bg-white/[0.12]"}`}
                >
                  <motion.span
                    animate={{ x: anonymous ? 18 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm"
                  />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-2xl border border-white/[0.10] bg-white/[0.04] py-2.5 text-sm text-white/60 transition-all hover:bg-white/[0.08] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[rgb(106,255,237)] to-[rgb(160,128,255)] py-2.5 text-sm font-semibold text-black shadow-[0_0_16px_rgba(106,255,237,0.3)] transition-all hover:shadow-[0_0_24px_rgba(106,255,237,0.45)] hover:opacity-90"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
