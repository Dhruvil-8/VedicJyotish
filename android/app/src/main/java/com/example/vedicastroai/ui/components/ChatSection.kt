package com.example.vedicastroai.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.text.style.TextAlign
import com.example.vedicastroai.data.models.ChatMessage
import com.example.vedicastroai.theme.VedicCharcoal
import com.example.vedicastroai.theme.VedicGold
import com.example.vedicastroai.theme.VedicTerracotta
import kotlinx.coroutines.launch

@Composable
fun ChatSection(
    messages: List<ChatMessage>,
    inputValue: String,
    onInputChange: (String) -> Unit,
    onSendClick: () -> Unit,
    isStreaming: Boolean,
    questionCount: Int,
    errorMessage: String?,
    modifier: Modifier = Modifier
) {
    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()

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
            .background(Color(0xFFF4F3EF), RoundedCornerShape(12.dp))
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
            Column {
                Text(
                    text = "CHAT WITH RISHI AI",
                    color = VedicTerracotta,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.5.sp
                )
                Text(
                    text = "Personalized Astrological Counsel",
                    color = VedicGold,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Medium
                )
            }

            // Question limit indicator
            Box(
                modifier = Modifier
                    .background(VedicTerracotta.copy(alpha = 0.1f), RoundedCornerShape(16.dp))
                    .padding(horizontal = 10.dp, vertical = 4.dp)
            ) {
                Text(
                    text = "$questionCount / 3 Questions",
                    color = VedicTerracotta,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        Divider(color = VedicGold.copy(alpha = 0.3f), thickness = 1.dp)

        // --- MESSAGES LIST ---
        LazyColumn(
            state = listState,
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            itemsIndexed(messages) { index, msg ->
                val isUser = msg.role == "user"
                val alignment = if (isUser) Alignment.End else Alignment.Start
                val bubbleBg = if (isUser) VedicTerracotta else Color(0xFFFAF9F6)
                val textColor = if (isUser) Color.White else VedicCharcoal

                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = alignment
                ) {
                    // Chat Bubble Label (User or Rishi)
                    Text(
                        text = if (isUser) "You" else "Rishi AI",
                        color = Color.Gray,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )

                    // Chat Bubble
                    Box(
                        modifier = Modifier
                            .background(
                                color = bubbleBg,
                                shape = RoundedCornerShape(
                                    topStart = 16.dp,
                                    topEnd = 16.dp,
                                    bottomStart = if (isUser) 16.dp else 4.dp,
                                    bottomEnd = if (isUser) 4.dp else 16.dp
                                )
                            )
                            .padding(12.dp)
                            .widthIn(max = 280.dp)
                    ) {
                        Text(
                            text = msg.text,
                            color = textColor,
                            fontSize = 13.sp,
                            lineHeight = 18.sp
                        )
                    }
                }
            }

            // Typing/streaming loading indicator
            if (isStreaming && messages.isNotEmpty() && messages.last().text.isEmpty()) {
                item {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalAlignment = Alignment.Start
                    ) {
                        Text(
                            text = "Rishi AI",
                            color = Color.Gray,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                        Box(
                            modifier = Modifier
                                .background(Color(0xFFFAF9F6), RoundedCornerShape(16.dp))
                                .padding(12.dp)
                        ) {
                            Text(
                                text = "Whispering with the stars...",
                                color = Color.Gray,
                                fontSize = 13.sp,
                                fontStyle = FontStyle.Italic
                            )
                        }
                    }
                }
            }
        }

        // --- ERROR DISPLAY ---
        if (errorMessage != null) {
            Text(
                text = errorMessage,
                color = MaterialTheme.colorScheme.error,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(vertical = 4.dp, horizontal = 4.dp)
            )
        }

        // --- INPUT BAR OR LIMIT NOTIFICATION ---
        if (questionCount >= 3) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 12.dp, horizontal = 4.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "You've reached the 3-question limit for this session. Generate the full report for deeper analysis.",
                    color = Color.Gray,
                    fontSize = 12.sp,
                    fontStyle = FontStyle.Italic,
                    textAlign = TextAlign.Center,
                    lineHeight = 18.sp
                )
            }
        } else {
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
                            text = "Ask Rishi a question...",
                            fontSize = 13.sp
                        )
                    },
                    singleLine = true,
                    enabled = !isStreaming,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = Color.White,
                        unfocusedContainerColor = Color.White,
                        disabledContainerColor = Color(0xFFE5E5E5),
                        focusedBorderColor = VedicTerracotta,
                        unfocusedBorderColor = VedicGold,
                        cursorColor = VedicTerracotta
                    ),
                    shape = RoundedCornerShape(24.dp)
                )

                Spacer(modifier = Modifier.width(8.dp))

                FloatingActionButton(
                    onClick = onSendClick,
                    containerColor = if (isStreaming) Color.Gray else VedicTerracotta,
                    contentColor = Color.White,
                    shape = CircleShape,
                    modifier = Modifier.size(48.dp),
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
}
