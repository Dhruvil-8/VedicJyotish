package com.example.vedicjyotish.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.vedicjyotish.data.ai.ChatSession
import com.example.vedicjyotish.data.models.ChatMessage
import com.example.vedicjyotish.theme.*
import kotlinx.coroutines.launch

@Composable
fun ChatSection(
    messages: List<ChatMessage>,
    inputValue: String,
    onInputChange: (String) -> Unit,
    onSendClick: () -> Unit,
    isStreaming: Boolean,
    errorMessage: String?,
    activeSessionTitle: String = "Consultation",
    sessions: List<ChatSession> = emptyList(),
    onNewChatClick: () -> Unit = {},
    onSelectSession: (String) -> Unit = {},
    onOpenAiSettings: () -> Unit = {},
    providerName: String = "AI Astrologer",
    modifier: Modifier = Modifier
) {
    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()
    var showSessionsMenu by remember { mutableStateOf(false) }

    val promptSuggestions = listOf(
        "Career & Wealth Potential",
        "Marriage & Relationship Timing",
        "Current Mahadasha Influence",
        "Sattvic Remedies & Gemstones",
        "Health & Mental Vitality"
    )

    // Auto-scroll to the bottom when messages size or content changes
    LaunchedEffect(messages.size, if (messages.isNotEmpty()) messages.last().text.length else 0) {
        if (messages.isNotEmpty()) {
            coroutineScope.launch {
                listState.animateScrollToItem(messages.size - 1)
            }
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(ParchmentBg, RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        // --- CHAT HEADER ---
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "RISHI ASTROLOGER",
                        color = VedicTerracotta,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = VedicGold.copy(alpha = 0.15f),
                        modifier = Modifier.clickable { onOpenAiSettings() }
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = providerName,
                                color = VedicGold,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Icon(
                                Icons.Default.Settings,
                                contentDescription = "AI Settings",
                                tint = VedicGold,
                                modifier = Modifier.size(12.dp).padding(start = 2.dp)
                            )
                        }
                    }
                }

                // Session selector / title
                Box {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .clickable { showSessionsMenu = true }
                            .padding(top = 2.dp)
                    ) {
                        Text(
                            text = activeSessionTitle,
                            color = VedicMutedCharcoal,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium,
                            maxLines = 1
                        )
                        Icon(
                            Icons.Default.ArrowDropDown,
                            contentDescription = "Switch Session",
                            tint = VedicMutedCharcoal,
                            modifier = Modifier.size(16.dp)
                        )
                    }

                    DropdownMenu(
                        expanded = showSessionsMenu,
                        onDismissRequest = { showSessionsMenu = false }
                    ) {
                        sessions.forEach { s ->
                            DropdownMenuItem(
                                text = {
                                    Text(
                                        text = s.title,
                                        fontSize = 12.sp,
                                        fontWeight = if (s.title == activeSessionTitle) FontWeight.Bold else FontWeight.Normal
                                    )
                                },
                                onClick = {
                                    onSelectSession(s.id)
                                    showSessionsMenu = false
                                }
                            )
                        }
                    }
                }
            }

            // "+ New Chat" Button
            FilledTonalButton(
                onClick = onNewChatClick,
                colors = ButtonDefaults.filledTonalButtonColors(
                    containerColor = VedicTerracotta.copy(alpha = 0.12f),
                    contentColor = VedicTerracotta
                ),
                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.height(32.dp)
            ) {
                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(14.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("New Chat", fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
        }

        Divider(color = VedicBorder, thickness = 0.8.dp)

        // --- MESSAGES LIST ---
        LazyColumn(
            state = listState,
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            itemsIndexed(messages) { _, msg ->
                val isUser = msg.role == "user"
                val alignment = if (isUser) Alignment.End else Alignment.Start
                val bubbleBg = if (isUser) VedicTerracotta else ParchmentCardBg
                val textColor = if (isUser) Color.White else VedicCharcoal

                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = alignment
                ) {
                    Text(
                        text = if (isUser) "You" else "Rishi AI",
                        color = VedicMutedCharcoal.copy(alpha = 0.7f),
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )

                    Surface(
                        shape = RoundedCornerShape(
                            topStart = 14.dp,
                            topEnd = 14.dp,
                            bottomStart = if (isUser) 14.dp else 2.dp,
                            bottomEnd = if (isUser) 2.dp else 14.dp
                        ),
                        color = bubbleBg,
                        border = if (isUser) null else androidx.compose.foundation.BorderStroke(0.5.dp, VedicBorder),
                        modifier = Modifier.widthIn(max = 300.dp)
                    ) {
                        Text(
                            text = msg.text,
                            color = textColor,
                            fontSize = 13.sp,
                            lineHeight = 19.sp,
                            modifier = Modifier.padding(12.dp)
                        )
                    }
                }
            }

            // Typing / streaming loading indicator
            if (isStreaming && (messages.isEmpty() || messages.last().text.isEmpty())) {
                item {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalAlignment = Alignment.Start
                    ) {
                        Text(
                            text = "Rishi AI",
                            color = VedicMutedCharcoal.copy(alpha = 0.7f),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                        Surface(
                            shape = RoundedCornerShape(14.dp),
                            color = ParchmentCardBg,
                            border = androidx.compose.foundation.BorderStroke(0.5.dp, VedicBorder),
                            modifier = Modifier.padding(2.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.padding(10.dp)
                            ) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(14.dp),
                                    strokeWidth = 2.dp,
                                    color = VedicTerracotta
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "Consulting the celestial positions...",
                                    color = VedicMutedCharcoal,
                                    fontSize = 12.sp,
                                    fontStyle = FontStyle.Italic
                                )
                            }
                        }
                    }
                }
            }
        }

        // --- PROMPT SUGGESTION CHIPS ---
        if (messages.size <= 2 && !isStreaming) {
            LazyRow(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                items(promptSuggestions) { prompt ->
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = ParchmentCardBg,
                        border = androidx.compose.foundation.BorderStroke(0.5.dp, VedicBorder),
                        modifier = Modifier.clickable { onInputChange(prompt) }
                    ) {
                        Text(
                            text = prompt,
                            fontSize = 11.sp,
                            color = VedicTerracotta,
                            fontWeight = FontWeight.Medium,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                        )
                    }
                }
            }
        }

        // --- ERROR DISPLAY ---
        if (errorMessage != null) {
            Surface(
                shape = RoundedCornerShape(8.dp),
                color = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.4f),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(8.dp)
                ) {
                    Icon(Icons.Default.ErrorOutline, contentDescription = null, tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = errorMessage,
                        color = MaterialTheme.colorScheme.error,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }

        // --- UNLIMITED INPUT BAR ---
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = inputValue,
                onValueChange = onInputChange,
                modifier = Modifier.weight(1f),
                placeholder = {
                    Text(
                        text = "Ask Rishi any question...",
                        fontSize = 13.sp,
                        color = VedicMutedCharcoal.copy(alpha = 0.6f)
                    )
                },
                singleLine = true,
                enabled = !isStreaming,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = ParchmentCardBg,
                    unfocusedContainerColor = ParchmentCardBg,
                    disabledContainerColor = ParchmentBg,
                    focusedBorderColor = VedicTerracotta,
                    unfocusedBorderColor = VedicBorder,
                    cursorColor = VedicTerracotta,
                    focusedTextColor = VedicCharcoal,
                    unfocusedTextColor = VedicCharcoal
                ),
                shape = RoundedCornerShape(24.dp)
            )

            Spacer(modifier = Modifier.width(8.dp))

            FloatingActionButton(
                onClick = onSendClick,
                containerColor = if (isStreaming) VedicBorder else VedicTerracotta,
                contentColor = Color.White,
                shape = CircleShape,
                modifier = Modifier.size(46.dp),
                elevation = FloatingActionButtonDefaults.elevation(0.dp, 0.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Send,
                    contentDescription = "Send question",
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }
}
