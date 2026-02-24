"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
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

interface MapProps {
  selectedRiver: string | null;
  selectedRoute: string | null;
  onRouteSelect: (properties: any) => void;
  isMobile: boolean;
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

export default function Map({ selectedRiver, selectedRoute, onRouteSelect, isMobile }: MapProps) {
  const [geoJsonData, setGeoJsonData] = useState<any>(null);

  useEffect(() => {
    fetch("/blueways.geojson")
      .then((response) => response.json())
      .then((data) => setGeoJsonData(data))
      .catch((error) => console.error("Error loading GeoJSON:", error));
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
        const popupContent = `
          <div class="p-2">
            <h3 class="font-bold text-lg mb-1">${props.name}</h3>
            <p class="text-sm text-gray-600">${props.river}</p>
            ${props.warning ? `<p class="text-xs mt-1 text-red-600">${props.warning}</p>` : ""}
          </div>
        `;
        layer.bindPopup(popupContent);
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
    <div className="w-full h-full">
      <MapContainer
        center={[36.98, -86.44]}
        zoom={isMobile ? 11 : 10}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
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
