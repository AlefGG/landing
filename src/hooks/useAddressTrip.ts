import { useCallback, useEffect, useRef, useState } from "react";
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

  const locations: LatLng[] = items
    .map((x) => x.location)
    .filter((x): x is LatLng => x !== null);

  const locationsKey = JSON.stringify(locations);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    if (locations.length === 0) {
      setLegs([]);
      setError(false);
      return;
    }
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setError(false);
    setLegs((prev) => {
      // keep prior legs for unchanged locations; mark new ones as loading
      return locations.map((loc) => {
        const found = prev.find(
          (l) => l.location.lat === loc.lat && l.location.lng === loc.lng && l.preview,
        );
        if (found) return { ...found, loading: false };
        return { location: loc, preview: null, loading: true };
      });
    });

    const timer = setTimeout(async () => {
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
    }, 400);

    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationsKey, serviceType]);

  const loading = legs.some((l) => l.loading);
  const totalDistanceKm = legs.reduce((s, l) => s + (l.preview?.distanceKm ?? 0), 0);
  const totalDeliveryFee = legs.reduce((s, l) => s + (l.preview?.deliveryFee ?? 0), 0);
  const routes: Array<Array<[number, number]>> = legs
    .map((l) => l.preview?.routeGeometry)
    .filter((g): g is Array<[number, number]> => Array.isArray(g) && g.length > 1);
  const warehouse = legs.find((l) => l.preview)?.preview?.warehouse ?? null;
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
