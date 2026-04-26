"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ComplaintSeverity, ComplaintStatus } from "@/lib/dashboard-data";
import { getStatusColor, getSeverityColor } from "@/lib/dashboard-data";
import { MapPin, X } from "lucide-react";

// Dynamic import for Leaflet to avoid SSR issues
let L: typeof import("leaflet") | null = null;

interface PreviewComplaint {
  title: string;
  category: string;
  status: ComplaintStatus;
  severity: ComplaintSeverity;
  location: string;
  date: string;
}

export function CommunityMap({
  complaints,
}: {
  complaints: Array<{
    draftSubject: string;
    domain: string;
    createdAt: string;
    location: { lng: number; lat: number; label?: string } | null;
    ai: { severityLabel: string } | null;
    emailSent: boolean;
  }>;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
  const [preview, setPreview] = useState<PreviewComplaint | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    import("leaflet").then((leafletModule) => {
      const leaflet = (leafletModule.default ?? leafletModule) as typeof import("leaflet");
      L = leaflet;

      // Fix default marker icon (Leaflet + Next.js issue)
      if (L) {
        const defaultProto = L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown };
        delete defaultProto._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });
      }

      if (!mapRef.current || mapInstanceRef.current || !L) return;

      const map = L.map(mapRef.current, {
        center: [28.6, 77.2],
        zoom: 11,
        zoomControl: true,
        attributionControl: false,
      });

      // Dark tile layer
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { maxZoom: 19 }
      ).addTo(map);

      // Add complaints as colored circle markers
      complaints
        .filter((c) => c.location && Number.isFinite(c.location.lat) && Number.isFinite(c.location.lng))
        .forEach((c) => {
        if (!L) return;
        const severity = c.ai?.severityLabel?.toLowerCase() ?? "medium";
        const severityLabel =
          severity.includes("critical")
            ? "Critical"
            : severity.includes("high")
              ? "High"
              : severity.includes("low")
                ? "Low"
                : "Medium";
        const color = getSeverityColor(severityLabel);
        const circle = L.circleMarker([c.location!.lat, c.location!.lng], {
          radius: severityLabel === "Critical" ? 14 : severityLabel === "High" ? 11 : 8,
          fillColor: color,
          color: color,
          weight: 2,
          opacity: 0.9,
          fillOpacity: 0.45,
        }).addTo(map);

        circle.on("click", () => {
          setPreview({
            title: c.draftSubject,
            category: c.domain,
            status: c.emailSent ? "Resolved" : "Pending",
            severity: severityLabel,
            location: c.location?.label ?? `${c.location?.lat}, ${c.location?.lng}`,
            date: new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
          });
        });

        circle.bindTooltip(c.draftSubject, {
          className: "leaflet-dark-tooltip",
          direction: "top",
          offset: [0, -8],
        });
      });

      mapInstanceRef.current = map;
      setIsLoading(false);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [complaints]);

  return (
    <Card className="relative overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[rgb(var(--brand))]" />
          Community Map
        </CardTitle>
        <p className="mt-0.5 text-xs text-white/50">Click a marker to preview the complaint</p>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="mb-3 flex flex-wrap gap-3">
          {[
            { label: "Low", color: "#4ade80" },
            { label: "Medium", color: "#ffc448" },
            { label: "High", color: "#ff9500" },
            { label: "Critical", color: "#ff5da0" },
          ].map((s) => (
            <span key={s.label} className="flex items-center gap-1.5 text-xs text-white/50">
              <span className="h-3 w-3 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>

        {/* Map container */}
        <div className="relative overflow-hidden rounded-2xl" style={{ height: 380 }}>
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/40">
              <div className="text-sm text-white/50">Loading map…</div>
            </div>
          )}
          <div ref={mapRef} className="h-full w-full rounded-2xl" />

          {/* Complaint preview overlay */}
          {preview && (
            <div className="absolute bottom-3 left-3 right-3 z-[500] rounded-2xl border border-white/[0.15] bg-[#12131a]/95 p-4 shadow-2xl backdrop-blur-xl">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{preview.title}</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs">
                    <span className="text-white/50">{preview.category}</span>
                    <span
                      className="rounded-full px-2 py-0.5 font-semibold"
                      style={{ background: `${getStatusColor(preview.status)}20`, color: getStatusColor(preview.status) }}
                    >
                      {preview.status}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 font-semibold"
                      style={{ background: `${getSeverityColor(preview.severity)}20`, color: getSeverityColor(preview.severity) }}
                    >
                      {preview.severity}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-white/40">📍 {preview.location} · {preview.date}</p>
                </div>
                <button
                  onClick={() => setPreview(null)}
                  className="rounded-lg p-1 text-white/40 hover:bg-white/[0.08] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Inline style to make leaflet tooltip dark */}
      <style>{`
        .leaflet-dark-tooltip {
          background: #12131a !important;
          border: 1px solid rgba(255,255,255,0.12) !important;
          color: rgba(255,255,255,0.85) !important;
          font-size: 11px !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
        }
        .leaflet-dark-tooltip::before {
          border-top-color: rgba(255,255,255,0.12) !important;
        }
      `}</style>
    </Card>
  );
}
