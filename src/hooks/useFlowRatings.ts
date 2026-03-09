"use client";

import { useEffect, useMemo, useState } from "react";
import type { BluewaysFeatureCollection } from "@/utils/blueways";
import { getSeriesFlowCfs, getSiteCode, type UsgsInstantValuesResponse } from "@/utils/usgs";

export type FlowRating = "green" | "yellow" | "red";

function classifyFlow(cfs: number): FlowRating {
  if (cfs <= 300) return "green";
  if (cfs <= 1500) return "yellow";
  return "red";
}

export function useFlowRatings(geoJsonData: BluewaysFeatureCollection | null): {
  gaugeRatings: Record<string, FlowRating>;
  loading: boolean;
} {
  const gaugeIds = useMemo(() => {
    if (!geoJsonData?.features) {
      return [];
    }

    return Array.from(
      new Set(
        geoJsonData.features
          .map((feature) => feature.properties.usgs_gauge_id)
          .filter((gaugeId): gaugeId is string => Boolean(gaugeId))
      )
    );
  }, [geoJsonData]);

  const requestKey = gaugeIds.join(",");
  const [gaugeRatings, setGaugeRatings] = useState<Record<string, FlowRating>>({});
  const [resolvedKey, setResolvedKey] = useState("");

  useEffect(() => {
    if (!requestKey) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    fetch(
      `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${requestKey}&parameterCd=00060`,
      { signal: controller.signal }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json() as Promise<UsgsInstantValuesResponse>;
      })
      .then((data) => {
        const ratings: Record<string, FlowRating> = {};
        const timeSeries = data.value?.timeSeries ?? [];

        for (const series of timeSeries) {
          const siteCode = getSiteCode(series);
          const cfs = getSeriesFlowCfs(series);

          if (siteCode && cfs !== null) {
            ratings[siteCode] = classifyFlow(cfs);
          }
        }

        setGaugeRatings(ratings);
        setResolvedKey(requestKey);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Flow ratings fetch failed:", err);
        }
        setGaugeRatings({});
        setResolvedKey(requestKey);
      })
      .finally(() => {
        clearTimeout(timeoutId);
      });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [requestKey]);

  return {
    gaugeRatings: resolvedKey === requestKey ? gaugeRatings : {},
    loading: requestKey.length > 0 && resolvedKey !== requestKey,
  };
}
