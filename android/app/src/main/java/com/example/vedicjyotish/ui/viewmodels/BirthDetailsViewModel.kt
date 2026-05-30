package com.example.vedicjyotish.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.vedicjyotish.data.models.BirthDataRequest
import com.example.vedicjyotish.data.models.ChartResponse
import com.example.vedicjyotish.data.models.CityResult
import com.example.vedicjyotish.data.network.ApiClient
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

@OptIn(FlowPreview::class)
class BirthDetailsViewModel : ViewModel() {

    private val _date = MutableStateFlow("") // DD/MM/YYYY
    val date = _date.asStateFlow()

    private val _time = MutableStateFlow("") // HH:MM
    val time = _time.asStateFlow()

    private val _city = MutableStateFlow("")
    val city = _city.asStateFlow()

    private val _latitude = MutableStateFlow<Double?>(null)
    val latitude = _latitude.asStateFlow()

    private val _longitude = MutableStateFlow<Double?>(null)
    val longitude = _longitude.asStateFlow()

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

    init {
        // Debounced city search geocoder
        viewModelScope.launch {
            _cityQuery
                .debounce(500)
                .filter { it.length >= 3 && it != _city.value }
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
        _searchResults.value = emptyList()
    }

    fun clearError() {
        _error.value = null
    }

    private fun searchCity(query: String) {
        viewModelScope.launch {
            _isSearchingCity.value = true
            try {
                val results = ApiClient.service.searchCity(query)
                _searchResults.value = results
            } catch (e: Exception) {
                _searchResults.value = emptyList()
            } finally {
                _isSearchingCity.value = false
            }
        }
    }

    fun calculateChart() {
        val d = _date.value
        val t = _time.value
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
                val request = BirthDataRequest(
                    date = d,
                    time = t,
                    city = c,
                    lat = lat,
                    lon = lon
                )
                val response = ApiClient.service.calculateChart(request)
                _chartResult.emit(response)
            } catch (e: Exception) {
                _error.value = e.message ?: "Failed to calculate birth chart"
            } finally {
                _isCalculating.value = false
            }
        }
    }
}
