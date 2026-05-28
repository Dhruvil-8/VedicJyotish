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
}

#[derive(Debug, Clone, Serialize)]
pub struct Panchanga {
    pub vara: String,
    pub tithi: PanchangaElement,
    pub nakshatra: PanchangaElement,
    pub yoga: PanchangaElement,
    pub karana: PanchangaElement,
    pub paksha: String,
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
            ],
            implemented: vec![
                Capability {
                    key: "birth_chart_core".to_string(),
                    status: "implemented".to_string(),
                    api: Some("/api/v1/chart/full".to_string()),
                    notes: "Lahiri sidereal planetary positions, whole-sign houses, D1, D9, nakshatra, dignity, combustion, retrograde, yogas subset.".to_string(),
                },
                Capability {
                    key: "vimshottari_dasha".to_string(),
                    status: "implemented".to_string(),
                    api: Some("/api/v1/chart/full".to_string()),
                    notes: "Mahadasha and antardasha timeline with sidereal year length.".to_string(),
                },
                Capability {
                    key: "panchanga_basic".to_string(),
                    status: "implemented".to_string(),
                    api: Some("/api/v1/chart/full".to_string()),
                    notes: "Vara, tithi, nakshatra, yoga, karana from Sun/Moon longitudes and local birth date.".to_string(),
                },
                Capability {
                    key: "ai_chart_context".to_string(),
                    status: "implemented".to_string(),
                    api: Some("/api/v1/ai/chart-context".to_string()),
                    notes: "Structured chart plus compact prompt context for report/chat model input.".to_string(),
                },
            ],
            planned: vec![
                Capability {
                    key: "full_varga_suite".to_string(),
                    status: "planned".to_string(),
                    api: None,
                    notes: "D2, D3, D4, D7, D10, D12, D16, D20, D24, D27, D30, D40, D45, D60 with fixture validation.".to_string(),
                },
                Capability {
                    key: "shadbala_ashtakavarga".to_string(),
                    status: "planned".to_string(),
                    api: None,
                    notes: "Strength systems require source-specific rules and golden fixtures before exposing.".to_string(),
                },
                Capability {
                    key: "jhora_grade_dashas".to_string(),
                    status: "planned".to_string(),
                    api: None,
                    notes: "Vimshottari depth plus Yogini, Chara, Narayana, Kalachakra, Ashtottari, and related systems.".to_string(),
                },
                Capability {
                    key: "ai_streaming".to_string(),
                    status: "planned".to_string(),
                    api: Some("/generate_report and /chat_with_astrologer".to_string()),
                    notes: "Gemini-compatible streaming layer should consume /api/v1/ai/chart-context output.".to_string(),
                },
                Capability {
                    key: "planetary_transits".to_string(),
                    status: "implemented".to_string(),
                    api: Some("/calculate_transits".to_string()),
                    notes: "Computes active planetary transits overlaid against natal lagna and moon houses.".to_string(),
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
