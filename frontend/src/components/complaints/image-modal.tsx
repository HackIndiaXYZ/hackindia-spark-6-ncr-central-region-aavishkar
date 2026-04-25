"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LocalAttachment } from "@/lib/local-complaint-store";

type ImageModalProps = {
  open: boolean;
  attachments: LocalAttachment[];
  index: number;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
};

export function ImageModal({ open, attachments, index, onClose, onNavigate }: ImageModalProps) {
  const [loaded, setLoaded] = useState(false);
  const item = attachments[index];
  const canNavigate = attachments.length > 1;
  const blob = item?.blob ?? null;
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  useEffect(() => {
    setLoaded(false);
  }, [index, open]);

  useEffect(() => {
    if (!url) return;
    return () => URL.revokeObjectURL(url);
  }, [url]);

  if (!open || !item || !url) return null;
  const isImage = item.kind === "image";
  const isVideo = item.kind === "video";

  return (
    <div className="fixed inset-0 z-[100] bg-black/75 p-4 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={onClose}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onClose();
        }}
      />
      <div className="relative mx-auto flex h-full w-full max-w-6xl items-center justify-center">
        <div className="w-full rounded-3xl border border-white/[0.12] bg-black/70 p-4 shadow-2xl transition-all duration-200">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="truncate text-sm text-white/85">{item.name}</p>
            <Button type="button" variant="secondary" onClick={onClose}>
              <X className="h-4 w-4" />
              Close
            </Button>
          </div>

          <div className="relative grid min-h-[60vh] place-items-center overflow-hidden rounded-2xl bg-black/60">
            {!loaded ? (
              <div className="absolute inset-0 grid place-items-center text-sm text-white/60">Loading preview...</div>
            ) : null}
            {isImage ? (
              <img
                src={url}
                alt={item.name}
                loading="lazy"
                onLoad={() => setLoaded(true)}
                onError={() => setLoaded(true)}
                className="max-h-[70vh] w-auto rounded-xl object-contain transition duration-200"
              />
            ) : isVideo ? (
              <video
                src={url}
                controls
                autoPlay
                onLoadedData={() => setLoaded(true)}
                onError={() => setLoaded(true)}
                className="max-h-[70vh] w-full rounded-xl object-contain"
              />
            ) : (
              <p className="text-sm text-white/60">Preview not available for this file type.</p>
            )}
          </div>

          {canNavigate ? (
            <div className="mt-3 flex items-center justify-between">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onNavigate((index - 1 + attachments.length) % attachments.length)}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <p className="text-xs text-white/60">
                {index + 1} / {attachments.length}
              </p>
              <Button type="button" variant="secondary" onClick={() => onNavigate((index + 1) % attachments.length)}>
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
