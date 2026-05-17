const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export const searchCity = async (query: string) => {
  if (query.length < 3) return [];
  const res = await fetch(`${API_BASE}/search_city?query=${query}`);
  if (!res.ok) return [];
  return res.json();
};

export const calculateChart = async (data: any) => {
  const res = await fetch(`${API_BASE}/calculate_chart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
      if (!line.startsWith("data: ")) continue;
      try {
        const payload = JSON.parse(line.slice(6));
        if (payload.text) {
          onChunk(payload.text);
        } else if (payload.done) {
          onDone?.();
        } else if (payload.error) {
          onError?.(payload.error);
        }
      } catch {
        // skip malformed SSE lines
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
  const res = await fetch(`${API_BASE}/generate_report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
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
  const res = await fetch(`${API_BASE}/chat_with_astrologer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Chat failed");
  await readSSEStream(res, onChunk, onDone, onError);
};