"use client";

import React, { useState, useMemo } from "react";
import {
  Wind,
  Flame,
  Droplets,
  Heart,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Coffee,
  Utensils,
  Sun,
  Moon,
  Clock,
  Compass,
  Info,
} from "lucide-react";
import {
  calculateAyurvedicPrakriti,
  AyurvedicPrakriti,
} from "../../lib/ayurvedaJyotish";

interface AyurvedaSectionProps {
  ascSign: string;
  moonSign: string;
  sunSign: string;
  ascLord?: string;
}

export function AyurvedaSection({
  ascSign,
  moonSign,
  sunSign,
  ascLord,
}: AyurvedaSectionProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "diet" | "dinacharya" | "agni">("summary");

  const prakriti: AyurvedicPrakriti = useMemo(() => {
    return calculateAyurvedicPrakriti(ascSign, moonSign, sunSign, ascLord);
  }, [ascSign, moonSign, sunSign, ascLord]);

  const { distribution, primaryDosha, agniType } = prakriti;

  return (
    <div className="glass-parchment rounded-3xl p-6 sm:p-7 border border-primary/30 shadow-lg space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-primary/15 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
            <Heart className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-heading tracking-widest uppercase text-primary">
                AyurJyotish • Classical Wellness
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                Lagna + Chandra + Surya
              </span>
            </div>
            <h4 className="text-xl sm:text-2xl font-heading text-primary gold-glow">
              Ayurvedic Constitution (प्रकृति)
            </h4>
          </div>
        </div>

        {/* Primary Prakriti Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3.5 py-1.5 rounded-xl bg-card/60 border border-border/40 text-right">
            <span className="text-[10px] text-muted-foreground uppercase font-heading block">
              Prakriti Archetype
            </span>
            <span className="text-xs sm:text-sm font-heading font-bold text-primary">
              {prakriti.sanskritName}
            </span>
          </div>
        </div>
      </div>

      {/* Tridosha Visual Dials (Vata, Pitta, Kapha) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Vata Dial */}
        <div className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/20 space-y-2 relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sky-400 font-heading text-xs font-bold uppercase tracking-wider">
              <Wind className="w-4 h-4" />
              <span>Vata (वात • Air)</span>
            </div>
            <span className="text-lg font-heading font-bold text-sky-400 font-mono">
              {distribution.vata}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-card/80 rounded-full overflow-hidden border border-border/30">
            <div
              className="h-full bg-sky-400 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.5)] transition-all duration-700"
              style={{ width: `${distribution.vata}%` }}
            />
          </div>
          <p className="text-[11px] text-foreground/75 font-sans leading-relaxed pt-1">
            Governs mental velocity, nervous impulses, creativity, and sensory agility.
          </p>
        </div>

        {/* Pitta Dial */}
        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2 relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-amber-500 font-heading text-xs font-bold uppercase tracking-wider">
              <Flame className="w-4 h-4" />
              <span>Pitta (पित्त • Fire)</span>
            </div>
            <span className="text-lg font-heading font-bold text-amber-500 font-mono">
              {distribution.pitta}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-card/80 rounded-full overflow-hidden border border-border/30">
            <div
              className="h-full bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-all duration-700"
              style={{ width: `${distribution.pitta}%` }}
            />
          </div>
          <p className="text-[11px] text-foreground/75 font-sans leading-relaxed pt-1">
            Governs metabolic fire (Agni), cellular digestion, visual discernment, and focus.
          </p>
        </div>

        {/* Kapha Dial */}
        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-emerald-500 font-heading text-xs font-bold uppercase tracking-wider">
              <Droplets className="w-4 h-4" />
              <span>Kapha (कफ • Water/Earth)</span>
            </div>
            <span className="text-lg font-heading font-bold text-emerald-500 font-mono">
              {distribution.kapha}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-card/80 rounded-full overflow-hidden border border-border/30">
            <div
              className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-700"
              style={{ width: `${distribution.kapha}%` }}
            />
          </div>
          <p className="text-[11px] text-foreground/75 font-sans leading-relaxed pt-1">
            Governs physiological immunity (Ojas), physical stamina, joint lubrication, and emotional calm.
          </p>
        </div>
      </div>

      {/* Interactive Tabs Header */}
      <div className="flex items-center gap-1.5 overflow-x-auto scroll-thin pb-1 border-b border-border/20">
        {[
          { id: "summary", label: "Constitution & Strengths", icon: Sparkles },
          { id: "diet", label: "Diet & Rasayana", icon: Utensils },
          { id: "dinacharya", label: "Daily Rhythm (दिनचर्या)", icon: Clock },
          { id: "agni", label: "Metabolic Fire (अग्नि)", icon: Flame },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-heading tracking-wider uppercase flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0 border ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card/40 text-muted-foreground hover:text-foreground border-border/30"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Summary & Strengths */}
      {activeTab === "summary" && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-4 rounded-2xl bg-card/30 border border-primary/20 space-y-2">
            <span className="text-[10px] font-heading uppercase tracking-widest text-primary block">
              Astrological Body-Mind Blueprint
            </span>
            <p className="text-xs sm:text-sm text-foreground/90 font-serif leading-relaxed">
              {prakriti.constitutionSummary}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="p-4 rounded-2xl bg-card/40 border border-emerald-500/20 space-y-2">
              <span className="text-xs font-heading text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Innate Ayurvedic Strengths</span>
              </span>
              <ul className="space-y-1.5 text-xs text-foreground/80 font-sans">
                {prakriti.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Imbalances to Monitor */}
            <div className="p-4 rounded-2xl bg-card/40 border border-amber-500/20 space-y-2">
              <span className="text-xs font-heading text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wide flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                <span>Imbalance Signals (Vikriti Risk)</span>
              </span>
              <ul className="space-y-1.5 text-xs text-foreground/80 font-sans">
                {prakriti.vulnerabilities.map((v, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Diet & Rasayana */}
      {activeTab === "diet" && (
        <div className="space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Foods to Favor */}
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
              <span className="text-xs font-heading text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wide flex items-center gap-1.5">
                <Utensils className="w-4 h-4" />
                <span>Nourishing Foods to Favor</span>
              </span>
              <ul className="space-y-1.5 text-xs text-foreground/85 font-sans">
                {prakriti.dietaryGuidelines.favor.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Foods to Moderate */}
            <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-2">
              <span className="text-xs font-heading text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wide flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                <span>Foods to Moderate or Minimize</span>
              </span>
              <ul className="space-y-1.5 text-xs text-foreground/85 font-sans">
                {prakriti.dietaryGuidelines.moderate.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Rasayana & Beneficial Herbs */}
          <div className="p-4 rounded-2xl bg-card/40 border border-primary/20 space-y-2">
            <span className="text-xs font-heading text-primary font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Classical Ayurvedic Rasayanas &amp; Herbs</span>
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              {prakriti.dietaryGuidelines.beneficialHerbs.map((herb, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-xl bg-primary/10 border border-primary/20 text-xs font-heading text-foreground"
                >
                  🌿 {herb}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground font-serif pt-1">
              *Herbal Rasayanas should be integrated naturally as dietary spices or under the guidance of a qualified Ayurvedic Vaidya.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Daily Rhythm (Dinacharya) */}
      {activeTab === "dinacharya" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
          <div className="p-4 rounded-2xl bg-card/40 border border-border/30 space-y-1.5">
            <div className="flex items-center gap-2 text-primary font-heading text-xs font-bold uppercase">
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Ideal Wake Timing</span>
            </div>
            <p className="text-xs text-foreground/85 font-sans">
              {prakriti.lifestyleDinacharya.idealWakeTime}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-card/40 border border-border/30 space-y-1.5">
            <div className="flex items-center gap-2 text-primary font-heading text-xs font-bold uppercase">
              <Compass className="w-4 h-4 text-sky-400" />
              <span>Movement &amp; Exercise Style</span>
            </div>
            <p className="text-xs text-foreground/85 font-sans">
              {prakriti.lifestyleDinacharya.movementStyle}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-card/40 border border-border/30 space-y-1.5">
            <div className="flex items-center gap-2 text-primary font-heading text-xs font-bold uppercase">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Mindfulness &amp; Pranayama</span>
            </div>
            <p className="text-xs text-foreground/85 font-sans">
              {prakriti.lifestyleDinacharya.mindfulnessPractice}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-card/40 border border-border/30 space-y-1.5">
            <div className="flex items-center gap-2 text-primary font-heading text-xs font-bold uppercase">
              <Moon className="w-4 h-4 text-primary" />
              <span>Rest &amp; Sleep Hygiene</span>
            </div>
            <p className="text-xs text-foreground/85 font-sans">
              {prakriti.lifestyleDinacharya.sleepGuidance}
            </p>
          </div>
        </div>
      )}

      {/* Tab 4: Metabolic Fire (Agni) */}
      {activeTab === "agni" && (
        <div className="p-5 rounded-2xl bg-card/30 border border-primary/20 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-border/20 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <div>
                <span className="text-[10px] font-heading uppercase tracking-widest text-muted-foreground block">
                  Digestive Agni Signature
                </span>
                <h5 className="font-heading text-sm sm:text-base text-foreground font-bold">
                  {agniType.sanskrit}
                </h5>
              </div>
            </div>
            <span className="text-xs font-heading font-mono px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">
              {agniType.english}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-foreground/90 font-serif leading-relaxed">
            {agniType.description}
          </p>

          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/15 text-xs text-foreground/80 font-sans space-y-1">
            <span className="font-heading text-primary font-bold uppercase tracking-wider block text-[10px]">
              Vedic Agni Principle (जठराग्नि)
            </span>
            <p className="font-serif">
              In Ayurvedic philosophy, optimal health depends not simply on what we ingest, but on our cellular Agni&apos;s capacity to fully assimilate experiences, nutrients, and emotions without leaving toxic metabolic residue (Ama).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
