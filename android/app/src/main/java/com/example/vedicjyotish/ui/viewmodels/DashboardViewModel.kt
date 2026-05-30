package com.example.vedicjyotish.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.vedicjyotish.data.models.ChatMessage
import com.example.vedicjyotish.data.models.ChartResponse
import com.example.vedicjyotish.data.network.ApiClient
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class DashboardViewModel : ViewModel() {

    private lateinit var chartData: ChartResponse
    private var isInitialized = false

    // Tabs: 0: Charts, 1: Planets, 2: Dashas & Yogas, 3: Rishi Chat, 4: Deep Report, 5: Compatibility
    private val _selectedTab = MutableStateFlow(0)
    val selectedTab = _selectedTab.asStateFlow()

    // --- Deep Report State ---
    private val _reportText = MutableStateFlow("")
    val reportText = _reportText.asStateFlow()

    private val _isGeneratingReport = MutableStateFlow(false)
    val isGeneratingReport = _isGeneratingReport.asStateFlow()

    private val _reportError = MutableStateFlow<String?>(null)
    val reportError = _reportError.asStateFlow()

    // --- Rishi Chat State ---
    private val _chatMessages = MutableStateFlow<List<ChatMessage>>(emptyList())
    val chatMessages = _chatMessages.asStateFlow()

    private val _chatInput = MutableStateFlow("")
    val chatInput = _chatInput.asStateFlow()

    private val _isChatStreaming = MutableStateFlow(false)
    val isChatStreaming = _isChatStreaming.asStateFlow()

    private val _chatError = MutableStateFlow<String?>(null)
    val chatError = _chatError.asStateFlow()

    private val _questionCount = MutableStateFlow(0)
    val questionCount = _questionCount.asStateFlow()

    // --- Compatibility / Kundali Matching States ---
    private val _matchingDate = MutableStateFlow("") // DD/MM/YYYY
    val matchingDate = _matchingDate.asStateFlow()

    private val _matchingTime = MutableStateFlow("") // HH:MM
    val matchingTime = _matchingTime.asStateFlow()

    private val _matchingCityQuery = MutableStateFlow("")
    val matchingCityQuery = _matchingCityQuery.asStateFlow()

    private val _matchingCity = MutableStateFlow("")
    val matchingCity = _matchingCity.asStateFlow()

    private val _matchingLatitude = MutableStateFlow<Double?>(null)
    val matchingLatitude = _matchingLatitude.asStateFlow()

    private val _matchingLongitude = MutableStateFlow<Double?>(null)
    val matchingLongitude = _matchingLongitude.asStateFlow()

    private val _matchingSearchResults = MutableStateFlow<List<com.example.vedicjyotish.data.models.CityResult>>(emptyList())
    val matchingSearchResults = _matchingSearchResults.asStateFlow()

    private val _isMatchingSearchingCity = MutableStateFlow(false)
    val isMatchingSearchingCity = _isMatchingSearchingCity.asStateFlow()

    private val _matchingMethod = MutableStateFlow("North") // "North" or "South"
    val matchingMethod = _matchingMethod.asStateFlow()

    private val _isCalculatingMatching = MutableStateFlow(false)
    val isCalculatingMatching = _isCalculatingMatching.asStateFlow()

    private val _matchingError = MutableStateFlow<String?>(null)
    val matchingError = _matchingError.asStateFlow()

    private val _compatibilityResult = MutableStateFlow<com.example.vedicjyotish.data.models.CompatibilityResponse?>(null)
    val compatibilityResult = _compatibilityResult.asStateFlow()

    fun init(chart: ChartResponse) {
        if (isInitialized && this::chartData.isInitialized && this.chartData == chart) return
        this.chartData = chart
        isInitialized = true
        initDebouncedIfNeeded()

        // Reset report state
        _reportText.value = ""
        _isGeneratingReport.value = false
        _reportError.value = null

        // Reset chat state
        _chatInput.value = ""
        _isChatStreaming.value = false
        _chatError.value = null
        _questionCount.value = 0

        // Initialize Chat with Rishi greeting
        _chatMessages.value = listOf(
            ChatMessage(
                role = "model",
                text = "Welcome, seeker. I am Rishi, your celestial guide. By studying your birth chart with Ascendant in ${chart.ascendant.sign} and Nakshatra ${chart.moonIntelligence.nakshatra}, I can help you decode the influence of the planets on your destiny. What would you like to ask about your life path, career, or relationships?"
            )
        )
    }

    fun selectTab(tabIndex: Int) {
        _selectedTab.value = tabIndex
        if (tabIndex == 4 && _reportText.value.isEmpty() && !_isGeneratingReport.value) {
            // Trigger report generation when deep report tab is first opened
            generateDeepReport()
        }
    }

    // ──────────────────────────────────────────────────────
    //  Deep Report Generation (SSE Streaming)
    // ──────────────────────────────────────────────────────
    fun generateDeepReport() {
        if (!isInitialized) return
        _isGeneratingReport.value = true
        _reportText.value = ""
        _reportError.value = null

        viewModelScope.launch {
            try {
                ApiClient.service.generateReportStream(
                    chartData = chartData,
                    onChunk = { chunk ->
                        _reportText.value += chunk
                    },
                    onDone = {
                        _isGeneratingReport.value = false
                    },
                    onError = { error ->
                        _reportError.value = error
                        _isGeneratingReport.value = false
                    }
                )
            } catch (e: Exception) {
                _reportError.value = e.message ?: "Failed to generate report"
                _isGeneratingReport.value = false
            }
        }
    }

    // ──────────────────────────────────────────────────────
    //  Rishi Chat (SSE Streaming with 3-question limit)
    // ──────────────────────────────────────────────────────
    fun updateChatInput(input: String) {
        _chatInput.value = input
    }

    fun sendChatMessage() {
        val question = _chatInput.value.trim()
        if (question.isEmpty() || _isChatStreaming.value) return
        if (_questionCount.value >= 3) {
            _chatError.value = "You have reached the free-tier limit of 3 questions. Consult a premium astrologer for deeper readings."
            return
        }

        // Add user question
        val updatedMessages = _chatMessages.value.toMutableList()
        updatedMessages.add(ChatMessage(role = "user", text = question))
        _chatMessages.value = updatedMessages
        _chatInput.value = ""
        _chatError.value = null
        _isChatStreaming.value = true
        _questionCount.value += 1

        // Add an empty model message to stream into
        val modelMessageIndex = updatedMessages.size
        updatedMessages.add(ChatMessage(role = "model", text = ""))
        _chatMessages.value = updatedMessages

        viewModelScope.launch {
            var accumulatedText = ""
            try {
                // Pass history excluding the first welcome greeting and the last empty model message
                val history = _chatMessages.value.subList(1, _chatMessages.value.size - 1)
                ApiClient.service.chatStream(
                    chartData = chartData,
                    question = question,
                    history = history,
                    onChunk = { chunk ->
                        accumulatedText += chunk
                        val list = _chatMessages.value.toMutableList()
                        if (modelMessageIndex < list.size) {
                            list[modelMessageIndex] = ChatMessage(role = "model", text = accumulatedText)
                            _chatMessages.value = list
                        }
                    },
                    onDone = {
                        _isChatStreaming.value = false
                    },
                    onError = { error ->
                        _chatError.value = error
                        _isChatStreaming.value = false
                    }
                )
            } catch (e: Exception) {
                _chatError.value = e.message ?: "Failed to get chat response"
                _isChatStreaming.value = false
            }
        }
    }

    // ──────────────────────────────────────────────────────
    //  Compatibility (Ashtakoota Matching) Methods & Autocomplete
    // ──────────────────────────────────────────────────────
    private var isDebouncedSearchInitialized = false

    @OptIn(kotlinx.coroutines.FlowPreview::class)
    private fun initDebouncedSearch() {
        viewModelScope.launch {
            _matchingCityQuery
                .debounce(500)
                .filter { it.length >= 3 && it != _matchingCity.value }
                .distinctUntilChanged()
                .collect { query ->
                    searchMatchingCity(query)
                }
        }
    }

    fun updateMatchingDate(newDate: String) {
        _matchingDate.value = newDate
    }

    fun updateMatchingTime(newTime: String) {
        _matchingTime.value = newTime
    }

    fun updateMatchingCityQuery(query: String) {
        _matchingCityQuery.value = query
        if (query != _matchingCity.value) {
            _matchingCity.value = ""
            _matchingLatitude.value = null
            _matchingLongitude.value = null
        }
        if (query.isEmpty()) {
            _matchingSearchResults.value = emptyList()
        }
    }

    fun selectMatchingCity(cityResult: com.example.vedicjyotish.data.models.CityResult) {
        _matchingCity.value = cityResult.name
        _matchingCityQuery.value = cityResult.name
        _matchingLatitude.value = cityResult.lat
        _matchingLongitude.value = cityResult.lon
        _matchingSearchResults.value = emptyList()
    }

    fun setMatchingMethod(method: String) {
        _matchingMethod.value = method
    }

    private fun searchMatchingCity(query: String) {
        viewModelScope.launch {
            _isMatchingSearchingCity.value = true
            try {
                val results = ApiClient.service.searchCity(query)
                _matchingSearchResults.value = results
            } catch (e: Exception) {
                _matchingSearchResults.value = emptyList()
            } finally {
                _isMatchingSearchingCity.value = false
            }
        }
    }

    fun loadActiveProfile(context: android.content.Context) {
        val prefs = context.getSharedPreferences("vedic_prefs", android.content.Context.MODE_PRIVATE)
        _matchingDate.value = prefs.getString("birth_date", "") ?: ""
        _matchingTime.value = prefs.getString("birth_time", "") ?: ""
        val city = prefs.getString("birth_city", "") ?: ""
        _matchingCity.value = city
        _matchingCityQuery.value = city
        _matchingLatitude.value = prefs.getFloat("birth_lat", 0.0f).toDouble()
        _matchingLongitude.value = prefs.getFloat("birth_lon", 0.0f).toDouble()
    }

    fun calculateCompatibility(context: android.content.Context) {
        val d = _matchingDate.value
        val t = _matchingTime.value
        val c = _matchingCity.value
        val lat = _matchingLatitude.value
        val lon = _matchingLongitude.value

        if (d.length != 10) {
            _matchingError.value = "Please enter a valid date (DD/MM/YYYY)"
            return
        }
        if (t.length != 5) {
            _matchingError.value = "Please enter a valid time (HH:MM)"
            return
        }
        if (c.isEmpty() || lat == null || lon == null) {
            _matchingError.value = "Please select a valid city from search"
            return
        }

        _isCalculatingMatching.value = true
        _matchingError.value = null
        _compatibilityResult.value = null

        viewModelScope.launch {
            try {
                val prefs = context.getSharedPreferences("vedic_prefs", android.content.Context.MODE_PRIVATE)
                val boyDate = prefs.getString("birth_date", "") ?: ""
                val boyTime = prefs.getString("birth_time", "") ?: ""
                val boyCity = prefs.getString("birth_city", "") ?: ""
                val boyLat = prefs.getFloat("birth_lat", 0.0f).toDouble()
                val boyLon = prefs.getFloat("birth_lon", 0.0f).toDouble()

                if (boyDate.isEmpty() || boyTime.isEmpty() || boyCity.isEmpty()) {
                    _matchingError.value = "Please calculate your own birth chart first before matching."
                    _isCalculatingMatching.value = false
                    return@launch
                }

                val boyRequest = com.example.vedicjyotish.data.models.BirthDataRequest(
                    date = boyDate,
                    time = boyTime,
                    city = boyCity,
                    lat = boyLat,
                    lon = boyLon
                )

                val girlRequest = com.example.vedicjyotish.data.models.BirthDataRequest(
                    date = d,
                    time = t,
                    city = c,
                    lat = lat,
                    lon = lon
                )

                val result = ApiClient.service.calculateCompatibility(
                    boy = boyRequest,
                    girl = girlRequest,
                    method = _matchingMethod.value
                )
                _compatibilityResult.value = result
            } catch (e: Exception) {
                _matchingError.value = e.message ?: "Failed to calculate compatibility"
            } finally {
                _isCalculatingMatching.value = false
            }
        }
    }

    fun initDebouncedIfNeeded() {
        if (!isDebouncedSearchInitialized) {
            isDebouncedSearchInitialized = true
            initDebouncedSearch()
        }
    }
}
