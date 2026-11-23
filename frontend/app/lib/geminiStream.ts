// Serverless Gemini streaming integration for Next.js Edge / Serverless functions
// Allows report generation and chat directly via Google's Gemini API without needing a Rust backend.

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

function sanitizeForAi(value: any): any {
  const sensitiveKeys = new Set([
    "time",
    "birth_time",
    "time_of_birth",
    "location",
    "city",
    "lat",
    "lon",
    "latitude",
    "longitude",
    "timezone",
    "tz",
    "name",
    "email",
    "address",
  ]);

  if (Array.isArray(value)) {
    return value.map(sanitizeForAi);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([k]) => !sensitiveKeys.has(k.toLowerCase()))
        .map(([k, v]) => [k, sanitizeForAi(v)])
    );
  }
  return value;
}

function buildReportPrompt(chart: any): string {
  const sanitized = sanitizeForAi(chart);

  // Planetary table summary
  let planetLines: string[] = [];
  if (Array.isArray(sanitized.planetary_table)) {
    planetLines = sanitized.planetary_table.map((p: any) => {
      const flags = [];
      if (p.retrograde) flags.push("Retrograde");
      if (p.combust) flags.push("Combust");
      const flagStr = flags.length > 0 ? ` [${flags.join(", ")}]` : "";
      return `  ${p.name}: ${p.sign} (House ${p.house}, ${p.dignity}, Nakshatra: ${p.nakshatra} Pada ${p.pada}, Navamsa: ${p.navamsa_sign}${flagStr})`;
    });
  }

  // Navamsa lines
  let navamsaLines: string[] = [];
  if (sanitized.navamsa_chart && typeof sanitized.navamsa_chart === "object") {
    for (let h = 1; h <= 12; h++) {
      const hdata = sanitized.navamsa_chart[`house_${h}`];
      if (hdata) {
        const pList = Array.isArray(hdata.planets) ? hdata.planets.join(", ") : "Empty";
        navamsaLines.push(`  House ${h} (${hdata.sign}): ${pList}`);
      }
    }
  }

  // Yogas summary
  let yogaLines: string[] = [];
  if (Array.isArray(sanitized.yogas)) {
    yogaLines = sanitized.yogas.map(
      (y: any) => `  ${y.name} (${y.type}): ${y.description || ""}`
    );
  }
  const yogaStr = yogaLines.length > 0 ? yogaLines.join("\n") : "  None detected";

  // Ascendant and Moon
  const ascSign = sanitized.ascendant?.sign || "?";
  const ascDeg = Number(sanitized.ascendant?.degree || 0).toFixed(2);
  const moonSign = sanitized.moon_intelligence?.sign || "?";
  const moonNak = sanitized.moon_intelligence?.nakshatra || "?";
  const moonPada = sanitized.moon_intelligence?.pada || 0;
  const moonStrength = sanitized.moon_intelligence?.strength || "?";
  const navLagna = sanitized.navamsa_chart?.house_1?.sign || "?";

  // Dasha summary
  let currentMaha = "Unknown";
  let currentAntar = "Unknown";
  if (Array.isArray(sanitized.dasha?.major_periods)) {
    const now = new Date();
    for (const d of sanitized.dasha.major_periods) {
      const dStart = new Date(d.start_date);
      const dEnd = new Date(d.end_date);
      if (now >= dStart && now <= dEnd) {
        currentMaha = `${d.planet} (${d.start_date} - ${d.end_date})`;
        if (Array.isArray(d.sub_periods)) {
          for (const sub of d.sub_periods) {
            const sStart = new Date(sub.start_date);
            const sEnd = new Date(sub.end_date);
            if (now >= sStart && now <= sEnd) {
              currentAntar = `${sub.planet} (${sub.start_date} - ${sub.end_date})`;
              break;
            }
          }
        }
        break;
      }
    }
  }

  const birthDate = sanitized.birth_date || "";
  const analysisDate = new Date().toUTCString();
  const language = chart.language || "English";

  const chartContext = `COMPLETE BIRTH CHART ANALYSIS DATA:
Analysis Date/Time (Current Reference): ${analysisDate}
${birthDate ? `Subject Chronological Context: Date of Birth: ${birthDate}` : ""}

Ascendant: ${ascSign} (${ascDeg}°)
Moon: ${moonSign} in ${moonNak} Pada ${moonPada} (${moonStrength})

Current Running Period:
  Maha Dasha: ${currentMaha}
  Antar Dasha: ${currentAntar}

Planetary Positions (D1 Rasi):
${planetLines.join("\n")}

Navamsa Chart (D9):
  Navamsa Lagna: ${navLagna}
${navamsaLines.join("\n")}

Yogas Detected:
${yogaStr}`;

  return `You are an AI-powered Vedic Astrology analysis engine. Analyze this birth chart data and create a deeply comprehensive, insightful, and well-structured 3-page report referencing EVERY piece of verified astronomical and astrological data provided. The report must provide actionable psychological, professional, and spiritual insights rather than generic textbook explanations. Write the entire report and all sections strictly in the ${language} language.

CRITICAL RULES:
- Do NOT include any introductory preamble, greetings, or flowery opening paragraphs
- Do NOT include placeholders like "[Client Name]" or "[Your Name]"
- Do NOT roleplay or claim years of experience
- Start DIRECTLY with the first analysis section heading

${chartContext}

REPORT STRUCTURE (cover ALL sections in extensive detail):

## 1. Ascendant, Soul Purpose & Personality Profile
- Highly detailed analysis of the Ascendant sign, its lord, and its placement across house/sign coordinates. Explain what this indicates about the native's physical constitution, core temperament, and life purpose.
- Discuss the Navamsa Lagna and its modifier influence: how does the inner potential (D9) reshape the external personality (D1)?
- Analyze the Moon sign, Nakshatra, and Pada in-depth. Discuss the mental and emotional patterns, psychological strengths, and emotional challenges.

## 2. Comprehensive Planetary Analysis & Dignity (Reference EVERY Single Planet)
- Conduct a rigorous analysis of EVERY planet (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu):
  - Analyze its house placement, dignity (exalted, debilitated, own, moolatrikona, friendly, neutral, inimical), and exact Nakshatra/Pada.
  - Detail any **retrograde** planets: explain their internalized focus, karmic reflections, and unique manifestation patterns.
  - Detail any **combust** planets: explain the solar purification process, hidden struggles, and how the native can resolve conflicts in their significations.
  - Synthesize planetary placements by analyzing how their Navamsa (D9) sign modifications shift their overall functional behavior.

## 3. Auspicious Yogas & Planetary Combinations
- Provide a rigorous explanation of each detected yoga (and if none are detected, mention prominent planetary alignments or near-misses):
  - Discuss the energetic signature of the yoga.
  - Detail the practical, everyday manifestation of these combinations in the native's career, personality, or spirituality.

## 4. Multi-Dimensional House-wise Analysis
- Synthesize placements and house lords to deliver detailed, comprehensive chapters on the following critical life domains:
  - **Wealth, Prosperity & Gains (2nd & 11th houses)**: Financial stability, primary resources, income generation streams, family values, and cumulative fortune.
  - **Communication, Drive & Courage (3rd house)**: Self-expression, writing, courage, technical skills, siblings, and independent effort capacity.
  - **Home, Inner Peace & Mother (4th house)**: Domestic bliss, emotional foundation, relationship with mother, real estate, vehicles, and childhood security.
  - **Creativity, Children & Intelligence (5th house)**: Analytical power, romantic inclinations, children, past life merits (Purvapunya), and speculative intelligence.
  - **Career, Reputation & Status (10th house)**: Professional trajectory, authority, relationship with superiors, societal contributions, and public recognition.
  - **Relationships, Partnerships & Marriage (7th house)**: Spousal characteristics, quality of partnerships, and how connections shape identity. Compare D1 and D9 placements.
  - **Spirituality, Fortune & Mukti (9th & 12th houses)**: Relationship with the father/gurus, higher wisdom, spiritual inclination, foreign travel, sub-conscious dreams, and eventual liberation.

## 5. Vimshottari Dasha: Time-Space Reality & Forecast
- Provide a detailed analysis of the current Maha Dasha (${currentMaha}) and Antar Dasha (${currentAntar}).
- Outline a brief chronological timeline for the next 2-3 upcoming antardasha sub-periods, explaining major focus areas.

## 6. Navamsa (D9) Deep Dive & Destiny Blueprint
- Deeply analyze the D9 Navamsa chart to uncover the soul's destination and maturity. Compare key indicators (Venus for relationships, Jupiter for wisdom and fortune, 7th lord for destiny) in D1 vs D9.

FORMATTING RULES:
- Use **bold** for all planet names, sign names, and key astrological terms.
- Use bullet points and sub-sections to break up the text logically.
- Keep paragraphs deeply analytical, logical, and practical.
- Target 1500 - 2000 words.
- Be highly specific and reference actual house numbers, signs, and degrees from the provided data.
- CRITICAL MANDATE: Under NO circumstances should you suggest any remedies, gemstones, rudraksha, mantras, yantras, rituals, totke, or pujas. In authentic Vedic Jyotish philosophy, the birth chart is an objective karmic diagnostic map. Guide the native purely through psychological awareness, cognitive strengths, emotional patterns, behavioral adjustments, personal accountability, and practical life understanding.
- End the report with this affirmative closing note on its own line: "*This report is crafted using Vedic Jyotish principles and AI-powered. Use these insights as a guiding light on your journey — for deeper personalised guidance, consult a qualified Jyotishi.*"`;
}

function buildChatRequest(chart: any, question: string, history: ChatMessage[]) {
  const sanitized = sanitizeForAi(chart);
  const language = chart.language || "English";
  const todayStr = new Date().toUTCString();

  const systemInstruction = {
    role: "user",
    parts: [
      {
        text: `You are an expert Vedic Astrologer providing analytical, psychological, and cosmic life guidance.
Today's Current Date/Time (Transit Reference): ${todayStr}
Analyze the chart.
Respond entirely and strictly in the ${language} language.

CRITICAL MANDATE: Under NO circumstances should you suggest any remedies, gemstones, rudraksha, mantras, yantras, rituals, totke, or pujas. In authentic Vedic Jyotish philosophy, the birth chart is an objective karmic diagnostic map. Guide the native purely through psychological awareness, cognitive strengths, emotional patterns, behavioral adjustments, personal accountability, and practical life understanding.

FORMATTING RULES:
1. Use **Bold** for Planet Names and Key Terms.
2. Use bullet points for lists.
3. Keep paragraphs short and crisp.`,
      },
    ],
  };

  const contents: any[] = [];
  // Initial context
  contents.push({
    role: "user",
    parts: [{ text: `Vedic Chart Data:\n${JSON.stringify(sanitized, null, 2)}` }],
  });
  contents.push({
    role: "model",
    parts: [{ text: "Understood." }],
  });

  // History
  if (Array.isArray(history)) {
    for (const msg of history) {
      contents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      });
    }
  }

  // Current question
  contents.push({
    role: "user",
    parts: [{ text: question }],
  });

  return {
    contents,
    system_instruction: systemInstruction,
  };
}

/**
 * Call Google Generative Language REST API and stream SSE events
 */
async function streamFromGemini(apiKey: string, requestBody: any): Promise<Response> {
  const model = DEFAULT_MODEL;
  let url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  let geminiRes = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  // If model fails (e.g. 404 or unsupported), attempt fallback to gemini-1.5-flash
  if (!geminiRes.ok && model !== "gemini-1.5-flash") {
    console.warn(`Model ${model} returned status ${geminiRes.status}, falling back to gemini-1.5-flash`);
    const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`;
    const fallbackRes = await fetch(fallbackUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    if (fallbackRes.ok) {
      geminiRes = fallbackRes;
    }
  }

  if (!geminiRes.ok) {
    const status = geminiRes.status;
    let errDetail = "";
    try {
      const errText = await geminiRes.text();
      const errJson = JSON.parse(errText);
      errDetail = errJson.error?.message || errText;
    } catch {
      errDetail = "Network or upstream error";
    }

    let errMsg = `AI Service temporarily unavailable (${status}: ${errDetail})`;
    if (status === 429) {
      errMsg = "The AI astrologer is currently busy. Please wait a minute and try again.";
    }
    return new Response(
      `data: ${JSON.stringify({ error: errMsg })}\n\n`,
      {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      }
    );
  }

  // Transform Gemini SSE chunks into our frontend standard SSE format
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const geminiReader = geminiRes.body?.getReader();

  const stream = new ReadableStream({
    async start(controller) {
      if (!geminiReader) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        controller.close();
        return;
      }

      let buffer = "";

      try {
        while (true) {
          const { done, value } = await geminiReader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const clean = line.trim();
            if (clean.startsWith("data: ")) {
              try {
                const chunkJson = JSON.parse(clean.slice(6));
                const candidates = chunkJson.candidates;
                if (Array.isArray(candidates)) {
                  for (const c of candidates) {
                    const parts = c.content?.parts;
                    if (Array.isArray(parts)) {
                      for (const part of parts) {
                        if (part.text) {
                          controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify({ text: part.text })}\n\n`)
                          );
                        }
                      }
                    }
                  }
                }
              } catch {}
            }
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        controller.close();
      } catch (err: any) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: "Stream interrupted." })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function handleReportStream(chartData: any, apiKey: string): Promise<Response> {
  const prompt = buildReportPrompt(chartData);
  const requestBody = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  };
  return streamFromGemini(apiKey, requestBody);
}

export async function handleChatStream(
  chartData: any,
  question: string,
  history: ChatMessage[],
  apiKey: string
): Promise<Response> {
  const requestBody = buildChatRequest(chartData, question, history);
  return streamFromGemini(apiKey, requestBody);
}
