import { useCallback, useEffect, useState } from "react";
import { ALMATY_CENTER, type LatLng } from "../components/ui/MapPicker";
import type { AddressEntry } from "../components/ui/AddressList";
import { reverseGeocode } from "../services/geocoderService";
import { getTrip, type TripResult } from "../services/routingService";

const PRICE_PER_KM = 500;

function makeEntry(): AddressEntry {
  return { id: crypto.randomUUID(), text: "", location: null };
}

export function useAddressTrip() {
  const [items, setItems] = useState<AddressEntry[]>([makeEntry()]);
  const [trip, setTrip] = useState<TripResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const setText = useCallback((id: string, text: string) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, text } : x)));
  }, []);

  const setLocation = useCallback((id: string, location: LatLng) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, location } : x)));
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

  const locations = items
    .map((x) => x.location)
    .filter((x): x is LatLng => x !== null);

  useEffect(() => {
    if (locations.length === 0) {
      setTrip(null);
      setError(false);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    setError(false);
    getTrip(ALMATY_CENTER, locations, ctrl.signal)
      .then((result) => {
        if (result) setTrip(result);
        else {
          setTrip(null);
          setError(true);
        }
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setTrip(null);
        setError(true);
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(locations)]);

  const distanceKm = trip ? trip.distanceMeters / 1000 : 0;
  const deliveryCost = Math.round(distanceKm * PRICE_PER_KM);

  return {
    items,
    locations,
    trip,
    loading,
    error,
    distanceKm,
    deliveryCost,
    setText,
    setLocation,
    addEntry,
    removeEntry,
    appendFromMap,
  };
}
