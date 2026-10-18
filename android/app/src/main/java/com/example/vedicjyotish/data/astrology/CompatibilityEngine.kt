package com.example.vedicjyotish.data.astrology

import com.example.vedicjyotish.data.models.CompatibilityResponse
import com.example.vedicjyotish.data.models.KootaResult
import com.example.vedicjyotish.data.models.PartnerDetails
import kotlin.math.abs

/**
 * 100% On-Device Classical Ashtakoota Compatibility Engine (36-Point Guna Milan).
 * Evaluates Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot, and Naadi,
 * plus classical South/North Indian extensions: Mahendra, Vedha, Rajju, Stree Deergha.
 */
object CompatibilityEngine {

    // Varna Koota Matrix (1 pt)
    // 0: Brahmin, 1: Kshatriya, 2: Vaishya, 3: Shudra
    private val VARNA_RAASI_LIST = intArrayOf(1, 3, 2, 0, 1, 3, 2, 0, 1, 3, 2, 0)
    private val VARNA_SCORES = arrayOf(
        doubleArrayOf(1.0, 0.0, 0.0, 0.0),
        doubleArrayOf(1.0, 1.0, 0.0, 0.0),
        doubleArrayOf(1.0, 1.0, 1.0, 0.0),
        doubleArrayOf(1.0, 1.0, 1.0, 1.0)
    )

    // Vashya Koota Matrix (2 pts)
    // 0: Chatushpada (Quadruped), 1: Manava (Human), 2: Jalachara (Water), 3: Vanachara (Wild), 4: Keeta (Insect)
    private val VASHYA_RAASI_LIST = intArrayOf(0, 0, 1, 2, 3, 1, 1, 4, 1, 0, 1, 2)
    private val VASHYA_SCORES = arrayOf(
        doubleArrayOf(2.0, 0.5, 1.0, 0.0, 2.0),
        doubleArrayOf(0.5, 2.0, 0.0, 0.0, 0.0),
        doubleArrayOf(1.0, 0.0, 2.0, 2.0, 2.0),
        doubleArrayOf(0.0, 0.0, 2.0, 2.0, 0.0),
        doubleArrayOf(1.0, 0.0, 1.0, 0.0, 2.0)
    )

    // Gana Koota Matrix (6 pts)
    // 0: Deva, 1: Manushya, 2: Rakshasa
    private val NAKSHATRA_GANA = intArrayOf(
        0, 1, 2, 1, 0, 1, 0, 0, 2,
        2, 1, 1, 0, 2, 0, 2, 0, 2,
        2, 1, 1, 0, 2, 2, 1, 1, 0
    )
    private val GANA_SCORES = arrayOf(
        doubleArrayOf(6.0, 6.0, 0.0), // Boy Deva
        doubleArrayOf(5.0, 6.0, 0.0), // Boy Manushya
        doubleArrayOf(1.0, 0.0, 6.0)  // Boy Rakshasa
    )

    // Yoni Koota Matrix (4 pts) - 14 animal classes
    private val NAKSHATRA_YONI = intArrayOf(
        0, 1, 2, 3, 3, 4, 5, 2, 5, 6, 6, 7, 8, 9, 8, 9, 10, 10, 4, 11, 12, 11, 13, 0, 13, 7, 1
    )
    private val YONI_SCORES = arrayOf(
        doubleArrayOf(4.0, 2.0, 2.0, 3.0, 2.0, 2.0, 2.0, 1.0, 0.0, 1.0, 1.0, 3.0, 2.0, 1.0),
        doubleArrayOf(2.0, 4.0, 3.0, 3.0, 2.0, 2.0, 2.0, 2.0, 3.0, 1.0, 2.0, 3.0, 2.0, 0.0),
        doubleArrayOf(2.0, 3.0, 4.0, 2.0, 1.0, 2.0, 1.0, 3.0, 3.0, 1.0, 2.0, 0.0, 3.0, 1.0),
        doubleArrayOf(3.0, 3.0, 2.0, 4.0, 2.0, 1.0, 1.0, 1.0, 1.0, 2.0, 2.0, 2.0, 0.0, 2.0),
        doubleArrayOf(2.0, 2.0, 1.0, 2.0, 4.0, 2.0, 1.0, 2.0, 2.0, 1.0, 0.0, 2.0, 1.0, 1.0),
        doubleArrayOf(2.0, 2.0, 2.0, 1.0, 2.0, 4.0, 0.0, 2.0, 2.0, 1.0, 3.0, 3.0, 2.0, 1.0),
        doubleArrayOf(2.0, 2.0, 1.0, 1.0, 1.0, 0.0, 4.0, 2.0, 2.0, 2.0, 2.0, 2.0, 1.0, 2.0),
        doubleArrayOf(1.0, 2.0, 3.0, 1.0, 2.0, 2.0, 2.0, 4.0, 3.0, 0.0, 3.0, 2.0, 2.0, 1.0),
        doubleArrayOf(0.0, 3.0, 3.0, 1.0, 2.0, 2.0, 2.0, 3.0, 4.0, 1.0, 2.0, 2.0, 2.0, 1.0),
        doubleArrayOf(1.0, 1.0, 1.0, 2.0, 1.0, 1.0, 2.0, 0.0, 1.0, 4.0, 1.0, 1.0, 2.0, 1.0),
        doubleArrayOf(1.0, 2.0, 2.0, 2.0, 0.0, 3.0, 2.0, 3.0, 2.0, 1.0, 4.0, 2.0, 2.0, 1.0),
        doubleArrayOf(3.0, 3.0, 0.0, 2.0, 2.0, 3.0, 2.0, 2.0, 2.0, 1.0, 2.0, 4.0, 3.0, 2.0),
        doubleArrayOf(2.0, 2.0, 3.0, 0.0, 1.0, 2.0, 1.0, 2.0, 2.0, 2.0, 2.0, 3.0, 4.0, 2.0),
        doubleArrayOf(1.0, 0.0, 1.0, 2.0, 1.0, 1.0, 2.0, 1.0, 1.0, 1.0, 1.0, 2.0, 2.0, 4.0)
    )

    // Graha Maitri (Rasi Adhipathi) Matrix (5 pts)
    // 0: Sun, 1: Moon, 2: Mars, 3: Mercury, 4: Jupiter, 5: Venus, 6: Saturn
    private val RASI_LORDS = intArrayOf(2, 5, 3, 1, 0, 3, 5, 2, 4, 6, 6, 4)
    private val GRAHA_MAITRI_SCORES = arrayOf(
        doubleArrayOf(5.0, 5.0, 5.0, 4.0, 5.0, 0.0, 0.0),
        doubleArrayOf(5.0, 5.0, 4.0, 1.0, 4.0, 0.5, 0.5),
        doubleArrayOf(5.0, 4.0, 5.0, 0.5, 5.0, 3.0, 0.5),
        doubleArrayOf(4.0, 1.0, 0.5, 5.0, 0.5, 5.0, 4.0),
        doubleArrayOf(5.0, 4.0, 5.0, 0.5, 5.0, 0.5, 3.0),
        doubleArrayOf(0.0, 0.5, 3.0, 5.0, 0.5, 5.0, 5.0),
        doubleArrayOf(0.0, 0.5, 0.5, 4.0, 3.0, 5.0, 5.0)
    )

    // Naadi Koota Matrix (8 pts)
    // 0: Aadi (Vata), 1: Madhya (Pitta), 2: Antya (Kapha)
    private val NAKSHATRA_NAADI = intArrayOf(
        0, 1, 2, 2, 1, 0, 0, 1, 2,
        2, 1, 0, 0, 1, 2, 2, 1, 0,
        0, 1, 2, 2, 1, 0, 0, 1, 2
    )

    fun calculateMatching(
        boySign: String,
        boyNakshatra: String,
        boyPada: Int,
        girlSign: String,
        girlNakshatra: String,
        girlPada: Int,
        method: String = "North"
    ): CompatibilityResponse {
        val bSignIdx = VedicConstants.SIGNS.indexOf(boySign).let { if (it < 0) 0 else it }
        val gSignIdx = VedicConstants.SIGNS.indexOf(girlSign).let { if (it < 0) 0 else it }

        val bNakIdx = VedicConstants.NAKSHATRA_NAMES.indexOf(boyNakshatra).let { if (it < 0) 0 else it }
        val gNakIdx = VedicConstants.NAKSHATRA_NAMES.indexOf(girlNakshatra).let { if (it < 0) 0 else it }

        // 1. Varna Koota (1 pt)
        val bVarna = VARNA_RAASI_LIST[bSignIdx]
        val gVarna = VARNA_RAASI_LIST[gSignIdx]
        val varnaScore = VARNA_SCORES[bVarna][gVarna]
        val varnaResult = KootaResult("Varna", varnaScore, 1.0, varnaScore > 0.0)

        // 2. Vashya Koota (2 pts)
        val bVashya = VASHYA_RAASI_LIST[bSignIdx]
        val gVashya = VASHYA_RAASI_LIST[gSignIdx]
        val vashyaScore = VASHYA_SCORES[bVashya][gVashya]
        val vashyaResult = KootaResult("Vashya", vashyaScore, 2.0, vashyaScore >= 1.0)

        // 3. Tara Koota (Dina Koota - 3 pts)
        // Count from Girl nakshatra to Boy nakshatra and vice versa
        val taraBoyFromGirl = ((bNakIdx - gNakIdx + 27) % 27) % 9
        val taraGirlFromBoy = ((gNakIdx - bNakIdx + 27) % 27) % 9
        val inauspiciousTaras = listOf(2, 4, 6) // 3rd (Vipat), 5th (Pratyak), 7th (Naidhana)
        val bOk = taraBoyFromGirl !in inauspiciousTaras
        val gOk = taraGirlFromBoy !in inauspiciousTaras
        val taraScore = if (bOk && gOk) 3.0 else if (bOk || gOk) 1.5 else 0.0
        val taraResult = KootaResult("Tara", taraScore, 3.0, taraScore >= 1.5)

        // 4. Yoni Koota (4 pts)
        val bYoni = NAKSHATRA_YONI[bNakIdx]
        val gYoni = NAKSHATRA_YONI[gNakIdx]
        val yoniScore = YONI_SCORES[bYoni][gYoni]
        val yoniResult = KootaResult("Yoni", yoniScore, 4.0, yoniScore >= 2.0)

        // 5. Graha Maitri Koota (5 pts)
        val bLord = RASI_LORDS[bSignIdx]
        val gLord = RASI_LORDS[gSignIdx]
        val maitriScore = GRAHA_MAITRI_SCORES[bLord][gLord]
        val maitriResult = KootaResult("Graha Maitri", maitriScore, 5.0, maitriScore >= 3.0)

        // 6. Gana Koota (6 pts)
        val bGana = NAKSHATRA_GANA[bNakIdx]
        val gGana = NAKSHATRA_GANA[gNakIdx]
        val ganaScore = GANA_SCORES[bGana][gGana]
        val ganaResult = KootaResult("Gana", ganaScore, 6.0, ganaScore >= 5.0)

        // 7. Bhakoot Koota (Rasi Koota - 7 pts)
        // 2/12, 6/8, 9/5 placements are considered dosha unless lords are friends or same
        val rasiDist = ((bSignIdx - gSignIdx + 12) % 12) + 1
        val bhakootScore = when (rasiDist) {
            1, 7, 3, 11, 4, 10 -> 7.0
            2, 12, 6, 8, 5, 9 -> if (bLord == gLord || maitriScore >= 4.0) 7.0 else 0.0
            else -> 0.0
        }
        val bhakootResult = KootaResult("Bhakoot", bhakootScore, 7.0, bhakootScore == 7.0)

        // 8. Naadi Koota (8 pts)
        val bNaadi = NAKSHATRA_NAADI[bNakIdx]
        val gNaadi = NAKSHATRA_NAADI[gNakIdx]
        val naadiScore = if (bNaadi != gNaadi) 8.0 else {
            // Exception: Different quarters / pada or different rasis
            if (bSignIdx != gSignIdx) 8.0 else 0.0
        }
        val naadiResult = KootaResult("Naadi", naadiScore, 8.0, naadiScore == 8.0)

        // Additional Classical Kootas (South/North Indian Poruthams)
        val distGirlToBoy = ((bNakIdx - gNakIdx + 27) % 27) + 1
        val mahendra = distGirlToBoy in listOf(4, 7, 10, 13, 16, 19, 22, 25)
        val sthreeDheerga = distGirlToBoy >= 9
        val rajju = (bNakIdx % 5) != (gNakIdx % 5) // Not on same Rajju rope
        val vedha = abs(bNakIdx - gNakIdx) != 14   // No mutual affliction

        val totalScore = varnaScore + vashyaScore + taraScore + yoniScore + maitriScore + ganaScore + bhakootScore + naadiScore
        val minPoruthamMatched = totalScore >= 18.0 && (naadiScore > 0 || bhakootScore > 0)

        return CompatibilityResponse(
            boyDetails = PartnerDetails(sign = boySign, nakshatra = boyNakshatra, pada = boyPada),
            girlDetails = PartnerDetails(sign = girlSign, nakshatra = girlNakshatra, pada = girlPada),
            method = method,
            varna = varnaResult,
            vashya = vashyaResult,
            tara = taraResult,
            yoni = yoniResult,
            grahaMaitri = maitriResult,
            gana = ganaResult,
            bhakoot = bhakootResult,
            naadi = naadiResult,
            mahendra = mahendra,
            vedha = vedha,
            rajju = rajju,
            sthreeDheerga = sthreeDheerga,
            totalScore = totalScore,
            maxScore = 36.0,
            minimumPoruthamMatched = minPoruthamMatched
        )
    }
}
