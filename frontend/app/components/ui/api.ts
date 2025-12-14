const API_BASE = "http://127.0.0.1:8000";

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
  if (!res.ok) throw new Error("Calculation failed");
  return res.json();
};

export const chatWithAstrologer = async (payload: any) => {
  const res = await fetch(`${API_BASE}/chat_with_astrologer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Chat failed");
  return res.json();
};