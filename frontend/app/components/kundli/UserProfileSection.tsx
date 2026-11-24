"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  Flame,
  Mountain,
  Wind,
  Droplets,
  Compass,
  Clock,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Plus,
  Trash2,
  RefreshCw,
  Zap,
  Target,
  Heart,
  Award,
  Crown,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  BookOpen,
  Moon,
  Sun,
  Coins,
  ShieldAlert,
  Plane,
} from "lucide-react";
import DashaTimeline from "../DashaTimeline";
import { chatWithAstrologerStream } from "../ui/api";
import { useToast } from "../../hooks/useToast";
import { MuhurthaSection } from "./MuhurthaSection";
import { AyurvedaSection } from "./AyurvedaSection";
import { VedicGreetingBanner } from "./VedicGreetingBanner";
import {
  ASCENDANT_INTERPRETATIONS,
  MOON_SIGN_INTERPRETATIONS,
  SUN_HOUSE_INTERPRETATIONS,
  generateLifeTimelinePhases,
  LifeTimelinePhase,
} from "../../lib/vedicInterpretations";

// --- 27 NAKSHATRAS ENRICHED VEDIC ARCHETYPES ---
interface NakshatraMeta {
  lord: string;
  element: string;
  guna: string;
  archetype: string;
  essence: string;
}

const NAKSHATRA_DATA: Record<string, NakshatraMeta> = {
  Ashwini: { lord: "Ketu", element: "Earth", guna: "Rajasic Sattva", archetype: "The Pioneering Healer", essence: "spontaneous initiative, rapid vitality, and swift problem-solving" },
  Bharani: { lord: "Venus", element: "Earth", guna: "Rajasic Tamas", archetype: "The Transformative Bearer", essence: "great psychological endurance, creative gestation, and guiding transitions" },
  Krittika: { lord: "Sun", element: "Fire", guna: "Rajasic Rajas", archetype: "The Piercing Purifier", essence: "incisive intellectual discernment, fiery courage, and unwavering integrity" },
  Rohini: { lord: "Moon", element: "Earth", guna: "Rajasic Tamas", archetype: "The Magnetic Creator", essence: "artistic manifestation, fertile emotional abundance, and serene charm" },
  Mrigashira: { lord: "Mars", element: "Earth", guna: "Rajasic Tamas", archetype: "The Inquisitive Seeker", essence: "perpetual curiosity, sharp analytical searching, and mental agility" },
  Ardra: { lord: "Rahu", element: "Water", guna: "Rajasic Tamas", archetype: "The Storm Alchemist", essence: "transforming emotional intensity into profound clarity and breakthroughs" },
  Punarvasu: { lord: "Jupiter", element: "Water", guna: "Rajasic Sattva", archetype: "The Restorer of Light", essence: "resilience, philosophical optimism, and maternal nourishment" },
  Pushya: { lord: "Saturn", element: "Water", guna: "Rajasic Tamas", archetype: "The Supreme Nourisher", essence: "unconditional mentorship, spiritual nourishment, and steadfast duty" },
  Ashlesha: { lord: "Mercury", element: "Water", guna: "Rajasic Sattva", archetype: "The Mystic Intuitive", essence: "penetrating psychological perception, strategic caution, and esoteric depth" },
  Magha: { lord: "Ketu", element: "Fire", guna: "Tamasic Rajas", archetype: "The Sovereign Legacy", essence: "ancestral pride, authoritative dignity, and upholding enduring traditions" },
  "Purva Phalguni": { lord: "Venus", element: "Fire", guna: "Tamasic Rajas", archetype: "The Celebrator of Life", essence: "relational warmth, creative leisure, social magnetism, and generous joy" },
  "Uttara Phalguni": { lord: "Sun", element: "Fire", guna: "Tamasic Sattva", archetype: "The Honorable Patron", essence: "steadfast loyalty, philanthropic duty, and principled alliances" },
  Hasta: { lord: "Moon", element: "Fire", guna: "Tamasic Rajas", archetype: "The Golden Craftsman", essence: "mastery of detail, healing dexterity, and practical commercial acumen" },
  Chitra: { lord: "Mars", element: "Fire", guna: "Tamasic Tamas", archetype: "The Master Designer", essence: "aesthetic brilliance, structural elegance, and visionary creativity" },
  Swati: { lord: "Rahu", element: "Fire", guna: "Tamasic Rajas", archetype: "The Independent Innovator", essence: "freedom of movement, diplomatic agility, and unconventional growth" },
  Vishakha: { lord: "Jupiter", element: "Fire", guna: "Tamasic Sattva", archetype: "The Focused Victor", essence: "single-pointed determination, triumphant perseverance, and purposeful ambition" },
  Anuradha: { lord: "Saturn", element: "Water", guna: "Tamasic Tamas", archetype: "The Devoted Catalyst", essence: "unwavering fellowship, organizational loyalty, and deep devotional focus" },
  Jyeshtha: { lord: "Mercury", element: "Air", guna: "Tamasic Sattva", archetype: "The Elder Guardian", essence: "protective seniority, sharp mental defense, and courageous mastery" },
  Mula: { lord: "Ketu", element: "Air", guna: "Sattvic Rajas", archetype: "The Radical Investigator", essence: "rooting out illusions, core inquiry, and transformative truth-seeking" },
  "Purva Ashadha": { lord: "Venus", element: "Water", guna: "Sattvic Rajas", archetype: "The Invincible Visionary", essence: "unshakeable philosophical conviction, emotional invincibility, and the power of discerning truth from illusion" },
  "Uttara Ashadha": { lord: "Sun", element: "Earth", guna: "Sattvic Sattva", archetype: "The Righteous Statesman", essence: "universal principles, enduring integrity, and unassailable ethical victory" },
  Shravana: { lord: "Moon", element: "Air", guna: "Sattvic Rajas", archetype: "The Deep Listener", essence: "receptive contemplation, oral tradition, scholarship, and quiet wisdom" },
  Dhanishta: { lord: "Mars", element: "Ether", guna: "Sattvic Tamas", archetype: "The Resonant Sovereign", essence: "rhythmic harmony, material abundance, expressive gifts, and leadership" },
  Shatabhisha: { lord: "Rahu", element: "Ether", guna: "Sattvic Tamas", archetype: "The Cosmic Healer", essence: "esoteric sciences, solitary meditation, holistic healing, and piercing veiled truths" },
  "Purva Bhadrapada": { lord: "Jupiter", element: "Ether", guna: "Sattvic Sattva", archetype: "The Cosmic Transformer", essence: "intense spiritual focus, transformative fire, and courageous ideals" },
  "Uttara Bhadrapada": { lord: "Saturn", element: "Water", guna: "Sattvic Tamas", archetype: "The Serene Sage", essence: "profound emotional stability, compassionate wisdom, and contemplative peace" },
  Revati: { lord: "Mercury", element: "Water", guna: "Sattvic Sattva", archetype: "The Compassionate Guide", essence: "gentle guidance, boundless empathy, traveler protection, and soulful completion" },
};

// --- ELEMENT SIGN MAPPINGS ---
const SIGN_ELEMENTS: Record<string, "Fire" | "Earth" | "Air" | "Water"> = {
  Aries: "Fire",
  Leo: "Fire",
  Sagittarius: "Fire",
  Taurus: "Earth",
  Virgo: "Earth",
  Capricorn: "Earth",
  Gemini: "Air",
  Libra: "Air",
  Aquarius: "Air",
  Cancer: "Water",
  Scorpio: "Water",
  Pisces: "Water",
};

// --- DASHA ENERGETIC THEMES ---
const PLANET_ENERGY_THEMES: Record<string, { theme: string; focus: string }> = {
  Sun: { theme: "Illumination & Authority", focus: "Activating personal sovereignty, leadership, identity, and soul clarity." },
  Moon: { theme: "Emotional Mindset & Public Harmony", focus: "Inner psychological peace, intuition, domestic harmony, and connection with people." },
  Mars: { theme: "Courage, Willpower & Action", focus: "Direct drive, decisive boundary-setting, physical energy, and ambitious ventures." },
  Mercury: { theme: "Intellect, Communication & Commerce", focus: "Analytical clarity, business strategy, trade, writing, and skill acquisition." },
  Jupiter: { theme: "Wisdom, Expansion & Providence", focus: "Spiritual discernment, higher education, guidance, ethics, and material abundance." },
  Venus: { theme: "Refinement, Creativity & Relationships", focus: "Aesthetic mastery, relational devotion, mutual values, comfort, and creative endeavors." },
  Saturn: { theme: "Structure, Discipline & Karmic Maturity", focus: "Long-term endurance, grounded discipline, humility, and enduring legacy." },
  Rahu: { theme: "Breakthrough, Ambition & Unconventional Growth", focus: "Accelerated worldly hunger, unorthodox frontiers, tech, and overcoming limitations." },
  Ketu: { theme: "Spiritual Insight, Detachment & Depth", focus: "Inward contemplation, research, liberation from attachments, and esoteric mastery." },
};

function parseDashaDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const sep = dateStr.includes("-") ? "-" : "/";
  const parts = dateStr.split(sep);
  if (parts.length === 3) {
    if (parts[0].length <= 2 && parts[2].length === 4) {
      // DD-MM-YYYY
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
  }
  return new Date(dateStr);
}

function formatDate(dateStr: string): string {
  try {
    const d = parseDashaDate(dateStr);
    return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export interface SavedProfile {
  id: string;
  name: string;
  date: string;
  time: string;
  city: any;
  chartData: any;
  createdAt: number;
}

interface UserProfileSectionProps {
  chartData: any;
  activeProfile: {
    date: string;
    time: string;
    city: any;
  } | null;
  selectedLanguage: string;
  onSelectSavedProfile?: (profile: SavedProfile) => void;
  onNavigateToTab?: (tab: "chart" | "chat" | "report") => void;
}

export default function UserProfileSection({
  chartData,
  activeProfile,
  selectedLanguage,
  onSelectSavedProfile,
  onNavigateToTab,
}: UserProfileSectionProps) {
  const { showToast } = useToast();
  const [showFullTimeline, setShowFullTimeline] = useState(false);

  // --- Saved Profiles State ---
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileLabelInput, setProfileLabelInput] = useState("");

  // --- AI Persona Insight State ---
  const [aiPersona, setAiPersona] = useState<string>("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // --- AI Timeline Analysis State ---
  const [aiTimelineAnalysis, setAiTimelineAnalysis] = useState<string>("");
  const [isAnalyzingTimeline, setIsAnalyzingTimeline] = useState(false);
  const [showTimelineAiCard, setShowTimelineAiCard] = useState(false);
  const [showPersonalMuhurtha, setShowPersonalMuhurtha] = useState(false);

  // --- Predictive Timeline Domain Filter & Sub-Period Drilldown ---
  const [timelineDomain, setTimelineDomain] = useState<
    "all" | "career" | "education" | "relationships" | "spirituality" | "wealth" | "health" | "travel"
  >("all");
  const [expandedEpochs, setExpandedEpochs] = useState<Record<number, boolean>>({});
  const [selectedSubPeriod, setSelectedSubPeriod] = useState<Record<number, number>>({});

  // --- Big-3 Extractor ---
  const ascendant = chartData?.ascendant;
  const ascSign = ascendant?.sign || "Unknown";
  const ascDegree = ascendant?.degree ? Number(ascendant.degree).toFixed(1) : "0.0";
  const ascElement = SIGN_ELEMENTS[ascSign] || "Fire";

  const lifePhases = useMemo(() => {
    return generateLifeTimelinePhases(chartData?.vimshottari_timeline || [], activeProfile?.date, ascSign);
  }, [chartData, activeProfile, ascSign]);

  const topYogas = useMemo(() => {
    return (chartData?.yogas || []).slice(0, 4);
  }, [chartData]);

  // Load saved profiles from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("vedic_saved_profiles");
      if (stored) {
        setSavedProfiles(JSON.parse(stored));
      }
    } catch { }
  }, []);

  // Save profile to localStorage
  const handleSaveProfile = () => {
    if (!profileLabelInput.trim()) {
      showToast("Please enter a name or label for this profile.", "info");
      return;
    }
    if (!chartData || !activeProfile) return;

    const newProfile: SavedProfile = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: profileLabelInput.trim(),
      date: activeProfile.date,
      time: activeProfile.time,
      city: activeProfile.city,
      chartData,
      createdAt: Date.now(),
    };

    const updated = [newProfile, ...savedProfiles.filter((p) => p.name !== newProfile.name)];
    setSavedProfiles(updated);
    try {
      localStorage.setItem("vedic_saved_profiles", JSON.stringify(updated));
      showToast(`Profile "${newProfile.name}" saved successfully!`, "success");
      setIsSavingProfile(false);
      setProfileLabelInput("");
    } catch {
      showToast("Could not save profile locally.", "error");
    }
  };

  const handleDeleteProfile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedProfiles.filter((p) => p.id !== id);
    setSavedProfiles(updated);
    try {
      localStorage.setItem("vedic_saved_profiles", JSON.stringify(updated));
      showToast("Profile removed.", "info");
    } catch { }
  };

  const moon = chartData?.moon_intelligence;
  const moonSign = moon?.sign || "Unknown";
  const moonNakshatra = moon?.nakshatra || "Ashwini";
  const moonPada = moon?.pada || 1;
  const moonElement = SIGN_ELEMENTS[moonSign] || "Water";

  // Sun placement
  const sunRow = useMemo(() => {
    return (chartData?.planetary_table || []).find((p: any) => p.name === "Sun");
  }, [chartData]);
  const sunSign = sunRow?.sign || "Unknown";
  const sunHouse = sunRow?.house || 1;
  const sunElement = SIGN_ELEMENTS[sunSign] || "Fire";

  // Nakshatra Archetype
  const nakshatraMeta = NAKSHATRA_DATA[moonNakshatra] || {
    lord: "Jupiter",
    element: "Universal",
    guna: "Sattvic",
    archetype: "The Intuitive Seeker",
    essence: "spiritual wisdom, emotional depth, and reflective perception",
  };

  // --- Active Running Dasha Calculation ---
  const activeDashaInfo = useMemo(() => {
    const timeline = chartData?.vimshottari_timeline || [];
    if (!timeline.length) return null;

    const now = new Date();
    for (const md of timeline) {
      const mdStart = parseDashaDate(md.start);
      const mdEnd = parseDashaDate(md.end);

      if (now >= mdStart && now <= mdEnd) {
        let activeAd = null;
        if (md.antardashas && Array.isArray(md.antardashas)) {
          for (const ad of md.antardashas) {
            const adStart = parseDashaDate(ad.start);
            const adEnd = parseDashaDate(ad.end);
            if (now >= adStart && now <= adEnd) {
              activeAd = ad;
              break;
            }
          }
        }

        const totalSpan = mdEnd.getTime() - mdStart.getTime();
        const elapsed = now.getTime() - mdStart.getTime();
        const mdProgress = Math.min(100, Math.max(0, (elapsed / totalSpan) * 100));

        let adProgress = 0;
        if (activeAd) {
          const adStart = parseDashaDate(activeAd.start);
          const adEnd = parseDashaDate(activeAd.end);
          const adSpan = adEnd.getTime() - adStart.getTime();
          adProgress = Math.min(100, Math.max(0, ((now.getTime() - adStart.getTime()) / adSpan) * 100));
        }

        return {
          mahadasha: md,
          antardasha: activeAd || md.antardashas?.[0],
          mdProgress: Math.round(mdProgress),
          adProgress: Math.round(adProgress),
        };
      }
    }

    // Default fallback to first
    return {
      mahadasha: timeline[0],
      antardasha: timeline[0]?.antardashas?.[0],
      mdProgress: 0,
      adProgress: 0,
    };
  }, [chartData]);

  // --- 4 Purusharthas Distribution ---
  const purusharthas = useMemo(() => {
    const planets = chartData?.planetary_table || [];
    let dharmaCount = 0; // 1, 5, 9
    let arthaCount = 0;  // 2, 6, 10
    let kamaCount = 0;   // 3, 7, 11
    let mokshaCount = 0; // 4, 8, 12

    // Ascendant counts into Dharma
    dharmaCount += 1;

    for (const p of planets) {
      const h = Number(p.house);
      if ([1, 5, 9].includes(h)) dharmaCount++;
      else if ([2, 6, 10].includes(h)) arthaCount++;
      else if ([3, 7, 11].includes(h)) kamaCount++;
      else if ([4, 8, 12].includes(h)) mokshaCount++;
    }

    const total = dharmaCount + arthaCount + kamaCount + mokshaCount || 1;
    return {
      dharma: Math.round((dharmaCount / total) * 100),
      artha: Math.round((arthaCount / total) * 100),
      kama: Math.round((kamaCount / total) * 100),
      moksha: Math.round((mokshaCount / total) * 100),
      dominant:
        dharmaCount >= arthaCount && dharmaCount >= kamaCount && dharmaCount >= mokshaCount
          ? "Dharma (Duty, Authenticity & Life Purpose)"
          : arthaCount >= kamaCount && arthaCount >= mokshaCount
            ? "Artha (Resources, Professional Mastery & Security)"
            : kamaCount >= mokshaCount
              ? "Kama (Desire, Creative Connection & Alliances)"
              : "Moksha (Introspection, Inner Healing & Liberation)",
    };
  }, [chartData]);

  // --- Pancha Mahabhuta Element Balance ---
  const elementalBalance = useMemo(() => {
    const planets = chartData?.planetary_table || [];
    let counts = { Fire: 0, Earth: 0, Air: 0, Water: 0 };

    if (ascSign && SIGN_ELEMENTS[ascSign]) {
      counts[SIGN_ELEMENTS[ascSign]]++;
    }

    for (const p of planets) {
      const el = SIGN_ELEMENTS[p.sign];
      if (el) counts[el]++;
    }

    const total = counts.Fire + counts.Earth + counts.Air + counts.Water || 1;
    const firePct = Math.round((counts.Fire / total) * 100);
    const earthPct = Math.round((counts.Earth / total) * 100);
    const airPct = Math.round((counts.Air / total) * 100);
    const waterPct = Math.round((counts.Water / total) * 100);

    let dominant = "Balanced";
    if (firePct >= earthPct && firePct >= airPct && firePct >= waterPct) dominant = "Fire Dominant (Passionate, Decisive & Visionary)";
    else if (earthPct >= airPct && earthPct >= waterPct) dominant = "Earth Dominant (Grounded, Pragmatic & Enduring)";
    else if (airPct >= waterPct) dominant = "Air Dominant (Intellectually Agile, Social & Conceptual)";
    else dominant = "Water Dominant (Empathetic, Intuitive & Emotionally Deep)";

    return { firePct, earthPct, airPct, waterPct, dominant };
  }, [chartData, ascSign]);

  // --- Core Planetary Council ---
  const planetaryCouncil = useMemo(() => {
    // 1. Champion Planet (Shadbala Leader)
    let champion = { name: "Jupiter", ratio: 1.0, rupas: 6.0 };
    if (chartData?.shadbala?.planet_balas) {
      let maxRatio = -1;
      for (const [name, data] of Object.entries<any>(chartData.shadbala.planet_balas)) {
        if (data.strength_ratio > maxRatio) {
          maxRatio = data.strength_ratio;
          champion = {
            name,
            ratio: Number(data.strength_ratio).toFixed(2) as any,
            rupas: Number(data.total_rupas).toFixed(2) as any,
          };
        }
      }
    }

    // 2. Soul Planet (Atmakaraka - AK)
    let atmakaraka = "Sun";
    if (chartData?.jaimini?.chara_karakas) {
      for (const [planet, karaka] of Object.entries<string>(chartData.jaimini.chara_karakas)) {
        if (karaka === "AK") {
          atmakaraka = planet;
          break;
        }
      }
    }

    // 3. Benefic Advisor (Venus or Jupiter or highest dignity)
    let benefic = "Venus";
    const exalted = (chartData?.planetary_table || []).find((p: any) => p.dignity?.toLowerCase().includes("exalted") || p.dignity?.toLowerCase().includes("own"));
    if (exalted) benefic = exalted.name;

    return { champion, atmakaraka, benefic };
  }, [chartData]);

  // --- Generate or Retrieve AI Persona Insights ---
  const cacheKey = useMemo(() => {
    if (!activeProfile) return null;
    return `vedic_persona_${activeProfile.date}_${activeProfile.time}_${activeProfile.city?.name || ""}`;
  }, [activeProfile]);

  useEffect(() => {
    if (!cacheKey) return;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setAiPersona(cached);
      }
    } catch { }
  }, [cacheKey]);

  const handleGenerateAiPersona = async () => {
    if (!chartData || isGeneratingAi) return;
    setIsGeneratingAi(true);
    setAiPersona("");

    const prompt = `Provide a short, crisp Vedic Persona breakdown strictly formatted in 4 concise sections:
### ⚡ Core Superpower
[1-2 punchy sentences on their greatest innate natural ability based on Lagna & dominant planetary placement.]

### 🌊 Emotional Mindset
[1-2 punchy sentences on how their Moon sign and Nakshatra navigate feelings, relationships, and pressure.]

### 🎯 Soul Ambition
[1-2 punchy sentences on what their Atmakaraka & 10th house karmically urge them to achieve in life.]

### 👁️ Conscious Blind Spot
[1-2 punchy sentences on a personal blind spot to stay mindful of for growth.]

CRITICAL MANDATE: Under NO circumstances should you suggest any remedies, gemstones, rudraksha, mantras, yantras, rituals, totke, or pujas. In authentic Vedic Jyotish philosophy, this is strictly an objective karmic diagnostic for self-awareness.`;

    let accumulated = "";
    try {
      await chatWithAstrologerStream(
        {
          chart_data: { ...chartData, language: selectedLanguage },
          question: prompt,
          history: [],
        },
        (chunk: string) => {
          accumulated += chunk;
          setAiPersona((prev) => prev + chunk);
        },
        () => {
          setIsGeneratingAi(false);
          if (cacheKey && accumulated) {
            try {
              sessionStorage.setItem(cacheKey, accumulated);
            } catch { }
          }
        },
        (err: string) => {
          showToast(err || "Failed to align persona insights.", "error");
          setIsGeneratingAi(false);
        }
      );
    } catch (e: any) {
      showToast(e?.message || "Failed to align persona insights.", "error");
      setIsGeneratingAi(false);
    }
  };

  // --- AI Timeline Deep Synthesis Logic ---
  const timelineAiCacheKey = useMemo(() => {
    if (!activeProfile) return null;
    return `vedic_timeline_ai_${activeProfile.date}_${activeProfile.time}_${timelineDomain}_${selectedLanguage}`;
  }, [activeProfile, timelineDomain, selectedLanguage]);

  useEffect(() => {
    if (!timelineAiCacheKey) return;
    try {
      const cached = sessionStorage.getItem(timelineAiCacheKey);
      if (cached) {
        setAiTimelineAnalysis(cached);
        setShowTimelineAiCard(true);
      } else {
        setAiTimelineAnalysis("");
        setShowTimelineAiCard(false);
      }
    } catch { }
  }, [timelineAiCacheKey]);

  const handleAnalyzeTimelineAi = async () => {
    if (!chartData || isAnalyzingTimeline) return;
    setIsAnalyzingTimeline(true);
    setShowTimelineAiCard(true);
    setAiTimelineAnalysis("");

    const currentMdLord = activeDashaInfo?.mahadasha?.lord || "Unknown";
    const currentAdLord = activeDashaInfo?.antardasha?.lord || "Unknown";
    const domainLabel = timelineDomain === "all" ? "All Life Spheres" : timelineDomain.toUpperCase();

    const prompt = `Conduct a rigorous, classical Vedic Jyotish synthesis of this native's Predictive Life Timeline specifically focused on the domain: "${domainLabel}".

NATIVE'S CHART CONTEXT:
- Ascendant (Lagna): ${ascSign} (${ascDegree}°)
- Moon Sign: ${moonSign}, Nakshatra: ${moonNakshatra} (Pada ${moonPada})
- Current Running Mahadasha: ${currentMdLord}
- Current Running Antardasha: ${currentAdLord}
- Selected Focus Domain: ${domainLabel}

Provide a deep, authentic astrological analysis strictly structured in 4 sections:

### 1. 🪐 Functional Lordships & Chart Synergy
Analyze how ${currentMdLord} (Mahadasha Lord) and ${currentAdLord} (Antardasha Lord) function for a ${ascSign} Ascendant (e.g. are they Yogakaraka, Kendra/Trikona lords, or Dusthana lords, and what houses do they activate in this chart?).

### 2. ⚡ Real-World Domain Manifestation (${domainLabel})
Explain how the current and upcoming dasha sub-periods manifest concretely in ${domainLabel}. Contrast the archetypal potential with how this native's specific planetary placements either accelerate or test progress.

### 3. 🎯 Golden Windows & Pivotal Shifts
Highlight the most auspicious phase or major karmic turning point in this timeline for ${domainLabel}. What celestial conditions unlock this breakthrough?

### 4. 🧭 Conscious Karmic Guidance
Provide grounded, philosophical advice for navigating this epoch with maximum clarity, agency, and spiritual poise.

CRITICAL MANDATE: Under NO circumstances recommend remedies, gemstones, rudraksha, yantras, rituals, or totke. Deliver an intellectually rigorous, authentic Parashari/Jaimini astrological evaluation.`;

    let accumulated = "";
    try {
      await chatWithAstrologerStream(
        {
          chart_data: { ...chartData, language: selectedLanguage },
          question: prompt,
          history: [],
        },
        (chunk: string) => {
          accumulated += chunk;
          setAiTimelineAnalysis((prev) => prev + chunk);
        },
        () => {
          setIsAnalyzingTimeline(false);
          if (timelineAiCacheKey && accumulated) {
            try {
              sessionStorage.setItem(timelineAiCacheKey, accumulated);
            } catch { }
          }
        },
        (err: string) => {
          showToast(err || "Failed to analyze timeline.", "error");
          setIsAnalyzingTimeline(false);
        }
      );
    } catch (e: any) {
      showToast(e?.message || "Failed to analyze timeline.", "error");
      setIsAnalyzingTimeline(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* ─── SACRED FESTIVAL GREETING & VEDIC BENEDICTION BANNER ─── */}
      <VedicGreetingBanner festivalName={chartData?.panchanga?.festival} />

      {/* ─── COSMIC LIFE JOURNEY ROADMAP (जीवन यात्रा) ─── */}
      <div className="glass-parchment rounded-2xl p-4 sm:p-5 border border-primary/25 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/20 pb-2.5">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" />
            <span className="text-xs font-heading font-bold uppercase tracking-wider text-primary">
              Your Cosmic Life Journey (जीवन यात्रा)
            </span>
          </div>
        </div>

        {/* 4-Stage Journey Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <button
            type="button"
            onClick={() => document.getElementById("section-blueprint")?.scrollIntoView({ behavior: "smooth" })}
            className="p-3 rounded-xl bg-card/50 hover:bg-primary/10 border border-border/30 hover:border-primary/40 transition-all text-left cursor-pointer group"
          >
            <span className="text-[9px] font-heading uppercase text-muted-foreground block">
              Stage 1
            </span>
            <span className="text-xs font-heading font-bold text-foreground group-hover:text-primary block">
              Soul Blueprint
            </span>
            <span className="text-[10px] text-muted-foreground font-sans truncate block">
              Lagna, Moon &amp; Sun
            </span>
          </button>

          <button
            type="button"
            onClick={() => document.getElementById("section-ayurveda")?.scrollIntoView({ behavior: "smooth" })}
            className="p-3 rounded-xl bg-card/50 hover:bg-primary/10 border border-border/30 hover:border-primary/40 transition-all text-left cursor-pointer group"
          >
            <span className="text-[9px] font-heading uppercase text-muted-foreground block">
              Stage 2
            </span>
            <span className="text-xs font-heading font-bold text-foreground group-hover:text-primary block">
              Body &amp; Wellness
            </span>
            <span className="text-[10px] text-muted-foreground font-sans truncate block">
              Ayurvedic Tridosha &amp; Agni
            </span>
          </button>

          <button
            type="button"
            onClick={() => document.getElementById("section-active-season")?.scrollIntoView({ behavior: "smooth" })}
            className="p-3 rounded-xl bg-card/50 hover:bg-primary/10 border border-border/30 hover:border-primary/40 transition-all text-left cursor-pointer group"
          >
            <span className="text-[9px] font-heading uppercase text-muted-foreground block">
              Stage 3
            </span>
            <span className="text-xs font-heading font-bold text-foreground group-hover:text-primary block">
              Current Season
            </span>
            <span className="text-[10px] text-muted-foreground font-sans truncate block">
              Active dasha cycle &amp; progress
            </span>
          </button>

          <button
            type="button"
            onClick={() => document.getElementById("section-life-horizon")?.scrollIntoView({ behavior: "smooth" })}
            className="p-3 rounded-xl bg-card/50 hover:bg-primary/10 border border-border/30 hover:border-primary/40 transition-all text-left cursor-pointer group"
          >
            <span className="text-[9px] font-heading uppercase text-muted-foreground block">
              Stage 4
            </span>
            <span className="text-xs font-heading font-bold text-foreground group-hover:text-primary block">
              Future Horizons
            </span>
            <span className="text-[10px] text-muted-foreground font-sans truncate block">
              Life epochs &amp; AI synthesis
            </span>
          </button>
          {/* Stage 5 Personal Muhurtha disabled per user request:
          <button
            type="button"
            onClick={() => document.getElementById("section-muhurtha")?.scrollIntoView({ behavior: "smooth" })}
            className="p-3 rounded-xl bg-card/50 hover:bg-primary/10 border border-border/30 hover:border-primary/40 transition-all text-left cursor-pointer group col-span-2 sm:col-span-1"
          >
            <span className="text-[9px] font-heading uppercase text-muted-foreground block">
              Stage 5
            </span>
            <span className="text-xs font-heading font-bold text-foreground group-hover:text-primary block">
              Personal Muhurtha
            </span>
            <span className="text-[10px] text-muted-foreground font-sans truncate block">
              Tarabala &amp; Chandrabala
            </span>
          </button>
          */}
        </div>
      </div>

      {/* ─── SAVED PROFILES QUICK SWITCHER ─────────────────────────── */}
      <div className="glass-parchment rounded-2xl p-4 sm:p-5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto scroll-thin pb-1 sm:pb-0">
          <Bookmark className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-xs font-heading tracking-wider uppercase text-muted-foreground mr-1 flex-shrink-0">
            Profiles:
          </span>
          {savedProfiles.length === 0 ? (
            <span className="text-xs text-muted-foreground italic">No saved profiles yet.</span>
          ) : (
            savedProfiles.map((p) => {
              const isActive = activeProfile && activeProfile.date === p.date && activeProfile.time === p.time;
              return (
                <div
                  key={p.id}
                  onClick={() => onSelectSavedProfile && onSelectSavedProfile(p)}
                  className={`group px-3 py-1.5 rounded-full text-xs font-heading tracking-wide flex items-center gap-2 cursor-pointer transition-all flex-shrink-0 border ${isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background/60 text-foreground/80 hover:text-foreground hover:bg-card border-border/40"
                    }`}
                >
                  <span>{p.name}</span>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteProfile(p.id, e)}
                    className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                    title="Remove saved profile"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Save Current Profile CTA */}
        <div className="flex items-center gap-2">
          {isSavingProfile ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={profileLabelInput}
                onChange={(e) => setProfileLabelInput(e.target.value)}
                placeholder="e.g. Myself, Partner..."
                className="px-3 py-1.5 text-xs bg-background/80 border border-primary/40 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-36 text-foreground"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveProfile}
                className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-heading tracking-wider uppercase rounded-lg hover:shadow-md transition-all cursor-pointer flex-shrink-0"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsSavingProfile(false)}
                className="px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer flex-shrink-0"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsSavingProfile(true);
                setProfileLabelInput(activeProfile?.city?.name ? `Chart (${activeProfile.city.name})` : "My Kundali");
              }}
              className="text-xs font-heading tracking-wider uppercase text-primary hover:underline flex items-center gap-1.5 cursor-pointer ml-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save Current Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── VEDIC BIG-3 & ARCHETYPE HERO ──────────────────────────── */}
      <div id="section-blueprint" className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Lagna (Ascendant) */}
        <div className="glass-parchment rounded-3xl p-5 sm:p-6 border border-primary/30 relative overflow-hidden group hover:border-primary/50 transition-all shadow-md">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Compass className="w-20 h-20 text-primary" />
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-heading uppercase tracking-widest text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
              Lagna • Physical Self
            </span>
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              {ascElement === "Fire" && <Flame className="w-3.5 h-3.5 text-amber-500" />}
              {ascElement === "Earth" && <Mountain className="w-3.5 h-3.5 text-emerald-500" />}
              {ascElement === "Air" && <Wind className="w-3.5 h-3.5 text-sky-400" />}
              {ascElement === "Water" && <Droplets className="w-3.5 h-3.5 text-blue-400" />}
              {ascElement} Sign
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-heading text-primary gold-glow mb-1">
            {ascSign}
          </h3>
          <div className="text-xs text-foreground/80 mb-3 font-mono">
            {ascDegree}° • Rising Ascendant
          </div>
          <p className="text-xs text-foreground/85 leading-relaxed font-sans mt-2">
            {ASCENDANT_INTERPRETATIONS[ascSign] || "Your physical constitution, vitality, natural temperament, and how you instinctively project energy onto the world."}
          </p>
        </div>

        {/* Chandra Rasi (Moon Sign & Nakshatra) */}
        <div className="glass-parchment rounded-3xl p-5 sm:p-6 border border-primary/30 relative overflow-hidden group hover:border-primary/50 transition-all shadow-md">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Moon className="w-20 h-20 text-primary" />
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-heading uppercase tracking-widest text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
              Chandra • Lunar Mind (Manas)
            </span>
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              {moonElement === "Fire" && <Flame className="w-3.5 h-3.5 text-amber-500" />}
              {moonElement === "Earth" && <Mountain className="w-3.5 h-3.5 text-emerald-500" />}
              {moonElement === "Air" && <Wind className="w-3.5 h-3.5 text-sky-400" />}
              {moonElement === "Water" && <Droplets className="w-3.5 h-3.5 text-blue-400" />}
              {moonElement} Sign
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-heading text-primary gold-glow mb-1">
            {moonSign}
          </h3>
          <div className="text-xs text-foreground/80 mb-3 font-mono">
            {moonNakshatra} (Pada {moonPada})
          </div>
          <p className="text-xs text-foreground/85 leading-relaxed font-sans mt-2">
            {MOON_SIGN_INTERPRETATIONS[moonSign] || "Your emotional psyche, instinctive reactions, subconscious security needs, and deep mental lens through which you experience reality."}
          </p>
        </div>

        {/* Surya Rasi (Sun Sign & Vitality) */}
        <div className="glass-parchment rounded-3xl p-5 sm:p-6 border border-primary/30 relative overflow-hidden group hover:border-primary/50 transition-all shadow-md">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sun className="w-20 h-20 text-primary" />
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-heading uppercase tracking-widest text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
              Surya • Soul Vitality
            </span>
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              {sunElement === "Fire" && <Flame className="w-3.5 h-3.5 text-amber-500" />}
              {sunElement === "Earth" && <Mountain className="w-3.5 h-3.5 text-emerald-500" />}
              {sunElement === "Air" && <Wind className="w-3.5 h-3.5 text-sky-400" />}
              {sunElement === "Water" && <Droplets className="w-3.5 h-3.5 text-blue-400" />}
              {sunElement} Sign
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-heading text-primary gold-glow mb-1">
            {sunSign}
          </h3>
          <div className="text-xs text-foreground/80 mb-3 font-mono">
            House {sunHouse} • Solar Radiance
          </div>
          <p className="text-xs text-foreground/85 leading-relaxed font-sans mt-2">
            {SUN_HOUSE_INTERPRETATIONS[sunHouse] || "Your conscious willpower, inner authority, soul purpose, and primary sphere of creative self-expression."}
          </p>
        </div>
      </div>

      {/* ─── JANMA NAKSHATRA SPOTLIGHT CARD ─────────────────────────── */}
      <div className="glass-parchment rounded-3xl p-6 sm:p-7 border border-primary/30 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-primary/15 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-heading tracking-widest uppercase text-primary">
                Janma Nakshatra Archetype
              </span>
            </div>
            <h4 className="text-2xl font-heading text-primary gold-glow">
              {moonNakshatra} • Pada {moonPada}
            </h4>
            <div className="text-sm font-serif italic text-muted-foreground">
              &ldquo;{nakshatraMeta.archetype}&rdquo;
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full md:w-auto text-center">
            <div className="px-3 py-2 bg-card/40 rounded-xl border border-border/30">
              <div className="text-[10px] font-heading tracking-wider uppercase text-muted-foreground">Ruling Lord</div>
              <div className="text-xs font-medium text-foreground mt-0.5 truncate max-w-[130px]">{nakshatraMeta.lord}</div>
            </div>
            <div className="px-3 py-2 bg-card/40 rounded-xl border border-border/30">
              <div className="text-[10px] font-heading tracking-wider uppercase text-muted-foreground">Element</div>
              <div className="text-xs font-medium text-foreground mt-0.5 truncate max-w-[130px]">{nakshatraMeta.element}</div>
            </div>
            <div className="px-3 py-2 bg-card/40 rounded-xl border border-border/30">
              <div className="text-[10px] font-heading tracking-wider uppercase text-muted-foreground">Quality</div>
              <div className="text-xs font-medium text-foreground mt-0.5 truncate max-w-[130px]">{nakshatraMeta.guna}</div>
            </div>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-foreground/85 leading-relaxed pt-4 font-sans">
          In classical Vedic Jyotish, your Janma Nakshatra (<strong>{moonNakshatra}</strong>) forms the core emotional lens and mental disposition of your psyche. Governed by <strong>{nakshatraMeta.lord}</strong>, it bestows {nakshatraMeta.essence}.
        </p>
      </div>

      {/* ─── SHORT & CRISP AI PERSONA INSIGHT CARD ──────────────────── */}
      <div className="glass-parchment rounded-3xl p-6 sm:p-7 border border-primary/30 shadow-lg space-y-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-lg font-heading text-primary gold-glow flex items-center gap-2">
                <span>Vedic Persona Insights</span>
                <span className="text-[10px] font-mono font-normal px-2 py-0.5 bg-primary/10 rounded-full border border-primary/20 text-primary uppercase">
                  AI Synthesis
                </span>
              </h4>
              <p className="text-xs text-muted-foreground">
                Synthesizing your Lagna, Moon mind, and Atmakaraka into an empowering archetype.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateAiPersona}
            disabled={isGeneratingAi}
            className="px-4 py-2 bg-primary/15 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/30 font-heading text-xs tracking-wider uppercase rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAi ? "animate-spin" : ""}`} />
            <span>{isGeneratingAi ? "Synthesizing..." : aiPersona ? "Refresh Persona" : "Reveal Vedic Persona"}</span>
          </button>
        </div>

        {aiPersona ? (
          <div className="pt-2 text-foreground font-sans text-xs sm:text-sm leading-relaxed prose prose-invert max-w-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aiPersona.split("###").filter(Boolean).map((section, idx) => {
                const lines = section.trim().split("\n");
                const title = lines[0] || "";
                const body = lines.slice(1).join("\n").trim();
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-card/40 border border-border/30 hover:border-primary/30 transition-all space-y-1.5"
                  >
                    <h5 className="font-heading text-sm text-primary flex items-center gap-1.5">
                      {title}
                    </h5>
                    <p className="text-xs text-foreground/80 leading-relaxed font-sans">
                      {body}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : isGeneratingAi ? (
          <div className="py-8 text-center space-y-3 animate-pulse">
            <Sparkles className="w-8 h-8 text-primary mx-auto animate-spin" />
            <p className="text-xs font-serif italic text-muted-foreground">
              Consulting classical Parashari principles and weaving cognitive patterns...
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-card/30 border border-dashed border-primary/20 text-center space-y-2">
            <p className="text-xs text-muted-foreground font-serif italic">
              Tap &ldquo;Reveal Vedic Persona&rdquo; to generate a short, punchy 4-point breakdown of your Core Superpower, Emotional Mindset, Soul Ambition, and Conscious Blind Spot.
            </p>
          </div>
        )}
      </div>

      {/* ─── AYURVEDIC CONSTITUTION & TRIDOSHA PRAKRITI ─────────────── */}
      <div id="section-ayurveda">
        <AyurvedaSection
          ascSign={ascSign}
          moonSign={moonSign}
          sunSign={sunSign}
        />
      </div>

      {/* ─── ACTIVE DASHA SPOTLIGHT & FULL TIMELINE ─────────────────── */}
      {activeDashaInfo && (
        <div id="section-active-season" className="glass-parchment rounded-3xl p-6 sm:p-7 border border-primary/30 shadow-lg space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-primary/15 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-heading tracking-widest uppercase text-primary">
                  Cosmic Time Cycle • Active Now
                </span>
                <h4 className="text-xl sm:text-2xl font-heading text-primary gold-glow">
                  {activeDashaInfo.mahadasha.lord} Mahadasha • {activeDashaInfo.antardasha?.lord} Antardasha
                </h4>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowFullTimeline(!showFullTimeline)}
              className="px-3.5 py-1.5 text-xs font-heading tracking-wider uppercase text-primary border border-primary/30 hover:bg-primary/10 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <span>{showFullTimeline ? "Hide 120-Year Timeline" : "View 120-Year Timeline"}</span>
              {showFullTimeline ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Dasha Countdown & Progress */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-card/40 border border-border/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-heading text-foreground/80 uppercase tracking-wider text-[11px]">
                  Maha Dasha ({activeDashaInfo.mahadasha.lord})
                </span>
                <span className="text-primary font-mono font-bold text-xs">
                  {activeDashaInfo.mdProgress}% elapsed
                </span>
              </div>
              <div className="w-full h-2 bg-primary/10 rounded-full overflow-hidden">
                <div
                  style={{ width: `${activeDashaInfo.mdProgress}%` }}
                  className="h-full bg-primary rounded-full shadow-[0_0_8px_hsla(var(--primary)/0.6)] transition-all duration-700 ease-out"
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                <span>{formatDate(activeDashaInfo.mahadasha.start)}</span>
                <span>{formatDate(activeDashaInfo.mahadasha.end)}</span>
              </div>
            </div>

            {activeDashaInfo.antardasha && (
              <div className="p-4 rounded-2xl bg-card/40 border border-border/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-heading text-foreground/80 uppercase tracking-wider text-[11px]">
                    Sub-Period ({activeDashaInfo.antardasha.lord} Antardasha)
                  </span>
                  <span className="text-primary font-mono font-bold text-xs">
                    {activeDashaInfo.adProgress}% elapsed
                  </span>
                </div>
                <div className="w-full h-2 bg-primary/10 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${activeDashaInfo.adProgress}%` }}
                    className="h-full bg-amber-500 rounded-full shadow-[0_0_8px_hsla(38,92%,50%,0.6)] transition-all duration-700 ease-out"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                  <span>{formatDate(activeDashaInfo.antardasha.start)}</span>
                  <span>{formatDate(activeDashaInfo.antardasha.end)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Dasha Energetic Theme Description */}
          <div className="p-4 rounded-2xl bg-card/30 border border-primary/20 space-y-1.5">
            <div className="text-xs font-heading text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Current Cycle Focus & Psychological Theme</span>
            </div>
            <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed font-sans">
              <strong>{activeDashaInfo.mahadasha.lord}</strong> activates{" "}
              {PLANET_ENERGY_THEMES[activeDashaInfo.mahadasha.lord]?.theme.toLowerCase() || "major cosmic themes"} (
              {PLANET_ENERGY_THEMES[activeDashaInfo.mahadasha.lord]?.focus || "unfolding karmic potentials"}), while the sub-influence of{" "}
              <strong>{activeDashaInfo.antardasha?.lord}</strong> brings a focused season of{" "}
              {PLANET_ENERGY_THEMES[activeDashaInfo.antardasha?.lord]?.theme.toLowerCase() || "dynamic evolution"}.
            </p>
          </div>

          {/* Expandable 120-Year Timeline */}
          {showFullTimeline && (
            <div className="pt-4 border-t border-primary/20 overflow-hidden transition-all duration-300">
              <div className="mb-3 text-xs text-muted-foreground font-serif italic">
                Complete 120-Year Vimshottari Dasha sequence calculated specifically for your birth Nakshatra balance:
              </div>
              <DashaTimeline timeline={chartData.vimshottari_timeline || []} className="w-full" />
            </div>
          )}
        </div>
      )}

      {/* ─── PREDICTIVE LIFE DOMAIN TIMELINE (CAREER, EDUCATION, MARRIAGE, SPIRITUALITY) ─── */}
      {lifePhases.length > 0 && (
        <div id="section-life-horizon" className="glass-parchment rounded-3xl p-6 sm:p-7 border border-primary/30 shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-primary/15 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-heading tracking-widest uppercase text-primary">
                  Vedic Epochs • Predictive Life Timeline
                </span>
                <h4 className="text-xl sm:text-2xl font-heading text-primary gold-glow">
                  Life Horizon &amp; Domain Evolution
                </h4>
              </div>
            </div>

            {/* Actions: AI Synthesis & Domain Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <button
                type="button"
                onClick={handleAnalyzeTimelineAi}
                disabled={isAnalyzingTimeline}
                className="px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-heading tracking-wider uppercase font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                title="Synthesize this timeline with your chart's Lagna, house lordships, and dasha lords"
              >
                {isAnalyzingTimeline ? (
                  <span className="animate-spin w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>{isAnalyzingTimeline ? "Synthesizing..." : "⚡ Analyze with AI Rishi"}</span>
              </button>

              {/* Domain Switcher */}
              <div className="flex items-center gap-1.5 overflow-x-auto scroll-thin pb-1 sm:pb-0">
                {[
                  { id: "all", label: "All Spheres", icon: Sparkles },
                  { id: "career", label: "Career & Vocation", icon: Briefcase },
                  { id: "education", label: "Education & Mind", icon: GraduationCap },
                  { id: "wealth", label: "Wealth & Assets", icon: Coins },
                  { id: "relationships", label: "Marriage & Alliances", icon: Heart },
                  { id: "health", label: "Health & Vitality", icon: ShieldAlert },
                  { id: "travel", label: "Travel & Relocation", icon: Plane },
                  { id: "spirituality", label: "Spirituality & Moksha", icon: Target },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = timelineDomain === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setTimelineDomain(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-heading tracking-wider uppercase flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0 border ${isActive
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-background/60 text-muted-foreground hover:text-foreground hover:bg-card border-border/40"
                        }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* AI Deep Timeline Analysis Streaming Card */}
          {showTimelineAiCard && (
            <div className="p-5 sm:p-6 rounded-2xl bg-primary/5 border border-primary/30 space-y-3 relative animate-fadeIn shadow-md">
              <div className="flex items-center justify-between border-b border-primary/20 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h5 className="font-heading text-sm sm:text-base text-primary gold-glow font-bold">
                    AI Rishi Timeline Synthesis • {timelineDomain === "all" ? "All Spheres" : timelineDomain.toUpperCase()}
                  </h5>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(aiTimelineAnalysis);
                      showToast("Analysis copied to clipboard!", "success");
                    }}
                    disabled={!aiTimelineAnalysis}
                    className="text-xs text-muted-foreground hover:text-foreground font-heading cursor-pointer px-2.5 py-1 rounded-md bg-card/60 border border-border/30"
                    title="Copy analysis"
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTimelineAiCard(false)}
                    className="text-xs text-muted-foreground hover:text-foreground font-heading cursor-pointer px-2.5 py-1 rounded-md bg-card/60 border border-border/30"
                  >
                    Dismiss
                  </button>
                </div>
              </div>

              {/* Accuracy & Precision Callout */}
              <div className="text-[11px] text-muted-foreground font-sans bg-card/50 p-2.5 rounded-xl border border-border/20 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-foreground">Timeline Precision Context:</span>{" "}
                  The underlying Vimshottari Dasha dates are calculated to 100% astronomical accuracy via NASA JPL Swiss Ephemeris (<code className="text-primary font-mono text-[10px]">swiss-eph</code>). The cards below display classical planetary archetypes, while the AI Rishi above tailors the synthesis specifically to your <strong>{ascSign}</strong> Lagna, house lordships, and planetary dignities.
                </div>
              </div>

              {isAnalyzingTimeline && !aiTimelineAnalysis && (
                <div className="py-6 flex items-center justify-center gap-2 text-xs font-heading text-primary">
                  <span className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                  <span>Synthesizing planetary lordships, Dasha sequence, and {timelineDomain} trajectory...</span>
                </div>
              )}

              {aiTimelineAnalysis && (
                <div className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm text-foreground/90 font-serif leading-relaxed whitespace-pre-wrap">
                  {aiTimelineAnalysis}
                </div>
              )}
            </div>
          )}

          {/* Timeline Phase Cards */}
          <div className="space-y-4">
            {lifePhases.map((phase, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-2xl border transition-all ${phase.isCurrent
                    ? "bg-primary/5 border-primary/50 shadow-md ring-1 ring-primary/30"
                    : phase.isPast
                      ? "bg-card/30 border-border/30 opacity-75 hover:opacity-100"
                      : "bg-card/40 border-border/40 hover:border-primary/30"
                  }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/20 pb-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-heading font-bold text-sm shrink-0">
                      {phase.lord.slice(0, 2)}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="font-heading text-base text-foreground font-bold">
                          {phase.lord} Mahadasha
                        </h5>
                        <span className="text-xs font-mono text-muted-foreground">
                          ({phase.startYear} – {phase.endYear})
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-card border border-border/30 text-muted-foreground">
                          Age {phase.startAge} – {phase.endAge}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {phase.functionalBadge && (
                          <span className="text-[10px] font-heading font-bold px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary">
                            {phase.functionalBadge}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-[11px] font-heading text-primary font-semibold">
                          <Sparkles className="w-3 h-3 text-primary shrink-0" />
                          <span>{phase.milestoneTitle}</span>
                        </span>
                      </div>
                      {phase.functionalRole && (
                        <p className="text-[10px] text-muted-foreground font-serif pt-0.5">
                          Chart Functional Role: {phase.functionalRole}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div>
                      {phase.isCurrent ? (
                        <span className="px-2.5 py-1 rounded-full bg-primary text-primary-foreground font-heading text-[10px] tracking-wider uppercase font-bold shadow-sm">
                          Active Now
                        </span>
                      ) : phase.isPast ? (
                        <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-heading text-[10px] tracking-wider uppercase">
                          Foundational Phase
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-card border border-border/40 text-foreground/80 font-heading text-[10px] tracking-wider uppercase">
                          Upcoming Horizon
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Domain Content Breakdown */}
                {timelineDomain === "all" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-background/50 border border-border/20 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-heading text-primary uppercase tracking-wide">
                        <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                        <span>Career &amp; Vocation</span>
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed font-sans">
                        {phase.forecast.career}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-background/50 border border-border/20 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-heading text-primary uppercase tracking-wide">
                        <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Education &amp; Intellect</span>
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed font-sans">
                        {phase.forecast.education}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-background/50 border border-border/20 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-heading text-primary uppercase tracking-wide">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        <span>Wealth &amp; Assets</span>
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed font-sans">
                        {phase.forecast.wealth}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-background/50 border border-border/20 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-heading text-primary uppercase tracking-wide">
                        <Heart className="w-3.5 h-3.5 text-rose-400" />
                        <span>Marriage &amp; Relationships</span>
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed font-sans">
                        {phase.forecast.relationships}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-background/50 border border-border/20 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-heading text-primary uppercase tracking-wide">
                        <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Health &amp; Vitality</span>
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed font-sans">
                        {phase.forecast.health}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-background/50 border border-border/20 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-heading text-primary uppercase tracking-wide">
                        <Plane className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Travel &amp; Relocation</span>
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed font-sans">
                        {phase.forecast.travel}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-background/50 border border-border/20 space-y-1 md:col-span-2 lg:col-span-3">
                      <div className="flex items-center gap-1.5 text-xs font-heading text-primary uppercase tracking-wide">
                        <Target className="w-3.5 h-3.5 text-sky-400" />
                        <span>Spirituality &amp; Dharma</span>
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed font-sans">
                        {phase.forecast.spirituality}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-background/50 border border-border/30 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-heading text-primary uppercase tracking-wider">
                      {timelineDomain === "career" && <Briefcase className="w-4 h-4 text-amber-500" />}
                      {timelineDomain === "education" && <GraduationCap className="w-4 h-4 text-emerald-500" />}
                      {timelineDomain === "wealth" && <Coins className="w-4 h-4 text-amber-400" />}
                      {timelineDomain === "relationships" && <Heart className="w-4 h-4 text-rose-400" />}
                      {timelineDomain === "health" && <ShieldAlert className="w-4 h-4 text-emerald-400" />}
                      {timelineDomain === "travel" && <Plane className="w-4 h-4 text-indigo-400" />}
                      {timelineDomain === "spirituality" && <Target className="w-4 h-4 text-sky-400" />}
                      <span>
                        {timelineDomain === "career" && "Career & Professional Trajectory Focus"}
                        {timelineDomain === "education" && "Education, Acquired Knowledge & Intellectual Mastery"}
                        {timelineDomain === "wealth" && "Wealth, Capital Assets & Financial Growth"}
                        {timelineDomain === "relationships" && "Marriage, Romantic Affinity & Relational Alliances"}
                        {timelineDomain === "health" && "Health, Vitality & Physical Resilience"}
                        {timelineDomain === "travel" && "Travel, Relocation & Distant Explorations"}
                        {timelineDomain === "spirituality" && "Spiritual Awakening, Self-Realization & Dharma"}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-foreground/85 leading-relaxed font-sans">
                      {timelineDomain === "career" && phase.forecast.career}
                      {timelineDomain === "education" && phase.forecast.education}
                      {timelineDomain === "wealth" && phase.forecast.wealth}
                      {timelineDomain === "relationships" && phase.forecast.relationships}
                      {timelineDomain === "health" && phase.forecast.health}
                      {timelineDomain === "travel" && phase.forecast.travel}
                      {timelineDomain === "spirituality" && phase.forecast.spirituality}
                    </p>
                    <div className="pt-2 text-[11px] font-mono text-muted-foreground border-t border-border/15">
                      Core Energetic Tone: {phase.forecast.energy}
                    </div>
                  </div>
                )}

                {/* Antardasha (Sub-Period) Drilldown Explorer */}
                {phase.antardashas && phase.antardashas.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-border/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setExpandedEpochs((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                        className="flex items-center gap-1.5 text-xs font-heading text-primary font-bold uppercase tracking-wider hover:underline cursor-pointer"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>
                          {expandedEpochs[idx] ? "Hide Antardashas (Sub-Periods)" : `Explore 9 Antardashas (${phase.lord} Sub-Periods)`}
                        </span>
                        {expandedEpochs[idx] ? (
                          <ChevronUp className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-primary" />
                        )}
                      </button>

                      {phase.isCurrent && (
                        <span className="text-[10px] font-mono text-primary font-medium hidden sm:inline">
                          Active Epoch • Drill Down into Sub-Periods
                        </span>
                      )}
                    </div>

                    {/* Expanded Antardasha Explorer */}
                    {expandedEpochs[idx] && (
                      <div className="space-y-4 pt-2 animate-fadeIn">
                        {/* Antardasha Timeline Track / Badges */}
                        <div className="flex items-center gap-2 overflow-x-auto scroll-thin pb-2">
                          {phase.antardashas.map((ad, adIdx) => {
                            const isAdSelected =
                              (selectedSubPeriod[idx] ??
                                (phase.antardashas.findIndex((a) => a.isCurrent) !== -1
                                  ? phase.antardashas.findIndex((a) => a.isCurrent)
                                  : 0)) === adIdx;
                            return (
                              <button
                                key={adIdx}
                                type="button"
                                onClick={() => setSelectedSubPeriod((prev) => ({ ...prev, [idx]: adIdx }))}
                                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer shrink-0 min-w-[125px] ${isAdSelected
                                    ? "bg-primary/20 border-primary shadow-sm ring-1 ring-primary/40 text-foreground"
                                    : ad.isCurrent
                                      ? "bg-primary/10 border-primary/40 text-foreground"
                                      : ad.isPast
                                        ? "bg-card/30 border-border/20 text-muted-foreground opacity-75"
                                        : "bg-card/50 border-border/30 text-foreground/80 hover:bg-card"
                                  }`}
                              >
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="font-heading text-xs font-bold text-primary">
                                    {ad.lord}
                                  </span>
                                  {ad.isCurrent ? (
                                    <span className="px-1.5 py-0.2 rounded-full bg-primary text-primary-foreground text-[8px] font-heading font-extrabold uppercase animate-pulse">
                                      Now
                                    </span>
                                  ) : ad.isPast ? (
                                    <span className="text-[8px] font-mono text-muted-foreground">Past</span>
                                  ) : (
                                    <span className="text-[8px] font-mono text-muted-foreground">Ahead</span>
                                  )}
                                </div>
                                <div className="text-[10px] font-mono text-muted-foreground">
                                  {ad.startFormatted.slice(0, 5)} - {ad.endFormatted.slice(0, 5)}
                                </div>
                                {ad.isCurrent && (
                                  <div className="w-full h-1 bg-card rounded-full overflow-hidden mt-1.5">
                                    <div className="h-full bg-primary" style={{ width: `${ad.progressPercent}%` }} />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Selected Antardasha Domain Breakdown */}
                        {(() => {
                          const currentAdIdx =
                            selectedSubPeriod[idx] ??
                            (phase.antardashas.findIndex((a) => a.isCurrent) !== -1
                              ? phase.antardashas.findIndex((a) => a.isCurrent)
                              : 0);
                          const activeAd = phase.antardashas[currentAdIdx] || phase.antardashas[0];
                          if (!activeAd) return null;

                          return (
                            <div className="p-4 rounded-2xl bg-card/60 border border-primary/20 space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/20 pb-2.5">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-heading font-bold text-primary">
                                      {phase.lord} Mahadasha • {activeAd.lord} Antardasha
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-mono">
                                      {activeAd.startFormatted} – {activeAd.endFormatted}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground font-serif mt-0.5">
                                    {activeAd.milestoneTitle}
                                  </p>
                                </div>
                              </div>

                              {/* Render Domain Breakdown for this Antardasha */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                                <div className="p-2.5 rounded-xl bg-background/50 border border-border/20 space-y-1">
                                  <div className="flex items-center gap-1.5 text-xs font-heading text-primary uppercase">
                                    <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                                    <span>Career & Vocation</span>
                                  </div>
                                  <p className="text-xs text-foreground/80 font-sans leading-relaxed">
                                    {activeAd.forecast.career}
                                  </p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-background/50 border border-border/20 space-y-1">
                                  <div className="flex items-center gap-1.5 text-xs font-heading text-primary uppercase">
                                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Wealth & Assets</span>
                                  </div>
                                  <p className="text-xs text-foreground/80 font-sans leading-relaxed">
                                    {activeAd.forecast.wealth}
                                  </p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-background/50 border border-border/20 space-y-1">
                                  <div className="flex items-center gap-1.5 text-xs font-heading text-primary uppercase">
                                    <Heart className="w-3.5 h-3.5 text-rose-400" />
                                    <span>Relationships & Marriage</span>
                                  </div>
                                  <p className="text-xs text-foreground/80 font-sans leading-relaxed">
                                    {activeAd.forecast.relationships}
                                  </p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-background/50 border border-border/20 space-y-1">
                                  <div className="flex items-center gap-1.5 text-xs font-heading text-primary uppercase">
                                    <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>Education & Mind</span>
                                  </div>
                                  <p className="text-xs text-foreground/80 font-sans leading-relaxed">
                                    {activeAd.forecast.education}
                                  </p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-background/50 border border-border/20 space-y-1">
                                  <div className="flex items-center gap-1.5 text-xs font-heading text-primary uppercase">
                                    <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Health & Vitality</span>
                                  </div>
                                  <p className="text-xs text-foreground/80 font-sans leading-relaxed">
                                    {activeAd.forecast.health}
                                  </p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-background/50 border border-border/20 space-y-1">
                                  <div className="flex items-center gap-1.5 text-xs font-heading text-primary uppercase">
                                    <Target className="w-3.5 h-3.5 text-sky-400" />
                                    <span>Spirituality & Dharma</span>
                                  </div>
                                  <p className="text-xs text-foreground/80 font-sans leading-relaxed">
                                    {activeAd.forecast.spirituality}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TOP AUSPICIOUS YOGAS & FORMATIONS SPOTLIGHT ─────────────────── */}
      {topYogas.length > 0 && (
        <div className="glass-parchment rounded-3xl p-6 sm:p-7 border border-primary/30 shadow-lg space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap border-b border-primary/15 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-heading tracking-widest uppercase text-primary">
                  Classical Planetary Combinations
                </span>
                <h4 className="text-xl sm:text-2xl font-heading text-primary gold-glow">
                  Prominent Auspicious Yogas
                </h4>
              </div>
            </div>

            {onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab("chart")}
                className="text-xs font-heading tracking-wider uppercase text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All Yogas &amp; Doshas ({chartData?.yogas?.length || 0}) →</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topYogas.map((yoga: any, i: number) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-card/40 border border-border/30 hover:border-primary/40 transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <h5 className="font-heading text-sm text-primary font-bold">
                    {yoga.name}
                  </h5>
                  <span className="text-[10px] font-heading uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-medium">
                    Auspicious
                  </span>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed font-sans">
                  {yoga.description || "A powerful classical planetary combination strengthening natural prosperity, character, and intellect."}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── PERSONAL SHUBH MUHURTHA (Disabled per user request) ─── */}
      {/*
      <div id="section-muhurtha" className="glass-parchment rounded-3xl p-6 sm:p-7 border border-primary/30 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-primary/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-heading tracking-widest uppercase text-primary">
                Personalized Electional Timing • Vyakti-Vishesh
              </span>
              <h4 className="text-xl sm:text-2xl font-heading text-primary gold-glow">
                Personal Shubh Muhurtha (शुभ मुहूर्त)
              </h4>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPersonalMuhurtha(!showPersonalMuhurtha)}
            className="px-4 py-2 rounded-xl text-xs font-heading uppercase tracking-wider bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{showPersonalMuhurtha ? "Hide Personal Console" : "Check Personal Muhurtha"}</span>
          </button>
        </div>

        <p className="text-xs text-muted-foreground font-serif leading-relaxed">
          While Universal Panchang Muhurtha evaluates general cosmic quality, authentic classical Jyotish requires <strong>Vyakti-Vishesh</strong> alignment: evaluating whether the moment&apos;s Nakshatra is your auspicious <em>Tarabala</em> (avoiding Naidhana/Vipat Tara) and whether the transit Moon avoids your 8th house (<em>Ashtama Chandra</em>) relative to your <strong>{moonNakshatra}</strong> Moon in <strong>{moonSign}</strong>.
        </p>

        {showPersonalMuhurtha && (
          <div className="pt-2 border-t border-border/20">
            <MuhurthaSection
              birthMoonNakshatra={moonNakshatra}
              birthMoonSign={moonSign}
              profileName={activeProfile?.city?.name ? `Chart (${activeProfile.city.name})` : "My Kundali"}
              initialCity={activeProfile?.city}
            />
          </div>
        )}
      </div>
      */}

      {/* ─── 4 PURUSHARTHAS & PANCHA MAHABHUTA DUAL SECTION ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 4 Purusharthas (Life Pillars) */}
        <div className="glass-parchment rounded-3xl p-6 border border-primary/30 shadow-md space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-xs font-heading tracking-widest uppercase text-primary">
                Four Purusharthas • Soul Aims
              </span>
            </div>
            <h4 className="text-lg font-heading text-foreground">
              Life Orientation Matrix
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Dominant aim: <span className="text-primary font-medium">{purusharthas.dominant}</span>
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {/* Dharma */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-heading text-foreground/80 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-amber-500" /> Dharma (Houses 1, 5, 9)
                </span>
                <span className="font-mono text-muted-foreground">{purusharthas.dharma}%</span>
              </div>
              <div className="w-full h-2 bg-card rounded-full overflow-hidden border border-border/40">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${purusharthas.dharma}%` }} />
              </div>
            </div>

            {/* Artha */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-heading text-foreground/80 flex items-center gap-1.5">
                  <Mountain className="w-3.5 h-3.5 text-emerald-500" /> Artha (Houses 2, 6, 10)
                </span>
                <span className="font-mono text-muted-foreground">{purusharthas.artha}%</span>
              </div>
              <div className="w-full h-2 bg-card rounded-full overflow-hidden border border-border/40">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${purusharthas.artha}%` }} />
              </div>
            </div>

            {/* Kama */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-heading text-foreground/80 flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-sky-400" /> Kama (Houses 3, 7, 11)
                </span>
                <span className="font-mono text-muted-foreground">{purusharthas.kama}%</span>
              </div>
              <div className="w-full h-2 bg-card rounded-full overflow-hidden border border-border/40">
                <div className="h-full bg-sky-400 rounded-full" style={{ width: `${purusharthas.kama}%` }} />
              </div>
            </div>

            {/* Moksha */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-heading text-foreground/80 flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-blue-400" /> Moksha (Houses 4, 8, 12)
                </span>
                <span className="font-mono text-muted-foreground">{purusharthas.moksha}%</span>
              </div>
              <div className="w-full h-2 bg-card rounded-full overflow-hidden border border-border/40">
                <div className="h-full bg-blue-400 rounded-full" style={{ width: `${purusharthas.moksha}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Pancha Mahabhuta Elements */}
        <div className="glass-parchment rounded-3xl p-6 border border-primary/30 shadow-md space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-primary" />
              <span className="text-xs font-heading tracking-widest uppercase text-primary">
                Pancha Mahabhuta • Elemental Balance
              </span>
            </div>
            <h4 className="text-lg font-heading text-foreground">
              Cosmic Elemental Signature
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Dominant tone: <span className="text-primary font-medium">{elementalBalance.dominant}</span>
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {/* Fire */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-heading text-foreground/80 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-500" /> Fire (Agni • Willpower & Vision)
                </span>
                <span className="font-mono text-muted-foreground">{elementalBalance.firePct}%</span>
              </div>
              <div className="w-full h-2 bg-card rounded-full overflow-hidden border border-border/40">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${elementalBalance.firePct}%` }} />
              </div>
            </div>

            {/* Earth */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-heading text-foreground/80 flex items-center gap-1.5">
                  <Mountain className="w-3.5 h-3.5 text-emerald-500" /> Earth (Prithvi • Stability & Realization)
                </span>
                <span className="font-mono text-muted-foreground">{elementalBalance.earthPct}%</span>
              </div>
              <div className="w-full h-2 bg-card rounded-full overflow-hidden border border-border/40">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${elementalBalance.earthPct}%` }} />
              </div>
            </div>

            {/* Air */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-heading text-foreground/80 flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-sky-400" /> Air (Vayu • Concept & Adaptability)
                </span>
                <span className="font-mono text-muted-foreground">{elementalBalance.airPct}%</span>
              </div>
              <div className="w-full h-2 bg-card rounded-full overflow-hidden border border-border/40">
                <div className="h-full bg-sky-400 rounded-full" style={{ width: `${elementalBalance.airPct}%` }} />
              </div>
            </div>

            {/* Water */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-heading text-foreground/80 flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-blue-400" /> Water (Jala • Empathy & Depth)
                </span>
                <span className="font-mono text-muted-foreground">{elementalBalance.waterPct}%</span>
              </div>
              <div className="w-full h-2 bg-card rounded-full overflow-hidden border border-border/40">
                <div className="h-full bg-blue-400 rounded-full" style={{ width: `${elementalBalance.waterPct}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── CORE PLANETARY COUNCIL (KEY INFLUENCES) ───────────────── */}
      <div className="glass-parchment rounded-3xl p-6 sm:p-7 border border-primary/30 shadow-lg space-y-4">
        <div>
          <span className="text-[10px] font-heading tracking-widest uppercase text-primary">
            Planetary Council • Core Celestial Pillars
          </span>
          <h4 className="text-xl font-heading text-primary gold-glow">
            Your Dominant Cosmic Guides
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Champion Planet */}
          <div className="p-4 rounded-2xl bg-card/40 border border-border/30 space-y-2">
            <div className="flex items-center gap-2 text-primary font-heading text-sm">
              <Award className="w-4 h-4" />
              <span>Shadbala Champion</span>
            </div>
            <div className="text-lg font-heading text-foreground">
              {planetaryCouncil.champion.name}
            </div>
            <div className="text-[11px] font-mono text-muted-foreground">
              Strength Ratio: {planetaryCouncil.champion.ratio}x ({planetaryCouncil.champion.rupas} Rupas)
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your functionally strongest planetary reservoir. It represents the energy that will produce the most reliable, unassisted victories when leaned on.
            </p>
          </div>

          {/* Atmakaraka */}
          <div className="p-4 rounded-2xl bg-card/40 border border-border/30 space-y-2">
            <div className="flex items-center gap-2 text-primary font-heading text-sm">
              <Crown className="w-4 h-4" />
              <span>Atmakaraka (AK)</span>
            </div>
            <div className="text-lg font-heading text-foreground">
              {planetaryCouncil.atmakaraka}
            </div>
            <div className="text-[11px] font-mono text-muted-foreground">
              Soul Significator (Jaimini Highest Longitude)
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The planet reflecting your soul&apos;s deepest karmic lesson and spiritual evolution in this incarnation. Its maturity defines your inner contentment.
            </p>
          </div>

          {/* Key Benefic */}
          <div className="p-4 rounded-2xl bg-card/40 border border-border/30 space-y-2">
            <div className="flex items-center gap-2 text-primary font-heading text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Guiding Benefic</span>
            </div>
            <div className="text-lg font-heading text-foreground">
              {planetaryCouncil.benefic}
            </div>
            <div className="text-[11px] font-mono text-muted-foreground">
              Harmonizer & Grace Indicator
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Provides the gentle grace, ease, and diplomatic solutions to offset harsh life transitions. Call upon its themes for emotional recalibration.
            </p>
          </div>
        </div>

        {/* Action Bar Linking to Deep Analysis */}
        <div className="pt-4 border-t border-primary/15 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-muted-foreground font-serif italic">
            Looking for deeper technical charts, divisional vargas, or instant answers?
          </span>
          <div className="flex items-center gap-2">
            {onNavigateToTab && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigateToTab("chart")}
                  className="px-3 py-1.5 bg-card hover:bg-card/80 border border-border/40 rounded-lg text-primary font-heading tracking-wider uppercase text-[11px] transition-all cursor-pointer"
                >
                  Calculations & Vargas →
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateToTab("chat")}
                  className="px-3 py-1.5 bg-card hover:bg-card/80 border border-border/40 rounded-lg text-primary font-heading tracking-wider uppercase text-[11px] transition-all cursor-pointer"
                >
                  Ask AI Rishi →
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateToTab("report")}
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg font-heading tracking-wider uppercase text-[11px] hover:shadow-md transition-all cursor-pointer"
                >
                  Generate 3-Page Report →
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
