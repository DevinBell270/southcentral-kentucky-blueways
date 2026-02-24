"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { X, TriangleAlert, ArrowRight, ArrowLeft, Navigation } from "lucide-react";

interface PointProperties {
  name: string;
  river: string;
  warning?: string;
}

interface RouteProperties {
  route_name: string;
  river: string;
  distance_miles: number;
  kdfwr_float_time?: string;
  usgs_gauge_id?: string;
}

interface LocationInfoBoxProps {
  point: PointProperties;
  geoJsonData: any;
  onRouteSelect: (properties: RouteProperties) => void;
  onClose: () => void;
  isMobile: boolean;
}

const RIVER_COLORS: Record<string, string> = {
  "Green River": "bg-green-100 text-green-800 border-green-200",
  "Drakes Creek": "bg-blue-100 text-blue-800 border-blue-200",
  "Barren River": "bg-purple-100 text-purple-800 border-purple-200",
  "West Fork of Drakes Creek": "bg-pink-100 text-pink-800 border-pink-200",
  "Middle Fork of Drakes Creek": "bg-amber-100 text-amber-800 border-amber-200",
  "Bays Fork": "bg-teal-100 text-teal-800 border-teal-200",
  "Trammel Fork of Drakes Creek": "bg-red-100 text-red-800 border-red-200",
  "Gasper River": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Clear Fork of Gasper River": "bg-violet-100 text-violet-800 border-violet-200",
};

const DISMISS_THRESHOLD = 120;

function getPartnerName(routeName: string, pointName: string, role: "put-in" | "take-out"): string {
  const separator = " to ";
  const idx = routeName.indexOf(separator);
  if (idx === -1) return routeName;
  if (role === "put-in") {
    return routeName.slice(idx + separator.length);
  } else {
    return routeName.slice(0, idx);
  }
}

function getAdjacentRoutes(pointName: string, features: any[]): { putInRoutes: RouteProperties[]; takeOutRoutes: RouteProperties[] } {
  const lines = features.filter((f: any) => f.geometry.type === "LineString");
  const putInRoutes = lines
    .filter((f: any) => f.properties.route_name.startsWith(pointName + " to "))
    .map((f: any) => f.properties as RouteProperties);
  const takeOutRoutes = lines
    .filter((f: any) => f.properties.route_name.endsWith(" to " + pointName))
    .map((f: any) => f.properties as RouteProperties);
  return { putInRoutes, takeOutRoutes };
}

function FlowDisplay({ gaugeId }: { gaugeId: string }) {
  const [flowCfs, setFlowCfs] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    fetch(
      `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${gaugeId}&parameterCd=00060`,
      { signal: controller.signal }
    )
      .then((r) => {
        if (!r.ok) throw new Error("Network error");
        return r.json();
      })
      .then((data) => {
        const val = parseFloat(data.value.timeSeries[0].values[0].value[0].value);
        setFlowCfs(val);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setFlowCfs(null);
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setLoading(false);
      });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [gaugeId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="animate-pulse h-4 w-20 bg-gray-200 rounded" />
        <span>Fetching live flow…</span>
      </div>
    );
  }

  if (flowCfs === null) return null;

  if (flowCfs > 1500) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
        <TriangleAlert className="text-red-600 mt-0.5 shrink-0 animate-pulse" size={20} />
        <div>
          <p className="text-xl font-bold text-red-600">{flowCfs.toFixed(0)} cfs</p>
          <p className="text-xs font-semibold text-red-700 mt-0.5">High / Caution — dangerous conditions</p>
        </div>
      </div>
    );
  }

  const colorClass = flowCfs <= 300 ? "text-green-600" : "text-yellow-600";
  const label = flowCfs <= 300 ? "Low / Safe" : "Moderate";

  return (
    <div>
      <p className={`text-xl font-bold ${colorClass}`}>{flowCfs.toFixed(0)} cfs</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function RouteRow({
  route,
  pointName,
  role,
  onSelect,
}: {
  route: RouteProperties;
  pointName: string;
  role: "put-in" | "take-out";
  onSelect: (r: RouteProperties) => void;
}) {
  const partner = getPartnerName(route.route_name, pointName, role);

  return (
    <button
      onClick={() => onSelect(route)}
      className="w-full text-left group rounded-lg border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 active:bg-blue-100 transition-colors p-3"
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5 shrink-0">
          {role === "put-in" ? (
            <ArrowRight size={14} className="text-blue-500" />
          ) : (
            <ArrowLeft size={14} className="text-indigo-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 group-hover:text-blue-800 leading-snug truncate">
            {partner}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-gray-500">{route.distance_miles} mi</span>
            {route.kdfwr_float_time && (
              <span className="text-xs text-gray-500">{route.kdfwr_float_time}</span>
            )}
          </div>
        </div>
        <span className="text-xs text-blue-600 group-hover:text-blue-800 font-medium shrink-0 mt-0.5">
          View
        </span>
      </div>
    </button>
  );
}

function LocationContent({
  point,
  putInRoutes,
  takeOutRoutes,
  gaugeId,
  onRouteSelect,
  onClose,
}: {
  point: PointProperties;
  putInRoutes: RouteProperties[];
  takeOutRoutes: RouteProperties[];
  gaugeId: string | undefined;
  onRouteSelect: (r: RouteProperties) => void;
  onClose: () => void;
}) {
  const riverBadgeClass = RIVER_COLORS[point.river] ?? "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <div className="space-y-4">
      {/* Warning */}
      {point.warning && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
          <TriangleAlert size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-900">{point.warning}</p>
        </div>
      )}

      {/* Live flow */}
      {gaugeId && (
        <div className="border-t pt-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Live Flow Rate</p>
          <FlowDisplay gaugeId={gaugeId} />
        </div>
      )}

      {/* Put-in routes */}
      {putInRoutes.length > 0 && (
        <div className="border-t pt-4">
          <div className="flex items-center gap-1.5 mb-2">
            <ArrowRight size={14} className="text-blue-500" />
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
              Put-In Here
            </p>
            <span className="ml-auto text-xs text-gray-400">{putInRoutes.length} route{putInRoutes.length > 1 ? "s" : ""}</span>
          </div>
          <div className="space-y-2">
            {putInRoutes.map((r) => (
              <RouteRow
                key={r.route_name}
                route={r}
                pointName={point.name}
                role="put-in"
                onSelect={(r) => { onRouteSelect(r); onClose(); }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Take-out routes */}
      {takeOutRoutes.length > 0 && (
        <div className="border-t pt-4">
          <div className="flex items-center gap-1.5 mb-2">
            <ArrowLeft size={14} className="text-indigo-500" />
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
              Take-Out Here
            </p>
            <span className="ml-auto text-xs text-gray-400">{takeOutRoutes.length} route{takeOutRoutes.length > 1 ? "s" : ""}</span>
          </div>
          <div className="space-y-2">
            {takeOutRoutes.map((r) => (
              <RouteRow
                key={r.route_name}
                route={r}
                pointName={point.name}
                role="take-out"
                onSelect={(r) => { onRouteSelect(r); onClose(); }}
              />
            ))}
          </div>
        </div>
      )}

      {putInRoutes.length === 0 && takeOutRoutes.length === 0 && (
        <div className="border-t pt-4">
          <p className="text-sm text-gray-500 italic">No routes found for this location.</p>
        </div>
      )}
    </div>
  );
}

export default function LocationInfoBox({
  point,
  geoJsonData,
  onRouteSelect,
  onClose,
  isMobile,
}: LocationInfoBoxProps) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef(0);

  const { putInRoutes, takeOutRoutes } = geoJsonData?.features
    ? getAdjacentRoutes(point.name, geoJsonData.features)
    : { putInRoutes: [], takeOutRoutes: [] };

  const allAdjacentRoutes = [...putInRoutes, ...takeOutRoutes];
  const gaugeId = allAdjacentRoutes.find((r) => r.usgs_gauge_id)?.usgs_gauge_id;

  const riverBadgeClass = RIVER_COLORS[point.river] ?? "bg-gray-100 text-gray-700 border-gray-200";

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const deltaY = e.touches[0].clientY - touchStartY.current;
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

  if (!isMobile) {
    return (
      <div className="fixed bottom-4 right-4 bg-white rounded-xl shadow-xl z-50 w-80 max-h-[80vh] overflow-y-auto">
        <div className="p-5">
          {/* Header */}
          <div className="flex justify-between items-start mb-1">
            <div className="flex-1 pr-3">
              <div className="flex items-center gap-2 mb-1">
                <Navigation size={14} className="text-gray-400 shrink-0" />
                <p className="text-xs text-gray-500 uppercase tracking-wide">Access Point</p>
              </div>
              <h2 className="text-lg font-bold text-gray-900 leading-snug">{point.name}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 mt-1"
              aria-label="Close location info"
            >
              <X size={18} />
            </button>
          </div>
          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border mb-4 ${riverBadgeClass}`}>
            {point.river}
          </span>

          <LocationContent
            point={point}
            putInRoutes={putInRoutes}
            takeOutRoutes={takeOutRoutes}
            gaugeId={gaugeId}
            onRouteSelect={onRouteSelect}
            onClose={onClose}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 max-h-[60vh] safe-bottom"
      style={{
        transform: `translateY(${dragOffset}px)`,
        transition: isDragging ? "none" : "transform 0.3s ease-out",
      }}
    >
      {/* Drag handle */}
      <div
        className="pt-3 pb-2 px-5 flex items-center justify-between touch-none select-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full absolute left-1/2 -translate-x-1/2 top-2" />
        <div className="flex-1 pr-4 pt-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Navigation size={12} className="text-gray-400 shrink-0" />
            <p className="text-xs text-gray-500 uppercase tracking-wide">Access Point</p>
          </div>
          <h2 className="text-base font-bold text-gray-900 leading-snug">{point.name}</h2>
          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border mt-1 ${riverBadgeClass}`}>
            {point.river}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 -mr-2 text-gray-400 active:text-gray-600 transition-colors flex-shrink-0"
          aria-label="Close location info"
        >
          <X size={22} />
        </button>
      </div>

      <div className="overflow-y-auto px-5 pb-5" style={{ maxHeight: "calc(60vh - 80px)" }}>
        <LocationContent
          point={point}
          putInRoutes={putInRoutes}
          takeOutRoutes={takeOutRoutes}
          gaugeId={gaugeId}
          onRouteSelect={onRouteSelect}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
