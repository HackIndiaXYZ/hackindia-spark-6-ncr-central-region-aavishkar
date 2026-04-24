import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  q: z.string().min(2).max(200),
});

type NominatimItem = {
  display_name?: string;
  lat?: string;
  lon?: string;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({ q: url.searchParams.get("q") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ items: [], detail: "query_too_short" });
  }

  const userAgent =
    process.env.NOMINATIM_USER_AGENT?.trim() ||
    "JanSetu-AI/1.0 (citizen complaint portal; contact via project maintainers)";

  const nominatim = new URL("https://nominatim.openstreetmap.org/search");
  nominatim.searchParams.set("q", parsed.data.q);
  nominatim.searchParams.set("format", "jsonv2");
  nominatim.searchParams.set("addressdetails", "0");
  nominatim.searchParams.set("limit", "6");
  nominatim.searchParams.set("accept-language", "en");

  try {
    const res = await fetch(nominatim.toString(), {
      headers: {
        "User-Agent": userAgent,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return NextResponse.json({
        items: [],
        detail: `nominatim_http_${res.status}${body ? `: ${body.slice(0, 180)}` : ""}`,
      });
    }
    const data: unknown = await res.json();
    if (!Array.isArray(data)) return NextResponse.json({ items: [], detail: "nominatim_bad_json" });

    const items = (data as NominatimItem[])
      .map((x) => {
        const label = typeof x.display_name === "string" ? x.display_name.trim() : "";
        const lat = typeof x.lat === "string" ? Number(x.lat) : NaN;
        const lng = typeof x.lon === "string" ? Number(x.lon) : NaN;
        if (!label || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return { label, lat, lng };
      })
      .filter(Boolean);

    return NextResponse.json({ items, detail: items.length ? null : "no_results" });
  } catch {
    return NextResponse.json({ items: [], detail: "nominatim_fetch_failed" });
  }
}

