"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Waves, MapPin, AlertTriangle } from "lucide-react";

interface SidebarProps {
  selectedRiver: string | null;
  setSelectedRiver: (river: string | null) => void;
  selectedRoute: string | null;
  setSelectedRoute: (route: string | null) => void;
  geoJsonData: any;
  setSelectedRouteData: (data: any) => void;
}

const RIVERS = [
  {
    name: "Green River",
    color: "bg-green-500",
    routes: [
      "Lock # 5 Rd. (1749) to Hwy 185",
      "Hwy 185 to Lock # 4 Woodbury (403)",
    ],
  },
  {
    name: "Barren River",
    color: "bg-purple-500",
    routes: [
      "Hwy 101 to Martinsville Ford (961)",
      "Martinsville Ford (961) to Iron Bridge Road",
      "Iron Bridge Road to Weldon Peete Park",
      "Weldon Peete Park to State Street Bridge",
      "State Street Bridge to Beech Bend Park (private)",
      "Beech Bend Park (private) to Boat Landing Road Park",
      "Boat Landing Road Park to H.P. Thomas Landing",
      "H.P. Thomas Landing to Greencastle Rd. (Lock #4)",
      "Greencastle Rd. (Lock #4) to Gasper Confluence (1435)",
      "Gasper Confluence (1435) to Lock # 4 Woodbury (403)",
    ],
  },
  {
    name: "Drakes Creek",
    color: "bg-blue-500",
    routes: [
      "HWY-240 (Woodburn Allen Springs Road) to Romanza Johnson Park",
      "Romanza Johnson Park to Phil Moore Park",
      "Phil Moore Park to Old Scottsville Rd.",
      "Old Scottsville Rd. to Cemetery Rd. (Drakes)",
      "Cemetery Rd. (Drakes) to Weldon Peete Park",
    ],
  },
  {
    name: "West Fork of Drakes Creek",
    color: "bg-pink-500",
    routes: [
      "Sadler Ford Bridge to Woody Atkinson Rd. Bridge",
      "Woody Atkinson Rd. Bridge to HWY-622 (Plano Rd)",
      "HWY-622 (Plano Rd) to HWY-240 (Woodburn Allen Springs Road)",
    ],
  },
  {
    name: "Middle Fork of Drakes Creek",
    color: "bg-amber-500",
    routes: [
      "Goodrum Rd. to Duncan Rd. Ford",
      "Duncan Rd. Ford to HWY-240 (Woodburn Allen Springs Road)",
    ],
  },
  {
    name: "Bays Fork",
    color: "bg-teal-500",
    routes: [
      "Cemetery Road to Martinsville Ford",
    ],
  },
  {
    name: "Trammel Fork of Drakes Creek",
    color: "bg-red-500",
    routes: [
      "HWY-240 (Woodburn Allen Springs Road) (Trammel) to Boyce-Fairview Rd.",
      "Boyce-Fairview Rd. to Romanza Johnson Park",
    ],
  },
  {
    name: "Gasper River",
    color: "bg-cyan-500",
    routes: [
      "Old River Road (Logan Co) to Hullet Lane",
      "Hullet Lane to 1083 Access",
      "1083 Access to Jackson Bridge (626)",
      "Jackson Bridge (626) to Morgantown Rd. (Hwy 231)",
      "Morgantown Rd. (Hwy 231) to Gasper Confluence",
    ],
  },
  {
    name: "Clear Fork of Gasper River",
    color: "bg-violet-500",
    routes: [
      "Browning Rd Access to 1083 Access",
    ],
  },
];

const SAFETY_GUIDELINES = [
  "Always wear a properly fitted life jacket",
  "Check weather conditions before departure",
  "Tell someone your paddling plans and expected return time",
  "Carry a whistle and first aid kit",
  "Stay hydrated and protect yourself from sun exposure",
  "Be aware of water levels and flow conditions",
  "Respect private property and wildlife",
];

export default function Sidebar({
  selectedRiver,
  setSelectedRiver,
  selectedRoute,
  setSelectedRoute,
  geoJsonData,
  setSelectedRouteData,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

  const handleRiverClick = (riverName: string) => {
    setSelectedRiver(riverName);
    setSelectedRoute(null);
  };

  const handleRouteClick = (routeName: string) => {
    setSelectedRoute(routeName);
    
    if (geoJsonData && geoJsonData.features) {
      const feature = geoJsonData.features.find(
        (f: any) => f.properties.route_name === routeName
      );
      if (feature) {
        setSelectedRouteData(feature.properties);
      }
    }
  };

  return (
    <div
      className={`relative h-full bg-white shadow-lg transition-all duration-300 ease-in-out z-10 ${
        isOpen ? "w-80" : "w-12"
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-3 top-4 bg-blue-600 text-white rounded-full p-1.5 shadow-md hover:bg-blue-700 transition-colors z-20"
        aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      {isOpen ? (
        <div className="h-full overflow-y-auto p-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Waves className="text-blue-600" size={32} />
              <h1 className="text-2xl font-bold text-gray-800">
                Southcentral Kentucky Blueways
              </h1>
            </div>
            <p className="text-sm text-gray-600">
              Explore paddling routes across rivers and creeks in south-central Kentucky
            </p>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="text-blue-600" size={20} />
              <h2 className="text-lg font-semibold text-gray-800">Rivers & Routes</h2>
            </div>
            <div className="space-y-3">
              {RIVERS.map((river) => (
                <div key={river.name} className="border-l-4 pl-3 py-2" style={{ borderColor: river.color.replace('bg-', '').replace('-500', '') }}>
                  <button
                    onClick={() => handleRiverClick(river.name)}
                    className={`w-full flex items-center gap-2 mb-2 px-2 py-1 rounded transition-colors ${
                      selectedRiver === river.name
                        ? 'bg-blue-100 font-bold'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${river.color}`}></div>
                    <h3 className="text-sm text-gray-800">{river.name}</h3>
                  </button>
                  {river.routes.length > 0 && (
                    <ul className="space-y-1 ml-5">
                      {river.routes.map((route) => (
                        <li key={route}>
                          <button
                            onClick={() => handleRouteClick(route)}
                            className={`w-full text-left text-xs px-2 py-1 rounded transition-colors ${
                              selectedRoute === route
                                ? 'bg-blue-50 text-blue-700 font-semibold'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {route}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="text-amber-600" size={20} />
              <h2 className="text-lg font-semibold text-gray-800">Safety Guidelines</h2>
            </div>
            <ul className="space-y-2">
              {SAFETY_GUIDELINES.map((guideline, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span>{guideline}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col items-center pt-16 gap-4">
          <Waves className="text-blue-600" size={24} />
          <MapPin className="text-blue-600" size={20} />
          <AlertTriangle className="text-amber-600" size={20} />
        </div>
      )}
    </div>
  );
}
