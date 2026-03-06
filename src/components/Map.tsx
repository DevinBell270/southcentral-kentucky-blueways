"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Circle,
  CircleMarker,
  GeoJSON,
  MapContainer,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { LocateFixed, Loader2 } from "lucide-react";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const RIVER_COLORS: Record<string, string> = {
  "Green River": "#22c55e",
  "Drakes Creek": "#3b82f6",
  "Barren River": "#a855f7",
  "West Fork of Drakes Creek": "#ec4899",
  "Middle Fork of Drakes Creek": "#f59e0b",
  "Bays Fork": "#14b8a6",
  "Trammel Fork of Drakes Creek": "#ef4444",
  "Gasper River": "#06b6d4",
  "Clear Fork of Gasper River": "#8b5cf6",
};

const SK_BOUNDS: [L.LatLngTuple, L.LatLngTuple] = [
  [36.4, -87.8],
  [37.6, -85.2],
];

interface MapProps {
  selectedRiver: string | null;
  selectedRoute: string | null;
  onRouteSelect: (properties: any) => void;
  onPointSelect: (properties: any) => void;
  isMobile: boolean;
}

interface UserLocation {
  lat: number;
  lng: number;
  accuracy: number;
  locatedAt: number;
}

function MapController({
  geoJsonData,
  selectedRiver,
  selectedRoute,
  isMobile,
}: {
  geoJsonData: any;
  selectedRiver: string | null;
  selectedRoute: string | null;
  isMobile: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (!geoJsonData) return;

    let featuresToFit: any[] = [];

    if (selectedRoute) {
      featuresToFit = geoJsonData.features.filter(
        (f: any) => f.properties.route_name === selectedRoute
      );
    } else if (selectedRiver) {
      featuresToFit = geoJsonData.features.filter(
        (f: any) =>
          f.properties.river === selectedRiver &&
          f.geometry.type === "LineString"
      );
    }

    if (featuresToFit.length > 0) {
      const bounds = L.geoJSON(featuresToFit).getBounds();
      const padding: [number, number] = isMobile ? [20, 20] : [50, 50];
      map.fitBounds(bounds, { padding });
    }
  }, [map, geoJsonData, selectedRiver, selectedRoute, isMobile]);

  return null;
}

function UserLocationController({
  userLocation,
  isMobile,
}: {
  userLocation: UserLocation | null;
  isMobile: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (!userLocation) return;

    map.flyTo([userLocation.lat, userLocation.lng], isMobile ? 13 : 14, {
      duration: 1.2,
    });
  }, [map, userLocation, isMobile]);

  return null;
}

function getGeolocationErrorMessage(error: GeolocationPositionError) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Location access was denied. Please allow location access and try again.";
    case error.POSITION_UNAVAILABLE:
      return "Your location could not be determined right now.";
    case error.TIMEOUT:
      return "Location request timed out. Please try again.";
    default:
      return "Unable to retrieve your location.";
  }
}

export default function Map({ selectedRiver, selectedRoute, onRouteSelect, onPointSelect, isMobile }: MapProps) {
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/blueways.geojson")
      .then((response) => response.json())
      .then((data) => setGeoJsonData(data))
      .catch((error) => console.error("Error loading GeoJSON:", error));
  }, []);

  const handleLocateMe = useCallback(() => {
    if (typeof window === "undefined") return;

    if (!window.isSecureContext) {
      setLocationError("Location access requires a secure connection or localhost.");
      return;
    }

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          locatedAt: Date.now(),
        };

        const mapBounds = L.latLngBounds(SK_BOUNDS);
        if (!mapBounds.contains([nextLocation.lat, nextLocation.lng])) {
          setUserLocation(null);
          setLocationError(
            "You appear to be outside the Southcentral Kentucky Blueways map area."
          );
          setIsLocating(false);
          return;
        }

        setUserLocation(nextLocation);
        setLocationError(null);
        setIsLocating(false);
      },
      (error) => {
        setLocationError(getGeolocationErrorMessage(error));
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  const pointToLayer = (feature: any, latlng: L.LatLng) => {
    const river = feature.properties.river || "Unknown";
    const color = RIVER_COLORS[river] || "#6b7280";

    return L.circleMarker(latlng, {
      radius: isMobile ? 10 : 8,
      fillColor: color,
      color: "#fff",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8,
    });
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    if (feature.properties) {
      const props = feature.properties;

      if (feature.geometry.type === "Point") {
        layer.on("click", (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e);
          onPointSelect(props);
        });
      } else if (feature.geometry.type === "LineString") {
        if (!isMobile) {
          const popupContent = `
            <div class="p-2">
              <h3 class="font-bold text-lg mb-1">${props.route_name}</h3>
              <p class="text-sm text-gray-600">${props.river}</p>
              <p class="text-sm mt-1">Distance: ${props.distance_miles} miles</p>
            </div>
          `;
          layer.bindPopup(popupContent);
        }

        layer.on('click', () => {
          onRouteSelect(props);
        });
      }
    }
  };

  const styleFeature = (feature: any) => {
    if (feature.geometry.type === "LineString") {
      const river = feature.properties.river || "Unknown";
      const routeName = feature.properties.route_name;
      const color = RIVER_COLORS[river] || "#6b7280";

      if (selectedRoute) {
        if (routeName === selectedRoute) {
          return {
            color: color,
            weight: 5,
            opacity: 1,
          };
        } else if (river === selectedRiver) {
          return {
            color: color,
            weight: 2,
            opacity: 0.4,
          };
        } else {
          return {
            color: "#d1d5db",
            weight: 1,
            opacity: 0.15,
          };
        }
      }

      if (selectedRiver && river === selectedRiver) {
        return {
          color: color,
          weight: 4,
          opacity: 0.8,
        };
      }

      return {
        color: "#d1d5db",
        weight: 1,
        opacity: 0.15,
      };
    }
    return {};
  };

  return (
    <div className="relative w-full h-full">
      <div className="pointer-events-none absolute top-4 right-4 z-[1000] flex max-w-[220px] flex-col items-end gap-2">
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-lg transition hover:bg-gray-50 disabled:cursor-wait disabled:opacity-80"
          aria-label="Locate me"
        >
          {isLocating ? (
            <Loader2 size={18} className="animate-spin text-blue-600" />
          ) : (
            <LocateFixed size={18} className="text-blue-600" />
          )}
          <span>{isLocating ? "Locating..." : "Locate Me"}</span>
        </button>
        {locationError && (
          <div className="pointer-events-auto rounded-lg bg-white/95 px-3 py-2 text-right text-sm text-red-600 shadow-lg">
            {locationError}
          </div>
        )}
      </div>
      <MapContainer
        center={[36.98, -86.44]}
        zoom={isMobile ? 10 : 12}
        minZoom={isMobile ? 9 : 10}
        maxBounds={SK_BOUNDS}
        maxBoundsViscosity={1.0}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {userLocation && (
          <>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={Math.max(userLocation.accuracy, 20)}
              pathOptions={{
                color: "#3b82f6",
                fillColor: "#60a5fa",
                fillOpacity: 0.12,
                weight: 1,
              }}
            />
            <CircleMarker
              center={[userLocation.lat, userLocation.lng]}
              radius={isMobile ? 8 : 7}
              pathOptions={{
                color: "#ffffff",
                fillColor: "#2563eb",
                fillOpacity: 1,
                weight: 3,
              }}
            />
            <UserLocationController userLocation={userLocation} isMobile={isMobile} />
          </>
        )}
        {geoJsonData && (
          <>
            <GeoJSON
              key={`${selectedRiver}-${selectedRoute}`}
              data={geoJsonData}
              pointToLayer={pointToLayer}
              onEachFeature={onEachFeature}
              style={styleFeature}
            />
            <MapController
              geoJsonData={geoJsonData}
              selectedRiver={selectedRiver}
              selectedRoute={selectedRoute}
              isMobile={isMobile}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}
