// --- Divisional Varga Chart Explanations ---
export const VARGA_INFO: Record<string, { title: string; description: string }> = {
  D1: { title: "D1 Lagna (Birth)", description: "Primary life, self-identity, physique, and general path of life." },
  D2: { title: "D2 Hora (Wealth)", description: "Wealth accumulation, financial resources, values, and family assets." },
  D3: { title: "D3 Drekkana (Siblings)", description: "Siblings, courage, motivation, drive, and initiatives." },
  D4: { title: "D4 Chaturthamsa (Property)", description: "Real estate, houses, fixed assets, and inner contentment." },
  D7: { title: "D7 Saptamsa (Progeny)", description: "Children, lineage, grand-children, and creative fruits." },
  D9: { title: "D9 Navamsa (Destiny)", description: "Inner potential, dharma, marital compatibility, and destiny after age 30." },
  D10: { title: "D10 Dasamsa (Career)", description: "Profession, career path, career success, and public status." },
  D12: { title: "D12 Dwadasamsa (Parents)", description: "Parents, lineage, ancestral karma, and family roots." },
  D16: { title: "D16 Shodasamsa (Luxuries)", description: "Vehicles, luxuries, material comforts, and general happiness." },
  D20: { title: "D20 Vimsamsa (Spirituality)", description: "Meditation, spiritual progress, divine worship, and devotion." },
  D24: { title: "D24 Chaturvimsamsa (Learning)", description: "Higher education, learning, scholarship, and skillsets." },
  D27: { title: "D27 Saptavimsamsa (Stamina)", description: "Physical stamina, mental strength, and inner temperament." },
  D30: { title: "D30 Trimsamsa (Obstacles)", description: "Arishthas, misdeeds, deep-seated weaknesses, and health trials." },
  D40: { title: "D40 Khavedamsa (Fortunes)", description: "Auspicious and inauspicious fruits of past-life deeds." },
  D45: { title: "D45 Akshavedamsa (Character)", description: "Moral integrity, purity of character, and ethical nature." },
  D60: { title: "D60 Shastiamsa (Karma)", description: "Deep-seated past-life karma, soul journey, and spiritual samskaras." },
};

export const LANGUAGES = [
  { code: "English", label: "English" },
  { code: "Hindi", label: "हिन्दी (Hindi)" },
  { code: "Gujarati", label: "ગુજરાતી (Gujarati)" },
  { code: "Marathi", label: "मराठी (Marathi)" },
  { code: "Tamil", label: "தமிழ் (Tamil)" },
  { code: "Telugu", label: "తెలుగు (Telugu)" },
  { code: "Bengali", label: "বাংলা (Bengali)" },
  { code: "Kannada", label: "ಕನ್ನಡ (Kannada)" },
];

export const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];
