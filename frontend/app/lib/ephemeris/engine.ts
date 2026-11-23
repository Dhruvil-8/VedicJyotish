// In-browser WebAssembly calculation engine
// Combines Swiss Ephemeris WASM (for planetary positions & houses)
// with vedic_wasm (for pure Parashari calculations, D1-D60, Shadbala, Ashtakavarga, Dashas, Yogas, Panchanga).
// Zero network calls, zero backend server required.

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
const SE_URANUS = 7;
const SE_NEPTUNE = 8;
const SE_PLUTO = 9;
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
    // Dynamic import of emscripten swisseph factory
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
    // In browser, load from public static URL
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
  let utDecimalHour = localDecimalHour - tzOffsetHours;

  // Standard Julian Day formula for Gregorian calendar
  let y = year;
  let m = month;
  let d = day + utDecimalHour / 24.0;

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
 * Approximate Sunrise and Sunset Julian Days from Lat, Lon and Sun Longitude
 */
function approximateSunriseSunset(
  jdUT: number,
  lat: number,
  lon: number,
  sunTropicalLong: number,
  tzOffsetHours: number
): { sunriseJd: number; sunsetJd: number } {
  const rad = Math.PI / 180.0;
  // Sun declination
  const sinDec = Math.sin(23.44 * rad) * Math.sin(sunTropicalLong * rad);
  const dec = Math.asin(sinDec);

  // Hour angle for sunrise/sunset (zenith = 90°50' = 90.8333°)
  const cosH0 =
    (Math.sin(-0.8333 * rad) - Math.sin(lat * rad) * Math.sin(dec)) /
    (Math.cos(lat * rad) * Math.cos(dec));

  let H0 = 90; // Default fallback: 6 hours
  if (cosH0 >= -1 && cosH0 <= 1) {
    H0 = Math.acos(cosH0) / rad;
  }

  // Solar noon in UT approximately
  // Noon in local time is 12:00 -> UT is 12:00 - tzOffsetHours - (lon - tzOffset*15)/15
  const solarNoonUT = 12.0 - lon / 15.0; // in hours
  const sunriseUT = solarNoonUT - H0 / 15.0;
  const sunsetUT = solarNoonUT + H0 / 15.0;

  // Offset from current day midnight
  const jdMidnight = Math.floor(jdUT - 0.5) + 0.5;
  const sunriseJd = jdMidnight + sunriseUT / 24.0;
  const sunsetJd = jdMidnight + sunsetUT / 24.0;

  return { sunriseJd, sunsetJd };
}

/**
 * Compute Vedic Chart in the browser using WASM
 */
export async function computeClientChart(data: any): Promise<any> {
  const [swe, wasm] = await Promise.all([initSwissEphemeris(), initVedicWasm()]);

  const tz = Number(data.timezone ?? 5.5);
  const lat = Number(data.lat);
  const lon = Number(data.lon);

  const { jdUT } = getJulianDayUT(data.date, data.time, tz);

  // Set Lahiri Sidereal Mode (1 = SE_SIDM_LAHIRI)
  const setSidMode = swe.cwrap("swe_set_sid_mode_wrap", null, ["number", "number", "number"]);
  const getAyanamsa = swe.cwrap("swe_get_ayanamsa_ut_wrap", "number", ["number"]);
  setSidMode(1, 0, 0);

  const ayanamsa = getAyanamsa(jdUT);

  // Calculate Houses & Ascendant
  // House system: 'W' for WholeSign, 'P' for Placidus
  const houseSysCode = (data.profile?.house_system === "Placidus") ? 80 : 87; // 'W' = 87
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

  // Calculate Planetary Coordinates
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
    { name: "Rahu", id: (data.profile?.node_type === "True") ? SE_TRUE_NODE : SE_MEAN_NODE },
    { name: "Uranus", id: SE_URANUS },
    { name: "Neptune", id: SE_NEPTUNE },
    { name: "Pluto", id: SE_PLUTO },
  ];

  const rawPlanets: Array<{ name: string; longitude: number; speed: number }> = [];
  let sunTropicalLong = 0;

  for (const p of planetsToCalc) {
    swe.ccall(
      "swe_calc_ut_wrap",
      "number",
      ["number", "number", "number", "number", "number"],
      [jdUT, p.id, CALC_FLAGS, xxPtr, serrPtr]
    );
    const lon = swe.getValue(xxPtr, "double");
    const speed = swe.getValue(xxPtr + 24, "double");

    if (p.name === "Sun") {
      sunTropicalLong = (lon + ayanamsa) % 360;
    }

    rawPlanets.push({
      name: p.name,
      longitude: lon,
      speed: speed,
    });

    if (p.name === "Rahu") {
      // Ketu is 180° opposite Rahu
      const ketuLon = (lon + 180) % 360;
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

  // Approximate Sunrise & Sunset
  const { sunriseJd, sunsetJd } = approximateSunriseSunset(
    jdUT,
    lat,
    lon,
    sunTropicalLong,
    tz
  );

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
    next_sunrise_jd: sunriseJd + 1.0,
    amanta_month: null,
    purnimanta_month: null,
    is_adhika_month: null,
  };

  // Compute full chart through pure Rust WASM
  const chartJson = wasm.compute_chart_wasm(JSON.stringify(coreInput));
  return JSON.parse(chartJson);
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
  const [swe, wasm] = await Promise.all([initSwissEphemeris(), initVedicWasm()]);

  // Compute chart input for the given muhurtha date/time
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
      ayanamsa_value: chartRes.ayanamsa_value || 24.0,
      house_cusps: chartRes.house_cusps || [],
      planets: chartRes.planetary_table.map((p: any) => ({
        name: p.name,
        longitude: p.longitude,
        speed: p.speed,
      })),
      profile: null,
      current_saturn_longitude: null,
      sunrise_jd: chartRes.panchanga?.sunrise_jd || null,
      sunset_jd: chartRes.panchanga?.sunset_jd || null,
      next_sunrise_jd: null,
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
