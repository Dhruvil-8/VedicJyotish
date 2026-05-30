const isClient = typeof window !== "undefined";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 
  (isClient ? `${window.location.protocol}//${window.location.hostname}:7860` : "http://127.0.0.1:7860");
const API_KEY = process.env.NEXT_PUBLIC_APP_TOKEN || "";


const getHeaders = (extraHeaders: Record<string, string> = {}) => {
  const headers: Record<string, string> = { ...extraHeaders };
  if (API_KEY) {
    headers["X-API-Key"] = API_KEY;
  }
  return headers;
};

const SENSITIVE_CHART_KEYS = new Set([
  "date",
  "time",
  "birth_date",
  "birth_time",
  "date_of_birth",
  "time_of_birth",
  "dob",
  "location",
  "city",
  "lat",
  "lon",
  "latitude",
  "longitude",
  "timezone",
  "tz",
]);

export const sanitizeChartForAi = (value: any): any => {
  if (Array.isArray(value)) {
    return value.map(sanitizeChartForAi);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !SENSITIVE_CHART_KEYS.has(key.toLowerCase()))
        .map(([key, nestedValue]) => [key, sanitizeChartForAi(nestedValue)])
    );
  }

  return value;
};

export const searchCity = async (query: string) => {
  if (query.length < 3) return [];
  const res = await fetch(`${API_BASE}/search_city?query=${encodeURIComponent(query)}`, {
    headers: getHeaders(),
  });
  if (!res.ok) return [];
  return res.json();
};

export const calculateChart = async (data: any) => {
  const res = await fetch(`${API_BASE}/calculate_chart`, {
    method: "POST",
    headers: getHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    // Attach the response so callers can parse the validation error body
    const err: any = new Error("Calculation failed");
    err.response = res;
    throw err;
  }
  return res.json();
};

// --- SSE Stream Reader (shared by chat and report) ---
async function readSSEStream(
  response: Response,
  onChunk: (text: string) => void,
  onDone?: () => void,
  onError?: (msg: string) => void
) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine.startsWith("data: ")) continue;
      try {
        const payload = JSON.parse(cleanLine.slice(6));
        if (payload.text) {
          onChunk(payload.text);
        } else if (payload.done) {
          onDone?.();
        } else if (payload.error) {
          onError?.(payload.error);
        }
      } catch (err) {
        console.error("Malformed SSE line parsing failed:", cleanLine, err);
      }
    }
  }
}

export const generateReportStream = async (
  payload: any,
  onChunk: (text: string) => void,
  onDone?: () => void,
  onError?: (msg: string) => void
) => {
  const aiPayload = sanitizeChartForAi(payload);
  const res = await fetch(`${API_BASE}/generate_report`, {
    method: "POST",
    headers: getHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(aiPayload),
  });
  if (!res.ok) throw new Error("Report generation failed");
  await readSSEStream(res, onChunk, onDone, onError);
};

export const chatWithAstrologerStream = async (
  payload: any,
  onChunk: (text: string) => void,
  onDone?: () => void,
  onError?: (msg: string) => void
) => {
  const aiPayload = {
    ...payload,
    chart_data: sanitizeChartForAi(payload?.chart_data),
  };
  const res = await fetch(`${API_BASE}/chat_with_astrologer`, {
    method: "POST",
    headers: getHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(aiPayload),
  });
  if (!res.ok) throw new Error("Chat failed");
  await readSSEStream(res, onChunk, onDone, onError);
};

export const calculateCompatibility = async (payload: any) => {
  const res = await fetch(`${API_BASE}/api/v1/match/compatibility`, {
    method: "POST",
    headers: getHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err: any = new Error("Compatibility calculation failed");
    err.response = res;
    throw err;
  }
  return res.json();
};

