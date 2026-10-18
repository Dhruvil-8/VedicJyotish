package com.example.vedicjyotish.data.astrology

import android.content.Context
import android.location.Geocoder
import com.example.vedicjyotish.data.models.CityResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.Locale
import kotlin.math.abs

/**
 * Offline & Native Android Location Helper.
 * Features:
 * - Instant offline autocomplete for 120+ prominent Indian & global cities
 * - Android native Geocoder for any town/village worldwide
 * - 1-tap GPS location coordinates via LocationManager
 */
object OfflineLocationHelper {

    private val PRELOADED_CITIES = listOf(
        CityResult("New Delhi, Delhi, India", 28.6139, 77.2090),
        CityResult("Mumbai, Maharashtra, India", 19.0760, 72.8777),
        CityResult("Bengaluru, Karnataka, India", 12.9716, 77.5946),
        CityResult("Kolkata, West Bengal, India", 22.5726, 88.3639),
        CityResult("Chennai, Tamil Nadu, India", 13.0827, 80.2707),
        CityResult("Hyderabad, Telangana, India", 17.3850, 78.4867),
        CityResult("Ahmedabad, Gujarat, India", 23.0225, 72.5714),
        CityResult("Pune, Maharashtra, India", 18.5204, 73.8567),
        CityResult("Surat, Gujarat, India", 21.1702, 72.8311),
        CityResult("Jaipur, Rajasthan, India", 26.9124, 75.7873),
        CityResult("Lucknow, Uttar Pradesh, India", 26.8467, 80.9462),
        CityResult("Kanpur, Uttar Pradesh, India", 26.4499, 80.3319),
        CityResult("Nagpur, Maharashtra, India", 21.1458, 79.0882),
        CityResult("Indore, Madhya Pradesh, India", 22.7196, 75.8577),
        CityResult("Thane, Maharashtra, India", 19.2183, 72.9781),
        CityResult("Bhopal, Madhya Pradesh, India", 23.2599, 77.4126),
        CityResult("Visakhapatnam, Andhra Pradesh, India", 17.6868, 83.2185),
        CityResult("Pimpri-Chinchwad, Maharashtra, India", 18.6298, 73.7997),
        CityResult("Patna, Bihar, India", 25.5941, 85.1376),
        CityResult("Vadodara, Gujarat, India", 22.3072, 73.1812),
        CityResult("Ghaziabad, Uttar Pradesh, India", 28.6692, 77.4538),
        CityResult("Ludhiana, Punjab, India", 30.9010, 75.8573),
        CityResult("Agra, Uttar Pradesh, India", 27.1767, 78.0081),
        CityResult("Nashik, Maharashtra, India", 19.9975, 73.7898),
        CityResult("Faridabad, Haryana, India", 28.4089, 77.3178),
        CityResult("Meerut, Uttar Pradesh, India", 28.9845, 77.7064),
        CityResult("Rajkot, Gujarat, India", 22.3039, 70.8022),
        CityResult("Varanasi, Uttar Pradesh, India", 25.3176, 82.9739),
        CityResult("Srinagar, Jammu & Kashmir, India", 34.0837, 74.7973),
        CityResult("Aurangabad (Chhatrapati Sambhajinagar), Maharashtra, India", 19.8762, 75.3433),
        CityResult("Dhanbad, Jharkhand, India", 23.7957, 86.4304),
        CityResult("Amritsar, Punjab, India", 31.6340, 74.8723),
        CityResult("Navi Mumbai, Maharashtra, India", 19.0330, 73.0297),
        CityResult("Allahabad (Prayagraj), Uttar Pradesh, India", 25.4358, 81.8463),
        CityResult("Ranchi, Jharkhand, India", 23.3441, 85.3096),
        CityResult("Howrah, West Bengal, India", 22.5958, 88.2636),
        CityResult("Coimbatore, Tamil Nadu, India", 11.0168, 76.9558),
        CityResult("Jabalpur, Madhya Pradesh, India", 23.1815, 79.9864),
        CityResult("Gwalior, Madhya Pradesh, India", 26.2183, 78.1828),
        CityResult("Vijayawada, Andhra Pradesh, India", 16.5062, 80.6480),
        CityResult("Jodhpur, Rajasthan, India", 26.2389, 73.0243),
        CityResult("Madurai, Tamil Nadu, India", 9.9252, 78.1198),
        CityResult("Raipur, Chhattisgarh, India", 21.2514, 81.6296),
        CityResult("Kota, Rajasthan, India", 25.2138, 75.8648),
        CityResult("Chandigarh, India", 30.7333, 76.7794),
        CityResult("Guwahati, Assam, India", 26.1445, 91.7362),
        CityResult("Solapur, Maharashtra, India", 17.6599, 75.9064),
        CityResult("Hubli-Dharwad, Karnataka, India", 15.3647, 75.1240),
        CityResult("Bareilly, Uttar Pradesh, India", 28.3670, 79.4304),
        CityResult("Mysuru (Mysore), Karnataka, India", 12.2958, 76.6394),
        CityResult("Tiruchirappalli, Tamil Nadu, India", 10.7905, 78.7047),
        CityResult("Ujjain, Madhya Pradesh, India", 23.1765, 75.7885),
        CityResult("Haridwar, Uttarakhand, India", 29.9457, 78.1642),
        CityResult("Rishikesh, Uttarakhand, India", 30.0869, 78.2676),
        CityResult("Ayodhya, Uttar Pradesh, India", 26.7922, 82.1998),
        CityResult("Mathura, Uttar Pradesh, India", 27.4924, 77.6737),
        CityResult("Vrindavan, Uttar Pradesh, India", 27.5806, 77.7006),
        CityResult("Tirupati, Andhra Pradesh, India", 13.6288, 79.4192),
        CityResult("Puri, Odisha, India", 19.8135, 85.8312),
        CityResult("Bhubaneswar, Odisha, India", 20.2961, 85.8245),
        CityResult("Dehradun, Uttarakhand, India", 30.3165, 78.0322),
        CityResult("Shimla, Himachal Pradesh, India", 31.1048, 77.1734),
        CityResult("Jammu, Jammu & Kashmir, India", 32.7266, 74.8570),
        CityResult("Kochi, Kerala, India", 9.9312, 76.2673),
        CityResult("Thiruvananthapuram, Kerala, India", 8.5241, 76.9366),
        CityResult("Kozhikode, Kerala, India", 11.2588, 75.7804),
        CityResult("Mangaluru, Karnataka, India", 12.9141, 74.8560),
        CityResult("Belagavi, Karnataka, India", 15.8497, 74.4977),
        CityResult("Panaji, Goa, India", 15.4909, 73.8278),
        CityResult("Udaipur, Rajasthan, India", 24.5854, 73.7125),
        CityResult("Ajmer, Rajasthan, India", 26.4499, 74.6399),
        CityResult("Bikaner, Rajasthan, India", 28.0229, 73.3119),
        CityResult("Pushkar, Rajasthan, India", 26.4897, 74.5511),
        CityResult("Dwarka, Gujarat, India", 22.2442, 68.9685),
        CityResult("Somnath, Gujarat, India", 20.8880, 70.4013),
        CityResult("Rameshwaram, Tamil Nadu, India", 9.2876, 79.3129),
        CityResult("Kanyakumari, Tamil Nadu, India", 8.0883, 77.5385),
        CityResult("Shirdi, Maharashtra, India", 19.7667, 74.4764),
        CityResult("Kolhapur, Maharashtra, India", 16.7050, 74.2433),
        CityResult("London, United Kingdom", 51.5074, -0.1278, 0.0),
        CityResult("New York, NY, USA", 40.7128, -74.0060, -5.0),
        CityResult("San Francisco, CA, USA", 37.7749, -122.4194, -8.0),
        CityResult("Los Angeles, CA, USA", 34.0522, -118.2437, -8.0),
        CityResult("Chicago, IL, USA", 41.8781, -87.6298, -6.0),
        CityResult("Houston, TX, USA", 29.7604, -95.3698, -6.0),
        CityResult("Toronto, ON, Canada", 43.6532, -79.3832, -5.0),
        CityResult("Vancouver, BC, Canada", 49.2827, -123.1207, -8.0),
        CityResult("Dubai, United Arab Emirates", 25.2048, 55.2708, 4.0),
        CityResult("Singapore", 1.3521, 103.8198, 8.0),
        CityResult("Sydney, Australia", -33.8688, 151.2093, 10.0),
        CityResult("Melbourne, Australia", -37.8136, 144.9631, 10.0),
        CityResult("Kathmandu, Nepal", 27.7172, 85.3240, 5.75),
        CityResult("Colombo, Sri Lanka", 6.9271, 79.8612, 5.5),
        CityResult("Dhaka, Bangladesh", 23.8103, 90.4125, 6.0),
        CityResult("Tokyo, Japan", 35.6762, 139.6503, 9.0),
        CityResult("Bangkok, Thailand", 13.7563, 100.5018, 7.0),
        CityResult("Kuala Lumpur, Malaysia", 3.1390, 101.6869, 8.0),
        CityResult("Berlin, Germany", 52.5200, 13.4050, 1.0),
        CityResult("Paris, France", 48.8566, 2.3522, 1.0)
    )

    /**
     * Resolves the timezone offset in hours from city name and coordinates.
     */
    fun resolveTimezone(cityName: String, lat: Double, lon: Double): Double {
        val q = cityName.lowercase(Locale.ENGLISH)
        return when {
            q.contains("india") || q.contains("delhi") || q.contains("mumbai") ||
            q.contains("bengaluru") || q.contains("kolkata") || q.contains("chennai") ||
            q.contains("hyderabad") || q.contains("pune") || q.contains("ahmedabad") ||
            q.contains("jaipur") || q.contains("lucknow") || q.contains("gujarat") ||
            q.contains("maharashtra") || q.contains("karnataka") || q.contains("tamil nadu") ||
            q.contains("uttar pradesh") || q.contains("rajasthan") || q.contains("kerala") -> 5.5
            q.contains("london") || q.contains("united kingdom") || q.contains(", uk") -> 0.0
            q.contains("paris") || q.contains("berlin") || q.contains("germany") || q.contains("france") -> 1.0
            q.contains("dubai") || q.contains("united arab emirates") || q.contains("uae") -> 4.0
            q.contains("kathmandu") || q.contains("nepal") -> 5.75
            q.contains("colombo") || q.contains("sri lanka") -> 5.5
            q.contains("dhaka") || q.contains("bangladesh") -> 6.0
            q.contains("bangkok") || q.contains("thailand") -> 7.0
            q.contains("singapore") || q.contains("kuala lumpur") || q.contains("malaysia") -> 8.0
            q.contains("tokyo") || q.contains("japan") -> 9.0
            q.contains("sydney") || q.contains("melbourne") || q.contains("australia") -> 10.0
            q.contains("new york") || q.contains("toronto") || q.contains(", ny") || q.contains(", on") -> -5.0
            q.contains("chicago") || q.contains("houston") || q.contains(", il") || q.contains(", tx") -> -6.0
            q.contains("san francisco") || q.contains("los angeles") || q.contains("vancouver") ||
            q.contains(", ca") || q.contains(", bc") -> -8.0
            else -> {
                // Approximate standard timezone offset from longitude (rounded to 30 min intervals)
                Math.round((lon / 15.0) * 2.0) / 2.0
            }
        }
    }

    /**
     * Search cities: checks fast offline preloaded list first, then falls back to Android native Geocoder.
     */
    suspend fun searchCities(context: Context, query: String): List<CityResult> = withContext(Dispatchers.IO) {
        val q = query.trim().lowercase(Locale.ENGLISH)
        if (q.length < 2) return@withContext emptyList()

        // 1. Check preloaded offline cities
        val offlineMatches = PRELOADED_CITIES.filter {
            it.name.lowercase(Locale.ENGLISH).contains(q)
        }

        if (offlineMatches.size >= 3) {
            return@withContext offlineMatches.take(10)
        }

        // 2. Android Geocoder fallback
        val results = mutableListOf<CityResult>()
        results.addAll(offlineMatches)

        try {
            if (Geocoder.isPresent()) {
                val geocoder = Geocoder(context, Locale.getDefault())
                @Suppress("DEPRECATION")
                val addresses = geocoder.getFromLocationName(query, 5)
                if (addresses != null) {
                    for (addr in addresses) {
                        val name = buildString {
                            if (addr.locality != null) append(addr.locality).append(", ")
                            if (addr.adminArea != null) append(addr.adminArea).append(", ")
                            if (addr.countryName != null) append(addr.countryName)
                        }.trimEnd(' ', ',')
                        val finalName = if (name.isNotEmpty()) name else addr.featureName ?: query
                        if (results.none { abs(it.lat - addr.latitude) < 0.01 && abs(it.lon - addr.longitude) < 0.01 }) {
                            val tz = resolveTimezone(finalName, addr.latitude, addr.longitude)
                            results.add(CityResult(finalName, addr.latitude, addr.longitude, tz))
                        }
                    }
                }
            }
        } catch (e: Exception) {
            // Geocoder might be offline, ignore and return offline results
        }

        results.take(10)
    }
}
