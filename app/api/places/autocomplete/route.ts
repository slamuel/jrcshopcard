import { NextResponse } from "next/server";
import { auth } from "@/auth";

/** Proxy for Places Autocomplete (legacy) — debounce on client. */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const input = searchParams.get("input")?.trim();
  if (!input || input.length < 3) {
    return NextResponse.json({ predictions: [] });
  }

  const key =
    process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) {
    return NextResponse.json({ predictions: [], error: "No Google API key" }, { status: 503 });
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
  url.searchParams.set("input", input);
  url.searchParams.set("key", key);
  url.searchParams.set("types", "address");

  const res = await fetch(url.toString());
  const data = (await res.json()) as {
    predictions?: { description: string; place_id: string }[];
    status: string;
  };

  return NextResponse.json({
    predictions: data.predictions ?? [],
    status: data.status,
  });
}
