package com.example.vedicjyotish
import android.content.Context
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.Crossfade
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.vedicjyotish.data.models.ChartResponse
import com.example.vedicjyotish.data.network.ApiClient
import com.example.vedicjyotish.theme.ParchmentBg
import com.example.vedicjyotish.theme.VedicJyotishTheme
import com.example.vedicjyotish.theme.VedicCharcoal
import com.example.vedicjyotish.theme.VedicGold
import com.example.vedicjyotish.theme.VedicTerracotta
import com.example.vedicjyotish.ui.screens.BirthDetailsScreen
import com.example.vedicjyotish.ui.screens.DashboardScreen
import com.example.vedicjyotish.ui.screens.DisclaimerScreen

sealed class AppScreen {
    object Disclaimer : AppScreen()
    object BirthDetails : AppScreen()
    data class Dashboard(val chart: ChartResponse) : AppScreen()
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            VedicJyotishTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = ParchmentBg
                ) {
                    VedicJyotishApp()
                }
            }
        }
    }
}

@Composable
fun VedicJyotishApp() {
    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences("vedic_prefs", Context.MODE_PRIVATE) }

    // Hugging Face production backend hardcoded directly
    val backendUrl = "https://dhruvil8-vedicjyotish.hf.space"

    // Initialize the API client singleton
    LaunchedEffect(Unit) {
        ApiClient.init(backendUrl)
    }

    // YXV0aG9yIC0gRGhydXZpbCBQYXRlbA==
    // Disclaimer acceptance persistence
    var isDisclaimerAccepted by remember {
        mutableStateOf(prefs.getBoolean("disclaimer_accepted", false))
    }

    // State routing
    var currentScreen by remember {
        val startingScreen = if (isDisclaimerAccepted) AppScreen.BirthDetails else AppScreen.Disclaimer
        mutableStateOf<AppScreen>(startingScreen)
    }

    // Handle android hardware back button press in a natural way
    BackHandler(enabled = currentScreen !is AppScreen.Disclaimer) {
        when (val screen = currentScreen) {
            is AppScreen.Dashboard -> {
                currentScreen = AppScreen.BirthDetails
            }
            AppScreen.BirthDetails -> {
                // Return to disclaimer
                currentScreen = AppScreen.Disclaimer
            }
            else -> {}
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        Crossfade(targetState = currentScreen, modifier = Modifier.fillMaxSize()) { screen ->
            when (screen) {
                AppScreen.Disclaimer -> {
                    DisclaimerScreen(
                        onAccept = {
                            prefs.edit().putBoolean("disclaimer_accepted", true).apply()
                            isDisclaimerAccepted = true
                            currentScreen = AppScreen.BirthDetails
                        }
                    )
                }
                AppScreen.BirthDetails -> {
                    BirthDetailsScreen(
                        onChartCalculated = { chart ->
                            currentScreen = AppScreen.Dashboard(chart)
                        }
                    )
                }
                is AppScreen.Dashboard -> {
                    DashboardScreen(
                        chart = screen.chart,
                        onBackClick = {
                            currentScreen = AppScreen.BirthDetails
                        }
                    )
                }
            }
        }
    }
}
