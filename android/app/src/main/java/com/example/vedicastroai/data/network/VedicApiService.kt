package com.example.vedicastroai.data.network

import com.example.vedicastroai.data.models.*
import com.google.gson.Gson
import com.google.gson.JsonArray
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.BufferedReader
import java.io.IOException
import java.io.InputStreamReader
import java.util.concurrent.TimeUnit
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class VedicApiService(baseUrl: String) {

    var baseUrl: String = baseUrl.trimEnd('/')
        set(value) { field = value.trimEnd('/') }

    private val gson = Gson()
    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()
    private val sensitiveChartKeys = setOf(
        "date",
        "time",
        "birth_date",
        "birth_time",
        "date_of_birth",
        "time_of_birth",
        "dob",
        "location",
        "city",
        "lat",
        "lon",
        "latitude",
        "longitude",
        "timezone",
        "tz"
    )

    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(120, TimeUnit.SECONDS)   // SSE streams can be long
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    // ──────────────────────────────────────────────────────
    //  GET /search_city?query=...
    // ──────────────────────────────────────────────────────
    suspend fun searchCity(query: String): List<CityResult> = withContext(Dispatchers.IO) {
        val request = Request.Builder()
            .url("$baseUrl/search_city?query=$query")
            .get()
            .build()
        val response = client.newCall(request).await()
        val body = response.body?.string() ?: "[]"
        val type = object : TypeToken<List<CityResult>>() {}.type
        gson.fromJson(body, type)
    }

    // ──────────────────────────────────────────────────────
    //  POST /calculate_chart
    // ──────────────────────────────────────────────────────
    suspend fun calculateChart(birthData: BirthDataRequest): ChartResponse = withContext(Dispatchers.IO) {
        val json = gson.toJson(birthData)
        val request = Request.Builder()
            .url("$baseUrl/calculate_chart")
            .post(json.toRequestBody(jsonMediaType))
            .build()
        val response = client.newCall(request).await()
        if (!response.isSuccessful) {
            val errorBody = response.body?.string() ?: ""
            throw ApiException(response.code, parseErrorDetail(errorBody))
        }
        val body = response.body?.string() ?: throw ApiException(500, "Empty response")
        gson.fromJson(body, ChartResponse::class.java)
    }

    // ──────────────────────────────────────────────────────
    //  POST /generate_report  (SSE stream)
    // ──────────────────────────────────────────────────────
    suspend fun generateReportStream(
        chartData: ChartResponse,
        onChunk: (String) -> Unit,
        onDone: () -> Unit,
        onError: (String) -> Unit
    ) = withContext(Dispatchers.IO) {
        val json = gson.toJson(sanitizeChartForAi(gson.toJsonTree(chartData)))
        val request = Request.Builder()
            .url("$baseUrl/generate_report")
            .post(json.toRequestBody(jsonMediaType))
            .build()
        val response = client.newCall(request).await()
        if (!response.isSuccessful) {
            onError("Report generation failed (${response.code})")
            return@withContext
        }
        readSseStream(response, onChunk, onDone, onError)
    }

    // ──────────────────────────────────────────────────────
    //  POST /chat_with_astrologer  (SSE stream)
    // ──────────────────────────────────────────────────────
    suspend fun chatStream(
        chartData: ChartResponse,
        question: String,
        history: List<ChatMessage>,
        onChunk: (String) -> Unit,
        onDone: () -> Unit,
        onError: (String) -> Unit
    ) = withContext(Dispatchers.IO) {
        // Build the raw JSON map matching the backend's ChatRequest schema
        val rawChartJson = sanitizeChartForAi(gson.toJsonTree(chartData))
        val payload = mapOf(
            "chart_data" to rawChartJson,
            "question" to question,
            "history" to history
        )
        val json = gson.toJson(payload)
        val request = Request.Builder()
            .url("$baseUrl/chat_with_astrologer")
            .post(json.toRequestBody(jsonMediaType))
            .build()
        val response = client.newCall(request).await()
        if (!response.isSuccessful) {
            onError("Chat failed (${response.code})")
            return@withContext
        }
        readSseStream(response, onChunk, onDone, onError)
    }

    // ──────────────────────────────────────────────────────
    //  SSE Stream Reader
    //  Protocol: lines starting with "data: " containing JSON
    //    {"text": "..."} | {"done": true} | {"error": "..."}
    // ──────────────────────────────────────────────────────
    private fun readSseStream(
        response: Response,
        onChunk: (String) -> Unit,
        onDone: () -> Unit,
        onError: (String) -> Unit
    ) {
        val body = response.body ?: run {
            onError("Empty response body")
            return
        }
        val reader = BufferedReader(InputStreamReader(body.byteStream()))
        try {
            var line: String?
            while (reader.readLine().also { line = it } != null) {
                val l = line ?: continue
                if (!l.startsWith("data: ")) continue
                try {
                    val event = gson.fromJson(l.substring(6), SseEvent::class.java)
                    when {
                        event.text != null -> onChunk(event.text)
                        event.done == true -> { onDone(); return }
                        event.error != null -> { onError(event.error); return }
                    }
                } catch (_: Exception) {
                    // skip malformed SSE lines
                }
            }
            onDone()
        } catch (e: Exception) {
            onError(e.message ?: "Stream read error")
        } finally {
            reader.close()
            body.close()
        }
    }

    // ──────────────────────────────────────────────────────
    //  Helpers
    // ──────────────────────────────────────────────────────
    private fun parseErrorDetail(body: String): String {
        return try {
            val map = gson.fromJson(body, Map::class.java)
            val detail = map["detail"]
            when (detail) {
                is String -> detail
                is List<*> -> {
                    val first = detail.firstOrNull()
                    if (first is Map<*, *>) {
                        (first["msg"] as? String)?.removePrefix("Value error, ") ?: "Request failed"
                    } else "Request failed"
                }
                else -> "Request failed"
            }
        } catch (_: Exception) { "Request failed" }
    }

    private suspend fun Call.await(): Response = suspendCancellableCoroutine { cont ->
        cont.invokeOnCancellation { cancel() }
        enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                if (!cont.isCancelled) cont.resumeWithException(e)
            }
            override fun onResponse(call: Call, response: Response) {
                cont.resume(response)
            }
        })
    }
}

class ApiException(val code: Int, message: String) : Exception(message)
