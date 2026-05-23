package com.example.vedicastroai.data.models

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
    val yogas: List<Yoga>
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
    @SerializedName("navamsa_sign") val navamsaSign: String
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
    @SerializedName("navamsa_sign") val navamsaSign: String
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
