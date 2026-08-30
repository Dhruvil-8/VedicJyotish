"use client";

import React, { useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Planet {
  name: string;
  sign: string;
  house: number;
  strength?: string;
  dignity?: string;
  nature?: string;
  nakshatra?: string;
  pada?: number;
  full_degree?: number;
  deg_in_sign?: number;
  retrograde?: boolean;
  combust?: boolean;
  navamsa_sign?: string;
}

interface HouseData {
  sign: string;
  planets: string[] | Planet[];
}

interface SouthIndianChartProps {
  chartData: Record<string, HouseData>;
  ascendantSign: string;
  title?: string;
  className?: string;
  onSelectHouse?: (houseNumber: number, signName: string, planets: any[]) => void;
  onSelectPlanet?: (planet: any, houseNumber: number, signName: string) => void;
  transitData?: Record<string, any[]> | null;
  isTransitActive?: boolean;
}

const SIGNS_ORDER = [
  "Aries", "Taurus", "Gemini", "Cancer",
  "Leo", "Virgo", "Libra", "Scorpio",
  "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const SIGN_SANSKRIT: Record<string, string> = {
  Aries: "मेष",
  Taurus: "वृषभ",
  Gemini: "मिथुन",
  Cancer: "कर्क",
  Leo: "सिंह",
  Virgo: "कन्या",
  Libra: "तुला",
  Scorpio: "वृश्चिक",
  Sagittarius: "धनु",
  Capricorn: "मकर",
  Aquarius: "कुम्भ",
  Pisces: "मीन",
};

// South Indian Fixed 4x4 Grid Position for each of the 12 signs
// [col (0..3), row (0..3)]
const SOUTH_SIGN_GRID_COORDS: Record<string, { col: number; row: number }> = {
  Pisces: { col: 0, row: 0 },
  Aries: { col: 1, row: 0 },
  Taurus: { col: 2, row: 0 },
  Gemini: { col: 3, row: 0 },
  Cancer: { col: 3, row: 1 },
  Leo: { col: 3, row: 2 },
  Virgo: { col: 3, row: 3 },
  Libra: { col: 2, row: 3 },
  Scorpio: { col: 1, row: 3 },
  Sagittarius: { col: 0, row: 3 },
  Capricorn: { col: 0, row: 2 },
  Aquarius: { col: 0, row: 1 },
};

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me",
  Jupiter: "Ju", Venus: "Ve", Saturn: "Sa", Rahu: "Ra", Ketu: "Ke"
};

export default function SouthIndianChart({
  chartData,
  ascendantSign,
  title = "Rasi Chakra",
  className,
  onSelectHouse,
  onSelectPlanet,
  transitData,
  isTransitActive = false,
}: SouthIndianChartProps) {
  const [hoveredSign, setHoveredSign] = useState<string | null>(null);

  const ascIdx = SIGNS_ORDER.indexOf(ascendantSign);

  // Map each sign to its house number and planets
  const signDetailsMap = React.useMemo(() => {
    const map: Record<string, { houseNumber: number; planets: any[] }> = {};

    SIGNS_ORDER.forEach((signName) => {
      const sIdx = SIGNS_ORDER.indexOf(signName);
      const houseNumber = ((sIdx - ascIdx + 12) % 12) + 1;
      const hKey = `house_${houseNumber}`;
      const houseObj = chartData?.[hKey];
      const planets = houseObj?.planets || [];
      map[signName] = { houseNumber, planets: Array.isArray(planets) ? planets : [] };
    });

    return map;
  }, [chartData, ascIdx]);

  return (
    <div className={cn("w-full aspect-square max-w-[500px] mx-auto select-none", className)}>
      <div className="grid grid-cols-4 grid-rows-4 w-full h-full border-2 border-primary/40 rounded-2xl overflow-hidden bg-card/60 shadow-xl backdrop-blur-md relative">
        {/* Render 12 Fixed Sign Cells */}
        {SIGNS_ORDER.map((signName) => {
          const { col, row } = SOUTH_SIGN_GRID_COORDS[signName];
          const { houseNumber, planets } = signDetailsMap[signName] || { houseNumber: 1, planets: [] };
          const isAscendant = signName === ascendantSign;
          const isHovered = hoveredSign === signName;

          // Transits for this house
          const transits = (isTransitActive && transitData?.[`house_${houseNumber}`]) || [];

          return (
            <div
              key={signName}
              style={{
                gridColumnStart: col + 1,
                gridRowStart: row + 1,
              }}
              onMouseEnter={() => setHoveredSign(signName)}
              onMouseLeave={() => setHoveredSign(null)}
              onClick={() => onSelectHouse?.(houseNumber, signName, planets)}
              className={cn(
                "p-1.5 sm:p-2.5 border border-border/30 flex flex-col justify-between cursor-pointer transition-all relative overflow-hidden",
                isAscendant ? "bg-primary/15 border-primary/60 shadow-inner" : "bg-card/40 hover:bg-primary/5",
                isHovered && "ring-1 ring-primary/50 bg-primary/10"
              )}
            >
              {/* Header: Sign Name & House Number */}
              <div className="flex items-center justify-between text-[10px] sm:text-xs">
                <span className="font-heading font-semibold text-foreground/80 truncate">
                  {signName.slice(0, 3)} <span className="text-[8px] text-muted-foreground font-serif">({SIGN_SANSKRIT[signName]})</span>
                </span>

                {isAscendant ? (
                  <span className="bg-primary text-primary-foreground font-heading font-extrabold text-[8px] sm:text-[9px] px-1 py-0.2 rounded shadow-sm">
                    ASC / H1
                  </span>
                ) : (
                  <span className="text-[9px] text-muted-foreground font-mono">
                    H{houseNumber}
                  </span>
                )}
              </div>

              {/* Natal Planets */}
              <div className="my-auto flex flex-wrap gap-1 items-center justify-center py-1">
                {planets.map((p: any, pIdx: number) => {
                  const pName = typeof p === "string" ? p : p.name;
                  const sym = PLANET_SYMBOLS[pName] || pName.slice(0, 2);
                  const isRetro = p?.retrograde;
                  const deg = p?.deg_in_sign !== undefined ? `${Math.floor(p.deg_in_sign)}°` : "";

                  return (
                    <span
                      key={pIdx}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPlanet?.(p, houseNumber, signName);
                      }}
                      className={cn(
                        "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-heading font-bold transition-all shadow-xs cursor-pointer",
                        pName === "Jupiter" ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30" :
                        pName === "Venus" ? "bg-pink-500/20 text-pink-700 dark:text-pink-300 border border-pink-500/30" :
                        pName === "Mars" ? "bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30" :
                        pName === "Saturn" ? "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30" :
                        pName === "Mercury" ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30" :
                        pName === "Sun" ? "bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-500/30" :
                        pName === "Moon" ? "bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30" :
                        "bg-primary/20 text-primary border border-primary/30"
                      )}
                    >
                      <span>{sym}</span>
                      {deg && <span className="text-[7px] font-mono opacity-80">{deg}</span>}
                      {isRetro && <span className="text-[7px] text-destructive font-black">(R)</span>}
                    </span>
                  );
                })}
              </div>

              {/* Transit Overlay */}
              {transits.length > 0 && (
                <div className="flex flex-wrap gap-0.5 border-t border-emerald-500/30 pt-0.5">
                  {transits.map((tp: any, tIdx: number) => (
                    <span
                      key={tIdx}
                      className="text-[7px] font-mono px-1 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                    >
                      {PLANET_SYMBOLS[tp.name] || tp.name.slice(0, 2)}T
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* 2x2 Center Box: Chart Metadata & Title */}
        <div className="col-start-2 col-end-4 row-start-2 row-end-4 p-4 border border-primary/30 bg-primary/5 flex flex-col items-center justify-center text-center space-y-1 rounded-xl m-1 shadow-inner">
          <span className="text-[9px] font-heading uppercase text-secondary tracking-widest">
            South Indian Style (दक्षिण चक्र)
          </span>
          <h4 className="font-heading text-base font-bold text-primary">{title}</h4>
          <div className="text-[10px] text-muted-foreground font-serif">
            Lagna (Ascendant): <strong className="text-foreground">{ascendantSign}</strong>
          </div>
          {isTransitActive && (
            <span className="text-[8px] font-heading font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 border border-emerald-500/40">
              Live Gochara Transits Active
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
