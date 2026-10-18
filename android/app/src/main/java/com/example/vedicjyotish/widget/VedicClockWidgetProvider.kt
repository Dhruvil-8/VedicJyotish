package com.example.vedicjyotish.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.util.Log
import android.widget.RemoteViews
import com.example.vedicjyotish.MainActivity
import com.example.vedicjyotish.R
import com.example.vedicjyotish.data.astrology.PanchangaEngine
import java.util.Calendar

class VedicClockWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_REFRESH) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val thisWidget = ComponentName(context, VedicClockWidgetProvider::class.java)
            val allWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget)
            for (id in allWidgetIds) {
                updateAppWidget(context, appWidgetManager, id)
            }
        }
    }

    companion object {
        const val ACTION_REFRESH = "com.example.vedicjyotish.widget.ACTION_REFRESH"
        private const val TAG = "VedicClockWidget"

        fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            try {
                val prefs = context.getSharedPreferences("vedic_prefs", Context.MODE_PRIVATE)
                var lat = prefs.getFloat("birth_lat", 0.0f).toDouble()
                if (lat == 0.0) lat = prefs.getFloat("birth_latitude", 28.6139f).toDouble()
                var lon = prefs.getFloat("birth_lon", 0.0f).toDouble()
                if (lon == 0.0) lon = prefs.getFloat("birth_longitude", 77.2090f).toDouble()
                val city = prefs.getString("birth_city", "New Delhi").let { if (it.isNullOrBlank()) "New Delhi" else it }
                var tz = prefs.getFloat("birth_tz", 0.0f).toDouble()
                if (tz == 0.0) tz = prefs.getFloat("birth_timezone", 5.5f).toDouble()

                if (lat == 0.0 && lon == 0.0) {
                    lat = 28.6139
                    lon = 77.2090
                    tz = 5.5
                }

                val nowCal = Calendar.getInstance()
                val panchangData = PanchangaEngine.calculateDailyPanchanga(nowCal, lat, lon, city, tz)

                // Calculate Vedic Time
                val curMins = nowCal.get(Calendar.HOUR_OF_DAY) * 60.0 + nowCal.get(Calendar.MINUTE)
                val sRiseParts = panchangData.sunrise.split(":", " ")
                val sSetParts = panchangData.sunset.split(":", " ")

                val riseH = sRiseParts.getOrNull(0)?.toIntOrNull() ?: 6
                val riseM = sRiseParts.getOrNull(1)?.toIntOrNull() ?: 0
                val riseAmPm = sRiseParts.getOrNull(2) ?: "AM"
                val rise24 = if (riseAmPm.equals("PM", ignoreCase = true) && riseH < 12) riseH + 12 else riseH
                val riseMins = rise24 * 60.0 + riseM

                val setH = sSetParts.getOrNull(0)?.toIntOrNull() ?: 6
                val setM = sSetParts.getOrNull(1)?.toIntOrNull() ?: 0
                val setAmPm = sSetParts.getOrNull(2) ?: "PM"
                val set24 = if (setAmPm.equals("PM", ignoreCase = true) && setH < 12) setH + 12 else setH
                val setMins = set24 * 60.0 + setM

                val vedicTime = PanchangaEngine.calculateVedicTime(curMins, riseMins, setMins)

                val views = RemoteViews(context.packageName, R.layout.widget_vedic_clock)

                // Header
                views.setTextViewText(R.id.widget_txt_city, city)

                // Ishta Kala
                views.setTextViewText(R.id.widget_txt_ishta_kala, "${vedicTime.ishtaKalaGhati} घटी ${vedicTime.ishtaKalaVighati} वि")
                views.setTextViewText(R.id.widget_txt_day_length, "दिनमान: ${vedicTime.dinamanaHoursMins}")

                // Muhurta - Current
                views.setTextViewText(R.id.widget_txt_muhurta_name, vedicTime.currentMuhurtaName)
                views.setTextViewText(R.id.widget_txt_muhurta_time, "${vedicTime.currentMuhurtaStart} - ${vedicTime.currentMuhurtaEnd}")
                views.setTextViewText(R.id.widget_txt_muhurta_quality, if (vedicTime.isAuspiciousMuhurta) "शुभ मुहूर्त (Auspicious)" else "सामान्य (Neutral)")

                val muhurtaColor = if (vedicTime.isAuspiciousMuhurta) Color.parseColor("#2E7D32") else Color.parseColor("#8B4513")
                views.setTextColor(R.id.widget_txt_muhurta_name, muhurtaColor)
                views.setTextColor(R.id.widget_txt_muhurta_quality, muhurtaColor)

                // Muhurta - Upcoming
                views.setTextViewText(R.id.widget_txt_next_muhurta, "${vedicTime.nextMuhurtaName} (${vedicTime.nextMuhurtaStart} - ${vedicTime.nextMuhurtaEnd})")
                views.setTextViewText(R.id.widget_txt_next_quality, if (vedicTime.isNextAuspicious) "शुभ" else "सामान्य")
                val nextColor = if (vedicTime.isNextAuspicious) Color.parseColor("#2E7D32") else Color.parseColor("#6E6962")
                views.setTextColor(R.id.widget_txt_next_quality, nextColor)

                // Bottom Bar: Tithi & Nakshatra + Rahu Kaal
                views.setTextViewText(R.id.widget_txt_tithi_nakshatra, "${panchangData.tithi.name} • ${panchangData.nakshatra.name}")
                views.setTextViewText(R.id.widget_txt_rahu_kalam, "राहु: ${panchangData.rahuKaal}")

                // Click root -> Open App
                val launchIntent = Intent(context, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                }
                val pendingLaunch = PendingIntent.getActivity(
                    context,
                    0,
                    launchIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.widget_root, pendingLaunch)

                // Click refresh -> Broadcast refresh
                val refreshIntent = Intent(context, VedicClockWidgetProvider::class.java).apply {
                    action = ACTION_REFRESH
                }
                val pendingRefresh = PendingIntent.getBroadcast(
                    context,
                    1,
                    refreshIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.widget_btn_refresh, pendingRefresh)

                appWidgetManager.updateAppWidget(appWidgetId, views)
            } catch (e: Throwable) {
                Log.e(TAG, "Error updating Vedic Clock widget", e)
            }
        }
    }
}
