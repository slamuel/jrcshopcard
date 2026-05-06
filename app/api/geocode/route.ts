import { NextResponse } from "next/server";
import { auth } from "@/auth";

/** Server-side geocoding (keeps key off client). */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "q required" }, { status: 400 });
  }

  const key = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "GOOGLE_MAPS_SERVER_API_KEY not configured", results: [] },
      { status: 503 }
    );
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", q);
  url.searchParams.set("key", key);

  const res = await fetch(url.toString());
  const data = (await res.json()) as {
    results?: { formatted_address: string; geometry: { location: { lat: number; lng: number } } }[];
    status: string;
  };

  if (data.status !== "OK" || !data.results?.[0]) {
    return NextResponse.json({ results: [], status: data.status });
  }

  const r = data.results[0]!;
  return NextResponse.json({
    formattedAddress: r.formatted_address,
    latitude: r.geometry.location.lat,
    longitude: r.geometry.location.lng,
  });
}
