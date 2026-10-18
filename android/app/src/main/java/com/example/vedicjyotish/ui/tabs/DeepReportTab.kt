package com.example.vedicjyotish.ui.tabs

import androidx.compose.runtime.Composable
import com.example.vedicjyotish.ui.components.ReportSection

@Composable
fun DeepReportTab(
    reportText: String,
    isGenerating: Boolean,
    errorMsg: String?,
    onRetryClick: () -> Unit
) {
    ReportSection(
        reportText = reportText,
        isGenerating = isGenerating,
        errorMsg = errorMsg,
        onRetryClick = onRetryClick
    )
}
