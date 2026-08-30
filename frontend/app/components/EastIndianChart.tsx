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

interface EastIndianChartProps {
  chartData: Record<string, HouseData>;
  ascendantSign: string;
  title?: string;
  className?: string;
  onSelectHouse?: (houseNumber: number, signName: string, planets: any[]) => void;
  onSelectPlanet?: (planet: any, houseNumber: number, signName: string) => void;
  transitData?: Record<string, any[]> | null;
  isTransitActive?: boolean;
}

const SIGNS_LIST = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const SIGN_SANSKRIT: Record<string, string> = {
  Aries: "मेष", Taurus: "वृषभ", Gemini: "मिथुन", Cancer: "कर्क",
  Leo: "सिंह", Virgo: "कन्या", Libra: "तुला", Scorpio: "वृश्चिक",
  Sagittarius: "धनु", Capricorn: "मकर", Aquarius: "कुम्भ", Pisces: "मीन",
};

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me",
  Jupiter: "Ju", Venus: "Ve", Saturn: "Sa", Rahu: "Ra", Ketu: "Ke"
};

// East Indian (Bengali) fixed sign coordinates on SVG
// Signs have fixed boxes/triangles:
// Aries: Top-Center Diamond top
// Pisces: Top-Left
// Taurus: Top-Right
// Gemini: Right-Top
// Cancer: Right-Center
// Leo: Right-Bottom
// Virgo: Bottom-Right
// Libra: Bottom-Center
// Scorpio: Bottom-Left
// Sagittarius: Left-Bottom
// Capricorn: Left-Center
// Aquarius: Left-Top
const EAST_SIGN_CENTERS: Record<string, { x: number; y: number }> = {
  Pisces: { x: 25, y: 15 },
  Aries: { x: 50, y: 25 },
  Taurus: { x: 75, y: 15 },
  Gemini: { x: 85, y: 35 },
  Cancer: { x: 75, y: 50 },
  Leo: { x: 85, y: 65 },
  Virgo: { x: 75, y: 85 },
  Libra: { x: 50, y: 75 },
  Scorpio: { x: 25, y: 85 },
  Sagittarius: { x: 15, y: 65 },
  Capricorn: { x: 25, y: 50 },
  Aquarius: { x: 15, y: 35 },
};

export default function EastIndianChart({
  chartData,
  ascendantSign,
  title = "East Indian Chart",
  className,
  onSelectHouse,
  onSelectPlanet,
  transitData,
  isTransitActive = false,
}: EastIndianChartProps) {
  const [hoveredSign, setHoveredSign] = useState<string | null>(null);

  const ascIdx = SIGNS_LIST.indexOf(ascendantSign);

  // Map each sign to its house number and planets
  const signDetailsMap = React.useMemo(() => {
    const map: Record<string, { houseNumber: number; planets: any[] }> = {};

    SIGNS_LIST.forEach((signName) => {
      const sIdx = SIGNS_LIST.indexOf(signName);
      const houseNumber = ((sIdx - ascIdx + 12) % 12) + 1;
      const hKey = `house_${houseNumber}`;
      const houseObj = chartData?.[hKey];
      const planets = houseObj?.planets || [];
      map[signName] = { houseNumber, planets: Array.isArray(planets) ? planets : [] };
    });

    return map;
  }, [chartData, ascIdx]);

  return (
    <div className={cn("w-full aspect-square max-w-[500px] mx-auto select-none relative", className)}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
        {/* Outer Frame */}
        <rect
          x="1"
          y="1"
          width="98"
          height="98"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          className="text-primary/60"
        />

        {/* East Indian Traditional Cross & Diamond Lines */}
        {/* Main Diagonals */}
        <line x1="1" y1="1" x2="99" y2="99" stroke="currentColor" strokeWidth="0.5" className="text-primary/40" />
        <line x1="99" y1="1" x2="1" y2="99" stroke="currentColor" strokeWidth="0.5" className="text-primary/40" />

        {/* Inner Diamond */}
        <line x1="50" y1="1" x2="99" y2="50" stroke="currentColor" strokeWidth="0.6" className="text-primary/50" />
        <line x1="99" y1="50" x2="50" y2="99" stroke="currentColor" strokeWidth="0.6" className="text-primary/50" />
        <line x1="50" y1="99" x2="1" y2="50" stroke="currentColor" strokeWidth="0.6" className="text-primary/50" />
        <line x1="1" y1="50" x2="50" y2="1" stroke="currentColor" strokeWidth="0.6" className="text-primary/50" />

        {/* Secondary Dividing Lines for 12 segments */}
        <line x1="50" y1="1" x2="50" y2="99" stroke="currentColor" strokeWidth="0.4" strokeDasharray="1 1" className="text-primary/30" />
        <line x1="1" y1="50" x2="99" y2="50" stroke="currentColor" strokeWidth="0.4" strokeDasharray="1 1" className="text-primary/30" />

        {/* Center Title Badge */}
        <rect
          x="40"
          y="46"
          width="20"
          height="8"
          rx="2"
          fill="currentColor"
          className="text-card/90 stroke-primary/30"
          strokeWidth="0.3"
        />
        <text
          x="50"
          y="51"
          textAnchor="middle"
          fontSize="2.4"
          fontWeight="bold"
          fill="currentColor"
          className="text-primary font-heading"
        >
          {title.slice(0, 10)}
        </text>
      </svg>

      {/* HTML Interactive Overlay for 12 Fixed Sign Regions */}
      <div className="absolute inset-0 pointer-events-auto">
        {SIGNS_LIST.map((signName) => {
          const center = EAST_SIGN_CENTERS[signName];
          const { houseNumber, planets } = signDetailsMap[signName] || { houseNumber: 1, planets: [] };
          const isAscendant = signName === ascendantSign;
          const isHovered = hoveredSign === signName;

          return (
            <div
              key={signName}
              style={{
                position: "absolute",
                left: `${center.x}%`,
                top: `${center.y}%`,
                transform: "translate(-50%, -50%)",
              }}
              onMouseEnter={() => setHoveredSign(signName)}
              onMouseLeave={() => setHoveredSign(null)}
              onClick={() => onSelectHouse?.(houseNumber, signName, planets)}
              className={cn(
                "p-1 rounded-lg transition-all text-center cursor-pointer min-w-[55px] sm:min-w-[65px] flex flex-col items-center justify-center",
                isAscendant ? "bg-primary/20 ring-1 ring-primary/80 shadow-sm" : "hover:bg-primary/10",
                isHovered && "scale-105"
              )}
            >
              {/* Sign Header & House */}
              <div className="flex items-center gap-1 text-[8px] sm:text-[9px] font-heading font-semibold text-foreground/80">
                <span>{signName.slice(0, 3)}</span>
                {isAscendant ? (
                  <span className="bg-primary text-primary-foreground text-[7px] px-1 py-0.2 rounded font-extrabold">
                    ASC
                  </span>
                ) : (
                  <span className="text-[7px] text-muted-foreground font-mono">H{houseNumber}</span>
                )}
              </div>

              {/* Planets */}
              <div className="flex flex-wrap gap-0.5 items-center justify-center mt-0.5">
                {planets.map((p: any, pIdx: number) => {
                  const pName = typeof p === "string" ? p : p.name;
                  const sym = PLANET_SYMBOLS[pName] || pName.slice(0, 2);
                  const isRetro = p?.retrograde;

                  return (
                    <span
                      key={pIdx}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPlanet?.(p, houseNumber, signName);
                      }}
                      className={cn(
                        "inline-flex items-center gap-0.5 px-1 rounded text-[8px] sm:text-[9px] font-heading font-bold shadow-xs cursor-pointer",
                        pName === "Jupiter" ? "bg-amber-500/20 text-amber-700 dark:text-amber-300" :
                        pName === "Venus" ? "bg-pink-500/20 text-pink-700 dark:text-pink-300" :
                        pName === "Mars" ? "bg-red-500/20 text-red-700 dark:text-red-300" :
                        pName === "Saturn" ? "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300" :
                        "bg-primary/20 text-primary"
                      )}
                    >
                      {sym}
                      {isRetro && <span className="text-[6px] text-destructive font-black">R</span>}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
