"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

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
}

export default function RouteInfoBox({ route, onClose }: RouteInfoBoxProps) {
  const [flowCfs, setFlowCfs] = useState<number | null>(null);
  const [flowLoading, setFlowLoading] = useState<boolean>(false);

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
        // Hide live flow section on timeout or API failure.
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

  const shouldShowHazards =
    route.hazards && route.hazards.toLowerCase() !== "none noted.";
  const shouldShowLiveFlow = flowLoading || flowCfs !== null;

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

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <p className={`text-2xl ${getFlowColorClass(flowCfs)}`}>
                    {flowCfs.toFixed(0)} cfs
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {getFlowLabel(flowCfs)}
                  </p>
                </div>
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
      </div>
    </div>
  );
}
