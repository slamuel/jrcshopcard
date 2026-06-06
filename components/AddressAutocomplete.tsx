"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Field, Input } from "@/components/ui/Input";

type Pred = { description: string; place_id: string };

export function AddressAutocomplete({
  onResolved,
  disabled,
}: {
  onResolved: (data: {
    formattedAddress: string;
    latitude?: number | null;
    longitude?: number | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
  }) => void;
  disabled?: boolean;
}) {
  const [q, setQ] = useState("");
  const [preds, setPreds] = useState<Pred[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (input: string) => {
    if (input.length < 3) {
      setPreds([]);
      return;
    }
    const res = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(input)}`);
    const data = (await res.json()) as { predictions?: Pred[] };
    setPreds(data.predictions ?? []);
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void search(q);
    }, 350);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q, search]);

  return (
    <div className="relative">
      <Field label="Search address">
        <Input
          value={q}
          disabled={disabled}
          placeholder="Start typing an address…"
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
      </Field>
      {open && preds.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-zinc-200 bg-white text-sm shadow-lg">
          {preds.map((p) => (
            <li key={p.place_id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-zinc-50"
                onClick={async () => {
                  setOpen(false);
                  const res = await fetch(
                    `/api/places/details?placeId=${encodeURIComponent(p.place_id)}`
                  );
                  if (!res.ok) return;
                  const d = (await res.json()) as {
                    formattedAddress: string;
                    latitude?: number;
                    longitude?: number;
                    city?: string;
                    state?: string;
                    postalCode?: string;
                  };
                  onResolved({
                    formattedAddress: d.formattedAddress,
                    latitude: d.latitude ?? null,
                    longitude: d.longitude ?? null,
                    city: d.city ?? null,
                    state: d.state ?? null,
                    postalCode: d.postalCode ?? null,
                  });
                  setQ(p.description);
                }}
              >
                {p.description}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
