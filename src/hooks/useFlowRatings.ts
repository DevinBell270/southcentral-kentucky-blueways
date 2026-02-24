"use client";

import { useEffect, useState } from "react";

export type FlowRating = "green" | "yellow" | "red";

function classifyFlow(cfs: number): FlowRating {
  if (cfs <= 300) return "green";
  if (cfs <= 1500) return "yellow";
  return "red";
}

export function useFlowRatings(geoJsonData: any): {
  gaugeRatings: Record<string, FlowRating>;
  loading: boolean;
} {
  const [gaugeRatings, setGaugeRatings] = useState<Record<string, FlowRating>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!geoJsonData?.features) return;

    const gaugeIds = Array.from(
      new Set(
        geoJsonData.features
          .map((f: any) => f.properties?.usgs_gauge_id)
          .filter(Boolean)
      )
    ) as string[];

    if (gaugeIds.length === 0) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    setLoading(true);

    fetch(
      `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${gaugeIds.join(",")}&parameterCd=00060`,
      { signal: controller.signal }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        const ratings: Record<string, FlowRating> = {};
        const timeSeries: any[] = data?.value?.timeSeries ?? [];

        for (const series of timeSeries) {
          const siteCode = series?.sourceInfo?.siteCode?.[0]?.value;
          const rawValue = series?.values?.[0]?.value?.[0]?.value;
          if (siteCode && rawValue !== undefined) {
            const cfs = parseFloat(rawValue);
            if (!isNaN(cfs)) {
              ratings[siteCode] = classifyFlow(cfs);
            }
          }
        }

        setGaugeRatings(ratings);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Flow ratings fetch failed:", err);
        }
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setLoading(false);
      });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [geoJsonData]);

  return { gaugeRatings, loading };
}
