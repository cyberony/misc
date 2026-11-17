'use strict';

// Run with: node qibla-finder/tests/geo.test.js

const assert = require('node:assert/strict');
const geo = require('../geo.js');
const { declination } = require('../declination.js');

const near = (actual, expected, tolerance, label) =>
  assert.ok(
    Math.abs(geo.angleDiff(actual, expected)) <= tolerance,
    `${label}: expected ${expected} ± ${tolerance}, got ${actual.toFixed(3)}`
  );

// Qibla bearings, degrees clockwise from true north.
const bearings = [
  ['New York', 40.7128, -74.006, 58.5],
  ['London', 51.5074, -0.1278, 119.0],
  ['Jakarta', -6.2088, 106.8456, 295.2],
  ['Cairo', 30.0444, 31.2357, 136.1],
  ['Istanbul', 41.0082, 28.9784, 151.6],
  ['Tokyo', 35.6762, 139.6503, 293.0],
  ['Sydney', -33.8688, 151.2093, 277.5],
  ['Cape Town', -33.9249, 18.4241, 23.4],
];
for (const [name, lat, lon, expected] of bearings) {
  near(geo.bearing(lat, lon), expected, 0.3, `bearing from ${name}`);
}

// Great-circle distances to the Kaaba, km.
const distances = [
  ['New York', 40.7128, -74.006, 10306],
  ['London', 51.5074, -0.1278, 4795],
  ['Jakarta', -6.2088, 106.8456, 7918],
];
for (const [name, lat, lon, expected] of distances) {
  const d = geo.distanceKm(lat, lon);
  assert.ok(Math.abs(d - expected) / expected < 0.005, `distance from ${name}: expected ~${expected}, got ${d.toFixed(0)}`);
}
assert.ok(geo.distanceKm(geo.KAABA.lat, geo.KAABA.lon) < 1e-6);

assert.equal(geo.angleDiff(10, 350), 20);
assert.equal(geo.angleDiff(350, 10), -20);
assert.equal(geo.angleDiff(180, 0), 180);
assert.equal(geo.compassPoint(58.5).abbr, 'ENE');
assert.equal(geo.compassPoint(359).abbr, 'N');
assert.equal(geo.compassPoint(295).name, 'west-northwest');
assert.equal(geo.formatCoords(40.7128, -74.006), '40.71° N, 74.01° W');
assert.ok(geo.isValidCoord(-90, 180));
assert.ok(!geo.isValidCoord(91, 0));
assert.ok(!geo.isValidCoord(NaN, 0));

// Official WMM2025 test values (NOAA WMM2025_TestValues.txt):
// decimal year, altitude km, geodetic latitude, longitude, declination.
const wmm = [
  [2025.0, 28, 89, -121, -99.77],
  [2025.0, 48, 80, -96, -29.91],
  [2025.0, 54, 82, 87, 54.89],
  [2025.0, 65, 43, 93, 0.5],
  [2025.0, 51, -33, 109, -5.49],
  [2025.0, 39, -59, -8, -15.75],
  [2025.0, 3, -50, -103, 27.96],
  [2025.0, 94, -29, -110, 15.74],
  [2025.0, 66, 14, 143, -0.19],
  [2025.0, 18, 0, 21, 1.29],
  [2025.5, 6, -36, -137, 20.28],
  [2025.5, 63, 26, 81, 0.51],
  [2025.5, 69, 38, -144, 12.93],
  [2025.5, 50, -70, -133, 57.21],
];
for (const [year, alt, lat, lon, expected] of wmm) {
  near(declination(lat, lon, year, alt), expected, 0.01, `declination at ${lat}, ${lon} (${year})`);
}

console.log('All geo checks passed.');
