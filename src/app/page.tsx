"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Sidebar from "@/components/Sidebar";
import RouteInfoBox from "@/components/RouteInfoBox";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <p className="text-gray-600">Loading map...</p>
    </div>
  ),
});

export default function Home() {
  const [selectedRiver, setSelectedRiver] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [selectedRouteData, setSelectedRouteData] = useState<any | null>(null);
  const [geoJsonData, setGeoJsonData] = useState<any>(null);

  useEffect(() => {
    fetch("/blueways.geojson")
      .then((response) => response.json())
      .then((data) => setGeoJsonData(data))
      .catch((error) => console.error("Error loading GeoJSON:", error));
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar
        selectedRiver={selectedRiver}
        setSelectedRiver={setSelectedRiver}
        selectedRoute={selectedRoute}
        setSelectedRoute={setSelectedRoute}
        geoJsonData={geoJsonData}
        setSelectedRouteData={setSelectedRouteData}
      />
      <div className="flex-1 h-full relative">
        <Map
          selectedRiver={selectedRiver}
          selectedRoute={selectedRoute}
          onRouteSelect={setSelectedRouteData}
        />
        {selectedRouteData && (
          <RouteInfoBox
            route={selectedRouteData}
            onClose={() => setSelectedRouteData(null)}
          />
        )}
      </div>
    </div>
  );
}
