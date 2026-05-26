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

// ── Global map styles (injected once into <head>) ─────────────────────────────

const MAP_STYLE_ID = "locatech-map-styles";

const mapStyles = `
  .pin-container { position: relative; display: flex; align-items: center; justify-content: center; }
  .pin-svg { filter: drop-shadow(0 2px 6px rgba(0,0,0,0.3)); transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
  .pin-selected .pin-svg { transform: scale(1.15); }
  .pin-glow { transform-origin: center; animation: pinGlow 1.8s ease-in-out infinite; }
  @keyframes pinGlow {
    0%, 100% { opacity: 0; transform: scale(0.9); }
    50% { opacity: 0.7; transform: scale(1.3); }
  }

  .user-location-marker { background: none !important; border: none !important; }
  .user-dot { position: relative; width: 24px; height: 24px; }
  .user-center {
    position: absolute; top: 5px; left: 5px; width: 14px; height: 14px;
    background: #3b82f6; border-radius: 50%; border: 3px solid white;
    box-shadow: 0 0 0 2px rgba(59,130,246,0.4);
    z-index: 2;
  }
  .user-ring {
    position: absolute; top: 0; left: 0; width: 24px; height: 24px;
    border-radius: 50%; border: 2px solid rgba(59,130,246,0.35);
    animation: userPulse 2.5s ease-out infinite;
  }
  .user-ring-2 { animation-delay: 0.8s; }
  .user-ring-3 { animation-delay: 1.6s; }
  @keyframes userPulse {
    0% { transform: scale(1); opacity: 1; }
    100% { transform: scale(2.8); opacity: 0; }
  }

  .route-line {
    stroke-dasharray: 8 6;
    animation: dashMove 0.7s linear infinite;
  }
  @keyframes dashMove {
    to { stroke-dashoffset: -14; }
  }

  .leaflet-popup-content-wrapper {
    border-radius: 12px !important;
    overflow: hidden;
    animation: popupIn 0.2s ease-out;
  }
  .leaflet-popup-tip { box-shadow: none !important; }
  @keyframes popupIn {
    from { opacity: 0; transform: translateY(8px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .leaflet-tile-pane { filter: saturate(1.05) contrast(1.05); }
`;

function useMapStyles() {
  useEffect(() => {
    if (document.getElementById(MAP_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = MAP_STYLE_ID;
    style.textContent = mapStyles;
    document.head.appendChild(style);
    return () => {
      document.getElementById(MAP_STYLE_ID)?.remove();
    };
  }, []);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const PIN_GRADIENTS: Record<string, [string, string]> = {
  COMBUSTIVEL: ["#3b82f6", "#1d4ed8"],
  GAS: ["#f97316", "#c2410c"],
  MISTO: ["#8b5cf6", "#6d28d9"],
};

let _pinUid = 0;

function createPinIcon(selected: boolean, tipo: string): L.DivIcon {
  const [top, bottom] = PIN_GRADIENTS[tipo] ?? PIN_GRADIENTS.COMBUSTIVEL;
  const uid = ++_pinUid;
  const w = selected ? 32 : 28;
  const h = Math.round(w * 1.5);

  return L.divIcon({
    className: "",
    html: `<div class="pin-container${selected ? " pin-selected" : ""}">
      <svg viewBox="0 0 30 45" width="${w}" height="${h}" class="pin-svg">
        <defs>
          <linearGradient id="pg-${uid}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${top}"/>
            <stop offset="100%" stop-color="${bottom}"/>
          </linearGradient>
          <filter id="ps-${uid}">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-opacity="0.35"/>
          </filter>
        </defs>
        ${
          selected
            ? `<circle cx="15" cy="16" r="17" fill="none" stroke="${top}" stroke-width="2.5" class="pin-glow" opacity="0.5"/>`
            : ""
        }
        <path d="M15,43 C15,43 4,28 4,15 C4,8.9 8.9,4 15,4 C21.1,4 26,8.9 26,15 C26,28 15,43 15,43 Z" fill="url(#pg-${uid})" filter="url(#ps-${uid})"/>
        <circle cx="15" cy="14" r="5" fill="white"/>
      </svg>
    </div>`,
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
  });
}

function createUserIcon(): L.DivIcon {
  return L.divIcon({
    className: "user-location-marker",
    html: `<div class="user-dot">
      <div class="user-ring user-ring-1"></div>
      <div class="user-ring user-ring-2"></div>
      <div class="user-ring user-ring-3"></div>
      <div class="user-center"></div>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function createArrowIcon(angle: number): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="transform:rotate(${angle}deg);width:20px;height:20px;display:flex;align-items:center;justify-content:center;">
      <svg viewBox="0 0 24 24" width="16" height="16">
        <path d="M12 3L19 20L12 16L5 20L12 3Z" fill="#3b82f6" stroke="white" stroke-width="1.5"/>
      </svg>
    </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

// ── Sub-components ──────────────────────────────────────────────────────────

function MapBoundsUpdater<T extends StationBase>({
  stations,
  userLocation,
}: {
  stations: T[];
  userLocation: { lat: number; lng: number } | null;
}) {
  const map = useMap();
  const idsKey =
    stations.map((s) => s.id).join(",") +
    "|" +
    (userLocation ? `${userLocation.lat},${userLocation.lng}` : "");

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

function StationMarkers<T extends StationBase>({
  stations,
  selectedId,
  onSelect,
}: {
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
              <div
                style={{
                  fontFamily: "sans-serif",
                  fontSize: 13,
                  lineHeight: 1.4,
                }}
              >
                <strong style={{ fontSize: 14 }}>{s.name}</strong>
                <br />
                <span style={{ color: "#64748b", fontSize: 11 }}>
                  {s.tipo}
                </span>
                <br />
                <span style={{ color: "#94a3b8", fontSize: 11 }}>
                  {s.address}
                </span>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

function UserLocationMarker({
  userLocation,
}: {
  userLocation: { lat: number; lng: number };
}) {
  return (
    <>
      <Circle
        center={[userLocation.lat, userLocation.lng]}
        radius={50}
        pathOptions={{
          color: "#3b82f6",
          fillColor: "#3b82f6",
          fillOpacity: 0.12,
          weight: 2,
        }}
      />
      <Marker
        position={[userLocation.lat, userLocation.lng]}
        icon={createUserIcon()}
      />
    </>
  );
}

function RoutePolyline({
  userLocation,
  destLat,
  destLng,
}: {
  userLocation: { lat: number; lng: number };
  destLat: number;
  destLng: number;
}) {
  const midLat = (userLocation.lat + destLat) / 2;
  const midLng = (userLocation.lng + destLng) / 2;
  const angle =
    Math.atan2(destLng - userLocation.lng, destLat - userLocation.lat) *
    (180 / Math.PI);

  const arrowIcon = useMemo(() => createArrowIcon(angle), [angle]);

  return (
    <>
      <Polyline
        positions={[
          [userLocation.lat, userLocation.lng],
          [destLat, destLng],
        ]}
        pathOptions={{
          color: "#3b82f6",
          weight: 4,
          opacity: 0.85,
          className: "route-line",
        }}
      />
      <Marker position={[midLat, midLng]} icon={arrowIcon} />
    </>
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
  useMapStyles();

  const selected = useMemo(
    () => stations.find((s) => s.id === selectedId),
    [stations, selectedId]
  );

  const center: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : selected?.latitude && selected?.longitude
    ? [selected.latitude, selected.longitude]
    : [-8.8383, 13.2543];

  return (
    <MapContainer
      center={center}
      zoom={13}
      className="w-full h-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      <StationMarkers
        stations={stations}
        selectedId={selectedId}
        onSelect={onSelect}
      />

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
