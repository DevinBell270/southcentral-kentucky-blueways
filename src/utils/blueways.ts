export interface BaseBluewaysProperties extends Record<string, unknown> {
  river: string;
  usgs_gauge_id?: string;
}

export interface RouteProperties extends BaseBluewaysProperties {
  route_name: string;
  distance_miles: number;
  kdfwr_float_time?: string;
  description?: string;
  hazards?: string;
}

export interface PointProperties extends BaseBluewaysProperties {
  name: string;
  warning?: string;
}

type Coordinate = [number, number] | [number, number, number];

interface PointGeometry {
  type: "Point";
  coordinates: Coordinate;
}

interface LineStringGeometry {
  type: "LineString";
  coordinates: Coordinate[];
}

interface BluewaysFeatureBase<TGeometry, TProperties> {
  type: "Feature";
  geometry: TGeometry;
  properties: TProperties;
}

export type BluewaysPointFeature = BluewaysFeatureBase<PointGeometry, PointProperties>;
export type BluewaysRouteFeature = BluewaysFeatureBase<LineStringGeometry, RouteProperties>;
export type BluewaysFeature = BluewaysPointFeature | BluewaysRouteFeature;

export interface BluewaysFeatureCollection {
  type: "FeatureCollection";
  features: BluewaysFeature[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isPointProperties(value: unknown): value is PointProperties {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    typeof value.river === "string"
  );
}

export function isRouteProperties(value: unknown): value is RouteProperties {
  return (
    isRecord(value) &&
    typeof value.route_name === "string" &&
    typeof value.river === "string" &&
    typeof value.distance_miles === "number"
  );
}

export function isPointFeature(feature: BluewaysFeature): feature is BluewaysPointFeature {
  return feature.geometry.type === "Point";
}

export function isRouteFeature(feature: BluewaysFeature): feature is BluewaysRouteFeature {
  return feature.geometry.type === "LineString";
}
