package com.example.vedicjyotish.utils

object DateTimeUtils {

    fun normalizeDate(dateStr: String): String {
        val clean = dateStr.trim()
        if (clean.isEmpty()) return ""

        // Replace non-digit characters (like -, ., space, comma) with /
        val normalized = clean.replace(Regex("[^0-9]"), "/")
        
        // If it's a solid 8-digit string like 15081947, insert slashes
        if (normalized.length == 8 && normalized.all { it.isDigit() }) {
            return "${normalized.substring(0, 2)}/${normalized.substring(2, 4)}/${normalized.substring(4)}"
        }

        // Split by slash and pad with leading zeros if necessary
        val parts = normalized.split("/").filter { it.isNotEmpty() }
        if (parts.size == 3) {
            val day = parts[0].padStart(2, '0')
            val month = parts[1].padStart(2, '0')
            val year = parts[2]
            if (year.length == 4 && day.length == 2 && month.length == 2) {
                return "$day/$month/$year"
            }
        }
        return dateStr
    }

    fun normalizeTime(timeStr: String): String {
        val clean = timeStr.trim().lowercase()
        if (clean.isEmpty()) return ""

        val isPm = clean.contains("pm")
        val isAm = clean.contains("am")
        var numbersOnly = clean.replace(Regex("[a-z]"), "").trim()
        
        // Replace separators like dot, semicolon, comma, hyphen, space with colon
        numbersOnly = numbersOnly.replace(Regex("[;.,\\-\\s]"), ":")
        
        // If it's a solid 3 or 4-digit string like 1430 or 230
        if (!numbersOnly.contains(":") && numbersOnly.all { it.isDigit() }) {
            if (numbersOnly.length == 3) {
                numbersOnly = "${numbersOnly.substring(0, 1)}:${numbersOnly.substring(1)}"
            } else if (numbersOnly.length == 4) {
                numbersOnly = "${numbersOnly.substring(0, 2)}:${numbersOnly.substring(2)}"
            }
        }
        
        val parts = numbersOnly.split(":").filter { it.isNotEmpty() }
        if (parts.size < 2) return timeStr
        
        var hours = parts[0].toIntOrNull() ?: return timeStr
        val minutes = parts[1].toIntOrNull() ?: return timeStr
        
        if (isPm && hours < 12) {
            hours += 12
        } else if (isAm && hours == 12) {
            hours = 0
        }
        
        val hStr = hours.toString().padStart(2, '0')
        val mStr = minutes.toString().padStart(2, '0')
        return "$hStr:$mStr"
    }
}
