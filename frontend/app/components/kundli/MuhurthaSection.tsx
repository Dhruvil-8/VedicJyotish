"use client";

import React, { useState, useEffect } from "react";
import {
  Compass,
  Clock,
  MapPin,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Briefcase,
  Heart,
  Home,
  Activity,
  Calendar,
  ChevronRight,
  ShieldAlert,
  User,
  Moon,
  Star,
} from "lucide-react";
import { calculateMuhurtha, MuhurthaResponse } from "../ui/api";
import { getCachedLocation } from "../../lib/locationCache";
import { useToast } from "../../hooks/useToast";

export const NAKSHATRAS_LIST = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
  "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
];

export const SIGNS_LIST = [
  "Aries", "Taurus", "Gemini", "Cancer",
  "Leo", "Virgo", "Libra", "Scorpio",
  "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const ACTIVITIES = [
  { id: "general", label: "General Auspiciousness", icon: Sparkles, desc: "General daily tasks, signing documents & prayers" },
  { id: "travel", label: "Travel & Relocation", icon: Compass, desc: "Journeys, flights, road trips & change of residence" },
  { id: "business", label: "Business & Commerce", icon: Briefcase, desc: "New contracts, ventures, trading & investments" },
  { id: "marriage", label: "Marriage & Alliances", icon: Heart, desc: "Engagements, wedding muhurtas & relationship accords" },
  { id: "property", label: "Property & Real Estate", icon: Home, desc: "Land purchases, Griha Pravesh & registrations" },
  { id: "medical", label: "Medical & Healing", icon: Activity, desc: "Surgeries, therapy initiation & starting treatments" },
];

const DIRECTIONS = [
  { id: "east", label: "East (पूर्व)" },
  { id: "west", label: "West (पश्चिम)" },
  { id: "north", label: "North (उत्तर)" },
  { id: "south", label: "South (दक्षिण)" },
];

export interface MuhurthaSectionProps {
  initialDate?: string;
  initialCity?: any;
  birthMoonNakshatra?: string;
  birthMoonSign?: string;
  profileName?: string;
}

export function MuhurthaSection({
  initialDate,
  initialCity,
  birthMoonNakshatra,
  birthMoonSign,
  profileName,
}: MuhurthaSectionProps) {
  const { showToast } = useToast();
  const now = new Date();
  const defaultDate = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
  const defaultTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const [dateStr, setDateStr] = useState<string>(initialDate || defaultDate);
  const [timeStr, setTimeStr] = useState<string>(defaultTime);
  const [activity, setActivity] = useState<string>("travel");
  const [direction, setDirection] = useState<string>("east");
  const [city, setCity] = useState<any>(initialCity || getCachedLocation());
  const [personalize, setPersonalize] = useState<boolean>(Boolean(birthMoonNakshatra || birthMoonSign));
  const [moonNakshatra, setMoonNakshatra] = useState<string>(birthMoonNakshatra || "");
  const [moonSign, setMoonSign] = useState<string>(birthMoonSign || "");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<MuhurthaResponse | null>(null);

  // Sync props if parent changes
  useEffect(() => {
    if (birthMoonNakshatra) {
      setMoonNakshatra(birthMoonNakshatra);
      setPersonalize(true);
    }
    if (birthMoonSign) {
      setMoonSign(birthMoonSign);
      setPersonalize(true);
    }
  }, [birthMoonNakshatra, birthMoonSign]);

  const handleEvaluate = async () => {
    if (!city || typeof city.lat !== "number" || typeof city.lon !== "number") {
      showToast("Please provide a valid location.", "error");
      return;
    }
    setLoading(true);
    try {
      const payload: any = {
        date: dateStr,
        time: timeStr,
        lat: city.lat,
        lon: city.lon,
        timezone: typeof city.timezone === "number" ? city.timezone : 5.5,
        activity,
        direction: activity === "travel" ? direction : undefined,
      };

      if (personalize && moonNakshatra) {
        payload.birth_moon_nakshatra = moonNakshatra;
      }
      if (personalize && moonSign) {
        payload.birth_moon_sign = moonSign;
      }

      const res = await calculateMuhurtha(payload);
      setResult(res);
    } catch (err: any) {
      showToast(err.message || "Failed to calculate Muhurtha.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleEvaluate();
  }, [activity, direction, personalize, moonNakshatra, moonSign]);

  const handleSetCurrent = () => {
    const cur = new Date();
    const d = `${String(cur.getDate()).padStart(2, "0")}/${String(cur.getMonth() + 1).padStart(2, "0")}/${cur.getFullYear()}`;
    const t = `${String(cur.getHours()).padStart(2, "0")}:${String(cur.getMinutes()).padStart(2, "0")}`;
    setDateStr(d);
    setTimeStr(t);
  };

  const getQualityBadgeColor = (quality: string) => {
    const q = quality.toLowerCase();
    if (q.includes("excellent") || q.includes("ati-uttama"))
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    if (q.includes("favorable") || q.includes("uttama"))
      return "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30";
    if (q.includes("moderate") || q.includes("madhyama"))
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
    return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn text-foreground max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-heading uppercase tracking-widest">
          <Clock className="w-3.5 h-3.5" />
          <span>Classical Shastric Electional Timing</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-heading text-primary gold-glow">
          Muhurtha Decision Engine (शुभ मुहूर्त)
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground font-serif max-w-2xl mx-auto">
          Evaluate auspicious timing for pivotal endeavors using authentic Shastric rules, Directional Shoola, Rahu Kalam, and Abhijit Muhurta gates.
        </p>
      </div>

      {/* Control Card */}
      <div className="glass-parchment p-5 sm:p-6 rounded-3xl border border-primary/30 shadow-xl space-y-5">
        {/* Activity Selection */}
        <div className="space-y-2">
          <label className="text-xs font-heading text-secondary tracking-widest uppercase block">
            Select Endeavor Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {ACTIVITIES.map((act) => {
              const Icon = act.icon;
              const isSelected = activity === act.id;
              return (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => setActivity(act.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    isSelected
                      ? "bg-primary/15 border-primary shadow-md text-primary"
                      : "bg-card/40 border-border/30 hover:border-primary/30 text-foreground/80 hover:bg-card/70"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  <div>
                    <span className="font-heading text-xs font-bold block leading-tight">
                      {act.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Direction Selector (Only for Travel) */}
        {activity === "travel" && (
          <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading text-primary uppercase tracking-wide">
                Travel Heading Direction (Disha Shoola Verification)
              </span>
              <span className="text-[10px] text-muted-foreground font-serif">
                Shastras prohibit specific directions on certain weekdays
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DIRECTIONS.map((dir) => (
                <button
                  key={dir.id}
                  type="button"
                  onClick={() => setDirection(dir.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-heading font-medium border transition-all cursor-pointer text-center ${
                    direction === dir.id
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card/60 border-border/30 hover:border-primary/40 text-foreground/80"
                  }`}
                >
                  {dir.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Date, Time & Location Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-border/20">
          <div>
            <label className="text-[11px] font-heading text-muted-foreground uppercase block mb-1">
              Date (DD/MM/YYYY)
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                placeholder="DD/MM/YYYY"
                className="w-full bg-card/60 border border-border/40 text-foreground text-xs rounded-xl px-3 py-2 font-mono focus:border-primary outline-none"
              />
              <button
                type="button"
                onClick={handleSetCurrent}
                className="px-2 py-2 bg-card/80 hover:bg-primary/10 border border-border/30 rounded-xl text-[10px] font-heading text-primary whitespace-nowrap cursor-pointer"
                title="Set to today and current time"
              >
                Now
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-heading text-muted-foreground uppercase block mb-1">
              Time (HH:MM 24h)
            </label>
            <input
              type="text"
              value={timeStr}
              onChange={(e) => setTimeStr(e.target.value)}
              placeholder="HH:MM"
              className="w-full bg-card/60 border border-border/40 text-foreground text-xs rounded-xl px-3 py-2 font-mono focus:border-primary outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-heading text-muted-foreground uppercase block mb-1">
              Reference Location
            </label>
            <div className="flex items-center gap-2 bg-card/60 border border-border/40 text-foreground text-xs rounded-xl px-3 py-2">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate font-sans">{city?.name || "New Delhi, India"}</span>
            </div>
          </div>
        </div>

        {/* Personal Kundli Alignment Toggle (Tarabala & Chandrabala) */}
        <div className="pt-3 border-t border-border/20 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <span className="text-xs font-heading text-primary font-bold uppercase tracking-wider">
                Vyakti-Vishesh: Personalize with Birth Moon (Janma Kundli)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPersonalize(!personalize)}
              className={`text-[10px] font-heading uppercase tracking-wider px-3 py-1 rounded-full border transition-all cursor-pointer ${
                personalize
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card/60 text-muted-foreground border-border/30 hover:text-foreground"
              }`}
            >
              {personalize ? "Personalized Mode: ON" : "Universal (Samanya) Mode"}
            </button>
          </div>

          {personalize && (
            <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-3 animate-fadeIn">
              <div className="text-[11px] text-muted-foreground font-serif">
                {profileName
                  ? `Pre-calibrated for ${profileName}'s natal Moon position:`
                  : "Provide your birth Moon Nakshatra & Sign to compute personal Tarabala and Chandrabala (protects against Ashtama Chandra & Naidhana Tara):"}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-heading text-muted-foreground uppercase block mb-1">
                    Janma Nakshatra (Birth Star)
                  </label>
                  <select
                    value={moonNakshatra}
                    onChange={(e) => setMoonNakshatra(e.target.value)}
                    className="w-full bg-card/80 border border-border/40 text-foreground text-xs rounded-xl px-3 py-2 font-mono focus:border-primary outline-none"
                  >
                    <option value="">-- Select Birth Nakshatra --</option>
                    {NAKSHATRAS_LIST.map((nak) => (
                      <option key={nak} value={nak}>
                        {nak}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-heading text-muted-foreground uppercase block mb-1">
                    Janma Rashi (Birth Moon Sign)
                  </label>
                  <select
                    value={moonSign}
                    onChange={(e) => setMoonSign(e.target.value)}
                    className="w-full bg-card/80 border border-border/40 text-foreground text-xs rounded-xl px-3 py-2 font-mono focus:border-primary outline-none"
                  >
                    <option value="">-- Select Moon Sign --</option>
                    {SIGNS_LIST.map((sign) => (
                      <option key={sign} value={sign}>
                        {sign}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleEvaluate}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 bg-primary text-primary-foreground font-heading text-xs tracking-wider uppercase font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>Evaluate Muhurtha</span>
          </button>
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className="glass-parchment p-6 sm:p-7 rounded-3xl border border-primary/30 shadow-xl space-y-6 animate-fadeIn">
          {/* Top Score Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/20">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-heading text-secondary uppercase tracking-widest">
                  Electional Assessment
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-heading font-bold border ${getQualityBadgeColor(result.quality)}`}>
                  {result.quality}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-card/60 border border-border/30 text-muted-foreground">
                  {result.tarabala || result.chandrabala ? "Vyakti-Vishesh (Personalized)" : "Samanya (Universal)"}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-heading text-foreground font-bold">
                {result.activity.toUpperCase()} MUHURTHA SCORE:{" "}
                <span className="text-primary">{result.score} / 100</span>
              </h3>
            </div>

            {/* Score Visual Bar */}
            <div className="w-full sm:w-48 space-y-1.5">
              <div className="flex justify-between text-xs font-heading">
                <span className="text-muted-foreground">Karmic Potency</span>
                <span className="font-bold text-primary">{result.score}%</span>
              </div>
              <div className="w-full h-3 bg-card rounded-full overflow-hidden border border-border/30">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    result.score >= 70
                      ? "bg-emerald-500"
                      : result.score >= 45
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                  style={{ width: `${Math.max(5, result.score)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Personalized Vyakti-Vishesh Assessment */}
          {(result.tarabala || result.chandrabala) && (
            <div className="p-4 sm:p-5 rounded-2xl bg-primary/5 border border-primary/30 space-y-3 shadow-sm animate-fadeIn">
              <div className="flex items-center justify-between border-b border-primary/20 pb-2.5 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-xs font-heading text-primary uppercase tracking-widest font-bold">
                    Vyakti-Vishesh Alignment (व्यक्ति-विशेष मुहूर्त)
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                  Natal Moon: {result.tarabala?.janma_nakshatra || moonNakshatra} ({result.chandrabala?.janma_sign || moonSign})
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Tarabala Card */}
                {result.tarabala && (
                  <div className={`p-3.5 rounded-xl border space-y-1.5 ${
                    result.tarabala.is_favorable
                      ? "bg-emerald-500/10 border-emerald-500/30 text-foreground"
                      : "bg-rose-500/10 border-rose-500/30 text-foreground"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-heading uppercase tracking-wide text-muted-foreground">
                        Tarabala (ताराबल • Star Strength)
                      </span>
                      <span className={`text-[10px] font-heading font-bold px-2 py-0.5 rounded-full border ${
                        result.tarabala.is_favorable
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-300"
                          : "bg-rose-500/20 border-rose-500/40 text-rose-600 dark:text-rose-300"
                      }`}>
                        {result.tarabala.is_favorable ? "Auspicious Tara" : "Afflicted Tara"}
                      </span>
                    </div>
                    <div className="text-sm font-heading font-bold text-foreground">
                      {result.tarabala.tara_name} Tara (#{result.tarabala.tara_number})
                    </div>
                    <p className="text-xs font-sans leading-relaxed text-foreground/85">
                      {result.tarabala.description}
                    </p>
                  </div>
                )}

                {/* Chandrabala Card */}
                {result.chandrabala && (
                  <div className={`p-3.5 rounded-xl border space-y-1.5 ${
                    result.chandrabala.is_favorable
                      ? "bg-emerald-500/10 border-emerald-500/30 text-foreground"
                      : "bg-rose-500/10 border-rose-500/30 text-foreground"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-heading uppercase tracking-wide text-muted-foreground">
                        Chandrabala (चंद्रबल • Lunar Strength)
                      </span>
                      <span className={`text-[10px] font-heading font-bold px-2 py-0.5 rounded-full border ${
                        result.chandrabala.house_from_moon === 8
                          ? "bg-rose-600 text-white border-rose-700 animate-pulse"
                          : result.chandrabala.is_favorable
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-300"
                          : "bg-rose-500/20 border-rose-500/40 text-rose-600 dark:text-rose-300"
                      }`}>
                        {result.chandrabala.house_from_moon === 8 ? "Ashtama Chandra (Avoid)" : result.chandrabala.is_favorable ? "Auspicious House" : "Unfavorable House"}
                      </span>
                    </div>
                    <div className="text-sm font-heading font-bold text-foreground">
                      House {result.chandrabala.house_from_moon} from Natal Moon ({result.chandrabala.transit_sign})
                    </div>
                    <p className="text-xs font-sans leading-relaxed text-foreground/85">
                      {result.chandrabala.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Key Celestial Timing Gates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Rahu Kalam Gate */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              result.active_rahu_kalam
                ? "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
            }`}>
              <div className="space-y-0.5">
                <span className="text-[10px] font-heading uppercase tracking-wide block">Rahu Kalam Gate</span>
                <span className="text-xs font-heading font-bold block">
                  {result.active_rahu_kalam ? "Active (Inauspicious)" : "Clear (Free from Rahu)"}
                </span>
              </div>
              {result.active_rahu_kalam ? (
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              )}
            </div>

            {/* Abhijit Muhurta Gate */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              result.in_abhijit
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                : "bg-card/40 border-border/20 text-muted-foreground"
            }`}>
              <div className="space-y-0.5">
                <span className="text-[10px] font-heading uppercase tracking-wide block">Abhijit Muhurta</span>
                <span className="text-xs font-heading font-bold block text-foreground">
                  {result.in_abhijit ? "Active (Midday Grace)" : "Inactive"}
                </span>
              </div>
              {result.in_abhijit ? (
                <Sparkles className="w-5 h-5 text-primary shrink-0" />
              ) : (
                <Clock className="w-5 h-5 opacity-40 shrink-0" />
              )}
            </div>

            {/* Brahma Muhurta Gate */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              result.in_brahma_muhurta
                ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300"
                : "bg-card/40 border-border/20 text-muted-foreground"
            }`}>
              <div className="space-y-0.5">
                <span className="text-[10px] font-heading uppercase tracking-wide block">Brahma Muhurta</span>
                <span className="text-xs font-heading font-bold block text-foreground">
                  {result.in_brahma_muhurta ? "Active (Pre-dawn Radiance)" : "Inactive"}
                </span>
              </div>
              <Compass className="w-5 h-5 opacity-40 shrink-0" />
            </div>
          </div>

          {/* Directional Shoola Warning & Remedy */}
          {result.shoola_warning && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-heading text-xs font-bold uppercase tracking-wide">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Directional Shoola Alert (दिशा शूल)</span>
              </div>
              <p className="text-xs text-foreground/90 font-serif">
                {result.shoola_warning}
              </p>
              {result.shoola_mitigation && (
                <div className="text-xs text-amber-900 dark:text-amber-200/90 font-sans pt-1 border-t border-amber-500/20">
                  <strong>Classical Shastric Mitigation:</strong> {result.shoola_mitigation}
                </div>
              )}
            </div>
          )}

          {/* Final Shastric Recommendation */}
          <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 space-y-1">
            <span className="text-[10px] font-heading text-primary uppercase tracking-widest block">
              Vedic Recommendation
            </span>
            <p className="text-xs sm:text-sm text-foreground/90 font-serif leading-relaxed">
              {result.recommendation}
            </p>
          </div>

          {/* Detailed Rules Applied */}
          {result.rules_applied && result.rules_applied.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-heading text-secondary tracking-widest uppercase block">
                Classical Rules Evaluated ({result.rules_applied.length})
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {result.rules_applied.map((rule, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-card/40 border border-border/20 text-xs font-sans text-foreground/80 flex items-start gap-2"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evaluated Reasons */}
          {result.reasons && result.reasons.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-heading text-muted-foreground uppercase tracking-wider block">
                Factor Breakdown
              </span>
              <ul className="space-y-1 text-xs text-muted-foreground list-disc list-inside">
                {result.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
