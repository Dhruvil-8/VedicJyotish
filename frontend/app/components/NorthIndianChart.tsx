"use client";

import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Planet {
  name: string;
  sign: string;
  house: number;
  strength: string;
  nature: string;
  nakshatra: string;
  full_degree: number;
  deg_in_sign: number;
  retrograde?: boolean;
  combust?: boolean;
}

interface HouseData {
  sign: string;
  planets: string[] | Planet[]; // Flexible to handle both D1 and D9 data structures
}

interface NorthIndianChartProps {
  chartData: Record<string, HouseData>;
  ascendantSign: string;
  title?: string;
  className?: string;
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
  { x: 50, y: 20 }, // H1  — top center (tip of top triangle)
  { x: 25, y: 8 },  // H2  — top-left corner area
  { x: 8, y: 25 },  // H3  — left-top corner area
  { x: 20, y: 50 }, // H4  — left center
  { x: 8, y: 75 },  // H5  — left-bottom corner area
  { x: 25, y: 92 }, // H6  — bottom-left corner area
  { x: 50, y: 80 }, // H7  — bottom center (tip of bottom triangle)
  { x: 75, y: 92 }, // H8  — bottom-right corner area
  { x: 92, y: 75 }, // H9  — right-bottom corner area
  { x: 80, y: 50 }, // H10 — right center
  { x: 92, y: 25 }, // H11 — right-top corner area
  { x: 75, y: 8 },  // H12 — top-right corner area
];

const SIGN_SYMBOLS = [
  "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"
];

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me",
  Jupiter: "Ju", Venus: "Ve", Saturn: "Sa", Rahu: "Ra", Ketu: "Ke"
};

export default function NorthIndianChart({
  chartData,
  ascendantSign,
  title,
  className,
}: NorthIndianChartProps) {
  const getSignIndex = (signName: string) => {
    const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
    const idx = signs.indexOf(signName);
    return idx === -1 ? 0 : idx;
  };

  const ascIdx = getSignIndex(ascendantSign);

  const renderPlanets = (houseIndex: number) => {
    const houseKey = `house_${houseIndex + 1}`;
    const house = chartData[houseKey];
    if (!house) return null;

    const planets = house.planets || [];

    return planets.map((p, i) => {
      const name = typeof p === "string" ? p : p.name;
      const isRetro = typeof p === "object" && p.retrograde;
      const isCombust = typeof p === "object" && p.combust;

      const symbol = PLANET_SYMBOLS[name] || name;
      return (
        <tspan key={i} className={cn(
          "font-bold",
          isRetro && "fill-amber-400 underline",
          isCombust && "fill-red-400 opacity-80"
        )}>
          {symbol}{i < planets.length - 1 ? " " : ""}
        </tspan>
      );
    });
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
          {/* Main Grid */}
          <line x1="0" y1="0" x2="100" y2="100" strokeWidth="0.8" />
          <line x1="100" y1="0" x2="0" y2="100" strokeWidth="0.8" />
          <line x1="50" y1="0" x2="0" y2="50" strokeWidth="0.8" />
          <line x1="0" y1="50" x2="50" y2="100" strokeWidth="0.8" />
          <line x1="50" y1="100" x2="100" y2="50" strokeWidth="0.8" />
          <line x1="100" y1="50" x2="50" y2="0" strokeWidth="0.8" />

          <rect x="0" y="0" width="100" height="100" fill="none" strokeWidth="1" className="stroke-primary/20" />

          {/* Planet Names and Sign Symbols */}
          {HOUSE_CENTERS.map((pos, i) => (
            <React.Fragment key={i}>
              {/* House Sign Symbol */}
              <text
                x={SIGN_POSITIONS[i].x}
                y={SIGN_POSITIONS[i].y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-primary font-heading text-[5px] font-bold"
              >
                {SIGN_SYMBOLS[(ascIdx + i) % 12]}
              </text>

              {/* Planets */}
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground font-serif text-[5px] font-semibold"
              >
                {renderPlanets(i)}
              </text>
            </React.Fragment>
          ))}
        </svg>
      </div>
    </div>
  );
}