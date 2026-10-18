package com.example.vedicjyotish.ui.viewmodels

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.vedicjyotish.data.ai.AiKeyManager
import com.example.vedicjyotish.data.ai.ChatSession
import com.example.vedicjyotish.data.ai.ChatSessionManager
import com.example.vedicjyotish.data.ai.VedicAiClient
import com.example.vedicjyotish.data.astrology.CompatibilityEngine
import com.example.vedicjyotish.data.astrology.OfflineLocationHelper
import com.example.vedicjyotish.data.astrology.RustBridge
import com.example.vedicjyotish.data.models.*
import com.example.vedicjyotish.utils.DateTimeUtils.normalizeDate
import com.example.vedicjyotish.utils.DateTimeUtils.normalizeTime
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class DashboardViewModel : ViewModel() {

    lateinit var chartData: ChartResponse
        private set
    var isInitialized = false
        private set

    lateinit var aiKeyManager: AiKeyManager
        private set
    private lateinit var aiClient: VedicAiClient
    private lateinit var chatSessionManager: ChatSessionManager
    private lateinit var appContext: Context

    private val _selectedLanguage = MutableStateFlow("English")
    val selectedLanguage = _selectedLanguage.asStateFlow()

    // Tabs:
    // 0: Charts (D1/D9), 1: Planets, 2: Dashas & Yogas, 3: Panchanga, 4: Rishi Chat, 5: Deep Report, 6: Compatibility
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

    private val _allSessions = MutableStateFlow<List<ChatSession>>(emptyList())
    val allSessions = _allSessions.asStateFlow()

    private val _activeSessionTitle = MutableStateFlow("Consultation")
    val activeSessionTitle = _activeSessionTitle.asStateFlow()

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

    private val _matchingSearchResults = MutableStateFlow<List<CityResult>>(emptyList())
    val matchingSearchResults = _matchingSearchResults.asStateFlow()

    private val _isMatchingSearchingCity = MutableStateFlow(false)
    val isMatchingSearchingCity = _isMatchingSearchingCity.asStateFlow()

    private val _matchingMethod = MutableStateFlow("North")
    val matchingMethod = _matchingMethod.asStateFlow()

    private val _myGender = MutableStateFlow("Male") // "Male" or "Female"
    val myGender = _myGender.asStateFlow()

    private val _matchingTimezone = MutableStateFlow(5.5)
    val matchingTimezone = _matchingTimezone.asStateFlow()

    private val _isCalculatingMatching = MutableStateFlow(false)
    val isCalculatingMatching = _isCalculatingMatching.asStateFlow()

    private val _matchingError = MutableStateFlow<String?>(null)
    val matchingError = _matchingError.asStateFlow()

    private val _compatibilityResult = MutableStateFlow<CompatibilityResponse?>(null)
    val compatibilityResult = _compatibilityResult.asStateFlow()

    fun init(chart: ChartResponse, context: Context) {
        appContext = context.applicationContext
        val prefs = context.getSharedPreferences("vedic_prefs", Context.MODE_PRIVATE)
        _selectedLanguage.value = prefs.getString("selected_language", "English") ?: "English"

        aiKeyManager = AiKeyManager(context)
        aiClient = VedicAiClient(aiKeyManager)
        chatSessionManager = ChatSessionManager(context)

        if (isInitialized && this::chartData.isInitialized && this.chartData == chart) {
            refreshChatState()
            return
        }
        this.chartData = chart
        isInitialized = true
        initDebouncedIfNeeded()

        // Reset report state
        _reportText.value = ""
        _isGeneratingReport.value = false
        _reportError.value = null

        // Initial welcome message if session is fresh
        val active = chatSessionManager.getActiveSession()
        if (active.messages.isEmpty()) {
            val greeting = "Welcome, seeker. I am Rishi, your celestial guide. By analyzing your birth chart with Ascendant in ${chart.ascendant.sign} and Nakshatra ${chart.moonIntelligence.nakshatra}, I am here to help you decode your karmic flow, career path, and relationships. What would you like to ask?"
            chatSessionManager.addMessageToActive(ChatMessage(role = "model", text = greeting))
        }

        refreshChatState()
    }

    private fun refreshChatState() {
        if (!this::chatSessionManager.isInitialized) return
        val active = chatSessionManager.getActiveSession()
        _chatMessages.value = active.messages.toList()
        _activeSessionTitle.value = active.title
        _allSessions.value = chatSessionManager.getAllSessions()
    }

    fun selectTab(tabIndex: Int) {
        _selectedTab.value = tabIndex
        if (tabIndex == 4 && _reportText.value.isEmpty() && !_isGeneratingReport.value) {
            // Trigger report generation when deep report tab is first opened
            generateDeepReport()
        }
    }

    // ──────────────────────────────────────────────────────
    //  Deep Report Generation (Direct On-Device AI Streaming)
    // ──────────────────────────────────────────────────────
    fun generateDeepReport() {
        if (!isInitialized) return
        _isGeneratingReport.value = true
        _reportText.value = ""
        _reportError.value = null

        viewModelScope.launch {
            try {
                aiClient.streamDeepReport(
                    chartData = chartData,
                    language = _selectedLanguage.value,
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
    //  Rishi Chat (Unlimited Multi-Turn On-Device Streaming)
    // ──────────────────────────────────────────────────────
    fun updateChatInput(input: String) {
        _chatInput.value = input
    }

    fun startNewChat() {
        if (!this::chatSessionManager.isInitialized || !this::chartData.isInitialized) return
        val greeting = "Greetings, seeker. I am ready to delve into another sphere of your horoscope. Ask me anything about your current planetary influences, career, or personal destiny."
        chatSessionManager.startNewSession(greeting)
        refreshChatState()
    }

    fun switchSession(sessionId: String) {
        if (!this::chatSessionManager.isInitialized) return
        chatSessionManager.switchToSession(sessionId)
        refreshChatState()
    }

    fun sendChatMessage() {
        val question = _chatInput.value.trim()
        if (question.isEmpty() || _isChatStreaming.value) return

        val userMsg = ChatMessage(role = "user", text = question)
        chatSessionManager.addMessageToActive(userMsg)

        val modelMsg = ChatMessage(role = "model", text = "")
        chatSessionManager.addMessageToActive(modelMsg)

        _chatInput.value = ""
        _chatError.value = null
        _isChatStreaming.value = true
        refreshChatState()

        viewModelScope.launch {
            var accumulatedText = ""
            try {
                val active = chatSessionManager.getActiveSession()
                // Pass history excluding the placeholder last message
                val history = active.messages.dropLast(1)

                aiClient.streamChat(
                    chartData = chartData,
                    messages = history,
                    language = _selectedLanguage.value,
                    onChunk = { chunk ->
                        accumulatedText += chunk
                        chatSessionManager.updateLastMessageInActive(accumulatedText)
                        refreshChatState()
                    },
                    onDone = {
                        _isChatStreaming.value = false
                        refreshChatState()
                    },
                    onError = { error ->
                        _chatError.value = error
                        _isChatStreaming.value = false
                        refreshChatState()
                    }
                )
            } catch (e: Exception) {
                _chatError.value = e.message ?: "Chat streaming failed"
                _isChatStreaming.value = false
                refreshChatState()
            }
        }
    }

    // ──────────────────────────────────────────────────────
    //  Compatibility (100% On-Device Ashtakoota Guna Milan)
    // ──────────────────────────────────────────────────────
    private var isDebouncedSearchInitialized = false

    @OptIn(kotlinx.coroutines.FlowPreview::class)
    private fun initDebouncedSearch() {
        viewModelScope.launch {
            _matchingCityQuery
                .debounce(350)
                .filter { it.length >= 2 && it != _matchingCity.value }
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

    fun selectMatchingCity(cityResult: CityResult) {
        _matchingCity.value = cityResult.name
        _matchingCityQuery.value = cityResult.name
        _matchingLatitude.value = cityResult.lat
        _matchingLongitude.value = cityResult.lon
        _matchingTimezone.value = cityResult.tz
        _matchingSearchResults.value = emptyList()
    }

    fun updateMyGender(gender: String) {
        _myGender.value = gender
    }

    fun updateMatchingTimezone(tz: Double) {
        _matchingTimezone.value = tz
    }

    fun setMatchingMethod(method: String) {
        _matchingMethod.value = method
    }

    private fun searchMatchingCity(query: String) {
        viewModelScope.launch {
            _isMatchingSearchingCity.value = true
            try {
                val results = OfflineLocationHelper.searchCities(appContext, query)
                _matchingSearchResults.value = results
            } catch (e: Exception) {
                _matchingSearchResults.value = emptyList()
            } finally {
                _isMatchingSearchingCity.value = false
            }
        }
    }

    fun loadActiveProfile(context: Context) {
        val prefs = context.getSharedPreferences("vedic_prefs", Context.MODE_PRIVATE)
        _matchingDate.value = prefs.getString("birth_date", "") ?: ""
        _matchingTime.value = prefs.getString("birth_time", "") ?: ""
        val city = prefs.getString("birth_city", "") ?: ""
        _matchingCity.value = city
        _matchingCityQuery.value = city
        _matchingLatitude.value = prefs.getFloat("birth_lat", 0.0f).toDouble()
        _matchingLongitude.value = prefs.getFloat("birth_lon", 0.0f).toDouble()
    }

    fun updateSelectedLanguage(language: String, context: Context) {
        _selectedLanguage.value = language
        val prefs = context.getSharedPreferences("vedic_prefs", Context.MODE_PRIVATE)
        prefs.edit().putString("selected_language", language).apply()

        if (_selectedTab.value == 4) {
            generateDeepReport()
        }
    }

    fun calculateCompatibility(context: Context) {
        val d = normalizeDate(_matchingDate.value)
        val t = normalizeTime(_matchingTime.value)
        _matchingDate.value = d
        _matchingTime.value = t

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
                val prefs = context.getSharedPreferences("vedic_prefs", Context.MODE_PRIVATE)
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

                val myTz = prefs.getFloat("birth_tz", 5.5f).toDouble()
                val partnerTz = _matchingTimezone.value

                // 1. Calculate Primary User Chart on-device
                val myChart = RustBridge.computeChart(
                    BirthDataRequest(
                        date = boyDate,
                        time = boyTime,
                        city = boyCity,
                        lat = boyLat,
                        lon = boyLon,
                        timezone = myTz
                    )
                )

                // 2. Calculate Matching Partner Chart on-device
                val partnerChart = RustBridge.computeChart(
                    BirthDataRequest(
                        date = d,
                        time = t,
                        city = c,
                        lat = lat,
                        lon = lon,
                        timezone = partnerTz
                    )
                )

                // Correctly assign Groom (Boy) and Bride (Girl) based on user's gender
                val boyChart = if (_myGender.value == "Male") myChart else partnerChart
                val girlChart = if (_myGender.value == "Male") partnerChart else myChart

                // 3. Compute 36-point Ashtakoota Guna Milan on-device
                val result = CompatibilityEngine.calculateMatching(
                    boySign = boyChart.moonIntelligence.sign,
                    boyNakshatra = boyChart.moonIntelligence.nakshatra,
                    boyPada = boyChart.moonIntelligence.pada,
                    girlSign = girlChart.moonIntelligence.sign,
                    girlNakshatra = girlChart.moonIntelligence.nakshatra,
                    girlPada = girlChart.moonIntelligence.pada,
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
