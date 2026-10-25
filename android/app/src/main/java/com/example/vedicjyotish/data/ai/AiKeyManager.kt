package com.example.vedicjyotish.data.ai

import android.content.Context
import android.content.SharedPreferences
import android.util.Base64
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import java.nio.charset.StandardCharsets

/**
 * Manages BYOK (Bring Your Own Key) multi-provider credentials and settings securely on device.
 * Stores keys encrypted at rest using hardware-backed Android KeyStore (AES-256 GCM via EncryptedSharedPreferences).
 * Seamlessly migrates existing legacy Base64 keys on first launch.
 */
class AiKeyManager(context: Context) {

    private val legacyPrefs: SharedPreferences =
        context.getSharedPreferences("vedic_ai_byok_prefs", Context.MODE_PRIVATE)

    private val securePrefs: SharedPreferences = try {
        val masterKey = MasterKey.Builder(context.applicationContext)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        EncryptedSharedPreferences.create(
            context.applicationContext,
            "vedic_ai_byok_secure_prefs",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    } catch (e: Exception) {
        Log.w("AiKeyManager", "EncryptedSharedPreferences unavailable; using fallback private storage", e)
        context.applicationContext.getSharedPreferences("vedic_ai_byok_secure_prefs_fallback", Context.MODE_PRIVATE)
    }

    init {
        migrateLegacyKeys()
    }

    private fun migrateLegacyKeys() {
        try {
            for (provider in AiProviderType.values()) {
                val legacyRaw = legacyPrefs.getString("key_${provider.id}", null)
                if (!legacyRaw.isNullOrEmpty() && !securePrefs.contains("key_${provider.id}")) {
                    val decoded = try {
                        val bytes = Base64.decode(legacyRaw, Base64.DEFAULT)
                        String(bytes, StandardCharsets.UTF_8)
                    } catch (_: Exception) {
                        legacyRaw
                    }
                    if (decoded.isNotBlank()) {
                        securePrefs.edit().putString("key_${provider.id}", decoded.trim()).apply()
                    }
                    legacyPrefs.edit().remove("key_${provider.id}").apply()
                }
            }
        } catch (e: Exception) {
            Log.w("AiKeyManager", "Legacy key migration encountered an issue", e)
        }
    }

    var currentProvider: AiProviderType
        get() {
            val id = securePrefs.getString("selected_ai_provider", null)
                ?: legacyPrefs.getString("selected_ai_provider", AiProviderType.GEMINI.id)
                ?: AiProviderType.GEMINI.id
            return AiProviderType.fromId(id)
        }
        set(value) {
            securePrefs.edit().putString("selected_ai_provider", value.id).apply()
        }

    fun getKey(provider: AiProviderType): String {
        return securePrefs.getString("key_${provider.id}", "") ?: ""
    }

    fun setKey(provider: AiProviderType, key: String) {
        val trimmed = key.trim()
        if (trimmed.isEmpty()) {
            securePrefs.edit().remove("key_${provider.id}").apply()
        } else {
            securePrefs.edit().putString("key_${provider.id}", trimmed).apply()
        }
        if (legacyPrefs.contains("key_${provider.id}")) {
            legacyPrefs.edit().remove("key_${provider.id}").apply()
        }
    }

    fun getModel(provider: AiProviderType): String {
        return securePrefs.getString("model_${provider.id}", null)
            ?: legacyPrefs.getString("model_${provider.id}", "")
            ?: ""
    }

    fun setModel(provider: AiProviderType, model: String) {
        val trimmed = model.trim()
        if (trimmed.isEmpty()) {
            securePrefs.edit().remove("model_${provider.id}").apply()
        } else {
            securePrefs.edit().putString("model_${provider.id}", trimmed).apply()
        }
    }

    fun getBaseUrl(provider: AiProviderType): String {
        return securePrefs.getString("base_url_${provider.id}", null)
            ?: legacyPrefs.getString("base_url_${provider.id}", provider.defaultBaseUrl)
            ?: provider.defaultBaseUrl
    }

    fun setBaseUrl(provider: AiProviderType, url: String) {
        val trimmed = url.trim().removeSuffix("/")
        if (trimmed.isEmpty()) {
            securePrefs.edit().remove("base_url_${provider.id}").apply()
        } else {
            securePrefs.edit().putString("base_url_${provider.id}", trimmed).apply()
        }
    }

    fun hasKeyForCurrentProvider(): Boolean {
        if (!currentProvider.requiresKey) return true
        return getKey(currentProvider).isNotEmpty()
    }
}
