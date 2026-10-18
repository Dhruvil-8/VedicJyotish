package com.example.vedicjyotish.data.astrology

import android.util.Log
import com.example.vedicjyotish.data.models.BirthDataRequest
import com.example.vedicjyotish.data.models.ChartResponse
import com.google.gson.Gson

/**
 * Rust Native Bridge (JNI) for 100% offline, native-speed Vedic Astrology Calculations.
 *
 * Calls the compiled Rust Swiss Ephemeris and Parashara calculation engine directly
 * inside the Android process memory. Automatically falls back to Kotlin VedicChartEngine
 * if the native library is not available in the current runtime environment.
 */
object RustBridge {

    private const val TAG = "RustBridge"
    private val gson = Gson()

    var isNativeLoaded: Boolean = false
        private set

    init {
        try {
            System.loadLibrary("vedic_engine")
            isNativeLoaded = true
            Log.i(TAG, "Successfully loaded native Rust calculation engine (libvedic_engine.so)")
        } catch (e: UnsatisfiedLinkError) {
            isNativeLoaded = false
            Log.w(TAG, "Native library 'vedic_engine' not found. Using pure Kotlin calculation fallback.", e)
        } catch (e: Throwable) {
            isNativeLoaded = false
            Log.w(TAG, "Failed to initialize native engine.", e)
        }
    }

    // ─── Native JNI Methods ─────────────────────────────────────────────────

    @JvmStatic
    private external fun calculateChart(inputJson: String): String

    @JvmStatic
    private external fun calculateTransits(inputJson: String): String

    @JvmStatic
    private external fun calculateCompatibility(inputJson: String): String

    @JvmStatic
    private external fun initEphemeris(path: String)

    // ─── Public Kotlin API ──────────────────────────────────────────────────

    /**
     * Compute a full Vedic Birth Chart offline.
     * Uses the native Rust core when available, with automatic fallback to Kotlin.
     */
    fun computeChart(request: BirthDataRequest): ChartResponse {
        if (isNativeLoaded) {
            try {
                val inputJson = gson.toJson(request)
                val outputJson = calculateChart(inputJson)

                if (outputJson.contains("\"error\":")) {
                    Log.e(TAG, "Native calculation returned error: $outputJson")
                    throw RuntimeException("Rust calculation error: $outputJson")
                }

                val response = gson.fromJson(outputJson, ChartResponse::class.java)
                if (response != null) {
                    return response
                }
            } catch (e: Exception) {
                Log.e(TAG, "Native execution failed, falling back to Kotlin engine", e)
            }
        }

        // Graceful fallback to pure Kotlin calculation
        return VedicChartEngine.calculateChart(
            dateStr = request.date,
            timeStr = request.time,
            city = request.city,
            lat = request.lat,
            lon = request.lon,
            tzOffsetHours = request.timezone ?: 5.5
        )
    }

    /**
     * Set custom Swiss Ephemeris data directory if extra .se1 files are bundled.
     */
    fun setEphemerisPath(path: String) {
        if (isNativeLoaded) {
            try {
                initEphemeris(path)
            } catch (e: Throwable) {
                Log.w(TAG, "Failed to set custom ephemeris path: $path", e)
            }
        }
    }
}
