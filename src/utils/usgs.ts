export interface UsgsTimeSeriesEntry {
  sourceInfo?: {
    siteCode?: Array<{
      value?: string;
    }>;
  };
  values?: Array<{
    value?: Array<{
      value?: string;
    }>;
  }>;
}

export interface UsgsInstantValuesResponse {
  value?: {
    timeSeries?: UsgsTimeSeriesEntry[];
  };
}

export function getSiteCode(series: UsgsTimeSeriesEntry): string | undefined {
  return series.sourceInfo?.siteCode?.[0]?.value;
}

export function getSeriesFlowCfs(series: UsgsTimeSeriesEntry): number | null {
  const rawValue = series.values?.[0]?.value?.[0]?.value;
  if (rawValue === undefined) {
    return null;
  }

  const parsedValue = Number.parseFloat(rawValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

export function getFirstFlowCfs(data: UsgsInstantValuesResponse): number | null {
  const firstSeries = data.value?.timeSeries?.[0];
  return firstSeries ? getSeriesFlowCfs(firstSeries) : null;
}
