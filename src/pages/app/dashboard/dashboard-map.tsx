import { useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface StationBase {
  id: number;
  name: string;
  tipo: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

interface DashboardMapProps<T extends StationBase> {
  stations: T[];
  selectedId: number | null;
  onSelect: (station: T) => void;
  userLocation: { lat: number; lng: number } | null;
  showRoute: boolean;
  travelMode: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function createPinIcon(selected: boolean, tipo: string): L.DivIcon {
  const colors: Record<string, string> = {
    COMBUSTIVEL: "#2563eb",
    GAS: "#ea580c",
    MISTO: "#7c3aed",
  };
  const bg = colors[tipo] ?? "#2563eb";
  const size = selected ? 20 : 14;
  const border = selected ? "border-[3px] border-white" : "border-2 border-white";
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${bg};
      border-radius:50%;
      ${border};
      box-shadow:${selected ? "0 0 0 3px rgba(37,99,235,0.4)" : "0 2px 6px rgba(0,0,0,0.3)"};
      transition:all 0.2s;
      cursor:pointer;
    "></div>`,
    iconSize: [size + 8, size + 8],
    iconAnchor: [(size + 8) / 2, (size + 8) / 2],
  });
}

function createUserIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:14px;height:14px;
      background:#3b82f6;
      border-radius:50%;
      border:3px solid white;
      box-shadow:0 0 0 2px rgba(59,130,246,0.3);
      animation:pulse 2s infinite;
    "></div>
    <style>
      @keyframes pulse {
        0%,100% { box-shadow: 0 0 0 2px rgba(59,130,246,0.3); }
        50% { box-shadow: 0 0 0 6px rgba(59,130,246,0.1); }
      }
    </style>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

// ── Sub-components ──────────────────────────────────────────────────────────

function MapBoundsUpdater<T extends StationBase>({ stations, userLocation }: { stations: T[]; userLocation: { lat: number; lng: number } | null }) {
  const map = useMap();
  const idsKey = stations.map((s) => s.id).join(",") + "|" + (userLocation ? `${userLocation.lat},${userLocation.lng}` : "");

  useEffect(() => {
    const points: L.LatLngExpression[] = [];
    for (const s of stations) {
      if (s.latitude != null && s.longitude != null) {
        points.push([s.latitude, s.longitude]);
      }
    }
    if (userLocation) points.push([userLocation.lat, userLocation.lng]);

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [idsKey]);

  return null;
}

function StationMarkers<T extends StationBase>({ stations, selectedId, onSelect }: {
  stations: T[];
  selectedId: number | null;
  onSelect: (s: T) => void;
}) {
  return (
    <>
      {stations.map((s) => {
        if (s.latitude == null || s.longitude == null) return null;
        return (
          <Marker
            key={s.id}
            position={[s.latitude, s.longitude]}
            icon={createPinIcon(s.id === selectedId, s.tipo)}
            eventHandlers={{ click: () => onSelect(s) }}
          >
            <Popup>
              <div style={{ fontFamily: "sans-serif", fontSize: 13, lineHeight: 1.4 }}>
                <strong>{s.name}</strong>
                <br />
                <span style={{ color: "#64748b", fontSize: 11 }}>{s.tipo}</span>
                <br />
                <span style={{ color: "#94a3b8", fontSize: 11 }}>{s.address}</span>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

function UserLocationMarker({ userLocation }: { userLocation: { lat: number; lng: number } }) {
  return (
    <>
      <Circle
        center={[userLocation.lat, userLocation.lng]}
        radius={50}
        pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.15, weight: 2 }}
      />
      <Marker
        position={[userLocation.lat, userLocation.lng]}
        icon={createUserIcon()}
      />
    </>
  );
}

function RoutePolyline({ userLocation, destLat, destLng }: {
  userLocation: { lat: number; lng: number };
  destLat: number;
  destLng: number;
}) {
  return (
    <Polyline
      positions={[
        [userLocation.lat, userLocation.lng],
        [destLat, destLng],
      ]}
      pathOptions={{
        color: "#3b82f6",
        weight: 4,
        opacity: 0.8,
        dashArray: "10 6",
      }}
    />
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function DashboardMap<T extends StationBase>({
  stations,
  selectedId,
  onSelect,
  userLocation,
  showRoute,
}: DashboardMapProps<T>) {
  const selected = useMemo(() => stations.find((s) => s.id === selectedId), [stations, selectedId]);

  const center: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : selected?.latitude && selected?.longitude
    ? [selected.latitude, selected.longitude]
    : [-8.8383, 13.2543]; // Luanda fallback

  return (
    <MapContainer
      center={center}
      zoom={13}
      className="w-full h-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <StationMarkers stations={stations} selectedId={selectedId} onSelect={onSelect} />

      {userLocation && <UserLocationMarker userLocation={userLocation} />}

      {showRoute && userLocation && selected?.latitude && selected?.longitude && (
        <RoutePolyline
          userLocation={userLocation}
          destLat={selected.latitude}
          destLng={selected.longitude}
        />
      )}

      <MapBoundsUpdater stations={stations} userLocation={userLocation} />
    </MapContainer>
  );
}
