package com.example.vedicjyotish.data.ai

import android.content.Context
import android.content.SharedPreferences
import com.example.vedicjyotish.data.models.ChatMessage
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.util.UUID

data class ChatSession(
    val id: String = UUID.randomUUID().toString(),
    var title: String = "New Consultation",
    val createdAt: Long = System.currentTimeMillis(),
    val messages: MutableList<ChatMessage> = mutableListOf()
)

/**
 * Manages multiple persistent chat sessions locally without limits.
 */
class ChatSessionManager(context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences("vedic_chat_sessions", Context.MODE_PRIVATE)
    private val gson = Gson()

    private var _sessions: MutableList<ChatSession> = mutableListOf()
    var activeSessionId: String = ""
        private set

    init {
        loadSessions()
        if (_sessions.isEmpty()) {
            val defaultSession = ChatSession()
            _sessions.add(defaultSession)
            activeSessionId = defaultSession.id
            saveSessions()
        } else {
            activeSessionId = prefs.getString("last_active_session_id", _sessions.first().id) ?: _sessions.first().id
            if (_sessions.none { it.id == activeSessionId }) {
                activeSessionId = _sessions.first().id
            }
        }
    }

    fun getAllSessions(): List<ChatSession> = _sessions.toList()

    fun getActiveSession(): ChatSession {
        return _sessions.firstOrNull { it.id == activeSessionId } ?: run {
            val newS = ChatSession()
            _sessions.add(0, newS)
            activeSessionId = newS.id
            saveSessions()
            newS
        }
    }

    fun startNewSession(initialGreeting: String): ChatSession {
        val newS = ChatSession(
            title = "Consultation ${_sessions.size + 1}",
            messages = mutableListOf(ChatMessage(role = "model", text = initialGreeting))
        )
        _sessions.add(0, newS)
        activeSessionId = newS.id
        saveSessions()
        return newS
    }

    fun switchToSession(sessionId: String): ChatSession? {
        val target = _sessions.firstOrNull { it.id == sessionId } ?: return null
        activeSessionId = target.id
        prefs.edit().putString("last_active_session_id", activeSessionId).apply()
        return target
    }

    fun deleteSession(sessionId: String): Boolean {
        if (_sessions.size <= 1) return false // Keep at least one
        _sessions.removeAll { it.id == sessionId }
        if (activeSessionId == sessionId) {
            activeSessionId = _sessions.first().id
        }
        saveSessions()
        return true
    }

    fun addMessageToActive(msg: ChatMessage) {
        val session = getActiveSession()
        session.messages.add(msg)
        // Auto-title session from first user question if title is still default
        if (msg.role == "user" && (session.title.startsWith("New Consultation") || session.title.startsWith("Consultation "))) {
            session.title = msg.text.take(30).trim() + if (msg.text.length > 30) "..." else ""
        }
        saveSessions()
    }

    fun updateLastMessageInActive(text: String) {
        val session = getActiveSession()
        if (session.messages.isNotEmpty()) {
            val last = session.messages.last()
            session.messages[session.messages.size - 1] = last.copy(text = text)
            saveSessions()
        }
    }

    private fun loadSessions() {
        val json = prefs.getString("sessions_json", null) ?: return
        try {
            val type = object : TypeToken<MutableList<ChatSession>>() {}.type
            _sessions = gson.fromJson(json, type) ?: mutableListOf()
        } catch (e: Exception) {
            _sessions = mutableListOf()
        }
    }

    private fun saveSessions() {
        val json = gson.toJson(_sessions)
        prefs.edit()
            .putString("sessions_json", json)
            .putString("last_active_session_id", activeSessionId)
            .apply()
    }
}
