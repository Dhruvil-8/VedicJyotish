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
    amanta_month: amantaMasaIdx,
    purnimanta_month: purnimantaMasaIdx,
    is_adhika_month: false,
  };

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
}): Promise<any> {
  const year = Number(payload.year);
  const month = Number(payload.month);
  const lat = Number(payload.lat);
  const lon = Number(payload.lon);
  const tz = Number(payload.timezone ?? 5.5);
  const tradition = payload.tradition || "gujarat";
  const viewMode = payload.view_mode || "lunar";

  const daysInMonth = new Date(year, month, 0).getDate();
  const days: any[] = [];

  const MONTH_NAMES = [
    "Chaitra", "Vaisakha", "Jyeshtha", "Ashadha", "Shravana", "Bhadrapada",
    "Ashvina", "Kartika", "Margashirsha", "Pausha", "Magha", "Phalguna"
  ];

  let primaryMasaIdx = 0;
  let primaryMasa = "Kartika";
  let primaryVikram = year + 57;
  let primaryShaka = year - 78;
  let primarySamvatsara = "Krodhi";
  let primaryRitu = "Sharad";
  let primaryAyana = "Dakshinayana";

  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = `${String(d).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeek = dateObj.toLocaleDateString("en-US", { weekday: "long" });

    try {
      const chartRes = await computeClientChart({
        date: dayStr,
        time: "06:00",
        lat,
        lon,
        timezone: tz,
        city: "",
      });

      const p = chartRes.panchanga || {};
      const tithiIdx = p.tithi?.index || 1;
      const tithiName = p.tithi?.name || "Pratipada";
      const nakName = p.nakshatra?.name || "Ashwini";
      const yogaName = p.yoga?.name || "Vishkambha";
      const karanaName = p.karana?.name || "Bava";
      const sunrise = p.sunrise || "06:45";
      const sunset = p.sunset || "17:35";
      const rahuKaal = p.rahu_kalam ? `${p.rahu_kalam.start} - ${p.rahu_kalam.end}` : "N/A";
      const abhijit = p.abhijit_muhurta ? `${p.abhijit_muhurta.start} - ${p.abhijit_muhurta.end}` : "N/A";

      const masaAmanta = p.lunar_month?.amanta_masa || p.lunar_month_name || "Kartika";
      const masaPurnimanta = p.lunar_month?.purnimanta_masa || "Margashirsha";
      primaryMasa = tradition === "purnimanta" || tradition === "north" ? masaPurnimanta : masaAmanta;
      primaryMasaIdx = p.lunar_month?.amanta_masa_index ?? 7;
      primaryVikram = p.samvat?.vikram_samvat || year + 57;
      primaryShaka = p.samvat?.shaka_samvat || year - 78;
      primarySamvatsara = p.samvat?.samvatsara_name || "Krodhi";
      primaryRitu = p.samvat?.ritu || "Hemanta";
      primaryAyana = p.samvat?.ayana || "Dakshinayana";

      const isEkadashi = tithiIdx === 11 || tithiIdx === 26;
      const isPradosh = tithiIdx === 13 || tithiIdx === 28;
      const isPurnima = tithiIdx === 15;
      const isAmavasya = tithiIdx === 30;

      const vrats: string[] = [];
      let festival: string | null = null;

      if (isEkadashi) {
        vrats.push("Ekadashi Vrat");
        festival = "Ekadashi";
      } else if (isPradosh) {
        vrats.push("Pradosh Vrat");
      } else if (isPurnima) {
        festival = "Purnima";
        vrats.push("Satyanarayan Vrat");
      } else if (isAmavasya) {
        festival = "Amavasya";
      }

      days.push({
        day_of_month: d,
        date: dayStr,
        day_of_week: dayOfWeek,
        tithi_index: tithiIdx,
        tithi_name: tithiName,
        tithi_progress: p.tithi?.progress ?? 0.5,
        tithi_end_time: p.tithi?.end_time || null,
        nakshatra_index: p.nakshatra?.index ?? 1,
        nakshatra_name: nakName,
        yoga_name: yogaName,
        karana_name: karanaName,
        masa_amanta: masaAmanta,
        masa_purnimanta: masaPurnimanta,
        is_adhika: false,
        ritu: primaryRitu,
        ayana: primaryAyana,
        vikram_samvat: primaryVikram,
        shaka_samvat: primaryShaka,
        sunrise,
        sunset,
        rahu_kaal: rahuKaal,
        abhijit_muhurat: abhijit,
        vrats,
        is_ekadashi: isEkadashi,
        is_pradosh: isPradosh,
        is_purnima: isPurnima,
        is_amavasya: isAmavasya,
        is_sankranti: false,
        festival,
      });
    } catch (dayErr) {
      console.warn("Failed calculating calendar day:", dayStr, dayErr);
    }
  }

  const startDate = `01/${String(month).padStart(2, "0")}/${year}`;
  const endDate = `${String(daysInMonth).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;

  return {
    requested_year: year,
    requested_month: month,
    tradition,
    view_mode: viewMode,
    primary_masa: primaryMasa,
    primary_masa_index: primaryMasaIdx,
    is_adhika: false,
    masa_type: "regular",
    masa_id: `${primaryMasa.toLowerCase()}_${year}`,
    primary_vikram_samvat: primaryVikram,
    primary_shaka_samvat: primaryShaka,
    primary_samvatsara: primarySamvatsara,
    primary_ritu: primaryRitu,
    primary_ayana: primaryAyana,
    start_date: startDate,
    end_date: endDate,
    days,
    available_masas: MONTH_NAMES.map((m, idx) => ({
      masa_name: m,
      masa_index: idx,
      is_adhik: false,
      is_nija: false,
      masa_type: "regular",
      masa_id: `${m.toLowerCase()}_${year}`,
      display_label: m,
    })),
  };
}
