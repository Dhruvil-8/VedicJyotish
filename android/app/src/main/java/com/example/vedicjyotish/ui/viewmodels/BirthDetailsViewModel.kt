package com.example.vedicjyotish.ui.viewmodels

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.vedicjyotish.data.astrology.OfflineLocationHelper
import com.example.vedicjyotish.data.astrology.RustBridge
import com.example.vedicjyotish.data.astrology.VedicChartEngine
import com.example.vedicjyotish.data.models.BirthDataRequest
import com.example.vedicjyotish.data.models.ChartResponse
import com.example.vedicjyotish.data.models.CityResult
import com.example.vedicjyotish.utils.DateTimeUtils.normalizeDate
import com.example.vedicjyotish.utils.DateTimeUtils.normalizeTime
import com.google.gson.Gson
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

@OptIn(FlowPreview::class)
class BirthDetailsViewModel : ViewModel() {

    private val gson = Gson()

    private val _hasSavedChart = MutableStateFlow(false)
    val hasSavedChart = _hasSavedChart.asStateFlow()

    private val _savedChartInfo = MutableStateFlow<String?>(null)
    val savedChartInfo = _savedChartInfo.asStateFlow()

    private val _date = MutableStateFlow("") // DD/MM/YYYY
    val date = _date.asStateFlow()

    private val _time = MutableStateFlow("") // HH:MM
    val time = _time.asStateFlow()

    private val _selectedLanguage = MutableStateFlow("English")
    val selectedLanguage = _selectedLanguage.asStateFlow()

    private val _city = MutableStateFlow("")
    val city = _city.asStateFlow()

    private val _latitude = MutableStateFlow<Double?>(null)
    val latitude = _latitude.asStateFlow()

    private val _longitude = MutableStateFlow<Double?>(null)
    val longitude = _longitude.asStateFlow()

    private val _timezone = MutableStateFlow(5.5)
    val timezone = _timezone.asStateFlow()

    private val _cityQuery = MutableStateFlow("")
    val cityQuery = _cityQuery.asStateFlow()

    private val _searchResults = MutableStateFlow<List<CityResult>>(emptyList())
    val searchResults = _searchResults.asStateFlow()

    private val _isSearchingCity = MutableStateFlow(false)
    val isSearchingCity = _isSearchingCity.asStateFlow()

    private val _isCalculating = MutableStateFlow(false)
    val isCalculating = _isCalculating.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error = _error.asStateFlow()

    private val _chartResult = MutableSharedFlow<ChartResponse>()
    val chartResult = _chartResult.asSharedFlow()

    private var appContext: Context? = null

    fun setContext(context: Context) {
        appContext = context.applicationContext
    }

    init {
        // Debounced city search geocoder
        viewModelScope.launch {
            _cityQuery
                .debounce(350)
                .filter { it.length >= 2 && it != _city.value }
                .distinctUntilChanged()
                .collect { query ->
                    searchCity(query)
                }
        }
    }

    fun updateDate(newDate: String) {
        _date.value = newDate
    }

    fun updateTime(newTime: String) {
        _time.value = newTime
    }

    fun updateCityQuery(query: String) {
        _cityQuery.value = query
        if (query != _city.value) {
            _city.value = ""
            _latitude.value = null
            _longitude.value = null
        }
        if (query.isEmpty()) {
            _searchResults.value = emptyList()
        }
    }

    fun selectCity(cityResult: CityResult) {
        _city.value = cityResult.name
        _cityQuery.value = cityResult.name
        _latitude.value = cityResult.lat
        _longitude.value = cityResult.lon
        _timezone.value = cityResult.tz
        _searchResults.value = emptyList()
    }

    fun updateTimezone(tz: Double) {
        _timezone.value = tz
    }

    fun clearError() {
        _error.value = null
    }

    private fun searchCity(query: String) {
        val ctx = appContext ?: return
        viewModelScope.launch {
            _isSearchingCity.value = true
            try {
                val results = OfflineLocationHelper.searchCities(ctx, query)
                _searchResults.value = results
            } catch (e: Exception) {
                _searchResults.value = emptyList()
            } finally {
                _isSearchingCity.value = false
            }
        }
    }

    fun updateSelectedLanguage(language: String, context: Context) {
        _selectedLanguage.value = language
        val prefs = context.getSharedPreferences("vedic_prefs", Context.MODE_PRIVATE)
        prefs.edit().putString("selected_language", language).apply()
    }

    fun loadLanguage(context: Context) {
        val prefs = context.getSharedPreferences("vedic_prefs", Context.MODE_PRIVATE)
        _selectedLanguage.value = prefs.getString("selected_language", "English") ?: "English"
    }

    fun loadSavedProfile(context: Context) {
        val prefs = context.getSharedPreferences("vedic_prefs", Context.MODE_PRIVATE)
        val savedDate = prefs.getString("birth_date", "") ?: ""
        val savedTime = prefs.getString("birth_time", "") ?: ""
        val savedCity = prefs.getString("birth_city", "") ?: ""
        val savedLat = prefs.getFloat("birth_lat", 0.0f)
        val savedLon = prefs.getFloat("birth_lon", 0.0f)
        val savedTz = prefs.getFloat("birth_tz", 5.5f)
        val savedChartJson = prefs.getString("saved_chart_json", "") ?: ""

        if (savedDate.isNotEmpty() && savedCity.isNotEmpty()) {
            _date.value = savedDate
            _time.value = savedTime
            _city.value = savedCity
            _cityQuery.value = savedCity
            _latitude.value = savedLat.toDouble()
            _longitude.value = savedLon.toDouble()
            _timezone.value = savedTz.toDouble()
        }

        if (savedChartJson.isNotEmpty()) {
            _hasSavedChart.value = true
            _savedChartInfo.value = "$savedCity • $savedDate"
        }
    }

    fun loadSavedChart(context: Context) {
        val prefs = context.getSharedPreferences("vedic_prefs", Context.MODE_PRIVATE)
        val json = prefs.getString("saved_chart_json", null) ?: return
        try {
            val chart = gson.fromJson(json, ChartResponse::class.java)
            if (chart != null) {
                viewModelScope.launch {
                    _chartResult.emit(chart)
                }
            }
        } catch (e: Exception) {
            _error.value = "Failed to load saved chart"
        }
    }

    fun clearSavedData(context: Context) {
        val prefs = context.getSharedPreferences("vedic_prefs", Context.MODE_PRIVATE)
        prefs.edit()
            .remove("birth_date")
            .remove("birth_time")
            .remove("birth_city")
            .remove("birth_lat")
            .remove("birth_lon")
            .remove("birth_tz")
            .remove("saved_chart_json")
            .apply()
        _date.value = ""
        _time.value = ""
        _city.value = ""
        _cityQuery.value = ""
        _latitude.value = null
        _longitude.value = null
        _timezone.value = 5.5
        _hasSavedChart.value = false
        _savedChartInfo.value = null
    }

    fun calculateChart(context: Context) {
        val d = normalizeDate(_date.value)
        val t = normalizeTime(_time.value)
        _date.value = d
        _time.value = t

        val c = _city.value
        val lat = _latitude.value
        val lon = _longitude.value

        if (d.length != 10) {
            _error.value = "Please enter a valid date (DD/MM/YYYY)"
            return
        }
        if (t.length != 5) {
            _error.value = "Please enter a valid time (HH:MM)"
            return
        }
        if (c.isEmpty() || lat == null || lon == null) {
            _error.value = "Please select a valid city from search"
            return
        }

        _isCalculating.value = true
        _error.value = null

        viewModelScope.launch {
            try {
                // 100% Offline On-Device Vedic Astrology Calculation via Rust Native Core (with Kotlin fallback)
                val response = RustBridge.computeChart(
                    BirthDataRequest(
                        date = d,
                        time = t,
                        city = c,
                        lat = lat,
                        lon = lon,
                        timezone = _timezone.value
                    )
                )

                // Persist profile and complete astrology chart data locally
                val prefs = context.getSharedPreferences("vedic_prefs", Context.MODE_PRIVATE)
                val chartJson = gson.toJson(response)
                prefs.edit()
                    .putString("birth_date", d)
                    .putString("birth_time", t)
                    .putString("birth_city", c)
                    .putFloat("birth_lat", lat.toFloat())
                    .putFloat("birth_lon", lon.toFloat())
                    .putFloat("birth_tz", _timezone.value.toFloat())
                    .putString("saved_chart_json", chartJson)
                    .apply()

                _hasSavedChart.value = true
                _savedChartInfo.value = "$c • $d"

                _chartResult.emit(response)
            } catch (e: Exception) {
                _error.value = e.message ?: "Failed to calculate birth chart"
            } finally {
                _isCalculating.value = false
            }
        }
    }
}
