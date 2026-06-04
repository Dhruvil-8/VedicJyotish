"use client";

import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface PlanetRow {
    name: string;
    sign: string;
    house: number;
    nakshatra: string;
    pada: number;
    dignity: string;
    retrograde: boolean;
    combust: boolean;
    navamsa_sign: string;
}

interface PlanetaryTableProps {
    planets: PlanetRow[];
    className?: string;
}

function PlanetaryTable({ planets, className }: PlanetaryTableProps) {
    return (
        <div className={cn("overflow-x-auto scroll-thin", className)}>
            <table className="w-full text-left border-collapse">
                <thead className="bg-muted/50">
                    <tr className="border-b border-border">
                        <th className="px-3 py-3 font-heading text-primary text-xs tracking-wider">Graha</th>
                        <th className="px-3 py-3 font-heading text-primary text-xs tracking-wider">Rasi</th>
                        <th className="px-3 py-3 font-heading text-primary text-xs tracking-wider text-center">H</th>
                        <th className="px-3 py-3 font-heading text-primary text-xs tracking-wider">Nakshatra</th>
                        <th className="px-3 py-3 font-heading text-primary text-xs tracking-wider">Dignity</th>
                        <th className="px-3 py-3 font-heading text-primary text-xs tracking-wider">D9</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                    {planets.map((p, i) => (
                        <tr key={i} className="hover:bg-primary/5 transition-colors group">
                            <td className="px-3 py-3">
                                <div className="flex flex-col">
                                    <span className="font-heading text-foreground font-bold">{p.name}</span>
                                    <div className="flex gap-1 mt-1">
                                        {p.retrograde && <span className="text-[10px] bg-amber-900/40 text-amber-400 px-1 rounded border border-amber-400/30">Retro</span>}
                                        {p.combust && <span className="text-[10px] bg-red-900/40 text-red-400 px-1 rounded border border-red-400/30">Combust</span>}
                                    </div>
                                </div>
                            </td>
                            <td className="px-3 py-3 text-foreground font-serif">{p.sign}</td>
                            <td className="px-3 py-3 text-foreground font-serif text-center font-bold">{p.house}</td>
                            <td className="px-3 py-3">
                                <div className="flex flex-col">
                                    <span className="text-foreground font-serif">{p.nakshatra}</span>
                                    <span className="text-muted-foreground text-xs italic">Pada {p.pada}</span>
                                </div>
                            </td>
                            <td className="px-3 py-3">
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-xs font-heading",
                                    p.dignity === "Exalted" ? "bg-primary/20 text-primary border border-primary/30" :
                                        p.dignity === "Debilitated" ? "bg-red-900/20 text-red-400 border border-red-400/30" :
                                            p.dignity === "Moolatrikona" ? "bg-amber-900/20 text-amber-400 border border-amber-400/30" :
                                                p.dignity === "Own Sign" ? "bg-secondary/20 text-secondary border border-secondary/30" :
                                                    "text-muted-foreground"
                                )}>
                                    {p.dignity}
                                </span>
                            </td>
                            <td className="px-3 py-3 text-foreground font-serif italic text-sm">{p.navamsa_sign}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default React.memo(PlanetaryTable);

