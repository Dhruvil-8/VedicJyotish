// Classical Vedic Jyotish dynamic interpretations derived from Brihat Parashara Hora Shastra,
// Phaladeepika, and Saravali. Provides concise, psychological, non-fatalistic insights.

// ─── 12 ASCENDANT (LAGNA) INTERPRETATIONS ──────────────────────────────────────
export const ASCENDANT_INTERPRETATIONS: Record<string, string> = {
  Aries: "Aries Ascendant confers a trailblazing, courageous vitality with direct initiative, high physical stamina, and a natural instinct to pioneer new paths.",
  Taurus: "Taurus Ascendant gives an unshakeable, patient temperament with practical determination, aesthetic appreciation, and a grounded desire for enduring stability.",
  Gemini: "Gemini Ascendant grants an agile, curious intellect with versatile communication skills, perpetual hunger for knowledge, and quick social adaptability.",
  Cancer: "Cancer Ascendant brings a deeply empathetic, protective demeanor with intuitive emotional intelligence, tenacity, and devotion to home and kin.",
  Leo: "Leo Ascendant radiates natural sovereignty, magnetic dignity, and generous leadership, fueled by strong creative self-expression and honor.",
  Virgo: "Virgo Ascendant bestows a sharp analytical mind with meticulous craftsmanship, pragmatic discernment, and a constructive drive to refine and serve.",
  Libra: "Libra Ascendant provides innate diplomatic poise, aesthetic refinement, balanced judgment, and a natural gift for harmonizing partnerships.",
  Scorpio: "Scorpio Ascendant gives penetrating emotional depth, strategic resilience, unwavering will, and the profound capacity for inner regeneration.",
  Sagittarius: "Sagittarius Ascendant brings expansive optimism, philosophical thirst, righteous courage, and an adventurous quest for higher truth.",
  Capricorn: "Capricorn Ascendant instills quiet perseverance, pragmatic ambition, strategic patience, and an enduring respect for discipline and duty.",
  Aquarius: "Aquarius Ascendant confers visionary perspective, humanitarian ideals, intellectual independence, and a flair for unconventional progress.",
  Pisces: "Pisces Ascendant radiates compassionate empathy, imaginative depth, spiritual receptivity, and an innate connection to universal wisdom.",
};

// ─── 12 MOON SIGN (CHANDRA RASI) INTERPRETATIONS ──────────────────────────────
export const MOON_SIGN_INTERPRETATIONS: Record<string, string> = {
  Aries: "Moon in Aries responds to life with spontaneous passion, quick emotional recovery, and a fiery desire to resolve dilemmas head-on without delay.",
  Taurus: "Exalted Moon in Taurus fosters deep emotional calmness, sensory contentment, unwavering loyalty, and great psychological fortitude under crisis.",
  Gemini: "Moon in Gemini processes feelings intellectually, finding emotional comfort in dialogue, varied ideas, wit, and mental stimulation.",
  Cancer: "Swa-kshetra Moon in Cancer gives rich emotional memory, deep maternal empathy, strong protective instincts, and acute psychic sensitivity.",
  Leo: "Moon in Leo craves heartfelt appreciation and respect, expressing affection with warmth, dramatic loyalty, and sovereign pride.",
  Virgo: "Moon in Virgo seeks security through order, helpfulness, and logical analysis, quietly attending to every practical necessity for loved ones.",
  Libra: "Moon in Libra finds peace in mutual respect and aesthetic grace, constantly weighing perspectives to preserve relational equilibrium.",
  Scorpio: "Debilitated Moon in Scorpio possesses formidable psychological insight and passionate depth, learning to transform vulnerability into spiritual power.",
  Sagittarius: "Moon in Sagittarius maintains inspiring optimism, seeking emotional freedom through philosophy, travel, humor, and philosophical ideals.",
  Capricorn: "Moon in Capricorn demonstrates mature self-restraint and stoic endurance, showing love through dependable, tangible duty and responsibility.",
  Aquarius: "Moon in Aquarius approaches emotions with objective fairness, prioritizing collective welfare, authentic freedom, and intellectual kinship.",
  Pisces: "Moon in Pisces experiences reality through porous emotional empathy, artistic imagination, selfless forgiveness, and mystical resonance.",
};

// ─── 12 SUN HOUSES INTERPRETATIONS ────────────────────────────────────────────
export const SUN_HOUSE_INTERPRETATIONS: Record<number, string> = {
  1: "Sun in the 1st House illuminates personal identity with commanding presence, strong constitution, and an independent sense of sovereign leadership.",
  2: "Sun in the 2nd House channels vital energy into family legacy, articulate speech, value systems, and generating principled financial resources.",
  3: "Sun in the 3rd House energizes mental courage, dynamic initiatives, communicative boldness, and relentless drive in competitive endeavors.",
  4: "Sun in the 4th House focuses core vitality upon home foundations, ancestral roots, self-sovereignty in domestic life, and inner peace.",
  5: "Sun in the 5th House shines brilliance through creative intelligence, speculative acumen, educational excellence, and joyful mentorship.",
  6: "Sun in the 6th House acts as a natural warrior over obstacles, bestowing problem-solving tenacity, triumph over competition, and resilience.",
  7: "Sun in the 7th House projects authority into public life, contracts, and partnerships, seeking dignified alliances based on mutual respect.",
  8: "Sun in the 8th House turns vitality toward profound transformation, occult or esoteric research, crisis navigation, and hidden psychological power.",
  9: "Sun in the 9th House bestows solar radiance upon higher dharma, philosophical conviction, paternal blessings, and spiritual mentorship.",
  10: "Sun in the 10th House achieves maximum Digbala (directional strength), giving great vocation, public honor, organizational leadership, and executive authority.",
  11: "Sun in the 11th House connects sovereign purpose with social influence, expanding influential networks, high aspirations, and prosperous gains.",
  12: "Sun in the 12th House turns solar consciousness inward toward contemplative isolation, foreign pursuits, spiritual liberation, and egoless service.",
};

// ─── PLANETARY DASHA PREDICTIVE LIFE DOMAIN MATRIX ────────────────────────────
export interface DashaDomainForecast {
  title: string;
  energy: string;
  career: string;
  education: string;
  relationships: string;
  spirituality: string;
  wealth: string;
  health: string;
  travel: string;
}

export const DASHA_DOMAIN_FORECASTS: Record<string, DashaDomainForecast> = {
  Sun: {
    title: "Solar Illumination & Authority",
    energy: "Activating personal sovereignty, executive decisions, vitality, and soul recognition.",
    career: "Elevation in rank, leadership opportunities, recognition by superiors, and administrative clarity.",
    education: "Focus on political science, governance, leadership ethics, and acquiring credentialed authority.",
    relationships: "Requires mutual honor and respect; watch for ego clashes, cultivate generous magnanimity.",
    spirituality: "Deep connection with Atma-Jnana (self-realization), Gayatri energy, and honoring paternal lineage.",
    wealth: "Financial inflow through government, corporate authority, investments, and prestige-bearing ventures.",
    health: "High metabolic fire and vitality; stay mindful of cardiovascular rhythm, eye care, and sun protection.",
    travel: "Official journeys to administrative capitals, government centers, and places of royal or state significance.",
  },
  Moon: {
    title: "Lunar Mindset & Public Harmony",
    energy: "Heightened intuition, domestic reorganization, public receptivity, and emotional bonding.",
    career: "Flourishing in public-facing roles, hospitality, creative commerce, and consultative alliances.",
    education: "Creative writing, psychological sciences, arts, and subjects demanding empathetic intuition.",
    relationships: "Season of heartfelt connection, domestic harmony, marital bonding, and family expansion.",
    spirituality: "Devotional surrender (Bhakti), meditation on inner peace, and sacred waters or pilgrimages.",
    wealth: "Fluid financial cycles with gains through public commerce, liquid assets, real estate, and maternal patronage.",
    health: "Psychosomatic harmony is essential; attend to restful sleep, lymphatic circulation, and hydration.",
    travel: "Journeys near coastal regions, scenic waters, domestic pilgrimages, and overseas cultural voyages.",
  },
  Mars: {
    title: "Martian Drive & Decisive Action",
    energy: "Courage, sharp ambition, physical willpower, property ventures, and bold boundary-setting.",
    career: "Aggressive career expansion, technical mastery, engineering, surgery, executive command, and property acquisitions.",
    education: "Technical, logical, athletic, or analytical sciences; high competitive drive in exams.",
    relationships: "Passionate yet intense; necessitates conscious patience, avoiding haste and friction in communication.",
    spirituality: "Karma Yoga — selfless dedicated action, righteous protection of others, and disciplined focus.",
    wealth: "Strong capital generation through land, real estate, technological engineering, and bold entrepreneurial risks.",
    health: "Vigorous muscular stamina; guard against inflammatory flare-ups, accidental cuts, and overexertion.",
    travel: "High-paced active travel, adventure expeditions, visits to ancestral land, and strategic relocations.",
  },
  Rahu: {
    title: "Rahu Breakthrough & Unconventional Frontiers",
    energy: "Accelerated ambitions, breaking traditional boundaries, foreign connections, and sudden transitions.",
    career: "Fast-tracked worldly gains, technology frontiers, overseas business, innovation, and unconventional mastery.",
    education: "Cutting-edge technology, research, foreign languages, and interdisciplinary specialized studies.",
    relationships: "Attraction to unusual or cross-cultural partnerships; demands clarity over illusory expectations.",
    spirituality: "Transcending dogma, dismantling ego illusions, and uncovering esoteric, mystical truths.",
    wealth: "Unorthodox, exponential wealth opportunities; speculative caution and legal clarity are strongly advised.",
    health: "Heightened nervous sensitivity; ground the body through clean organic diet and mindful breathwork.",
    travel: "Extensive foreign travel, international relocations, trans-continental assignments, and cultural immersion.",
  },
  Jupiter: {
    title: "Jupiter Expansion, Wisdom & Providence",
    energy: "Divine grace, ethical growth, intellectual optimism, financial prosperity, and wise counsel.",
    career: "Major career prosperity, advisory roles, educational milestones, judicial success, and honorable reputation.",
    education: "Golden era for higher degrees, philosophy, law, finance, and mentorship under great teachers.",
    relationships: "Highly auspicious for marriage, birth of children, righteous alliances, and family happiness.",
    spirituality: "Profound philosophical awakening, Vedanta, spiritual pilgrimage, and practicing generous charity (Dana).",
    wealth: "Substantial, righteous accumulation of assets, gold, investment yields, and generational wealth.",
    health: "Robust vitality and optimism; balance liver health, metabolic moderation, and avoid rich overindulgences.",
    travel: "Pilgrimages to revered sacred sanctuaries, educational conventions, and enriching long-distance journeys.",
  },
  Saturn: {
    title: "Saturnian Discipline & Karmic Realization",
    energy: "Grounded endurance, structural overhaul, deep patience, humility, and building permanent foundations.",
    career: "Steadfast professional climb through diligence, organizational responsibility, and lasting legacy.",
    education: "Demands rigorous concentration, deep research, engineering, law, and long-term specialized learning.",
    relationships: "Emphasizes maturity, loyalty, shared responsibilities, and enduring long-term commitments.",
    spirituality: "Vairagya (healthy dispassion), meditation on impermanence, service to the underprivileged, and inner stillness.",
    wealth: "Slow, irreversible wealth consolidation through long-term real estate, manufacturing, and steady savings.",
    health: "Demands joint flexibility, bone strength, regular exercise, and stress mitigation through deep rest.",
    travel: "Long-stay assignments, journeys to ancient rustic or mountainous landscapes, and deliberate work-related travel.",
  },
  Mercury: {
    title: "Mercurial Intellect & Commercial Flourish",
    energy: "Analytical sharpness, business acumen, agile networking, diplomacy, and communicative brilliance.",
    career: "Strong commercial progress, media, publishing, trading, strategic marketing, and financial agility.",
    education: "Peak phase for academic achievements, exams, mathematics, computing, and multifaceted skills.",
    relationships: "Playful communication, intellectual companionship, joint travels, and lighthearted camaraderie.",
    spirituality: "Jnana Yoga — discernment between the real and unreal, sacred scripture study, and mantra clarity.",
    wealth: "Dynamic commercial gains through trading, contracts, intellectual property, writing, and digital markets.",
    health: "Quick mental reflexes; guard against nervous exhaustion, mental fatigue, and digestive sensitivities.",
    travel: "Frequent short-distance commercial trips, educational tours, dynamic city visits, and networking travels.",
  },
  Ketu: {
    title: "Ketu Detachment, Esoteric Insight & Liberation",
    energy: "Inward contemplation, sudden release of outlived attachments, deep research, and intuitive mastery.",
    career: "Shifts toward advisory, independent research, spiritual vocation, or behind-the-scenes mastery.",
    education: "Esoteric sciences, advanced mathematics, abstract philosophy, meditation, and historical research.",
    relationships: "Calls for selfless, unpossessive love; encourages emotional independence and mutual spiritual space.",
    spirituality: "Moksha orientation — profound meditative breakthroughs, kundalini awakening, and release of past-life karmas.",
    wealth: "Fluctuating attachment to material wealth; gains through research, unexpected inheritances, or spiritual trusts.",
    health: "Subtle energy balance is paramount; practice regular pranayama, acupuncture/ayurvedic detox, and rest.",
    travel: "Solitary retreats, spiritual journeys to hermitages, sacred ashrams, and remote tranquil locations.",
  },
  Venus: {
    title: "Venusian Refinement, Art & Relational Splendor",
    energy: "Aesthetic creativity, marital affection, social celebration, diplomatic grace, and sensory comfort.",
    career: "Growth through design, luxury industries, diplomacy, arts, client relations, and prosperous partnerships.",
    education: "Fine arts, humanities, architectural design, diplomatic studies, and relational psychology.",
    relationships: "Peak relationship epoch; romantic fulfillment, marriage facilitation, and harmonious social joy.",
    spirituality: "Appreciating divine beauty in creation, devotional aesthetics, and cultivating pure unconditional love.",
    wealth: "Luxuries, vehicles, artistic assets, gems, and elegant living comfort acquired with ease and delight.",
    health: "Generally radiant wellbeing; maintain renal, hormonal, and reproductive balance through clean nourishment.",
    travel: "Pleasurable leisure voyages, artistic retreats, romantic honeymoons, and world-class luxury destinations.",
  },
};

// ─── HELPER TO EXTRACT PREDICTIVE TIMELINE PHASES & ANTARDASHAS ─────────────────────────────
export interface FunctionalLordship {
  role: string;
  badge: string;
  bonus: number;
}

export interface LifeTimelineAntardasha {
  lord: string;
  mahadashaLord: string;
  startFormatted: string;
  endFormatted: string;
  startYear: number;
  endYear: number;
  startAge: number;
  endAge: number;
  isPast: boolean;
  isCurrent: boolean;
  isFuture: boolean;
  progressPercent: number;
  karmicPotential: number; // 0-100% Auspiciousness & Karmic Potential
  milestoneTitle: string;
  forecast: DashaDomainForecast;
  functionalRole?: string;
  functionalBadge?: string;
}

export interface LifeTimelinePhase {
  lord: string;
  startYear: number;
  endYear: number;
  startFormatted: string;
  endFormatted: string;
  startAge: number;
  endAge: number;
  isPast: boolean;
  isCurrent: boolean;
  isFuture: boolean;
  karmicPotential: number; // 0-100% Auspiciousness Flow
  milestoneTitle: string; // Major Life Milestone badge
  forecast: DashaDomainForecast;
  antardashas: LifeTimelineAntardasha[];
  functionalRole?: string;
  functionalBadge?: string;
}

const LAGNA_FUNCTIONAL_LORDS: Record<string, Record<string, FunctionalLordship>> = {
  Aries: {
    Mars: { role: "Lagna & 8th Lord (Physical Self, Vitality & Inner Alchemy)", badge: "👑 Lagna Lord", bonus: 15 },
    Sun: { role: "5th Lord (Supreme Trikona • Pure Intellect & Creative Grace)", badge: "✨ Trikona Benefic", bonus: 16 },
    Moon: { role: "4th Lord (Kendra • Matru Bhava & Heart Peace)", badge: "🏡 Sukha Lord", bonus: 10 },
    Jupiter: { role: "9th & 12th Lord (Bhagya Lord • Spiritual Fortune & Wisdom)", badge: "🌟 Bhagya Lord", bonus: 15 },
    Venus: { role: "2nd & 7th Lord (Maraka • Alliances & Material Exchange)", badge: "🤝 Alliance Lord", bonus: 5 },
    Saturn: { role: "10th & 11th Lord (Karma Lord • Career Elevation & Ambition)", badge: "💼 Karma & Gains", bonus: 12 },
    Mercury: { role: "3rd & 6th Lord (Initiative, Skill & Overcoming Friction)", badge: "⚔️ Dynamic Effort", bonus: 2 },
    Rahu: { role: "Ambitious Material Catalyst in Aries", badge: "🚀 Cosmic Catalyst", bonus: 8 },
    Ketu: { role: "Spiritual Deconditioning & Liberation", badge: "🧘 Moksha Catalyst", bonus: 8 },
  },
  Taurus: {
    Saturn: { role: "9th & 10th Lord (Supreme Yogakaraka for Taurus • Peak Career & Fortune)", badge: "✨ Yogakaraka Supreme", bonus: 22 },
    Mercury: { role: "2nd & 5th Lord (Dhana & Trikona Intellect • Wealth & Eloquence)", badge: "💰 Wealth & Wisdom", bonus: 16 },
    Venus: { role: "Lagna & 6th Lord (Self-Preservation, Health & Triumph)", badge: "👑 Lagna Lord", bonus: 14 },
    Sun: { role: "4th Lord (Kendra • Inner Grounding & Assets)", badge: "🏡 Sukha Lord", bonus: 10 },
    Moon: { role: "3rd Lord (Exalted in Taurus • Artistic Initiative & Courage)", badge: "🎨 Creative Drive", bonus: 8 },
    Mars: { role: "7th & 12th Lord (Partnership & Foreign Endeavors)", badge: "🤝 Partnership Lord", bonus: 4 },
    Jupiter: { role: "8th & 11th Lord (Transformation & Large Network Gains)", badge: "⚡ Sudden Breakthroughs", bonus: 6 },
    Rahu: { role: "Material Exaltation Catalyst in Taurus", badge: "🚀 High Ambition", bonus: 10 },
    Ketu: { role: "Spiritual Surrender & Detachment", badge: "🧘 Inner Seeker", bonus: 6 },
  },
  Gemini: {
    Mercury: { role: "Lagna & 4th Lord (Self & Domestic Happiness • Sharp Intellect)", badge: "👑 Lagna & Sukha Lord", bonus: 16 },
    Venus: { role: "5th & 12th Lord (Trikona Benefic • Arts, Joy & Travel)", badge: "✨ Trikona Benefic", bonus: 15 },
    Saturn: { role: "8th & 9th Lord (Bhagya Lord • Deep Research & Philosophical Luck)", badge: "🌟 Bhagya Lord", bonus: 14 },
    Moon: { role: "2nd Lord (Dhana Bhava • Wealth, Speech & Family Care)", badge: "💰 Dhana Lord", bonus: 10 },
    Sun: { role: "3rd Lord (Bhratru & Parakrama • Communication Mastery)", badge: "🖋️ Expressive Drive", bonus: 6 },
    Jupiter: { role: "7th & 10th Lord (Dual Kendra • Executive Prestige & Alliances)", badge: "💼 Leadership Lord", bonus: 10 },
    Mars: { role: "6th & 11th Lord (Competitive Drive & Hard-Earned Gains)", badge: "⚔️ Competitive Drive", bonus: 4 },
    Rahu: { role: "Intellectual Innovation & Global Reach", badge: "🚀 Tech & Innovation", bonus: 10 },
    Ketu: { role: "Psychic Intuition & Abstract Insights", badge: "🧘 Mystical Mind", bonus: 8 },
  },
  Cancer: {
    Mars: { role: "5th & 10th Lord (Supreme Yogakaraka for Cancer • Power & Intellect)", badge: "✨ Yogakaraka Supreme", bonus: 22 },
    Moon: { role: "Lagna Lord (Self, Mind, Nurturance & Emotional Leadership)", badge: "👑 Lagna Lord", bonus: 16 },
    Jupiter: { role: "9th & 6th Lord (Bhagya Lord • Spiritual Protection & Grace)", badge: "🌟 Bhagya Lord", bonus: 15 },
    Sun: { role: "2nd Lord (Dhana • Vital Resources & Noble Speech)", badge: "💰 Dhana Lord", bonus: 10 },
    Mercury: { role: "3rd & 12th Lord (Introspective Writing & Distant Ventures)", badge: "🌊 Introspective Mind", bonus: 4 },
    Venus: { role: "4th & 11th Lord (Vehicles, Property & Abundant Network Gains)", badge: "🏡 Prosperity Lord", bonus: 12 },
    Saturn: { role: "7th & 8th Lord (Maraka & Ayur • Endurance, Discipline & Realism)", badge: "⏳ Karmic Realignment", bonus: 4 },
    Rahu: { role: "Emotional Ambition & Unconventional Alliances", badge: "🚀 Visionary Drive", bonus: 8 },
    Ketu: { role: "Spiritual Purifier & Emotional Detachment", badge: "🧘 Renunciation", bonus: 6 },
  },
  Leo: {
    Mars: { role: "4th & 9th Lord (Supreme Yogakaraka for Leo • Fortune & Domestic Glory)", badge: "✨ Yogakaraka Supreme", bonus: 22 },
    Sun: { role: "Lagna Lord (Sovereign Authority, Vital Radiance & Noble Will)", badge: "👑 Lagna Lord", bonus: 18 },
    Jupiter: { role: "5th & 8th Lord (Trikona Benefic • Wisdom, Mentorship & Depth)", badge: "✨ Wisdom & Grace", bonus: 14 },
    Mercury: { role: "2nd & 11th Lord (Wealth & Immense Economic Inflow)", badge: "💰 Financial Growth", bonus: 16 },
    Venus: { role: "3rd & 10th Lord (Creative Enterprise & Public Distinction)", badge: "💼 Creative Eminence", bonus: 10 },
    Saturn: { role: "6th & 7th Lord (Strategic Patience, Discipline & Contractual Duty)", badge: "⏳ Public Duty", bonus: 4 },
    Moon: { role: "12th Lord (Contemplative Rest, Philanthropy & Solitude)", badge: "🌊 Inner Journey", bonus: 4 },
    Rahu: { role: "Magnetic Charisma & Worldwide Renown", badge: "🚀 Magnetic Ambition", bonus: 10 },
    Ketu: { role: "Egoless Service & Transcendental Wisdom", badge: "🧘 Spiritual Anchor", bonus: 8 },
  },
  Virgo: {
    Mercury: { role: "Lagna & 10th Lord (Self & Career Mastery • Technical Excellence)", badge: "👑 Lagna & Karma Lord", bonus: 18 },
    Venus: { role: "2nd & 9th Lord (Supreme Dhana & Bhagya Benefic • Refined Prosperity)", badge: "🌟 Fortune & Wealth", bonus: 18 },
    Saturn: { role: "5th & 6th Lord (Trikona Intellect & Disciplined Execution)", badge: "✨ Methodical Power", bonus: 12 },
    Sun: { role: "12th Lord (Foreign Pursuits, Inner Solitude & Research)", badge: "🔬 Deep Research", bonus: 6 },
    Moon: { role: "11th Lord (Community Gains, Friendships & Accomplishment)", badge: "💰 Labha & Gains", bonus: 12 },
    Mars: { role: "3rd & 8th Lord (Courage, Resilience & Sudden Investigation)", badge: "⚡ Hidden Tenacity", bonus: 4 },
    Jupiter: { role: "4th & 7th Lord (Dual Kendra • Legal Alliances & Family Honor)", badge: "🤝 Partnership & Home", bonus: 10 },
    Rahu: { role: "Analytical Breakthroughs & Strategic Systems", badge: "🚀 Analytical Edge", bonus: 10 },
    Ketu: { role: "Detached Discrimination & Mystical Precision", badge: "🧘 Discriminating Mind", bonus: 8 },
  },
  Libra: {
    Saturn: { role: "4th & 5th Lord (Supreme Yogakaraka for Libra • Assets & Royal Intellect)", badge: "✨ Yogakaraka Supreme", bonus: 22 },
    Venus: { role: "Lagna & 8th Lord (Physical Charisma, Vitality & Renewal)", badge: "👑 Lagna Lord", bonus: 15 },
    Mercury: { role: "9th & 12th Lord (Bhagya Benefic • International Travel & Philosophy)", badge: "🌟 Bhagya Lord", bonus: 15 },
    Moon: { role: "10th Lord (Public Honor, Leadership & Societal Stature)", badge: "💼 Karma & Honor", bonus: 14 },
    Sun: { role: "11th Lord (Influential Network, Gains & Fulfillment)", badge: "💰 Prosperity Lord", bonus: 12 },
    Mars: { role: "2nd & 7th Lord (Maraka • Financial Negotiation & Contracts)", badge: "🤝 Negotiation Lord", bonus: 6 },
    Jupiter: { role: "3rd & 6th Lord (Courageous Effort & Competitive Tenacity)", badge: "⚔️ Effort & Growth", bonus: 4 },
    Rahu: { role: "Relational Magnetism & Cultural Diplomacy", badge: "🚀 Social Expansion", bonus: 10 },
    Ketu: { role: "Spiritual Equanimity & Egoless Grace", badge: "🧘 Inner Balance", bonus: 8 },
  },
  Scorpio: {
    Jupiter: { role: "2nd & 5th Lord (Dhana & Trikona Benefic • Vast Wisdom & Wealth)", badge: "🌟 Wealth & Wisdom", bonus: 18 },
    Moon: { role: "9th Lord (Supreme Bhagya Benefic • Spiritual Grace & Fatherly Fortune)", badge: "✨ Bhagya Lord", bonus: 18 },
    Sun: { role: "10th Lord (Career Zenith, High Recognition & Executive Influence)", badge: "💼 Karma & Authority", bonus: 16 },
    Mars: { role: "Lagna & 6th Lord (Warrior Self, Vitality & Triumph Over Rivals)", badge: "👑 Lagna Lord", bonus: 15 },
    Saturn: { role: "3rd & 4th Lord (Mental Tenacity, Real Estate & Strategic Labor)", badge: "⏳ Grounded Labor", bonus: 8 },
    Venus: { role: "7th & 12th Lord (Maraka • Foreign Trade & Passionate Accord)", badge: "🤝 Alliances & Travel", bonus: 6 },
    Mercury: { role: "8th & 11th Lord (Occult Knowledge, Financial Churn & Gains)", badge: "⚡ Sudden Windfalls", bonus: 6 },
    Rahu: { role: "Formidable Occult Insight & Research Breakthroughs", badge: "🚀 Unseen Power", bonus: 10 },
    Ketu: { role: "Lagna Co-Lord in Scorpio • Absolute Spiritual Enlightenment", badge: "🧘 Transcendental Fire", bonus: 14 },
  },
  Sagittarius: {
    Jupiter: { role: "Lagna & 4th Lord (Self, Wisdom & Domestic Sovereignty)", badge: "👑 Lagna Lord", bonus: 18 },
    Sun: { role: "9th Lord (Supreme Bhagya Benefic • Divine Guidance & Higher Dharma)", badge: "✨ Bhagya Lord", bonus: 18 },
    Mars: { role: "5th & 12th Lord (Trikona Benefic • Intuitive Drive & Moral Courage)", badge: "🌟 Creative Courage", bonus: 14 },
    Mercury: { role: "7th & 10th Lord (Dual Kendra • Business Eminence & Social Status)", badge: "💼 Career & Trade", bonus: 12 },
    Saturn: { role: "2nd & 3rd Lord (Financial Prudence, Tenacious Speech & Effort)", badge: "💰 Practical Assets", bonus: 8 },
    Venus: { role: "6th & 11th Lord (Competitive Alliances & Commercial Gains)", badge: "🤝 Strategic Gains", bonus: 6 },
    Moon: { role: "8th Lord (Psychological Transformation, Longevity & Intuition)", badge: "🌊 Inner Metamorphosis", bonus: 4 },
    Rahu: { role: "Global Philosophy & Visionary Pursuits", badge: "🚀 Global Vision", bonus: 10 },
    Ketu: { role: "Direct Soul Liberation & Ascetic Illumination", badge: "🧘 Moksha Flame", bonus: 12 },
  },
  Capricorn: {
    Venus: { role: "5th & 10th Lord (Supreme Yogakaraka for Capricorn • Fortune, Arts & Career)", badge: "✨ Yogakaraka Supreme", bonus: 22 },
    Saturn: { role: "Lagna & 2nd Lord (Self, Resource Mastery & Enduring Legacy)", badge: "👑 Lagna Lord", bonus: 16 },
    Mercury: { role: "6th & 9th Lord (Bhagya Lord • Pragmatic Luck & Analytical Mastery)", badge: "🌟 Bhagya Lord", bonus: 15 },
    Mars: { role: "4th & 11th Lord (Exalted in Capricorn • Real Estate & Tremendous Gains)", badge: "🏡 Property & Gains", bonus: 14 },
    Jupiter: { role: "3rd & 12th Lord (Initiative, Philosophical Pilgrimages & Charity)", badge: "🧘 Philosophical Journey", bonus: 6 },
    Moon: { role: "7th Lord (Maraka • Marital Harmony & Public Partnerships)", badge: "🤝 Partnership Lord", bonus: 8 },
    Sun: { role: "8th Lord (Deep Life Alchemy, Endurance Tests & Hidden Knowledge)", badge: "⚡ Transformative Fire", bonus: 4 },
    Rahu: { role: "Architect of Massive Structural Ambition", badge: "🚀 Empire Builder", bonus: 10 },
    Ketu: { role: "Release of Material Ties & Inner Stillness", badge: "🧘 Silent Realization", bonus: 8 },
  },
  Aquarius: {
    Venus: { role: "4th & 9th Lord (Supreme Yogakaraka for Aquarius • Divine Grace & Bliss)", badge: "✨ Yogakaraka Supreme", bonus: 22 },
    Saturn: { role: "Lagna & 12th Lord (Self, Visionary Isolation & Cosmic Service)", badge: "👑 Lagna Lord", bonus: 15 },
    Mercury: { role: "5th & 8th Lord (Trikona Intellect • Deep Research & Analytical Wit)", badge: "🌟 Deep Intellect", bonus: 14 },
    Mars: { role: "3rd & 10th Lord (Courageous Leadership, Enterprise & Executive Command)", badge: "💼 Dynamic Enterprise", bonus: 12 },
    Jupiter: { role: "2nd & 11th Lord (Supreme Dhana & Labha • Large Scale Wealth Generation)", badge: "💰 Immense Wealth", bonus: 16 },
    Sun: { role: "7th Lord (Maraka • High Profile Alliances & Public Treaties)", badge: "🤝 Sovereign Alliances", bonus: 8 },
    Moon: { role: "6th Lord (Service, Overcoming Health Nuances & Healing Others)", badge: "🌿 Selfless Healing", bonus: 4 },
    Rahu: { role: "Lagna Co-Lord in Aquarius • Revolutionary Humanitarian Impact", badge: "🚀 Revolutionary Mind", bonus: 14 },
    Ketu: { role: "Transcendental Non-Attachment & Egoless Awakening", badge: "🧘 Cosmic Consciousness", bonus: 10 },
  },
  Pisces: {
    Jupiter: { role: "Lagna & 10th Lord (Self, Wisdom & Career Eminence • Spiritual Guide)", badge: "👑 Lagna & Karma Lord", bonus: 18 },
    Mars: { role: "2nd & 9th Lord (Supreme Dhana & Bhagya Benefic • Auspicious Fortune)", badge: "🌟 Fortune & Dhana", bonus: 18 },
    Moon: { role: "5th Lord (Supreme Trikona Benefic • Pure Intuition & Devotional Grace)", badge: "✨ Trikona Benefic", bonus: 18 },
    Sun: { role: "6th Lord (Triumph Over Difficulties, Vital Resilience & Healing)", badge: "⚔️ Warrior Vitality", bonus: 8 },
    Mercury: { role: "4th & 7th Lord (Dual Kendra • Commercial Alliances & Education)", badge: "🤝 Trade & Intellect", bonus: 10 },
    Venus: { role: "3rd & 8th Lord (Exalted in Pisces • Artistic Ecstasy & Esoteric Love)", badge: "🎨 Sublime Aesthetics", bonus: 8 },
    Saturn: { role: "11th & 12th Lord (Karmic Expenses, International Reach & Closure)", badge: "⏳ Distant Horizons", bonus: 6 },
    Rahu: { role: "Spiritual Dissolution of Boundaries & Global Outreach", badge: "🚀 Limitless Vision", bonus: 10 },
    Ketu: { role: "Ultimate Moksha, Divine Unity & Ocean of Grace", badge: "🧘 Supreme Liberation", bonus: 14 },
  },
};

export function getFunctionalLordship(ascSign?: string, planet?: string): FunctionalLordship {
  if (!ascSign || !planet) {
    return {
      role: "Universal Planetary Archetype",
      badge: "Planetary Cycle",
      bonus: 0,
    };
  }
  const signMap = LAGNA_FUNCTIONAL_LORDS[ascSign];
  if (!signMap) {
    return {
      role: "Universal Planetary Archetype",
      badge: "Planetary Cycle",
      bonus: 0,
    };
  }
  return (
    signMap[planet] || {
      role: "Universal Planetary Archetype",
      badge: "Planetary Cycle",
      bonus: 0,
    }
  );
}

const PLANET_BASE_POTENTIAL: Record<string, number> = {
  Jupiter: 90,
  Venus: 86,
  Mercury: 78,
  Moon: 75,
  Sun: 74,
  Mars: 68,
  Saturn: 65,
  Rahu: 60,
  Ketu: 56,
};

const MAHADASHA_MILESTONES: Record<string, string> = {
  Sun: "Sovereign Authority & Leadership Crystallization",
  Moon: "Emotional Maturity, Intuition & Domestic Harmonization",
  Mars: "Dynamic Enterprise, Property & Decisive Breakthroughs",
  Rahu: "Unconventional Horizons, Global Expansion & Disruption",
  Jupiter: "Wisdom Flourishing, Providential Growth & Dharma",
  Saturn: "Karmic Consolidation, Perseverance & Enduring Legacy",
  Mercury: "Intellectual Eminence, Commercial Mastery & Innovation",
  Ketu: "Deep Metaphysical Awakening, Solitude & Transformation",
  Venus: "Artistic Refinement, Relational Splendor & Abundance",
};

// Classical Antardasha Archetypes & Pair-Specific Synthesis (BPHS & Phaladeepika)
const MD_ENVIRONMENT_CONTEXT: Record<string, string> = {
  Sun: "solar executive authority, self-sovereignty, and public recognition",
  Moon: "lunar emotional adaptability, public goodwill, and domestic reorganization",
  Mars: "martian courage, strategic enterprise, and property ambition",
  Rahu: "unconventional frontiers, cutting-edge disruption, and global expansion",
  Jupiter: "providential grace, dharmic wisdom, and institutional prosperity",
  Saturn: "karmic consolidation, disciplined duty, and enduring structure",
  Mercury: "analytical intellect, commercial versatility, and communication",
  Ketu: "spiritual detachment, intuitive insight, and transformative liberation",
  Venus: "aesthetic refinement, relational diplomacy, and material elegance",
};

const AD_LORD_ARCHETYPES: Record<string, DashaDomainForecast> = {
  Sun: {
    title: "Sun Sub-Period",
    energy: "Injected with solar clarity, executive confidence, and commanding self-respect.",
    career: "Direct recognition from leadership, promotion, and public visibility.",
    wealth: "Authoritative financial moves, government contracts, or dignified investments.",
    relationships: "Requires mutual honor; practice magnanimity to avoid ego clashes.",
    education: "Focus on administrative ethics, political theory, and leadership skills.",
    health: "High metabolic stamina; monitor heart rhythm, ocular health, and sun exposure.",
    spirituality: "Cultivating Atma-Jnana (self-realization) and solar mantra contemplation.",
    travel: "Official journeys to administrative centers or heritage sites.",
  },
  Moon: {
    title: "Moon Sub-Period",
    energy: "Infused with intuitive perception, emotional responsiveness, and maternal care.",
    career: "Growth in client-facing commerce, public relations, and consultative alliances.",
    wealth: "Fluid financial cycles; gains through public goodwill, liquid assets, and commerce.",
    relationships: "Emotional closeness, domestic harmony, and heartfelt family bonding.",
    education: "Creative arts, psychology, humanities, and empathetic inquiry.",
    health: "Psychosomatic balance is key; prioritize restorative sleep and hydration.",
    spirituality: "Devotional surrender (Bhakti), water pilgrimages, and silent meditation.",
    travel: "Visits to coastal locations, scenic waterways, or domestic reunions.",
  },
  Mars: {
    title: "Mars Sub-Period",
    energy: "Charged with vigorous willpower, decisive initiative, and competitive courage.",
    career: "Aggressive project expansion, engineering breakthroughs, and executive command.",
    wealth: "Capital investments in real estate, technology, and bold entrepreneurial assets.",
    relationships: "Passionate dynamism; avoid hasty arguments or dominating behavior.",
    education: "Technical, logistical, medical, or competitive examination pursuits.",
    health: "High physical vitality; safeguard against muscular strains, inflammation, and cuts.",
    spirituality: "Karma Yoga: righteous action, defending truth, and focused discipline.",
    travel: "Fast-paced active journeys, exploration treks, or property visits.",
  },
  Rahu: {
    title: "Rahu Sub-Period",
    energy: "Propelled by unconventional ambition, innovative curiosity, and rapid changes.",
    career: "Breaking into cutting-edge technology, foreign markets, or non-traditional roles.",
    wealth: "Unorthodox, high-yield opportunities; maintain legal vigilance and avoid fraud.",
    relationships: "Attraction to cross-cultural or unconventional alliances; keep realistic expectations.",
    education: "Advanced technological studies, foreign languages, and specialized research.",
    health: "Nervous sensitivity; ground the psyche with clean nutrition and steady sleep.",
    spirituality: "Dismantling outdated dogmas to discover esoteric, universal spiritual truths.",
    travel: "Trans-continental travel, overseas relocations, and international exploration.",
  },
  Jupiter: {
    title: "Jupiter Sub-Period",
    energy: "Blessed with ethical optimism, wise mentorship, and providential good fortune.",
    career: "Honorable recognition, advisory appointments, teaching excellence, and judicial wins.",
    wealth: "Righteous financial growth, prosperous long-term investments, and asset expansion.",
    relationships: "Auspicious celebrations, marital harmony, and deepening family joy.",
    education: "Higher academia, law, philosophy, finance, and advanced certifications.",
    health: "Radiant wellbeing; practice dietary moderation to support liver and metabolism.",
    spirituality: "Vedantic contemplation, generous charity (Dana), and sacred pilgrimages.",
    travel: "Enriching educational tours, pilgrimage to holy shrines, and cultural visits.",
  },
  Saturn: {
    title: "Saturn Sub-Period",
    energy: "Anchored by mature patience, duty-bound discipline, and enduring perseverance.",
    career: "Steady professional consolidation through hard labor and organizational responsibility.",
    wealth: "Conservative savings, long-term real estate, manufacturing, and steady gains.",
    relationships: "Emphasis on loyalty, shared responsibilities, and emotional maturity.",
    education: "Rigorous research, engineering, statutory law, and meticulous learning.",
    health: "Demands joint care, skeletal alignment, and adequate restorative rest.",
    spirituality: "Vairagya (healthy dispassion), service to the needy, and deep inner stillness.",
    travel: "Long-stay professional assignments, rustic retreats, or solitary journeys.",
  },
  Mercury: {
    title: "Mercury Sub-Period",
    energy: "Animated by analytical agility, communicative wit, and commercial acumen.",
    career: "Commercial expansion, publishing, strategic trading, and digital communications.",
    wealth: "Versatile commercial profits through trade, writing, advisory, and contracts.",
    relationships: "Lighthearted camaraderie, witty dialogue, and mutual intellectual respect.",
    education: "Data analytics, languages, mathematics, journalism, and technical computing.",
    health: "Quick mental reflexes; guard against mental fatigue and nervous exhaustion.",
    spirituality: "Jnana Yoga: analytical discernment between the eternal and transient.",
    travel: "Frequent short business trips, educational tours, and lively city visits.",
  },
  Ketu: {
    title: "Ketu Sub-Period",
    energy: "Characterized by deep introspection, intuitive detachment, and spiritual clarity.",
    career: "Specialized independent research, advisory roles, or behind-the-scenes mastery.",
    wealth: "Fluctuating material focus; gains through research, unexpected gifts, or trusts.",
    relationships: "Desire for personal space; calls for selfless, unconditional companionship.",
    education: "Metaphysics, abstract mathematics, coding, and esoteric historical research.",
    health: "Subtle nervous balance; practice daily pranayama and ayurvedic grounding.",
    spirituality: "Moksha orientation: meditation breakthroughs, releasing past karmic ties.",
    travel: "Solitary spiritual retreats, hermitage visits, and tranquil natural locations.",
  },
  Venus: {
    title: "Venus Sub-Period",
    energy: "Graced with aesthetic elegance, social warmth, creative harmony, and diplomacy.",
    career: "Fruitful growth through design, public relations, arts, and prosperous partnerships.",
    wealth: "Acquisition of vehicles, fine comforts, artistic assets, and financial ease.",
    relationships: "Peak relational warmth, romantic blossoming, and joyous celebrations.",
    education: "Fine arts, humanities, architectural design, diplomacy, and psychology.",
    health: "Radiant vitality; maintain balanced hydration and endocrine harmony.",
    spirituality: "Bhakti devotion, appreciating sacred beauty, and practicing loving-kindness.",
    travel: "Pleasurable leisure voyages, cultural retreats, and romantic travel.",
  },
};

const PAIR_SPECIFIC: Record<string, Partial<DashaDomainForecast>> = {
  "Jupiter-Rahu": {
    energy: "A dynamic clash of spiritual wisdom and unorthodox worldly ambition. Propels you outside conventional comfort zones.",
    career: "Sudden breakthroughs in tech, global enterprise, or unconventional advisory roles; resist shortcuts or ethical ambiguities.",
    wealth: "Unprecedented material gains through international channels or speculative innovation; ensure legal diligence.",
    relationships: "Encounters with mentors or partners from diverse cultural backgrounds; avoid ideological friction with traditional elders.",
    education: "Exploration of foreign systems, cutting-edge tech, comparative theology, or unconventional philosophies.",
    health: "High nervous stimulation and digestive fluctuations; maintain clean eating and grounding breathwork.",
    spirituality: "Questioning rigid dogma to attain genuine, direct spiritual insight and universal Vedanta.",
    travel: "Foreign voyages, cross-continental moves, or journeys to unfamiliar cultural landscapes.",
  },
  "Rahu-Jupiter": {
    energy: "Worldly momentum steered into ethical channels. An unconventional pursuit finds philosophical purpose and institutional legitimacy.",
    career: "Elevation through higher credentials, mentoring others, and establishing legitimate standing in innovative fields.",
    wealth: "Stabilization of speculative profits into enduring, righteous investments and real estate assets.",
    relationships: "Harmonizing previously turbulent associations; finding mentors who provide grounding and moral clarity.",
    education: "Formalizing self-taught or innovative expertise with accredited degrees and classical philosophy.",
    health: "Recovery of physical balance; detoxifying the liver and nervous system through organic nutrition.",
    spirituality: "Transition from restless curiosity into sincere philosophical contemplation and devotional humility.",
    travel: "Pilgrimages to sacred spiritual sanctuaries combined with international academic lectures.",
  },
  "Saturn-Mercury": {
    energy: "Pragmatic discipline infused with sharp intellectual dexterity. Long-delayed plans crystallize through meticulous execution.",
    career: "Major commercial agreements, publishing, organizational restructuring, and intellectual authority recognized by peers.",
    wealth: "Solid financial stabilization through written contracts, accounting reforms, and steady commercial dividends.",
    relationships: "Constructive dialogue resolves long-standing domestic burdens; communication becomes mature and pragmatic.",
    education: "Rigorous focus on advanced analytics, engineering, law, writing, or professional licensing exams.",
    health: "Mental fatigue and nervous strain from heavy workload; restorative sleep and magnesium/herb routines help.",
    spirituality: "Systematic scriptural study, intellectual discernment (Jnana), and quiet contemplative reflection.",
    travel: "Productive commercial travels, educational conferences, and deliberate business delegations.",
  },
  "Mercury-Saturn": {
    energy: "Light intellectual agility grounded by sober discipline. Ideas are subjected to rigorous testing and reality checks.",
    career: "Formalizing business contracts, taking on management compliance roles, and long-term research documentation.",
    wealth: "Curbing frivolous expenses and building cash reserves through prudent budgeting and long-term bonds.",
    relationships: "Patience required in family communication; clearing misunderstandings through calm, factual explanations.",
    education: "Demands intense concentration on difficult technical subjects, statutory jurisprudence, or precision sciences.",
    health: "Guard against hand/wrist repetitive strain, dry skin, and nervous exhaustion; adhere to strict sleep routines.",
    spirituality: "Stoic detachment and mindful observation of thought patterns without reactivity.",
    travel: "Essential business audits, inspection of ancestral properties, or deliberate solo study retreats.",
  },
  "Saturn-Venus": {
    energy: "Auspicious fruition where years of patient labor translate into lasting material comfort and emotional grace.",
    career: "Elevation to dignified executive roles, fruitful artistic or design alliances, and public respect for long-term loyalty.",
    wealth: "Significant wealth consolidation: acquiring real estate, vehicles, heirloom jewelry, or steady corporate dividends.",
    relationships: "Deepening marital loyalty, reconciliation of past estrangements, or celebration of a grounded, lasting union.",
    education: "Mastery in architectural design, humanities, international trade, or management sciences.",
    health: "Vitality rebounds after heavy exhaustion; attend to kidney/urinary health and maintain hormonal balance.",
    spirituality: "Devotional grace (Bhakti), sacred artistry, and experiencing divine beauty in daily duties.",
    travel: "Leisure travel with loved ones, visits to scenic heritage sites, or restful retreats.",
  },
  "Venus-Saturn": {
    energy: "Romantic and creative impulses meet sober reality. Frivolous pleasures give way to enduring, faithful commitments.",
    career: "Stabilizing creative or diplomatic careers through organizational contracts, heritage curation, and institutional roles.",
    wealth: "Long-term investments in tangible physical assets, commercial real estate, and fine craftsmanship.",
    relationships: "Testing the durability of partnerships; superficial bonds dissolve while authentic, loyal love deepens.",
    education: "In-depth study of art history, classical architecture, luxury brand management, and restorative counseling.",
    health: "Maintain hormonal and skin health through hydration, adequate dietary fats, and structured daily movement.",
    spirituality: "Devotional service (Seva) to elders and the underprivileged, finding the sacred in humble labor.",
    travel: "Travel to historic stone architectures, ancient pilgrimage corridors, or peaceful mountain sanatoria.",
  },
  "Sun-Saturn": {
    energy: "Testing of personal sovereignty against duty and structural limitations. Demands humility, endurance, and quiet resilience.",
    career: "Navigating friction with superiors or state authorities; triumph is achieved through unimpeachable work ethic and patience.",
    wealth: "Conservative financial era: focus on tax diligence, debt reduction, and safeguarding existing capital.",
    relationships: "Tendency toward emotional stoicism; avoid unnecessary power struggles with paternal figures or partners.",
    education: "Disciplined study of administrative law, public administration, historical precedents, or hard sciences.",
    health: "Attend to skeletal posture, cardiovascular rhythm, and vitality; avoid excessive burnout and chronic fatigue.",
    spirituality: "Ego-purification: learning that true leadership is dedicated selfless service (Nishkama Karma).",
    travel: "Demanding official assignments, journeys to remote administrative centers, or ancestral duties.",
  },
  "Saturn-Sun": {
    energy: "Karmic tests culminate in hard-earned public recognition. Character forged through trials now commands natural respect.",
    career: "Assuming autonomous leadership, stepping out from the shadows into executive accountability.",
    wealth: "Delayed governmental dues, tax clearances, or corporate promotions finally release promised financial gains.",
    relationships: "Resolving ancestral or paternal expectations; asserting healthy self-worth while honoring familial duty.",
    education: "Leadership certifications, public governance, executive management, and authoritative credentials.",
    health: "Vitality gradually ascends; strengthen cardiac circulation and bone mineral density with outdoor sunlight.",
    spirituality: "Recognizing that enduring self-worth originates from within the soul (Atman), not external validation.",
    travel: "Solemn visits to governmental capitals, ancestral memorials, and places of state governance.",
  },
  "Mars-Saturn": {
    energy: "The friction of fire and stone. Requires intense self-control, channeled physical endurance, and cool strategic patience.",
    career: "Demanding technical projects, engineering feats, surgical operations, or high-stakes industrial turnarounds.",
    wealth: "Gains earned through tough negotiation, land development, and heavy manufacturing; avoid impulsive investments.",
    relationships: "High risk of irritability or stubborn stances; intentional gentleness and physical exercise release tension.",
    education: "Technical sciences, mechanical or civil engineering, martial discipline, or rigorous problem-solving.",
    health: "Guard against muscular strain, inflammatory flares, or accidental bumps; prioritize cooling nutrition and safe training.",
    spirituality: "Yogic tapasya: burning away inner impurities through steadfast daily discipline and silent endurance.",
    travel: "Demanding work expeditions, industrial site inspections, or purposeful solitary treks.",
  },
  "Saturn-Mars": {
    energy: "Patient structure mobilized by sharp tactical drive. Pent-up potential bursts into focused, productive activity.",
    career: "Decisive restructuring of operations, taking aggressive competitive steps after long preparation.",
    wealth: "Reactivation of stalled property deals, industrial investments, and tangible equipment purchases.",
    relationships: "Direct, unfiltered conversations clear lingering resentments; channel excess energy into shared home improvement.",
    education: "Mechanical engineering, surgical procedures, software systems architecture, or competitive sports mastery.",
    health: "Careful warm-ups before exertion to prevent hamstring or tendon pulls; balance heat with hydration.",
    spirituality: "Warrior discipline: dedicated spiritual practice without excuses or mental vacillation.",
    travel: "Urgent problem-solving journeys, site construction reviews, or active mountain expeditions.",
  },
  "Jupiter-Venus": {
    energy: "The harmonious convergence of the two great Gurus (Brihaspati & Shukra): ethical nobility meets aesthetic refinement.",
    career: "Flourishing in academia, diplomacy, high arts, executive advisory, judicial affairs, and luxury commerce.",
    wealth: "Generous financial abundance, lucrative creative investments, acquisition of comforts, and philanthropic donations.",
    relationships: "One of the most auspicious periods for marriage, deepening romantic devotion, and family celebrations.",
    education: "Higher learning in ethics, comparative literature, fine arts, diplomacy, and spiritual philosophy.",
    health: "High emotional wellbeing; moderate dietary sweetness and rich foods to protect liver and metabolic harmony.",
    spirituality: "Harmonizing worldly love with divine devotion; generous charity (Dana) and temple or cultural patronage.",
    travel: "Cultural tours, pilgrimage to grand heritage temples, luxury vacations, and artistic retreats.",
  },
  "Venus-Jupiter": {
    energy: "Aesthetic joy elevated by spiritual wisdom. Creative projects receive widespread moral and institutional endorsement.",
    career: "Exceptional prosperity in consulting, public diplomacy, artistic directorship, and philanthropic leadership.",
    wealth: "Substantial accumulation of precious assets, auspicious family windfalls, and high-yielding ethical investments.",
    relationships: "Blessed domestic happiness, conception or birth of children, and serene mutual devotion.",
    education: "Mastery in judicial ethics, sacred scriptures, musicology, cultural diplomacy, and design psychology.",
    health: "Robust vitality and optimism; balance metabolic digestion through walking and clean vegetarian nourishment.",
    spirituality: "Deep spiritual joy, temple ceremonies, celebrating divine beauty, and voluntary community service.",
    travel: "Spiritual journeys with loved ones to renowned sacred sanctuaries, scenic islands, and cultural centers.",
  },
  "Mercury-Venus": {
    energy: "Witty, elegant, and intellectually vibrant. Enhances social charm, creative communication, and commercial finesse.",
    career: "Triumph in marketing, creative media, graphic arts, diplomatic negotiation, software design, and commerce.",
    wealth: "Smooth, delightful financial inflow through contracts, digital intellectual property, sales, and artistic commissions.",
    relationships: "Playful romantic harmony, mutual intellectual appreciation, and vibrant social gatherings.",
    education: "Languages, creative writing, digital media, fashion design, and relational psychology.",
    health: "Light and buoyant vitality; maintain regular hydration, skin care, and balanced sleep rhythms.",
    spirituality: "Appreciating the divine play (Lila), sacred poetry, mantra recitation, and joyous musical contemplation.",
    travel: "Pleasurable short getaways, cultural city breaks, networking conventions, and romantic journeys.",
  },
  "Venus-Mercury": {
    energy: "Creative inspiration channeled through sharp commercial intellect. Artistic visions turn into commercially viable assets.",
    career: "Flourishing in advertising, design consultancy, public speaking, luxury branding, and publishing.",
    wealth: "Lucrative deals through contracts, sales presentations, digital commerce, and artistic collaborations.",
    relationships: "Delightful social interactions, humorous and engaging communication, and blossoming mutual affection.",
    education: "Applied arts, digital marketing, public relations, linguistics, and aesthetic architecture.",
    health: "Refined nervous energy; avoid sensory overload and excessive screen time through nature walks.",
    spirituality: "Mindful aesthetics, contemplative reading of sacred love poetry, and mantra japa.",
    travel: "Charming seaside getaways, commercial expos, book fairs, and romantic weekend travels.",
  },
  "Moon-Jupiter": {
    energy: "Expansive emotional peace, unshakeable moral optimism, family warmth, and generous public goodwill.",
    career: "Elevation in public esteem, educational leadership, advisory trust, and consultative prosperity.",
    wealth: "Comfortable, righteous asset accumulation: real estate expansion, liquid savings, and maternal/family blessings.",
    relationships: "Domestic contentment, celebration of births or milestone unions, and heartfelt familial bonding.",
    education: "Philosophy, psychology, counseling, ethics, and foundational spiritual literature.",
    health: "Serene mental equilibrium and strong immune vitality; stay mindful of water retention and dietary moderation.",
    spirituality: "Deep devotional surrender (Bhakti), pilgrimages near sacred waters, and selfless humanitarian service.",
    travel: "Peaceful family pilgrimages, seaside sanctuaries, and uplifting spiritual journeys.",
  },
  "Jupiter-Moon": {
    energy: "Wisdom softened by maternal empathy and intuitive rapport. Mentorship radiates warmth and emotional safety.",
    career: "Outstanding success in public welfare, medical or psychological consultation, education, and community leadership.",
    wealth: "Prosperity through public trust, institutional funds, residential property, and liquid asset growth.",
    relationships: "Deep emotional security within the home, joyous maternal relations, and peaceful marital accord.",
    education: "Pedagogy, developmental psychology, healthcare, counseling, and classical humanities.",
    health: "Stable constitutional wellness; maintain gentle digestive circulation and restful sleep habits.",
    spirituality: "Bhakti Yoga, chanting sacred stotrams, visiting river tirthas, and providing food charity (Annadana).",
    travel: "Relaxing pilgrimages to coastal holy sites, serene lake retreats, and ancestral family visits.",
  },
  "Moon-Mars": {
    energy: "Energetic passions and entrepreneurial drive. Deep feelings convert rapidly into decisive, tangible actions.",
    career: "Bold real estate moves, energetic startups, commercial ventures, and assertively claiming new leadership ground.",
    wealth: "Dynamic financial inflows through property, trade, and enterprise; guard against impulsive expenditures.",
    relationships: "Warm and passionate bonds; practice active listening to prevent quick emotional tempers or impatience.",
    education: "Business management, sports science, property law, engineering, and competitive exams.",
    health: "High physical drive; balance metabolic fire with cooling beverages, swimming, and adequate rest.",
    spirituality: "Karma Yoga: serving others with courageous protective energy and direct material benevolence.",
    travel: "Active adventure trips, visits to ancestral land holdings, and swift entrepreneurial travel.",
  },
  "Sun-Jupiter": {
    energy: "Sovereign radiance guided by supreme dharma. Authority expresses through benevolence, justice, and noble wisdom.",
    career: "Elevation to supreme executive rank, royal/governmental honors, judicial triumph, and esteemed leadership.",
    wealth: "Substantial institutional gains, state patronage, ethical investment windfalls, and lasting prosperity.",
    relationships: "Dignified, respectful bonds; paternal figures and mentors offer life-altering blessings and alliance.",
    education: "Constitutional governance, advanced theology, ethical jurisprudence, and philosophical mastery.",
    health: "Magnificent vitality and cellular optimism; maintain heart and liver harmony with a wholesome sattvic diet.",
    spirituality: "Realization of the Divine within: solar Gayatri meditation, upholding cosmic dharma, and generous patronage.",
    travel: "Official state voyages, pilgrimages to majestic temples, and international summits.",
  },
  "Sun-Mars": {
    energy: "Formidable warrior willpower and executive command. Obstacles are dismantled with courageous, surgical clarity.",
    career: "Rapid career ascent, military or technical authority, engineering triumphs, and defeating competitive rivals.",
    wealth: "Strong capital accumulation through enterprise, government contracts, and high-value real estate.",
    relationships: "Decisive and protective; beware of unintentional authoritarianism with loved ones.",
    education: "Applied physics, aerospace, military strategy, surgical sciences, and technical administration.",
    health: "Blazing physical stamina; mitigate excess internal heat through hydration and avoiding overworking under the sun.",
    spirituality: "Cultivating unshakeable spiritual courage, protecting the vulnerable, and heroic self-discipline.",
    travel: "Dynamic expeditions, strategic site reviews, and travels associated with high-stakes ventures.",
  },
};

export function synthesizeAntardashaForecast(mdLord: string, adLord: string): {
  milestoneTitle: string;
  karmicPotential: number;
  forecast: DashaDomainForecast;
} {
  const mdBase = PLANET_BASE_POTENTIAL[mdLord] || 70;
  const adBase = PLANET_BASE_POTENTIAL[adLord] || 70;
  let karmicPotential = Math.round((mdBase * 0.6) + (adBase * 0.4));

  // Harmonious boost for classical benefic synergies
  const benefics = new Set(["Jupiter", "Venus", "Mercury", "Moon"]);
  if (benefics.has(mdLord) && benefics.has(adLord)) {
    karmicPotential = Math.min(96, karmicPotential + 6);
  }

  const isSvaDasha = mdLord === adLord;
  const milestoneTitle = `${mdLord}-${adLord}: ${
    isSvaDasha
      ? "Epoch Genesis & Foundational Baseline"
      : benefics.has(adLord)
      ? "Auspicious Grace & Growth Acceleration"
      : "Karmic Churning & Strategic Discipline"
  }`;

  const pairKey = `${mdLord}-${adLord}`;
  if (PAIR_SPECIFIC[pairKey]) {
    const s = PAIR_SPECIFIC[pairKey];
    const forecast: DashaDomainForecast = {
      title: `${mdLord} • ${adLord} Sub-Period Matrix`,
      energy: s.energy || "",
      career: s.career || "",
      education: s.education || "",
      relationships: s.relationships || "",
      spirituality: s.spirituality || "",
      wealth: s.wealth || "",
      health: s.health || "",
      travel: s.travel || "",
    };
    return { milestoneTitle, karmicPotential, forecast };
  }

  // Dynamic Distinct Synthesizer for all other pairings
  const adArchetype = AD_LORD_ARCHETYPES[adLord] || AD_LORD_ARCHETYPES.Mercury;
  const mdContext = MD_ENVIRONMENT_CONTEXT[mdLord] || "the overarching life cycle";

  const forecast: DashaDomainForecast = {
    title: `${mdLord} • ${adLord} Sub-Period Matrix`,
    energy: isSvaDasha
      ? `Genesis phase of the ${mdLord} epoch: Establishing the foundational baseline and direction for the years ahead.`
      : `${adArchetype.energy} Channeled within the overarching terrain of ${mdContext}.`,
    career: isSvaDasha
      ? `Inception of new vocational paradigms under ${mdLord}. Laying foundational projects that set your career trajectory.`
      : `${adArchetype.career} Operates within your broader ${mdLord} professional framework.`,
    wealth: isSvaDasha
      ? `Financial recalibration: Organizing capital reserves and setting long-term investment priorities for the new cycle.`
      : `${adArchetype.wealth} Leverages ${mdLord}'s structural asset channels.`,
    relationships: isSvaDasha
      ? `Personal boundaries and relational expectations reset to match your evolving inner identity.`
      : `${adArchetype.relationships} Reflects the overarching ${mdLord} relational atmosphere.`,
    education: isSvaDasha
      ? `Orientation toward foundational learning, core skills, and setting intellectual roadmaps.`
      : `${adArchetype.education} Enhances capabilities essential for ${mdLord}'s life objectives.`,
    health: isSvaDasha
      ? `Physical and psychological adaptation to ${mdLord}'s primary energetic rhythm. Establish supportive daily routines.`
      : `${adArchetype.health} Balance vitality according to ${mdLord}'s constitutional influence.`,
    spirituality: isSvaDasha
      ? `Soul-searching and spiritual introspection that defines your inner compass for the whole epoch.`
      : `${adArchetype.spirituality} Deepening inner wisdom along ${mdLord}'s dharmic path.`,
    travel: isSvaDasha
      ? `Orienting journeys to align with your newly emerging life direction.`
      : `${adArchetype.travel} Undertaken to advance ${mdLord} epoch milestones.`,
  };

  return { milestoneTitle, karmicPotential, forecast };
}

export function generateLifeTimelinePhases(
  timeline: any[],
  birthDateStr?: string,
  ascSign?: string
): LifeTimelinePhase[] {
  if (!timeline || !Array.isArray(timeline) || timeline.length === 0) return [];

  let birthYear = 1990;
  if (birthDateStr) {
    const parts = birthDateStr.includes("/")
      ? birthDateStr.split("/")
      : birthDateStr.split("-");
    if (parts.length === 3) {
      const yr = parseInt(parts[2].length === 4 ? parts[2] : parts[0], 10);
      if (!isNaN(yr) && yr > 1900 && yr < 2100) birthYear = yr;
    }
  }

  const now = new Date();
  const currentYear = now.getFullYear();

  const parseYear = (dateStr: string): number => {
    if (!dateStr) return currentYear;
    const parts = dateStr.includes("-") ? dateStr.split("-") : dateStr.split("/");
    if (parts.length === 3) {
      if (parts[2].length === 4) return parseInt(parts[2], 10);
      if (parts[0].length === 4) return parseInt(parts[0], 10);
    }
    return currentYear;
  };

  const parseDate = (dateStr: string): Date => {
    if (!dateStr) return now;
    const parts = dateStr.includes("-") ? dateStr.split("-") : dateStr.split("/");
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      }
      if (parts[0].length === 4) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
    }
    return now;
  };

  return timeline.map((md: any) => {
    const sYr = parseYear(md.start);
    const eYr = parseYear(md.end);

    const isCurrent = currentYear >= sYr && currentYear <= eYr;
    const isPast = eYr < currentYear;
    const isFuture = sYr > currentYear;

    const startAge = Math.max(0, sYr - birthYear);
    const endAge = Math.max(startAge, eYr - birthYear);

    const fLord = getFunctionalLordship(ascSign, md.lord);
    const baseKarmic = PLANET_BASE_POTENTIAL[md.lord] || 72;
    const karmicPotential = Math.min(98, Math.max(35, baseKarmic + fLord.bonus));

    const forecast =
      DASHA_DOMAIN_FORECASTS[md.lord] || DASHA_DOMAIN_FORECASTS.Jupiter;
    const milestoneTitle = MAHADASHA_MILESTONES[md.lord] || "Evolutionary Life Chapter";

    // Sub-period Antardasha Generation
    const rawAds: any[] = md.antardashas && Array.isArray(md.antardashas) ? md.antardashas : [];
    const antardashas: LifeTimelineAntardasha[] = rawAds.map((ad: any) => {
      const adSYr = parseYear(ad.start);
      const adEYr = parseYear(ad.end);
      const adStartDate = parseDate(ad.start);
      const adEndDate = parseDate(ad.end);

      const adIsPast = adEndDate.getTime() < now.getTime();
      const adIsFuture = adStartDate.getTime() > now.getTime();
      const adIsCurrent = now >= adStartDate && now <= adEndDate;

      let progressPercent = 0;
      if (adIsPast) progressPercent = 100;
      else if (adIsCurrent) {
        const total = adEndDate.getTime() - adStartDate.getTime();
        const el = now.getTime() - adStartDate.getTime();
        progressPercent = total > 0 ? Math.min(100, Math.max(0, Math.round((el / total) * 100))) : 50;
      }

      const syn = synthesizeAntardashaForecast(md.lord, ad.lord);
      const adFLord = getFunctionalLordship(ascSign, ad.lord);

      return {
        lord: ad.lord,
        mahadashaLord: md.lord,
        startFormatted: ad.start,
        endFormatted: ad.end,
        startYear: adSYr,
        endYear: adEYr,
        startAge: Math.max(0, adSYr - birthYear),
        endAge: Math.max(0, adEYr - birthYear),
        isPast: adIsPast,
        isCurrent: adIsCurrent,
        isFuture: adIsFuture,
        progressPercent,
        karmicPotential: Math.min(98, Math.max(35, syn.karmicPotential + Math.round(adFLord.bonus * 0.4))),
        milestoneTitle: syn.milestoneTitle,
        forecast: syn.forecast,
        functionalRole: adFLord.role,
        functionalBadge: adFLord.badge,
      };
    });

    return {
      lord: md.lord,
      startYear: sYr,
      endYear: eYr,
      startFormatted: md.start,
      endFormatted: md.end,
      startAge,
      endAge,
      isPast,
      isCurrent,
      isFuture,
      karmicPotential,
      milestoneTitle,
      forecast,
      antardashas,
      functionalRole: fLord.role,
      functionalBadge: fLord.badge,
    };
  });
}
