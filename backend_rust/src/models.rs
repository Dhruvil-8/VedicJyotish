use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BirthData {
    pub date: String,
    pub time: String,
    pub city: Option<String>,
    pub lat: Option<f64>,
    pub lon: Option<f64>,
    pub timezone: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChartCalculationRequest {
    pub birth_data: BirthData,
    #[serde(default)]
    pub profile: CalculationProfile,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CalculationProfile {
    #[serde(default = "default_ayanamsa")]
    pub ayanamsa: String,
    #[serde(default = "default_node_type")]
    pub node_type: String,
    #[serde(default = "default_house_system")]
    pub house_system: String,
    #[serde(default = "default_dasha_year")]
    pub dasha_year: String,
}

impl Default for CalculationProfile {
    fn default() -> Self {
        Self {
            ayanamsa: default_ayanamsa(),
            node_type: default_node_type(),
            house_system: default_house_system(),
            dasha_year: default_dasha_year(),
        }
    }
}

fn default_ayanamsa() -> String {
    "Lahiri".to_string()
}

fn default_node_type() -> String {
    "Mean".to_string()
}

fn default_house_system() -> String {
    "WholeSign".to_string()
}

fn default_dasha_year() -> String {
    "Sidereal365.256363004".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CityResult {
    pub name: String,
    pub lat: f64,
    pub lon: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct AshtakavargaResponse {
    pub bhinnashtakavarga: HashMap<String, Vec<u8>>,
    pub sarvashtakavarga: Vec<u8>,
}

#[derive(Debug, Clone, Serialize)]
pub struct DoshaResponse {
    pub kala_sarpa: KalaSarpaResult,
    pub manglik_lagna: ManglikResult,
    pub manglik_moon: ManglikResult,
    pub manglik_venus: ManglikResult,
    pub pitru: PitruResult,
    pub guru_chandala: GuruChandalaResult,
    pub kalathra_lagna: bool,
    pub kalathra_moon: bool,
    pub ganda_moola: GandaMoolaResult,
    pub ghata: bool,
    pub shrapit: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct KalaSarpaResult {
    pub has_dosha: bool,
    pub type_index: Option<u8>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ManglikResult {
    pub has_dosha: bool,
    pub has_exceptions: bool,
    pub exceptions_triggered: Vec<u8>,
}

#[derive(Debug, Clone, Serialize)]
pub struct PitruResult {
    pub has_dosha: bool,
    pub rules_triggered: Vec<u8>,
}

#[derive(Debug, Clone, Serialize)]
pub struct GuruChandalaResult {
    pub has_dosha: bool,
    pub jupiter_stronger: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct GandaMoolaResult {
    pub has_dosha: bool,
    pub nakshatra_name: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ChartResponse {
    pub birth_date: String,
    pub birth_time: String,
    pub profile: CalculationProfile,
    pub location: LocationInfo,
    pub ascendant: AscendantInfo,
    pub panchanga: Panchanga,
    pub moon_intelligence: MoonIntelligence,
    pub vimshottari_timeline: Vec<MahaDasha>,
    pub chart_data: HashMap<String, HouseData>,
    pub navamsa_chart: HashMap<String, NavamsaHouseData>,
    pub planetary_table: Vec<PlanetaryRow>,
    pub yogas: Vec<Yoga>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ashtakavarga: Option<AshtakavargaResponse>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub divisional_charts: Option<HashMap<String, HashMap<String, VargaHouseData>>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub divisional_planets: Option<HashMap<String, Vec<VargaPlanetRow>>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub doshas: Option<DoshaResponse>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub jaimini: Option<JaiminiResponse>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspects: Option<DrishtiResponse>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub vaisheshikamsa: Option<HashMap<String, VaisheshikamsaResponse>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sade_sati: Option<SadeSatiResponse>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub argala: Option<ArgalaResponse>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub chara_dasha: Option<CharaDashaResponse>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub shadbala: Option<ShadbalaResponse>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bhava_bala: Option<Vec<f64>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub graha_yuddha: Option<Vec<GrahaYuddha>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShadbalaResponse {
    pub planet_balas: HashMap<String, PlanetShadbala>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlanetShadbala {
    pub sthana_bala: f64,
    pub kaala_bala: f64,
    pub dig_bala: f64,
    pub cheshta_bala: f64,
    pub naisargika_bala: f64,
    pub drik_bala: f64,
    pub total_shashtiamsa: f64,
    pub total_rupas: f64,
    pub strength_ratio: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GrahaYuddha {
    pub planet_1: String,
    pub planet_2: String,
    pub degree_diff: f64,
    pub winner: String,
}





#[derive(Debug, Clone, Serialize)]
pub struct Panchanga {
    pub vara: String,
    pub tithi: PanchangaElement,
    pub nakshatra: PanchangaElement,
    pub yoga: PanchangaElement,
    pub karana: PanchangaElement,
    pub paksha: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sun_sign: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub moon_sign: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub nakshatra_lord: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tithi_lord: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub yoga_lord: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub karana_lord: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub vara_lord: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ayanamsha: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sunrise: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sunset: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rahu_kaal: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub yama_ganda: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub gulika_kaal: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub abhijit_muhurat: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub choghadiya: Option<Vec<ChoghadiyaSlot>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub vijaya_muhurta: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub brahma_muhurta: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pradosh_kaal: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dur_muhurtham: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub choghadiya_night: Option<Vec<ChoghadiyaSlot>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub horas_day: Option<Vec<HoraSlot>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub horas_night: Option<Vec<HoraSlot>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChoghadiyaSlot {
    pub name: String,
    pub start: String,
    pub end: String,
    pub nature: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HoraSlot {
    pub hora_num: u8,
    pub planet: String,
    pub start: String,
    pub end: String,
    pub nature: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct PanchangaElement {
    pub index: u8,
    pub name: String,
    pub progress: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct LocationInfo {
    pub city: Option<String>,
    pub lat: f64,
    pub lon: f64,
    pub tz: f64,
    pub timezone_name: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct AscendantInfo {
    pub sign: String,
    pub degree: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct MoonIntelligence {
    pub nakshatra: String,
    pub pada: u8,
    pub sign: String,
    pub strength: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct HouseData {
    pub sign: String,
    pub planets: Vec<PlanetData>,
}

#[derive(Debug, Clone, Serialize)]
pub struct NavamsaHouseData {
    pub sign: String,
    pub planets: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct PlanetData {
    pub name: String,
    pub sign: String,
    pub house: u8,
    pub strength: String,
    pub nature: String,
    pub nakshatra: String,
    pub nakshatra_lord: String,
    pub nakshatra_pada: u8,
    pub full_degree: f64,
    pub deg_in_sign: f64,
    pub retrograde: bool,
    pub combust: bool,
    pub navamsa_sign: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub chara_karaka: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dig_bala_points: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dig_bala_percentage: Option<f64>,
}

#[derive(Debug, Clone, Serialize)]
pub struct PlanetaryRow {
    pub name: String,
    pub sign: String,
    pub house: u8,
    pub nakshatra: String,
    pub pada: u8,
    pub dignity: String,
    pub retrograde: bool,
    pub combust: bool,
    pub navamsa_sign: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub chara_karaka: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct VargaHouseData {
    pub sign: String,
    pub planets: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct VargaPlanetRow {
    pub name: String,
    pub sign: String,
    pub deg_in_sign: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct Yoga {
    pub name: String,
    pub description: String,
    #[serde(rename = "type")]
    pub kind: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct MahaDasha {
    pub lord: String,
    pub start: String,
    pub end: String,
    pub antardashas: Vec<AntarDasha>,
}

#[derive(Debug, Clone, Serialize)]
pub struct AntarDasha {
    pub lord: String,
    pub start: String,
    pub end: String,
}

// ─── Jaimini Chara Dasha Models ──────────────────────────────────────────────

#[derive(Debug, Clone, Serialize)]
pub struct CharaDashaResponse {
    pub periods: Vec<CharaDashaPeriod>,
}

#[derive(Debug, Clone, Serialize)]
pub struct CharaDashaPeriod {
    pub sign: String,
    pub duration_years: u8,
    pub start_date: String,
    pub end_date: String,
}


#[derive(Debug, Clone)]
pub struct Nakshatra {
    pub name: String,
    pub lord: String,
    pub pada: u8,
    pub fraction: f64,
}

#[derive(Debug, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub text: String,
}

#[derive(Debug, Deserialize)]
pub struct ChatRequest {
    pub chart_data: serde_json::Value,
    pub question: String,
    #[serde(default)]
    pub history: Vec<ChatMessage>,
}

#[derive(Debug, Clone, Serialize)]
pub struct AiChartContext {
    pub schema_version: String,
    pub safety: AiSafety,
    pub calculation_profile: CalculationProfile,
    pub structured: ChartResponse,
    pub prompt_context: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct AiSafety {
    pub pii_removed: bool,
    pub contains_birth_inputs: bool,
    pub guidance: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct CapabilityResponse {
    pub engine: String,
    pub version: String,
    pub security: Vec<String>,
    pub implemented: Vec<Capability>,
    pub planned: Vec<Capability>,
}

#[derive(Debug, Clone, Serialize)]
pub struct Capability {
    pub key: String,
    pub status: String,
    pub api: Option<String>,
    pub notes: String,
}

impl Default for CapabilityResponse {
    fn default() -> Self {
        Self {
            engine: "rust-swiss-eph".to_string(),
            version: env!("CARGO_PKG_VERSION").to_string(),
            security: vec![
                "API key authentication is enforced when ENVIRONMENT=production or REQUIRE_API_KEY=true.".to_string(),
                "CORS is restricted to FRONTEND_URL in production.".to_string(),
                "Security headers are applied to every response.".to_string(),
                "AI context endpoint removes raw birth inputs from the prompt context.".to_string(),
                "Request body size capped at 1MB.".to_string(),
                "Gemini API key sent via header, not URL query string.".to_string(),
            ],
            implemented: vec![
                Capability {
                    key: "birth_chart_core".to_string(),
                    status: "implemented".to_string(),
                    api: Some("/api/v1/chart/rasi, /api/v1/chart/navamsa, /api/v1/chart/full".to_string()),
                    notes: "Lahiri sidereal planetary positions, whole-sign houses, D1 (Rasi), D9 (Navamsa), nakshatra, dignity, combustion, retrograde, yogas subset.".to_string(),
                },
                Capability {
                    key: "vimshottari_dasha".to_string(),
                    status: "implemented".to_string(),
                    api: Some("/api/v1/chart/dasha, /api/v1/chart/full".to_string()),
                    notes: "Mahadasha and antardasha timeline with sidereal year length.".to_string(),
                },
                Capability {
                    key: "panchanga_basic".to_string(),
                    status: "implemented".to_string(),
                    api: Some("/api/v1/chart/panchanga, /api/v1/chart/full".to_string()),
                    notes: "Vara, tithi, nakshatra, yoga, karana from Sun/Moon longitudes and local birth date.".to_string(),
                },
                Capability {
                    key: "ai_chart_context".to_string(),
                    status: "implemented".to_string(),
                    api: Some("/api/v1/ai/chart-context".to_string()),
                    notes: "Structured chart plus compact prompt context for report/chat model input.".to_string(),
                },
                Capability {
                    key: "planetary_transits".to_string(),
                    status: "implemented".to_string(),
                    api: Some("/calculate_transits".to_string()),
                    notes: "Computes active planetary transits overlaid against natal lagna and moon houses.".to_string(),
                },
                Capability {
                    key: "full_varga_suite".to_string(),
                    status: "implemented".to_string(),
                    api: Some("/api/v1/chart/varga, /api/v1/chart/full".to_string()),
                    notes: "All 18 Parashari divisional charts: D2-D60 with sign and planet placement.".to_string(),
                },
                Capability {
                    key: "ashtakavarga".to_string(),
                    status: "implemented".to_string(),
                    api: Some("/api/v1/chart/ashtakavarga, /api/v1/chart/full".to_string()),
                    notes: "Bhinnashtakavarga (BAV) for 8 contributors and Sarvashtakavarga (SAV) totals.".to_string(),
                },
                Capability {
                    key: "doshas".to_string(),
                    status: "implemented".to_string(),
                    api: Some("/api/v1/chart/doshas, /api/v1/chart/full".to_string()),
                    notes: "8 major Vedic doshas: Kala Sarpa, Manglik (17 exceptions), Pitru, Guru Chandala, Kalathra, Ganda Moola, Ghata, Shrapit.".to_string(),
                },
                Capability {
                    key: "compatibility_matching".to_string(),
                    status: "implemented".to_string(),
                    api: Some("/api/v1/match/compatibility".to_string()),
                    notes: "Ashtakoota Guna Milan (North Indian 36-guna and South Indian 10-porutham).".to_string(),
                },
                Capability {
                    key: "chara_karakas".to_string(),
                    status: "implemented".to_string(),
                    api: Some("/api/v1/chart/jaimini, /api/v1/chart/full".to_string()),
                    notes: "8-planet Jaimini Chara Karaka assignment (AK through DK).".to_string(),
                },
                Capability {
                    key: "jaimini_astrology".to_string(),
                    status: "implemented".to_string(),
                    api: Some("/api/v1/chart/jaimini, /api/v1/chart/full".to_string()),
                    notes: "Calculates Arudha Lagna (AL), Upapada Lagna (UL), Karakamsha Lagna, and Jaimini Chara Karakas map.".to_string(),
                },
                Capability {
                    key: "dig_bala".to_string(),
                    status: "implemented".to_string(),
                    api: Some("/api/v1/chart/full".to_string()),
                    notes: "Directional strength points and percentage for classical planets.".to_string(),
                },
                Capability {
                    key: "ai_streaming".to_string(),
                    status: "implemented".to_string(),
                    api: Some("/generate_report and /chat_with_astrologer".to_string()),
                    notes: "Gemini-powered SSE streaming for report generation and astrologer chat, now featuring dynamic topic-focused context filters.".to_string(),
                },
            ],
            planned: vec![
                Capability {
                    key: "shadbala".to_string(),
                    status: "planned".to_string(),
                    api: None,
                    notes: "Full six-fold strength system requires source-specific rules and golden fixtures.".to_string(),
                },
                Capability {
                    key: "jhora_grade_dashas".to_string(),
                    status: "planned".to_string(),
                    api: None,
                    notes: "Yogini, Chara, Narayana, Kalachakra, Ashtottari, and related dasha systems.".to_string(),
                },
            ],
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransitRequest {
    pub birth_data: BirthData,
    pub transit_date: String,
    pub transit_time: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct TransitResponse {
    pub transit_date: String,
    pub transit_time: String,
    pub natal_ascendant: AscendantInfo,
    pub transit_planets: Vec<TransitPlanetData>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sade_sati: Option<SadeSatiResponse>,
}


#[derive(Debug, Clone, Serialize)]
pub struct TransitPlanetData {
    pub name: String,
    pub transit_sign: String,
    pub transit_degree: f64,
    pub transit_house_from_lagna: u8,
    pub transit_house_from_moon: u8,
    pub retrograde: bool,
    pub combust: bool,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CompatibilityRequest {
    pub boy: BirthData,
    pub girl: BirthData,
    #[serde(default = "default_match_method")]
    pub method: String, // "North" or "South"
}

fn default_match_method() -> String {
    "North".to_string()
}

#[derive(Debug, Clone, Serialize)]
pub struct CompatibilityResponse {
    pub boy_details: PartnerDetails,
    pub girl_details: PartnerDetails,
    pub method: String,
    pub varna: KootaResult,
    pub vashya: KootaResult,
    pub tara: KootaResult,
    pub yoni: KootaResult,
    pub graha_maitri: KootaResult,
    pub gana: KootaResult,
    pub bhakoot: KootaResult,
    pub naadi: KootaResult,
    pub mahendra: bool,
    pub vedha: bool,
    pub rajju: bool,
    pub sthree_dheerga: bool,
    pub total_score: f64,
    pub max_score: f64,
    pub minimum_porutham_matched: bool, // South Indian Tamil style
}

#[derive(Debug, Clone, Serialize)]
pub struct PartnerDetails {
    pub sign: String,
    pub nakshatra: String,
    pub pada: u8,
}

#[derive(Debug, Clone, Serialize)]
pub struct KootaResult {
    pub name: String,
    pub score: f64,
    pub max_score: f64,
    pub matched: bool,
}

// ─── Jaimini Astrology Models ────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize)]
pub struct JaiminiResponse {
    pub arudha_lagna: JaiminiPoint,
    pub upapada_lagna: JaiminiPoint,
    pub karakamsha_lagna: JaiminiPoint,
    pub chara_karakas: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct JaiminiPoint {
    pub sign: String,
    pub sign_index: usize,
    pub house: u8,
}

// ─── Fine-Grained API Models ──────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize)]
pub struct RasiChartResponse {
    pub ascendant: AscendantInfo,
    pub chart_data: HashMap<String, HouseData>,
    pub planetary_table: Vec<PlanetaryRow>,
}

#[derive(Debug, Clone, Serialize)]
pub struct NavamsaChartResponse {
    pub navamsa_ascendant_sign: String,
    pub navamsa_chart: HashMap<String, NavamsaHouseData>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct VargaCalculationRequest {
    pub birth_data: BirthData,
    #[serde(default)]
    pub profile: CalculationProfile,
    pub varga_type: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct VargaChartResponse {
    pub varga_type: String,
    pub ascendant_sign: String,
    pub chart_data: HashMap<String, VargaHouseData>,
    pub planets: Vec<VargaPlanetRow>,
}

// ─── Aspects (Drishti) Models ────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize)]
pub struct DrishtiResponse {
    pub graha_drishti: HashMap<String, PlanetDrishti>,
    pub rasi_drishti: HashMap<String, SignDrishti>,
}

#[derive(Debug, Clone, Serialize)]
pub struct PlanetDrishti {
    pub aspected_signs: Vec<String>,
    pub aspected_houses: Vec<u8>,
    pub aspected_planets: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct SignDrishti {
    pub aspected_signs: Vec<String>,
    pub aspected_planets: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct VaisheshikamsaResponse {
    pub saptavarga_count: u8,
    pub saptavarga_grade: String,
    pub dashavarga_count: u8,
    pub dashavarga_grade: String,
    pub shodasavarga_count: u8,
    pub shodasavarga_grade: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct SadeSatiResponse {
    pub is_active: bool,
    pub phase: Option<String>,
    pub saturn_sign: String,
    pub moon_sign: String,
    pub description: String,
}

// ─── Jaimini Argala Models ───────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize)]
pub struct ArgalaResponse {
    pub house_argalas: HashMap<u8, HouseArgalaDetails>,
    pub planet_argalas: HashMap<String, PlanetArgalaDetails>,
}

#[derive(Debug, Clone, Serialize)]
pub struct HouseArgalaDetails {
    pub argala_contributors: Vec<ArgalaContributor>,
    pub virodhargala_contributors: Vec<ArgalaContributor>,
    pub net_argala_status: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct PlanetArgalaDetails {
    pub argala_contributors: Vec<ArgalaContributor>,
    pub virodhargala_contributors: Vec<ArgalaContributor>,
    pub net_argala_status: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct ArgalaContributor {
    pub planet_name: String,
    pub sign: String,
    pub house: u8,
    pub argala_house: u8,
    pub is_malefic: bool,
}





