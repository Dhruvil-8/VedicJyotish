"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Eye, Compass, Flame, ArrowRight } from "lucide-react";

export interface InspectedItem {
  type: "planet" | "house";
  houseNumber: number;
  houseSign: string;
  planet?: {
    name: string;
    sign: string;
    house: number;
    strength?: string;
    dignity?: string;
    nature?: string;
    nakshatra?: string;
    pada?: number;
    nakshatra_lord?: string;
    full_degree?: number;
    deg_in_sign?: number;
    retrograde?: boolean;
    combust?: boolean;
    navamsa_sign?: string;
  };
  housePlanets?: any[];
  aspects?: string[];
}

interface ChartInspectorModalProps {
  item: InspectedItem | null;
  onClose: () => void;
}

const HOUSE_NAMES: Record<number, { sanskrit: string; meaning: string; category: string }> = {
  1: { sanskrit: "Lagna / Tanu Bhava", meaning: "Self, Physical Body, Vitality, Identity", category: "Kendra / Trikona" },
  2: { sanskrit: "Dhana Bhava", meaning: "Wealth, Family, Speech, Assets, Food", category: "Panaphara / Maraka" },
  3: { sanskrit: "Sahaja / Bhratru Bhava", meaning: "Courage, Siblings, Communication, Short Travel", category: "Apoklima / Upachaya" },
  4: { sanskrit: "Sukha / Matru Bhava", meaning: "Mother, Mind, Comforts, Vehicles, Home", category: "Kendra / Moksha" },
  5: { sanskrit: "Putra / Purvapunya Bhava", meaning: "Children, Intellect, Past Life Merits, Romance", category: "Trikona / Dharma" },
  6: { sanskrit: "Ari / Shatru Bhava", meaning: "Enemies, Health Obstacles, Daily Work, Debts", category: "Apoklima / Dusthana / Upachaya" },
  7: { sanskrit: "Yuvati / Kalatra Bhava", meaning: "Spouse, Marriage, Business Partnerships, Public", category: "Kendra / Maraka" },
  8: { sanskrit: "Randhra / Ayur Bhava", meaning: "Longevity, Transformation, Hidden Knowledge, Crisis", category: "Panaphara / Dusthana" },
  9: { sanskrit: "Dharma / Bhagya Bhava", meaning: "Fortune, Higher Wisdom, Guru, Father, Righteousness", category: "Trikona / Dharma" },
  10: { sanskrit: "Karma Bhava", meaning: "Career, Status, Authority, Social Duty, Fame", category: "Kendra / Upachaya" },
  11: { sanskrit: "Labha / Aya Bhava", meaning: "Gains, Aspirations, Income, Social Network", category: "Panaphara / Upachaya" },
  12: { sanskrit: "Vyaya / Moksha Bhava", meaning: "Expenses, Foreign Lands, Subconscious, Liberation", category: "Apoklima / Dusthana / Moksha" },
};

const PLANET_DRISHTI: Record<string, number[]> = {
  Sun: [7],
  Moon: [7],
  Mercury: [7],
  Venus: [7],
  Mars: [4, 7, 8],
  Jupiter: [5, 7, 9],
  Saturn: [3, 7, 10],
  Rahu: [5, 7, 9],
  Ketu: [5, 7, 9],
};

function formatDegree(deg?: number) {
  if (deg === undefined || isNaN(deg)) return "N/A";
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  const s = Math.round(((deg - d) * 60 - m) * 60);
  return `${d}° ${m}' ${s}"`;
}

export default function ChartInspectorModal({ item, onClose }: ChartInspectorModalProps) {
  if (!item) return null;

  const houseInfo = HOUSE_NAMES[item.houseNumber] || {
    sanskrit: `House ${item.houseNumber}`,
    meaning: "Astrological House",
    category: "General",
  };

  const isPlanet = item.type === "planet" && item.planet;
  const p = item.planet;

  // Calculate aspects cast by this planet if viewing a planet
  const aspectsCast = isPlanet && p?.name && p.house
    ? (PLANET_DRISHTI[p.name] || [7]).map((offset) => {
        const targetHouse = ((p.house - 1 + offset) % 12) + 1;
        return { offset, targetHouse };
      })
    : [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg glass-parchment p-6 rounded-2xl shadow-2xl border border-primary/30 z-10 space-y-5 max-h-[90vh] overflow-y-auto scroll-thin select-none"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-primary/20 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-heading uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {isPlanet ? "Planetary Placement" : "House Focus"}
                </span>
                <span className="text-xs font-serif text-muted-foreground">
                  House {item.houseNumber} ({item.houseSign})
                </span>
              </div>
              <h3 className="text-xl font-heading text-primary font-bold mt-1 gold-glow">
                {isPlanet ? p?.name : houseInfo.sanskrit}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* House Info Badge */}
          <div className="p-3.5 bg-primary/5 rounded-xl border border-primary/15 text-xs space-y-1 font-serif">
            <div className="flex items-center justify-between text-[11px] font-heading text-primary">
              <span>{houseInfo.sanskrit}</span>
              <span className="text-muted-foreground font-normal">{houseInfo.category}</span>
            </div>
            <p className="text-foreground/80 leading-relaxed italic">{houseInfo.meaning}</p>
          </div>

          {/* Planet Details Section */}
          {isPlanet && p && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Sign & House */}
                <div className="p-3 bg-card/50 rounded-xl border border-border/30">
                  <div className="text-[10px] font-heading text-muted-foreground uppercase">Sign & House</div>
                  <div className="font-heading font-bold text-foreground mt-0.5">{p.sign}</div>
                  <div className="text-[11px] text-muted-foreground font-serif">House {p.house}</div>
                </div>

                {/* Degrees */}
                <div className="p-3 bg-card/50 rounded-xl border border-border/30">
                  <div className="text-[10px] font-heading text-muted-foreground uppercase">Exact Position</div>
                  <div className="font-heading font-bold text-primary mt-0.5">
                    {formatDegree(p.deg_in_sign ?? p.full_degree)}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-serif">
                    Longitude: {p.full_degree ? `${p.full_degree.toFixed(2)}°` : "N/A"}
                  </div>
                </div>

                {/* Nakshatra & Pada */}
                <div className="p-3 bg-card/50 rounded-xl border border-border/30">
                  <div className="text-[10px] font-heading text-muted-foreground uppercase">Nakshatra & Pada</div>
                  <div className="font-heading font-bold text-foreground mt-0.5">
                    {p.nakshatra || "N/A"}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-serif">
                    Pada {p.pada || 1} {p.nakshatra_lord ? `(${p.nakshatra_lord} Lord)` : ""}
                  </div>
                </div>

                {/* Dignity & Navamsa */}
                <div className="p-3 bg-card/50 rounded-xl border border-border/30">
                  <div className="text-[10px] font-heading text-muted-foreground uppercase">Dignity & D9</div>
                  <div className="font-heading font-bold text-secondary mt-0.5">
                    {p.dignity || p.strength || "Neutral"}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-serif">
                    D9: {p.navamsa_sign || "N/A"}
                  </div>
                </div>
              </div>

              {/* Status Badges */}
              {(p.retrograde || p.combust) && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {p.retrograde && (
                    <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-heading text-[10px] rounded-full flex items-center gap-1.5 font-bold">
                      <Star className="w-3 h-3" /> Retrograde (Vakri) — Internalized Strong Karma
                    </span>
                  )}
                  {p.combust && (
                    <span className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 font-heading text-[10px] rounded-full flex items-center gap-1.5 font-bold">
                      <Flame className="w-3 h-3" /> Combust (Asta) — Under Solar Rays
                    </span>
                  )}
                </div>
              )}

              {/* Drishti (Aspects Cast) */}
              {aspectsCast.length > 0 && (
                <div className="p-3.5 bg-primary/5 rounded-xl border border-primary/15 space-y-2">
                  <div className="text-[11px] font-heading text-primary font-bold flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" /> Planetary Aspects (Drishti) Cast
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-serif">
                    {aspectsCast.map((asp, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-card rounded-lg border border-border/40 text-foreground flex items-center gap-1.5 text-[11px]"
                      >
                        <span>{asp.offset}th Aspect</span>
                        <ArrowRight className="w-3 h-3 text-primary" />
                        <span className="font-heading font-bold text-primary">House {asp.targetHouse}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* House Planets List (when viewing house) */}
          {!isPlanet && (
            <div className="space-y-3">
              <div className="text-xs font-heading text-primary font-bold uppercase tracking-wider">
                Occupying Planets in House {item.houseNumber}
              </div>
              {item.housePlanets && item.housePlanets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {item.housePlanets.map((hp: any, idx: number) => {
                    const name = typeof hp === "string" ? hp : hp.name;
                    const deg = typeof hp === "object" ? hp.deg_in_sign ?? hp.full_degree : null;
                    const dignity = typeof hp === "object" ? hp.dignity || hp.strength : null;
                    return (
                      <div
                        key={idx}
                        className="p-2.5 bg-card/60 rounded-lg border border-border/30 flex items-center justify-between text-xs font-serif"
                      >
                        <span className="font-heading font-bold text-foreground">{name}</span>
                        <div className="text-right text-[10px] text-muted-foreground">
                          {dignity && <div className="text-secondary font-bold">{dignity}</div>}
                          {deg !== null && <div>{formatDegree(deg)}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 bg-muted/20 rounded-xl text-center text-xs font-serif text-muted-foreground italic">
                  No planets occupying this house (vacant house). The house is primarily governed by its sign lord.
                </div>
              )}
            </div>
          )}

          {/* Footer Action */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-primary text-primary-foreground font-heading text-xs rounded-full hover:shadow-md transition-all cursor-pointer"
            >
              Close Inspector
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
