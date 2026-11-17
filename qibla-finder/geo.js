(function (root) {
  'use strict';

  const KAABA = { lat: 21.4225, lon: 39.8262 };
  const EARTH_RADIUS_KM = 6371.0088;
  const KM_PER_MILE = 1.609344;

  const POINTS = [
    ['N', 'north'], ['NNE', 'north-northeast'], ['NE', 'northeast'], ['ENE', 'east-northeast'],
    ['E', 'east'], ['ESE', 'east-southeast'], ['SE', 'southeast'], ['SSE', 'south-southeast'],
    ['S', 'south'], ['SSW', 'south-southwest'], ['SW', 'southwest'], ['WSW', 'west-southwest'],
    ['W', 'west'], ['WNW', 'west-northwest'], ['NW', 'northwest'], ['NNW', 'north-northwest'],
  ];

  const rad = (d) => (d * Math.PI) / 180;
  const deg = (r) => (r * 180) / Math.PI;
  const norm360 = (d) => ((d % 360) + 360) % 360;

  /** Signed shortest turn from `from` to `to`, in (-180, 180]. Positive is clockwise. */
  function angleDiff(to, from) {
    const d = norm360(to - from);
    return d > 180 ? d - 360 : d;
  }

  /** Initial great-circle bearing, degrees clockwise from true north. */
  function bearing(lat, lon, to = KAABA) {
    const p1 = rad(lat);
    const p2 = rad(to.lat);
    const dl = rad(to.lon - lon);
    const y = Math.sin(dl) * Math.cos(p2);
    const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
    return norm360(deg(Math.atan2(y, x)));
  }

  /** Great-circle (haversine) distance in kilometres. */
  function distanceKm(lat, lon, to = KAABA) {
    const p1 = rad(lat);
    const p2 = rad(to.lat);
    const dp = p2 - p1;
    const dl = rad(to.lon - lon);
    const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
  }

  function compassPoint(bearingDeg) {
    const [abbr, name] = POINTS[Math.round(norm360(bearingDeg) / 22.5) % 16];
    return { abbr, name };
  }

  function isValidCoord(lat, lon) {
    return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
  }

  function formatCoords(lat, lon, digits = 2) {
    const part = (v, pos, neg) => `${Math.abs(v).toFixed(digits)}° ${v < 0 ? neg : pos}`;
    return `${part(lat, 'N', 'S')}, ${part(lon, 'E', 'W')}`;
  }

  const api = {
    KAABA, KM_PER_MILE, norm360, angleDiff, bearing, distanceKm, compassPoint, isValidCoord, formatCoords,
  };

  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.QiblaGeo = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
