// Where America Moves — the curated metro set (ticket 03 §6, locked).
// 30 largest CBSAs by population (Census Pop. Estimates, POPESTIMATE2023)
// + Louisville (31140), a deliberate hometown addition → N = 31.
//
// CHECKED IN. This is static geographic config, not "the data": it changes only
// when OMB re-delineates CBSAs (every several years). `population` is a July-2023
// snapshot for context/ranking only — never re-derived from migration numbers.
//
// `lat`/`lon` are metro-center coordinates for the choropleth dot selector
// (albersUsa dot placement — principal-city precision is plenty).
// `slug` is the canonical URL slug; the pipeline copies it into metro_summary so
// routes and data can never disagree.

export interface Metro {
  cbsa: string; // 5-digit CBSA code (IRS join key, via crosswalk)
  full: string; // official CBSA title (aria / footer / <title>)
  short: string; // display name (panel / labels / partner links)
  state: string; // trailing state cluster (muted small type)
  slug: string; // /metro/<slug>
  population: number; // POPESTIMATE2023 — context only
  lat: number;
  lon: number;
}

export const METROS: Metro[] = [
  { cbsa: '35620', full: 'New York-Newark-Jersey City, NY-NJ', short: 'New York', state: 'NY-NJ', slug: 'new-york', population: 19788976, lat: 40.71, lon: -74.01 },
  { cbsa: '31080', full: 'Los Angeles-Long Beach-Anaheim, CA', short: 'Los Angeles', state: 'CA', slug: 'los-angeles', population: 12881909, lat: 34.05, lon: -118.24 },
  { cbsa: '16980', full: 'Chicago-Naperville-Elgin, IL-IN', short: 'Chicago', state: 'IL-IN', slug: 'chicago', population: 9335921, lat: 41.88, lon: -87.63 },
  { cbsa: '19100', full: 'Dallas-Fort Worth-Arlington, TX', short: 'Dallas', state: 'TX', slug: 'dallas', population: 8164140, lat: 32.78, lon: -96.8 },
  { cbsa: '26420', full: 'Houston-Pasadena-The Woodlands, TX', short: 'Houston', state: 'TX', slug: 'houston', population: 7587646, lat: 29.76, lon: -95.37 },
  { cbsa: '33100', full: 'Miami-Fort Lauderdale-West Palm Beach, FL', short: 'Miami', state: 'FL', slug: 'miami', population: 6353900, lat: 25.77, lon: -80.19 },
  { cbsa: '12060', full: 'Atlanta-Sandy Springs-Roswell, GA', short: 'Atlanta', state: 'GA', slug: 'atlanta', population: 6333350, lat: 33.75, lon: -84.39 },
  { cbsa: '47900', full: 'Washington-Arlington-Alexandria, DC-VA-MD-WV', short: 'Washington', state: 'DC-VA-MD-WV', slug: 'washington-dc', population: 6328730, lat: 38.9, lon: -77.04 },
  { cbsa: '37980', full: 'Philadelphia-Camden-Wilmington, PA-NJ-DE-MD', short: 'Philadelphia', state: 'PA-NJ-DE-MD', slug: 'philadelphia', population: 6277370, lat: 39.95, lon: -75.17 },
  { cbsa: '38060', full: 'Phoenix-Mesa-Chandler, AZ', short: 'Phoenix', state: 'AZ', slug: 'phoenix', population: 5087631, lat: 33.45, lon: -112.07 },
  { cbsa: '14460', full: 'Boston-Cambridge-Newton, MA-NH', short: 'Boston', state: 'MA-NH', slug: 'boston', population: 4970657, lat: 42.36, lon: -71.06 },
  { cbsa: '40140', full: 'Riverside-San Bernardino-Ontario, CA', short: 'Riverside', state: 'CA', slug: 'riverside', population: 4707448, lat: 33.98, lon: -117.37 },
  { cbsa: '41860', full: 'San Francisco-Oakland-Fremont, CA', short: 'San Francisco', state: 'CA', slug: 'san-francisco', population: 4601326, lat: 37.77, lon: -122.42 },
  { cbsa: '19820', full: 'Detroit-Warren-Dearborn, MI', short: 'Detroit', state: 'MI', slug: 'detroit', population: 4356818, lat: 42.33, lon: -83.05 },
  { cbsa: '42660', full: 'Seattle-Tacoma-Bellevue, WA', short: 'Seattle', state: 'WA', slug: 'seattle', population: 4062857, lat: 47.61, lon: -122.33 },
  { cbsa: '33460', full: 'Minneapolis-St. Paul-Bloomington, MN-WI', short: 'Minneapolis', state: 'MN-WI', slug: 'minneapolis', population: 3721774, lat: 44.98, lon: -93.27 },
  { cbsa: '45300', full: 'Tampa-St. Petersburg-Clearwater, FL', short: 'Tampa', state: 'FL', slug: 'tampa', population: 3370351, lat: 27.95, lon: -82.46 },
  { cbsa: '41740', full: 'San Diego-Chula Vista-Carlsbad, CA', short: 'San Diego', state: 'CA', slug: 'san-diego', population: 3279736, lat: 32.72, lon: -117.16 },
  { cbsa: '19740', full: 'Denver-Aurora-Centennial, CO', short: 'Denver', state: 'CO', slug: 'denver', population: 3031278, lat: 39.74, lon: -104.99 },
  { cbsa: '36740', full: 'Orlando-Kissimmee-Sanford, FL', short: 'Orlando', state: 'FL', slug: 'orlando', population: 2863651, lat: 28.54, lon: -81.38 },
  { cbsa: '12580', full: 'Baltimore-Columbia-Towson, MD', short: 'Baltimore', state: 'MD', slug: 'baltimore', population: 2843966, lat: 39.29, lon: -76.61 },
  { cbsa: '16740', full: 'Charlotte-Concord-Gastonia, NC-SC', short: 'Charlotte', state: 'NC-SC', slug: 'charlotte', population: 2818271, lat: 35.23, lon: -80.84 },
  { cbsa: '41180', full: 'St. Louis, MO-IL', short: 'St. Louis', state: 'MO-IL', slug: 'st-louis', population: 2804698, lat: 38.63, lon: -90.2 },
  { cbsa: '41700', full: 'San Antonio-New Braunfels, TX', short: 'San Antonio', state: 'TX', slug: 'san-antonio', population: 2719892, lat: 29.42, lon: -98.49 },
  { cbsa: '38900', full: 'Portland-Vancouver-Hillsboro, OR-WA', short: 'Portland', state: 'OR-WA', slug: 'portland', population: 2519045, lat: 45.52, lon: -122.68 },
  { cbsa: '12420', full: 'Austin-Round Rock-San Marcos, TX', short: 'Austin', state: 'TX', slug: 'austin', population: 2498809, lat: 30.27, lon: -97.74 },
  { cbsa: '40900', full: 'Sacramento-Roseville-Folsom, CA', short: 'Sacramento', state: 'CA', slug: 'sacramento', population: 2435884, lat: 38.58, lon: -121.49 },
  { cbsa: '38300', full: 'Pittsburgh, PA', short: 'Pittsburgh', state: 'PA', slug: 'pittsburgh', population: 2428225, lat: 40.44, lon: -79.996 },
  { cbsa: '29820', full: 'Las Vegas-Henderson-North Las Vegas, NV', short: 'Las Vegas', state: 'NV', slug: 'las-vegas', population: 2351008, lat: 36.17, lon: -115.14 },
  { cbsa: '17140', full: 'Cincinnati, OH-KY-IN', short: 'Cincinnati', state: 'OH-KY-IN', slug: 'cincinnati', population: 2281096, lat: 39.1, lon: -84.51 },
  // Hometown addition (not a rank change): Louisville, CBSA 31140.
  { cbsa: '31140', full: 'Louisville/Jefferson County, KY-IN', short: 'Louisville', state: 'KY-IN', slug: 'louisville', population: 1365557, lat: 38.25, lon: -85.76 },
];

export const METRO_CBSAS: Set<string> = new Set(METROS.map((m) => m.cbsa));

export const METRO_BY_CBSA: Map<string, Metro> = new Map(METROS.map((m) => [m.cbsa, m]));
