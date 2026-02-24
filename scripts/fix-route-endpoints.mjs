#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GEOJSON_PATH = path.join(__dirname, '../public/blueways.geojson');
const BACKUP_PATH = path.join(__dirname, '../public/blueways.geojson.backup');

console.log('🔧 Route Endpoint Alignment Fix Script\n');

/**
 * Calculate distance between two coordinates in meters
 */
function distance(coord1, coord2) {
  const [lng1, lat1] = coord1;
  const [lng2, lat2] = coord2;
  
  const dx = (lng1 - lng2) * Math.cos((lat1 + lat2) / 2 * Math.PI / 180) * 111.32;
  const dy = (lat1 - lat2) * 111.32;
  
  return Math.sqrt(dx * dx + dy * dy) * 1000; // meters
}

/**
 * Fuzzy match a name to access points
 */
function findAccessPoint(name, accessPoints) {
  // Try exact match first (case-insensitive)
  const exactMatch = accessPoints.find(p => 
    p.properties.name.toLowerCase() === name.toLowerCase()
  );
  if (exactMatch) return exactMatch;
  
  // Try substring match
  const substringMatch = accessPoints.find(p => 
    p.properties.name.toLowerCase().includes(name.toLowerCase()) ||
    name.toLowerCase().includes(p.properties.name.toLowerCase())
  );
  if (substringMatch) return substringMatch;
  
  // Try matching after removing common suffixes/prefixes
  const cleanName = name.replace(/\(private\)/i, '').trim();
  const cleanMatch = accessPoints.find(p => {
    const cleanPointName = p.properties.name.replace(/\(private\)/i, '').trim();
    return cleanPointName.toLowerCase() === cleanName.toLowerCase() ||
           cleanPointName.toLowerCase().includes(cleanName.toLowerCase()) ||
           cleanName.toLowerCase().includes(cleanPointName.toLowerCase());
  });
  
  return cleanMatch || null;
}

async function main() {
  console.log(`📖 Reading ${GEOJSON_PATH}...`);
  const geojsonData = JSON.parse(fs.readFileSync(GEOJSON_PATH, 'utf8'));
  
  console.log(`📦 Backing up to ${path.basename(BACKUP_PATH)}...`);
  fs.writeFileSync(BACKUP_PATH, JSON.stringify(geojsonData, null, 2));
  
  // Extract access points and routes
  const accessPoints = geojsonData.features.filter(f => 
    f.geometry.type === 'Point' && f.properties.type === 'Access Point'
  );
  const routes = geojsonData.features.filter(f => 
    f.geometry.type === 'LineString' && f.properties.type === 'Route'
  );
  
  console.log(`\n📍 Found ${accessPoints.length} access points`);
  console.log(`🛤️  Found ${routes.length} routes\n`);
  
  let fixedCount = 0;
  let reversedCount = 0;
  let errorCount = 0;
  
  for (const route of routes) {
    const routeName = route.properties.route_name;
    const coords = route.geometry.coordinates;
    
    console.log(`\n🔍 Processing: ${routeName}`);
    console.log(`   Current: ${coords.length} coordinates`);
    
    // Parse route name to extract "from" and "to"
    const parts = routeName.split(' to ');
    if (parts.length < 2) {
      console.log(`   ⚠️  Cannot parse route name (expected "A to B" format)`);
      errorCount++;
      continue;
    }
    
    const fromName = parts[0].trim();
    const toName = parts.slice(1).join(' to ').trim();
    
    // Find matching access points
    const fromPoint = findAccessPoint(fromName, accessPoints);
    const toPoint = findAccessPoint(toName, accessPoints);
    
    if (!fromPoint) {
      console.log(`   ❌ Cannot find access point for: "${fromName}"`);
      errorCount++;
      continue;
    }
    
    if (!toPoint) {
      console.log(`   ❌ Cannot find access point for: "${toName}"`);
      errorCount++;
      continue;
    }
    
    console.log(`   ✓ Matched from: ${fromPoint.properties.name}`);
    console.log(`   ✓ Matched to: ${toPoint.properties.name}`);
    
    const fromCoord = fromPoint.geometry.coordinates;
    const toCoord = toPoint.geometry.coordinates;
    
    const startCoord = coords[0];
    const endCoord = coords[coords.length - 1];
    
    // Check if route needs to be reversed
    const startToFrom = distance(startCoord, fromCoord);
    const startToTo = distance(startCoord, toCoord);
    const endToFrom = distance(endCoord, fromCoord);
    const endToTo = distance(endCoord, toCoord);
    
    let needsReverse = false;
    
    // If start is closer to "to" point and end is closer to "from" point, reverse it
    if (startToTo < startToFrom && endToFrom < endToTo) {
      console.log(`   🔄 REVERSING: start is ${startToTo.toFixed(0)}m from TO (should be FROM)`);
      coords.reverse();
      needsReverse = true;
      reversedCount++;
    }
    
    // Now snap endpoints to exact access point coordinates
    const newStartCoord = fromCoord;
    const newEndCoord = toCoord;
    
    const oldStartDist = distance(coords[0], newStartCoord);
    const oldEndDist = distance(coords[coords.length - 1], newEndCoord);
    
    coords[0] = newStartCoord;
    coords[coords.length - 1] = newEndCoord;
    
    console.log(`   ✅ Snapped start: ${oldStartDist.toFixed(1)}m → 0m`);
    console.log(`   ✅ Snapped end: ${oldEndDist.toFixed(1)}m → 0m`);
    
    fixedCount++;
  }
  
  console.log(`\n\n📊 Summary:`);
  console.log(`   ✅ Fixed: ${fixedCount} routes`);
  console.log(`   🔄 Reversed: ${reversedCount} routes`);
  console.log(`   ❌ Errors: ${errorCount} routes`);
  
  if (fixedCount > 0) {
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
