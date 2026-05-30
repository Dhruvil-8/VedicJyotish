package com.example.vedicjyotish.data.models

import com.google.gson.annotations.SerializedName

// --- City Search ---
data class CityResult(
    val name: String,
    val lat: Double,
    val lon: Double
)

// --- Birth Data (Request) ---
data class BirthDataRequest(
    val date: String,   // DD/MM/YYYY
    val time: String,   // HH:MM
    val city: String,
    val lat: Double,
    val lon: Double
)

// --- Chart Response ---
data class ChartResponse(
    val location: LocationInfo,
    val ascendant: AscendantInfo,
    @SerializedName("moon_intelligence") val moonIntelligence: MoonIntelligence,
    @SerializedName("vimshottari_timeline") val vimshottariTimeline: List<MahaDasha>,
    @SerializedName("chart_data") val chartData: Map<String, HouseData>,
    @SerializedName("navamsa_chart") val navamsaChart: Map<String, NavamsaHouseData>,
    @SerializedName("planetary_table") val planetaryTable: List<PlanetaryRow>,
    val yogas: List<Yoga>,
    val panchanga: Panchanga? = null,
    val doshas: DoshaResponse? = null,
    @SerializedName("divisional_charts") val divisionalCharts: Map<String, Map<String, NavamsaHouseData>>? = null,
    val ashtakavarga: AshtakavargaResponse? = null,
    val jaimini: JaiminiResponse? = null,
    @SerializedName("chara_dasha") val charaDasha: CharaDashaResponse? = null,
    val aspects: DrishtiResponse? = null
)

data class LocationInfo(
    val city: String?,
    val lat: Double,
    val lon: Double,
    val tz: Double
)

data class AscendantInfo(
    val sign: String,
    val degree: Double
)

data class MoonIntelligence(
    val nakshatra: String,
    val pada: Int,
    val sign: String,
    val strength: String
)

// --- House Data (D1 Rasi) ---
data class HouseData(
    val sign: String,
    val planets: List<HousePlanet>
)

data class HousePlanet(
    val name: String,
    val sign: String,
    val house: Int,
    val strength: String,
    val nature: String,
    val nakshatra: String,
    @SerializedName("nakshatra_lord") val nakshatraLord: String,
    @SerializedName("nakshatra_pada") val nakshatraPada: Int,
    @SerializedName("full_degree") val fullDegree: Double,
    @SerializedName("deg_in_sign") val degInSign: Double,
    val retrograde: Boolean,
    val combust: Boolean,
    @SerializedName("navamsa_sign") val navamsaSign: String,
    @SerializedName("chara_karaka") val charaKaraka: String? = null,
    @SerializedName("dig_bala_points") val digBalaPoints: Double? = null,
    @SerializedName("dig_bala_percentage") val digBalaPercentage: Double? = null
)

// --- House Data (D9 Navamsa) ---
data class NavamsaHouseData(
    val sign: String,
    val planets: List<String>
)

// --- Planetary Table Row ---
data class PlanetaryRow(
    val name: String,
    val sign: String,
    val house: Int,
    val nakshatra: String,
    val pada: Int,
    val dignity: String,
    val retrograde: Boolean,
    val combust: Boolean,
    @SerializedName("navamsa_sign") val navamsaSign: String,
    @SerializedName("chara_karaka") val charaKaraka: String? = null
)

// --- Yoga ---
data class Yoga(
    val name: String,
    val description: String,
    val type: String  // "benefic" or "malefic"
)

// --- Vimshottari Dasha ---
data class MahaDasha(
    val lord: String,
    val start: String,  // DD-MM-YYYY
    val end: String,
    val antardashas: List<AntarDasha>?
)

data class AntarDasha(
    val lord: String,
    val start: String,
    val end: String
)

// --- Chat ---
data class ChatMessage(
    val role: String,  // "user" or "model"
    val text: String
)

data class ChatRequest(
    @SerializedName("chart_data") val chartData: Any,
    val question: String,
    val history: List<ChatMessage>
)

// --- SSE Event ---
data class SseEvent(
    val text: String? = null,
    val done: Boolean? = null,
    val error: String? = null
)

// --- Compatibility Matching ---
data class PartnerDetails(
    val sign: String,
    val nakshatra: String,
    val pada: Int
)

data class KootaResult(
    val name: String,
    val score: Double,
    @SerializedName("max_score") val maxScore: Double,
    val matched: Boolean
)

data class CompatibilityResponse(
    @SerializedName("boy_details") val boyDetails: PartnerDetails,
    @SerializedName("girl_details") val girlDetails: PartnerDetails,
    val method: String,
    val varna: KootaResult,
    val vashya: KootaResult,
    val tara: KootaResult,
    val yoni: KootaResult,
    @SerializedName("graha_maitri") val grahaMaitri: KootaResult,
    val gana: KootaResult,
    val bhakoot: KootaResult,
    val naadi: KootaResult,
    val mahendra: Boolean,
    val vedha: Boolean,
    val rajju: Boolean,
    @SerializedName("sthree_dheerga") val sthreeDheerga: Boolean,
    @SerializedName("total_score") val totalScore: Double,
    @SerializedName("max_score") val maxScore: Double,
    @SerializedName("minimum_porutham_matched") val minimumPoruthamMatched: Boolean
)

// --- Panchanga Elements ---
data class Panchanga(
    val vara: String,
    val tithi: PanchangaElement,
    val nakshatra: PanchangaElement,
    val yoga: PanchangaElement,
    val karana: PanchangaElement
)

data class PanchangaElement(
    val name: String,
    val progress: Double
)

// --- Doshas & Spiritual Alignments ---
data class DoshaResponse(
    @SerializedName("kala_sarpa") val kalaSarpa: KalaSarpaResult,
    @SerializedName("manglik_lagna") val manglikLagna: ManglikResult,
    @SerializedName("manglik_moon") val manglikMoon: ManglikResult,
    @SerializedName("manglik_venus") val manglikVenus: ManglikResult,
    val pitru: PitruResult,
    @SerializedName("guru_chandala") val guruChandala: GuruChandalaResult,
    @SerializedName("ganda_moola") val gandaMoola: GandaMoolaResult,
    @SerializedName("kalathra_lagna") val kalathraLagna: Boolean? = false,
    @SerializedName("kalathra_moon") val kalathraMoon: Boolean? = false,
    val ghata: Boolean? = false,
    val shrapit: Boolean? = false
)

data class KalaSarpaResult(
    @SerializedName("has_dosha") val hasDosha: Boolean,
    @SerializedName("type_index") val typeIndex: Int?
)

data class ManglikResult(
    @SerializedName("has_dosha") val hasDosha: Boolean,
    @SerializedName("has_exceptions") val hasExceptions: Boolean,
    @SerializedName("exceptions_triggered") val exceptionsTriggered: List<Int>
)

data class PitruResult(
    @SerializedName("has_dosha") val hasDosha: Boolean,
    @SerializedName("rules_triggered") val rulesTriggered: List<Int>
)

data class GuruChandalaResult(
    @SerializedName("has_dosha") val hasDosha: Boolean,
    @SerializedName("jupiter_stronger") val jupiterStronger: Boolean
)

data class GandaMoolaResult(
    @SerializedName("has_dosha") val hasDosha: Boolean,
    @SerializedName("nakshatra_name") val nakshatraName: String?
)

// --- Ashtakavarga ---
data class AshtakavargaResponse(
    @SerializedName("bhinnashtakavarga") val bhinnashtakavarga: Map<String, List<Int>>,
    @SerializedName("sarvashtakavarga") val sarvashtakavarga: List<Int>
)

// --- Jaimini Astrology ---
data class JaiminiResponse(
    @SerializedName("arudha_lagna") val arudhaLagna: JaiminiPoint,
    @SerializedName("upapada_lagna") val upapadaLagna: JaiminiPoint,
    @SerializedName("karakamsha_lagna") val karakamshaLagna: JaiminiPoint,
    @SerializedName("chara_karakas") val charaKarakas: Map<String, String>
)

data class JaiminiPoint(
    val sign: String,
    @SerializedName("sign_index") val signIndex: Int,
    val house: Int
)

// --- Jaimini Chara Dasha ---
data class CharaDashaResponse(
    val periods: List<CharaDashaPeriod>
)

data class CharaDashaPeriod(
    val sign: String,
    @SerializedName("duration_years") val durationYears: Int,
    @SerializedName("start_date") val startDate: String,
    @SerializedName("end_date") val endDate: String
)

// --- Aspects (Drishti) ---
data class DrishtiResponse(
    @SerializedName("graha_drishti") val grahaDrishti: Map<String, PlanetDrishti>,
    @SerializedName("rasi_drishti") val rasiDrishti: Map<String, SignDrishti>
)

data class PlanetDrishti(
    @SerializedName("aspected_signs") val aspectedSigns: List<String>,
    @SerializedName("aspected_houses") val aspectedHouses: List<Int>,
    @SerializedName("aspected_planets") val aspectedPlanets: List<String>
)

data class SignDrishti(
    @SerializedName("aspected_signs") val aspectedSigns: List<String>,
    @SerializedName("aspected_planets") val aspectedPlanets: List<String>
)

