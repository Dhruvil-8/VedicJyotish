/**
 * AyurJyotish: Classical Vedic Medical Astrology & Ayurvedic Prakriti Engine
 *
 * Implements classical principles from:
 * - Brihat Parashara Hora Shastra (BPHS, Ch. 3 - Planetary Characteristics & Elements)
 * - Charaka Samhita (Sutra Sthana & Vimana Sthana)
 * - Ashtanga Hridaya (Dosha Bhedas)
 * - Saravali & Brihat Jataka
 *
 * Maps planetary and zodiacal elemental signatures to the Three Doshas:
 * - Vata (वात - Air & Ether): Saturn, Rahu, Mercury
 * - Pitta (पित्त - Fire & Water): Sun, Mars, Ketu
 * - Kapha (कफ - Earth & Water): Moon, Venus, Jupiter
 */

export interface DoshaDistribution {
  vata: number;   // Percentage (0 - 100)
  pitta: number;  // Percentage (0 - 100)
  kapha: number;  // Percentage (0 - 100)
}

export interface AyurvedicPrakriti {
  prakritiName: string;
  sanskritName: string;
  subtitle: string;
  distribution: DoshaDistribution;
  primaryDosha: "Vata" | "Pitta" | "Kapha" | "Tridoshic";
  secondaryDosha?: "Vata" | "Pitta" | "Kapha";
  agniType: {
    sanskrit: string;
    english: string;
    description: string;
  };
  constitutionSummary: string;
  strengths: string[];
  vulnerabilities: string[];
  dietaryGuidelines: {
    favor: string[];
    moderate: string[];
    beneficialHerbs: string[];
  };
  lifestyleDinacharya: {
    idealWakeTime: string;
    movementStyle: string;
    mindfulnessPractice: string;
    sleepGuidance: string;
  };
}

// Elemental mapping for 12 Signs
// Aries (Fire/Pitta), Taurus (Earth/Kapha), Gemini (Air/Vata), Cancer (Water/Kapha),
// Leo (Fire/Pitta), Virgo (Earth/Vata-Pitta), Libra (Air/Vata), Scorpio (Water-Fire/Pitta),
// Sagittarius (Fire/Pitta), Capricorn (Earth/Vata), Aquarius (Air/Vata), Pisces (Water/Kapha)
const SIGN_DOSHA_WEIGHTS: Record<string, { vata: number; pitta: number; kapha: number }> = {
  Aries: { vata: 15, pitta: 75, kapha: 10 },
  Taurus: { vata: 15, pitta: 15, kapha: 70 },
  Gemini: { vata: 75, pitta: 15, kapha: 10 },
  Cancer: { vata: 10, pitta: 15, kapha: 75 },
  Leo: { vata: 10, pitta: 80, kapha: 10 },
  Virgo: { vata: 50, pitta: 35, kapha: 15 },
  Libra: { vata: 70, pitta: 20, kapha: 10 },
  Scorpio: { vata: 15, pitta: 65, kapha: 20 },
  Sagittarius: { vata: 20, pitta: 65, kapha: 15 },
  Capricorn: { vata: 65, pitta: 15, kapha: 20 },
  Aquarius: { vata: 75, pitta: 15, kapha: 10 },
  Pisces: { vata: 15, pitta: 15, kapha: 70 },
};

// Planetary Dosha Signatures (BPHS Ch. 3)
// Sun: Pitta (bile/heat)
// Moon: Vata-Kapha (predominantly Kapha)
// Mars: Pitta (blood/muscles)
// Mercury: Tridoshic / Vata-predominant
// Jupiter: Kapha (fat/brain tissue)
// Venus: Kapha-Vata (semen/fluids)
// Saturn: Vata (nerves/sinews)
// Rahu: Vata (erratic/nervous)
// Ketu: Pitta (subtle fire)
const PLANET_DOSHA_WEIGHTS: Record<string, { vata: number; pitta: number; kapha: number }> = {
  Sun: { vata: 10, pitta: 85, kapha: 5 },
  Moon: { vata: 20, pitta: 10, kapha: 70 },
  Mars: { vata: 10, pitta: 85, kapha: 5 },
  Mercury: { vata: 60, pitta: 20, kapha: 20 },
  Jupiter: { vata: 15, pitta: 15, kapha: 70 },
  Venus: { vata: 25, pitta: 15, kapha: 60 },
  Saturn: { vata: 85, pitta: 5, kapha: 10 },
  Rahu: { vata: 80, pitta: 10, kapha: 10 },
  Ketu: { vata: 15, pitta: 80, kapha: 5 },
};

// Sign Lord Mapper
const SIGN_LORDS: Record<string, string> = {
  Aries: "Mars",
  Taurus: "Venus",
  Gemini: "Mercury",
  Cancer: "Moon",
  Leo: "Sun",
  Virgo: "Mercury",
  Libra: "Venus",
  Scorpio: "Mars",
  Sagittarius: "Jupiter",
  Capricorn: "Saturn",
  Aquarius: "Saturn",
  Pisces: "Jupiter",
};

/**
 * Calculates authentic Ayurvedic Prakriti from birth chart pillars
 */
export function calculateAyurvedicPrakriti(
  ascSign: string,
  moonSign: string,
  sunSign: string,
  ascLord?: string
): AyurvedicPrakriti {
  const resolvedAscLord = ascLord || SIGN_LORDS[ascSign] || "Mars";

  // Weighted composition:
  // 1. Lagna (Ascendant Sign - physical chassis): 35%
  // 2. Lagna Lord (Governing vital force): 25%
  // 3. Moon Sign (Fluid & emotional lymphatic balance): 20%
  // 4. Sun Sign (Metabolic Agni & core vitality): 20%

  const lagnaW = SIGN_DOSHA_WEIGHTS[ascSign] || { vata: 33, pitta: 33, kapha: 34 };
  const lordW = PLANET_DOSHA_WEIGHTS[resolvedAscLord] || { vata: 33, pitta: 33, kapha: 34 };
  const moonW = SIGN_DOSHA_WEIGHTS[moonSign] || { vata: 33, pitta: 33, kapha: 34 };
  const sunW = SIGN_DOSHA_WEIGHTS[sunSign] || { vata: 33, pitta: 33, kapha: 34 };

  const rawVata = lagnaW.vata * 0.35 + lordW.vata * 0.25 + moonW.vata * 0.20 + sunW.vata * 0.20;
  const rawPitta = lagnaW.pitta * 0.35 + lordW.pitta * 0.25 + moonW.pitta * 0.20 + sunW.pitta * 0.20;
  const rawKapha = lagnaW.kapha * 0.35 + lordW.kapha * 0.25 + moonW.kapha * 0.20 + sunW.kapha * 0.20;

  const total = rawVata + rawPitta + rawKapha || 1;
  const vata = Math.round((rawVata / total) * 100);
  const pitta = Math.round((rawPitta / total) * 100);
  const kapha = Math.max(0, 100 - (vata + pitta)); // Ensure perfect 100 sum

  const distribution: DoshaDistribution = { vata, pitta, kapha };

  // Determine Dominant Prakriti Archetype
  let primaryDosha: "Vata" | "Pitta" | "Kapha" | "Tridoshic" = "Pitta";
  let secondaryDosha: "Vata" | "Pitta" | "Kapha" | undefined;
  let prakritiName = "Pitta-Vata";
  let sanskritName = "पित्त-वात प्रकृति";
  let subtitle = "Fiery Intellect, Dynamic Agility & Sharp Purpose";

  // Check Tridoshic balance (all within close range)
  if (Math.abs(vata - pitta) <= 8 && Math.abs(pitta - kapha) <= 8 && Math.abs(vata - kapha) <= 8) {
    primaryDosha = "Tridoshic";
    prakritiName = "Tridoshic (Sama Prakriti)";
    sanskritName = "समदोष प्रकृति (त्रिदोष)";
    subtitle = "Rare Harmonious Equilibrium of Air, Fire & Water Elements";
  } else {
    // Sort doshas descending
    const sorted = [
      { name: "Vata" as const, val: vata },
      { name: "Pitta" as const, val: pitta },
      { name: "Kapha" as const, val: kapha },
    ].sort((a, b) => b.val - a.val);

    primaryDosha = sorted[0].name;

    if (sorted[0].val >= 55 && sorted[0].val - sorted[1].val >= 25) {
      // Pure Single Dosha
      prakritiName = `${primaryDosha} Dominant`;
      if (primaryDosha === "Vata") {
        sanskritName = "शुद्ध वात प्रकृति";
        subtitle = "Creative, Highly Adaptive, Intuitive & Free-Spirited";
      } else if (primaryDosha === "Pitta") {
        sanskritName = "शुद्ध पित्त प्रकृति";
        subtitle = "Visionary, Laser-Focused, Decisive & Passionate Leader";
      } else {
        sanskritName = "शुद्ध कफ प्रकृति";
        subtitle = "Sturdy, Deeply Grounded, Enduring & Compassionate Anchor";
      }
    } else {
      // Dual Dosha (Dvandvaja Prakriti)
      secondaryDosha = sorted[1].name;
      prakritiName = `${primaryDosha}-${secondaryDosha}`;
      if (primaryDosha === "Vata" && secondaryDosha === "Pitta") {
        sanskritName = "वात-पित्त प्रकृति";
        subtitle = "Swift Innovation, Intense Drive, Conceptual Clarity & Quick Reaction";
      } else if (primaryDosha === "Pitta" && secondaryDosha === "Vata") {
        sanskritName = "पित्त-वात प्रकृति";
        subtitle = "Strategic Focus, High Metabolism, Dynamic Vision & Restless Ambition";
      } else if (primaryDosha === "Pitta" && secondaryDosha === "Kapha") {
        sanskritName = "पित्त-कफ प्रकृति";
        subtitle = "Powerful Executive Stamina, Steadfast Courage, Magnetic Presence & Resilience";
      } else if (primaryDosha === "Kapha" && secondaryDosha === "Pitta") {
        sanskritName = "कफ-पित्त प्रकृति";
        subtitle = "Methodical Execution, Patient Drive, Warm Generosity & Long-Term Building";
      } else if (primaryDosha === "Vata" && secondaryDosha === "Kapha") {
        sanskritName = "वात-कफ प्रकृति";
        subtitle = "Imaginative Depth, Empathetic Flow, Variable Rhythm & Gentle Sensitivity";
      } else {
        sanskritName = "कफ-वात प्रकृति";
        subtitle = "Calm Stability with Bursts of Creative Expression & Deep Emotional Grounding";
      }
    }
  }

  // Agni Profile
  const agniType = getAgniProfile(primaryDosha);

  // Dietary and lifestyle guidance
  const { strengths, vulnerabilities, dietaryGuidelines, lifestyleDinacharya, constitutionSummary } =
    getPrakritiProfileDetails(primaryDosha, secondaryDosha, ascSign);

  return {
    prakritiName,
    sanskritName,
    subtitle,
    distribution,
    primaryDosha,
    secondaryDosha,
    agniType,
    constitutionSummary,
    strengths,
    vulnerabilities,
    dietaryGuidelines,
    lifestyleDinacharya,
  };
}

function getAgniProfile(primary: "Vata" | "Pitta" | "Kapha" | "Tridoshic") {
  switch (primary) {
    case "Pitta":
      return {
        sanskrit: "तीक्ष्णाग्नि (Tikshnagni)",
        english: "Sharp / Intense Metabolic Fire",
        description:
          "Fast digestion with high hunger intolerance. Needs regularly spaced, cooling, nourishing meals. Easily experiences acidity or irritability if meals are skipped.",
      };
    case "Vata":
      return {
        sanskrit: "विषमाग्नि (Vishamagni)",
        english: "Irregular / Fluctuating Metabolic Fire",
        description:
          "Digestion varies day-to-day (heavy appetite one day, sluggish the next). Thrives on warm, moist, grounding soups and spices like ginger, cumin, and hing.",
      };
    case "Kapha":
      return {
        sanskrit: "मन्दाग्नि (Mandagni)",
        english: "Slow / Steady Metabolic Fire",
        description:
          "Steady but slow digestive burn. Retains nutrients efficiently but can accumulate heaviness if eating late. Thrives on light, warm, pungent spices (black pepper, pippali, ginger).",
      };
    case "Tridoshic":
      return {
        sanskrit: "समाग्नि (Samagni)",
        english: "Balanced / Harmonious Metabolic Fire",
        description:
          "Ideal physiological Agni. Smooth digestion, consistent assimilation of nutrients, and natural circadian equilibrium without erratic cravings.",
      };
  }
}

function getPrakritiProfileDetails(
  primary: "Vata" | "Pitta" | "Kapha" | "Tridoshic",
  secondary?: "Vata" | "Pitta" | "Kapha",
  ascSign?: string
) {
  if (primary === "Vata") {
    return {
      constitutionSummary: `Your physical and energetic blueprint is predominantly governed by Vata (Air & Ether), infused with your ${ascSign || "rising"} ascendant. You process ideas swiftly, adapt effortlessly to changing environments, and express an innate lightness, quick speech, and vibrant creative agility. When out of rhythm, your nervous system easily carries excess mental velocity, light sleep, or digestive fluctuations.`,
      strengths: [
        "Rapid conceptual thinking, creative vision, and artistic perception",
        "High adaptability and spontaneous problem-solving under shifting conditions",
        "Quick sensory agility, enthusiastic communications, and intuitive empathy",
      ],
      vulnerabilities: [
        "Susceptibility to dry skin, cold extremities, and sensory fatigue",
        "Tendency towards irregular eating routines and overactive late-night mental loops",
        "Prone to joint stiffness, shallow breathing, and erratic sleep patterns under stress",
      ],
      dietaryGuidelines: {
        favor: [
          "Warm, grounding, unctuous meals (freshly cooked khichdi, root vegetable stews, ghee, warm broths)",
          "Sweet, sour, and salty tastes that stabilize airy mobility",
          "Healthy fats (A2 cow ghee, sesame oil, soaked almonds, avocados)",
        ],
        moderate: [
          "Raw, icy salads and cold carbonated drinks",
          "Dry crackers, processed crisps, and excessive astringent raw beans",
          "Caffeine past midday that overstimulates delicate vata nerves",
        ],
        beneficialHerbs: ["Ashwagandha", "Shatavari", "Brahmi", "Cardamom", "Fresh Ginger", "Sesame"],
      },
      lifestyleDinacharya: {
        idealWakeTime: "6:00 AM – 6:30 AM (gentle, unhurried morning rhythm)",
        movementStyle: "Grounding Hatha Yoga, tai chi, moderate walking, and mindful core stabilization (avoid frantic exhaustion)",
        mindfulnessPractice: "Nadi Shodhana (Alternate Nostril Breathing) and gentle warm sesame oil Abhyanga massage",
        sleepGuidance: "Prioritize warm herbal milk (with nutmeg) and lights-off by 10:30 PM to anchor restorative delta sleep",
      },
    };
  }

  if (primary === "Pitta") {
    return {
      constitutionSummary: `Your constitution is ignited by Pitta (Fire & Water), amplified by the solar/vital resonance of your ${ascSign || "rising"} Lagna. You possess a brilliant digestive metabolism, luminous complexion, articulate intellect, and natural executive precision. Your mind cuts straight through ambiguity to find solutions. Under chronic pressure, internal heat can convert to impatience, inflammatory acidity, or hyper-critical perfectionism.`,
      strengths: [
        "Penetrating analytical intellect, sharp focus, and natural decisive leadership",
        "Robust digestive metabolism (Tikshnagni) and high metabolic energy",
        "Clear, persuasive speech, courage to take calculated risks, and inspiring presence",
      ],
      vulnerabilities: [
        "Predisposition to excess internal heat, acidity, heartburn, and skin redness",
        "Irritability or tension if meals are missed or progress is delayed",
        "Tendency to push beyond healthy limits and overwork through sheer willpower",
      ],
      dietaryGuidelines: {
        favor: [
          "Cooling, nourishing foods (sweet fruits, cucumbers, coconut water, fresh cow ghee, cilantro, fennel)",
          "Sweet, bitter, and astringent tastes that gently soothe metabolic fire",
          "Whole grains (basmati rice, barley, oats) and fresh leafy greens",
        ],
        moderate: [
          "Pungent hot chili peppers, raw garlic, deep-fried greasy snacks",
          "Excessive sour vinegars, fermented alcohols, and overly salty condiments",
          "Extreme hot-temperature boiling beverages consumed hurriedly",
        ],
        beneficialHerbs: ["Amalaki (Amla)", "Shatavari", "Guduchi", "Fennel Seeds", "Coriander", "Rose Petals"],
      },
      lifestyleDinacharya: {
        idealWakeTime: "5:30 AM – 6:00 AM (greet the gentle, cool morning air)",
        movementStyle: "Cooling swimming, non-competitive cycling, moonlit walks, and flowing, expansive yoga that avoids hyper-straining",
        mindfulnessPractice: "Sheetali & Sheetkari cooling pranayama and evening contemplative meditation to soothe the intellect",
        sleepGuidance: "Cool bedroom temperature with sandalwood or lavender diffuser; wind down screens 1 hour before sleep",
      },
    };
  }

  if (primary === "Kapha") {
    return {
      constitutionSummary: `Your constitutional foundation is anchored in Kapha (Earth & Water), blessed with the enduring steadiness of your ${ascSign || "rising"} ascendant. You are endowed with natural physiological stamina, strong biological immunity (Ojas), dense muscular cohesion, and a calm, compassionate temperament. While remarkably resistant to stress, a sedentary lifestyle or overly heavy diet can lead to lethargy, fluid retention, or resistance to change.`,
      strengths: [
        "Profound biological resilience, sturdy stamina, and natural immunity (Ojas)",
        "Calm, forgiving emotional temperament, deep loyalty, and comforting presence",
        "Steady long-term endurance, methodical execution, and emotional consistency",
      ],
      vulnerabilities: [
        "Slow metabolic burn (Mandagni), with susceptibility to weight gain or water retention",
        "Tendency towards respiratory congestion, sluggish morning starts, and inertia",
        "Attachment to familiar comforts and reluctance to embrace rapid changes",
      ],
      dietaryGuidelines: {
        favor: [
          "Light, warm, freshly cooked, vibrant meals with generous stimulating spices",
          "Pungent, bitter, and astringent tastes that accelerate lymphatic and metabolic flow",
          "Legumes (mung dal, lentils), steamed greens, quinoa, millet, and warm spiced teas",
        ],
        moderate: [
          "Heavy dairy products (ice cream, cold aged cheeses, excessive whole milk)",
          "Refined white sugars, oily deep-fried doughs, and cold refrigerated leftovers",
          "Heavy late-night dinners consumed after 8:00 PM",
        ],
        beneficialHerbs: ["Trikatu (Ginger, Black Pepper, Pippali)", "Tulsi", "Turmeric", "Punarnava", "Guggulu", "Cinnamon"],
      },
      lifestyleDinacharya: {
        idealWakeTime: "Before sunrise (5:00 AM – 5:45 AM) to break through natural earth inertia before Kapha hours begin",
        movementStyle: "Vigorous, sweat-inducing exercise: brisk cardio, Power Vinyasa Yoga, hiking, and dynamic movement",
        mindfulnessPractice: "Bhastrika and Kapalabhati stimulating breathwork to ignite digestive Agni and clear bronchial pathways",
        sleepGuidance: "Avoid daytime napping; aim for 7 hours of high-quality nighttime rest without excessive slumber",
      },
    };
  }

  // Tridoshic Default
  return {
    constitutionSummary: `Your constitutional chart expresses a harmonious balance across all three doshas (Vata, Pitta, and Kapha). This rare 'Sama' equilibrium offers resilient versatility: you have the mental agility of Vata, the sharp purpose of Pitta, and the calm physical endurance of Kapha. Your wellness key is adapting gracefully to the changing seasons (Ritucharya).`,
    strengths: [
      "Natural holistic equilibrium across mind, body, and emotions",
      "Balanced metabolic fire (Samagni) capable of processing diverse experiences",
      "High physiological versatility and adaptability across seasons",
    ],
    vulnerabilities: [
      "Vulnerability to seasonal weather extremes (Vata in Autumn, Pitta in Summer, Kapha in Spring)",
      "Risk of taking natural balance for granted through erratic lifestyle habits",
    ],
    dietaryGuidelines: {
      favor: [
        "Fresh, seasonal, Sattvic cuisine prepared with moderate traditional spices",
        "Balanced six tastes (Sweet, Sour, Salty, Pungent, Bitter, Astringent) in daily meals",
        "Seasonal adaptation: warming in winter, cooling in summer, light in spring",
      ],
      moderate: ["Processed synthetic foods, highly artificial additives, and irregular meal schedules"],
      beneficialHerbs: ["Triphala", "Ashwagandha", "Amla", "Tulsi", "Turmeric"],
    },
    lifestyleDinacharya: {
      idealWakeTime: "5:30 AM – 6:00 AM during Brahma Muhurta",
      movementStyle: "Balanced blend of strength, flexibility, and aerobic circulation",
      mindfulnessPractice: "Savitri pranayama and silent Vedic mantra japa",
      sleepGuidance: "7 to 8 hours of restorative sleep aligned with natural solar cycles",
    },
  };
}
