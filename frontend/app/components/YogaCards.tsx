"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, AlertTriangle, Sparkles, BookOpen, X, CheckCircle2, ChevronRight } from "lucide-react";

interface Yoga {
  name: string;
  description: string;
  type: string;
  planets?: string[];
  houses?: number[];
}

interface YogaCardsProps {
  yogas: Yoga[];
  className?: string;
}

const YOGA_CLASSICAL_KNOWLEDGE: Record<
  string,
  {
    category: string;
    source: string;
    condition: string;
    mitigation: string;
    impact: string;
  }
> = {
  "Gajakesari Yoga": {
    category: "Auspicious Raja / Dhana Yoga",
    source: "Brihat Parashara Hora Shastra (BPHS Ch. 36) & Phaladeepika",
    condition: "Jupiter is in a Kendra (1st, 4th, 7th, or 10th house) from the Moon or Lagna, free from debilitation.",
    mitigation: "If Jupiter or Moon is afflicted by Rahu or Saturn, the full fruits may be realized later in life after age 32.",
    impact: "Bestows sharp intellect, magnetic speech, lasting reputation, leadership qualities, and unwavering protection in difficult times.",
  },
  "Budhaditya Yoga": {
    category: "Nipuna / Intellect Yoga",
    source: "Saravali & Brihat Jataka",
    condition: "Conjunction of the Sun and Mercury in the same sign (ideally beyond 3° to avoid deep combustion).",
    mitigation: "If Mercury is deeply combust within 1°, intellectual prowess manifests more internally through analytical and research skills.",
    impact: "Exceptional analytical prowess, administrative capability, eloquence in speech, and success in commerce, governance, or academia.",
  },
  "Pancha Mahapurusha - Hamsa": {
    category: "Pancha Mahapurusha (Jupiter)",
    source: "BPHS Ch. 75 & Mantreswara's Phaladeepika",
    condition: "Jupiter in exaltation (Cancer) or own sign (Sagittarius/Pisces) placed in a Kendra house (1, 4, 7, 10).",
    mitigation: "Requires strong Ascendant lord to deliver maximum social and spiritual authority.",
    impact: "Eminent wisdom, righteous character, universal respect, spiritual purity, and high academic or advisory status.",
  },
  "Pancha Mahapurusha - Malavya": {
    category: "Pancha Mahapurusha (Venus)",
    source: "BPHS Ch. 75",
    condition: "Venus in exaltation (Pisces) or own sign (Taurus/Libra) in a Kendra house (1, 4, 7, 10).",
    mitigation: "Weakened if aspected by intense malefic Mars/Rahu without benefic relief.",
    impact: "Refined aesthetic taste, luxury, vehicle comforts, charismatic demeanor, artistic mastery, and happy conjugal life.",
  },
  "Pancha Mahapurusha - Ruchaka": {
    category: "Pancha Mahapurusha (Mars)",
    source: "BPHS Ch. 75",
    condition: "Mars in exaltation (Capricorn) or own sign (Aries/Scorpio) in a Kendra house (1, 4, 7, 10).",
    mitigation: "Needs disciplined channel to avoid excessive impulsiveness or impatience.",
    impact: "Tremendous physical vitality, bold courage, military/executive leadership, land ownership, and triumph over competitors.",
  },
  "Pancha Mahapurusha - Bhadra": {
    category: "Pancha Mahapurusha (Mercury)",
    source: "BPHS Ch. 75",
    condition: "Mercury in exaltation (Virgo) or own sign (Gemini) in a Kendra house (1, 4, 7, 10).",
    mitigation: "Strengthened further when aspected by Jupiter or unafflicted by malefic nodes.",
    impact: "Genius-level mathematical and linguistic acumen, commercial mastery, strategic planning, and youthfulness.",
  },
  "Pancha Mahapurusha - Sasa": {
    category: "Pancha Mahapurusha (Saturn)",
    source: "BPHS Ch. 75",
    condition: "Saturn in exaltation (Libra) or own sign (Capricorn/Aquarius) in a Kendra house (1, 4, 7, 10).",
    mitigation: "Results mature with patient perseverance, yielding lasting triumphs in the second half of life.",
    impact: "Unshakable perseverance, mass appeal, mastery over organizations, deep philosophical maturity, and resilience.",
  },
  "Vipareeta Raja Yoga": {
    category: "Special Protective Raja Yoga",
    source: "Uttara Kalamrita (Kalidasa)",
    condition: "Lords of Dusthana houses (6th, 8th, 12th) placed exclusively in 6th, 8th, or 12th houses without Kendra/Trikona connection.",
    mitigation: "Lords should ideally be free from Kendra lords' conjunctions to preserve pure Vipareeta status.",
    impact: "Rise to unexpected triumph and sudden fortune arising out of adversities, competitors' missteps, or crisis resolutions.",
  },
  "Dharma Karmadhipati Yoga": {
    category: "Supreme Raja Yoga",
    source: "BPHS Ch. 34 & Jataka Parijata",
    condition: "Mutual conjunction, aspect, or mutual reception between the 9th lord (Dharma) and 10th lord (Karma).",
    mitigation: "Most powerful when placed in Kendra or Trikona houses.",
    impact: "Harmonious blend of righteousness and career authority, widespread renown, ethical governance, and immense fortune.",
  },
  "Chandra Mangala Yoga": {
    category: "Dhana / Financial Enterprise Yoga",
    source: "Saravali",
    condition: "Conjunction or mutual opposition (1/7 axis) between Moon and Mars.",
    mitigation: "Benefic influence softens emotional temperament while channeling drive toward constructive enterprise.",
    impact: "High commercial enterprise, financial acumen, earnings through independent initiatives, real estate, and trade.",
  },
  "Kala Sarpa Dosha": {
    category: "Karmic Axis Enclosure",
    source: "Traditional Jyotish Shastras",
    condition: "All seven traditional planets hemmed between Rahu and Ketu axis.",
    mitigation: "If any planet is conjunct Rahu/Ketu or beyond the axis (Kala Amrita), or after age 33, the intense focus yields exceptional achievements.",
    impact: "Initial intense struggles and karmic hurdles followed by profound breakthroughs and unconventional success.",
  },
  "Manglik / Kuja Dosha": {
    category: "Martial Energy Alignment",
    source: "Brihat Parashara Hora Shastra",
    condition: "Mars placed in houses 1, 2, 4, 7, 8, or 12 from Lagna, Moon, or Venus.",
    mitigation: "Mars in own sign (Aries/Scorpio), exalted (Capricorn), conjunct Jupiter, or in mutual matching with a partner's Mars neutralizes friction.",
    impact: "High passion, directness, and dynamism in relationships requiring constructive communication and energetic balance.",
  },
};

export default function YogaCards({ yogas, className }: YogaCardsProps) {
  const [selectedYoga, setSelectedYoga] = useState<Yoga | null>(null);

  if (!yogas || yogas.length === 0) return null;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-primary font-heading gold-glow">Auspicious & Significant Yogas</h3>
          <p className="text-xs text-muted-foreground font-serif">
            Classical planetary combinations detected in your natal horoscope.
          </p>
        </div>
        <span className="text-[10px] font-heading uppercase px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full">
          {yogas.length} Active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {yogas.map((yoga, i) => {
          const isBenefic = yoga.type === "benefic";
          const knowledge = YOGA_CLASSICAL_KNOWLEDGE[yoga.name];

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedYoga(yoga)}
              className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg select-none group ${
                isBenefic
                  ? "glass-parchment border-primary/30 hover:border-primary"
                  : "bg-red-950/20 border-red-500/30 hover:border-red-500"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isBenefic ? "bg-primary/10 text-primary" : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {isBenefic ? (
                        <Star className="w-4 h-4 fill-primary/30" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                    </div>
                    <h4
                      className={`text-sm font-heading font-bold ${
                        isBenefic ? "text-primary" : "text-red-400"
                      }`}
                    >
                      {yoga.name}
                    </h4>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </div>

                <p className="text-xs text-muted-foreground mt-2 font-serif leading-relaxed line-clamp-2">
                  {yoga.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-border/20 flex items-center justify-between text-[10px] font-serif text-muted-foreground">
                <span>{knowledge?.category || (isBenefic ? "Classical Benefic Yoga" : "Dosha Combination")}</span>
                <span className="text-primary font-heading font-semibold group-hover:underline">
                  View Rules →
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Interactive Yoga Explainer Modal */}
      <AnimatePresence>
        {selectedYoga && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedYoga(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg glass-parchment p-6 rounded-2xl shadow-2xl border border-primary/30 z-10 space-y-5 max-h-[90vh] overflow-y-auto scroll-thin select-none"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-primary/20 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-heading uppercase tracking-widest px-2.5 py-0.5 rounded-full font-bold ${
                        selectedYoga.type === "benefic"
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                    >
                      {selectedYoga.type === "benefic" ? "Benefic Combination" : "Dosha Alignment"}
                    </span>
                    <span className="text-[10px] font-serif text-muted-foreground">
                      Parashari Standard
                    </span>
                  </div>
                  <h3 className="text-xl font-heading text-primary font-bold gold-glow">
                    {selectedYoga.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedYoga(null)}
                  className="p-1.5 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Natal Placement Summary */}
              <div className="p-3.5 bg-primary/5 rounded-xl border border-primary/15 space-y-1">
                <div className="text-[10px] font-heading uppercase tracking-wider text-primary font-bold">
                  Natal Chart Manifestation
                </div>
                <p className="text-xs font-serif text-foreground/90 leading-relaxed">
                  {selectedYoga.description}
                </p>
              </div>

              {/* Classical Breakdown */}
              {(() => {
                const knowledge = YOGA_CLASSICAL_KNOWLEDGE[selectedYoga.name];
                return (
                  <div className="space-y-3 text-xs font-serif">
                    {/* Classical Formation Condition */}
                    <div className="p-3 bg-card/60 rounded-xl border border-border/30 space-y-1">
                      <div className="text-[10px] font-heading uppercase text-muted-foreground font-bold flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-primary" /> Classical Formation Rule
                      </div>
                      <p className="text-foreground/90 leading-relaxed">
                        {knowledge?.condition ||
                          "Triggered by specific mathematical house relationships and planetary dignities defined in classical Jyotish treatises."}
                      </p>
                      {knowledge?.source && (
                        <div className="text-[10px] text-muted-foreground italic pt-1">
                          Source: {knowledge.source}
                        </div>
                      )}
                    </div>

                    {/* Mitigation & Bhanga Factors */}
                    <div className="p-3 bg-card/60 rounded-xl border border-border/30 space-y-1">
                      <div className="text-[10px] font-heading uppercase text-muted-foreground font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-secondary" /> Mitigation & Nuance (Bhanga)
                      </div>
                      <p className="text-foreground/90 leading-relaxed">
                        {knowledge?.mitigation ||
                          "Benefic aspects from Jupiter, Moon, or exalted Ascendant lord modify the intensity and channel its outcomes constructively."}
                      </p>
                    </div>

                    {/* Practical Real-World Impact */}
                    <div className="p-3 bg-card/60 rounded-xl border border-border/30 space-y-1">
                      <div className="text-[10px] font-heading uppercase text-muted-foreground font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-accent" /> Key Significations
                      </div>
                      <p className="text-foreground/90 leading-relaxed">
                        {knowledge?.impact ||
                          "Shapes character, professional drive, financial resilience, and mental fortitude during active dasha cycles."}
                      </p>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedYoga(null)}
                  className="px-5 py-2 bg-primary text-primary-foreground font-heading text-xs rounded-full hover:shadow-md transition-all cursor-pointer"
                >
                  Close Explainer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
