"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, MapPin } from "lucide-react";
import { LocationPicker } from "@/components/map/location-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MapPage() {
  const [location, setLocation] = useState<{
    lng: number;
    lat: number;
    label?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!location) return;
    const text = location.label
      ? `${location.label}\n${location.lat}, ${location.lng}`
      : `${location.lat}, ${location.lng}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] text-white/45 uppercase">
            Location
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Pick the exact place
          </h1>
          <p className="mt-2 text-sm text-white/65">
            Search, use your current location, hover to preview nearby areas, then click to set the
            pin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/app"
            className="rounded-full border border-white/[0.12] bg-white/[0.06] px-4 py-2 text-sm text-white/80 hover:bg-white/[0.09]"
          >
            Back to dashboard
          </Link>
          <Button type="button" variant="secondary" onClick={() => void copy()} disabled={!location}>
            <Copy className="h-4 w-4" />
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Map</CardTitle>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.06] px-3 py-1 text-xs text-white/70">
            <MapPin className="h-4 w-4 text-[rgb(var(--brand))]" />
            OSM + Leaflet
          </span>
        </CardHeader>
        <CardContent className="space-y-3">
          <LocationPicker value={location} onChange={setLocation} className="max-w-none" />
          <div className="rounded-3xl border border-white/[0.10] bg-black/20 px-4 py-3">
            <p className="text-xs font-medium tracking-[0.2em] text-white/45 uppercase">
              Selected
            </p>
            {location ? (
              <div className="mt-2 space-y-1">
                <p className="text-sm text-white/85">{location.label ?? "Coordinates only"}</p>
                <p className="font-mono text-xs text-white/60">
                  {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-white/60">Nothing selected yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

