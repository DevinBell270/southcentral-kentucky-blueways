"use client";

import { useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Waves, MapPin, AlertTriangle, X } from "lucide-react";
import type { FlowRating } from "@/hooks/useFlowRatings";

interface SidebarProps {
  selectedRiver: string | null;
  setSelectedRiver: (river: string | null) => void;
  selectedRoute: string | null;
  setSelectedRoute: (route: string | null) => void;
  geoJsonData: any;
  setSelectedRouteData: (data: any) => void;
  gaugeRatings: Record<string, FlowRating>;
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
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

const FLOW_FILTERS: {
  rating: FlowRating;
  emoji: string;
  label: string;
  sublabel: string;
  activeClass: string;
}[] = [
  {
    rating: "red",
    emoji: "🔴",
    label: "High Hazard",
    sublabel: "Access Closed",
    activeClass: "bg-red-50 border-red-500 text-red-700",
  },
  {
    rating: "yellow",
    emoji: "🟡",
    label: "Use Caution",
    sublabel: "Moderate Flow",
    activeClass: "bg-yellow-50 border-yellow-500 text-yellow-700",
  },
  {
    rating: "green",
    emoji: "🟢",
    label: "Calm Conditions",
    sublabel: "Low / Safe",
    activeClass: "bg-green-50 border-green-500 text-green-700",
  },
];

function SidebarContent({
  selectedRiver,
  setSelectedRiver,
  selectedRoute,
  handleRouteClick,
  geoJsonData,
  gaugeRatings,
  isMobile,
}: {
  selectedRiver: string | null;
  setSelectedRiver: (river: string | null) => void;
  selectedRoute: string | null;
  handleRouteClick: (route: string) => void;
  geoJsonData: any;
  gaugeRatings: Record<string, FlowRating>;
  isMobile: boolean;
}) {
  const [activeFlowFilter, setActiveFlowFilter] = useState<FlowRating | null>(null);

  const hasRatings = Object.keys(gaugeRatings).length > 0;

  const routeGaugeMap: Record<string, string> = {};
  if (geoJsonData?.features) {
    for (const feature of geoJsonData.features) {
      const { route_name, usgs_gauge_id } = feature.properties ?? {};
      if (route_name && usgs_gauge_id) {
        routeGaugeMap[route_name] = usgs_gauge_id;
      }
    }
  }

  const getRouteRating = (routeName: string): FlowRating | null => {
    const gaugeId = routeGaugeMap[routeName];
    if (!gaugeId) return null;
    return gaugeRatings[gaugeId] ?? null;
  };

  const visibleRivers = RIVERS.map((river) => {
    if (!activeFlowFilter) return { ...river, visibleRoutes: river.routes };
    const visibleRoutes = river.routes.filter((route) => {
      const rating = getRouteRating(route);
      return rating === null || rating === activeFlowFilter;
    });
    return { ...river, visibleRoutes };
  }).filter((river) => river.visibleRoutes.length > 0);

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Waves className="text-blue-600" size={isMobile ? 28 : 32} />
          <h1 className={`font-bold text-gray-800 ${isMobile ? "text-xl" : "text-2xl"}`}>
            Southcentral Kentucky Blueways
          </h1>
        </div>
        <p className="text-sm text-gray-600">
          Explore paddling routes across rivers and creeks in south-central Kentucky
        </p>
      </div>

      <div className="mb-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Filter by Flow Rate
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {FLOW_FILTERS.map(({ rating, emoji, label, sublabel, activeClass }) => {
            const isActive = activeFlowFilter === rating;
            return (
              <button
                key={rating}
                onClick={() => setActiveFlowFilter(isActive ? null : rating)}
                disabled={!hasRatings}
                className={`flex flex-col items-center gap-0.5 px-1 py-2 rounded-lg border-2 text-center transition-all ${
                  !hasRatings
                    ? "opacity-40 cursor-not-allowed border-gray-200 text-gray-400"
                    : isActive
                    ? activeClass + " shadow-sm"
                    : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100"
                }`}
                aria-pressed={isActive}
                title={!hasRatings ? "Loading live flow data…" : undefined}
              >
                <span className="text-lg leading-none" aria-hidden="true">
                  {emoji}
                </span>
                <span className="text-xs font-semibold leading-tight">{label}</span>
                <span className={`text-xs leading-tight ${isActive ? "" : "text-gray-400"}`}>{sublabel}</span>
              </button>
            );
          })}
        </div>
        {!hasRatings && (
          <p className="text-xs text-gray-400 mt-1.5 text-center">Loading live flow data…</p>
        )}
        {activeFlowFilter && (
          <button
            onClick={() => setActiveFlowFilter(null)}
            className="mt-2 w-full text-xs text-gray-500 hover:text-gray-700 underline text-center"
          >
            Clear filter — show all routes
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="text-blue-600" size={20} />
          <h2 className="text-lg font-semibold text-gray-800">Rivers & Routes</h2>
        </div>
        {visibleRivers.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No routes match the selected flow condition.
          </p>
        ) : (
          <div className="space-y-3">
            {visibleRivers.map((river) => (
              <div key={river.name} className="border-l-4 pl-3 py-2" style={{ borderColor: river.color.replace('bg-', '').replace('-500', '') }}>
                <button
                  onClick={() => setSelectedRiver(river.name)}
                  className={`w-full flex items-center gap-2 mb-2 px-2 rounded transition-colors ${
                    isMobile ? "py-2 min-h-[44px]" : "py-1"
                  } ${
                    selectedRiver === river.name
                      ? 'bg-blue-100 font-bold'
                      : 'hover:bg-gray-100 active:bg-gray-100'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${river.color}`}></div>
                  <h3 className="text-sm text-gray-800">{river.name}</h3>
                </button>
                {river.visibleRoutes.length > 0 && (
                  <ul className="space-y-1 ml-5">
                    {river.visibleRoutes.map((route) => (
                        <li key={route}>
                          <button
                            onClick={() => handleRouteClick(route)}
                            className={`w-full text-left text-xs px-2 rounded transition-colors ${
                              isMobile ? "py-2 min-h-[44px]" : "py-1"
                            } ${
                              selectedRoute === route
                                ? 'bg-blue-50 text-blue-700 font-semibold'
                                : 'text-gray-600 hover:bg-gray-50 active:bg-gray-50'
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
        )}
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
    </>
  );
}

const DISMISS_THRESHOLD = 120;

export default function Sidebar({
  selectedRiver,
  setSelectedRiver,
  selectedRoute,
  setSelectedRoute,
  geoJsonData,
  setSelectedRouteData,
  gaugeRatings,
  isMobile,
  isOpen,
  onClose,
}: SidebarProps) {
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const handleRiverClick = (riverName: string | null) => {
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

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const deltaY = e.touches[0].clientY - touchStartY.current;
    // Only allow dragging downward
    setDragOffset(Math.max(0, deltaY));
  }, []);

  const onTouchEnd = useCallback(() => {
    setIsDragging(false);
    if (dragOffset > DISMISS_THRESHOLD) {
      setDragOffset(0);
      onClose();
    } else {
      setDragOffset(0);
    }
  }, [dragOffset, onClose]);

  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40 backdrop-overlay"
            onClick={onClose}
            aria-hidden="true"
          />
        )}

        {/* Bottom sheet */}
        <div
          ref={sheetRef}
          className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl safe-bottom ${
            isOpen
              ? "translate-y-0"
              : "translate-y-full pointer-events-none"
          }`}
          style={{
            maxHeight: "70vh",
            transform: isOpen
              ? `translateY(${dragOffset}px)`
              : undefined,
            transition: isDragging ? "none" : "transform 0.3s ease-out",
          }}
        >
          {/* Drag handle area — swipe target */}
          <div
            className="sticky top-0 bg-white rounded-t-2xl pt-3 pb-2 px-4 flex items-center justify-between border-b border-gray-100 touch-none select-none"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
            <span className="text-sm font-medium text-gray-500 pt-2">Explore</span>
            <button
              onClick={onClose}
              className="p-2 -mr-2 rounded-full active:bg-gray-100"
              aria-label="Close menu"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <div className="overflow-y-auto p-4" style={{ maxHeight: "calc(70vh - 52px)" }}>
            <SidebarContent
              selectedRiver={selectedRiver}
              setSelectedRiver={handleRiverClick}
              selectedRoute={selectedRoute}
              handleRouteClick={handleRouteClick}
              geoJsonData={geoJsonData}
              gaugeRatings={gaugeRatings}
              isMobile
            />
          </div>
        </div>
      </>
    );
  }

  // Desktop sidebar
  return (
    <div
      className={`relative h-full bg-white shadow-lg transition-all duration-300 ease-in-out z-10 ${
        desktopOpen ? "w-80" : "w-12"
      }`}
    >
      <button
        onClick={() => setDesktopOpen(!desktopOpen)}
        className="absolute -right-3 top-4 bg-blue-600 text-white rounded-full p-1.5 shadow-md hover:bg-blue-700 transition-colors z-20"
        aria-label={desktopOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {desktopOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      {desktopOpen ? (
        <div className="h-full overflow-y-auto p-6">
          <SidebarContent
            selectedRiver={selectedRiver}
            setSelectedRiver={handleRiverClick}
            selectedRoute={selectedRoute}
            handleRouteClick={handleRouteClick}
            geoJsonData={geoJsonData}
            gaugeRatings={gaugeRatings}
            isMobile={false}
          />
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
