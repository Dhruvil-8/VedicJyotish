package com.example.vedicjyotish.data.ai

import com.example.vedicjyotish.data.models.ChatMessage
import com.example.vedicjyotish.data.models.ChartResponse
import com.google.gson.Gson
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.BufferedReader
import java.io.InputStreamReader
import java.util.concurrent.TimeUnit

/**
 * Pure on-device Multi-Protocol AI Client for Vedic Astrology.
 * Communicates directly with Google Gemini, Anthropic Claude, or OpenAI-compatible (Groq, DeepSeek, OpenRouter, OpenAI, Mistral, Ollama, Custom) endpoints via SSE.
 */
class VedicAiClient(private val keyManager: AiKeyManager) {

    private val gson = Gson()
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    suspend fun streamChat(
        chartData: ChartResponse,
        messages: List<ChatMessage>,
        language: String = "English",
        onChunk: (String) -> Unit,
        onDone: () -> Unit,
        onError: (String) -> Unit
    ) = withContext(Dispatchers.IO) {
        val provider = keyManager.currentProvider
        val apiKey = keyManager.getKey(provider)
        if (apiKey.isEmpty() && provider.requiresKey) {
            onError("No API Key configured for ${provider.displayName}. Please tap the AI Settings icon to add your key.")
            return@withContext
        }

        val model = keyManager.getModel(provider).trim()
        if (model.isEmpty()) {
            onError("No AI model name configured for ${provider.displayName}. Please tap the AI Settings icon and enter your model name.")
            return@withContext
        }

        val baseUrl = keyManager.getBaseUrl(provider)
        val systemPrompt = buildSystemPrompt(chartData, language)

        try {
            when (provider.protocol) {
                ApiProtocol.GEMINI_REST -> {
                    streamGemini(apiKey, model, baseUrl, systemPrompt, messages, onChunk, onDone, onError)
                }
                ApiProtocol.ANTHROPIC_MESSAGES -> {
                    streamAnthropic(apiKey, model, baseUrl, systemPrompt, messages, onChunk, onDone, onError)
                }
                ApiProtocol.OPENAI_COMPATIBLE -> {
                    streamOpenAiCompatible(provider, apiKey, model, baseUrl, systemPrompt, messages, onChunk, onDone, onError)
                }
            }
        } catch (e: Exception) {
            onError(e.localizedMessage ?: "AI connection failed: ${e.message}")
        }
    }

    suspend fun streamDeepReport(
        chartData: ChartResponse,
        language: String = "English",
        onChunk: (String) -> Unit,
        onDone: () -> Unit,
        onError: (String) -> Unit
    ) = withContext(Dispatchers.IO) {
        val prompt = buildReportPrompt(chartData, language)
        val messages = listOf(ChatMessage(role = "user", text = prompt))
        streamChat(chartData, messages, language, onChunk, onDone, onError)
    }

    suspend fun testConnection(
        provider: AiProviderType,
        key: String,
        model: String,
        baseUrl: String
    ): Pair<Boolean, String> = withContext(Dispatchers.IO) {
        if (model.trim().isEmpty()) {
            return@withContext Pair(false, "Please enter a model name to test connection.")
        }
        try {
            when (provider.protocol) {
                ApiProtocol.GEMINI_REST -> {
                    val url = "$baseUrl/models/$model:generateContent?key=$key"
                    val bodyJson = """{"contents":[{"parts":[{"text":"Say Hello in one word."}]}]}"""
                    val req = Request.Builder()
                        .url(url)
                        .post(bodyJson.toRequestBody("application/json".toMediaType()))
                        .build()
                    val resp = client.newCall(req).execute()
                    val respBody = resp.body?.string() ?: ""
                    if (resp.isSuccessful) {
                        Pair(true, "Connection successful! Model: $model is ready.")
                    } else {
                        Pair(false, "Gemini Error (${resp.code}): $respBody")
                    }
                }
                ApiProtocol.ANTHROPIC_MESSAGES -> {
                    val url = "$baseUrl/messages"
                    val bodyJson = """{"model":"$model","max_tokens":10,"messages":[{"role":"user","content":"Say Hello in one word."}]}"""
                    val req = Request.Builder()
                        .url(url)
                        .header("x-api-key", key)
                        .header("anthropic-version", "2023-06-01")
                        .header("Content-Type", "application/json")
                        .post(bodyJson.toRequestBody("application/json".toMediaType()))
                        .build()
                    val resp = client.newCall(req).execute()
                    val respBody = resp.body?.string() ?: ""
                    if (resp.isSuccessful) {
                        Pair(true, "Connection successful! Anthropic model: $model is ready.")
                    } else {
                        Pair(false, "Anthropic Error (${resp.code}): $respBody")
                    }
                }
                ApiProtocol.OPENAI_COMPATIBLE -> {
                    val url = "$baseUrl/chat/completions"
                    val bodyJson = """{"model":"$model","messages":[{"role":"user","content":"Say Hello in one word."}],"max_tokens":10}"""
                    val reqBuilder = Request.Builder()
                        .url(url)
                        .header("Content-Type", "application/json")
                        .post(bodyJson.toRequestBody("application/json".toMediaType()))
                    if (key.isNotEmpty()) {
                        reqBuilder.header("Authorization", "Bearer $key")
                    }
                    val resp = client.newCall(reqBuilder.build()).execute()
                    val respBody = resp.body?.string() ?: ""
                    if (resp.isSuccessful) {
                        Pair(true, "Connection successful! Provider: ${provider.displayName}")
                    } else {
                        Pair(false, "${provider.displayName} Error (${resp.code}): $respBody")
                    }
                }
            }
        } catch (e: Exception) {
            Pair(false, "Network error: ${e.localizedMessage}")
        }
    }

    suspend fun fetchAvailableModels(
        provider: AiProviderType,
        apiKey: String,
        baseUrl: String
    ): Result<List<String>> = withContext(Dispatchers.IO) {
        if (provider.requiresKey && apiKey.trim().isEmpty()) {
            return@withContext Result.failure(Exception("Please enter an API Key first to fetch models."))
        }
        try {
            val reqBuilder = Request.Builder()
            when (provider.protocol) {
                ApiProtocol.GEMINI_REST -> {
                    val url = "$baseUrl/models?key=$apiKey"
                    reqBuilder.url(url)
                }
                ApiProtocol.ANTHROPIC_MESSAGES -> {
                    val url = "$baseUrl/models"
                    reqBuilder.url(url)
                        .header("x-api-key", apiKey)
                        .header("anthropic-version", "2023-06-01")
                }
                ApiProtocol.OPENAI_COMPATIBLE -> {
                    val url = "$baseUrl/models"
                    reqBuilder.url(url)
                    if (apiKey.isNotEmpty()) {
                        reqBuilder.header("Authorization", "Bearer $apiKey")
                    }
                }
            }

            val resp = client.newCall(reqBuilder.build()).execute()
            val body = resp.body?.string() ?: ""
            if (!resp.isSuccessful) {
                return@withContext Result.failure(Exception("Server returned HTTP ${resp.code}"))
            }

            val json = JsonParser.parseString(body).asJsonObject
            val modelsList = mutableListOf<String>()

            if (provider.protocol == ApiProtocol.GEMINI_REST) {
                val arr = json.getAsJsonArray("models")
                if (arr != null) {
                    for (el in arr) {
                        val name = el.asJsonObject.get("name")?.asString ?: ""
                        val clean = name.removePrefix("models/")
                        if (clean.isNotEmpty() && !clean.contains("embedding")) {
                            modelsList.add(clean)
                        }
                    }
                }
            } else {
                val dataArr = json.getAsJsonArray("data")
                if (dataArr != null) {
                    for (el in dataArr) {
                        val id = el.asJsonObject.get("id")?.asString ?: ""
                        if (id.isNotEmpty()) modelsList.add(id)
                    }
                }
            }

            modelsList.sort()
            Result.success(modelsList)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun streamGemini(
        apiKey: String,
        model: String,
        baseUrl: String,
        systemInstruction: String,
        messages: List<ChatMessage>,
        onChunk: (String) -> Unit,
        onDone: () -> Unit,
        onError: (String) -> Unit
    ) {
        val url = "$baseUrl/models/$model:streamGenerateContent?alt=sse"

        val contentsArray = mutableListOf<Map<String, Any>>()
        for (m in messages) {
            val role = if (m.role == "user") "user" else "model"
            contentsArray.add(mapOf("role" to role, "parts" to listOf(mapOf("text" to m.text))))
        }

        val payload = mutableMapOf<String, Any>(
            "contents" to contentsArray,
            "systemInstruction" to mapOf("parts" to listOf(mapOf("text" to systemInstruction)))
        )
        val jsonString = gson.toJson(payload)

        val request = Request.Builder()
            .url(url)
            .header("x-goog-api-key", apiKey)
            .header("Content-Type", "application/json")
            .post(jsonString.toRequestBody("application/json".toMediaType()))
            .build()

        val response = client.newCall(request).execute()
        if (!response.isSuccessful) {
            val errBody = response.body?.string() ?: ""
            onError("Gemini API Error (${response.code}): $errBody")
            return
        }

        val source = response.body?.byteStream() ?: run {
            onError("Empty response stream from Gemini")
            return
        }

        val reader = BufferedReader(InputStreamReader(source))
        var line: String?
        while (reader.readLine().also { line = it } != null) {
            val l = line?.trim() ?: continue
            if (l.startsWith("data:")) {
                val dataJson = l.removePrefix("data:").trim()
                if (dataJson.isNotEmpty() && dataJson != "[DONE]") {
                    try {
                        val parsed = JsonParser.parseString(dataJson).asJsonObject
                        val candidates = parsed.getAsJsonArray("candidates")
                        if (candidates != null && candidates.size() > 0) {
                            val firstCandidate = candidates.get(0).asJsonObject
                            val content = firstCandidate.getAsJsonObject("content")
                            if (content != null) {
                                val parts = content.getAsJsonArray("parts")
                                if (parts != null && parts.size() > 0) {
                                    val text = parts.get(0).asJsonObject.get("text")?.asString
                                    if (!text.isNullOrEmpty()) {
                                        onChunk(text)
                                    }
                                }
                            }
                        }
                    } catch (e: Exception) {
                        // ignore parse edge cases
                    }
                }
            }
        }
        onDone()
    }

    private fun streamAnthropic(
        apiKey: String,
        model: String,
        baseUrl: String,
        systemInstruction: String,
        messages: List<ChatMessage>,
        onChunk: (String) -> Unit,
        onDone: () -> Unit,
        onError: (String) -> Unit
    ) {
        val url = "$baseUrl/messages"

        val anthropicMessages = mutableListOf<Map<String, String>>()
        for (m in messages) {
            val role = if (m.role == "user") "user" else "assistant"
            anthropicMessages.add(mapOf("role" to role, "content" to m.text))
        }

        val payload = mapOf(
            "model" to model,
            "max_tokens" to 4096,
            "system" to systemInstruction,
            "messages" to anthropicMessages,
            "stream" to true
        )
        val jsonString = gson.toJson(payload)

        val request = Request.Builder()
            .url(url)
            .header("x-api-key", apiKey)
            .header("anthropic-version", "2023-06-01")
            .header("Content-Type", "application/json")
            .post(jsonString.toRequestBody("application/json".toMediaType()))
            .build()

        val response = client.newCall(request).execute()
        if (!response.isSuccessful) {
            val errBody = response.body?.string() ?: ""
            onError("Anthropic API Error (${response.code}): $errBody")
            return
        }

        val source = response.body?.byteStream() ?: run {
            onError("Empty response stream from Anthropic")
            return
        }

        val reader = BufferedReader(InputStreamReader(source))
        var line: String?
        while (reader.readLine().also { line = it } != null) {
            val l = line?.trim() ?: continue
            if (l.startsWith("data:")) {
                val dataJson = l.removePrefix("data:").trim()
                if (dataJson.isNotEmpty() && dataJson != "[DONE]") {
                    try {
                        val parsed = JsonParser.parseString(dataJson).asJsonObject
                        val type = parsed.get("type")?.asString
                        if (type == "content_block_delta") {
                            val delta = parsed.getAsJsonObject("delta")
                            if (delta != null && delta.has("text")) {
                                val text = delta.get("text")?.asString
                                if (!text.isNullOrEmpty()) {
                                    onChunk(text)
                                }
                            }
                        } else if (type == "message_stop") {
                            break
                        }
                    } catch (e: Exception) {
                        // ignore parse edge cases
                    }
                }
            }
        }
        onDone()
    }

    private fun streamOpenAiCompatible(
        provider: AiProviderType,
        apiKey: String,
        model: String,
        baseUrl: String,
        systemInstruction: String,
        messages: List<ChatMessage>,
        onChunk: (String) -> Unit,
        onDone: () -> Unit,
        onError: (String) -> Unit
    ) {
        val url = "$baseUrl/chat/completions"

        val openAiMessages = mutableListOf<Map<String, String>>()
        openAiMessages.add(mapOf("role" to "system", "content" to systemInstruction))
        for (m in messages) {
            val role = if (m.role == "user") "user" else "assistant"
            openAiMessages.add(mapOf("role" to role, "content" to m.text))
        }

        val payload = mapOf(
            "model" to model,
            "messages" to openAiMessages,
            "stream" to true,
            "temperature" to 0.7
        )
        val jsonString = gson.toJson(payload)

        val reqBuilder = Request.Builder()
            .url(url)
            .header("Content-Type", "application/json")
            .post(jsonString.toRequestBody("application/json".toMediaType()))

        if (apiKey.isNotEmpty()) {
            reqBuilder.header("Authorization", "Bearer $apiKey")
        }

        val response = client.newCall(reqBuilder.build()).execute()
        if (!response.isSuccessful) {
            val errBody = response.body?.string() ?: ""
            onError("${provider.displayName} API Error (${response.code}): $errBody")
            return
        }

        val source = response.body?.byteStream() ?: run {
            onError("Empty response stream from ${provider.displayName}")
            return
        }

        val reader = BufferedReader(InputStreamReader(source))
        var line: String?
        while (reader.readLine().also { line = it } != null) {
            val l = line?.trim() ?: continue
            if (l.startsWith("data:")) {
                val dataContent = l.removePrefix("data:").trim()
                if (dataContent == "[DONE]") {
                    break
                }
                if (dataContent.isNotEmpty()) {
                    try {
                        val parsed = JsonParser.parseString(dataContent).asJsonObject
                        val choices = parsed.getAsJsonArray("choices")
                        if (choices != null && choices.size() > 0) {
                            val delta = choices.get(0).asJsonObject.getAsJsonObject("delta")
                            if (delta != null && delta.has("content")) {
                                val text = delta.get("content").asString
                                if (!text.isNullOrEmpty()) {
                                    onChunk(text)
                                }
                            }
                        }
                    } catch (e: Exception) {
                        // ignore chunk json parsing glitches
                    }
                }
            }
        }
        onDone()
    }

    private fun buildSystemPrompt(chart: ChartResponse, language: String): String {
        return buildString {
            appendLine("You are Rishi, a venerated and compassionate master of classical Vedic Astrology (Jyotish Shastra).")
            appendLine("You ground your interpretations in Parashara, Jaimini, and classical shastras while delivering uplifting, practical, and empathetic counsel.")
            appendLine("Always respond directly in $language.")
            appendLine()
            appendLine("=== SEEKER'S VEDIC BIRTH CHART CONTEXT ===")
            appendLine("Lagna (Ascendant): ${chart.ascendant.sign} at ${String.format("%.2f", chart.ascendant.degree)}°")
            appendLine("Moon Intelligence: Nakshatra ${chart.moonIntelligence.nakshatra} Pada ${chart.moonIntelligence.pada} in ${chart.moonIntelligence.sign} (${chart.moonIntelligence.strength})")
            appendLine()
            appendLine("Planetary Placements & Dignities:")
            for (p in chart.planetaryTable) {
                val flags = mutableListOf<String>()
                if (p.retrograde) flags.add("Retrograde")
                if (p.combust) flags.add("Combust")
                val flagStr = if (flags.isNotEmpty()) " [${flags.joinToString()}]" else ""
                val karakaStr = if (p.charaKaraka != null) " - ${p.charaKaraka}" else ""
                appendLine(" - ${p.name}: ${p.sign} in House ${p.house} (${p.dignity}, Nakshatra: ${p.nakshatra} Pada ${p.pada}, Navamsa: ${p.navamsaSign}$flagStr$karakaStr)")
            }
            appendLine()
            if (chart.yogas.isNotEmpty()) {
                appendLine("Key Yogas Detected:")
                for (y in chart.yogas.take(8)) {
                    appendLine(" * ${y.name}: ${y.description}")
                }
                appendLine()
            }
            if (chart.doshas != null) {
                appendLine("Dosha Profile:")
                if (chart.doshas.kalaSarpa.hasDosha) appendLine(" * Kala Sarpa Dosha present (Type ${chart.doshas.kalaSarpa.typeIndex})")
                if (chart.doshas.manglikLagna.hasDosha) {
                    val ex = if (chart.doshas.manglikLagna.hasExceptions) " (Mitigated by classical cancellation)" else ""
                    appendLine(" * Manglik Dosha from Lagna$ex")
                }
                if (chart.doshas.pitru.hasDosha) appendLine(" * Pitru Dosha indicated")
                if (chart.doshas.guruChandala.hasDosha) appendLine(" * Guru Chandala Yoga active")
                if (chart.doshas.gandaMoola.hasDosha) appendLine(" * Ganda Moola birth in ${chart.doshas.gandaMoola.nakshatraName}")
                appendLine()
            }
            if (chart.vimshottariTimeline.isNotEmpty()) {
                appendLine("Vimshottari Dasha Timeline:")
                for (d in chart.vimshottariTimeline.take(4)) {
                    appendLine(" - ${d.lord} Mahadasha: ${d.start} to ${d.end}")
                }
                appendLine()
            }
            appendLine("Guidelines:")
            appendLine("1. Speak in a warm, wise, respectful, and comforting voice.")
            appendLine("2. Analyze questions through the relevant bhavas (houses), planetary lords, and current dashas.")
            appendLine("3. Provide sattvic, empowering guidance and constructive spiritual remedies (mantras, gemstones, charity, lifestyle alignments).")
        }
    }

    private fun buildReportPrompt(chart: ChartResponse, language: String): String {
        return buildString {
            appendLine("Generate an exhaustive, deeply insightful, and beautifully formatted Master Vedic Horoscope Reading.")
            appendLine("Language: $language")
            appendLine("Use markdown with clear headings, bullet points, and elegant tone.")
            appendLine()
            appendLine("Structure your comprehensive reading into these chapters:")
            appendLine("1. **Prashasti & Cosmic Blueprint**: Core soul mission (Atmakaraka), Lagna aura, and Moon Nakshatra psyche.")
            appendLine("2. **Bhava Phala (Life Spheres Analysis)**:")
            appendLine("   - Dharma & Character (Houses 1, 5, 9)")
            appendLine("   - Artha & Career Wealth (Houses 2, 6, 10, 11)")
            appendLine("   - Kama & Relationships (Houses 3, 7)")
            appendLine("   - Moksha & Inner Evolution (Houses 4, 8, 12)")
            appendLine("3. **Yogas & Special Astrological Formations**: Deep dive into the boons and karmic tasks.")
            appendLine("4. **Vimshottari Timeline & Destiny Flow**: Past, present, and upcoming Mahadasha / Antardasha periods.")
            appendLine("5. **Vedic Remedies & Sattvic Alignments**: Tailored gemstone guidelines, mantra sadhanas, and charitable actions.")
        }
    }
}
