// What the page reads OFF the hero plate, so the new mark cannot drift away from the old one.
//
// 09's field is emitted geometry: 863 disclosed pairs, 7 absent ones, and 30 badges at real
// Albers positions. The origin→destination lines drawn on selection have to start and end at
// exactly those badge positions, in exactly that coordinate system — so the positions are
// PARSED FROM THE PLATE rather than re-projected here. A second geoAlbersUsa() call with the
// same scale would agree today and drift the first time hero_geo.py's canvas changes, and the
// drift would be invisible: lines that miss their hubs by three pixels look like a design.
//
// The 7 absent pairs are read the same way, from the plate's own `data-absent`. They are not
// recomputed as a set complement here — the plate already decided which seven it drew open,
// and D0014's obligation is about the ones the reader sees.
//
// Nothing in this file is a measurement. Badge coordinates are apparatus under
// `contract.apparatus`, exactly as `metros.ts`'s lat/lon are, and no value here is printed.

export interface Hub {
  cbsa: string;
  x: number;
  y: number;
  r: number;
}

const BADGE = /<g data-metro="(\d+)"><circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"/g;
const ABSENT = /<circle data-origin="(\d+)" data-dest="(\d+)" data-absent="1"/g;
const VIEWBOX = /<svg[^>]*\sviewBox="([\d.\s-]+)"/;

export interface PlateGeometry {
  viewBox: [number, number, number, number];
  hubs: Hub[];
  absent: [string, string][];
}

export function readPlate(svg: string, what: string): PlateGeometry {
  const vb = VIEWBOX.exec(svg);
  if (!vb) throw new Error(`${what} has no viewBox`);
  const box = vb[1].trim().split(/\s+/).map(Number) as [number, number, number, number];

  const hubs: Hub[] = [];
  for (const m of svg.matchAll(BADGE)) {
    hubs.push({ cbsa: m[1], x: Number(m[2]), y: Number(m[3]), r: Number(m[4]) });
  }
  if (!hubs.length) throw new Error(`${what} carries no badges — the lines have nowhere to land`);

  const seen = new Set<string>();
  const absent: [string, string][] = [];
  for (const m of svg.matchAll(ABSENT)) {
    const key = `${m[1]}>${m[2]}`;
    if (seen.has(key)) continue; // an open mark is two concentric circles
    seen.add(key);
    absent.push([m[1], m[2]]);
  }

  return { viewBox: box, hubs, absent };
}
