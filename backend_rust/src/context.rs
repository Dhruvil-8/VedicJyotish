#![allow(dead_code)]

use crate::models::{AiChartContext, AiSafety, ChartResponse};

// ─── Query Topic Auto-Classifier ─────────────────────────────────────────────

pub fn detect_topic_from_question(question: &str) -> &str {
    let q = question.to_lowercase();
    if q.contains("job") || q.contains("career") || q.contains("profession") || q.contains("business")
        || q.contains("work") || q.contains("promotion") || q.contains("office") || q.contains("boss")
        || q.contains("employ") || q.contains("industry") || q.contains("startup")
    {
        "career"
    } else if q.contains("marry") || q.contains("marriage") || q.contains("spouse") || q.contains("wife")
        || q.contains("husband") || q.contains("love") || q.contains("relationship") || q.contains("partner")
        || q.contains("compatibility") || q.contains("divorce") || q.contains("dating") || q.contains("beloved")
    {
        "relationship"
    } else if q.contains("health") || q.contains("disease") || q.contains("illness") || q.contains("sick")
        || q.contains("doctor") || q.contains("accident") || q.contains("surgery") || q.contains("operation")
        || q.contains("pain") || q.contains("cure") || q.contains("medical") || q.contains("physical")
    {
        "health"
    } else if q.contains("money") || q.contains("wealth") || q.contains("rich") || q.contains("finance")
        || q.contains("income") || q.contains("poor") || q.contains("loss") || q.contains("gain")
        || q.contains("debt") || q.contains("property") || q.contains("assets") || q.contains("investment")
    {
        "wealth"
    } else if q.contains("study") || q.contains("education") || q.contains("exam") || q.contains("college")
        || q.contains("school") || q.contains("degree") || q.contains("learn") || q.contains("knowledge")
        || q.contains("grade") || q.contains("academic")
    {
        "education"
    } else {
        "general"
    }
}

// ─── AI Chart Context Builders ───────────────────────────────────────────────

pub fn build_ai_chart_context(chart: ChartResponse) -> AiChartContext {
    let prompt_context = render_prompt_context(&chart);
    AiChartContext {
        schema_version: "vedicjyotish.ai_context.v1".to_string(),
        safety: AiSafety {
            pii_removed: true,
            contains_birth_inputs: false,
            guidance: "Use only the computed chart factors. Do not infer raw birth date, birth time, or exact coordinates. Do not provide medical, legal, financial, or fatalistic certainty.".to_string(),
        },
        calculation_profile: chart.profile.clone(),
        structured: chart,
        prompt_context,
    }
}

// ─── Topic-Specific Specialized Formatters ────────────────────────────────────

pub fn render_topic_prompt_context(chart: &ChartResponse, topic: &str) -> String {
    let mut lines = Vec::new();
    lines.push(format!(
        "Topic Focus: {} analysis",
        topic.to_uppercase()
    ));
    lines.push(format!(
        "Ascendant: {} | Moon: {} (Nakshatra: {} Pada {})",
        chart.ascendant.sign,
        chart.moon_intelligence.sign,
        chart.moon_intelligence.nakshatra,
        chart.moon_intelligence.pada
    ));

    // Expose primary houses and vargas based on topic
    match topic {
        "career" => {
            lines.push("Primary Career Placements:".to_string());
            append_house_detail(chart, &mut lines, 1);  // Personality/Self
            append_house_detail(chart, &mut lines, 6);  // Service/Daily work/Obstacles
            append_house_detail(chart, &mut lines, 10); // Profession/Karma/Status
            
            // Jaimini Amatyakaraka (AmK) & Atmakaraka (AK)
            if let Some(jaimini) = &chart.jaimini {
                lines.push("Jaimini Career Indicators:".to_string());
                for (planet, karaka) in &jaimini.chara_karakas {
                    if karaka == "AK" || karaka == "AmK" {
                        lines.push(format!("  - {planet} is the {karaka} (Atmakaraka/Amatyakaraka)"));
                    }
                }
                lines.push(format!(
                    "  - Karakamsha Lagna (soul purpose sign in D9): {}",
                    jaimini.karakamsha_lagna.sign
                ));
            }

            // Divisional Chart D10 (Dasamsa)
            if let Some(div_charts) = &chart.divisional_charts {
                if let Some(d10) = div_charts.get("D10") {
                    lines.push("D10 Dasamsa Placements:".to_string());
                    for h in [1, 10] {
                        if let Some(hdata) = d10.get(&format!("house_{h}")) {
                            lines.push(format!(
                                "  - D10 House {h} ({}) contains planets: {:?}",
                                hdata.sign, hdata.planets
                            ));
                        }
                    }
                }
            }

            // Career Yogas
            append_filtered_yogas(chart, &mut lines, &["Budhaditya", "Ruchaka", "Bhadra", "Hamsa", "Sasa", "Raja Yoga", "Neechabhanga"]);
        }
        "relationship" => {
            lines.push("Primary Relationship Placements:".to_string());
            append_house_detail(chart, &mut lines, 1);  // Self
            append_house_detail(chart, &mut lines, 7);  // Partner/Marriage
            append_house_detail(chart, &mut lines, 8);  // In-laws/Joint assets
            
            // Venus & Jupiter placements
            append_planet_detail(chart, &mut lines, "Venus");   // Kalathrakaraka
            append_planet_detail(chart, &mut lines, "Jupiter"); // Wisdom/Husband significator

            if let Some(jaimini) = &chart.jaimini {
                lines.push(format!(
                    "Upapada Lagna (UL - Marriage): {} in House {}",
                    jaimini.upapada_lagna.sign, jaimini.upapada_lagna.house
                ));
            }

            // D9 Navamsa (Relationship Deep Dive)
            if let Some(div_charts) = &chart.divisional_charts {
                if let Some(d9) = div_charts.get("D9") {
                    lines.push("D9 Navamsa Placements:".to_string());
                    for h in [1, 7] {
                        if let Some(hdata) = d9.get(&format!("house_{h}")) {
                            lines.push(format!(
                                "  - D9 House {h} ({}) contains: {:?}",
                                hdata.sign, hdata.planets
                            ));
                        }
                    }
                }
            }

            // Relationship Yogas / Doshas
            append_filtered_doshas(chart, &mut lines, &["manglik", "kalathra", "ganda_moola", "shrapit"]);
            append_filtered_yogas(chart, &mut lines, &["Malavya", "Guru Mangala", "Adhi"]);
        }
        "health" => {
            lines.push("Primary Health Placements:".to_string());
            append_house_detail(chart, &mut lines, 1);  // Self/Vitality
            append_house_detail(chart, &mut lines, 6);  // Diseases/Ailments
            append_house_detail(chart, &mut lines, 8);  // Chronic illnesses/Longevity
            append_house_detail(chart, &mut lines, 12); // Hospitalization

            append_planet_detail(chart, &mut lines, "Sun");   // Karaka of physical body
            append_planet_detail(chart, &mut lines, "Moon");  // Karaka of mind/fluids
            append_planet_detail(chart, &mut lines, "Saturn"); // Karaka of chronic decay

            // D6 Shasthamsa Placements
            if let Some(div_charts) = &chart.divisional_charts {
                if let Some(d6) = div_charts.get("D6") {
                    lines.push("D6 Shasthamsa Placements:".to_string());
                    for h in [1, 6, 8] {
                        if let Some(hdata) = d6.get(&format!("house_{h}")) {
                            lines.push(format!(
                                "  - D6 House {h} ({}) contains: {:?}",
                                hdata.sign, hdata.planets
                            ));
                        }
                    }
                }
            }

            // Health Yogas / Doshas
            append_filtered_doshas(chart, &mut lines, &["pitru", "guru_chandala", "ghata", "shrapit", "kala_sarpa"]);
            append_filtered_yogas(chart, &mut lines, &["Kemadruma"]);
        }
        "wealth" => {
            lines.push("Primary Wealth Placements:".to_string());
            append_house_detail(chart, &mut lines, 1);  // Self
            append_house_detail(chart, &mut lines, 2);  // Accumulated wealth/Speech
            append_house_detail(chart, &mut lines, 11); // Income/Gains/Network
            append_house_detail(chart, &mut lines, 9);  // Fortune/Luck

            append_planet_detail(chart, &mut lines, "Jupiter"); // Karaka of wealth/expansion
            append_planet_detail(chart, &mut lines, "Venus");   // Karaka of luxuries/comforts

            if let Some(jaimini) = &chart.jaimini {
                lines.push(format!(
                    "Arudha Lagna (AL - Public Status/Manifestation): {} in House {}",
                    jaimini.arudha_lagna.sign, jaimini.arudha_lagna.house
                ));
            }

            // D2 Hora Placements
            if let Some(div_charts) = &chart.divisional_charts {
                if let Some(d2) = div_charts.get("D2") {
                    lines.push("D2 Hora (Wealth distribution) Placements:".to_string());
                    for h in [1, 2, 11] {
                        if let Some(hdata) = d2.get(&format!("house_{h}")) {
                            lines.push(format!(
                                "  - D2 House {h} ({}) contains: {:?}",
                                hdata.sign, hdata.planets
                            ));
                        }
                    }
                }
            }

            // Wealth Yogas
            append_filtered_yogas(chart, &mut lines, &["Gaja Kesari", "Chandra Mangal", "Durudhara", "Sunapha", "Anapha", "Adhi", "Amala"]);
        }
        "education" => {
            lines.push("Primary Education Placements:".to_string());
            append_house_detail(chart, &mut lines, 1);  // Self
            append_house_detail(chart, &mut lines, 4);  // Academic schooling/Foundation
            append_house_detail(chart, &mut lines, 5);  // High intelligence/Memory/Creativity

            append_planet_detail(chart, &mut lines, "Mercury"); // Karaka of intellect/logic
            append_planet_detail(chart, &mut lines, "Jupiter"); // Karaka of higher wisdom/learning

            // D24 Siddhamsa Placements
            if let Some(div_charts) = &chart.divisional_charts {
                if let Some(d24) = div_charts.get("D24") {
                    lines.push("D24 Siddhamsa (Academic achievements) Placements:".to_string());
                    for h in [1, 4, 5] {
                        if let Some(hdata) = d24.get(&format!("house_{h}")) {
                            lines.push(format!(
                                "  - D24 House {h} ({}) contains: {:?}",
                                hdata.sign, hdata.planets
                            ));
                        }
                    }
                }
            }

            // Education Yogas
            append_filtered_yogas(chart, &mut lines, &["Budhaditya", "Gaja Kesari", "Nala"]);
        }
        _ => {
            // General fallback matches the default detailed rendering
            return render_prompt_context(chart);
        }
    }

    // Append Current Dasha for all topics (always important!)
    if let Some(current) = chart.vimshottari_timeline.first() {
        lines.push(format!(
            "Current Vimshottari Mahadasha: {} from {} to {}.",
            current.lord, current.start, current.end
        ));
        if let Some(antar) = current.antardashas.first() {
            lines.push(format!(
                "Current Antardasha: {} from {} to {}.",
                antar.lord, antar.start, antar.end
            ));
        }
    }

    lines.join("\n")
}

// ─── JSON Rendering Helpers for reqwest/Axum untyped payloads ──────────────────

pub fn render_topic_prompt_context_json(chart: &serde_json::Value, topic: &str) -> String {
    let mut lines = Vec::new();
    lines.push(format!(
        "Topic Focus: {} analysis",
        topic.to_uppercase()
    ));

    let today_str = chrono::Local::now().format("%d-%B-%Y %H:%M:%S").to_string();
    lines.push(format!(
        "Current Analysis Date/Time (Transit Reference): {}",
        today_str
    ));

    let asc_sign = chart.pointer("/ascendant/sign").and_then(|v| v.as_str()).unwrap_or("?");
    let moon_sign = chart.pointer("/moon_intelligence/sign").and_then(|v| v.as_str()).unwrap_or("?");
    let moon_nak = chart.pointer("/moon_intelligence/nakshatra").and_then(|v| v.as_str()).unwrap_or("?");
    let moon_pada = chart.pointer("/moon_intelligence/pada").and_then(|v| v.as_u64()).unwrap_or(1);
    
    lines.push(format!(
        "Ascendant: {} | Moon: {} (Nakshatra: {} Pada {})",
        asc_sign, moon_sign, moon_nak, moon_pada
    ));

    match topic {
        "career" => {
            lines.push("Primary Career Placements:".to_string());
            append_house_detail_json(chart, &mut lines, 1);
            append_house_detail_json(chart, &mut lines, 6);
            append_house_detail_json(chart, &mut lines, 10);
            
            if let Some(jaimini) = chart.get("jaimini") {
                lines.push("Jaimini Career Indicators:".to_string());
                if let Some(karakas) = jaimini.get("chara_karakas").and_then(|v| v.as_object()) {
                    for (planet, karaka) in karakas {
                        if let Some(k_str) = karaka.as_str() {
                            if k_str == "AK" || k_str == "AmK" {
                                lines.push(format!("  - {planet} is the {k_str} (Atmakaraka/Amatyakaraka)"));
                            }
                        }
                    }
                }
                if let Some(kk) = jaimini.pointer("/karakamsha_lagna/sign").and_then(|v| v.as_str()) {
                    lines.push(format!("  - Karakamsha Lagna (soul purpose sign in D9): {kk}"));
                }
            }

            if let Some(d10) = chart.pointer("/divisional_charts/D10").and_then(|v| v.as_object()) {
                lines.push("D10 Dasamsa Placements:".to_string());
                for h in [1, 10] {
                    if let Some(hdata) = d10.get(&format!("house_{h}")) {
                        let sign = hdata.get("sign").and_then(|v| v.as_str()).unwrap_or("?");
                        let planets = hdata.get("planets").and_then(|v| v.as_array());
                        let planets_str = planets.map(|arr| arr.iter().filter_map(|x| x.as_str()).collect::<Vec<_>>().join(", ")).unwrap_or_default();
                        lines.push(format!(
                            "  - D10 House {h} ({sign}) contains planets: [{planets_str}]"
                        ));
                    }
                }
            }

            append_filtered_yogas_json(chart, &mut lines, &["Budhaditya", "Ruchaka", "Bhadra", "Hamsa", "Sasa", "Raja Yoga", "Neechabhanga"]);
            append_relevant_aspects_json(chart, &mut lines, "career");
        }
        "relationship" => {
            lines.push("Primary Relationship Placements:".to_string());
            append_house_detail_json(chart, &mut lines, 1);
            append_house_detail_json(chart, &mut lines, 7);
            append_house_detail_json(chart, &mut lines, 8);
            
            append_planet_detail_json(chart, &mut lines, "Venus");
            append_planet_detail_json(chart, &mut lines, "Jupiter");

            if let Some(jaimini) = chart.get("jaimini") {
                let ul_sign = jaimini.pointer("/upapada_lagna/sign").and_then(|v| v.as_str()).unwrap_or("?");
                let ul_house = jaimini.pointer("/upapada_lagna/house").and_then(|v| v.as_u64()).unwrap_or(1);
                lines.push(format!(
                    "Upapada Lagna (UL - Marriage): {ul_sign} in House {ul_house}"
                ));
            }

            if let Some(d9) = chart.pointer("/navamsa_chart").and_then(|v| v.as_object()) {
                lines.push("D9 Navamsa Placements:".to_string());
                for h in [1, 7] {
                    if let Some(hdata) = d9.get(&format!("house_{h}")) {
                        let sign = hdata.get("sign").and_then(|v| v.as_str()).unwrap_or("?");
                        let planets = hdata.get("planets").and_then(|v| v.as_array());
                        let planets_str = planets.map(|arr| arr.iter().filter_map(|x| x.as_str()).collect::<Vec<_>>().join(", ")).unwrap_or_default();
                        lines.push(format!(
                            "  - D9 House {h} ({sign}) contains: [{planets_str}]"
                        ));
                    }
                }
            }

            append_filtered_doshas_json(chart, &mut lines, &["manglik", "kalathra", "ganda_moola", "shrapit"]);
            append_filtered_yogas_json(chart, &mut lines, &["Malavya", "Guru Mangala", "Adhi"]);
            append_relevant_aspects_json(chart, &mut lines, "relationship");
        }
        "health" => {
            lines.push("Primary Health Placements:".to_string());
            append_house_detail_json(chart, &mut lines, 1);
            append_house_detail_json(chart, &mut lines, 6);
            append_house_detail_json(chart, &mut lines, 8);
            append_house_detail_json(chart, &mut lines, 12);

            append_planet_detail_json(chart, &mut lines, "Sun");
            append_planet_detail_json(chart, &mut lines, "Moon");
            append_planet_detail_json(chart, &mut lines, "Saturn");

            if let Some(d6) = chart.pointer("/divisional_charts/D6").and_then(|v| v.as_object()) {
                lines.push("D6 Shasthamsa Placements:".to_string());
                for h in [1, 6, 8] {
                    if let Some(hdata) = d6.get(&format!("house_{h}")) {
                        let sign = hdata.get("sign").and_then(|v| v.as_str()).unwrap_or("?");
                        let planets = hdata.get("planets").and_then(|v| v.as_array());
                        let planets_str = planets.map(|arr| arr.iter().filter_map(|x| x.as_str()).collect::<Vec<_>>().join(", ")).unwrap_or_default();
                        lines.push(format!(
                            "  - D6 House {h} ({sign}) contains: [{planets_str}]"
                        ));
                    }
                }
            }

            append_filtered_doshas_json(chart, &mut lines, &["pitru", "guru_chandala", "ghata", "shrapit", "kala_sarpa"]);
            append_filtered_yogas_json(chart, &mut lines, &["Kemadruma"]);
            append_relevant_aspects_json(chart, &mut lines, "health");
        }
        "wealth" => {
            lines.push("Primary Wealth Placements:".to_string());
            append_house_detail_json(chart, &mut lines, 1);
            append_house_detail_json(chart, &mut lines, 2);
            append_house_detail_json(chart, &mut lines, 11);
            append_house_detail_json(chart, &mut lines, 9);

            append_planet_detail_json(chart, &mut lines, "Jupiter");
            append_planet_detail_json(chart, &mut lines, "Venus");

            if let Some(jaimini) = chart.get("jaimini") {
                let al_sign = jaimini.pointer("/arudha_lagna/sign").and_then(|v| v.as_str()).unwrap_or("?");
                let al_house = jaimini.pointer("/arudha_lagna/house").and_then(|v| v.as_u64()).unwrap_or(1);
                lines.push(format!(
                    "Arudha Lagna (AL - Public Status/Manifestation): {al_sign} in House {al_house}"
                ));
            }

            if let Some(d2) = chart.pointer("/divisional_charts/D2").and_then(|v| v.as_object()) {
                lines.push("D2 Hora (Wealth distribution) Placements:".to_string());
                for h in [1, 2, 11] {
                    if let Some(hdata) = d2.get(&format!("house_{h}")) {
                        let sign = hdata.get("sign").and_then(|v| v.as_str()).unwrap_or("?");
                        let planets = hdata.get("planets").and_then(|v| v.as_array());
                        let planets_str = planets.map(|arr| arr.iter().filter_map(|x| x.as_str()).collect::<Vec<_>>().join(", ")).unwrap_or_default();
                        lines.push(format!(
                            "  - D2 House {h} ({sign}) contains: [{planets_str}]"
                        ));
                    }
                }
            }

            append_filtered_yogas_json(chart, &mut lines, &["Gaja Kesari", "Chandra Mangal", "Durudhara", "Sunapha", "Anapha", "Adhi", "Amala"]);
            append_relevant_aspects_json(chart, &mut lines, "wealth");
        }
        "education" => {
            lines.push("Primary Education Placements:".to_string());
            append_house_detail_json(chart, &mut lines, 1);
            append_house_detail_json(chart, &mut lines, 4);
            append_house_detail_json(chart, &mut lines, 5);

            append_planet_detail_json(chart, &mut lines, "Mercury");
            append_planet_detail_json(chart, &mut lines, "Jupiter");

            if let Some(d24) = chart.pointer("/divisional_charts/D24").and_then(|v| v.as_object()) {
                lines.push("D24 Siddhamsa (Academic achievements) Placements:".to_string());
                for h in [1, 4, 5] {
                    if let Some(hdata) = d24.get(&format!("house_{h}")) {
                        let sign = hdata.get("sign").and_then(|v| v.as_str()).unwrap_or("?");
                        let planets = hdata.get("planets").and_then(|v| v.as_array());
                        let planets_str = planets.map(|arr| arr.iter().filter_map(|x| x.as_str()).collect::<Vec<_>>().join(", ")).unwrap_or_default();
                        lines.push(format!(
                            "  - D24 House {h} ({sign}) contains: [{planets_str}]"
                        ));
                    }
                }
            }

            append_filtered_yogas_json(chart, &mut lines, &["Budhaditya", "Gaja Kesari", "Nala"]);
            append_relevant_aspects_json(chart, &mut lines, "education");
        }
        _ => {
            return render_prompt_context_json(chart);
        }
    }

    // Append Sade Sati details
    if let Some(ss) = chart.get("sade_sati") {
        let is_active = ss.get("is_active").and_then(|v| v.as_bool()).unwrap_or(false);
        if is_active {
            let phase = ss.get("phase").and_then(|v| v.as_str()).unwrap_or("?");
            let desc = ss.get("description").and_then(|v| v.as_str()).unwrap_or("");
            lines.push(format!(
                "Active Saturn Transit (Sade Sati): Currently in {phase}. Astrological influence: {desc}"
            ));
        } else {
            lines.push("Active Saturn Transit (Sade Sati): None active currently.".to_string());
        }
    }

    // Append key Vaisheshikamsa counts (Saptavarga counts of core planets)
    if let Some(v_counts) = chart.get("vaisheshikamsa").and_then(|v| v.as_object()) {
        let mut v_lines = Vec::new();
        for (planet, data) in v_counts {
            if ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"].contains(&planet.as_str()) {
                let count = data.get("saptavarga_count").and_then(|v| v.as_u64()).unwrap_or(0);
                let grade = data.get("saptavarga_grade").and_then(|v| v.as_str()).unwrap_or("None");
                if count >= 2 {
                    v_lines.push(format!("{planet}: {count}/7 ({grade})"));
                }
            }
        }
        if !v_lines.is_empty() {
            lines.push(format!("Planetary Dignity Strengths (Vaisheshikamsa Saptavarga): {}", v_lines.join(", ")));
        }
    }

    if let Some(timeline) = chart.get("vimshottari_timeline").and_then(|v| v.as_array()) {

        if let Some(current) = timeline.first() {
            let lord = current.get("lord").and_then(|v| v.as_str()).unwrap_or("?");
            let start = current.get("start").and_then(|v| v.as_str()).unwrap_or("?");
            let end = current.get("end").and_then(|v| v.as_str()).unwrap_or("?");
            lines.push(format!(
                "Current Vimshottari Mahadasha: {lord} from {start} to {end}."
            ));
            if let Some(antar) = current.get("antardashas").and_then(|v| v.as_array()).and_then(|arr| arr.first()) {
                let a_lord = antar.get("lord").and_then(|v| v.as_str()).unwrap_or("?");
                let a_start = antar.get("start").and_then(|v| v.as_str()).unwrap_or("?");
                let a_end = antar.get("end").and_then(|v| v.as_str()).unwrap_or("?");
                lines.push(format!(
                    "Current Antardasha: {a_lord} from {a_start} to {a_end}."
                ));
            }
        }
    }

    lines.join("\n")
}

fn render_prompt_context_json(chart: &serde_json::Value) -> String {
    let mut lines = Vec::new();
    
    let profile = chart.get("profile");
    let ayanamsa = profile.and_then(|p| p.get("ayanamsa")).and_then(|v| v.as_str()).unwrap_or("Lahiri");
    let nodes = profile.and_then(|p| p.get("node_type")).and_then(|v| v.as_str()).unwrap_or("Mean");
    let houses = profile.and_then(|p| p.get("house_system")).and_then(|v| v.as_str()).unwrap_or("WholeSign");
    let dasha_year = profile.and_then(|p| p.get("dasha_year")).and_then(|v| v.as_str()).unwrap_or("Sidereal365.256363004");
    
    lines.push(format!(
        "Calculation profile: ayanamsa={}, nodes={}, houses={}, dasha_year={}",
        ayanamsa, nodes, houses, dasha_year
    ));
    
    let asc_sign = chart.pointer("/ascendant/sign").and_then(|v| v.as_str()).unwrap_or("?");
    let asc_degree = chart.pointer("/ascendant/degree").and_then(|v| v.as_f64()).unwrap_or(0.0);
    lines.push(format!(
        "Ascendant: {} {:.2} degrees.",
        asc_sign, asc_degree
    ));
    
    let moon_sign = chart.pointer("/moon_intelligence/sign").and_then(|v| v.as_str()).unwrap_or("?");
    let moon_nak = chart.pointer("/moon_intelligence/nakshatra").and_then(|v| v.as_str()).unwrap_or("?");
    let moon_pada = chart.pointer("/moon_intelligence/pada").and_then(|v| v.as_u64()).unwrap_or(1);
    let moon_strength = chart.pointer("/moon_intelligence/strength").and_then(|v| v.as_str()).unwrap_or("?");
    lines.push(format!(
        "Moon: {} nakshatra {} pada {}, dignity {}.",
        moon_sign, moon_nak, moon_pada, moon_strength
    ));
    
    let vara = chart.pointer("/panchanga/vara").and_then(|v| v.as_str()).unwrap_or("?");
    let tithi = chart.pointer("/panchanga/tithi/name").and_then(|v| v.as_str()).unwrap_or("?");
    let nakshatra = chart.pointer("/panchanga/nakshatra/name").and_then(|v| v.as_str()).unwrap_or("?");
    let yoga = chart.pointer("/panchanga/yoga/name").and_then(|v| v.as_str()).unwrap_or("?");
    let karana = chart.pointer("/panchanga/karana/name").and_then(|v| v.as_str()).unwrap_or("?");
    let paksha = chart.pointer("/panchanga/paksha").and_then(|v| v.as_str()).unwrap_or("?");
    lines.push(format!(
        "Panchanga: vara {}, tithi {}, nakshatra {}, yoga {}, karana {}, paksha {}.",
        vara, tithi, nakshatra, yoga, karana, paksha
    ));

    lines.push("Planetary positions:".to_string());
    if let Some(table) = chart.get("planetary_table").and_then(|v| v.as_array()) {
        for p in table {
            let name = p.get("name").and_then(|v| v.as_str()).unwrap_or("?");
            let sign = p.get("sign").and_then(|v| v.as_str()).unwrap_or("?");
            let house = p.get("house").and_then(|v| v.as_u64()).unwrap_or(1);
            let dignity = p.get("dignity").and_then(|v| v.as_str()).unwrap_or("?");
            let nakshatra = p.get("nakshatra").and_then(|v| v.as_str()).unwrap_or("?");
            let pada = p.get("pada").and_then(|v| v.as_u64()).unwrap_or(1);
            let navamsa_sign = p.get("navamsa_sign").and_then(|v| v.as_str()).unwrap_or("?");
            let retrograde = p.get("retrograde").and_then(|v| v.as_bool()).unwrap_or(false);
            let combust = p.get("combust").and_then(|v| v.as_bool()).unwrap_or(false);
            
            let mut flags = Vec::new();
            if retrograde { flags.push("retrograde"); }
            if combust { flags.push("combust"); }
            let flag_text = if flags.is_empty() { String::new() } else { format!(" [{}]", flags.join(", ")) };
            lines.push(format!(
                "- {name}: {sign} house {house}, {dignity}, nakshatra {nakshatra} pada {pada}, navamsa {navamsa_sign}{flag_text}."
            ));
        }
    }

    if let Some(yogas) = chart.get("yogas").and_then(|v| v.as_array()) {
        if yogas.is_empty() {
            lines.push("Yogas detected: none from implemented rule set.".to_string());
        } else {
            lines.push("Yogas detected:".to_string());
            for y in yogas {
                let name = y.get("name").and_then(|v| v.as_str()).unwrap_or("");
                let description = y.get("description").and_then(|v| v.as_str()).unwrap_or("");
                lines.push(format!("- {name}: {description}"));
            }
        }
    }


    if let Some(timeline) = chart.get("vimshottari_timeline").and_then(|v| v.as_array()) {
        if let Some(current) = timeline.first() {
            let lord = current.get("lord").and_then(|v| v.as_str()).unwrap_or("?");
            let start = current.get("start").and_then(|v| v.as_str()).unwrap_or("?");
            let end = current.get("end").and_then(|v| v.as_str()).unwrap_or("?");
            lines.push(format!(
                "Current Vimshottari Mahadasha: {lord} from {start} to {end}."
            ));
            if let Some(antar) = current.get("antardashas").and_then(|v| v.as_array()).and_then(|arr| arr.first()) {
                let a_lord = antar.get("lord").and_then(|v| v.as_str()).unwrap_or("?");
                let a_start = antar.get("start").and_then(|v| v.as_str()).unwrap_or("?");
                let a_end = antar.get("end").and_then(|v| v.as_str()).unwrap_or("?");
                lines.push(format!(
                    "Current Antardasha: {a_lord} from {a_start} to {a_end}."
                ));
            }
        }
    }

    lines.join("\n")
}

// ─── JSON Helper Formatter Details ───────────────────────────────────────────

fn append_relevant_aspects_json(chart: &serde_json::Value, lines: &mut Vec<String>, topic: &str) {
    if let Some(aspects) = chart.get("aspects") {
        let mut aspect_lines = Vec::new();
        if let Some(graha) = aspects.get("graha_drishti").and_then(|v| v.as_object()) {
            for (planet, p_aspects) in graha {
                if let Some(houses) = p_aspects.get("aspected_houses").and_then(|v| v.as_array()) {
                    let target_houses = match topic {
                        "career" => vec![1, 10],
                        "relationship" => vec![1, 7],
                        "health" => vec![1, 6, 8],
                        "wealth" => vec![1, 2, 11],
                        "education" => vec![1, 4, 5],
                        _ => vec![],
                    };
                    for h_val in houses {
                        if let Some(h) = h_val.as_u64() {
                            if target_houses.contains(&(h as usize)) {
                                aspect_lines.push(format!("  - Planet {} casts Graha aspect on House {}", planet, h));
                            }
                        }
                    }
                }
            }
        }
        if !aspect_lines.is_empty() {
            lines.push("Relevant Aspects (Drishti) Casting on Key Houses:".to_string());
            lines.extend(aspect_lines);
        }
    }
}

fn append_house_detail_json(chart: &serde_json::Value, lines: &mut Vec<String>, house_num: u8) {
    let key = format!("house_{house_num}");
    if let Some(hdata) = chart.pointer(&format!("/chart_data/{key}")) {
        let sign = hdata.get("sign").and_then(|v| v.as_str()).unwrap_or("?");
        let mut planet_names = Vec::new();
        if let Some(planets) = hdata.get("planets").and_then(|v| v.as_array()) {
            for p in planets {
                let name = p.get("name").and_then(|v| v.as_str()).unwrap_or("?");
                let strength = p.get("strength").and_then(|v| v.as_str()).unwrap_or("?");
                let retrograde = p.get("retrograde").and_then(|v| v.as_bool()).unwrap_or(false);
                let combust = p.get("combust").and_then(|v| v.as_bool()).unwrap_or(false);
                
                let mut flags = Vec::new();
                if retrograde { flags.push("R"); }
                if combust { flags.push("C"); }
                let flag_str = if flags.is_empty() { String::new() } else { format!(" [{}]", flags.join(",")) };
                planet_names.push(format!("{name}{flag_str} ({strength})"));
            }
        }
        let planets_str = if planet_names.is_empty() { "Empty".to_string() } else { planet_names.join(", ") };
        lines.push(format!("  - House {house_num} ({sign}): {planets_str}"));
    }
}

fn append_planet_detail_json(chart: &serde_json::Value, lines: &mut Vec<String>, planet_name: &str) {
    if let Some(table) = chart.get("planetary_table").and_then(|v| v.as_array()) {
        if let Some(p) = table.iter().find(|pl| pl.get("name").and_then(|v| v.as_str()) == Some(planet_name)) {
            let name = p.get("name").and_then(|v| v.as_str()).unwrap_or("?");
            let sign = p.get("sign").and_then(|v| v.as_str()).unwrap_or("?");
            let house = p.get("house").and_then(|v| v.as_u64()).unwrap_or(1);
            let dignity = p.get("dignity").and_then(|v| v.as_str()).unwrap_or("?");
            let nakshatra = p.get("nakshatra").and_then(|v| v.as_str()).unwrap_or("?");
            let pada = p.get("pada").and_then(|v| v.as_u64()).unwrap_or(1);
            let navamsa_sign = p.get("navamsa_sign").and_then(|v| v.as_str()).unwrap_or("?");
            let retrograde = p.get("retrograde").and_then(|v| v.as_bool()).unwrap_or(false);
            let combust = p.get("combust").and_then(|v| v.as_bool()).unwrap_or(false);
            
            let mut flags = Vec::new();
            if retrograde { flags.push("Retrograde"); }
            if combust { flags.push("Combust"); }
            let flag_str = if flags.is_empty() { String::new() } else { format!(" [{}]", flags.join(", ")) };
            
            lines.push(format!(
                "  - {name} occupies {sign} Sign, House {house}, Nakshatra {nakshatra} Pada {pada} (Strength: {dignity}, Navamsa Sign: {navamsa_sign}){flag_str}."
            ));
        }
    }
}

fn append_filtered_yogas_json(chart: &serde_json::Value, lines: &mut Vec<String>, patterns: &[&str]) {
    let mut matching = Vec::new();
    if let Some(yogas) = chart.get("yogas").and_then(|v| v.as_array()) {
        for y in yogas {
            let name = y.get("name").and_then(|v| v.as_str()).unwrap_or("");
            let description = y.get("description").and_then(|v| v.as_str()).unwrap_or("");
            if patterns.iter().any(|&p| name.to_lowercase().contains(&p.to_lowercase())) {
                matching.push(format!("  - {name}: {description}"));
            }
        }
    }
    if !matching.is_empty() {
        lines.push("Relevant Yogas Detected:".to_string());
        lines.extend(matching);
    }
}

fn append_filtered_doshas_json(chart: &serde_json::Value, lines: &mut Vec<String>, patterns: &[&str]) {
    let mut matching = Vec::new();
    if let Some(doshas) = chart.get("doshas") {
        if patterns.contains(&"manglik") {
            if doshas.pointer("/manglik_lagna/has_dosha").and_then(|v| v.as_bool()).unwrap_or(false) { matching.push("  - Manglik Dosha from Lagna is active".to_string()); }
            if doshas.pointer("/manglik_moon/has_dosha").and_then(|v| v.as_bool()).unwrap_or(false) { matching.push("  - Manglik Dosha from Moon is active".to_string()); }
            if doshas.pointer("/manglik_venus/has_dosha").and_then(|v| v.as_bool()).unwrap_or(false) { matching.push("  - Manglik Dosha from Venus is active".to_string()); }
        }
        if patterns.contains(&"kalathra") {
            let kl = doshas.get("kalathra_lagna").and_then(|v| v.as_bool()).unwrap_or(false);
            let km = doshas.get("kalathra_moon").and_then(|v| v.as_bool()).unwrap_or(false);
            if kl || km {
                matching.push("  - Kalathra Dosha (relationship affliction) is active".to_string());
            }
        }
        if patterns.contains(&"ganda_moola") {
            if doshas.pointer("/ganda_moola/has_dosha").and_then(|v| v.as_bool()).unwrap_or(false) {
                let name = doshas.pointer("/ganda_moola/nakshatra_name").and_then(|v| v.as_str()).unwrap_or("");
                matching.push(format!("  - Ganda Moola Dosha (Moon in Ketu/Mercury Nakshatra: {name})"));
            }
        }
        if patterns.contains(&"pitru") {
            if doshas.pointer("/pitru/has_dosha").and_then(|v| v.as_bool()).unwrap_or(false) {
                matching.push("  - Pitru Dosha (ancestral karmic block) is active".to_string());
            }
        }
        if patterns.contains(&"guru_chandala") {
            if doshas.pointer("/guru_chandala/has_dosha").and_then(|v| v.as_bool()).unwrap_or(false) {
                matching.push("  - Guru Chandala Dosha (Jupiter conjoined Rahu/Ketu) is active".to_string());
            }
        }
        if patterns.contains(&"kala_sarpa") {
            if doshas.pointer("/kala_sarpa/has_dosha").and_then(|v| v.as_bool()).unwrap_or(false) {
                matching.push("  - Kala Sarpa Dosha (hemmed planets axis) is active".to_string());
            }
        }
        if patterns.contains(&"ghata") {
            if doshas.get("ghata").and_then(|v| v.as_bool()).unwrap_or(false) {
                matching.push("  - Ghata Dosha (Mars-Saturn affliction) is active".to_string());
            }
        }
        if patterns.contains(&"shrapit") {
            if doshas.get("shrapit").and_then(|v| v.as_bool()).unwrap_or(false) {
                matching.push("  - Shrapit Dosha (Saturn-Rahu affliction) is active".to_string());
            }
        }
    }
    if !matching.is_empty() {
        lines.push("Relevant Afflictions/Doshas Detected:".to_string());
        lines.extend(matching);
    }
}

// ─── Format Detail Helpers ───────────────────────────────────────────────────

fn append_house_detail(chart: &ChartResponse, lines: &mut Vec<String>, house_num: u8) {
    let key = format!("house_{house_num}");
    if let Some(hdata) = chart.chart_data.get(&key) {
        let mut planet_names = Vec::new();
        for p in &hdata.planets {
            let mut flags = Vec::new();
            if p.retrograde { flags.push("R"); }
            if p.combust { flags.push("C"); }
            let flag_str = if flags.is_empty() { String::new() } else { format!(" [{}]", flags.join(",")) };
            planet_names.push(format!("{}{} ({})", p.name, flag_str, p.strength));
        }
        let planets_str = if planet_names.is_empty() { "Empty".to_string() } else { planet_names.join(", ") };
        lines.push(format!("  - House {house_num} ({}): {}", hdata.sign, planets_str));
    }
}

fn append_planet_detail(chart: &ChartResponse, lines: &mut Vec<String>, planet_name: &str) {
    if let Some(p) = chart.planetary_table.iter().find(|pl| pl.name == planet_name) {
        let mut flags = Vec::new();
        if p.retrograde { flags.push("Retrograde"); }
        if p.combust { flags.push("Combust"); }
        let flag_str = if flags.is_empty() { String::new() } else { format!(" [{}]", flags.join(", ")) };
        lines.push(format!(
            "  - {} occupies {} Sign, House {}, Nakshatra {} Pada {} (Strength: {}, Navamsa Sign: {}){}.",
            p.name, p.sign, p.house, p.nakshatra, p.pada, p.dignity, p.navamsa_sign, flag_str
        ));
    }
}

fn append_filtered_yogas(chart: &ChartResponse, lines: &mut Vec<String>, patterns: &[&str]) {
    let mut matching = Vec::new();
    for y in &chart.yogas {
        if patterns.iter().any(|&p| y.name.to_lowercase().contains(&p.to_lowercase())) {
            matching.push(format!("  - {}: {}", y.name, y.description));
        }
    }
    if !matching.is_empty() {
        lines.push("Relevant Yogas Detected:".to_string());
        lines.extend(matching);
    }
}

fn append_filtered_doshas(chart: &ChartResponse, lines: &mut Vec<String>, patterns: &[&str]) {
    let mut matching = Vec::new();
    if let Some(doshas) = &chart.doshas {
        if patterns.contains(&"manglik") {
            if doshas.manglik_lagna.has_dosha { matching.push("  - Manglik Dosha from Lagna is active".to_string()); }
            if doshas.manglik_moon.has_dosha { matching.push("  - Manglik Dosha from Moon is active".to_string()); }
            if doshas.manglik_venus.has_dosha { matching.push("  - Manglik Dosha from Venus is active".to_string()); }
        }
        if patterns.contains(&"kalathra") && (doshas.kalathra_lagna || doshas.kalathra_moon) {
            matching.push("  - Kalathra Dosha (relationship affliction) is active".to_string());
        }
        if patterns.contains(&"ganda_moola") && doshas.ganda_moola.has_dosha {
            matching.push(format!("  - Ganda Moola Dosha (Moon in Ketu/Mercury Nakshatra: {})", doshas.ganda_moola.nakshatra_name.as_deref().unwrap_or("")));
        }
        if patterns.contains(&"pitru") && doshas.pitru.has_dosha {
            matching.push("  - Pitru Dosha (ancestral karmic block) is active".to_string());
        }
        if patterns.contains(&"guru_chandala") && doshas.guru_chandala.has_dosha {
            matching.push("  - Guru Chandala Dosha (Jupiter conjoined Rahu/Ketu) is active".to_string());
        }
        if patterns.contains(&"kala_sarpa") && doshas.kala_sarpa.has_dosha {
            matching.push("  - Kala Sarpa Dosha (hemmed planets axis) is active".to_string());
        }
        if patterns.contains(&"ghata") && doshas.ghata {
            matching.push("  - Ghata Dosha (Mars-Saturn affliction) is active".to_string());
        }
        if patterns.contains(&"shrapit") && doshas.shrapit {
            matching.push("  - Shrapit Dosha (Saturn-Rahu affliction) is active".to_string());
        }
    }
    if !matching.is_empty() {
        lines.push("Relevant Afflictions/Doshas Detected:".to_string());
        lines.extend(matching);
    }
}

// ─── Default Complete Context Builder ────────────────────────────────────────

fn render_prompt_context(chart: &ChartResponse) -> String {
    let mut lines = Vec::new();
    lines.push(format!(
        "Calculation profile: ayanamsa={}, nodes={}, houses={}, dasha_year={}",
        chart.profile.ayanamsa,
        chart.profile.node_type,
        chart.profile.house_system,
        chart.profile.dasha_year
    ));
    lines.push(format!(
        "Ascendant: {} {:.2} degrees.",
        chart.ascendant.sign, chart.ascendant.degree
    ));
    lines.push(format!(
        "Moon: {} nakshatra {} pada {}, dignity {}.",
        chart.moon_intelligence.sign,
        chart.moon_intelligence.nakshatra,
        chart.moon_intelligence.pada,
        chart.moon_intelligence.strength
    ));
    lines.push(format!(
        "Panchanga: vara {}, tithi {}, nakshatra {}, yoga {}, karana {}, paksha {}.",
        chart.panchanga.vara,
        chart.panchanga.tithi.name,
        chart.panchanga.nakshatra.name,
        chart.panchanga.yoga.name,
        chart.panchanga.karana.name,
        chart.panchanga.paksha
    ));

    lines.push("Planetary positions:".to_string());
    for planet in &chart.planetary_table {
        let mut flags = Vec::new();
        if planet.retrograde {
            flags.push("retrograde");
        }
        if planet.combust {
            flags.push("combust");
        }
        let flag_text = if flags.is_empty() {
            String::new()
        } else {
            format!(" [{}]", flags.join(", "))
        };
        lines.push(format!(
            "- {}: {} house {}, {}, nakshatra {} pada {}, navamsa {}{}.",
            planet.name,
            planet.sign,
            planet.house,
            planet.dignity,
            planet.nakshatra,
            planet.pada,
            planet.navamsa_sign,
            flag_text
        ));
    }

    if chart.yogas.is_empty() {
        lines.push("Yogas detected: none from implemented rule set.".to_string());
    } else {
        lines.push("Yogas detected:".to_string());
        for yoga in &chart.yogas {
            lines.push(format!("- {}: {}", yoga.name, yoga.description));
        }
    }

    if let Some(current) = chart.vimshottari_timeline.first() {
        lines.push(format!(
            "Current/first Vimshottari mahadasha in response: {} from {} to {}.",
            current.lord, current.start, current.end
        ));
        if let Some(antar) = current.antardashas.first() {
            lines.push(format!(
                "First antardasha: {} from {} to {}.",
                antar.lord, antar.start, antar.end
            ));
        }
    }

    lines.join("\n")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_topic_from_question() {
        assert_eq!(detect_topic_from_question("Will I get a promotion soon or change job?"), "career");
        assert_eq!(detect_topic_from_question("Is marriage on the cards this year?"), "relationship");
        assert_eq!(detect_topic_from_question("How will my health be next month?"), "health");
        assert_eq!(detect_topic_from_question("Will I win a lottery or gain money?"), "wealth");
        assert_eq!(detect_topic_from_question("Can I clear my university exams?"), "education");
        assert_eq!(detect_topic_from_question("Who am I in terms of spirituality?"), "general");
    }

    #[test]
    fn test_render_topic_prompt_context_json_fallback() {
        let chart = serde_json::json!({
            "profile": {
                "ayanamsa": "Lahiri",
                "node_type": "Mean",
                "house_system": "WholeSign",
                "dasha_year": "Sidereal365.256363004"
            },
            "ascendant": {
                "sign": "Scorpio",
                "degree": 15.5
            },
            "moon_intelligence": {
                "sign": "Aries",
                "nakshatra": "Ashwini",
                "pada": 1,
                "strength": "Neutral"
            },
            "panchanga": {
                "vara": "Wednesday",
                "tithi": { "name": "Prathama", "index": 1, "progress": 50.0 },
                "nakshatra": { "name": "Ashwini", "index": 1, "progress": 25.0 },
                "yoga": { "name": "Vishkumbha", "index": 1, "progress": 10.0 },
                "karana": { "name": "Bava", "index": 1, "progress": 30.0 },
                "paksha": "Shukla"
            },
            "planetary_table": [],
            "yogas": [],
            "vimshottari_timeline": []
        });

        let context = render_topic_prompt_context_json(&chart, "general");
        assert!(context.contains("Ascendant: Scorpio"));
        assert!(context.contains("Panchanga: vara Wednesday"));
    }
}

