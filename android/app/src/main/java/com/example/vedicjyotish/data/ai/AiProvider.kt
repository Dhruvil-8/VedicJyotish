package com.example.vedicjyotish.data.ai

/**
 * Protocol/format for AI model inference.
 * Provides a unified multi-platform abstraction across disparate LLM engines.
 */
enum class ApiProtocol {
    GEMINI_REST,
    ANTHROPIC_MESSAGES,
    OPENAI_COMPATIBLE
}

/**
 * Declarative AI Provider Profile registry.
 * Each profile defines its identity, transport protocol, endpoints, and credentials requirements.
 */
enum class AiProviderType(
    val id: String,
    val displayName: String,
    val protocol: ApiProtocol,
    val defaultBaseUrl: String,
    val keyPortalUrl: String,
    val isFreeAvailable: Boolean,
    val requiresKey: Boolean
) {
    GEMINI(
        id = "gemini",
        displayName = "Google Gemini (Free API)",
        protocol = ApiProtocol.GEMINI_REST,
        defaultBaseUrl = "https://generativelanguage.googleapis.com/v1beta",
        keyPortalUrl = "https://aistudio.google.com/apikey",
        isFreeAvailable = true,
        requiresKey = true
    ),
    GROQ(
        id = "groq",
        displayName = "Groq (Free & Ultra Fast)",
        protocol = ApiProtocol.OPENAI_COMPATIBLE,
        defaultBaseUrl = "https://api.groq.com/openai/v1",
        keyPortalUrl = "https://console.groq.com/keys",
        isFreeAvailable = true,
        requiresKey = true
    ),
    ANTHROPIC(
        id = "anthropic",
        displayName = "Anthropic Claude",
        protocol = ApiProtocol.ANTHROPIC_MESSAGES,
        defaultBaseUrl = "https://api.anthropic.com/v1",
        keyPortalUrl = "https://console.anthropic.com/settings/keys",
        isFreeAvailable = false,
        requiresKey = true
    ),
    DEEPSEEK(
        id = "deepseek",
        displayName = "DeepSeek AI",
        protocol = ApiProtocol.OPENAI_COMPATIBLE,
        defaultBaseUrl = "https://api.deepseek.com/v1",
        keyPortalUrl = "https://platform.deepseek.com/api_keys",
        isFreeAvailable = false,
        requiresKey = true
    ),
    OPENROUTER(
        id = "openrouter",
        displayName = "OpenRouter (Universal)",
        protocol = ApiProtocol.OPENAI_COMPATIBLE,
        defaultBaseUrl = "https://openrouter.ai/api/v1",
        keyPortalUrl = "https://openrouter.ai/keys",
        isFreeAvailable = true,
        requiresKey = true
    ),
    OPENAI(
        id = "openai",
        displayName = "OpenAI",
        protocol = ApiProtocol.OPENAI_COMPATIBLE,
        defaultBaseUrl = "https://api.openai.com/v1",
        keyPortalUrl = "https://platform.openai.com/api-keys",
        isFreeAvailable = false,
        requiresKey = true
    ),
    MISTRAL(
        id = "mistral",
        displayName = "Mistral AI",
        protocol = ApiProtocol.OPENAI_COMPATIBLE,
        defaultBaseUrl = "https://api.mistral.ai/v1",
        keyPortalUrl = "https://console.mistral.ai/api-keys/",
        isFreeAvailable = false,
        requiresKey = true
    ),
    OLLAMA(
        id = "ollama",
        displayName = "Ollama (Local / Offline)",
        protocol = ApiProtocol.OPENAI_COMPATIBLE,
        defaultBaseUrl = "http://10.0.2.2:11434/v1",
        keyPortalUrl = "",
        isFreeAvailable = true,
        requiresKey = false
    ),
    CUSTOM(
        id = "custom",
        displayName = "Custom Endpoint / Proxy",
        protocol = ApiProtocol.OPENAI_COMPATIBLE,
        defaultBaseUrl = "http://localhost:8000/v1",
        keyPortalUrl = "",
        isFreeAvailable = true,
        requiresKey = false
    );

    companion object {
        fun fromId(id: String): AiProviderType {
            return entries.firstOrNull { it.id.equals(id, ignoreCase = true) } ?: GEMINI
        }
    }
}
