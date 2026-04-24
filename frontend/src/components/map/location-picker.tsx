"use client";

import "leaflet/dist/leaflet.css";

import type { Map as LeafletMap, Marker as LeafletMarker, TileLayer } from "leaflet";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Crosshair, Layers, Search, MapPin, Loader2, AlertTriangle } from "lucide-react";

type LngLat = { lng: number; lat: number };

async function reverseGeocodeViaApi(lngLat: LngLat): Promise<string | null> {
  const params = new URLSearchParams({
    lat: String(lngLat.lat),
    lng: String(lngLat.lng),
  });
  const res = await fetch(`/api/geocode/reverse?${params.toString()}`);
  if (!res.ok) return null;
  const data: unknown = await res.json();
  if (!data || typeof data !== "object") return null;
  const label = (data as Record<string, unknown>).label;
  return typeof label === "string" && label.trim() ? label.trim() : null;
}

type SearchItem = { label: string; lat: number; lng: number };

async function searchPlaces(q: string): Promise<{ items: SearchItem[]; detail?: string | null }> {
  const params = new URLSearchParams({ q });
  const res = await fetch(`/api/geocode/search?${params.toString()}`);
  if (!res.ok) return { items: [], detail: `search_http_${res.status}` };
  const data: unknown = await res.json();
  if (!data || typeof data !== "object") return { items: [], detail: "search_bad_json" };
  const record = data as Record<string, unknown>;
  const items = record.items;
  const detail = typeof record.detail === "string" ? record.detail : null;
  if (!Array.isArray(items)) return { items: [], detail: detail ?? "search_no_items" };
  const parsed = items
    .map((x) => {
      if (!x || typeof x !== "object") return null;
      const r = x as Record<string, unknown>;
      const label = typeof r.label === "string" ? r.label : "";
      const lat = typeof r.lat === "number" ? r.lat : NaN;
      const lng = typeof r.lng === "number" ? r.lng : NaN;
      if (!label || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { label, lat, lng } satisfies SearchItem;
    })
    .filter(Boolean) as SearchItem[];
  return { items: parsed, detail };
}

export function LocationPicker({
  value,
  onChange,
  className,
}: {
  value: { lng: number; lat: number; label?: string } | null;
  onChange: (next: { lng: number; lat: number; label?: string }) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<any>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const tileLayerRef = useRef<TileLayer | null>(null);
  
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [ready, setReady] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const initialCenterRef = useRef<LngLat | null>(null);

  const [locating, setLocating] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<"idle" | "prompt" | "granted" | "denied" | "error">("idle");
  const [mapType, setMapType] = useState<"street" | "satellite">("street");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchItem[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchDetail, setSearchDetail] = useState<string | null>(null);

  if (!initialCenterRef.current) {
    initialCenterRef.current = value ?? { lng: 77.209, lat: 28.6139 };
  }

  // Load recent searches
  useEffect(() => {
    try {
      const saved = localStorage.getItem("jansetu_recent_searches");
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch {}
  }, []);

  const saveRecentSearch = (item: SearchItem) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(p => p.lat !== item.lat || p.lng !== item.lng);
      const updated = [item, ...filtered].slice(0, 5);
      try {
        localStorage.setItem("jansetu_recent_searches", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Close search dropdown on click outside
  useEffect(() => {
    function handleDown(e: MouseEvent) {
      if (!searchContainerRef.current?.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleDown);
    return () => document.removeEventListener("mousedown", handleDown);
  }, []);

  useEffect(() => {
    let mounted = true;
    const container = containerRef.current;
    if (!container) return;

    delete (container as any)._leaflet_id;

    let map: LeafletMap | null = null;
    let marker: LeafletMarker | null = null;

    void (async () => {
      if (mapRef.current) return;
      const L = (await import("leaflet")).default;
      leafletRef.current = L;
      const initial = initialCenterRef.current ?? { lng: 77.209, lat: 28.6139 };

      const icon = L.divIcon({
        className: "jansetu-leaflet-marker",
        html: `<div style="position:relative;width:24px;height:24px;">
                <div style="position:absolute;inset:0;border-radius:9999px;background:#3B82F6;opacity:0.2;transform:scale(1.5);animation:pulse 2s infinite;"></div>
                <div style="position:absolute;inset:2px;border-radius:9999px;background:#6AFFED;box-shadow:0 4px 12px rgba(106,255,237,0.6);border:3px solid rgba(255,255,255,1)"></div>
               </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      if (!mounted) return;
      if ((container as any)._leaflet_id) return;

      map = L.map(container, {
        center: [initial.lat, initial.lng],
        zoom: 13,
        scrollWheelZoom: true,
        zoomControl: false, // Custom zoom controls
      });

      tileLayerRef.current = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      marker = L.marker([initial.lat, initial.lng], { icon, draggable: true }).addTo(map);
      mapRef.current = map;
      markerRef.current = marker;

      map.whenReady(() => {
        if (!mounted) return;
        requestAnimationFrame(() => map?.invalidateSize());
        setReady(true);
        setHint("Drag the pin or click on the map to set location.");
      });

      map.on("click", (e) => {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        marker?.setLatLng([lat, lng]);
        map?.flyTo([lat, lng], map.getZoom(), { duration: 0.5 });
        updateLocationFromCoords(lat, lng);
      });

      marker.on("dragend", () => {
        const pos = marker?.getLatLng();
        if (!pos) return;
        map?.flyTo([pos.lat, pos.lng], map.getZoom(), { duration: 0.5 });
        updateLocationFromCoords(pos.lat, pos.lng);
      });
      
    })();

    return () => {
      mounted = false;
      try {
        map?.remove();
      } catch {}
      mapRef.current = null;
      markerRef.current = null;
      try {
        container.innerHTML = "";
        delete (container as any)._leaflet_id;
      } catch {}
      setReady(false);
    };
  }, []);

  const updateLocationFromCoords = useCallback((lat: number, lng: number) => {
    void (async () => {
      setHint("Fetching place name…");
      const label = await reverseGeocodeViaApi({ lng, lat });
      onChangeRef.current({ lng, lat, label: label ?? undefined });
      setHint(label ? "Location updated." : "Location updated (coordinates only).");
    })();
  }, []);

  useEffect(() => {
    if (!value || locating) return;
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    
    // Only fly if coordinates are different from current marker
    const currentPos = marker.getLatLng();
    // Use a small epsilon to prevent jitter
    if (Math.abs(currentPos.lat - value.lat) > 0.0001 || Math.abs(currentPos.lng - value.lng) > 0.0001) {
      marker.setLatLng([value.lat, value.lng]);
      map.flyTo([value.lat, value.lng], Math.max(map.getZoom(), 13), { duration: 0.65 });
    }
  }, [value, locating]);

  // Auto locate on mount if no value
  const autoLocated = useRef(false);
  useEffect(() => {
    if (!value && !autoLocated.current && navigator.geolocation) {
      autoLocated.current = true;
      void useCurrentLocation(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function useCurrentLocation(silent = false) {
    if (!navigator.geolocation) {
      if (!silent) setHint("Geolocation not supported in this browser.");
      setPermissionStatus("denied");
      return;
    }
    setLocating(true);
    if (!silent) setHint("Getting your current location…");
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const map = mapRef.current;
        const marker = markerRef.current;
        if (map && marker) {
          marker.setLatLng([lat, lng]);
          map.flyTo([lat, lng], 15, { duration: 1.2, easeLinearity: 0.25 });
        }
        setPermissionStatus("granted");
        const label = await reverseGeocodeViaApi({ lat, lng });
        onChangeRef.current({ lat, lng, label: label ?? undefined });
        setHint(label ? "Current location set." : "Current location set (no label).");
        setLocating(false);
      },
      (err) => {
        if (!silent) setHint(err.code === 1 ? "Location permission denied." : "Could not access location. Please check your signal/settings.");
        setPermissionStatus(err.code === 1 ? "denied" : "error");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  }

  function switchMapType(type: "street" | "satellite") {
    setMapType(type);
    if (!mapRef.current || !leafletRef.current) return;
    const L = leafletRef.current;
    const map = mapRef.current;
    
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    
    if (type === "street") {
      tileLayerRef.current = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);
    } else {
      tileLayerRef.current = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri',
      }).addTo(map);
    }
  }

  const trimmedQuery = useMemo(() => searchQuery.trim(), [searchQuery]);

  useEffect(() => {
    let cancelled = false;
    if (!trimmedQuery || trimmedQuery.length < 2) {
      setResults([]);
      setSearching(false);
      setSearchDetail(null);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      void (async () => {
        const r = await searchPlaces(trimmedQuery);
        if (cancelled) return;
        setResults(r.items);
        setSearchDetail(r.detail ?? null);
        setSearching(false);
        setSearchOpen(true);
      })();
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [trimmedQuery]);

  async function pickSearch(item: SearchItem) {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (map && marker) {
      marker.setLatLng([item.lat, item.lng]);
      map.flyTo([item.lat, item.lng], 15, { duration: 0.7 });
    }
    onChangeRef.current({ lat: item.lat, lng: item.lng, label: item.label });
    setHint("Location updated from search.");
    setSearchOpen(false);
    setSearchQuery("");
  }

  return (
    <div className={cn("relative flex flex-col h-[480px] w-full overflow-hidden rounded-3xl border border-white/[0.12] bg-black/20 shadow-2xl", className)}>
      {/* Map Container */}
      <div className="absolute inset-0 z-0">
        <div ref={containerRef} className="h-full w-full cursor-crosshair [&_.leaflet-control-attribution]:text-[9px] [&_.leaflet-control-attribution]:text-white/40 [&_.leaflet-control-attribution]:bg-black/40 [&_.leaflet-control-attribution]:backdrop-blur-sm [&_.leaflet-control-attribution]:px-2 [&_.leaflet-control-attribution]:py-0.5 [&_.leaflet-control-attribution]:rounded-tl-xl [&_.leaflet-control-attribution]:border-t [&_.leaflet-control-attribution]:border-l [&_.leaflet-control-attribution]:border-white/10" />
        
        {!ready && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-black/50 backdrop-blur-md">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 text-white/70 animate-spin" />
              <p className="text-sm font-medium text-white/70">Loading map…</p>
            </div>
          </div>
        )}
      </div>

      {/* Permission Denied Banner */}
      {permissionStatus === "denied" && (
        <div className="absolute left-4 right-4 top-4 z-20 rounded-2xl bg-black/70 p-3 backdrop-blur-xl border border-yellow-500/30 flex items-start gap-3 shadow-xl animate-in slide-in-from-top-4 fade-in duration-300">
          <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Location access denied</p>
            <p className="text-xs text-white/70 mt-0.5">Please enable location permissions in your browser settings to automatically detect your location.</p>
          </div>
          <button onClick={() => setPermissionStatus("idle")} className="p-1 text-white/50 hover:text-white transition-colors bg-white/5 rounded-full hover:bg-white/10">✕</button>
        </div>
      )}

      {/* Floating Search Bar */}
      <div 
        ref={searchContainerRef}
        className={cn(
          "absolute left-4 right-4 z-20 transition-all duration-500",
          permissionStatus === "denied" ? "top-24" : "top-4"
        )}
      >
        <div className="relative mx-auto max-w-sm sm:max-w-md shadow-2xl">
          <div className={cn(
            "relative flex items-center bg-black/50 backdrop-blur-2xl border transition-all duration-300",
            searchOpen ? "border-white/40 rounded-t-3xl rounded-b-none" : "border-white/20 rounded-full hover:bg-black/60 focus-within:bg-black/70 focus-within:border-white/40"
          )}>
            <div className="pl-4 pr-2 py-3 text-white/50">
              <Search className="h-4 w-4" />
            </div>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search a place, city, or area…"
              className="w-full bg-transparent py-3 pr-4 text-sm text-white placeholder:text-white/50 focus:outline-none"
            />
            {searching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 text-white/50 animate-spin" />
              </div>
            )}
          </div>
          
          {searchOpen && (
            <div className="absolute top-full left-0 right-0 bg-black/60 backdrop-blur-2xl border border-t-0 border-white/40 rounded-b-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.6)] pointer-events-auto">
              {searching ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 text-white/50 animate-spin" />
                </div>
              ) : results.length > 0 ? (
                <ul className="max-h-[50vh] overflow-y-auto py-2">
                  {results.map((r, i) => (
                    <li key={`${r.lat}-${r.lng}-${i}`}>
                      <button
                        type="button"
                        onClick={() => { pickSearch(r); saveRecentSearch(r); }}
                        className="w-full flex flex-col text-left px-5 py-3 hover:bg-white/10 transition-colors"
                      >
                        <span className="text-sm font-medium text-white/90">{r.label}</span>
                        <span className="text-xs text-white/50 mt-1 font-mono">{r.lat.toFixed(4)}, {r.lng.toFixed(4)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : trimmedQuery.length >= 2 ? (
                <div className="p-6 text-center text-sm text-white/50">
                  No results found{searchDetail ? ` (${searchDetail})` : ""}
                </div>
              ) : recentSearches.length > 0 ? (
                <div className="py-2">
                  <div className="px-5 py-2 flex items-center justify-between text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    <span>Recent Searches</span>
                    <button type="button" onClick={() => setRecentSearches([])} className="hover:text-white/80 transition-colors">Clear</button>
                  </div>
                  <ul className="max-h-[40vh] overflow-y-auto">
                    {recentSearches.map((r, i) => (
                      <li key={`recent-${r.lat}-${r.lng}-${i}`}>
                        <button
                          type="button"
                          onClick={() => pickSearch(r)}
                          className="w-full flex items-center gap-3 text-left px-5 py-2.5 hover:bg-white/10 transition-colors group"
                        >
                          <div className="rounded-full bg-white/5 p-2 group-hover:bg-white/10 transition-colors">
                            <Search className="h-3 w-3 text-white/40" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                             <span className="block text-sm font-medium text-white/80 truncate">{r.label}</span>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-white/40">
                  Type an address or landmark to search
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Controls: Zoom */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center bg-black/50 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl overflow-hidden pointer-events-auto">
        <button type="button" onClick={() => mapRef.current?.zoomIn()} className="p-3 text-white/80 hover:text-white hover:bg-white/20 transition-colors" title="Zoom In">
          <span className="text-xl leading-none font-light block">+</span>
        </button>
        <div className="w-3/5 h-[1px] bg-white/10" />
        <button type="button" onClick={() => mapRef.current?.zoomOut()} className="p-3 text-white/80 hover:text-white hover:bg-white/20 transition-colors" title="Zoom Out">
          <span className="text-xl leading-none font-light block">−</span>
        </button>
      </div>

      {/* Bottom Right Controls: Map View & Locate */}
      <div className="absolute bottom-6 right-4 z-20 flex flex-col gap-3 pointer-events-auto">
        <button 
          type="button"
          onClick={() => switchMapType(mapType === "street" ? "satellite" : "street")}
          className="group relative flex h-11 w-11 items-center justify-center rounded-full bg-black/60 backdrop-blur-xl border border-white/20 text-white shadow-2xl hover:bg-black/80 hover:scale-105 active:scale-95 transition-all focus:outline-none"
          title={mapType === "street" ? "Switch to Satellite" : "Switch to Street View"}
        >
          <Layers className="h-5 w-5 opacity-80 group-hover:opacity-100 transition-opacity" />
        </button>
        
        <button 
          type="button"
          onClick={() => void useCurrentLocation()}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-blue-600/90 backdrop-blur-xl border border-blue-400/30 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:bg-blue-500 hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] hover:scale-105 active:scale-95 transition-all focus:outline-none disabled:opacity-50 disabled:hover:scale-100"
          disabled={locating}
          title="Locate Me"
        >
          {locating ? <Loader2 className="h-6 w-6 animate-spin" /> : <Crosshair className="h-6 w-6" />}
        </button>
      </div>

      {/* Bottom Left: Selected Info Badge */}
      <div className="absolute bottom-6 left-4 z-20 max-w-[calc(100%-90px)] pointer-events-none">
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 shadow-2xl">
          <div className="flex items-center gap-2 mb-1.5">
            <MapPin className="h-4 w-4 text-blue-400" />
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Selected Location</p>
          </div>
          <p className="text-sm text-white font-medium line-clamp-2 leading-tight">
            {value?.label || hint || "Drop a pin or search"}
          </p>
          {value && (
            <p className="text-[10px] text-white/40 font-mono mt-1">
              {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
