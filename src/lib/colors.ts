// Net-flow colour — spectral within each pole, CVD-validated (02 / look-tokens).
// cool = arriving/net-in, warm = leaving/net-out. Reserved for data only.
import { interpolateRgb } from 'd3-interpolate';

const inScale = interpolateRgb('#EAE2D4', '#2E93B4'); // net-mid → in-hi
const outScale = interpolateRgb('#EAE2D4', '#D3823C'); // net-mid → out-hi

/** colour for a net value, magnitude-scaled against `ref` (max |net|) */
export function netColor(net: number, ref: number): string {
  const t = Math.min(1, Math.abs(net) / (ref || 1));
  return net >= 0 ? inScale(0.25 + 0.75 * t) : outScale(0.25 + 0.75 * t);
}
