"use client";

import { useState } from "react";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { createLocation } from "@/lib/actions/jobs";
import { Section } from "@/components/ui/Card";

export function CustomerDetailClient({
  customerId,
  initialLocations,
}: {
  customerId: string;
  initialLocations: { id: string; name: string; formattedAddress: string }[];
}) {
  const [locations, setLocations] = useState(initialLocations);
  const [pending, setPending] = useState(false);

  return (
    <Section title="Locations">
      {locations.length > 0 && (
        <ul className="mb-4 space-y-1">
          {locations.map((l) => (
            <li key={l.id}>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.formattedAddress)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-start justify-between gap-2 rounded-lg border border-transparent px-3 py-2 hover:border-zinc-200 hover:bg-zinc-50"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-zinc-900">{l.name}</div>
                  <div className="truncate text-sm text-zinc-500">{l.formattedAddress}</div>
                </div>
                <span className="shrink-0 text-sm font-medium text-zinc-500">Map →</span>
              </a>
            </li>
          ))}
        </ul>
      )}
      <AddressAutocomplete
        onResolved={async (d) => {
          setPending(true);
          try {
            const loc = await createLocation(customerId, {
              name: d.formattedAddress.split(",")[0] ?? "Location",
              formattedAddress: d.formattedAddress,
              latitude: d.latitude,
              longitude: d.longitude,
              city: d.city,
              state: d.state,
              postalCode: d.postalCode,
            });
            setLocations([
              ...locations,
              { id: loc.id, name: loc.name, formattedAddress: loc.formattedAddress },
            ]);
          } finally {
            setPending(false);
          }
        }}
        disabled={pending}
      />
    </Section>
  );
}
