"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface AntarDasha {
    lord: string;
    start: string;
    end: string;
}

interface MahaDasha {
    lord: string;
    start: string;
    end: string;
    antardashas?: AntarDasha[];
}

interface DashaTimelineProps {
    timeline: MahaDasha[];
    className?: string;
}

function parseDate(dateStr: string): Date {
    // Handle DD-MM-YYYY format
    const parts = dateStr.split("-");
    if (parts.length === 3 && parts[0].length <= 2) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date(dateStr);
}

function formatDate(dateStr: string): string {
    const d = parseDate(dateStr);
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function isCurrent(startStr: string, endStr: string): boolean {
    const now = new Date();
    return now >= parseDate(startStr) && now <= parseDate(endStr);
}

function calcProgress(startStr: string, endStr: string): number {
    const start = parseDate(startStr).getTime();
    const end = parseDate(endStr).getTime();
    const now = Date.now();
    return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
}

const PLANET_COLORS: Record<string, string> = {
    Sun: "text-amber-500",
    Moon: "text-slate-400",
    Mars: "text-red-500",
    Mercury: "text-emerald-500",
    Jupiter: "text-yellow-500",
    Venus: "text-pink-400",
    Saturn: "text-indigo-400",
    Rahu: "text-violet-500",
    Ketu: "text-orange-500",
};

export default function DashaTimeline({ timeline, className }: DashaTimelineProps) {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(() => {
        // Auto-expand the current Maha Dasha
        const idx = timeline.findIndex(d => isCurrent(d.start, d.end));
        return idx !== -1 ? idx : null;
    });

    const toggleExpand = (i: number) => {
        setExpandedIndex(prev => (prev === i ? null : i));
    };

    return (
        <div className={className}>
            <h3 className="text-primary font-heading mb-4 gold-glow">Vimshottari Maha Dasha</h3>
            <div className="relative border-l-2 border-primary/30 ml-4 space-y-4 pb-4">
                {timeline.map((dasha, i) => {
                    const current = isCurrent(dasha.start, dasha.end);
                    const progress = current ? calcProgress(dasha.start, dasha.end) : 0;
                    const isExpanded = expandedIndex === i;
                    const antardashas = dasha.antardashas || [];

                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08, duration: 0.6, ease: "easeOut" }}
                            className="relative pl-8"
                        >
                            {/* Timeline Dot */}
                            <div className={`absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full -translate-x-[8px] border-2 z-10 transition-all ${current ? "bg-primary border-primary animate-pulse shadow-[0_0_12px_hsla(var(--primary)/0.7)]" : "bg-card border-primary/40"}`} />

                            {/* Maha Dasha Card */}
                            <div
                                className={`rounded-xl border transition-all duration-300 cursor-pointer ${current ? "glass-parchment border-primary/50 shadow-lg ring-1 ring-primary/20" : "bg-card/30 border-border/30 opacity-70 hover:opacity-100"}`}
                                onClick={() => antardashas.length > 0 && toggleExpand(i)}
                            >
                                <div className="p-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-heading text-lg tracking-tight ${current ? "text-primary" : "text-foreground/80"} ${PLANET_COLORS[dasha.lord] || ""}`}>
                                                {dasha.lord} Dasha
                                            </span>
                                            {current && (
                                                <span className="text-[9px] font-heading text-primary px-2 py-0.5 bg-primary/10 rounded-full border border-primary/20">
                                                    ACTIVE
                                                </span>
                                            )}
                                        </div>
                                        {antardashas.length > 0 && (
                                            <motion.div
                                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="text-muted-foreground"
                                            >
                                                <ChevronDown className="w-4 h-4" />
                                            </motion.div>
                                        )}
                                    </div>
                                    <div className="text-foreground/70 text-sm mt-1">
                                        {formatDate(dasha.start)} — {formatDate(dasha.end)}
                                    </div>

                                    {current && (
                                        <div className="mt-3">
                                            <div className="w-full h-1.5 bg-primary/10 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progress}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                    className="h-full bg-primary rounded-full shadow-[0_0_6px_hsla(var(--primary)/0.4)]"
                                                />
                                            </div>
                                            <div className="text-[10px] text-muted-foreground mt-1 text-right">{Math.round(progress)}% complete</div>
                                        </div>
                                    )}
                                </div>

                                {/* Antardasha Section */}
                                <AnimatePresence>
                                    {isExpanded && antardashas.length > 0 && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="border-t border-border/30 px-4 py-3 space-y-1.5 bg-muted/10">
                                                <div className="text-[10px] font-heading text-muted-foreground uppercase tracking-widest mb-2">
                                                    Antardasha Periods
                                                </div>
                                                {antardashas.map((ad, j) => {
                                                    const adCurrent = isCurrent(ad.start, ad.end);
                                                    const adProgress = adCurrent ? calcProgress(ad.start, ad.end) : 0;
                                                    const isPast = new Date() > parseDate(ad.end);

                                                    return (
                                                        <div
                                                            key={j}
                                                            className={`flex items-center gap-3 py-1.5 px-2 rounded-lg transition-all text-sm ${adCurrent ? "bg-primary/10 border border-primary/20" : isPast ? "opacity-40" : ""}`}
                                                        >
                                                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${adCurrent ? "bg-primary animate-pulse" : isPast ? "bg-muted-foreground/30" : "bg-border"}`} />
                                                            <span className={`font-heading min-w-[60px] ${adCurrent ? "text-primary" : "text-foreground/70"} ${PLANET_COLORS[ad.lord] || ""}`}>
                                                                {ad.lord}
                                                            </span>
                                                            <span className="text-foreground/60 text-xs flex-1">
                                                                {formatDate(ad.start)} — {formatDate(ad.end)}
                                                            </span>
                                                            {adCurrent && (
                                                                <span className="text-[8px] font-heading text-primary px-1.5 py-0.5 bg-primary/10 rounded-full border border-primary/15">
                                                                    NOW
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
