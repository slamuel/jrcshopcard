import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const placeId = searchParams.get("placeId")?.trim();
  if (!placeId) {
    return NextResponse.json({ error: "placeId required" }, { status: 400 });
  }

  const key =
    process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "No Google API key" }, { status: 503 });
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "formatted_address,geometry,address_component");
  url.searchParams.set("key", key);

  const res = await fetch(url.toString());
  const data = (await res.json()) as {
    result?: {
      formatted_address: string;
      geometry?: { location: { lat: number; lng: number } };
      address_components?: { long_name: string; short_name: string; types: string[] }[];
    };
    status: string;
  };

  if (data.status !== "OK" || !data.result) {
    return NextResponse.json({ error: data.status }, { status: 404 });
  }

  const r = data.result;
  let city: string | undefined;
  let state: string | undefined;
  let postalCode: string | undefined;
  for (const c of r.address_components ?? []) {
    if (c.types.includes("locality")) city = c.long_name;
    if (c.types.includes("administrative_area_level_1")) state = c.short_name;
    if (c.types.includes("postal_code")) postalCode = c.long_name;
  }

  return NextResponse.json({
    formattedAddress: r.formatted_address,
    latitude: r.geometry?.location.lat,
    longitude: r.geometry?.location.lng,
    city,
    state,
    postalCode,
  });
}
