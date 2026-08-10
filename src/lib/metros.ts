// Where America Moves — the metro set, as APPARATUS.
//
// This file is the selection set and its coordinates. Both fall outside the package
// contract (`manifest.contract.apparatus`), and neither is a measured quantity: no
// value here is derived from the migration data and no coordinate is ever printed.
// It is the only route from a frame's `unit` column (`12060|12420`) to a name.
//
// The rule that picked these 30 lives in `manifest.universes[0].selection`, is cited
// to the Census Bureau there, and is stated on the page once. It is not restated here,
// because two writings of one rule is how a stale one gets trusted.
//
// `population` was deleted here and is BACK, 2026-08-09, by Dustin's ruling after the
// objection was raised once and reaffirmed: the per-1,000 view ships. It is kept out of the
// `Metro` type and stands in its own table below, because it is not apparatus in the sense
// the rest of this file is — it is a measured quantity from a different dataset, and the
// distance is the point.
//
// CHECKED IN. Static geographic config; changes only when OMB re-delineates CBSAs.

export interface Metro {
  cbsa: string; // 5-digit CBSA code (IRS join key, via crosswalk)
  full: string; // official CBSA title (aria / footer / <title>)
  short: string; // display name (panel / labels / partner links)
  state: string; // trailing state cluster (muted small type)
  slug: string; // /metro/<slug>
  lat: number;
  lon: number;
}

export const METROS: Metro[] = [
  { cbsa: '35620', full: 'New York-Newark-Jersey City, NY-NJ', short: 'New York', state: 'NY-NJ', slug: 'new-york', lat: 40.71, lon: -74.01 },
  { cbsa: '31080', full: 'Los Angeles-Long Beach-Anaheim, CA', short: 'Los Angeles', state: 'CA', slug: 'los-angeles', lat: 34.05, lon: -118.24 },
  { cbsa: '16980', full: 'Chicago-Naperville-Elgin, IL-IN', short: 'Chicago', state: 'IL-IN', slug: 'chicago', lat: 41.88, lon: -87.63 },
  { cbsa: '19100', full: 'Dallas-Fort Worth-Arlington, TX', short: 'Dallas', state: 'TX', slug: 'dallas', lat: 32.78, lon: -96.8 },
  { cbsa: '26420', full: 'Houston-Pasadena-The Woodlands, TX', short: 'Houston', state: 'TX', slug: 'houston', lat: 29.76, lon: -95.37 },
  { cbsa: '33100', full: 'Miami-Fort Lauderdale-West Palm Beach, FL', short: 'Miami', state: 'FL', slug: 'miami', lat: 25.77, lon: -80.19 },
  { cbsa: '12060', full: 'Atlanta-Sandy Springs-Roswell, GA', short: 'Atlanta', state: 'GA', slug: 'atlanta', lat: 33.75, lon: -84.39 },
  { cbsa: '47900', full: 'Washington-Arlington-Alexandria, DC-VA-MD-WV', short: 'Washington', state: 'DC-VA-MD-WV', slug: 'washington-dc', lat: 38.9, lon: -77.04 },
  { cbsa: '37980', full: 'Philadelphia-Camden-Wilmington, PA-NJ-DE-MD', short: 'Philadelphia', state: 'PA-NJ-DE-MD', slug: 'philadelphia', lat: 39.95, lon: -75.17 },
  { cbsa: '38060', full: 'Phoenix-Mesa-Chandler, AZ', short: 'Phoenix', state: 'AZ', slug: 'phoenix', lat: 33.45, lon: -112.07 },
  { cbsa: '14460', full: 'Boston-Cambridge-Newton, MA-NH', short: 'Boston', state: 'MA-NH', slug: 'boston', lat: 42.36, lon: -71.06 },
  { cbsa: '40140', full: 'Riverside-San Bernardino-Ontario, CA', short: 'Riverside', state: 'CA', slug: 'riverside', lat: 33.98, lon: -117.37 },
  { cbsa: '41860', full: 'San Francisco-Oakland-Fremont, CA', short: 'San Francisco', state: 'CA', slug: 'san-francisco', lat: 37.77, lon: -122.42 },
  { cbsa: '19820', full: 'Detroit-Warren-Dearborn, MI', short: 'Detroit', state: 'MI', slug: 'detroit', lat: 42.33, lon: -83.05 },
  { cbsa: '42660', full: 'Seattle-Tacoma-Bellevue, WA', short: 'Seattle', state: 'WA', slug: 'seattle', lat: 47.61, lon: -122.33 },
  { cbsa: '33460', full: 'Minneapolis-St. Paul-Bloomington, MN-WI', short: 'Minneapolis', state: 'MN-WI', slug: 'minneapolis', lat: 44.98, lon: -93.27 },
  { cbsa: '45300', full: 'Tampa-St. Petersburg-Clearwater, FL', short: 'Tampa', state: 'FL', slug: 'tampa', lat: 27.95, lon: -82.46 },
  { cbsa: '41740', full: 'San Diego-Chula Vista-Carlsbad, CA', short: 'San Diego', state: 'CA', slug: 'san-diego', lat: 32.72, lon: -117.16 },
  { cbsa: '19740', full: 'Denver-Aurora-Centennial, CO', short: 'Denver', state: 'CO', slug: 'denver', lat: 39.74, lon: -104.99 },
  { cbsa: '36740', full: 'Orlando-Kissimmee-Sanford, FL', short: 'Orlando', state: 'FL', slug: 'orlando', lat: 28.54, lon: -81.38 },
  { cbsa: '12580', full: 'Baltimore-Columbia-Towson, MD', short: 'Baltimore', state: 'MD', slug: 'baltimore', lat: 39.29, lon: -76.61 },
  { cbsa: '16740', full: 'Charlotte-Concord-Gastonia, NC-SC', short: 'Charlotte', state: 'NC-SC', slug: 'charlotte', lat: 35.23, lon: -80.84 },
  { cbsa: '41180', full: 'St. Louis, MO-IL', short: 'St. Louis', state: 'MO-IL', slug: 'st-louis', lat: 38.63, lon: -90.2 },
  { cbsa: '41700', full: 'San Antonio-New Braunfels, TX', short: 'San Antonio', state: 'TX', slug: 'san-antonio', lat: 29.42, lon: -98.49 },
  { cbsa: '38900', full: 'Portland-Vancouver-Hillsboro, OR-WA', short: 'Portland', state: 'OR-WA', slug: 'portland', lat: 45.52, lon: -122.68 },
  { cbsa: '12420', full: 'Austin-Round Rock-San Marcos, TX', short: 'Austin', state: 'TX', slug: 'austin', lat: 30.27, lon: -97.74 },
  { cbsa: '40900', full: 'Sacramento-Roseville-Folsom, CA', short: 'Sacramento', state: 'CA', slug: 'sacramento', lat: 38.58, lon: -121.49 },
  { cbsa: '38300', full: 'Pittsburgh, PA', short: 'Pittsburgh', state: 'PA', slug: 'pittsburgh', lat: 40.44, lon: -79.996 },
  { cbsa: '29820', full: 'Las Vegas-Henderson-North Las Vegas, NV', short: 'Las Vegas', state: 'NV', slug: 'las-vegas', lat: 36.17, lon: -115.14 },
  { cbsa: '17140', full: 'Cincinnati, OH-KY-IN', short: 'Cincinnati', state: 'OH-KY-IN', slug: 'cincinnati', lat: 39.1, lon: -84.51 },
];

export const METRO_CBSAS: Set<string> = new Set(METROS.map((m) => m.cbsa));

export const METRO_BY_CBSA: Map<string, Metro> = new Map(METROS.map((m) => [m.cbsa, m]));

/** POPESTIMATE2023 — the July-2023 resident estimate, recovered verbatim from commit
 *  `57a25a4`, the version that shipped the per-capita toggle before it was deleted. Not
 *  re-derived, because a second derivation of a figure that already existed is a second
 *  chance to get it wrong.
 *
 *  IT IS A DENOMINATOR AND NEVER A NUMERATOR, and no figure computed from it is ever
 *  printed. The per-1,000 view divides a pair's net by the PARTNER metro's residents and
 *  spends the result on a dot count — a mark, which `contract.aggregation` licenses —
 *  while every number the page prints stays a published cell. Normalising by the SELECTED
 *  metro instead would put one denominator under all twenty-nine and redraw Total at
 *  another scale, which is why the partner is the divisor.
 *
 *  The mixed-universe objection is real and unfixable rather than answered: the numerator
 *  counts filers and their dependents, the denominator counts every resident, and the
 *  footer says so where the old copy used to say the view would never exist. */
export const POPULATION: Record<string, number> = {
  '35620': 19788976, '31080': 12881909, '16980': 9335921, '19100': 8164140, '26420': 7587646,
  '33100': 6353900, '12060': 6333350, '47900': 6328730, '37980': 6277370, '38060': 5087631,
  '14460': 4970657, '40140': 4707448, '41860': 4601326, '19820': 4356818, '42660': 4062857,
  '33460': 3721774, '45300': 3370351, '41740': 3279736, '19740': 3031278, '36740': 2863651,
  '12580': 2843966, '16740': 2818271, '41180': 2804698, '41700': 2719892, '38900': 2519045,
  '12420': 2498809, '40900': 2435884, '38300': 2428225, '29820': 2351008, '17140': 2281096,
};
