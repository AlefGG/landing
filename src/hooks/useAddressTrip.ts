import { useCallback, useEffect, useMemo, useState } from "react";
import type { LatLng } from "../components/ui/MapPicker";
import type { AddressEntry } from "../components/ui/AddressList";
import { reverseGeocode } from "../services/geocoderService";
import {
  previewDelivery,
  type DeliveryPreview,
  type DeliveryServiceType,
} from "../services/deliveryService";

function makeEntry(): AddressEntry {
  return { id: crypto.randomUUID(), text: "", location: null };
}

export type AddressLeg = {
  location: LatLng;
  preview: DeliveryPreview | null;
  loading: boolean;
};

export function useAddressTrip(serviceType: DeliveryServiceType) {
  const [items, setItems] = useState<AddressEntry[]>([makeEntry()]);
  const [legs, setLegs] = useState<AddressLeg[]>([]);
  const [error, setError] = useState(false);

  const setText = useCallback((id: string, text: string) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, text } : x)));
  }, []);

  const setLocation = useCallback((id: string, location: LatLng) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, location } : x)));
  }, []);

  // BUG-055: set text + location atomically when the user picks a
  // suggestion, so previewDelivery sees both fields in one state pass
  // and we can't lose one entry's location to an interleaved render.
  const setEntry = useCallback((id: string, text: string, location: LatLng) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, text, location } : x)));
  }, []);

  const addEntry = useCallback(() => {
    setItems((prev) => [...prev, makeEntry()]);
  }, []);

  const removeEntry = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((x) => x.id !== id);
      return next.length === 0 ? [makeEntry()] : next;
    });
  }, []);

  const appendFromMap = useCallback(async (p: LatLng) => {
    const name = await reverseGeocode(p.lat, p.lng);
    setItems((prev) => {
      const firstEmptyIdx = prev.findIndex((x) => x.location === null && x.text.trim() === "");
      const entry: AddressEntry = {
        id: crypto.randomUUID(),
        text: name ?? `${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}`,
        location: p,
      };
      if (firstEmptyIdx >= 0) {
        const copy = [...prev];
        copy[firstEmptyIdx] = { ...entry, id: prev[firstEmptyIdx]!.id };
        return copy;
      }
      return [...prev, entry];
    });
  }, []);

  // FE-RX-002: memoise so callers (MapPicker FitBounds) see a stable
  // identity across unrelated parent re-renders. New identity emerges
  // only when items mutate.
  const locations = useMemo<LatLng[]>(
    () =>
      items
        .map((x) => x.location)
        .filter((x): x is LatLng => x !== null),
    [items],
  );

  // FE-RX-005: refactored to address three issues at once —
  //   (1) drop the eslint-disable + JSON.stringify dep key (locations is
  //       now stable via useMemo above);
  //   (2) move the synchronous setLegs/setError "mark loading" calls out
  //       of the effect body into the debounce callback so the body
  //       schedules work but does not itself trigger cascading renders;
  //   (3) drop the redundant abortRef.current?.abort() at the top — the
  //       effect cleanup handles abort.
  useEffect(() => {
    const ctrl = new AbortController();

    const timer = window.setTimeout(async () => {
      if (locations.length === 0) {
        setLegs([]);
        setError(false);
        return;
      }
      // Mark new locations as loading just before the fetch fires (preserves
      // cached previews for unchanged coords; only new entries flash).
      setLegs((prev) =>
        locations.map((loc) => {
          const found = prev.find(
            (l) => l.location.lat === loc.lat && l.location.lng === loc.lng && l.preview,
          );
          if (found) return { ...found, loading: false };
          return { location: loc, preview: null, loading: true };
        }),
      );
      setError(false);
      try {
        const results = await Promise.all(
          locations.map((loc) => previewDelivery(serviceType, loc.lat, loc.lng, ctrl.signal)),
        );
        if (ctrl.signal.aborted) return;
        setLegs(
          locations.map((loc, i) => ({
            location: loc,
            preview: results[i] ?? null,
            loading: false,
          })),
        );
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        if (ctrl.signal.aborted) return;
        setError(true);
        setLegs(locations.map((loc) => ({ location: loc, preview: null, loading: false })));
      }
    }, locations.length === 0 ? 0 : 400);

    return () => {
      window.clearTimeout(timer);
      ctrl.abort();
    };
  }, [locations, serviceType]);

  const loading = legs.some((l) => l.loading);
  const totalDistanceKm = legs.reduce((s, l) => s + (l.preview?.distanceKm ?? 0), 0);
  const totalDeliveryFee = legs.reduce((s, l) => s + (l.preview?.deliveryFee ?? 0), 0);
  // FE-RX-002: routes / warehouse memoised on legs so MapPicker FitBounds
  // doesn't see a new array identity per parent render.
  const routes = useMemo<Array<Array<[number, number]>>>(
    () =>
      legs
        .map((l) => l.preview?.routeGeometry)
        .filter((g): g is Array<[number, number]> => Array.isArray(g) && g.length > 1),
    [legs],
  );
  const warehouse = useMemo(
    () => legs.find((l) => l.preview)?.preview?.warehouse ?? null,
    [legs],
  );
  const hasPreview = legs.some((l) => l.preview);

  return {
    items,
    locations,
    legs,
    loading,
    error,
    hasPreview,
    warehouse,
    routes,
    distanceKm: totalDistanceKm,
    deliveryCost: Math.round(totalDeliveryFee),
    setText,
    setLocation,
    setEntry,
    addEntry,
    removeEntry,
    appendFromMap,
  };
}
