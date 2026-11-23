//! Classical Vedic Shastra Rule Taxonomy & Electional Axioms
//!
//! Encapsulates categorized rules from classical Sanskrit authorities:
//! - Brihat Parashara Hora Shastra (BPHS)
//! - Muhurtha Chintamani
//! - Phaladeepika
//! - Brihat Samhita
//! - Dr. B.V. Raman's Electional Astrology & 300 Important Combinations
//!
//! Attribution & Reference Note:
//! Structured event taxonomy patterns in this module are inspired by and adapted from
//! the open-source VedAstro project (https://github.com/VedAstro/VedAstro), licensed under the MIT License:
//! Copyright (c) 2014–2022 VedAstro @ VedAstro.org
//! The underlying astrological principles originate in classical Sanskrit Jyotish treatises.
//!
//! Categories:
//! - Travel (Journeys, Relocations, Foreign Voyages)
//! - Business (Commerce, Buying & Selling, Trade, Agreements)
//! - Marriage (Vivaaha Muhurtha, Conjugal Affinity)
//! - Health (Ayurvedic Vitality, Surgical Windows, Healing)
//! - Career (Vocation, Authority, Royal Distinction, Status)
//! - Wealth (Dhana, Assets, Accumulation, Ashtakavarga Bindus)
//! - Property (Building Construction, Shilanyas, Land Acquisition)

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClassicalRule {
    pub name: &'static str,
    pub source: &'static str, // "Muhurtha Chintamani", "BPHS", "Phaladeepika", "B.V. Raman"
    pub category: &'static str,
    pub nature: &'static str, // "Good", "Bad", "Neutral"
    pub condition: &'static str,
    pub description: &'static str,
}

pub static CLASSICAL_SHASTRA_RULES: &[ClassicalRule] = &[
    // ─── TRAVEL (YATRA MUHURTHA) ─────────────────────────────────────────────
    ClassicalRule {
        name: "ShubhaTithiYatra",
        source: "Muhurtha Chintamani",
        category: "travel",
        nature: "Good",
        condition: "Tithi is 2nd (Dwitiya), 3rd (Tritiya), 5th (Panchami), 7th (Saptami), 10th (Dashami), 11th (Ekadashi), or 13th (Trayodashi).",
        description: "Supreme lunar days for commencing journeys or overseas relocations; ensures auspicious passage, objective fulfillment, and safe return.",
    },
    ClassicalRule {
        name: "VarjyaTithiYatra",
        source: "Muhurtha Chintamani",
        category: "travel",
        nature: "Bad",
        condition: "Tithi is 1st (Amavasya), 14th (Chaturdashi), 15th (Purnima), or Rikta tithis (4th, 9th, 14th).",
        description: "Classical texts proscribe departure on 14th tithi, Amavasya, or Purnima due to intense atmospheric fluctuations and unforeseen delays.",
    },
    ClassicalRule {
        name: "ShubhaNakshatraYatra",
        source: "B.V. Raman / Muhurtha Chintamani",
        category: "travel",
        nature: "Good",
        condition: "Moon resides in Mrigashira, Ashwini, Pushya, Punarvasu, Hasta, Anuradha, Shravana, Dhanishta, or Revati.",
        description: "Journeys begun under these auspicious stars ensure rapid, safe, and triumphant completion of mission, especially in the 2nd, 3rd, or 4th quarters.",
    },
    ClassicalRule {
        name: "UgraNakshatraYatraVarjya",
        source: "Muhurtha Chintamani",
        category: "travel",
        nature: "Bad",
        condition: "Moon resides in Bharani, Krittika, Ashlesha, Vishakha, Purva Phalguni, Purva Bhadrapada, or Ardra.",
        description: "Bharani and Krittika must be strictly avoided for departure. Other fierce stars cause exhaustion, vehicle trouble, or disputes during passage.",
    },
    ClassicalRule {
        name: "DishaShoolaEast",
        source: "Brihat Samhita",
        category: "travel",
        nature: "Neutral",
        condition: "Commencing travel towards East on Monday or Saturday.",
        description: "Directional Shoola (Disha Shoola) is active towards the East on Monday and Saturday. If departure is unavoidable, depart after 8 ghatis (~3.2 hours after sunrise) or consume milk/sesame before journey.",
    },
    ClassicalRule {
        name: "DishaShoolaWest",
        source: "Brihat Samhita",
        category: "travel",
        nature: "Neutral",
        condition: "Commencing travel towards West on Sunday or Friday.",
        description: "Directional Shoola is active towards the West on Sunday and Friday. Commencing west travel on these days produces unnecessary expenditures or delays.",
    },
    ClassicalRule {
        name: "DishaShoolaNorth",
        source: "Brihat Samhita",
        category: "travel",
        nature: "Neutral",
        condition: "Commencing travel towards North on Tuesday or Wednesday.",
        description: "Directional Shoola is active towards the North on Tuesday and Wednesday. Guard against misdirection or lost belongings.",
    },
    ClassicalRule {
        name: "DishaShoolaSouth",
        source: "Brihat Samhita",
        category: "travel",
        nature: "Neutral",
        condition: "Commencing travel towards South on Thursday.",
        description: "Directional Shoola is active towards the South on Thursday (Yama's quarter). Postpone south journeys or begin with curd/ghee intake.",
    },

    // ─── BUSINESS & COMMERCE (VANIJYA MUHURTHA) ──────────────────────────────
    ClassicalRule {
        name: "ShubhaVanijyaYoga",
        source: "Muhurtha Chintamani",
        category: "business",
        nature: "Good",
        condition: "Moon in Taurus, Cancer, or Pisces, free from Mars conjunction/aspect, with Mercury in Kendra or well-aspected by Jupiter.",
        description: "Paramount alignment for commercial enterprise, trade, selling merchandise, and signing commercial contracts for maximized profit margins.",
    },
    ClassicalRule {
        name: "ShubhaVaraVanijya",
        source: "B.V. Raman",
        category: "business",
        nature: "Good",
        condition: "Action initiated on Wednesday (Mercury - commerce), Thursday (Jupiter - expansion), or Friday (Venus - material wealth).",
        description: "Mercury, Jupiter, and Venus week days stimulate honest financial inflow, customer goodwill, and sustained business growth.",
    },
    ClassicalRule {
        name: "RiktaTithiVanijyaVarjya",
        source: "Muhurtha Chintamani",
        category: "business",
        nature: "Bad",
        condition: "Initiating commercial ventures or agreements on 4th (Chaturthi), 9th (Navami), or 14th (Chaturdashi) lunar days.",
        description: "Rikta (empty) tithis lead to disputes, delayed receivables, non-completion of trades, and cash flow blockages.",
    },
    ClassicalRule {
        name: "ShubhaNakshatraVanijya",
        source: "Muhurtha Chintamani",
        category: "business",
        nature: "Good",
        condition: "Moon in Ashwini, Rohini, Pushya, Hasta, Chitra, Anuradha, Shravana, or Revati.",
        description: "Laghva (swift) and Chara (movable) asterisms stimulate rapid market turnover, consumer appeal, and smooth inventory liquidation.",
    },

    // ─── MARRIAGE & RELATIONSHIPS (VIVAAHA MUHURTHA) ─────────────────────────
    ClassicalRule {
        name: "GuruShukraAsthaVarjya",
        source: "Muhurtha Chintamani",
        category: "marriage",
        nature: "Bad",
        condition: "Venus (Shukra) or Jupiter (Guru) is combust (Astha) by proximity to the Sun.",
        description: "Classical shastras mandate postponing matrimonial ceremonies when Shukra or Guru is combust, as divine grace and marital bliss require fortified karakas.",
    },
    ClassicalRule {
        name: "ShubhaVivaahaNakshatra",
        source: "Muhurtha Chintamani",
        category: "marriage",
        nature: "Good",
        condition: "Moon in Rohini, Mrigashira, Magha, Uttara Phalguni, Hasta, Swati, Anuradha, Mula, Uttara Ashadha, Uttara Bhadrapada, or Revati.",
        description: "Bestows mutual emotional devotion, enduring conjugal affinity, prosperity for the household, and healthy progeny.",
    },
    ClassicalRule {
        name: "VishtiKaranaVivaahaVarjya",
        source: "Muhurtha Chintamani",
        category: "marriage",
        nature: "Bad",
        condition: "Marriage muhurtha falls within Vishti (Bhadra) Karana.",
        description: "Bhadra Karana carries an obstructive vibration; strictly avoided for solemn unions, vows, and griha pravesha.",
    },
    ClassicalRule {
        name: "ShubhaTithiVivaaha",
        source: "Muhurtha Chintamani",
        category: "marriage",
        nature: "Good",
        condition: "Tithi is 2nd, 3rd, 5th, 7th, 10th, 11th, 12th, or 13th.",
        description: "Brings auspicious expansion, family harmony, emotional peace, and long-lasting mutual respect between partners.",
    },

    // ─── HEALTH & MEDICAL (CHIKITSA MUHURTHA) ────────────────────────────────
    ClassicalRule {
        name: "ChikitsaArambhaShubha",
        source: "Sushruta Samhita / Muhurtha Chintamani",
        category: "health",
        nature: "Good",
        condition: "Moon waning or in mild nakshatras (Ashwini, Hasta, Pushya, Anuradha), avoiding Tuesday and Saturday.",
        description: "Ashwini (presided by the celestial healers Ashwini Kumaras) accelerates cellular recovery, post-operative healing, and diagnostic precision.",
    },
    ClassicalRule {
        name: "ShastraKarmaPurnimaVarjya",
        source: "B.V. Raman / Sushruta Samhita",
        category: "health",
        nature: "Bad",
        condition: "Surgical interventions scheduled on Purnima (Full Moon) or Amavasya (New Moon).",
        description: "Tidal fluid shifts and heightened blood pressure under full lunar illumination increase hemorrhage and post-operative inflammation risks.",
    },
    ClassicalRule {
        name: "SuryaPeedaDehaBala",
        source: "BPHS",
        category: "health",
        nature: "Bad",
        condition: "Sun conjunct Saturn or Rahu, or in 6th/8th house with malefic aspect.",
        description: "Weakens the innate metabolic fire (Agni), cardiovascular vitality, and cellular immunity; requires proactive lifestyle moderation and clean hydration.",
    },

    // ─── CAREER & VOCATION (RAJAYOGA & KARMA) ────────────────────────────────
    ClassicalRule {
        name: "SuryaAshtakavargaPrabhava",
        source: "BPHS",
        category: "career",
        nature: "Good",
        condition: "Sun as ascendant or 10th lord occupies a sign having 5 or more bindus in Ashtakavarga.",
        description: "Bestows high civic distinction, administrative leadership, unwavering executive focus, and royal or corporate patronage.",
    },
    ClassicalRule {
        name: "DashameshaKendraTrikona",
        source: "Phaladeepika",
        category: "career",
        nature: "Good",
        condition: "10th lord resides in 1st, 4th, 5th, 7th, 9th, or 10th house in strong dignity.",
        description: "Guarantees enduring societal reputation, leadership over organizations, stability of tenure, and respect from peers and authorities.",
    },
    ClassicalRule {
        name: "AmatyakarakaBalavan",
        source: "Jaimini Sutras",
        category: "career",
        nature: "Good",
        condition: "Jaimini Amatyakaraka (AmK) is well-placed in D1 and D10 (Dasamsa).",
        description: "Promotes stellar vocational eminence, mastery over chosen technical or executive discipline, and high advisory rank.",
    },

    // ─── WEALTH & ASSETS (DHANA BHAVA) ───────────────────────────────────────
    ClassicalRule {
        name: "GuruAshtakavargaDhana",
        source: "BPHS",
        category: "wealth",
        nature: "Good",
        condition: "Jupiter occupies 2nd, 9th, or 11th house with 5 or more bindus.",
        description: "Fosters ethical, generational accumulation of landed assets, gold, investment yields, and righteous financial abundance.",
    },
    ClassicalRule {
        name: "DhaneshaLabheshaSambandha",
        source: "BPHS",
        category: "wealth",
        nature: "Good",
        condition: "Lords of 2nd (wealth) and 11th (gains) are in mutual conjunction, reception, or trinal aspect.",
        description: "Formulates a supreme Dhana Yoga, assuring steady streams of revenue, multiple asset portfolios, and financial resilience.",
    },

    // ─── PROPERTY & CONSTRUCTION (VASTU & GRIHA ARAMBHA) ─────────────────────
    ClassicalRule {
        name: "SthiraNakshatraGriharambha",
        source: "Muhurtha Chintamani",
        category: "property",
        nature: "Good",
        condition: "Moon in Sthira (Fixed) nakshatras: Rohini, Uttara Phalguni, Uttara Ashadha, or Uttara Bhadrapada.",
        description: "Imparts enduring structural permanence, foundational safety, domestic peace, and multi-generational prosperity to the estate.",
    },
    ClassicalRule {
        name: "KujaAshtamaGrihaVarjya",
        source: "B.V. Raman / Muhurtha Chintamani",
        category: "property",
        nature: "Bad",
        condition: "Mars or Saturn transiting the 8th house during foundation laying (Shilanyas).",
        description: "Inauspicious for structural commencement; causes construction delays, contractual friction, or structural vulnerabilities.",
    },
];

/// Returns all rules mapped to a specific canonical category.
pub fn get_rules_for_category(category: &str) -> Vec<&'static ClassicalRule> {
    let cat_lower = category.to_lowercase();
    let normalized = match cat_lower.as_str() {
        "travel" | "relocation" | "journey" => "travel",
        "business" | "commerce" | "trade" | "buyingselling" => "business",
        "relationship" | "relationships" | "marriage" => "marriage",
        "health" | "medical" | "wellness" => "health",
        "career" | "vocation" | "profession" => "career",
        "wealth" | "finance" | "assets" => "wealth",
        "property" | "building" | "construction" | "realestate" => "property",
        _ => "general",
    };

    if normalized == "general" {
        CLASSICAL_SHASTRA_RULES.iter().collect()
    } else {
        CLASSICAL_SHASTRA_RULES
            .iter()
            .filter(|r| r.category == normalized)
            .collect()
    }
}

/// Renders a cleanly formatted block of classical rules for injection into AI prompts.
pub fn render_category_rules_for_prompt(category: &str, limit: usize) -> String {
    let rules = get_rules_for_category(category);
    if rules.is_empty() {
        return String::new();
    }

    let mut out = String::new();
    out.push_str(&format!(
        "\nAuthentic Classical Shastra Axioms ({category}):\n"
    ));
    for rule in rules.iter().take(limit) {
        out.push_str(&format!(
            "  - [{}] ({}) Source: {} | Condition: {} -> Prognosis: {}\n",
            rule.name, rule.nature, rule.source, rule.condition, rule.description
        ));
    }
    out
}
