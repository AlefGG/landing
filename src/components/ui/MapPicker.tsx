import { useCallback, useEffect, useMemo, useState } from "react";
import { GeoJSON, MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ZonesFeatureCollection } from "../../services/zonesService";
import { priceTierStyle } from "../../utils/priceTierStyle";

type ZoneFeatureForStyle = Parameters<typeof priceTierStyle>[1];

function sortedByPriorityAsc(fc: ZonesFeatureCollection): ZonesFeatureCollection {
  // Backend returns -priority, -id (highest first). Reverse so highest priority
  // is drawn LAST → ends up on top.
  return {
    type: "FeatureCollection",
    features: [...fc.features].sort(
      (a, b) => a.properties.priority - b.properties.priority,
    ),
  };
}

export type LatLng = { lat: number; lng: number };

// FE-CQ-003: kept module-private. Was exported alongside the default
// component which broke react-refresh; only used inside this file.
const ALMATY_CENTER: LatLng = { lat: 43.2567, lng: 76.9286 };

function ClickHandler({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function FitBounds({
  points,
  routes,
}: {
  points: LatLng[];
  routes: Array<Array<[number, number]>>;
}) {
  const map = useMap();
  // FE-RX-002: re-fit only when the actual lat/lng values change, not on
  // every parent render. `points` / `routes` may already be stable from
  // useAddressTrip (FE-RX-005), but a value-digest defends against future
  // callers that pass fresh array literals — the user's manual pan/zoom
  // would otherwise be lost on every keystroke in the parent form.
  const pointsKey = useMemo(
    () => points.map((p) => `${p.lat},${p.lng}`).join("|"),
    [points],
  );
  const routesKey = useMemo(
    () => routes.map((r) => r.length).join("|"),
    [routes],
  );
  useEffect(() => {
    const flat = routes.flat();
    if (flat.length > 1) {
      map.fitBounds(L.latLngBounds(flat as L.LatLngTuple[]), { padding: [40, 40] });
      return;
    }
    if (points.length === 1) {
      map.flyTo([points[0]!.lat, points[0]!.lng], Math.max(map.getZoom(), 15));
      return;
    }
    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng] as L.LatLngTuple)), {
        padding: [40, 40],
      });
    }
    // Effect deps are the digests, not the arrays — `points` / `routes` are
    // read from closure and re-resolved on each effect run; same identity
    // is fine since the digest gates re-run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, pointsKey, routesKey]);
  return null;
}

function LocateButton() {
  const map = useMap();
  const [busy, setBusy] = useState(false);

  const buttonRef = useCallback((node: HTMLButtonElement | null) => {
    if (node) {
      L.DomEvent.disableClickPropagation(node);
      L.DomEvent.disableScrollPropagation(node);
    }
  }, []);

  const handle = () => {
    if (!navigator.geolocation || busy) return;
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.flyTo([pos.coords.latitude, pos.coords.longitude], 16);
        setBusy(false);
      },
      () => setBusy(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handle}
      aria-label="Моё местоположение"
      className="absolute right-3 bottom-6 z-[500] size-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-neutral-100 disabled:opacity-50"
      disabled={busy}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-neutral-900">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M4 21c1-4 4.5-6 8-6s7 2 8 6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}

type Props = {
  points: LatLng[];
  onMapClick?: (p: LatLng) => void;
  routes?: Array<Array<[number, number]>>;
  warehouse?: LatLng | null;
  showStartMarker?: boolean;
  loading?: boolean;
  loadingText?: string;
  className?: string;
  zones?: ZonesFeatureCollection | null;
};

export default function MapPicker({
  points,
  onMapClick,
  routes = [],
  warehouse = null,
  showStartMarker = true,
  loading = false,
  loadingText = "Прокладываем маршрут…",
  className = "",
  zones = null,
}: Props) {
  const center = warehouse ?? ALMATY_CENTER;
  const showWarehouseMarker = showStartMarker && warehouse !== null;
  const allPoints = useMemo(
    () => (showWarehouseMarker ? [center, ...points] : points),
    [showWarehouseMarker, center, points],
  );

  const startIcon = useMemo(
    () =>
      L.divIcon({
        className: "",
        html: `<div style="background:#59b002;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid white">A</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      }),
    [],
  );

  const numberedIcon = useCallback(
    (n: number) =>
      L.divIcon({
        className: "",
        html: `<div style="background:#1F5F8F;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid white">${n}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      }),
    [],
  );

  return (
    <div className={`relative w-full rounded-2xl border border-neutral-300 overflow-hidden ${className}`}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {zones && zones.features.length > 0 && (
          <GeoJSON
            key={`zones-${zones.features.length}-${zones.features[0]?.properties.id ?? "x"}`}
            data={sortedByPriorityAsc(zones) as GeoJSON.GeoJsonObject}
            style={(feature) =>
              feature
                ? priceTierStyle(zones, feature as unknown as ZoneFeatureForStyle)
                : { color: "#59b002", fillColor: "#59b002", fillOpacity: 0.18, weight: 1 }
            }
            onEachFeature={(feature, layer) => {
              const p = (feature as { properties: { name: string; price: string } }).properties;
              const priceFmt = Number(p.price).toLocaleString("ru-RU");
              layer.bindTooltip(`${p.name} — ${priceFmt} ₸`, { sticky: true });
            }}
          />
        )}
        {onMapClick && <ClickHandler onPick={onMapClick} />}
        {showWarehouseMarker && (
          <Marker position={[center.lat, center.lng]} icon={startIcon} />
        )}
        {points.map((p, i) => (
          <Marker key={`${p.lat}-${p.lng}-${i}`} position={[p.lat, p.lng]} icon={numberedIcon(i + 1)} />
        ))}
        {routes.map((route, i) =>
          route.length > 1 ? (
            <Polyline
              key={`route-${i}`}
              positions={route}
              pathOptions={{ color: "#59b002", weight: 5, opacity: 0.8 }}
            />
          ) : null,
        )}
        <FitBounds points={allPoints} routes={routes} />
        <LocateButton />
      </MapContainer>
      {loading && (
        <div className="absolute inset-0 z-[600] bg-white/60 backdrop-blur-[1px] flex items-center justify-center pointer-events-auto">
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-lg">
            <svg width="20" height="20" viewBox="0 0 24 24" className="animate-spin text-cta-main">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
              <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
            </svg>
            <span className="font-body text-base text-neutral-900">{loadingText}</span>
          </div>
        </div>
      )}
    </div>
  );
}
