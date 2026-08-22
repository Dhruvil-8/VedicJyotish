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

interface NorthIndianChartProps {
  chartData: Record<string, HouseData>;
  ascendantSign: string;
  title?: string;
  className?: string;
  onSelectHouse?: (houseNumber: number, signName: string, planets: any[]) => void;
  onSelectPlanet?: (planet: any, houseNumber: number, signName: string) => void;
  transitData?: Record<string, any[]> | null;
  isTransitActive?: boolean;
}

const HOUSE_CENTERS = [
  { x: 50, y: 33 }, // H1
  { x: 25, y: 17 }, // H2
  { x: 17, y: 25 }, // H3
  { x: 33, y: 50 }, // H4
  { x: 17, y: 75 }, // H5
  { x: 25, y: 83 }, // H6
  { x: 50, y: 67 }, // H7
  { x: 75, y: 83 }, // H8
  { x: 83, y: 75 }, // H9
  { x: 67, y: 50 }, // H10
  { x: 83, y: 25 }, // H11
  { x: 75, y: 17 }, // H12
];

const SIGN_POSITIONS = [
  { x: 50, y: 20 }, // H1  — top center
  { x: 25, y: 8 },  // H2  — top-left
  { x: 8, y: 25 },  // H3  — left-top
  { x: 20, y: 50 }, // H4  — left center
  { x: 8, y: 75 },  // H5  — left-bottom
  { x: 25, y: 92 }, // H6  — bottom-left
  { x: 50, y: 80 }, // H7  — bottom center
  { x: 75, y: 92 }, // H8  — bottom-right
  { x: 92, y: 75 }, // H9  — right-bottom
  { x: 80, y: 50 }, // H10 — right center
  { x: 92, y: 25 }, // H11 — right-top
  { x: 75, y: 8 },  // H12 — top-right
];

const SIGNS_LIST = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me",
  Jupiter: "Ju", Venus: "Ve", Saturn: "Sa", Rahu: "Ra", Ketu: "Ke"
};

function NorthIndianChart({
  chartData,
  ascendantSign,
  title,
  className,
  onSelectHouse,
  onSelectPlanet,
  transitData,
  isTransitActive = false,
}: NorthIndianChartProps) {
  const [hoveredHouse, setHoveredHouse] = useState<number | null>(null);

  const getSignIndex = (signName: string) => {
    const idx = SIGNS_LIST.indexOf(signName);
    return idx === -1 ? 0 : idx;
  };

  const ascIdx = getSignIndex(ascendantSign);

  const renderPlanets = (houseIndex: number, houseSign: string) => {
    const houseKey = `house_${houseIndex + 1}`;
    const house = chartData[houseKey];
    const planets = house?.planets || [];

    if (planets.length === 0 && (!isTransitActive || !transitData?.[houseKey]?.length)) {
      return null;
    }

    return (
      <>
        {planets.map((p, i) => {
          const name = typeof p === "string" ? p : p.name;
          const isRetro = typeof p === "object" && p.retrograde;
          const isCombust = typeof p === "object" && p.combust;
          const symbol = PLANET_SYMBOLS[name] || name;

          return (
            <tspan
              key={`natal-${i}`}
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectPlanet) {
                  onSelectPlanet(
                    typeof p === "object" ? p : { name: p, sign: houseSign, house: houseIndex + 1 },
                    houseIndex + 1,
                    houseSign
                  );
                } else if (onSelectHouse) {
                  onSelectHouse(houseIndex + 1, houseSign, planets);
                }
              }}
              className={cn(
                "font-bold transition-all hover:scale-125 cursor-pointer",
                isRetro && "fill-amber-500 underline font-extrabold",
                isCombust && "fill-rose-500 opacity-90",
                !isRetro && !isCombust && "fill-foreground hover:fill-primary"
              )}
            >
              {symbol}{i < planets.length - 1 ? " " : ""}
            </tspan>
          );
        })}

        {/* Transit Planets Overlay */}
        {isTransitActive && transitData?.[houseKey] && transitData[houseKey].length > 0 && (
          <tspan
            x={HOUSE_CENTERS[houseIndex].x}
            dy="3.5"
            className="fill-emerald-600 dark:fill-emerald-400 font-bold text-[3.8px] tracking-tight"
          >
            {transitData[houseKey].map((tp: any, ti: number) => {
              const tpName = typeof tp === "string" ? tp : tp.name;
              const tpSym = PLANET_SYMBOLS[tpName] || tpName;
              return `T:${tpSym}${ti < transitData[houseKey].length - 1 ? " " : ""}`;
            })}
          </tspan>
        )}
      </>
    );
  };

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {title && <h3 className="text-primary text-lg font-heading gold-glow">{title}</h3>}
      <div className="w-full max-w-full aspect-square glass-parchment vedic-border relative select-none mx-auto overflow-hidden">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full stroke-primary/40 stroke-[0.5]"
          preserveAspectRatio="xMidYMid meet"
          aria-label="North Indian Kundli Chart"
          role="img"
        >
          {/* Main Diamond Grid */}
          <line x1="0" y1="0" x2="100" y2="100" strokeWidth="0.8" />
          <line x1="100" y1="0" x2="0" y2="100" strokeWidth="0.8" />
          <line x1="50" y1="0" x2="0" y2="50" strokeWidth="0.8" />
          <line x1="0" y1="50" x2="50" y2="100" strokeWidth="0.8" />
          <line x1="50" y1="100" x2="100" y2="50" strokeWidth="0.8" />
          <line x1="100" y1="50" x2="50" y2="0" strokeWidth="0.8" />

          <rect x="0" y="0" width="100" height="100" fill="none" strokeWidth="1" className="stroke-primary/20" />

          {/* Interactive House Nodes */}
          {HOUSE_CENTERS.map((pos, i) => {
            const houseSignNum = ((ascIdx + i) % 12) + 1;
            const houseSignName = SIGNS_LIST[(ascIdx + i) % 12];
            const houseKey = `house_${i + 1}`;
            const housePlanets = chartData[houseKey]?.planets || [];
            const isHovered = hoveredHouse === i + 1;

            return (
              <g
                key={i}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredHouse(i + 1)}
                onMouseLeave={() => setHoveredHouse(null)}
                onClick={() => onSelectHouse?.(i + 1, houseSignName, housePlanets)}
              >
                {/* Subtle Hover Pulse Circle */}
                {isHovered && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="12"
                    className="fill-primary/10 stroke-primary/30 stroke-[0.3] animate-pulse"
                  />
                )}

                {/* House Sign Number */}
                <text
                  x={SIGN_POSITIONS[i].x}
                  y={SIGN_POSITIONS[i].y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={cn(
                    "font-heading text-[4.5px] font-bold transition-colors",
                    isHovered ? "fill-secondary font-extrabold scale-110" : "fill-primary"
                  )}
                >
                  {houseSignNum}
                </text>

                {/* Occupying Natal and Transit Planets */}
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="font-serif text-[4.6px] font-semibold"
                >
                  {renderPlanets(i, houseSignName)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex items-center justify-between w-full px-2 text-[10px] font-serif text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> [R] Retrograde
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Combust
        </span>
        {isTransitActive && (
          <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> T: Transits Active
          </span>
        )}
        <span className="italic">Click any house/planet to inspect</span>
      </div>
    </div>
  );
}

export default React.memo(NorthIndianChart);