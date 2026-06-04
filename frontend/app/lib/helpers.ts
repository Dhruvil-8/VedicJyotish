/**
 * Converts a flexible time string (e.g. "10:30", "2:30pm", "14:00") to 24-hour "HH:MM" format.
 */
export function convertTo24Hour(timeStr: string): string {
  const clean = timeStr.trim().toLowerCase();
  const isPm = clean.includes("pm");
  const isAm = clean.includes("am");
  let numbersOnly = clean.replace(/[a-z]/g, "").trim();
  numbersOnly = numbersOnly.replace(/[;.,-]/g, ":");
  const parts = numbersOnly.split(":");
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;
  if (isPm && hours < 12) {
    hours += 12;
  } else if (isAm && hours === 12) {
    hours = 0;
  }
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * Parses a date string in DD/MM/YYYY format to a JS Date object.
 */
export function parseDate(dateStr: string): Date {
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  }
  return new Date(dateStr);
}

/**
 * Formats a DD/MM/YYYY date string into a human-readable form (e.g. "14 Dec 2023").
 */
export function formatDate(dateStr: string): string {
  try {
    const d = parseDate(dateStr);
    return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

/**
 * Returns true if the current date falls within [startStr, endStr] (DD/MM/YYYY).
 */
export function isCurrent(startStr: string, endStr: string): boolean {
  const now = new Date();
  return now >= parseDate(startStr) && now <= parseDate(endStr);
}
