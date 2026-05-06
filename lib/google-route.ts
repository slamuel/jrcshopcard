/**
 * Multi-stop directions in Google Maps (browser / app).
 * https://developers.google.com/maps/documentation/urls/get-started#directions-action
 */
export function googleMapsDirectionsUrl(
  stops: { lat: number; lng: number; label?: string }[]
): string | null {
  if (stops.length === 0) return null;
  const origin = `${stops[0]!.lat},${stops[0]!.lng}`;
  const waypoints =
    stops.length > 2
      ? stops
          .slice(1, -1)
          .map((s) => `${s.lat},${s.lng}`)
          .join("|")
      : undefined;
  const destination = `${stops[stops.length - 1]!.lat},${stops[stops.length - 1]!.lng}`;

  const p = new URLSearchParams();
  p.set("api", "1");
  p.set("origin", origin);
  p.set("destination", destination);
  if (waypoints) p.set("waypoints", waypoints);
  return `https://www.google.com/maps/dir/?${p.toString()}`;
}

export function googleMapsDirectionsUrlFromAddresses(addresses: string[]): string | null {
  if (addresses.length === 0) return null;
  const encoded = addresses.map((a) => encodeURIComponent(a));
  return `https://www.google.com/maps/dir/${encoded.join("/")}`;
}
