"use client";

import { useState } from "react";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import {
  createCustomer,
  createLocation,
  createJobFromWizard,
} from "@/lib/actions/jobs";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/components/ui/cn";

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
      <div className="max-w-lg">
        <PageHeader
          title="New job"
          description="Step 1 of 2 — choose a customer"
          backHref="/jobs"
          backLabel="Jobs"
        />
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <ul className="space-y-2">
          {customers.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm font-medium text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50 disabled:opacity-50"
                disabled={pending}
                onClick={() => void pickCustomer(c.id)}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          {creatingCustomer ? (
            <Card className="space-y-3 border-dashed">
              <Input
                placeholder="Customer name"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => void createNewCustomer()}>
                  Create
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setCreatingCustomer(false)}>
                  Cancel
                </Button>
              </div>
            </Card>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setCreatingCustomer(true)}>
              + New customer
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <PageHeader
        title="Select location"
        description="Step 2 of 2 — choose or add a job site"
      />
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <ul className="space-y-2">
        {locations.map((l) => (
          <li key={l.id}>
            <button
              type="button"
              className={cn(
                "w-full rounded-xl border px-4 py-3 text-left text-sm shadow-sm transition-colors",
                selectedLocationId === l.id
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50"
              )}
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
      <div className="mt-4">
        <AddressAutocomplete
          onResolved={(d) => {
            setSelectedLocationId(null);
            setDraftNewLocation({ name: "New address", ...d });
          }}
        />
      </div>
      {draftNewLocation && (
        <p className="mt-2 text-sm text-emerald-700">
          New location: {draftNewLocation.formattedAddress}
        </p>
      )}
      <div className="mt-5 flex items-center gap-2">
        <Button
          disabled={pending || (!selectedLocationId && !draftNewLocation?.formattedAddress)}
          onClick={() => void finish()}
        >
          {pending ? "Creating…" : "Create job"}
        </Button>
        <Button variant="ghost" onClick={() => setStep("customer")}>
          Back
        </Button>
      </div>
    </div>
  );
}
