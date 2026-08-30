export interface CachedLocation {
  name: string;
  lat: number;
  lon: number;
  timezone: number;
}

const LOCATION_STORAGE_KEY = "vedic_jyotish_user_location";

export const DEFAULT_LOCATION: CachedLocation = {
  name: "New Delhi, Delhi, India",
  lat: 28.6139,
  lon: 77.209,
  timezone: 5.5,
};

export function getCachedLocation(): CachedLocation {
  if (typeof window === "undefined") return DEFAULT_LOCATION;
  try {
    const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        parsed.name &&
        typeof parsed.lat === "number" &&
        typeof parsed.lon === "number"
      ) {
        return {
          name: parsed.name,
          lat: parsed.lat,
          lon: parsed.lon,
          timezone: typeof parsed.timezone === "number" ? parsed.timezone : 5.5,
        };
      }
    }
  } catch (e) {
    console.error("Error reading cached location:", e);
  }
  return DEFAULT_LOCATION;
}

export function setCachedLocation(loc: CachedLocation) {
  if (typeof window === "undefined" || !loc) return;
  try {
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(loc));
    window.dispatchEvent(
      new CustomEvent("vedic_location_changed", { detail: loc })
    );
  } catch (e) {
    console.error("Error saving cached location:", e);
  }
}
