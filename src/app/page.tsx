"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Menu } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import RouteInfoBox from "@/components/RouteInfoBox";
import { useIsMobile } from "@/hooks/useIsMobile";

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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetch("/blueways.geojson")
      .then((response) => response.json())
      .then((data) => setGeoJsonData(data))
      .catch((error) => console.error("Error loading GeoJSON:", error));
  }, []);

  const handleRouteDataSelect = (data: any) => {
    setSelectedRouteData(data);
    if (isMobile) {
      setMobileSidebarOpen(false);
    }
  };

  if (isMobile) {
    return (
      <div className="relative h-screen w-screen overflow-hidden">
        <Map
          selectedRiver={selectedRiver}
          selectedRoute={selectedRoute}
          onRouteSelect={setSelectedRouteData}
          isMobile
        />

        {!mobileSidebarOpen && !selectedRouteData && (
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="fixed top-4 left-4 z-30 bg-white rounded-lg shadow-lg p-3 active:bg-gray-100"
            aria-label="Open menu"
          >
            <Menu size={24} className="text-gray-700" />
          </button>
        )}

        <Sidebar
          selectedRiver={selectedRiver}
          setSelectedRiver={setSelectedRiver}
          selectedRoute={selectedRoute}
          setSelectedRoute={setSelectedRoute}
          geoJsonData={geoJsonData}
          setSelectedRouteData={handleRouteDataSelect}
          isMobile
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />

        {selectedRouteData && (
          <RouteInfoBox
            route={selectedRouteData}
            onClose={() => setSelectedRouteData(null)}
            isMobile
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar
        selectedRiver={selectedRiver}
        setSelectedRiver={setSelectedRiver}
        selectedRoute={selectedRoute}
        setSelectedRoute={setSelectedRoute}
        geoJsonData={geoJsonData}
        setSelectedRouteData={setSelectedRouteData}
        isMobile={false}
        isOpen={true}
        onClose={() => {}}
      />
      <div className="flex-1 h-full relative">
        <Map
          selectedRiver={selectedRiver}
          selectedRoute={selectedRoute}
          onRouteSelect={setSelectedRouteData}
          isMobile={false}
        />
        {selectedRouteData && (
          <RouteInfoBox
            route={selectedRouteData}
            onClose={() => setSelectedRouteData(null)}
            isMobile={false}
          />
        )}
      </div>
    </div>
  );
}
