"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star, AlertTriangle } from "lucide-react";

interface Yoga {
    name: string;
    description: string;
    type: string;
}

interface YogaCardsProps {
    yogas: Yoga[];
    className?: string;
}

export default function YogaCards({ yogas, className }: YogaCardsProps) {
    if (!yogas || yogas.length === 0) return null;

    return (
        <div className={className}>
            <h3 className="text-primary font-heading mb-4 gold-glow">Auspicious & Significant Yogas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {yogas.map((yoga, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`p-4 rounded-lg border flex gap-3 ${yoga.type === "benefic"
                                ? "glass-parchment border-primary/50"
                                : "bg-red-900/10 border-red-900/40"
                            }`}
                    >
                        <div className="mt-1">
                            {yoga.type === "benefic" ? (
                                <Star className="w-5 h-5 text-primary fill-primary/30" />
                            ) : (
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                            )}
                        </div>
                        <div>
                            <h4 className={`text-sm font-heading ${yoga.type === "benefic" ? "text-primary" : "text-red-400"}`}>
                                {yoga.name}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1 font-serif leading-relaxed">
                                {yoga.description}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
