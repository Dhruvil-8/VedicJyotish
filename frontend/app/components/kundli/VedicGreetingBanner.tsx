"use client";

import React, { useState, useMemo } from "react";
import { Sparkles, Sun, ChevronDown, ChevronUp, BookOpen, Heart, Flame } from "lucide-react";
import { getActiveVedicGreeting, VedicVerseGreeting } from "../../lib/vedicVerses";

interface VedicGreetingBannerProps {
  festivalName?: string;
}

export function VedicGreetingBanner({ festivalName }: VedicGreetingBannerProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const greeting: VedicVerseGreeting = useMemo(() => {
    return getActiveVedicGreeting(festivalName);
  }, [festivalName]);

  return (
    <div className="glass-parchment rounded-3xl p-5 sm:p-6 border border-primary/30 shadow-md relative overflow-hidden group hover:border-primary/50 transition-all animate-fadeIn">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
        <Sun className="w-28 h-28 text-primary" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-primary/15 pb-3.5 mb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
            {greeting.isFestival ? (
              <Flame className="w-5 h-5 text-amber-500 animate-pulse" />
            ) : (
              <Sparkles className="w-5 h-5 text-primary" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-heading tracking-widest uppercase text-primary">
                {greeting.isFestival ? "Sacred Festival Blessing" : "Sanatana Benediction"}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                {greeting.sourceText}
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-heading text-primary gold-glow font-bold">
              {greeting.greetingTitle}
            </h4>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-muted-foreground hover:text-foreground font-heading flex items-center gap-1 cursor-pointer self-start sm:self-auto px-2.5 py-1 rounded-lg bg-card/40 border border-border/30 transition-all"
        >
          <span>{isExpanded ? "Collapse Shloka" : "View Shloka"}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Sacred Devanagari Verse */}
      <div className="space-y-3">
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-center space-y-2">
          <p className="text-base sm:text-xl font-serif text-foreground font-semibold leading-relaxed tracking-wide select-all text-amber-950 dark:text-amber-100">
            {greeting.sanskritDevanagari}
          </p>
          <p className="text-xs sm:text-sm font-mono text-muted-foreground italic tracking-wide">
            {greeting.transliteration}
          </p>
        </div>

        {/* Translation & Spiritual Meaning */}
        {isExpanded && (
          <div className="space-y-2 pt-1 animate-fadeIn">
            <div className="p-3.5 rounded-xl bg-card/40 border border-border/30 space-y-1">
              <span className="text-[10px] font-heading uppercase tracking-wider text-primary block font-bold">
                Meaning &amp; Translation (अर्थ)
              </span>
              <p className="text-xs sm:text-sm text-foreground/90 font-serif leading-relaxed italic">
                &ldquo;{greeting.englishMeaning}&rdquo;
              </p>
            </div>

            <div className="p-3 rounded-xl bg-card/25 border border-primary/15 text-xs text-muted-foreground font-sans leading-relaxed flex items-start gap-2">
              <BookOpen className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>{greeting.spiritualReflection}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
