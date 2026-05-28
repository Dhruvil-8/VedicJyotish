use crate::models::{AiChartContext, AiSafety, ChartResponse};

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
