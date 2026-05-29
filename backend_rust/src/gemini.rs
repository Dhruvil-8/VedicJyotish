//! Gemini REST API integration for streaming report generation and chat.
//!
//! Uses the Google Generative Language REST API directly via reqwest,
//! with Server-Sent Events (SSE) streaming for real-time token delivery.

use axum::response::{sse::Event, Sse};
use futures_util::stream::Stream;
use once_cell::sync::Lazy;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::{env, pin::Pin, time::Duration};
use tokio_stream::StreamExt;
use tracing::error;

// ─── Shared HTTP Client (connection reuse across all Gemini calls) ──────────

static GEMINI_CLIENT: Lazy<Client> = Lazy::new(|| {
    Client::builder()
        .timeout(Duration::from_secs(120))
        .pool_max_idle_per_host(5)
        .build()
        .expect("Failed to create Gemini HTTP client")
});

// ─── Configuration ──────────────────────────────────────────────────────────

fn gemini_api_key() -> Option<String> {
    env::var("GEMINI_API_KEY").ok().filter(|v| !v.is_empty())
}

fn gemini_model() -> String {
    env::var("GEMINI_MODEL").unwrap_or_else(|_| "gemini-flash-lite-latest".to_string())
}

fn max_questions() -> usize {
    env::var("MAX_QUESTIONS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(3)
}

// ─── Gemini REST Types ──────────────────────────────────────────────────────

#[derive(Serialize)]
struct GeminiRequest {
    contents: Vec<GeminiContent>,
    #[serde(skip_serializing_if = "Option::is_none")]
    system_instruction: Option<GeminiContent>,
}

#[derive(Serialize, Deserialize, Clone)]
struct GeminiContent {
    #[serde(skip_serializing_if = "Option::is_none")]
    role: Option<String>,
    parts: Vec<GeminiPart>,
}

#[derive(Serialize, Deserialize, Clone)]
struct GeminiPart {
    text: String,
}

#[derive(Deserialize)]
struct GeminiStreamChunk {
    candidates: Option<Vec<GeminiCandidate>>,
}

#[derive(Deserialize)]
struct GeminiCandidate {
    content: Option<GeminiContent>,
}

// ─── Sensitive keys to strip from chart data before sending to AI ───────────

const SENSITIVE_KEYS: &[&str] = &[
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
];

fn sanitize_for_ai(value: &serde_json::Value) -> serde_json::Value {
    match value {
        serde_json::Value::Object(map) => {
            let filtered: serde_json::Map<String, serde_json::Value> = map
                .iter()
                .filter(|(key, _)| !SENSITIVE_KEYS.contains(&key.to_lowercase().as_str()))
                .map(|(key, val)| (key.clone(), sanitize_for_ai(val)))
                .collect();
            serde_json::Value::Object(filtered)
        }
        serde_json::Value::Array(arr) => {
            serde_json::Value::Array(arr.iter().map(sanitize_for_ai).collect())
        }
        other => other.clone(),
    }
}

// ─── Report Generation ─────────────────────────────────────────────────────

/// Build the comprehensive report prompt from chart data (mirrors Python exactly).
fn build_report_prompt(chart: &serde_json::Value) -> String {
    let sanitized = sanitize_for_ai(chart);

    // Extract current Maha/Antar Dasha
    let (current_maha, current_maha_dates, current_antar, current_antar_dates) =
        find_current_dasha(&sanitized);

    // Planet lines
    let mut planet_lines = Vec::new();
    if let Some(table) = sanitized.get("planetary_table").and_then(|v| v.as_array()) {
        for p in table {
            let name = p.get("name").and_then(|v| v.as_str()).unwrap_or("?");
            let sign = p.get("sign").and_then(|v| v.as_str()).unwrap_or("?");
            let house = p.get("house").and_then(|v| v.as_u64()).unwrap_or(0);
            let dignity = p.get("dignity").and_then(|v| v.as_str()).unwrap_or("?");
            let nak = p.get("nakshatra").and_then(|v| v.as_str()).unwrap_or("?");
            let pada = p.get("pada").and_then(|v| v.as_u64()).unwrap_or(0);
            let navamsa = p.get("navamsa_sign").and_then(|v| v.as_str()).unwrap_or("?");

            let mut flags = Vec::new();
            if p.get("retrograde").and_then(|v| v.as_bool()).unwrap_or(false) {
                flags.push("Retrograde");
            }
            if p.get("combust").and_then(|v| v.as_bool()).unwrap_or(false) {
                flags.push("Combust");
            }
            let flag_str = if flags.is_empty() {
                String::new()
            } else {
                format!(" [{}]", flags.join(", "))
            };

            planet_lines.push(format!(
                "  {name}: {sign} (House {house}, {dignity}, Nakshatra: {nak} Pada {pada}, Navamsa: {navamsa}{flag_str})"
            ));
        }
    }

    // Navamsa chart lines
    let mut navamsa_lines = Vec::new();
    if let Some(nav) = sanitized.get("navamsa_chart").and_then(|v| v.as_object()) {
        for h in 1..=12 {
            let key = format!("house_{h}");
            if let Some(hdata) = nav.get(&key) {
                let sign = hdata.get("sign").and_then(|v| v.as_str()).unwrap_or("?");
                let planets = hdata
                    .get("planets")
                    .and_then(|v| v.as_array())
                    .map(|arr| {
                        arr.iter()
                            .filter_map(|v| v.as_str())
                            .collect::<Vec<_>>()
                            .join(", ")
                    })
                    .unwrap_or_default();
                let planets_str = if planets.is_empty() {
                    "Empty".to_string()
                } else {
                    planets
                };
                navamsa_lines.push(format!("  House {h} ({sign}): {planets_str}"));
            }
        }
    }

    // Yoga lines
    let mut yoga_lines = Vec::new();
    if let Some(yogas) = sanitized.get("yogas").and_then(|v| v.as_array()) {
        for y in yogas {
            let name = y.get("name").and_then(|v| v.as_str()).unwrap_or("?");
            let kind = y.get("type").and_then(|v| v.as_str()).unwrap_or("?");
            let desc = y.get("description").and_then(|v| v.as_str()).unwrap_or("");
            yoga_lines.push(format!("  {name} ({kind}): {desc}"));
        }
    }
    let yoga_str = if yoga_lines.is_empty() {
        "  None detected".to_string()
    } else {
        yoga_lines.join("\n")
    };

    // Ascendant and Moon
    let asc_sign = sanitized
        .pointer("/ascendant/sign")
        .and_then(|v| v.as_str())
        .unwrap_or("?");
    let asc_deg = sanitized
        .pointer("/ascendant/degree")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.0);
    let moon_sign = sanitized
        .pointer("/moon_intelligence/sign")
        .and_then(|v| v.as_str())
        .unwrap_or("?");
    let moon_nak = sanitized
        .pointer("/moon_intelligence/nakshatra")
        .and_then(|v| v.as_str())
        .unwrap_or("?");
    let moon_pada = sanitized
        .pointer("/moon_intelligence/pada")
        .and_then(|v| v.as_u64())
        .unwrap_or(0);
    let moon_strength = sanitized
        .pointer("/moon_intelligence/strength")
        .and_then(|v| v.as_str())
        .unwrap_or("?");
    let nav_lagna = sanitized
        .pointer("/navamsa_chart/house_1/sign")
        .and_then(|v| v.as_str())
        .unwrap_or("?");

    let analysis_date = chrono::Local::now().format("%d-%B-%Y").to_string();

    let chart_context = format!(
        r#"COMPLETE BIRTH CHART ANALYSIS DATA:
Analysis Date (Current Date of Analysis): {analysis_date}

Ascendant: {asc_sign} ({asc_deg:.2}°)
Moon: {moon_sign} in {moon_nak} Pada {moon_pada} ({moon_strength})

Current Running Period:
  Maha Dasha: {current_maha} ({current_maha_dates})
  Antar Dasha: {current_antar} ({current_antar_dates})

Planetary Positions (D1 Rasi):
{planet_lines}

Navamsa Chart (D9):
  Navamsa Lagna: {nav_lagna}
{navamsa_lines}

Yogas Detected:
{yoga_str}"#,
        planet_lines = planet_lines.join("\n"),
        navamsa_lines = navamsa_lines.join("\n"),
    );

    format!(
        r#"You are an AI-powered Vedic Astrology analysis engine. Analyze this birth chart data and create a comprehensive, well-structured 1-2 page report referencing EVERY piece of data provided.

CRITICAL RULES:
- Do NOT include any introductory preamble, greetings, or flowery opening paragraphs
- Do NOT include placeholders like "[Client Name]" or "[Your Name]"
- Do NOT roleplay or claim years of experience
- Start DIRECTLY with the first analysis section heading

{chart_context}

REPORT STRUCTURE (cover ALL sections in detail):

## 1. Ascendant & Personality Profile
- Analyze the Ascendant sign, its lord, and where the lord is placed
- Discuss the Navamsa Lagna and how it modifies the personality
- Include Moon sign and Nakshatra influence on the mind and emotions

## 2. Planetary Analysis (Reference EVERY Planet)
- For each planet: discuss its house placement, dignity (exalted/debilitated/own/moolatrikona/neutral), and Nakshatra
- Highlight any **retrograde** planets and their karmic significance
- Highlight any **combust** planets and the impact on their significations
- Discuss the Navamsa sign of key planets (especially Venus for relationships, Jupiter for wisdom)

## 3. Yoga Analysis
- Explain each detected yoga in detail — what it means practically for the native
- If no yogas detected, explain why and mention any near-misses

## 4. House-wise Analysis
- **Wealth (2nd & 11th houses)**: Financial prospects and gains
- **Communication & Courage (3rd house)**: Skills and siblings
- **Home & Mother (4th house)**: Domestic happiness, property, vehicles
- **Children & Intelligence (5th house)**: Creativity, children, speculation
- **Career & Status (10th house)**: Professional life, reputation, authority
- **Relationships & Marriage (7th house)**: Partnership, spouse characteristics
- **Spirituality (9th & 12th houses)**: Fortune, higher learning, foreign travel

## 5. Vimshottari Dasha: Current & Upcoming Periods
- Detailed analysis of the current Maha Dasha ({current_maha}) and Antar Dasha ({current_antar})
- What to expect in the current sub-period — specific life areas affected
- Brief forecast for the next 2-3 upcoming antardasha periods

## 6. Navamsa (D9) Deep Dive
- Analyze the D9 chart for marriage timing, spouse characteristics, and soul purpose
- Compare D1 vs D9 positions for key planets (Venus, Jupiter, 7th lord)

FORMATTING RULES:
- Use **bold** for all planet names, sign names, and key astrological terms
- Use bullet points for lists
- Keep paragraphs focused and practical
- Target 800-1200 words (1-2 full pages)
- Be specific and reference actual house numbers, signs, and degrees from the data
- Do NOT suggest any remedies, mantras, gemstones, or rituals — this is a pure analysis report
- End the report with this affirmative closing note on its own line: "*This report is crafted using Vedic Jyotish principles and AI-powered. Use these insights as a guiding light on your journey — for deeper personalised guidance, consult a qualified Jyotishi.*""#
    )
}

/// Build the chat prompt context and conversation history for Gemini.
fn build_chat_request(
    chart_data: &serde_json::Value,
    question: &str,
    history: &[crate::models::ChatMessage],
) -> Result<GeminiRequest, &'static str> {
    // Validate history limit
    let max_q = max_questions();
    if history.len() >= max_q * 2 {
        return Err("question_limit_reached");
    }

    let topic = crate::context::detect_topic_from_question(question);
    let chart_context = crate::context::render_topic_prompt_context_json(chart_data, topic);

    let system_instruction = GeminiContent {
        role: None,
        parts: vec![GeminiPart {
            text: "You are an expert Vedic Astrologer. \nAnalyze the chart.\nFORMATTING RULES:\n1. Use **Bold** for Planet Names and Key Terms.\n2. Use bullet points for lists.\n3. Keep paragraphs short.".to_string(),
        }],
    };

    // Build conversation history
    let mut contents = Vec::new();

    // Initial chart context as first user message, model acknowledgment
    contents.push(GeminiContent {
        role: Some("user".to_string()),
        parts: vec![GeminiPart {
            text: chart_context,
        }],
    });
    contents.push(GeminiContent {
        role: Some("model".to_string()),
        parts: vec![GeminiPart {
            text: "Understood.".to_string(),
        }],
    });

    // Append prior history
    for msg in history {
        contents.push(GeminiContent {
            role: Some(if msg.role == "user" {
                "user".to_string()
            } else {
                "model".to_string()
            }),
            parts: vec![GeminiPart {
                text: msg.text.clone(),
            }],
        });
    }

    // Current question
    contents.push(GeminiContent {
        role: Some("user".to_string()),
        parts: vec![GeminiPart {
            text: question.to_string(),
        }],
    });

    Ok(GeminiRequest {
        contents,
        system_instruction: Some(system_instruction),
    })
}

// ─── Streaming Execution ────────────────────────────────────────────────────

type SseStream = Pin<Box<dyn Stream<Item = Result<Event, std::convert::Infallible>> + Send>>;

/// Stream a report generation from Gemini.
pub async fn stream_report(chart_data: serde_json::Value) -> Result<Sse<SseStream>, crate::ApiError> {
    let api_key = gemini_api_key().ok_or_else(|| {
        crate::ApiError::new(
            axum::http::StatusCode::SERVICE_UNAVAILABLE,
            "AI Service is currently unavailable.",
        )
    })?;

    let prompt = build_report_prompt(&chart_data);
    let request_body = GeminiRequest {
        contents: vec![GeminiContent {
            role: Some("user".to_string()),
            parts: vec![GeminiPart { text: prompt }],
        }],
        system_instruction: None,
    };

    Ok(stream_gemini(api_key, request_body).await)
}

/// Stream a chat response from Gemini.
pub async fn stream_chat(
    chart_data: serde_json::Value,
    question: String,
    history: Vec<crate::models::ChatMessage>,
) -> Result<Sse<SseStream>, crate::ApiError> {
    let api_key = gemini_api_key().ok_or_else(|| {
        crate::ApiError::new(
            axum::http::StatusCode::SERVICE_UNAVAILABLE,
            "AI Service is currently unavailable. Please check API Key.",
        )
    })?;

    let request_body = build_chat_request(&chart_data, &question, &history).map_err(|_| {
        crate::ApiError::new(
            axum::http::StatusCode::OK, // Python returns 200 with message, match behavior
            "",
        )
    })?;

    Ok(stream_gemini(api_key, request_body).await)
}

/// Core streaming function: calls Gemini streamGenerateContent and emits SSE events.
async fn stream_gemini(api_key: String, request_body: GeminiRequest) -> Sse<SseStream> {
    let model = gemini_model();
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?alt=sse"
    );

    let client = &*GEMINI_CLIENT;

    let stream = async_stream::try_stream! {
        let response = client
            .post(&url)
            .header("x-goog-api-key", &api_key)
            .json(&request_body)
            .send()
            .await;

        match response {
            Ok(resp) if resp.status().is_success() => {
                let mut byte_stream = resp.bytes_stream();
                let mut buffer = String::new();

                while let Some(chunk_result) = byte_stream.next().await {
                    match chunk_result {
                        Ok(bytes) => {
                            buffer.push_str(&String::from_utf8_lossy(&bytes));

                            // Process complete SSE lines from Gemini
                            while let Some(pos) = buffer.find("\n\n") {
                                let line_block = buffer[..pos].to_string();
                                buffer = buffer[pos + 2..].to_string();

                                for line in line_block.lines() {
                                    if let Some(json_str) = line.strip_prefix("data: ") {
                                        if let Ok(chunk) = serde_json::from_str::<GeminiStreamChunk>(json_str) {
                                            if let Some(candidates) = chunk.candidates {
                                                for candidate in candidates {
                                                    if let Some(content) = candidate.content {
                                                        for part in content.parts {
                                                            if !part.text.is_empty() {
                                                                let payload = serde_json::json!({"text": part.text});
                                                                yield Event::default().data(payload.to_string());
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        Err(e) => {
                            error!(error = %e, "Gemini stream chunk error");
                            let payload = serde_json::json!({"error": "Stream interrupted. Please try again."});
                            yield Event::default().data(payload.to_string());
                            break;
                        }
                    }
                }

                // Flush remaining buffer
                for line in buffer.lines() {
                    if let Some(json_str) = line.strip_prefix("data: ") {
                        if let Ok(chunk) = serde_json::from_str::<GeminiStreamChunk>(json_str) {
                            if let Some(candidates) = chunk.candidates {
                                for candidate in candidates {
                                    if let Some(content) = candidate.content {
                                        for part in content.parts {
                                            if !part.text.is_empty() {
                                                let payload = serde_json::json!({"text": part.text});
                                                yield Event::default().data(payload.to_string());
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                let done_payload = serde_json::json!({"done": true});
                yield Event::default().data(done_payload.to_string());
            }
            Ok(resp) => {
                let status = resp.status();
                let body = resp.text().await.unwrap_or_default();
                error!(status = %status, body = %body, "Gemini API error");
                let payload = serde_json::json!({"error": "AI generation failed. Please try again."});
                yield Event::default().data(payload.to_string());
            }
            Err(e) => {
                error!(error = %e, "Gemini API connection failed");
                let payload = serde_json::json!({"error": "AI service connection failed. Please try again."});
                yield Event::default().data(payload.to_string());
            }
        }
    };

    Sse::new(Box::pin(stream) as SseStream)
}

// ─── Dasha Finder Utility ───────────────────────────────────────────────────

fn find_current_dasha(chart: &serde_json::Value) -> (String, String, String, String) {
    let now = chrono::Local::now().naive_local();
    let mut current_maha = "Unknown".to_string();
    let mut current_maha_dates = String::new();
    let mut current_antar = "Unknown".to_string();
    let mut current_antar_dates = String::new();

    if let Some(timeline) = chart.get("vimshottari_timeline").and_then(|v| v.as_array()) {
        for md in timeline {
            let md_start = md
                .get("start")
                .and_then(|v| v.as_str())
                .and_then(|s| chrono::NaiveDate::parse_from_str(s, "%d-%m-%Y").ok());
            let md_end = md
                .get("end")
                .and_then(|v| v.as_str())
                .and_then(|s| chrono::NaiveDate::parse_from_str(s, "%d-%m-%Y").ok());

            if let (Some(start), Some(end)) = (md_start, md_end) {
                let today = now.date();
                if start <= today && today <= end {
                    current_maha = md
                        .get("lord")
                        .and_then(|v| v.as_str())
                        .unwrap_or("Unknown")
                        .to_string();
                    current_maha_dates = format!(
                        "{} to {}",
                        md.get("start").and_then(|v| v.as_str()).unwrap_or(""),
                        md.get("end").and_then(|v| v.as_str()).unwrap_or("")
                    );

                    if let Some(antars) = md.get("antardashas").and_then(|v| v.as_array()) {
                        for ad in antars {
                            let ad_start = ad
                                .get("start")
                                .and_then(|v| v.as_str())
                                .and_then(|s| {
                                    chrono::NaiveDate::parse_from_str(s, "%d-%m-%Y").ok()
                                });
                            let ad_end = ad
                                .get("end")
                                .and_then(|v| v.as_str())
                                .and_then(|s| {
                                    chrono::NaiveDate::parse_from_str(s, "%d-%m-%Y").ok()
                                });

                            if let (Some(a_start), Some(a_end)) = (ad_start, ad_end) {
                                if a_start <= today && today <= a_end {
                                    current_antar = ad
                                        .get("lord")
                                        .and_then(|v| v.as_str())
                                        .unwrap_or("Unknown")
                                        .to_string();
                                    current_antar_dates = format!(
                                        "{} to {}",
                                        ad.get("start").and_then(|v| v.as_str()).unwrap_or(""),
                                        ad.get("end").and_then(|v| v.as_str()).unwrap_or("")
                                    );
                                    break;
                                }
                            }
                        }
                    }
                    break;
                }
            }
        }
    }

    (
        current_maha,
        current_maha_dates,
        current_antar,
        current_antar_dates,
    )
}
