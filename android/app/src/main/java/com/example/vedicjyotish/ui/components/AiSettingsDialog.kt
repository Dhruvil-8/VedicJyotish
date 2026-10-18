package com.example.vedicjyotish.ui.components

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.vedicjyotish.data.ai.AiKeyManager
import com.example.vedicjyotish.data.ai.AiProviderType
import com.example.vedicjyotish.data.ai.VedicAiClient
import com.example.vedicjyotish.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AiSettingsDialog(
    keyManager: AiKeyManager,
    onDismiss: () -> Unit,
    onSaved: () -> Unit
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val aiClient = remember { VedicAiClient(keyManager) }

    var selectedProvider by remember { mutableStateOf(keyManager.currentProvider) }
    var apiKey by remember { mutableStateOf(keyManager.getKey(selectedProvider)) }
    var model by remember { mutableStateOf(keyManager.getModel(selectedProvider)) }
    var baseUrl by remember { mutableStateOf(keyManager.getBaseUrl(selectedProvider)) }
    var showPassword by remember { mutableStateOf(false) }

    var fetchedModels by remember { mutableStateOf<List<String>>(emptyList()) }
    var isFetchingModels by remember { mutableStateOf(false) }
    var fetchModelsMessage by remember { mutableStateOf<String?>(null) }

    var testStatus by remember { mutableStateOf<String?>(null) }
    var isTesting by remember { mutableStateOf(false) }
    var testSuccess by remember { mutableStateOf<Boolean?>(null) }

    // Update fields when provider switches
    fun switchProvider(newP: AiProviderType) {
        selectedProvider = newP
        apiKey = keyManager.getKey(newP)
        model = keyManager.getModel(newP)
        baseUrl = keyManager.getBaseUrl(newP)
        fetchedModels = emptyList()
        fetchModelsMessage = null
        testStatus = null
        testSuccess = null
    }

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = ParchmentCardBg,
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp)
                .border(1.dp, VedicBorder, RoundedCornerShape(16.dp))
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                // Header
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Default.SettingsSuggest,
                            contentDescription = null,
                            tint = VedicGold,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "AI Astrologer Setup (BYOK)",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = VedicCharcoal
                        )
                    }
                    IconButton(onClick = onDismiss, modifier = Modifier.size(24.dp)) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = VedicMutedCharcoal)
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = "Bring your own API key to enjoy unlimited consultations and private horoscope readings directly from your device.",
                    fontSize = 13.sp,
                    color = VedicMutedCharcoal,
                    lineHeight = 18.sp
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Provider Selector Chips
                Text(
                    text = "SELECT AI PROVIDER",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = VedicTerracotta,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(8.dp))

                AiProviderType.entries.forEach { provider ->
                    val isSelected = provider == selectedProvider
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = if (isSelected) VedicTerracotta.copy(alpha = 0.12f) else ParchmentBg,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp)
                            .border(
                                width = if (isSelected) 1.5.dp else 0.5.dp,
                                color = if (isSelected) VedicTerracotta else VedicBorder,
                                shape = RoundedCornerShape(10.dp)
                            )
                            .clickable { switchProvider(provider) }
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(12.dp)
                        ) {
                            RadioButton(
                                selected = isSelected,
                                onClick = { switchProvider(provider) },
                                colors = RadioButtonDefaults.colors(selectedColor = VedicTerracotta)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Column {
                                Text(
                                    text = provider.displayName,
                                    fontSize = 14.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                    color = VedicCharcoal
                                )
                                if (provider.isFreeAvailable) {
                                    Text(
                                        text = "Free API key available",
                                        fontSize = 11.sp,
                                        color = VedicGold
                                    )
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // API Key Field
                Text(
                    text = "API KEY",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = VedicTerracotta,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(6.dp))

                OutlinedTextField(
                    value = apiKey,
                    onValueChange = { apiKey = it },
                    placeholder = { Text("Paste ${selectedProvider.displayName} API Key", color = VedicMutedCharcoal.copy(alpha = 0.6f), fontSize = 13.sp) },
                    visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    trailingIcon = {
                        IconButton(onClick = { showPassword = !showPassword }) {
                            Icon(
                                if (showPassword) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                                contentDescription = "Toggle key visibility",
                                tint = VedicMutedCharcoal
                            )
                        }
                    },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = VedicTerracotta,
                        unfocusedBorderColor = VedicBorder,
                        focusedTextColor = VedicCharcoal,
                        unfocusedTextColor = VedicCharcoal
                    ),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                )

                // "Get Key" Helper Link
                if (selectedProvider.keyPortalUrl.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Get a free key at: ${selectedProvider.keyPortalUrl}",
                        fontSize = 11.sp,
                        color = VedicTerracotta,
                        modifier = Modifier
                            .clickable {
                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(selectedProvider.keyPortalUrl))
                                context.startActivity(intent)
                            }
                            .padding(vertical = 4.dp)
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Model Selector / Input
                Text(
                    text = "MODEL NAME",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = VedicTerracotta,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(6.dp))

                OutlinedTextField(
                    value = model,
                    onValueChange = { model = it },
                    placeholder = { Text("e.g. gemini-2.5-flash, claude-3-5-sonnet, deepseek-chat", color = VedicMutedCharcoal.copy(alpha = 0.5f), fontSize = 12.sp) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = VedicTerracotta,
                        unfocusedBorderColor = VedicBorder,
                        focusedTextColor = VedicCharcoal,
                        unfocusedTextColor = VedicCharcoal
                    ),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                )

                // Dynamic Live Model Fetching
                Spacer(modifier = Modifier.height(4.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(
                        onClick = {
                            coroutineScope.launch {
                                isFetchingModels = true
                                fetchModelsMessage = null
                                val res = aiClient.fetchAvailableModels(selectedProvider, apiKey, baseUrl)
                                isFetchingModels = false
                                if (res.isSuccess) {
                                    val list = res.getOrNull() ?: emptyList()
                                    fetchedModels = list
                                    if (list.isEmpty()) {
                                        fetchModelsMessage = "No active models returned by provider."
                                    }
                                } else {
                                    fetchModelsMessage = res.exceptionOrNull()?.message ?: "Failed to fetch models"
                                }
                            }
                        },
                        enabled = !isFetchingModels
                    ) {
                        if (isFetchingModels) {
                            CircularProgressIndicator(modifier = Modifier.size(13.dp), strokeWidth = 1.5.dp, color = VedicTerracotta)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Fetching live models...", fontSize = 11.sp, color = VedicTerracotta)
                        } else {
                            Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(13.dp), tint = VedicTerracotta)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Fetch Models from ${selectedProvider.displayName}", fontSize = 11.sp, color = VedicTerracotta, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }

                if (fetchModelsMessage != null) {
                    Text(
                        text = fetchModelsMessage ?: "",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier.padding(start = 4.dp, bottom = 4.dp)
                    )
                }

                if (fetchedModels.isNotEmpty()) {
                    Text(
                        text = "Available Models (${fetchedModels.size}) - Tap to select:",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = VedicMutedCharcoal,
                        modifier = Modifier.padding(start = 4.dp, bottom = 4.dp)
                    )
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        fetchedModels.forEach { m ->
                            SuggestionChip(
                                onClick = { model = m },
                                label = { Text(m, fontSize = 10.sp) },
                                colors = SuggestionChipDefaults.suggestionChipColors(
                                    containerColor = if (model == m) VedicTerracotta.copy(alpha = 0.15f) else Color.White,
                                    labelColor = if (model == m) VedicTerracotta else VedicCharcoal
                                ),
                                border = SuggestionChipDefaults.suggestionChipBorder(
                                    borderColor = if (model == m) VedicTerracotta else VedicBorder,
                                    borderWidth = if (model == m) 1.5.dp else 0.5.dp,
                                    enabled = true
                                )
                            )
                        }
                    }
                }

                // Custom Base URL input if Custom or Ollama
                if (selectedProvider == AiProviderType.CUSTOM || selectedProvider == AiProviderType.OLLAMA) {
                    Spacer(modifier = Modifier.height(14.dp))
                    Text(
                        text = "BASE URL",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = VedicTerracotta,
                        letterSpacing = 1.sp
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedTextField(
                        value = baseUrl,
                        onValueChange = { baseUrl = it },
                        placeholder = { Text(if (selectedProvider == AiProviderType.OLLAMA) "http://10.0.2.2:11434/v1" else "http://localhost:8000/v1") },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = VedicTerracotta,
                            unfocusedBorderColor = VedicBorder,
                            focusedTextColor = VedicCharcoal,
                            unfocusedTextColor = VedicCharcoal
                        ),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                // Test Status Display
                if (testStatus != null) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = if (testSuccess == true) VedicGold.copy(alpha = 0.15f) else MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.3f),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = testStatus ?: "",
                            fontSize = 12.sp,
                            color = if (testSuccess == true) VedicCharcoal else MaterialTheme.colorScheme.error,
                            modifier = Modifier.padding(10.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Privacy Notice Footer
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = Color(0x0CFFFFFF),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x15FFFFFF)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Default.Lock,
                            contentDescription = null,
                            tint = LiquidGold,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Privacy: Your API key is encrypted and stored locally. Calls to ${selectedProvider.displayName} are made directly from your phone. Only anonymized planetary placements are sent—never names, birthdates, or GPS coordinates.",
                            fontSize = 11.sp,
                            color = TextSecondary,
                            lineHeight = 15.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Actions (Test & Save)
                Row(

                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = {
                            isTesting = true
                            testStatus = "Testing connection to ${selectedProvider.displayName}..."
                            testSuccess = null
                            coroutineScope.launch {
                                val (ok, msg) = aiClient.testConnection(selectedProvider, apiKey, model, baseUrl)
                                isTesting = false
                                testSuccess = ok
                                testStatus = msg
                            }
                        },
                        enabled = !isTesting && (apiKey.isNotEmpty() || selectedProvider == AiProviderType.CUSTOM),
                        shape = RoundedCornerShape(8.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, VedicBorder),
                        modifier = Modifier.weight(1f)
                    ) {
                        if (isTesting) {
                            CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp, color = VedicTerracotta)
                        } else {
                            Text("Test", color = VedicTerracotta, fontSize = 13.sp)
                        }
                    }

                    Button(
                        onClick = {
                            keyManager.currentProvider = selectedProvider
                            keyManager.setKey(selectedProvider, apiKey)
                            keyManager.setModel(selectedProvider, model)
                            keyManager.setBaseUrl(selectedProvider, baseUrl)
                            onSaved()
                            onDismiss()
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = VedicTerracotta),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Save & Close", color = androidx.compose.ui.graphics.Color.White, fontSize = 13.sp)
                    }
                }
            }
        }
    }
}
