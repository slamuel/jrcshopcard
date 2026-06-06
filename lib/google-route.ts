/**
 * Multi-stop directions in Google Maps (browser / app).
 * https://developers.google.com/maps/documentation/urls/get-started#directions-action
 *
 * Origin is intentionally omitted so Google Maps starts the route from the
 * user's *actual current location*. Every job is a stop along the way: all but
 * the last become ordered waypoints, and the last is the destination.
 */
export function googleMapsDirectionsUrl(
  stops: { lat: number; lng: number; label?: string }[]
): string | null {
  if (stops.length === 0) return null;

  const destination = `${stops[stops.length - 1]!.lat},${stops[stops.length - 1]!.lng}`;
  const waypoints = stops
    .slice(0, -1)
    .map((s) => `${s.lat},${s.lng}`)
    .join("|");

  const p = new URLSearchParams();
  p.set("api", "1");
  p.set("destination", destination);
  if (waypoints) p.set("waypoints", waypoints);
  // No `origin` → Maps uses the device's current location as the start.
  return `https://www.google.com/maps/dir/?${p.toString()}`;
}

export function googleMapsDirectionsUrlFromAddresses(addresses: string[]): string | null {
  if (addresses.length === 0) return null;

  const destination = addresses[addresses.length - 1]!;
  const waypoints = addresses.slice(0, -1);

  const p = new URLSearchParams();
  p.set("api", "1");
  p.set("destination", destination);
  if (waypoints.length) p.set("waypoints", waypoints.join("|"));
  // No `origin` → Maps uses the device's current location as the start.
  return `https://www.google.com/maps/dir/?${p.toString()}`;
}
