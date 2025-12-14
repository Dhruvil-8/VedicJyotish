"use client";
import React from "react";

// Helper: Convert Sign Name to Number (Aries=1, etc.)
const SIGN_MAP: Record<string, number> = {
  Aries: 1, Taurus: 2, Gemini: 3, Cancer: 4, Leo: 5, Virgo: 6,
  Libra: 7, Scorpio: 8, Sagittarius: 9, Capricorn: 10, Aquarius: 11, Pisces: 12
};

// Geometry: Center points for text in a 100x100 SVG
// House 1 is top center. House 2 is top left, etc. (Counter-Clockwise)
const HOUSE_CENTERS = [
  { x: 50, y: 20 },  // H1 (Top Diamond)
  { x: 20, y: 10 },  // H2 (Top Left Triangle)
  { x: 10, y: 20 },  // H3 (Left Triangle)
  { x: 25, y: 50 },  // H4 (Left Diamond)
  { x: 10, y: 80 },  // H5 (Bottom Left Triangle)
  { x: 20, y: 90 },  // H6 (Bottom Triangle)
  { x: 50, y: 80 },  // H7 (Bottom Diamond)
  { x: 80, y: 90 },  // H8 (Bottom Right Triangle)
  { x: 90, y: 80 },  // H9 (Right Triangle)
  { x: 75, y: 50 },  // H10 (Right Diamond)
  { x: 90, y: 20 },  // H11 (Top Right Triangle)
  { x: 80, y: 10 },  // H12 (Top Triangle)
];

// Corner positions for Sign Numbers
const SIGN_POSITIONS = [
  { x: 50, y: 45, anchor: "middle" }, // H1
  { x: 45, y: 5, anchor: "start" },   // H2
  { x: 5, y: 45, anchor: "start" },   // H3
  { x: 50, y: 55, anchor: "middle" }, // H4
  { x: 5, y: 55, anchor: "start" },   // H5
  { x: 45, y: 95, anchor: "start" },  // H6
  { x: 50, y: 65, anchor: "middle" }, // H7
  { x: 55, y: 95, anchor: "end" },    // H8
  { x: 95, y: 55, anchor: "end" },    // H9
  { x: 50, y: 45, anchor: "middle" }, // H10 (Logic shift needed for H10/H4 usually)
  // Actually, standard representation:
  // H1 Num: Bottom of H1 diamond
  // H2 Num: Top corner
];

interface ChartProps {
  data: any; // The full chart_data object
  ascendantSign: string;
}

export default function NorthIndianChart({ data, ascendantSign }: ChartProps) {
  const ascNum = SIGN_MAP[ascendantSign] || 1;

  // Helper to render planets
  const renderPlanets = (houseIndex: number) => {
    const houseKey = `house_${houseIndex + 1}`;
    const houseData = data[houseKey];
    if (!houseData || !houseData.planets) return null;

    return houseData.planets.map((p: any, i: number) => (
      <tspan key={p.name} x={HOUSE_CENTERS[houseIndex].x} dy={i === 0 ? 0 : 12} className="text-[8px] fill-white font-semibold">
        {p.name.substring(0, 2)}
      </tspan>
    ));
  };

  // Helper to get Sign Number for a House
  const getSignNum = (houseIdx: number) => {
    return ((ascNum + houseIdx - 1) % 12) + 1;
  };

  return (
    <div className="w-full max-w-md aspect-square bg-slate-900 border border-slate-700 relative select-none">
      <svg viewBox="0 0 100 100" className="w-full h-full stroke-amber-500/50 stroke-1">
        {/* --- The Grid --- */}
        {/* Outer Box */}
        <rect x="0" y="0" width="100" height="100" fill="none" className="stroke-2" />
        
        {/* Diagonals (X shape) */}
        <line x1="0" y1="0" x2="100" y2="100" />
        <line x1="100" y1="0" x2="0" y2="100" />
        
        {/* Diamond (Inner Square) */}
        <line x1="50" y1="0" x2="0" y2="50" />
        <line x1="0" y1="50" x2="50" y2="100" />
        <line x1="50" y1="100" x2="100" y2="50" />
        <line x1="100" y1="50" x2="50" y2="0" />

        {/* --- House Data Rendering --- */}
        {HOUSE_CENTERS.map((pos, i) => (
          <text 
            key={i} 
            x={pos.x} 
            y={pos.y} 
            textAnchor="middle" 
            dominantBaseline="middle"
            className="fill-white"
          >
            {renderPlanets(i)}
          </text>
        ))}

        {/* --- Sign Numbers (Small Gray Numbers) --- */}
        {/* Hardcoded positions for Sign Numbers in N. Indian Chart */}
        <text x="50" y="42" textAnchor="middle" className="text-[6px] fill-slate-500">{getSignNum(0)}</text> {/* H1 */}
        <text x="15" y="8" textAnchor="middle" className="text-[6px] fill-slate-500">{getSignNum(1)}</text>  {/* H2 */}
        <text x="5" y="18" textAnchor="middle" className="text-[6px] fill-slate-500">{getSignNum(2)}</text>   {/* H3 */}
        <text x="40" y="52" textAnchor="middle" className="text-[6px] fill-slate-500">{getSignNum(3)}</text>  {/* H4 */}
        <text x="5" y="85" textAnchor="middle" className="text-[6px] fill-slate-500">{getSignNum(4)}</text>   {/* H5 */}
        <text x="15" y="95" textAnchor="middle" className="text-[6px] fill-slate-500">{getSignNum(5)}</text>  {/* H6 */}
        <text x="50" y="60" textAnchor="middle" className="text-[6px] fill-slate-500">{getSignNum(6)}</text>  {/* H7 */}
        <text x="85" y="95" textAnchor="middle" className="text-[6px] fill-slate-500">{getSignNum(7)}</text>  {/* H8 */}
        <text x="95" y="85" textAnchor="middle" className="text-[6px] fill-slate-500">{getSignNum(8)}</text>  {/* H9 */}
        <text x="60" y="52" textAnchor="middle" className="text-[6px] fill-slate-500">{getSignNum(9)}</text>  {/* H10 */}
        <text x="95" y="18" textAnchor="middle" className="text-[6px] fill-slate-500">{getSignNum(10)}</text> {/* H11 */}
        <text x="85" y="8" textAnchor="middle" className="text-[6px] fill-slate-500">{getSignNum(11)}</text>  {/* H12 */}

      </svg>
    </div>
  );
}