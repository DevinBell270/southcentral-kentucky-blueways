#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as turf from '@turf/turf';
import osmtogeojson from 'osmtogeojson';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GEOJSON_PATH = path.join(__dirname, '../public/blueways.geojson');
const BACKUP_PATH = path.join(__dirname, '../public/blueways.geojson.backup');

const OVERPASS_SERVERS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter'
];

console.log('🌊 Waterway Route Tracing Script\n');

async function fetchWithTimeout(url, options, timeout = 45000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

async function fetchWaterwaysFromOSM(bbox) {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  
  const query = `
[out:json][timeout:90];
(
  way["waterway"~"river|stream|canal"](${minLat},${minLng},${maxLat},${maxLng});
);
out body;
>;
out skel qt;
  `.trim();

  console.log(`📡 Querying Overpass API for waterways in bbox: [${bbox.map(n => n.toFixed(4)).join(', ')}]`);
  
  for (let i = 0; i < OVERPASS_SERVERS.length; i++) {
    const server = OVERPASS_SERVERS[i];
    console.log(`   Trying server ${i + 1}/${OVERPASS_SERVERS.length}: ${server}`);
    
    try {
      const response = await fetchWithTimeout(server, {
        method: 'POST',
        body: query,
        headers: { 'Content-Type': 'text/plain' }
      }, 45000);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const osmData = await response.json();
      console.log(`   ✅ Received ${osmData.elements?.length || 0} OSM elements`);
      
      const geojson = osmtogeojson(osmData);
      console.log(`   ✅ Converted to ${geojson.features?.length || 0} GeoJSON features\n`);
      
      return geojson;
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      
      if (i === OVERPASS_SERVERS.length - 1) {
        throw new Error(`All Overpass servers failed. Last error: ${error.message}`);
      }
      
      console.log(`   ⏳ Waiting 2 seconds before trying next server...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

function computeBoundingBox(features) {
  const accessPoints = features.filter(f => f.properties.type === 'Access Point');
  const coords = accessPoints.map(f => f.geometry.coordinates);
  
  const lngs = coords.map(c => c[0]);
  const lats = coords.map(c => c[1]);
  
  const buffer = 0.05;
  return [
    Math.min(...lngs) - buffer,
    Math.min(...lats) - buffer,
    Math.max(...lngs) + buffer,
    Math.max(...lats) + buffer
  ];
}

function normalizeRiverName(name) {
  if (!name) return '';
  return name.toLowerCase().trim()
    .replace(/\s+/g, ' ')
    .replace(/\briver\b/i, '')
    .replace(/\bcreek\b/i, '')
    .replace(/\bfork\b/i, '')
    .trim();
}

function groupWaterwaysByName(osmGeojson) {
  const waterwaysByName = new Map();
  
  for (const feature of osmGeojson.features) {
    if (feature.geometry?.type !== 'LineString') continue;
    
    const name = feature.properties?.name;
    if (!name) continue;
    
    const normalized = normalizeRiverName(name);
    if (!normalized) continue;
    
    if (!waterwaysByName.has(normalized)) {
      waterwaysByName.set(normalized, []);
    }
    waterwaysByName.get(normalized).push(feature);
  }
  
  console.log(`📊 Found ${waterwaysByName.size} named waterways:`);
  for (const [name, features] of waterwaysByName) {
    console.log(`   - "${name}": ${features.length} segments`);
  }
  console.log();
  
  return waterwaysByName;
}

function mergeWaterwaySegments(segments) {
  if (segments.length === 0) return null;
  if (segments.length === 1) return segments[0];
  
  try {
    const allCoords = [];
    for (const segment of segments) {
      allCoords.push(...segment.geometry.coordinates);
    }
    
    const uniqueCoords = [];
    const seen = new Set();
    for (const coord of allCoords) {
      const key = `${coord[0]},${coord[1]}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueCoords.push(coord);
      }
    }
    
    return turf.lineString(uniqueCoords);
  } catch (error) {
    console.warn(`   ⚠️  Could not merge segments: ${error.message}`);
    return turf.combine(turf.featureCollection(segments)).features[0] || segments[0];
  }
}

function matchRiverToWaterway(riverName, waterwaysByName) {
  const normalized = normalizeRiverName(riverName);
  
  if (waterwaysByName.has(normalized)) {
    return waterwaysByName.get(normalized);
  }
  
  for (const [name, segments] of waterwaysByName) {
    if (name.includes(normalized) || normalized.includes(name)) {
      return segments;
    }
  }
  
  return null;
}

function findNearestPointOnWaterway(point, waterway, maxDistance = 1.0) {
  try {
    const snapped = turf.nearestPointOnLine(waterway, point);
    
    const distance = turf.distance(point, snapped, { units: 'kilometers' });
    if (distance > maxDistance) {
      console.log(`   ⚠️  Point is ${(distance * 1000).toFixed(0)}m from waterway (max: ${(maxDistance * 1000).toFixed(0)}m)`);
      return null;
    }
    
    return snapped;
  } catch (error) {
    return null;
  }
}

function extractPathSegment(waterway, startPoint, endPoint) {
  try {
    const sliced = turf.lineSlice(startPoint, endPoint, waterway);
    
    if (!sliced || !sliced.geometry || sliced.geometry.coordinates.length < 2) {
      return null;
    }
    
    return sliced.geometry.coordinates;
  } catch (error) {
    console.warn(`   ⚠️  Could not slice waterway: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log(`📖 Reading ${GEOJSON_PATH}...`);
  const geojsonData = JSON.parse(fs.readFileSync(GEOJSON_PATH, 'utf8'));
  
  console.log(`📦 Backing up to ${path.basename(BACKUP_PATH)}...`);
  fs.writeFileSync(BACKUP_PATH, JSON.stringify(geojsonData, null, 2));
  
  const bbox = computeBoundingBox(geojsonData.features);
  console.log(`📐 Computed bounding box: [${bbox.map(n => n.toFixed(4)).join(', ')}]\n`);
  
  const osmGeojson = await fetchWaterwaysFromOSM(bbox);
  const waterwaysByName = groupWaterwaysByName(osmGeojson);
  
  const routes = geojsonData.features.filter(f => f.properties.type === 'Route');
  console.log(`🛤️  Processing ${routes.length} routes...\n`);
  
  let updatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  
  for (const route of routes) {
    const routeName = route.properties.route_name;
    const riverName = route.properties.river;
    const coords = route.geometry.coordinates;
    
    console.log(`\n🔍 ${routeName}`);
    console.log(`   River: ${riverName}`);
    console.log(`   Current coords: ${coords.length} points`);
    
    if (coords.length > 2) {
      console.log(`   ⏭️  Skipping (already traced)`);
      skippedCount++;
      continue;
    }
    
    const waterwaySegments = matchRiverToWaterway(riverName, waterwaysByName);
    if (!waterwaySegments || waterwaySegments.length === 0) {
      console.log(`   ❌ No matching waterway found in OSM`);
      failedCount++;
      continue;
    }
    
    console.log(`   ✓ Matched to waterway with ${waterwaySegments.length} segments`);
    
    const mergedWaterway = mergeWaterwaySegments(waterwaySegments);
    if (!mergedWaterway) {
      console.log(`   ❌ Could not merge waterway segments`);
      failedCount++;
      continue;
    }
    
    const startCoord = coords[0];
    const endCoord = coords[coords.length - 1];
    
    const startPoint = turf.point(startCoord);
    const endPoint = turf.point(endCoord);
    
    const snappedStart = findNearestPointOnWaterway(startPoint, mergedWaterway);
    const snappedEnd = findNearestPointOnWaterway(endPoint, mergedWaterway);
    
    if (!snappedStart || !snappedEnd) {
      console.log(`   ❌ Could not snap points to waterway (too far away)`);
      failedCount++;
      continue;
    }
    
    const pathCoords = extractPathSegment(mergedWaterway, snappedStart, snappedEnd);
    
    if (!pathCoords || pathCoords.length < 2) {
      console.log(`   ❌ Could not extract path segment`);
      failedCount++;
      continue;
    }
    
    route.geometry.coordinates = pathCoords;
    updatedCount++;
    console.log(`   ✅ Updated with ${pathCoords.length} points`);
  }
  
  console.log(`\n\n📊 Results:`);
  console.log(`   ✅ Updated: ${updatedCount} routes`);
  console.log(`   ⏭️  Skipped: ${skippedCount} routes (already traced)`);
  console.log(`   ❌ Failed: ${failedCount} routes (no match or snap error)`);
  
  if (updatedCount > 0) {
    console.log(`\n💾 Writing updated GeoJSON to ${path.basename(GEOJSON_PATH)}...`);
    fs.writeFileSync(GEOJSON_PATH, JSON.stringify(geojsonData, null, 2));
    console.log('✅ Done!\n');
  } else {
    console.log(`\n⚠️  No routes were updated. Original file unchanged.\n`);
  }
}

main().catch(error => {
  console.error(`\n❌ Fatal error: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
