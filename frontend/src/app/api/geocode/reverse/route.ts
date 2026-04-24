import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  lat: z.coerce.number().gte(-90).lte(90),
  lng: z.coerce.number().gte(-180).lte(180),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    lat: url.searchParams.get("lat"),
    lng: url.searchParams.get("lng"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid lat/lng" }, { status: 400 });
  }

  const { lat, lng } = parsed.data;
  const userAgent =
    process.env.NOMINATIM_USER_AGENT?.trim() ||
    "JanSetu-AI/1.0 (citizen complaint portal; contact via project maintainers)";

  const nominatim = new URL("https://nominatim.openstreetmap.org/reverse");
  nominatim.searchParams.set("lat", String(lat));
  nominatim.searchParams.set("lon", String(lng));
  nominatim.searchParams.set("format", "json");

  try {
    const res = await fetch(nominatim.toString(), {
      headers: {
        "User-Agent": userAgent,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { label: null, detail: `geocoder_status_${res.status}` },
        { status: 200 },
      );
    }

    const data: unknown = await res.json();
    if (!data || typeof data !== "object") {
      return NextResponse.json({ label: null }, { status: 200 });
    }

    const record = data as Record<string, unknown>;
    if (typeof record.error === "string") {
      return NextResponse.json({ label: null, detail: record.error }, { status: 200 });
    }

    const name = record.display_name;
    const label = typeof name === "string" && name.trim() ? name.trim() : null;
    return NextResponse.json({ label });
  } catch {
    return NextResponse.json({ label: null, detail: "geocoder_fetch_failed" }, { status: 200 });
  }
}
