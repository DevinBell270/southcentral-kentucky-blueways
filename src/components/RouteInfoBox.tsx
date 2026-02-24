"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { X, TriangleAlert } from "lucide-react";

interface RouteInfoBoxProps {
  route: {
    route_name: string;
    river: string;
    distance_miles: number;
    kdfwr_float_time?: string;
    description?: string;
    hazards?: string;
    usgs_gauge_id?: string;
  };
  onClose: () => void;
  isMobile: boolean;
}

const DISMISS_THRESHOLD = 120;

export default function RouteInfoBox({ route, onClose, isMobile }: RouteInfoBoxProps) {
  const [flowCfs, setFlowCfs] = useState<number | null>(null);
  const [flowLoading, setFlowLoading] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef(0);

  useEffect(() => {
    if (!route.usgs_gauge_id) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    setFlowLoading(true);
    setFlowCfs(null);

    fetch(
      `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${route.usgs_gauge_id}&parameterCd=00060`,
      { signal: controller.signal }
    )
      .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
      })
      .then((data) => {
        try {
          const cfsValue = parseFloat(
            data.value.timeSeries[0].values[0].value[0].value
          );
          setFlowCfs(cfsValue);
        } catch (error) {
          throw new Error("Failed to parse flow data");
        }
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Flow data unavailable:", error);
        }
        setFlowCfs(null);
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setFlowLoading(false);
      });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [route.usgs_gauge_id]);

  const getFlowColorClass = (cfs: number): string => {
    if (cfs <= 300) return "text-green-600 font-bold";
    if (cfs <= 1500) return "text-yellow-600 font-bold";
    return "text-red-600 font-bold";
  };

  const getFlowLabel = (cfs: number): string => {
    if (cfs <= 300) return "Low/Safe";
    if (cfs <= 1500) return "Moderate";
    return "High/Caution";
  };

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

  const shouldShowHazards =
    route.hazards && route.hazards.toLowerCase() !== "none noted.";
  const shouldShowLiveFlow = flowLoading || flowCfs !== null;

  if (!isMobile) {
    return (
      <div className="fixed bottom-4 right-4 bg-white rounded-xl shadow-xl z-50 max-w-sm max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 pr-4">
              <h2 className="text-xl font-bold text-gray-800 mb-1">
                {route.route_name}
              </h2>
              <p className="text-sm text-gray-600">{route.river}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              aria-label="Close route info"
            >
              <X size={20} />
            </button>
          </div>
          <RouteDetails
            route={route}
            flowCfs={flowCfs}
            flowLoading={flowLoading}
            shouldShowLiveFlow={shouldShowLiveFlow}
            shouldShowHazards={shouldShowHazards}
            getFlowColorClass={getFlowColorClass}
            getFlowLabel={getFlowLabel}
            isMobile={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 max-h-[50vh] safe-bottom"
      style={{
        transform: `translateY(${dragOffset}px)`,
        transition: isDragging ? "none" : "transform 0.3s ease-out",
      }}
    >
      {/* Drag handle — swipe target */}
      <div
        className="pt-3 pb-2 px-5 flex items-center justify-between touch-none select-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full absolute left-1/2 -translate-x-1/2 top-2" />
        <div className="flex-1 pr-4 pt-2">
          <h2 className="text-lg font-bold text-gray-800 mb-0.5">
            {route.route_name}
          </h2>
          <p className="text-sm text-gray-600">{route.river}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 -mr-2 text-gray-400 active:text-gray-600 transition-colors flex-shrink-0"
          aria-label="Close route info"
        >
          <X size={24} />
        </button>
      </div>

      <div className="overflow-y-auto px-5 pb-5" style={{ maxHeight: "calc(50vh - 64px)" }}>
        <RouteDetails
          route={route}
          flowCfs={flowCfs}
          flowLoading={flowLoading}
          shouldShowLiveFlow={shouldShowLiveFlow}
          shouldShowHazards={shouldShowHazards}
          getFlowColorClass={getFlowColorClass}
          getFlowLabel={getFlowLabel}
          isMobile
        />
      </div>
    </div>
  );
}

function RouteDetails({
  route,
  flowCfs,
  flowLoading,
  shouldShowLiveFlow,
  shouldShowHazards,
  getFlowColorClass,
  getFlowLabel,
  isMobile,
}: {
  route: RouteInfoBoxProps["route"];
  flowCfs: number | null;
  flowLoading: boolean;
  shouldShowLiveFlow: boolean;
  shouldShowHazards: boolean | "" | undefined;
  getFlowColorClass: (cfs: number) => string;
  getFlowLabel: (cfs: number) => string;
  isMobile: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className={isMobile ? "flex gap-6" : "grid grid-cols-2 gap-4"}>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Distance
          </p>
          <p className="text-lg font-semibold text-gray-800">
            {route.distance_miles} miles
          </p>
        </div>
        {route.kdfwr_float_time && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Float Time
            </p>
            <p className="text-lg font-semibold text-gray-800">
              {route.kdfwr_float_time}
            </p>
          </div>
        )}
      </div>

      {route.usgs_gauge_id && shouldShowLiveFlow && (
        <div className="border-t pt-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
            Live Flow Rate
          </p>
          {flowLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-pulse flex space-x-2">
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
              </div>
              <span className="text-sm text-gray-500">
                Fetching live flow data...
              </span>
            </div>
          ) : flowCfs !== null ? (
            flowCfs > 1500 ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
                <TriangleAlert className="text-red-600 mt-0.5 shrink-0 animate-pulse" size={22} />
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {flowCfs.toFixed(0)} cfs
                  </p>
                  <p className="text-xs font-semibold text-red-700 mt-0.5">
                    High / Caution — dangerous conditions
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <p className={`text-2xl ${getFlowColorClass(flowCfs)}`}>
                  {flowCfs.toFixed(0)} cfs
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {getFlowLabel(flowCfs)}
                </p>
              </div>
            )
          ) : null}
        </div>
      )}

      {route.description && (
        <div className="border-t pt-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
            Description
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {route.description}
          </p>
        </div>
      )}

      {shouldShowHazards && (
        <div className="border-t pt-4">
          <p className="text-xs text-amber-600 uppercase tracking-wide mb-2 font-semibold">
            Hazards
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-900">{route.hazards}</p>
          </div>
        </div>
      )}
    </div>
  );
}
