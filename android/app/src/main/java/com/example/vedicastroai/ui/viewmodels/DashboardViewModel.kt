package com.example.vedicastroai.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.vedicastroai.data.models.ChatMessage
import com.example.vedicastroai.data.models.ChartResponse
import com.example.vedicastroai.data.network.ApiClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class DashboardViewModel : ViewModel() {

    private lateinit var chartData: ChartResponse
    private var isInitialized = false

    // Tabs: 0: Charts, 1: Planets, 2: Dashas & Yogas, 3: Rishi Chat, 4: Deep Report
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

    fun init(chart: ChartResponse) {
        if (isInitialized) return
        this.chartData = chart
        isInitialized = true

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
                // Pass history excluding the last empty model message
                val history = _chatMessages.value.dropLast(1)
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
}
