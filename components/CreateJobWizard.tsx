"use client";

import { useState } from "react";
import Link from "next/link";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import {
  createCustomer,
  createLocation,
  createJobFromWizard,
} from "@/lib/actions/jobs";

type Step = "customer" | "location";

type CustomerLite = {
  id: string;
  name: string;
};

export function CreateJobWizard({ initialCustomers }: { initialCustomers: CustomerLite[] }) {
  const [step, setStep] = useState<Step>("customer");
  const [customers, setCustomers] = useState(initialCustomers);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const [newCustomerName, setNewCustomerName] = useState("");
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  const [jobId] = useState(() => crypto.randomUUID());
  const [locations, setLocations] = useState<{ id: string; formattedAddress: string }[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [draftNewLocation, setDraftNewLocation] = useState<{
    name: string;
    formattedAddress: string;
    latitude?: number | null;
    longitude?: number | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function pickCustomer(id: string) {
    setSelectedCustomerId(id);
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/customers/${id}/locations`);
      if (!res.ok) throw new Error("Failed to load locations");
      const data = (await res.json()) as { locations: { id: string; formattedAddress: string }[] };
      setLocations(data.locations);
      setStep("location");
    } catch {
      setError("Could not load locations");
    } finally {
      setPending(false);
    }
  }

  async function createNewCustomer() {
    if (!newCustomerName.trim()) return;
    setPending(true);
    setError(null);
    try {
      const c = await createCustomer({ name: newCustomerName.trim() });
      setCustomers([...customers, { id: c.id, name: c.name }]);
      setNewCustomerName("");
      setCreatingCustomer(false);
      await pickCustomer(c.id);
    } catch {
      setError("Failed to create customer");
    } finally {
      setPending(false);
    }
  }

  async function finish() {
    if (!selectedCustomerId) return;
    let locationId = selectedLocationId;
    if (!locationId && draftNewLocation) {
      setPending(true);
      try {
        const loc = await createLocation(selectedCustomerId, {
          name: draftNewLocation.name || "Location",
          formattedAddress: draftNewLocation.formattedAddress,
          latitude: draftNewLocation.latitude,
          longitude: draftNewLocation.longitude,
          city: draftNewLocation.city,
          state: draftNewLocation.state,
          postalCode: draftNewLocation.postalCode,
        });
        locationId = loc.id;
      } catch {
        setError("Could not save location");
        setPending(false);
        return;
      }
    }
    if (!locationId) {
      setError("Select or add a location");
      return;
    }
    setPending(true);
    try {
      await createJobFromWizard({
        customerId: selectedCustomerId,
        locationId,
        jobId,
      });
      window.location.href = `/jobs/${jobId}`;
    } catch {
      setError("Could not create job");
      setPending(false);
    }
  }

  if (step === "customer") {
    return (
      <div className="max-w-md space-y-4">
        <h1 className="text-2xl font-bold">New job</h1>
        <p className="text-sm text-zinc-500">Choose a customer</p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <ul className="space-y-2">
          {customers.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-left text-sm hover:bg-zinc-50 disabled:opacity-50"
                disabled={pending}
                onClick={() => void pickCustomer(c.id)}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
        {creatingCustomer ? (
          <div className="space-y-2 rounded-lg border border-dashed border-zinc-300 p-4">
            <input
              className="w-full rounded border px-3 py-2 text-sm"
              placeholder="Customer name"
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
            />
            <button
              type="button"
              className="rounded bg-zinc-900 px-3 py-2 text-sm text-white"
              onClick={() => void createNewCustomer()}
            >
              Create
            </button>
            <button type="button" className="ml-2 text-sm text-zinc-500" onClick={() => setCreatingCustomer(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="text-sm text-blue-600"
            onClick={() => setCreatingCustomer(true)}
          >
            + New customer
          </button>
        )}
        <div>
          <Link href="/jobs" className="text-sm text-zinc-500">
            Cancel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-2xl font-bold">Select location</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ul className="space-y-2">
        {locations.map((l) => (
          <li key={l.id}>
            <button
              type="button"
              className={`w-full rounded-lg border px-4 py-3 text-left text-sm ${
                selectedLocationId === l.id ? "border-blue-500 bg-blue-50" : "border-zinc-200 bg-white"
              }`}
              onClick={() => {
                setSelectedLocationId(l.id);
                setDraftNewLocation(null);
              }}
            >
              {l.formattedAddress}
            </button>
          </li>
        ))}
      </ul>
      <AddressAutocomplete
        onResolved={(d) => {
          setSelectedLocationId(null);
          setDraftNewLocation({
            name: "New address",
            ...d,
          });
        }}
      />
      {draftNewLocation && (
        <p className="text-sm text-green-700">New location: {draftNewLocation.formattedAddress}</p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={
            pending ||
            (!selectedLocationId && !draftNewLocation?.formattedAddress)
          }
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          onClick={() => void finish()}
        >
          Create job
        </button>
        <button type="button" className="text-sm text-zinc-500" onClick={() => setStep("customer")}>
          Back
        </button>
      </div>
    </div>
  );
}
