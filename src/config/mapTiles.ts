import type { TileLayerProps } from "react-leaflet";

const FALLBACK_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const FALLBACK_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

function parseOptionalNumber(value: string | undefined) {
  if (!value) return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseSubdomains(value: string | undefined) {
  if (!value) return undefined;

  const subdomains = value
    .split(",")
    .map((subdomain) => subdomain.trim())
    .filter(Boolean);

  return subdomains.length > 0 ? subdomains : undefined;
}

export function getMapTileLayerProps(): Pick<
  TileLayerProps,
  "attribution" | "url" | "maxZoom" | "subdomains" | "crossOrigin"
> {
  const customUrl = process.env.NEXT_PUBLIC_TILE_URL?.trim();
  const customAttribution = process.env.NEXT_PUBLIC_TILE_ATTRIBUTION?.trim();
  const customMaxZoom = parseOptionalNumber(process.env.NEXT_PUBLIC_TILE_MAX_ZOOM);
  const customSubdomains = parseSubdomains(process.env.NEXT_PUBLIC_TILE_SUBDOMAINS);
  const mapTilerApiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY?.trim();

  if (customUrl) {
    return {
      attribution: customAttribution || FALLBACK_ATTRIBUTION,
      url: customUrl,
      maxZoom: customMaxZoom,
      subdomains: customSubdomains,
    };
  }

  if (mapTilerApiKey) {
    return {
      attribution:
        '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank" rel="noopener noreferrer">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      url: `https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.webp?key=${encodeURIComponent(
        mapTilerApiKey
      )}`,
      maxZoom: 20,
      crossOrigin: true,
    };
  }

  return {
    attribution: FALLBACK_ATTRIBUTION,
    url: FALLBACK_URL,
    maxZoom: 19,
    subdomains: ["a", "b", "c"],
  };
}
