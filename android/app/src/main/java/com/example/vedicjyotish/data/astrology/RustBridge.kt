package com.example.vedicjyotish.data.astrology

import android.util.Log
import com.example.vedicjyotish.data.models.BirthDataRequest
import com.example.vedicjyotish.data.models.ChartResponse
import com.google.gson.Gson

/**
 * Rust Native Bridge (JNI) for 100% offline, native-speed Vedic Astrology Calculations.
 *
 * Calls the compiled Rust Swiss Ephemeris and Parashara calculation engine (libvedic_engine.so)
 * directly inside the Android process memory. Serves as the Single Source of Truth (SSOT)
 * across the entire application.
 */
object RustBridge {

    private const val TAG = "RustBridge"
    private val gson = Gson()

    var isNativeLoaded: Boolean = false
        private set

    private fun logI(tag: String, msg: String) {
        try {
            Log.i(tag, msg)
        } catch (_: Throwable) {
            println("[$tag] $msg")
        }
    }

    private fun logW(tag: String, msg: String, tr: Throwable? = null) {
        try {
            Log.w(tag, msg, tr)
        } catch (_: Throwable) {
            println("[$tag] $msg")
            tr?.printStackTrace()
        }
    }

    private fun logE(tag: String, msg: String, tr: Throwable? = null) {
        try {
            Log.e(tag, msg, tr)
        } catch (_: Throwable) {
            System.err.println("[$tag] $msg")
            tr?.printStackTrace()
        }
    }

    init {
        try {
            System.loadLibrary("vedic_engine")
            isNativeLoaded = true
            logI(TAG, "Successfully loaded native Rust calculation engine (libvedic_engine.so)")
        } catch (e: UnsatisfiedLinkError) {
            isNativeLoaded = false
            logW(TAG, "Native library 'vedic_engine' not found in current APK.", e)
        } catch (e: Throwable) {
            isNativeLoaded = false
            logW(TAG, "Failed to initialize native engine.", e)
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
    private external fun calculateSunMoon(jd: Double, lat: Double, lon: Double): DoubleArray?

    @JvmStatic
    private external fun initEphemeris(path: String)

    // ─── Public Kotlin API ──────────────────────────────────────────────────

    /**
     * Compute a full Vedic Birth Chart offline using the native Rust Swiss Ephemeris core.
     */
    fun computeChart(request: BirthDataRequest): ChartResponse {
        check(isNativeLoaded) {
            "Native Rust calculation engine (libvedic_engine.so) is required for offline calculations."
        }

        val inputJson = gson.toJson(request)
        val outputJson = calculateChart(inputJson)

        if (outputJson.contains("\"error\":")) {
            logE(TAG, "Native calculation returned error: $outputJson")
            throw RuntimeException("Rust calculation error: $outputJson")
        }

        return gson.fromJson(outputJson, ChartResponse::class.java)
            ?: throw RuntimeException("Failed to parse native chart response JSON: $outputJson")
    }

    /**
     * Compute high-precision Sun & Moon coordinates for given Julian Day UT and location.
     * Returns double array: [sunTropical, sunSidereal, moonTropical, moonSidereal]
     */
    fun getSunMoon(jd: Double, lat: Double, lon: Double): DoubleArray? {
        if (!isNativeLoaded) return null
        return try {
            calculateSunMoon(jd, lat, lon)
        } catch (e: Throwable) {
            logW(TAG, "Failed to calculate Sun/Moon via native Swiss Ephemeris", e)
            null
        }
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
