/*
 * Magnetic declination from the World Magnetic Model 2025 (NOAA/NCEI and BGS, public domain),
 * valid 2025.0 to 2030.0. Phone compasses report magnetic north; adding the declination gives
 * true north, which is what the Qibla bearing is measured from.
 */
(function (root) {
  'use strict';

  const EPOCH = 2025;
  const VALID_YEARS = 5;
  const N_MAX = 12;
  const WGS84_A = 6378.137;
  const WGS84_E2 = 0.0066943799901413165;
  const REFERENCE_RADIUS = 6371.2;

  // Rows of [g, h, dg/dt, dh/dt] in nT and nT/year, ordered n = 1..12, m = 0..n (WMM.COF).
  const COEFFS = [
    [-29351.8, 0, 12, 0], [-1410.8, 4545.4, 9.7, -21.5], [-2556.6, 0, -11.6, 0],
    [2951.1, -3133.6, -5.2, -27.7], [1649.3, -815.1, -8, -12.1], [1361, 0, -1.3, 0],
    [-2404.1, -56.6, -4.2, 4], [1243.8, 237.5, 0.4, -0.3], [453.6, -549.5, -15.6, -4.1],
    [895, 0, -1.6, 0], [799.5, 278.6, -2.4, -1.1], [55.7, -133.9, -6, 4.1],
    [-281.1, 212, 5.6, 1.6], [12.1, -375.6, -7, -4.4], [-233.2, 0, 0.6, 0],
    [368.9, 45.4, 1.4, -0.5], [187.2, 220.2, 0, 2.2], [-138.7, -122.9, 0.6, 0.4],
    [-142, 43, 2.2, 1.7], [20.9, 106.1, 0.9, 1.9], [64.4, 0, -0.2, 0],
    [63.8, -18.4, -0.4, 0.3], [76.9, 16.8, 0.9, -1.6], [-115.7, 48.8, 1.2, -0.4],
    [-40.9, -59.8, -0.9, 0.9], [14.9, 10.9, 0.3, 0.7], [-60.7, 72.7, 0.9, 0.9],
    [79.5, 0, 0, 0], [-77, -48.9, -0.1, 0.6], [-8.8, -14.4, -0.1, 0.5],
    [59.3, -1, 0.5, -0.8], [15.8, 23.4, -0.1, 0], [2.5, -7.4, -0.8, -1],
    [-11.1, -25.1, -0.8, 0.6], [14.2, -2.3, 0.8, -0.2], [23.2, 0, -0.1, 0],
    [10.8, 7.1, 0.2, -0.2], [-17.5, -12.6, 0, 0.5], [2, 11.4, 0.5, -0.4],
    [-21.7, -9.7, -0.1, 0.4], [16.9, 12.7, 0.3, -0.5], [15, 0.7, 0.2, -0.6],
    [-16.8, -5.2, 0, 0.3], [0.9, 3.9, 0.2, 0.2], [4.6, 0, 0, 0],
    [7.8, -24.8, -0.1, -0.3], [3, 12.2, 0.1, 0.3], [-0.2, 8.3, 0.3, -0.3],
    [-2.5, -3.3, -0.3, 0.3], [-13.1, -5.2, 0, 0.2], [2.4, 7.2, 0.3, -0.1],
    [8.6, -0.6, -0.1, -0.2], [-8.7, 0.8, 0.1, 0.4], [-12.9, 10, -0.1, 0.1],
    [-1.3, 0, 0.1, 0], [-6.4, 3.3, 0, 0], [0.2, 0, 0.1, 0],
    [2, 2.4, 0.1, -0.2], [-1, 5.3, 0, 0.1], [-0.6, -9.1, -0.3, -0.1],
    [-0.9, 0.4, 0, 0.1], [1.5, -4.2, -0.1, 0], [0.9, -3.8, -0.1, -0.1],
    [-2.7, 0.9, 0, 0.2], [-3.9, -9.1, 0, 0], [2.9, 0, 0, 0],
    [-1.5, 0, 0, 0], [-2.5, 2.9, 0, 0.1], [2.4, -0.6, 0, 0],
    [-0.6, 0.2, 0, 0.1], [-0.1, 0.5, -0.1, 0], [-0.6, -0.3, 0, 0],
    [-0.1, -1.2, 0, 0.1], [1.1, -1.7, -0.1, 0], [-1, -2.9, -0.1, 0],
    [-0.2, -1.8, -0.1, 0], [2.6, -2.3, -0.1, 0], [-2, 0, 0, 0],
    [-0.2, -1.3, 0, 0], [0.3, 0.7, 0, 0], [1.2, 1, 0, -0.1],
    [-1.3, -1.4, 0, 0.1], [0.6, 0, 0, 0], [0.6, 0.6, 0.1, 0],
    [0.5, -0.1, 0, 0], [-0.1, 0.8, 0, 0], [-0.4, 0.1, 0, 0],
    [-0.2, -1, -0.1, 0], [-1.3, 0.1, 0, 0], [-0.7, 0.2, -0.1, -0.1],
  ];

  function decimalYear(date) {
    const y = date.getUTCFullYear();
    const start = Date.UTC(y, 0, 1);
    return y + (date.getTime() - start) / (Date.UTC(y + 1, 0, 1) - start);
  }

  /**
   * Declination in degrees, positive when magnetic north is east of true north.
   * `when` is a Date or a decimal year; dates outside the model's span are clamped to it.
   */
  function declination(lat, lon, when = new Date(), altitudeKm = 0) {
    const year = typeof when === 'number' ? when : decimalYear(when);
    const dt = Math.min(VALID_YEARS, Math.max(0, year - EPOCH));

    const phi = (lat * Math.PI) / 180;
    const lam = (lon * Math.PI) / 180;
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);

    // Geodetic to geocentric.
    const rc = WGS84_A / Math.sqrt(1 - WGS84_E2 * sinPhi * sinPhi);
    const xp = (rc + altitudeKm) * cosPhi;
    const zp = (rc * (1 - WGS84_E2) + altitudeKm) * sinPhi;
    const r = Math.hypot(xp, zp);
    const s = zp / r;
    const c = xp / r;
    if (c < 1e-10) return 0;

    // Schmidt semi-normalised associated Legendre functions and their latitude derivatives.
    const idx = (n, m) => (n * (n + 1)) / 2 + m;
    const P = [1];
    const dP = [0];
    for (let n = 1; n <= N_MAX; n++) {
      for (let m = 0; m <= n; m++) {
        const i = idx(n, m);
        if (n === m) {
          const k = n === 1 ? 1 : Math.sqrt(1 - 1 / (2 * n));
          const j = idx(n - 1, n - 1);
          P[i] = k * c * P[j];
          dP[i] = k * (c * dP[j] - s * P[j]);
        } else {
          const j1 = idx(n - 1, m);
          const k2 = Math.sqrt((n - 1) * (n - 1) - m * m);
          const p2 = n - 2 >= m ? P[idx(n - 2, m)] : 0;
          const dp2 = n - 2 >= m ? dP[idx(n - 2, m)] : 0;
          const norm = Math.sqrt(n * n - m * m);
          P[i] = ((2 * n - 1) * s * P[j1] - k2 * p2) / norm;
          dP[i] = ((2 * n - 1) * (s * dP[j1] + c * P[j1]) - k2 * dp2) / norm;
        }
      }
    }

    let bx = 0;
    let by = 0;
    let bz = 0;
    const ratio = REFERENCE_RADIUS / r;
    let power = ratio * ratio;
    let row = 0;
    for (let n = 1; n <= N_MAX; n++) {
      power *= ratio;
      for (let m = 0; m <= n; m++, row++) {
        const [g0, h0, dg, dh] = COEFFS[row];
        const g = g0 + dt * dg;
        const h = h0 + dt * dh;
        const cosM = Math.cos(m * lam);
        const sinM = Math.sin(m * lam);
        const i = idx(n, m);
        bx -= power * (g * cosM + h * sinM) * dP[i];
        by += power * m * (g * sinM - h * cosM) * P[i];
        bz -= power * (n + 1) * (g * cosM + h * sinM) * P[i];
      }
    }
    by /= c;

    // Rotate the north component from the geocentric to the geodetic frame.
    const psi = Math.asin(s) - phi;
    const north = bx * Math.cos(psi) - bz * Math.sin(psi);
    return (Math.atan2(by, north) * 180) / Math.PI;
  }

  const api = { declination };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.QiblaDeclination = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
