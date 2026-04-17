import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const startIcon = L.divIcon({
  className: "",
  html: `<div style="background:#59b002;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid white">A</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function numberedIcon(n: number) {
  return L.divIcon({
    className: "",
    html: `<div style="background:#2d84c1;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid white">${n}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export type LatLng = { lat: number; lng: number };

export const ALMATY_CENTER: LatLng = { lat: 43.2567, lng: 76.9286 };

function ClickHandler({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function FitBounds({ points, route }: { points: LatLng[]; route: Array<[number, number]> }) {
  const map = useMap();
  useEffect(() => {
    if (route.length > 1) {
      map.fitBounds(L.latLngBounds(route as L.LatLngTuple[]), { padding: [40, 40] });
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
  }, [map, points, route]);
  return null;
}

function LocateButton() {
  const map = useMap();
  const [busy, setBusy] = useState(false);

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
  route?: Array<[number, number]>;
  showStartMarker?: boolean;
  center?: LatLng;
  loading?: boolean;
  loadingText?: string;
  className?: string;
};

export default function MapPicker({
  points,
  onMapClick,
  route = [],
  showStartMarker = true,
  center = ALMATY_CENTER,
  loading = false,
  loadingText = "Прокладываем маршрут…",
  className = "",
}: Props) {
  const allPoints = useMemo(
    () => (showStartMarker ? [center, ...points] : points),
    [showStartMarker, center, points],
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
        {onMapClick && <ClickHandler onPick={onMapClick} />}
        {showStartMarker && <Marker position={[center.lat, center.lng]} icon={startIcon} />}
        {points.map((p, i) => (
          <Marker key={`${p.lat}-${p.lng}-${i}`} position={[p.lat, p.lng]} icon={numberedIcon(i + 1)} />
        ))}
        {route.length > 1 && (
          <Polyline positions={route} pathOptions={{ color: "#59b002", weight: 5, opacity: 0.8 }} />
        )}
        <FitBounds points={allPoints} route={route} />
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
