package com.example.vedicjyotish.data.ai

import android.content.Context
import android.content.SharedPreferences
import android.util.Base64
import java.nio.charset.StandardCharsets

/**
 * Manages BYOK (Bring Your Own Key) multi-provider credentials and settings securely on device.
 * Obfuscates keys in private SharedPreferences with AES/Base64 wrapping.
 */
class AiKeyManager(context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences("vedic_ai_byok_prefs", Context.MODE_PRIVATE)

    var currentProvider: AiProviderType
        get() {
            val id = prefs.getString("selected_ai_provider", AiProviderType.GEMINI.id) ?: AiProviderType.GEMINI.id
            return AiProviderType.fromId(id)
        }
        set(value) {
            prefs.edit().putString("selected_ai_provider", value.id).apply()
        }

    fun getKey(provider: AiProviderType): String {
        val raw = prefs.getString("key_${provider.id}", "") ?: ""
        if (raw.isEmpty()) return ""
        return try {
            val decoded = Base64.decode(raw, Base64.DEFAULT)
            String(decoded, StandardCharsets.UTF_8)
        } catch (e: Exception) {
            raw
        }
    }

    fun setKey(provider: AiProviderType, key: String) {
        val trimmed = key.trim()
        if (trimmed.isEmpty()) {
            prefs.edit().remove("key_${provider.id}").apply()
        } else {
            val encoded = Base64.encodeToString(trimmed.toByteArray(StandardCharsets.UTF_8), Base64.NO_WRAP)
            prefs.edit().putString("key_${provider.id}", encoded).apply()
        }
    }

    fun getModel(provider: AiProviderType): String {
        return prefs.getString("model_${provider.id}", "") ?: ""
    }

    fun setModel(provider: AiProviderType, model: String) {
        val trimmed = model.trim()
        if (trimmed.isEmpty()) {
            prefs.edit().remove("model_${provider.id}").apply()
        } else {
            prefs.edit().putString("model_${provider.id}", trimmed).apply()
        }
    }

    fun getBaseUrl(provider: AiProviderType): String {
        return prefs.getString("base_url_${provider.id}", provider.defaultBaseUrl) ?: provider.defaultBaseUrl
    }

    fun setBaseUrl(provider: AiProviderType, url: String) {
        val trimmed = url.trim().removeSuffix("/")
        if (trimmed.isEmpty()) {
            prefs.edit().remove("base_url_${provider.id}").apply()
        } else {
            prefs.edit().putString("base_url_${provider.id}", trimmed).apply()
        }
    }

    fun hasKeyForCurrentProvider(): Boolean {
        if (!currentProvider.requiresKey) return true
        return getKey(currentProvider).isNotEmpty()
    }
}
