// In-browser WebAssembly calculation engine
// Combines Swiss Ephemeris WASM (for planetary positions & houses)
// with vedic_wasm (for pure Parashari calculations, D1-D60, Shadbala, Ashtakavarga, Dashas, Yogas, Panchanga).
// Zero network calls, zero backend server required.
// STRICT SECURITY: Never imports or accesses any API keys or client secrets.

let sweModuleInstance: any = null;
let swePromise: Promise<any> | null = null;
let wasmInitPromise: Promise<any> | null = null;

// Swiss Ephemeris planet indices (SE_*)
const SE_SUN = 0;
const SE_MOON = 1;
const SE_MERCURY = 2;
const SE_VENUS = 3;
const SE_MARS = 4;
const SE_JUPITER = 5;
const SE_SATURN = 6;
const SE_MEAN_NODE = 10;
const SE_TRUE_NODE = 11;

// Flags: SEFLG_SIDEREAL = 65536, SEFLG_SPEED = 256
const SEFLG_SIDEREAL = 65536;
const SEFLG_SPEED = 256;
const CALC_FLAGS = SEFLG_SIDEREAL | SEFLG_SPEED;

/**
 * Initialize Swiss Ephemeris WASM module
 */
export async function initSwissEphemeris(): Promise<any> {
  if (sweModuleInstance) return sweModuleInstance;
  if (swePromise) return swePromise;

  swePromise = (async () => {
    const sweModuleImport = await import("./swisseph.js");
    const factory = (sweModuleImport as any).default || sweModuleImport;

    let wasmBinary: ArrayBuffer | null = null;
    if (typeof window !== "undefined") {
      try {
        const res = await fetch("/swisseph.wasm");
        if (res.ok) {
          wasmBinary = await res.arrayBuffer();
        }
      } catch (err) {
        console.warn("Could not fetch /swisseph.wasm, falling back to default loader:", err);
      }
    }

    const config: any = {
      locateFile: (path: string) => {
        if (path === "swisseph.wasm") return "/swisseph.wasm";
        return path;
      },
    };

    if (wasmBinary) {
      config.instantiateWasm = (imports: any, successCallback: any) => {
        WebAssembly.instantiate(wasmBinary!, imports)
          .then((output) => successCallback(output.instance))
          .catch((err) => console.error("SwissEphemeris instantiateWasm failed:", err));
        return {};
      };
    }

    const mod = await factory(config);
    sweModuleInstance = mod;
    return mod;
  })();

  return swePromise;
}

/**
 * Initialize vedic_wasm engine
 */
export async function initVedicWasm(): Promise<any> {
  if (wasmInitPromise) return wasmInitPromise;

  wasmInitPromise = (async () => {
    const wasmModule = await import("../wasm/vedic_wasm.js");
    const initWasm = wasmModule.default;
    if (typeof window !== "undefined") {
      await initWasm("/vedic_wasm_bg.wasm");
    } else {
      await initWasm();
    }
    return wasmModule;
  })();

  return wasmInitPromise;
}

/**
 * Convert standard calendar date & time into UTC Julian Day
 */
export function getJulianDayUT(
  dateStr: string, // "YYYY-MM-DD" or "DD/MM/YYYY"
  timeStr: string, // "HH:MM" or "HH:MM:SS"
  tzOffsetHours: number
): { jdUT: number; year: number; month: number; day: number; hourUT: number } {
  let year = 2000, month = 1, day = 1;
  const cleanDate = dateStr.trim();
  if (cleanDate.includes("/")) {
    const parts = cleanDate.split("/").map(Number);
    day = parts[0];
    month = parts[1];
    year = parts[2];
  } else if (cleanDate.includes("-")) {
    const parts = cleanDate.split("-").map(Number);
    if (parts[0] > 1000) {
      year = parts[0];
      month = parts[1];
      day = parts[2];
    } else {
      day = parts[0];
      month = parts[1];
      year = parts[2];
    }
  }

  const timeParts = timeStr.trim().split(":").map(Number);
  const hour = timeParts[0] || 0;
  const minute = timeParts[1] || 0;
  const second = timeParts[2] || 0;

  const localDecimalHour = hour + minute / 60 + second / 3600;
  const utDecimalHour = localDecimalHour - tzOffsetHours;

  let y = year;
  let m = month;
  const d = day + utDecimalHour / 24.0;

  if (m <= 2) {
    y -= 1;
    m += 12;
  }

  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);

  const jdUT =
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    d +
    B -
    1524.5;

  return { jdUT, year, month, day, hourUT: utDecimalHour };
}

/**
 * High-precision Astronomical Sunrise and Sunset calculation
 * Accurately aligns local solar noon, Equation of Time, and atmospheric refraction.
 */
export function calcAstronomicalSunriseSunset(
  year: number,
  month: number,
  day: number,
  lat: number,
  lon: number,
  tz: number
): { sunriseJd: number; sunsetJd: number; nextSunriseJd: number; sunriseLocal: string; sunsetLocal: string } {
  let y = year, m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const jd0 = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5;
  const jdMidnightUT = jd0 - tz / 24.0;
  const jdNoonUT = jdMidnightUT + 0.5;

  const n = jdNoonUT - 2451545.0;
  const L = (280.460 + 0.9856474 * n) % 360;
  const g = (((357.528 + 0.9856003 * n) % 360) * Math.PI) / 180;
  const lambda = ((L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * Math.PI) / 180;
  const eps = (23.439 * Math.PI) / 180;
  const alpha = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda));
  const dec = Math.asin(Math.sin(eps) * Math.sin(lambda));

  const rad = Math.PI / 180;
  const phi = lat * rad;
  const cosH0 = (Math.sin(-0.8333 * rad) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec));
  const H0 = Math.acos(Math.max(-1, Math.min(1, cosH0))) / rad;

  const alphaDeg = (alpha / rad + 360) % 360;
  const lambdaDeg = (lambda / rad + 360) % 360;
  let eotMin = (lambdaDeg - alphaDeg) * 4;
  if (eotMin > 20) eotMin -= 1440;
  if (eotMin < -20) eotMin += 1440;

  const solarNoonLocal = 12.0 - (lon - tz * 15) / 15.0 - eotMin / 60.0;
  const sunriseLocalH = solarNoonLocal - H0 / 15.0;
  const sunsetLocalH = solarNoonLocal + H0 / 15.0;

  const sunriseJd = jdMidnightUT + sunriseLocalH / 24.0;
  const sunsetJd = jdMidnightUT + sunsetLocalH / 24.0;
  const nextSunriseJd = sunriseJd + 1.0;

  const formatH = (h: number) => {
    const hh = Math.floor(h);
    const mm = Math.floor((h - hh) * 60);
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  };

  return {
    sunriseJd,
    sunsetJd,
    nextSunriseJd,
    sunriseLocal: formatH(sunriseLocalH),
    sunsetLocal: formatH(sunsetLocalH),
  };
}

/**
 * Compute Vedic Chart in the browser using WASM
 */
export async function computeClientChart(data: any): Promise<any> {
  const [swe, wasm] = await Promise.all([initSwissEphemeris(), initVedicWasm()]);

  const tz = Number(data.timezone ?? 5.5);
  const lat = Number(data.lat);
  const lon = Number(data.lon);

  const { jdUT, year, month, day } = getJulianDayUT(data.date, data.time, tz);

  // Set Lahiri Sidereal Mode (1 = SE_SIDM_LAHIRI)
  const setSidMode = swe.cwrap("swe_set_sid_mode_wrap", null, ["number", "number", "number"]);
  const getAyanamsa = swe.cwrap("swe_get_ayanamsa_ut_wrap", "number", ["number"]);
  setSidMode(1, 0, 0);

  const ayanamsa = getAyanamsa(jdUT);

  // Calculate Houses & Ascendant
  // In Parashari backend, default cusp system is Equal/Ascendant (A = 65) or WholeSign (W = 87)
  const houseSysCode = data.profile?.house_system === "Placidus" ? 80 : 87;
  const cuspsPtr = swe._malloc(13 * 8);
  const ascmcPtr = swe._malloc(10 * 8);

  swe.ccall(
    "swe_houses_wrap",
    "number",
    ["number", "number", "number", "number", "number", "number"],
    [jdUT, lat, lon, houseSysCode, cuspsPtr, ascmcPtr]
  );

  const ascTropical = swe.getValue(ascmcPtr, "double");
  const ascSidereal = (ascTropical - ayanamsa + 360) % 360;

  const cuspsSidereal: number[] = [];
  for (let i = 1; i <= 12; i++) {
    const cuspTropical = swe.getValue(cuspsPtr + i * 8, "double");
    cuspsSidereal.push((cuspTropical - ayanamsa + 360) % 360);
  }

  swe._free(cuspsPtr);
  swe._free(ascmcPtr);

  // Calculate Planetary Coordinates strictly for 9 authentic Vedic Grahas
  // (Uranus, Neptune, and Pluto are excluded as requested)
  const xxPtr = swe._malloc(6 * 8);
  const serrPtr = swe._malloc(256);

  const planetsToCalc = [
    { name: "Sun", id: SE_SUN },
    { name: "Moon", id: SE_MOON },
    { name: "Mars", id: SE_MARS },
    { name: "Mercury", id: SE_MERCURY },
    { name: "Jupiter", id: SE_JUPITER },
    { name: "Venus", id: SE_VENUS },
    { name: "Saturn", id: SE_SATURN },
    { name: "Rahu", id: data.profile?.node_type === "True" ? SE_TRUE_NODE : SE_MEAN_NODE },
  ];

  const rawPlanets: Array<{ name: string; longitude: number; speed: number }> = [];
  let sunLon = 0;
  let moonLon = 0;

  for (const p of planetsToCalc) {
    swe.ccall(
      "swe_calc_ut_wrap",
      "number",
      ["number", "number", "number", "number", "number"],
      [jdUT, p.id, CALC_FLAGS, xxPtr, serrPtr]
    );
    const lonVal = swe.getValue(xxPtr, "double");
    const speed = swe.getValue(xxPtr + 24, "double");

    if (p.name === "Sun") sunLon = lonVal;
    if (p.name === "Moon") moonLon = lonVal;

    rawPlanets.push({
      name: p.name,
      longitude: lonVal,
      speed: speed,
    });

    if (p.name === "Rahu") {
      // Ketu is 180° opposite Rahu
      const ketuLon = (lonVal + 180) % 360;
      rawPlanets.push({
        name: "Ketu",
        longitude: ketuLon,
        speed: speed,
      });
    }
  }

  // Calculate today's Saturn for Sade Sati
  const now = new Date();
  const nowJd = getJulianDayUT(
    `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`,
    "12:00:00",
    tz
  ).jdUT;

  swe.ccall(
    "swe_calc_ut_wrap",
    "number",
    ["number", "number", "number", "number", "number"],
    [nowJd, SE_SATURN, CALC_FLAGS, xxPtr, serrPtr]
  );
  const currentSaturnLon = swe.getValue(xxPtr, "double");

  swe._free(xxPtr);
  swe._free(serrPtr);

  // Exact Astronomical Sunrise & Sunset
  const { sunriseJd, sunsetJd, nextSunriseJd } = calcAstronomicalSunriseSunset(
    year,
    month,
    day,
    lat,
    lon,
    tz
  );

  // Compute classical Hindu Lunar Month Index
  const amantaMasaIdx = (Math.floor(sunLon / 30) + 1) % 12;
  const diff = (moonLon - sunLon + 360) % 360;
  const purnimantaMasaIdx = diff > 180 ? (amantaMasaIdx + 1) % 12 : amantaMasaIdx;

  // Build CoreChartInput for vedic_wasm
  const coreInput = {
    date: data.date,
    time: data.time,
    lat: lat,
    lon: lon,
    timezone: tz,
    city: data.city || "",
    timezone_name: null,
    ascendant_degree: ascSidereal,
    ayanamsa_value: ayanamsa,
    house_cusps: cuspsSidereal,
    planets: rawPlanets,
    profile: data.profile || {
      ayanamsa: "Lahiri",
      node_type: "Mean",
      house_system: "WholeSign",
      dasha_year: "365.25",
    },
    current_saturn_longitude: currentSaturnLon,
    sunrise_jd: sunriseJd,
    sunset_jd: sunsetJd,
    next_sunrise_jd: nextSunriseJd,
    jd_ut: jdUT,
    amanta_month: amantaMasaIdx,
    purnimanta_month: purnimantaMasaIdx,
    is_adhika_month: false,
  };

  const chartJson = wasm.compute_chart_wasm(JSON.stringify(coreInput));
  const parsedChart = JSON.parse(chartJson);
  parsedChart.raw_planets = rawPlanets;
  parsedChart.sunriseJd = sunriseJd;
  parsedChart.sunsetJd = sunsetJd;
  parsedChart.nextSunriseJd = nextSunriseJd;
  parsedChart.jdUT = jdUT;
  return parsedChart;
}

/**
 * Compute Guna Milan in the browser using WASM
 */
export async function computeClientGunaMilan(
  boyNakshatra: number,
  boyPada: number,
  girlNakshatra: number,
  girlPada: number,
  method: string = "ashtakoota"
): Promise<any> {
  const wasm = await initVedicWasm();
  const resultJson = wasm.calculate_guna_milan_wasm(
    boyNakshatra,
    boyPada,
    girlNakshatra,
    girlPada,
    method
  );
  return JSON.parse(resultJson);
}

/**
 * Compute Muhurtha in the browser using WASM
 */
export async function computeClientMuhurtha(payload: any): Promise<any> {
  const wasm = await initVedicWasm();

  const chartRes = await computeClientChart({
    date: payload.date,
    time: payload.time,
    lat: payload.lat,
    lon: payload.lon,
    timezone: payload.timezone,
    city: "",
  });

  const muhurthaInput = {
    chart_input: {
      date: payload.date,
      time: payload.time,
      lat: payload.lat,
      lon: payload.lon,
      timezone: payload.timezone,
      city: "",
      timezone_name: null,
      ascendant_degree: chartRes.ascendant.degree,
      ayanamsa_value: chartRes.panchanga?.ayanamsha || 24.0,
      house_cusps: chartRes.house_cusps || [],
      planets: chartRes.raw_planets || [],
      profile: null,
      current_saturn_longitude: null,
      sunrise_jd: chartRes.sunriseJd || null,
      sunset_jd: chartRes.sunsetJd || null,
      next_sunrise_jd: chartRes.nextSunriseJd || null,
      jd_ut: chartRes.jdUT || null,
      amanta_month: null,
      purnimanta_month: null,
      is_adhika_month: null,
    },
    activity: payload.activity || "general",
    direction: payload.direction || null,
    birth_moon_nakshatra: payload.birth_moon_nakshatra || null,
    birth_moon_sign: payload.birth_moon_sign || null,
  };

  const resJson = wasm.calculate_muhurtha_wasm(JSON.stringify(muhurthaInput));
  return JSON.parse(resJson);
}

const MASA_NAMES = [
  "Chaitra", "Vaishakha", "Jyeshtha", "Ashadha", "Shravana", "Bhadrapada",
  "Ashvina", "Kartika", "Margashirsha", "Pausha", "Magha", "Phalguna",
];

const VARA_SANSKRIT = [
  "Somavara", "Mangalavara", "Budhavara", "Guruvara", "Shukravara", "Shanivara", "Ravivara",
];

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

function checkDaySankranti(swe: any, jdStart: number, jdEnd: number): { signIndex: number; signName: string } | null {
  const { sun: sStart } = getSunMoonSidereal(swe, jdStart);
  const { sun: sEnd } = getSunMoonSidereal(swe, jdEnd);
  const r1 = Math.floor(sStart / 30.0);
  const r2 = Math.floor(sEnd / 30.0);
  if (r1 !== r2) {
    const r2Idx = ((r2 % 12) + 12) % 12;
    return { signIndex: r2Idx, signName: ZODIAC_SIGNS[r2Idx] };
  }
  return null;
}

function getSunMoonSidereal(swe: any, jdUT: number): { sun: number; moon: number } {
  const xxPtr = swe._malloc(6 * 8);
  const serrPtr = swe._malloc(256);

  swe.ccall(
    "swe_calc_ut_wrap",
    "number",
    ["number", "number", "number", "number", "number"],
    [jdUT, SE_SUN, CALC_FLAGS, xxPtr, serrPtr]
  );
  const sun = ((swe.getValue(xxPtr, "double") % 360) + 360) % 360;

  swe.ccall(
    "swe_calc_ut_wrap",
    "number",
    ["number", "number", "number", "number", "number"],
    [jdUT, SE_MOON, CALC_FLAGS, xxPtr, serrPtr]
  );
  const moon = ((swe.getValue(xxPtr, "double") % 360) + 360) % 360;

  swe._free(xxPtr);
  swe._free(serrPtr);
  return { sun, moon };
}

function findExactNewMoon(swe: any, jd: number, opt: number): number {
  const { sun, moon } = getSunMoonSidereal(swe, jd);
  const diff = (moon - sun + 360) % 360;
  const initialOffset =
    opt < 0
      ? diff < 1.0
        ? -29.53
        : -diff / 12.190749
      : diff > 359.0
      ? 29.53
      : (360.0 - diff) / 12.190749;

  let curJd = jd + initialOffset;
  for (let i = 0; i < 4; i++) {
    const { sun: sCur, moon: mCur } = getSunMoonSidereal(swe, curJd);
    const d = (mCur - sCur + 360) % 360;
    const dSigned = d > 180.0 ? d - 360.0 : d;
    curJd -= dSigned / 12.190749;
  }
  return curJd;
}

function findExactFullMoon(swe: any, jd: number, opt: number): number {
  const { sun, moon } = getSunMoonSidereal(swe, jd);
  const diff = (moon - sun + 360) % 360;
  const diffFromTarget = (diff - 180 + 360) % 360;
  const initialOffset =
    opt < 0
      ? diffFromTarget < 1.0
        ? -29.53
        : -diffFromTarget / 12.190749
      : diffFromTarget > 359.0
      ? 29.53
      : (360.0 - diffFromTarget) / 12.190749;

  let curJd = jd + initialOffset;
  for (let i = 0; i < 4; i++) {
    const { sun: sCur, moon: mCur } = getSunMoonSidereal(swe, curJd);
    const d = (mCur - sCur + 360) % 360;
    const dDiff = (d - 180 + 360) % 360;
    const dSigned = dDiff > 180.0 ? dDiff - 360.0 : dDiff;
    curJd -= dSigned / 12.190749;
  }
  return curJd;
}

function getLunarMonthInfo(
  swe: any,
  jdUT: number,
  usePurnimanta: boolean
): { lunarMonth: number; isLeap: boolean; isNija: boolean } {
  const lastNm = findExactNewMoon(swe, jdUT, -1);
  const nextNm = findExactNewMoon(swe, jdUT, 1);
  const { sun: sunLast } = getSunMoonSidereal(swe, lastNm);
  const { sun: sunNext } = getSunMoonSidereal(swe, nextNm);
  const rashiLast = Math.floor(sunLast / 30);
  const rashiNext = Math.floor(sunNext / 30);

  const isLeap = rashiLast === rashiNext;
  let lunarMonth = (rashiLast + 1) % 12;

  let isNija = false;
  if (!isLeap) {
    const prevLastNm = findExactNewMoon(swe, lastNm - 1.0, -1);
    const { sun: prevSunLast } = getSunMoonSidereal(swe, prevLastNm);
    const prevRashiLast = Math.floor(prevSunLast / 30);
    const prevIsLeap = prevRashiLast === rashiLast;
    const prevMasa = (prevRashiLast + 1) % 12;
    if (prevIsLeap && prevMasa === lunarMonth) {
      isNija = true;
    }
  }

  if (usePurnimanta) {
    const { sun: s, moon: m } = getSunMoonSidereal(swe, jdUT);
    const moonSun = (m - s + 360) % 360;
    const tithiIdx = Math.floor(moonSun / 12);
    if (tithiIdx >= 15) {
      lunarMonth = (lunarMonth + 1) % 12;
    }
  }

  return { lunarMonth, isLeap, isNija };
}

function jdToLocalDate(jdUT: number, tz: number): { year: number; month: number; day: number } {
  const unixTs = (jdUT - 2440587.5) * 86400.0;
  const localMs = (unixTs + tz * 3600) * 1000;
  const d = new Date(localMs);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

interface MonthCycleInfo {
  startDate: { year: number; month: number; day: number };
  days: Array<{ year: number; month: number; day: number }>;
  masaIndex: number;
  isAdhik: boolean;
  isNija: boolean;
  vikramSamvat: number;
  shakaSamvat: number;
}

function getYearLunarCycles(
  swe: any,
  year: number,
  tradition: string,
  lat: number,
  lon: number,
  tz: number
): MonthCycleInfo[] {
  const usePurnimanta = tradition === "purnimanta" || tradition === "north";
  const isKartikadi = tradition === "gujarat";

  // Scan from Nov 15 previous year to March 15 next year
  const { jdUT: scanStartJd } = getJulianDayUT(`15/11/${year - 1}`, "12:00", tz);
  const { jdUT: scanEndJd } = getJulianDayUT(`15/03/${year + 1}`, "12:00", tz);

  const cycles: MonthCycleInfo[] = [];
  let curNm = findExactNewMoon(swe, scanStartJd, 1);

  for (let step = 0; step < 18; step++) {
    if (curNm >= scanEndJd) break;
    const nextNm = findExactNewMoon(swe, curNm + 20.0, 1);
    if (nextNm <= curNm + 20.0) {
      curNm += 29.53;
      continue;
    }

    const { sun: sunCurr } = getSunMoonSidereal(swe, curNm);
    const { sun: sunNext } = getSunMoonSidereal(swe, nextNm);
    const rashiCurr = Math.floor(sunCurr / 30);
    const rashiNext = Math.floor(sunNext / 30);

    const isLeap = rashiCurr === rashiNext;
    const baseAmantaMasa = (rashiCurr + 1) % 12;

    let isNija = false;
    if (!isLeap) {
      const prevNm = findExactNewMoon(swe, curNm - 1.0, -1);
      const { sun: prevSun } = getSunMoonSidereal(swe, prevNm);
      const prevRashi = Math.floor(prevSun / 30);
      if (prevRashi === rashiCurr) {
        isNija = true;
      }
    }

    let startJd = curNm;
    let endJd = nextNm;
    if (usePurnimanta) {
      startJd = findExactFullMoon(swe, curNm, -1);
      endJd = findExactFullMoon(swe, nextNm, -1);
    }

    const approxStartDate = jdToLocalDate(startJd, tz);
    const sSunrise = calcAstronomicalSunriseSunset(
      approxStartDate.year,
      approxStartDate.month,
      approxStartDate.day,
      lat,
      lon,
      tz
    ).sunriseJd;
    let startDate = approxStartDate;
    if (startJd >= sSunrise) {
      const nextD = new Date(Date.UTC(approxStartDate.year, approxStartDate.month - 1, approxStartDate.day + 1));
      startDate = { year: nextD.getUTCFullYear(), month: nextD.getUTCMonth() + 1, day: nextD.getUTCDate() };
    }

    const approxEndDate = jdToLocalDate(endJd, tz);
    const eSunrise = calcAstronomicalSunriseSunset(
      approxEndDate.year,
      approxEndDate.month,
      approxEndDate.day,
      lat,
      lon,
      tz
    ).sunriseJd;
    let nextStartDate = approxEndDate;
    if (endJd >= eSunrise) {
      const nextD = new Date(Date.UTC(approxEndDate.year, approxEndDate.month - 1, approxEndDate.day + 1));
      nextStartDate = { year: nextD.getUTCFullYear(), month: nextD.getUTCMonth() + 1, day: nextD.getUTCDate() };
    }

    const days: Array<{ year: number; month: number; day: number }> = [];
    let curDayDate = new Date(Date.UTC(startDate.year, startDate.month - 1, startDate.day));
    const endDayDate = new Date(Date.UTC(nextStartDate.year, nextStartDate.month - 1, nextStartDate.day));

    let count = 0;
    while (curDayDate < endDayDate && count < 32) {
      days.push({
        year: curDayDate.getUTCFullYear(),
        month: curDayDate.getUTCMonth() + 1,
        day: curDayDate.getUTCDate(),
      });
      curDayDate.setUTCDate(curDayDate.getUTCDate() + 1);
      count++;
    }
    if (days.length < 29) {
      while (days.length < 29) {
        days.push({
          year: curDayDate.getUTCFullYear(),
          month: curDayDate.getUTCMonth() + 1,
          day: curDayDate.getUTCDate(),
        });
        curDayDate.setUTCDate(curDayDate.getUTCDate() + 1);
      }
    } else if (days.length > 30) {
      days.length = 30;
    }

    const isAfterNewYear = isKartikadi
      ? baseAmantaMasa >= 7 || startDate.month >= 11
      : startDate.month >= 4 || (startDate.month === 3 && baseAmantaMasa === 0);

    const vikramSamvat = isAfterNewYear ? startDate.year + 57 : startDate.year + 56;
    const shakaSamvat =
      startDate.month >= 4 || (startDate.month === 3 && baseAmantaMasa === 0)
        ? startDate.year - 78
        : startDate.year - 79;

    cycles.push({
      startDate,
      days,
      masaIndex: baseAmantaMasa,
      isAdhik: isLeap,
      isNija,
      vikramSamvat,
      shakaSamvat,
    });

    curNm = nextNm;
  }

  return cycles;
}

/**
 * Compute Monthly Panchanga Calendar in the browser using WASM
 */
export async function computeClientCalendar(payload: {
  year: number;
  month: number;
  lat: number;
  lon: number;
  timezone: number;
  tradition?: string;
  view_mode?: string;
  lunar_masa?: number;
  masa_type?: string;
  is_adhik?: boolean;
}): Promise<any> {
  const swe = await initSwissEphemeris();

  const year = Number(payload.year);
  const month = Number(payload.month);
  const lat = Number(payload.lat);
  const lon = Number(payload.lon);
  const tz = Number(payload.timezone ?? 5.5);
  const tradition = (payload.tradition || "gujarat").toLowerCase();
  const isLunarView = (payload.view_mode || "lunar").toLowerCase() === "lunar";
  const isAdhikTarget = payload.is_adhik ?? payload.masa_type === "adhik";

  const isPurnimanta = tradition === "purnimanta" || tradition === "north";
  const isGujarat = tradition === "gujarat";

  // Pre-calculate full year lunar cycles
  const cycles = getYearLunarCycles(swe, year, tradition, lat, lon, tz);

  const yearCycles = cycles.filter(
    (c) =>
      c.startDate.year === year ||
      (c.startDate.year === year - 1 && c.masaIndex >= 10 && isPurnimanta)
  );

  const seen = new Set<string>();
  const availableMasas: Array<{
    index: number;
    name: string;
    is_adhik: boolean;
    masa_type: string;
    masa_id: string;
  }> = [];

  for (const c of yearCycles) {
    const key = `${c.masaIndex}_${c.isAdhik}`;
    if (!seen.has(key)) {
      seen.add(key);
      const mName = MASA_NAMES[c.masaIndex] || "Chaitra";
      const mType = c.isAdhik ? "adhik" : c.isNija ? "nija" : "regular";
      availableMasas.push({
        index: c.masaIndex,
        name: mName,
        is_adhik: c.isAdhik,
        masa_type: mType,
        masa_id: `${year}_${mName.toLowerCase()}_${mType}`,
      });
    }
  }

  // Sort available masas according to tradition sequence
  if (isGujarat) {
    availableMasas.sort((a, b) => {
      const orderA = a.index >= 7 ? a.index - 7 : a.index + 5;
      const orderB = b.index >= 7 ? b.index - 7 : b.index + 5;
      return orderA * 2 + (a.is_adhik ? 0 : 1) - (orderB * 2 + (b.is_adhik ? 0 : 1));
    });
  } else {
    availableMasas.sort((a, b) => {
      return a.index * 2 + (a.is_adhik ? 0 : 1) - (b.index * 2 + (b.is_adhik ? 0 : 1));
    });
  }

  let datesToCalculate: Array<{ year: number; month: number; day: number }> = [];
  let primaryMasaIdx = 0;
  let calcStartDate = "";
  let calcEndDate = "";
  let monthIsAdhik = false;
  let monthIsNija = false;

  if (isLunarView) {
    let targetMasa = payload.lunar_masa != null ? payload.lunar_masa % 12 : undefined;
    if (targetMasa == null) {
      const { jdUT: refJd } = getJulianDayUT(
        `15/${String(Math.min(12, month)).padStart(2, "0")}/${year}`,
        "12:00",
        tz
      );
      const { lunarMonth } = getLunarMonthInfo(swe, refJd, isPurnimanta);
      targetMasa = lunarMonth;
    }

    const matched =
      cycles.find(
        (c) =>
          c.masaIndex === targetMasa &&
          (isAdhikTarget ? c.isAdhik : !c.isAdhik) &&
          c.startDate.year === year
      ) ||
      cycles.find(
        (c) =>
          c.masaIndex === targetMasa &&
          (isAdhikTarget ? c.isAdhik : !c.isAdhik) &&
          (c.startDate.year === year || c.startDate.year === year + 1)
      ) ||
      cycles.find(
        (c) => c.masaIndex === targetMasa && (isAdhikTarget ? c.isAdhik : !c.isAdhik)
      ) ||
      cycles.find((c) => c.masaIndex === targetMasa) ||
      cycles[0];

    datesToCalculate = matched.days;
    primaryMasaIdx = matched.masaIndex;
    calcStartDate = `${String(matched.startDate.day).padStart(2, "0")}/${String(matched.startDate.month).padStart(2, "0")}/${matched.startDate.year}`;
    const endD = matched.days[matched.days.length - 1] || matched.startDate;
    calcEndDate = `${String(endD.day).padStart(2, "0")}/${String(endD.month).padStart(2, "0")}/${endD.year}`;
    monthIsAdhik = matched.isAdhik;
    monthIsNija = matched.isNija;
  } else {
    const daysInMonth = new Date(year, month, 0).getDate();
    datesToCalculate = [];
    for (let d = 1; d <= daysInMonth; d++) {
      datesToCalculate.push({ year, month, day: d });
    }
    calcStartDate = `01/${String(month).padStart(2, "0")}/${year}`;
    calcEndDate = `${String(daysInMonth).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
    primaryMasaIdx = (month + 7) % 12;
  }

  const days: any[] = [];
  let primaryMasa = "";
  let primaryVikram = year + 57;
  let primaryShaka = year - 78;
  let primarySamvatsara = "";
  let primaryRitu = "";
  let primaryAyana = "";

  for (let idx = 0; idx < datesToCalculate.length; idx++) {
    const dObj = datesToCalculate[idx];
    const dayStr = `${String(dObj.day).padStart(2, "0")}/${String(dObj.month).padStart(2, "0")}/${dObj.year}`;
    const dateObj = new Date(Date.UTC(dObj.year, dObj.month - 1, dObj.day));
    const dayOfWeek = dateObj.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
    const weekdayIdx = (dateObj.getUTCDay() + 6) % 7; // Monday = 0

    try {
      // Calculate chart at midday (12:00) exactly as in the Parashari backend
      const chartRes = await computeClientChart({
        date: dayStr,
        time: "12:00",
        lat,
        lon,
        timezone: tz,
        city: "",
      });

      const p = chartRes.panchanga || {};
      const tithiIdx = p.tithi?.index || 1;
      const isEkadashi = tithiIdx === 11 || tithiIdx === 26;
      const isPradosh = tithiIdx === 13 || tithiIdx === 28;
      const isPurnima = tithiIdx === 15;
      const isAmavasya = tithiIdx === 30;

      const vrats: string[] = Array.isArray(p.vrats) ? [...p.vrats] : [];
      if (isEkadashi && !vrats.includes("Ekadashi Vrat")) vrats.push("Ekadashi Vrat");
      if (isPradosh && !vrats.includes("Pradosh Vrat")) vrats.push("Pradosh Vrat");
      if (isPurnima && !vrats.some((v) => v.includes("Purnima"))) vrats.push("Purnima Vrat / Satyanarayan");
      if (isAmavasya && !vrats.some((v) => v.includes("Amavasya"))) vrats.push("Amavasya / Pitru Tarpan");
      if (tithiIdx === 4 && !vrats.includes("Vinayaka Chaturthi")) vrats.push("Vinayaka Chaturthi");
      if (tithiIdx === 19 && !vrats.includes("Sankashti Chaturthi")) vrats.push("Sankashti Chaturthi");

      // Saṅkrānti detection between today's sunrise and tomorrow's sunrise
      const sunriseJd = chartRes.sunriseJd;
      const nextSunriseJd = chartRes.nextSunriseJd || sunriseJd + 1.0;
      const sankrantiInfo = checkDaySankranti(swe, sunriseJd, nextSunriseJd);
      const isSankranti = !!sankrantiInfo;
      if (sankrantiInfo) {
        let sankrantiLabel = `${sankrantiInfo.signName} Sankranti`;
        if (sankrantiInfo.signName === "Capricorn") {
          sankrantiLabel = "Makar Sankranti / Pongal / Uttarayana";
        } else if (sankrantiInfo.signName === "Aries") {
          sankrantiLabel = "Mesha Sankranti / Vaisakhi / Solar New Year";
        } else if (sankrantiInfo.signName === "Cancer") {
          sankrantiLabel = "Karka Sankranti / Dakshinayana";
        } else if (sankrantiInfo.signName === "Libra") {
          sankrantiLabel = "Tula Sankranti";
        }
        if (!vrats.some((v) => v.includes("Sankranti"))) {
          vrats.push(sankrantiLabel);
        }
      }

      if (p.festival && !vrats.includes(p.festival)) {
        vrats.push(p.festival);
      }

      const mAmanta = p.masa_amanta || "Kartika";
      const mPurnimanta = p.masa_purnimanta || "Margashirsha";

      if (idx === 14 || !primaryMasa) {
        primaryMasa = isLunarView
          ? monthIsAdhik
            ? `Adhik ${MASA_NAMES[primaryMasaIdx]}`
            : MASA_NAMES[primaryMasaIdx]
          : tradition === "amanta"
          ? mAmanta
          : mPurnimanta;
        primaryVikram = p.vikram_samvat || year + 57;
        primaryShaka = p.shaka_samvat || year - 78;
        primarySamvatsara = p.samvatsara_name || "";
        primaryRitu = p.ritu || "";
        primaryAyana = p.ayana || "";
      }

      days.push({
        date: dayStr,
        day_of_month: dObj.day,
        tithi_day_number: idx + 1,
        day_of_week: dayOfWeek,
        vara_sanskrit: VARA_SANSKRIT[weekdayIdx] || "Ravivara",
        tithi_name: p.tithi?.name || "Pratipada",
        tithi_index: tithiIdx,
        paksha: p.paksha || "Shukla",
        nakshatra_name: p.nakshatra?.name || "Ashwini",
        yoga_name: p.yoga?.name || "Vishkambha",
        karana_name: p.karana?.name || "Bava",
        masa_amanta: mAmanta,
        masa_purnimanta: mPurnimanta,
        is_adhika: monthIsAdhik,
        ritu: p.ritu || primaryRitu,
        ayana: p.ayana || primaryAyana,
        vikram_samvat: p.vikram_samvat || primaryVikram,
        shaka_samvat: p.shaka_samvat || primaryShaka,
        sunrise: p.sunrise || "06:45",
        sunset: p.sunset || "17:35",
        rahu_kaal: p.rahu_kaal || "N/A",
        abhijit_muhurat: p.abhijit_muhurat || "N/A",
        vrats,
        is_ekadashi: isEkadashi,
        is_pradosh: isPradosh,
        is_purnima: isPurnima,
        is_amavasya: isAmavasya,
        is_sankranti: isSankranti,
        festival: p.festival || null,
      });
    } catch (dayErr) {
      console.warn("Failed calculating calendar day:", dayStr, dayErr);
    }
  }

  const masaTypeStr = monthIsAdhik ? "adhik" : monthIsNija ? "nija" : "regular";
  const masaIdStr = `${year}_${(MASA_NAMES[primaryMasaIdx] || "chaitra").toLowerCase()}_${masaTypeStr}`;

  return {
    requested_year: year,
    requested_month: month,
    tradition: tradition === "amanta" ? "Amanta" : "Purnimanta",
    view_mode: isLunarView ? "lunar" : "gregorian",
    primary_masa: primaryMasa,
    primary_masa_index: primaryMasaIdx,
    is_adhika: monthIsAdhik,
    masa_type: masaTypeStr,
    masa_id: masaIdStr,
    primary_vikram_samvat: primaryVikram,
    primary_shaka_samvat: primaryShaka,
    primary_samvatsara: primarySamvatsara,
    primary_ritu: primaryRitu,
    primary_ayana: primaryAyana,
    start_date: calcStartDate,
    end_date: calcEndDate,
    days,
    available_masas: availableMasas,
  };
}
