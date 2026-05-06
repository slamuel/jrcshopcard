"use client";

import { useState } from "react";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { createLocation } from "@/lib/actions/jobs";

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
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-500">Locations</h2>
      <ul className="mt-2 space-y-2">
        {locations.map((l) => (
          <li key={l.id}>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.formattedAddress)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-start justify-between gap-2 rounded border border-transparent px-2 py-1 hover:border-zinc-200"
            >
              <div>
                <div className="font-medium">{l.name}</div>
                <div className="text-sm text-zinc-600">{l.formattedAddress}</div>
              </div>
              <span className="text-blue-600">Map</span>
            </a>
          </li>
        ))}
      </ul>
      <div className="mt-4">
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
                {
                  id: loc.id,
                  name: loc.name,
                  formattedAddress: loc.formattedAddress,
                },
              ]);
            } finally {
              setPending(false);
            }
          }}
          disabled={pending}
        />
      </div>
    </section>
  );
}
