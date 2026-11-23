//! Pure Muhurtha (Electional Astrology) Evaluation Engine
//!
//! Evaluates electional auspiciousness based on Panchanga,
//! directional shoola, Tarabala, Chandrabala, and classical activities.

use chrono::NaiveTime;
use serde::{Deserialize, Serialize};
use crate::models::Panchanga;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MuhurthaRequest {
    pub date: String,             // "DD/MM/YYYY"
    pub time: String,             // "HH:MM"
    pub lat: f64,
    pub lon: f64,
    pub timezone: f64,
    #[serde(default = "default_activity")]
    pub activity: String,         // "travel", "business", "marriage", "property", "medical", "general"
    pub direction: Option<String>,// For travel: "East", "West", "North", "South"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub birth_moon_nakshatra: Option<String>, // Optional: Janma Nakshatra for Tarabala evaluation
    #[serde(skip_serializing_if = "Option::is_none")]
    pub birth_moon_sign: Option<String>,      // Optional: Janma Rashi for Chandrabala evaluation
}

fn default_activity() -> String {
    "general".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TarabalaInfo {
    pub janma_nakshatra: String,
    pub transit_nakshatra: String,
    pub tara_number: u8, // 1 to 9
    pub tara_name: String,
    pub is_favorable: bool,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChandrabalaInfo {
    pub janma_sign: String,
    pub transit_sign: String,
    pub house_from_moon: u8, // 1 to 12
    pub is_favorable: bool,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DishaShoolaInfo {
    pub day: String,
    pub forbidden_direction: String,
    pub user_direction: Option<String>,
    pub has_conflict: bool,
    pub mitigation: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PanchangaSnapshot {
    pub tithi_name: String,
    pub tithi_number: usize,
    pub paksha: String,
    pub is_rikta: bool,
    pub nakshatra_name: String,
    pub nakshatra_lord: String,
    pub weekday: String,
    pub yoga_name: String,
    pub karana_name: String,
    pub is_vishti_bhadra: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimingSlots {
    pub rahu_kaal: String,
    pub gulika_kaal: String,
    pub yama_ganda: String,
    pub abhijit_muhurat: String,
    pub brahma_muhurta: String,
    pub is_in_rahu_kaal: bool,
    pub is_in_abhijit: bool,
    pub is_in_brahma: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MuhurthaResponse {
    pub activity: String,
    pub score: u8, // 0 - 100
    pub quality: String, // "Highly Auspicious", "Favorable", "Moderate", "Inauspicious / Avoid"
    pub is_auspicious: bool,
    pub date: String,
    pub time: String,
    pub panchanga: PanchangaSnapshot,
    pub slots: TimingSlots,
    pub disha_shoola: Option<DishaShoolaInfo>,
    pub tarabala: Option<TarabalaInfo>,
    pub chandrabala: Option<ChandrabalaInfo>,
    pub positive_factors: Vec<String>,
    pub negative_factors: Vec<String>,
    pub classical_rules_applied: Vec<String>,
    pub recommendation: String,
    // Convenience fields for UI components
    pub active_rahu_kalam: bool,
    pub in_abhijit: bool,
    pub in_brahma_muhurta: bool,
    pub shoola_warning: Option<String>,
    pub shoola_mitigation: Option<String>,
    pub reasons: Vec<String>,
    pub rules_applied: Vec<String>,
}

pub const NAKSHATRAS_27: [&str; 27] = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
    "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
];

pub const SIGNS_12: [&str; 12] = [
    "Aries", "Taurus", "Gemini", "Cancer",
    "Leo", "Virgo", "Libra", "Scorpio",
    "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

fn find_nakshatra_index(name: &str) -> Option<usize> {
    let lower = name.to_lowercase();
    NAKSHATRAS_27.iter().position(|&n| lower.contains(&n.to_lowercase()) || n.to_lowercase().contains(&lower))
}

fn find_sign_index(name: &str) -> Option<usize> {
    let lower = name.to_lowercase();
    SIGNS_12.iter().position(|&s| lower.contains(&s.to_lowercase()) || s.to_lowercase().contains(&lower))
}

fn is_time_in_range(target: NaiveTime, slot_str: &str) -> bool {
    let parts: Vec<&str> = slot_str.split('-').map(|s| s.trim()).collect();
    if parts.len() != 2 {
        return false;
    }
    let parse_t = |s: &str| -> Option<NaiveTime> {
        let clean = s.trim();
        let tokens: Vec<&str> = clean.split(':').collect();
        if tokens.len() >= 2 {
            let h = tokens[0].parse::<u32>().ok()?;
            let m = tokens[1].parse::<u32>().ok()?;
            NaiveTime::from_hms_opt(h, m, 0)
        } else {
            None
        }
    };

    let start = match parse_t(parts[0]) {
        Some(t) => t,
        None => return false,
    };
    let end = match parse_t(parts[1]) {
        Some(t) => t,
        None => return false,
    };

    if start <= end {
        target >= start && target <= end
    } else {
        target >= start || target <= end
    }
}

pub fn evaluate_muhurtha(
    req: &MuhurthaRequest,
    p_calc: &Panchanga,
    transit_moon_sign: Option<&str>,
) -> Result<MuhurthaResponse, String> {
    let parsed_time = NaiveTime::parse_from_str(req.time.trim(), "%H:%M")
        .or_else(|_| {
            let parts: Vec<&str> = req.time.trim().split(':').collect();
            if parts.len() >= 2 {
                let h = parts[0].parse::<u32>().map_err(|e| e.to_string())?;
                let m = parts[1].parse::<u32>().map_err(|e| e.to_string())?;
                NaiveTime::from_hms_opt(h, m, 0).ok_or_else(|| "Invalid time numbers".to_string())
            } else {
                Err("Invalid time format. Please use HH:MM.".to_string())
            }
        })
        .map_err(|_| "Invalid time format. Please use HH:MM.".to_string())?;

    let tithi_idx = p_calc.tithi.index as usize;
    let tithi_name = p_calc.tithi.name.clone();
    let paksha_tithi = (tithi_idx % 15) + 1;
    let paksha = p_calc.paksha.clone();
    let is_rikta = matches!(paksha_tithi, 4 | 9 | 14);

    let nak_name = p_calc.nakshatra.name.clone();
    let nak_lord = p_calc.nakshatra_lord.clone().unwrap_or_else(|| "Unknown".to_string());

    let weekday = p_calc.vara.clone();
    let yoga_name = p_calc.yoga.name.clone();
    let karana_name = p_calc.karana.name.clone();
    let is_vishti = karana_name.to_lowercase().contains("vishti") || karana_name.to_lowercase().contains("bhadra");

    // Timing slots
    let rahu_str = p_calc.rahu_kaal.clone().unwrap_or_default();
    let gulika_str = p_calc.gulika_kaal.clone().unwrap_or_default();
    let yama_str = p_calc.yama_ganda.clone().unwrap_or_default();
    let abhijit_str = p_calc.abhijit_muhurat.clone().unwrap_or_default();
    let brahma_str = p_calc.brahma_muhurta.clone().unwrap_or_default();

    let is_in_rahu = is_time_in_range(parsed_time, &rahu_str);
    let is_in_abhijit = is_time_in_range(parsed_time, &abhijit_str);
    let is_in_brahma = is_time_in_range(parsed_time, &brahma_str);

    // Directional Shoola (Disha Shoola)
    let forbidden_dir = match weekday.as_str() {
        "Monday" | "Saturday" => "East",
        "Sunday" | "Friday" => "West",
        "Tuesday" | "Wednesday" => "North",
        "Thursday" => "South",
        _ => "None",
    };

    let user_dir = req.direction.clone();
    let has_dir_conflict = if let Some(ref d) = user_dir {
        d.eq_ignore_ascii_case(forbidden_dir)
    } else {
        false
    };

    let shoola_mitigation = match forbidden_dir {
        "East" => "If east travel is essential on Monday/Saturday, begin after 8 ghatis (~3.2 hrs after sunrise) or consume milk/sesame before departing.",
        "West" => "If west travel is essential on Sunday/Friday, consume jaggery or curd before embarking.",
        "North" => "If north travel is essential on Tuesday/Wednesday, consume coriander or jaggery before embarking.",
        "South" => "If south travel is essential on Thursday, consume curd or mustard before embarking.",
        _ => "No prominent shoola directional restriction.",
    }.to_string();

    let disha_info = Some(DishaShoolaInfo {
        day: weekday.clone(),
        forbidden_direction: forbidden_dir.to_string(),
        user_direction: user_dir.clone(),
        has_conflict: has_dir_conflict,
        mitigation: shoola_mitigation.clone(),
    });

    // ─── SCORING & RULES EVALUATION ──────────────────────────────────────────
    let mut score: i16 = 50;
    let mut positive_factors = Vec::new();
    let mut negative_factors = Vec::new();
    let mut classical_rules_applied = Vec::new();

    let activity_lower = req.activity.to_lowercase();

    // 1. Inauspicious Time Checks (Universal)
    if is_in_rahu {
        score -= 35;
        negative_factors.push(format!("Active Rahu Kalam slot ({rahu_str}). Classical texts strictly forbid auspicious initiatives during Rahu's reign."));
    } else {
        positive_factors.push(format!("Safely outside Rahu Kalam (Rahu Kalam occurs {rahu_str})."));
    }

    if is_in_abhijit {
        score += 25;
        positive_factors.push(format!("Blessed by Abhijit Muhurta ({abhijit_str}). Supreme midday solar window capable of neutralizing minor doshas."));
    }

    if is_in_brahma {
        score += 20;
        positive_factors.push(format!("Occurring in Brahma Muhurta ({brahma_str}). Pure sattvic spiritual window ideal for meditation and consecration."));
    }

    if is_vishti {
        score -= 25;
        negative_factors.push(format!("Active Vishti (Bhadra) Karana. Carries heavy obstruction; avoid for contracts, marriage, or journeys."));
    }

    // 2. Tithi Evaluation
    if is_rikta {
        score -= 20;
        negative_factors.push(format!("Rikta Tithi (Tithi {paksha_tithi} - {tithi_name}). Classical texts advise against major material or joyous beginnings on Rikta (empty) days."));
    }

    // 3. Activity-Specific Logic
    match activity_lower.as_str() {
        "travel" | "journey" | "relocation" => {
            if matches!(paksha_tithi, 2 | 3 | 5 | 7 | 10 | 11 | 13) {
                score += 15;
                positive_factors.push(format!("Auspicious Lunar Day for Travel: Tithi {paksha_tithi} ({tithi_name}) promotes fruitful completion of journey."));
                classical_rules_applied.push("Muhurtha Chintamani: ShubhaTithiYatra".to_string());
            } else if matches!(paksha_tithi, 1 | 14 | 15) {
                score -= 20;
                negative_factors.push("Inauspicious Lunar Day for Travel: Amavasya, Purnima, or 14th tithi lead to travel friction or delays.".to_string());
                classical_rules_applied.push("Muhurtha Chintamani: VarjyaTithiYatra".to_string());
            }

            let travel_good_stars = ["Mrigashira", "Ashwini", "Pushya", "Punarvasu", "Hasta", "Anuradha", "Shravana", "Dhanishta", "Revati"];
            let travel_bad_stars = ["Bharani", "Krittika", "Ashlesha", "Vishakha", "Purva Phalguni", "Purva Bhadrapada", "Ardra"];

            if travel_good_stars.iter().any(|s| nak_name.contains(s)) {
                score += 20;
                positive_factors.push(format!("Auspicious Constellation for Travel ({nak_name}). Assures smooth passage and swift safe return."));
                classical_rules_applied.push("B.V. Raman: ShubhaNakshatraYatra".to_string());
            } else if travel_bad_stars.iter().any(|s| nak_name.contains(s)) {
                score -= 20;
                negative_factors.push(format!("Fierce or Obstruction Asterism ({nak_name}) active. Classical rule mandates caution against beginning distant trips."));
                classical_rules_applied.push("Muhurtha Chintamani: UgraNakshatraYatraVarjya".to_string());
            }

            if has_dir_conflict {
                score -= 20;
                negative_factors.push(format!("Directional Shoola (Disha Shoola) conflict: Travelling {forbidden_dir} on {weekday} is discouraged in classical Jyotish."));
                classical_rules_applied.push(format!("Brihat Samhita: DishaShoola{forbidden_dir}"));
            } else if let Some(ref d) = user_dir {
                positive_factors.push(format!("Clear directional path: Travel towards {d} is free of Disha Shoola on {weekday}."));
            }
        }

        "business" | "commerce" | "trade" => {
            if matches!(weekday.as_str(), "Wednesday" | "Thursday" | "Friday") {
                score += 15;
                positive_factors.push(format!("Favorable Weekday ({weekday}) ruled by benefics (Mercury/Jupiter/Venus), highly supportive of trade and investment."));
                classical_rules_applied.push("Muhurtha Chintamani: ShubhaVaraVanijya".to_string());
            } else if weekday == "Tuesday" {
                score -= 15;
                negative_factors.push("Tuesday (ruled by Mars/Kuja) is generally avoided for signing peaceful contracts or commercial retail opening.".to_string());
            }

            let trade_stars = ["Ashwini", "Rohini", "Pushya", "Hasta", "Chitra", "Anuradha", "Shravana", "Revati"];
            if trade_stars.iter().any(|s| nak_name.contains(s)) {
                score += 20;
                positive_factors.push(format!("Favorable Commerce Constellation ({nak_name}) active, stimulating market goodwill and rapid transaction flow."));
                classical_rules_applied.push("Muhurtha Chintamani: ShubhaNakshatraVanijya".to_string());
            }
        }

        "marriage" | "relationship" => {
            let marriage_stars = ["Rohini", "Mrigashira", "Magha", "Uttara Phalguni", "Hasta", "Swati", "Anuradha", "Mula", "Uttara Ashadha", "Uttara Bhadrapada", "Revati"];
            if marriage_stars.iter().any(|s| nak_name.contains(s)) {
                score += 20;
                positive_factors.push(format!("Noble Marriage Asterism ({nak_name}) supports mutual devotion, harmony, and enduring marital prosperity."));
                classical_rules_applied.push("Muhurtha Chintamani: ShubhaVivaahaNakshatra".to_string());
            }
            if matches!(paksha_tithi, 2 | 3 | 5 | 7 | 10 | 11 | 12 | 13) {
                score += 15;
                positive_factors.push(format!("Auspicious Lunar Day for Matrimony: Tithi {paksha_tithi} ({tithi_name})."));
                classical_rules_applied.push("Muhurtha Chintamani: ShubhaTithiVivaaha".to_string());
            }
        }

        "property" | "building" | "construction" => {
            let sthira_stars = ["Rohini", "Uttara Phalguni", "Uttara Ashadha", "Uttara Bhadrapada"];
            if sthira_stars.iter().any(|s| nak_name.contains(s)) {
                score += 25;
                positive_factors.push(format!("Sthira (Fixed) Asterism ({nak_name}) active. Confers structural permanence, safety, and long-term domestic peace."));
                classical_rules_applied.push("Muhurtha Chintamani: SthiraNakshatraGriharambha".to_string());
            }
        }

        "medical" | "surgery" => {
            if matches!(weekday.as_str(), "Tuesday" | "Saturday") {
                score -= 15;
                negative_factors.push(format!("Tuesday/Saturday are generally avoided for non-emergency elective surgeries due to inflammatory Mars/Saturn friction."));
            }
            if nak_name.contains("Ashwini") {
                score += 25;
                positive_factors.push("Ashwini Nakshatra active (presided by the Ashwini Kumaras - Celestial Physicians), promoting expedited cellular recovery and healing.".to_string());
                classical_rules_applied.push("Sushruta Samhita: ChikitsaArambhaShubha".to_string());
            }
        }

        _ => {
            if matches!(paksha_tithi, 2 | 3 | 5 | 7 | 10 | 11 | 13) {
                score += 10;
                positive_factors.push(format!("Auspicious Tithi {paksha_tithi} ({tithi_name})."));
            }
        }
    }

    // ─── 4. PERSONALIZED TARABALA & CHANDRABALA ─────────────────────────────
    let mut tarabala_info: Option<TarabalaInfo> = None;
    if let Some(ref b_nak) = req.birth_moon_nakshatra {
        if let (Some(b_idx), Some(t_idx)) = (find_nakshatra_index(b_nak), find_nakshatra_index(&nak_name)) {
            let diff = (t_idx as i16 - b_idx as i16).rem_euclid(27);
            let tara_num = ((diff % 9) + 1) as u8;
            let (tara_name, is_fav, desc, score_delta) = match tara_num {
                1 => ("Janma", false, "Janma Tara (Birth Star) - Indicates physical strain or identity re-evaluation. Generally avoid for critical material ventures.", -5),
                2 => ("Sampat", true, "Sampat Tara (Wealth & Prosperity) - Highly auspicious! Favors financial growth, investment, and auspicious undertakings.", 15),
                3 => ("Vipat", false, "Vipat Tara (Danger & Obstacles) - Inauspicious. Indicates unexpected complications, delays, or friction. Reschedule if possible.", -15),
                4 => ("Kshema", true, "Kshema Tara (Well-being & Protection) - Highly auspicious! Confers safety, domestic peace, and smooth execution.", 15),
                5 => ("Pratyak", false, "Pratyak Tara (Opposition & Enmity) - Inauspicious. Can attract conflict, legal resistance, or counter-forces.", -15),
                6 => ("Sadhana", true, "Sadhana Tara (Accomplishment & Success) - Highly auspicious! Ideal for strategic planning, enterprise, and achieving goals.", 15),
                7 => ("Naidhana", false, "Naidhana / Vadh Tara (Peril & Severe Obstruction) - Most inauspicious Tara. Strictly avoid for major initiatives or new beginnings.", -25),
                8 => ("Mitra", true, "Mitra Tara (Friendly & Cordial) - Auspicious. Fosters cooperative relationships, partnerships, and smooth social interactions.", 10),
                9 => ("Parama Mitra", true, "Parama Mitra Tara (Supreme Ally & Fulfillment) - Highly auspicious! Confers profound backing, triumph, and fruitful closure.", 15),
                _ => ("Unknown", false, "Unidentified Tara", 0),
            };

            score += score_delta;
            if is_fav {
                positive_factors.push(format!("Personal Tarabala Favorable: Transit Nakshatra ({}) is your {} (Tara #{tara_num}) - {}", nak_name, tara_name, desc));
                classical_rules_applied.push(format!("Muhurtha Chintamani: ShubhaTarabala{tara_name}"));
            } else {
                negative_factors.push(format!("Personal Tarabala Affliction: Transit Nakshatra ({}) is your {} (Tara #{tara_num}) - {}", nak_name, tara_name, desc));
                classical_rules_applied.push(format!("Muhurtha Chintamani: VarjyaTarabala{tara_name}"));
            }

            tarabala_info = Some(TarabalaInfo {
                janma_nakshatra: NAKSHATRAS_27[b_idx].to_string(),
                transit_nakshatra: nak_name.clone(),
                tara_number: tara_num,
                tara_name: tara_name.to_string(),
                is_favorable: is_fav,
                description: desc.to_string(),
            });
        }
    }

    let mut chandrabala_info: Option<ChandrabalaInfo> = None;
    let actual_moon_sign = transit_moon_sign.unwrap_or("Unknown");

    if let Some(ref b_sign) = req.birth_moon_sign {
        if let (Some(b_idx), Some(t_idx)) = (find_sign_index(b_sign), find_sign_index(actual_moon_sign)) {
            let house_from_moon = (((t_idx as i16 - b_idx as i16).rem_euclid(12)) + 1) as u8;
            let (is_fav, desc, score_delta) = match house_from_moon {
                1 => (true, "Janma Chandra (1st house): Mind focused on self; favorable/acceptable.", 10),
                2 => (true, "2nd house from natal Moon: Moderate for wealth/speech, acceptable.", 5),
                3 => (true, "3rd house from natal Moon: Favorable! Courage, victory, and decisive action.", 15),
                4 => (false, "Kantaka Chandra (4th house): Inauspicious. Mental distress or domestic agitation.", -15),
                5 => (true, "5th house from natal Moon: Moderate/favorable for intellect and contemplation.", 5),
                6 => (true, "6th house from natal Moon: Favorable! Triumph over obstacles, debts, and adversaries.", 15),
                7 => (true, "7th house from natal Moon: Favorable for partnerships, trade, and social accords.", 15),
                8 => (false, "Ashtama Chandra (8th house): Severely Inauspicious! Classical mandate strictly prohibits initiating auspicious work under 8th Moon transit.", -30),
                9 => (true, "9th house from natal Moon: Favorable! Luck, ethical guidance, and spiritual merit.", 10),
                10 => (true, "10th house from natal Moon: Highly Auspicious! Professional prestige, honor, and public success.", 20),
                11 => (true, "11th house from natal Moon: Highly Auspicious! Gains, fulfillment of desires, and prosperity.", 20),
                12 => (false, "12th house from natal Moon: Inauspicious. Energy dissipation, unexpected expenses, or fatigue.", -15),
                _ => (false, "Unknown lunar transit position.", 0),
            };

            score += score_delta;
            if is_fav {
                positive_factors.push(format!("Personal Chandrabala Favorable: Transit Moon is in house {house_from_moon} ({actual_moon_sign}) from your natal Moon ({}) - {}", SIGNS_12[b_idx], desc));
                classical_rules_applied.push(format!("Muhurtha Chintamani: ShubhaChandrabalaH{house_from_moon}"));
            } else {
                negative_factors.push(format!("Personal Chandrabala Affliction: Transit Moon is in house {house_from_moon} ({actual_moon_sign}) from your natal Moon ({}) - {}", SIGNS_12[b_idx], desc));
                classical_rules_applied.push(format!("Muhurtha Chintamani: VarjyaChandrabalaH{house_from_moon}"));
            }

            chandrabala_info = Some(ChandrabalaInfo {
                janma_sign: SIGNS_12[b_idx].to_string(),
                transit_sign: actual_moon_sign.to_string(),
                house_from_moon,
                is_favorable: is_fav,
                description: desc.to_string(),
            });
        }
    }

    let clamped_score = score.clamp(5, 98) as u8;
    let is_auspicious = clamped_score >= 65;

    let quality = match clamped_score {
        80..=100 => "Highly Auspicious (Shubha)",
        65..=79 => "Favorable (Uttama)",
        50..=64 => "Moderate / Acceptable (Madhyama)",
        _ => "Inauspicious / Avoid (Ashubha)",
    }.to_string();

    let recommendation = match clamped_score {
        80..=100 => format!("This is an exceptionally fortified, auspicious time window for {activity_lower}. Key planetary, lunar, and personal indicators align harmoniously."),
        65..=79 => format!("Favorable window for {activity_lower}. Minor precautions observed, but positive factors dominate."),
        50..=64 => format!("Neutral or average timing for {activity_lower}. If urgent, proceed with ethical diligence; otherwise, an Abhijit or Shubha window is preferred."),
        _ => format!("Inauspicious timing for {activity_lower}. Notable afflictions (such as Rahu Kalam, Rikta Tithi, Tarabala/Chandrabala friction, or conflicting asterisms) suggest rescheduling if possible."),
    };

    let shoola_warning = if has_dir_conflict {
        Some(format!("Travelling {forbidden_dir} on {weekday} violates Directional Shoola."))
    } else {
        None
    };
    let shoola_mitigation_opt = if has_dir_conflict {
        Some(shoola_mitigation.clone())
    } else {
        None
    };

    let mut reasons = Vec::new();
    reasons.extend(positive_factors.clone());
    reasons.extend(negative_factors.clone());
    let rules_applied = classical_rules_applied.clone();

    Ok(MuhurthaResponse {
        activity: activity_lower,
        score: clamped_score,
        quality,
        is_auspicious,
        date: req.date.clone(),
        time: req.time.clone(),
        panchanga: PanchangaSnapshot {
            tithi_name,
            tithi_number: tithi_idx,
            paksha: paksha.to_string(),
            is_rikta,
            nakshatra_name: nak_name,
            nakshatra_lord: nak_lord,
            weekday,
            yoga_name,
            karana_name,
            is_vishti_bhadra: is_vishti,
        },
        slots: TimingSlots {
            rahu_kaal: rahu_str,
            gulika_kaal: gulika_str,
            yama_ganda: yama_str,
            abhijit_muhurat: abhijit_str,
            brahma_muhurta: brahma_str,
            is_in_rahu_kaal: is_in_rahu,
            is_in_abhijit,
            is_in_brahma,
        },
        disha_shoola: disha_info,
        tarabala: tarabala_info,
        chandrabala: chandrabala_info,
        positive_factors,
        negative_factors,
        classical_rules_applied,
        recommendation,
        active_rahu_kalam: is_in_rahu,
        in_abhijit: is_in_abhijit,
        in_brahma_muhurta: is_in_brahma,
        shoola_warning,
        shoola_mitigation: shoola_mitigation_opt,
        reasons,
        rules_applied,
    })
}
