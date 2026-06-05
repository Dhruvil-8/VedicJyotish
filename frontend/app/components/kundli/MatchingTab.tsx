"use client";

import React, { useState } from "react";
import { Calendar, Clock, MapPin, Search, RefreshCw, Heart, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateCompatibility } from "../ui/api";
import { useCitySearch } from "../../hooks/useCitySearch";
import { useToast } from "../../hooks/useToast";
import { convertTo24Hour } from "../../lib/helpers";

interface MatchingTabProps {
  activeProfile: {
    date: string;
    time: string;
    city: any;
  } | null;
}

export default function MatchingTab({ activeProfile }: MatchingTabProps) {
  const { showToast } = useToast();

  // Boy's details state
  const [matchingBoyDate, setMatchingBoyDate] = useState("");
  const [matchingBoyTime, setMatchingBoyTime] = useState("");
  const [matchingBoyCityInput, setMatchingBoyCityInput] = useState("");
  const [matchingBoySelectedCity, setMatchingBoySelectedCity] = useState<any>(null);

  // Girl's details state
  const [matchingGirlDate, setMatchingGirlDate] = useState("");
  const [matchingGirlTime, setMatchingGirlTime] = useState("");
  const [matchingGirlCityInput, setMatchingGirlCityInput] = useState("");
  const [matchingGirlSelectedCity, setMatchingGirlSelectedCity] = useState<any>(null);

  const [matchingMethod, setMatchingMethod] = useState<string>("North");
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [matchingResult, setMatchingResult] = useState<any>(null);

  // City Search Hooks
  const { results: matchingBoyCityResults, setResults: setMatchingBoyCityResults } = useCitySearch(
    matchingBoyCityInput,
    matchingBoySelectedCity,
    500
  );

  const { results: matchingGirlCityResults, setResults: setMatchingGirlCityResults } = useCitySearch(
    matchingGirlCityInput,
    matchingGirlSelectedCity,
    500
  );

  const loadActiveProfile = (type: "boy" | "girl") => {
    if (!activeProfile || !activeProfile.city) {
      showToast(
        "No active birth profile loaded. Please enter single horoscope details first.",
        "info"
      );
      return;
    }
    if (type === "boy") {
      setMatchingBoyDate(activeProfile.date);
      setMatchingBoyTime(activeProfile.time);
      setMatchingBoySelectedCity(activeProfile.city);
      setMatchingBoyCityInput(activeProfile.city.name);
    } else {
      setMatchingGirlDate(activeProfile.date);
      setMatchingGirlTime(activeProfile.time);
      setMatchingGirlSelectedCity(activeProfile.city);
      setMatchingGirlCityInput(activeProfile.city.name);
    }
    showToast(
      `Loaded active profile into ${type === "boy" ? "Boy's" : "Girl's"} details.`,
      "success"
    );
  };

  const handleCalculateCompatibility = async () => {
    if (!matchingBoySelectedCity) {
      showToast("Please select Boy's birth place from the dropdown.", "info");
      return;
    }
    if (!matchingGirlSelectedCity) {
      showToast("Please select Girl's birth place from the dropdown.", "info");
      return;
    }
    setMatchingLoading(true);
    setMatchingResult(null);

    try {
      const payload = {
        boy: {
          date: matchingBoyDate,
          time: convertTo24Hour(matchingBoyTime),
          city: matchingBoySelectedCity.name,
          lat: matchingBoySelectedCity.lat,
          lon: matchingBoySelectedCity.lon,
        },
        girl: {
          date: matchingGirlDate,
          time: convertTo24Hour(matchingGirlTime),
          city: matchingGirlSelectedCity.name,
          lat: matchingGirlSelectedCity.lat,
          lon: matchingGirlSelectedCity.lon,
        },
        method: matchingMethod,
      };

      const result = await calculateCompatibility(payload);
      setMatchingResult(result);
    } catch (e: any) {
      let msg = "Error calculating compatibility. Please check inputs and try again.";
      try {
        const body = await e?.response?.json?.();
        if (body?.detail) msg = body.detail;
      } catch {}
      showToast(msg, "error");
    } finally {
      setMatchingLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn max-w-4xl mx-auto space-y-8">
      {!matchingResult ? (
        <div className="glass-parchment p-8 rounded-2xl vedic-border shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          <h3 className="text-xl md:text-2xl font-heading text-primary gold-glow text-center mb-1">
            Kundali Matching
          </h3>
          <p className="text-xs text-muted-foreground font-serif text-center mb-8">
            Calculate Ashtakoota Guna Milan (36 points) compatibility between partners.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-b border-border/20 pb-8">
            {/* Column 1: Boy's Details */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-primary/20 pb-2">
                <h4 className="font-heading text-sm text-primary font-bold">Boy's Birth Details</h4>
                <button
                  type="button"
                  onClick={() => loadActiveProfile("boy")}
                  className="text-xs font-heading text-secondary px-2.5 py-1 bg-secondary/10 border border-secondary/20 rounded-full hover:bg-secondary/20 transition-all cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-2.5 h-2.5" /> Load My Details
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-heading text-secondary tracking-wider uppercase">
                    <Calendar className="w-3 h-3" /> Date (DD/MM/YYYY)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={matchingBoyDate}
                      onChange={(e) => setMatchingBoyDate(e.target.value)}
                      placeholder="DD/MM/YYYY"
                      className="w-full bg-muted/20 border border-border/50 rounded-lg p-2.5 pr-8 font-serif text-sm focus:border-primary outline-none transition-all text-foreground"
                    />
                    <input
                      type="date"
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 opacity-0 cursor-pointer z-10"
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          const [y, m, d] = val.split("-");
                          if (y && m && d) setMatchingBoyDate(`${d}/${m}/${y}`);
                        }
                      }}
                    />
                    <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-heading text-secondary tracking-wider uppercase">
                    <Clock className="w-3 h-3" /> Time (HH:MM, 24h)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={matchingBoyTime}
                      onChange={(e) => setMatchingBoyTime(e.target.value)}
                      placeholder="HH:MM"
                      className="w-full bg-muted/20 border border-border/50 rounded-lg p-2.5 pr-8 font-serif text-sm focus:border-primary outline-none transition-all text-foreground"
                    />
                    <input
                      type="time"
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 opacity-0 cursor-pointer z-10"
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) setMatchingBoyTime(val);
                      }}
                    />
                    <Clock className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 relative">
                <label className="flex items-center gap-1.5 text-xs font-heading text-secondary tracking-wider uppercase">
                  <MapPin className="w-3 h-3" /> Birth Place
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={matchingBoyCityInput}
                    onChange={(e) => {
                      setMatchingBoyCityInput(e.target.value);
                      setMatchingBoySelectedCity(null);
                    }}
                    placeholder="e.g. Delhi, India"
                    className="w-full bg-muted/20 border border-border/50 rounded-lg p-2.5 pl-9 font-serif text-sm focus:border-primary outline-none transition-all text-foreground"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                </div>

                <AnimatePresence>
                  {matchingBoyCityResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-50 w-full glass-parchment border border-border/50 mt-1 rounded-lg shadow-xl overflow-hidden max-h-[160px] overflow-y-auto scroll-thin"
                    >
                      {matchingBoyCityResults.map((city, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setMatchingBoySelectedCity(city);
                            setMatchingBoyCityInput(city.name);
                            setMatchingBoyCityResults([]);
                          }}
                          className="w-full text-left p-2.5 hover:bg-primary/10 font-serif text-xs border-b border-border/10 last:border-0 transition-colors cursor-pointer text-foreground"
                        >
                          {city.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Column 2: Girl's Details */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-primary/20 pb-2">
                <h4 className="font-heading text-sm text-primary font-bold">Girl's Birth Details</h4>
                <button
                  type="button"
                  onClick={() => loadActiveProfile("girl")}
                  className="text-xs font-heading text-secondary px-2.5 py-1 bg-secondary/10 border border-secondary/20 rounded-full hover:bg-secondary/20 transition-all cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-2.5 h-2.5" /> Load My Details
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-heading text-secondary tracking-wider uppercase">
                    <Calendar className="w-3 h-3" /> Date (DD/MM/YYYY)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={matchingGirlDate}
                      onChange={(e) => setMatchingGirlDate(e.target.value)}
                      placeholder="DD/MM/YYYY"
                      className="w-full bg-muted/20 border border-border/50 rounded-lg p-2.5 pr-8 font-serif text-sm focus:border-primary outline-none transition-all text-foreground"
                    />
                    <input
                      type="date"
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 opacity-0 cursor-pointer z-10"
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          const [y, m, d] = val.split("-");
                          if (y && m && d) setMatchingGirlDate(`${d}/${m}/${y}`);
                        }
                      }}
                    />
                    <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-heading text-secondary tracking-wider uppercase">
                    <Clock className="w-3 h-3" /> Time (HH:MM, 24h)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={matchingGirlTime}
                      onChange={(e) => setMatchingGirlTime(e.target.value)}
                      placeholder="HH:MM"
                      className="w-full bg-muted/20 border border-border/50 rounded-lg p-2.5 pr-8 font-serif text-sm focus:border-primary outline-none transition-all text-foreground"
                    />
                    <input
                      type="time"
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 opacity-0 cursor-pointer z-10"
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) setMatchingGirlTime(val);
                      }}
                    />
                    <Clock className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 relative">
                <label className="flex items-center gap-1.5 text-xs font-heading text-secondary tracking-wider uppercase">
                  <MapPin className="w-3 h-3" /> Birth Place
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={matchingGirlCityInput}
                    onChange={(e) => {
                      setMatchingGirlCityInput(e.target.value);
                      setMatchingGirlSelectedCity(null);
                    }}
                    placeholder="e.g. Mumbai, India"
                    className="w-full bg-muted/20 border border-border/50 rounded-lg p-2.5 pl-9 font-serif text-sm focus:border-primary outline-none transition-all text-foreground"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                </div>

                <AnimatePresence>
                  {matchingGirlCityResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-50 w-full glass-parchment border border-border/50 mt-1 rounded-lg shadow-xl overflow-hidden max-h-[160px] overflow-y-auto scroll-thin"
                    >
                      {matchingGirlCityResults.map((city, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setMatchingGirlSelectedCity(city);
                            setMatchingGirlCityInput(city.name);
                            setMatchingGirlCityResults([]);
                          }}
                          className="w-full text-left p-2.5 hover:bg-primary/10 font-serif text-xs border-b border-border/10 last:border-0 transition-colors cursor-pointer text-foreground"
                        >
                          {city.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Matching Method & Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 max-w-lg mx-auto">
            <div className="space-y-1">
              <label className="text-xs font-heading text-secondary tracking-wider uppercase">
                Matching Method
              </label>
              <select
                value={matchingMethod}
                onChange={(e) => setMatchingMethod(e.target.value)}
                className="bg-card border border-border/50 text-foreground rounded-lg p-2 font-heading text-xs outline-none focus:border-primary cursor-pointer w-full"
              >
                <option value="North">North Indian (Ashtakoota - 36 Gunas)</option>
                <option value="South">South Indian (Poruthams - 10 Tests)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleCalculateCompatibility}
              disabled={matchingLoading || !matchingBoySelectedCity || !matchingGirlSelectedCity}
              className="flex-1 bg-primary text-primary-foreground font-heading py-3 px-6 rounded-full shadow-lg hover:shadow-primary/20 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer text-xs md:text-sm"
            >
              {matchingLoading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  Calculate Compatibility <Heart className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        // Compatibility matching results dashboard
        <div className="space-y-8 animate-fadeIn">
          <div className="glass-parchment p-8 rounded-2xl vedic-border shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            {/* Radial / score display card */}
            <div className="flex flex-col items-center justify-center flex-shrink-0 mx-auto w-full md:w-[35%] border-b md:border-b-0 md:border-r border-primary/20 pb-6 md:pb-0 md:pr-8">
              <div className="relative w-40 h-40 flex items-center justify-center rounded-full border-4 border-dashed border-primary/20 shadow-2xl glass-parchment">
                <div className="absolute inset-2 rounded-full border border-primary/10" />
                <div className="text-center z-10">
                  <div className="text-[10px] text-muted-foreground font-heading uppercase tracking-widest">
                    Score
                  </div>
                  <div className="text-4xl font-heading font-extrabold text-primary my-1 gold-glow">
                    {matchingResult.total_score}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-serif">
                    Out of {matchingResult.max_score} Gunas
                  </div>
                </div>
              </div>
              <div
                className={`mt-5 px-5 py-1.5 rounded-full border font-heading text-xs uppercase tracking-wider ${
                  matchingResult.total_score >= 28
                    ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-400"
                    : matchingResult.total_score >= 18
                      ? "bg-amber-950/20 border-amber-500/30 text-amber-400"
                      : "bg-red-950/20 border-red-500/30 text-red-400"
                }`}
              >
                {matchingResult.total_score >= 28
                  ? "Auspicious Match"
                  : matchingResult.total_score >= 18
                    ? "Suitability Favorable"
                    : "Caution / Low Harmony"}
              </div>
            </div>

            {/* Quick summary box */}
            <div className="flex-1 space-y-6 text-foreground">
              <div className="text-center md:text-left">
                <h4 className="font-heading text-lg text-primary gold-glow mb-1">
                  Celestial Compatibility Analysis
                </h4>
                <p className="text-xs text-muted-foreground font-serif">
                  Calculated using the classical Ashtakoota Guna Milan system (
                  {matchingResult.method}ern Method).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card/40 p-4 rounded-xl border border-border/20">
                  <div className="text-[8px] text-muted-foreground font-heading uppercase tracking-wider">
                    Boy's Moon Details
                  </div>
                  <div className="font-heading text-xs text-primary font-bold mt-1.5 leading-relaxed">
                    {matchingResult.boy_details?.nakshatra} Star
                  </div>
                  <div className="text-xs font-serif text-muted-foreground italic mt-0.5">
                    {matchingResult.boy_details?.sign} • Pada {matchingResult.boy_details?.pada}
                  </div>
                </div>

                <div className="bg-card/40 p-4 rounded-xl border border-border/20">
                  <div className="text-[8px] text-muted-foreground font-heading uppercase tracking-wider">
                    Girl's Moon Details
                  </div>
                  <div className="font-heading text-xs text-secondary font-bold mt-1.5 leading-relaxed">
                    {matchingResult.girl_details?.nakshatra} Star
                  </div>
                  <div className="text-xs font-serif text-muted-foreground italic mt-0.5">
                    {matchingResult.girl_details?.sign} • Pada {matchingResult.girl_details?.pada}
                  </div>
                </div>
              </div>

              <p className="text-xs font-serif leading-relaxed text-muted-foreground">
                {matchingResult.total_score >= 28
                  ? "This combination indicates highly compatible psychological temperaments, mental bonding, and physical affinity. Highly favorable and auspicious for long-term relational happiness."
                  : matchingResult.total_score >= 18
                    ? "A suitable matching. The score indicates stable compatibility, though minor adjustments or remediation might be needed to harmonize areas with planetary conflicts."
                    : "Considerable stellar conflict detected in core mental or physiological categories (Vashya, Gana, or Naadi). Caution, comprehensive counseling, and vedic remedies are recommended."}
              </p>
            </div>
          </div>

          {/* Detailed Ashtakoota score list */}
          <div className="glass-parchment rounded-2xl vedic-border shadow-xl p-6 overflow-hidden">
            <h4 className="text-secondary font-heading mb-1 gold-glow text-center">
              Ashtakoota Score Breakdown
            </h4>
            <p className="text-xs text-muted-foreground font-serif text-center mb-6">
              Breakdown of the 8 relational dimensions calculated using Moon longitudes.
            </p>

            <div className="overflow-x-auto scroll-thin">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead className="bg-muted/50">
                  <tr className="border-b border-border">
                    <th className="px-3 py-3 font-heading text-primary text-xs tracking-wider">
                      Koota
                    </th>
                    <th className="px-3 py-3 font-heading text-primary text-xs tracking-wider">
                      Significance
                    </th>
                    <th className="px-3 py-3 font-heading text-primary text-xs tracking-wider text-center">
                      Score
                    </th>
                    <th className="px-3 py-3 font-heading text-primary text-xs tracking-wider text-center">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 text-xs text-foreground">
                  {[
                    {
                      name: "Varna",
                      max: 1,
                      key: "varna",
                      desc: "Mutual work attitudes, mental capability, work affinity, and spiritual inclination.",
                    },
                    {
                      name: "Vashya",
                      max: 2,
                      key: "vashya",
                      desc: "Mutual attraction, influence, dominance levels, and power equations.",
                    },
                    {
                      name: "Tara",
                      max: 3,
                      key: "tara",
                      desc: "Stellar energy, longevity, individual health, and general well-being.",
                    },
                    {
                      name: "Yoni",
                      max: 4,
                      key: "yoni",
                      desc: "Physical intimacy, natural affinity, physical harmony, and animal affinity.",
                    },
                    {
                      name: "Graha Maitri",
                      max: 5,
                      key: "graha_maitri",
                      desc: "Intellectual friendship, mental attachment, and planetary lord bonding.",
                    },
                    {
                      name: "Gana",
                      max: 6,
                      key: "gana",
                      desc: "Behavioral temperaments: Deva (Divine), Manushya (Human), or Rakshasa (Demonic).",
                    },
                    {
                      name: "Bhakoot",
                      max: 7,
                      key: "bhakoot",
                      desc: "Emotional adjustment, family growth, progeny welfare, and prosperity.",
                    },
                    {
                      name: "Naadi",
                      max: 8,
                      key: "naadi",
                      desc: "Genetic compatibility, physiological chemistry, and children health.",
                    },
                  ].map((k, i) => {
                    const data = matchingResult.ashta_kuta?.[k.key] || {
                      score: 0,
                      max_score: k.max,
                      matched: false,
                    };
                    return (
                      <tr key={i} className="hover:bg-primary/5 transition-colors">
                        <td className="px-3 py-3 font-heading font-bold text-foreground">
                          {k.name}
                        </td>
                        <td className="px-3 py-3 font-serif text-muted-foreground text-xs leading-relaxed max-w-[320px]">
                          {k.desc}
                        </td>
                        <td className="px-3 py-3 text-center font-serif font-bold text-primary">
                          {data.score} / {data.max_score}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[10px] font-heading font-bold border ${
                              data.matched
                                ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400"
                                : "bg-red-950/20 border-red-500/30 text-red-400"
                            }`}
                          >
                            {data.matched ? "MATCHED" : "CONFLICT"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Secondary matching tests */}
          <div className="glass-parchment rounded-2xl vedic-border shadow-xl p-6">
            <h4 className="text-secondary font-heading mb-1 gold-glow text-center">
              Secondary Compatibility Tests
            </h4>
            <p className="text-xs text-muted-foreground font-serif text-center mb-6">
              Crucial southern porutham checkmarks verifying physical and familial well-being.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-serif text-foreground">
              {[
                {
                  name: "Mahendra",
                  val: matchingResult.mahendra,
                  activeDesc: "Ensures progeny, longevity of couple and general family roots.",
                  inactiveDesc: "Neutral or weak progeny connection.",
                },
                {
                  name: "Sthree Dheerga",
                  val: matchingResult.sthree_dheerga,
                  activeDesc: "Ensures general wellness and great prosperity for the wife.",
                  inactiveDesc: "Normal suitability.",
                },
                {
                  name: "Vedha",
                  val: !matchingResult.vedha,
                  activeDesc: "No stellar conflicts (Vedha is absent - Highly Auspicious).",
                  inactiveDesc: "Stellar conflicts detected (Vedha active).",
                },
                {
                  name: "Rajju",
                  val: !matchingResult.rajju,
                  activeDesc: "No body-longevity conflicts (Rajju is absent - Highly Auspicious).",
                  inactiveDesc: "Longevity conflicts detected (Rajju active).",
                },
              ].map((test, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl border flex flex-col justify-between ${
                    test.val ? "bg-emerald-950/10 border-emerald-500/20" : "bg-red-950/10 border-red-500/20"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between font-heading font-bold text-xs">
                      <span>{test.name}</span>
                      {test.val ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                      {test.val ? test.activeDesc : test.inactiveDesc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Manglik Compatibility */}
          {matchingResult.manglik_compatibility && (
            <div className="glass-parchment rounded-2xl vedic-border shadow-xl p-6">
              <h4 className="text-secondary font-heading mb-1 gold-glow text-center">
                Manglik (Kuja Dosha) Compatibility
              </h4>
              <p className="text-xs text-muted-foreground font-serif text-center mb-6">
                Assessment of Mars placement and mutual cancellation rules.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className={`p-5 rounded-xl border flex flex-col justify-between ${
                  matchingResult.manglik_compatibility.boy_has_dosha ? (matchingResult.manglik_compatibility.boy_exceptions?.length > 0 ? "bg-amber-950/20 border-amber-500/30" : "bg-red-950/20 border-red-500/30") : "bg-emerald-950/10 border-emerald-500/20"
                }`}>
                  <div className="flex items-center justify-between font-heading font-bold mb-2">
                    <span className="text-foreground">Boy's Manglik Status</span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm ${
                      matchingResult.manglik_compatibility.boy_has_dosha ? (matchingResult.manglik_compatibility.boy_exceptions?.length > 0 ? "text-amber-300 border-amber-500/80 bg-amber-900/60" : "text-red-300 border-red-500/80 bg-red-900/60") : "text-emerald-400 border-emerald-500/40 bg-emerald-950/40"
                    }`}>
                      {matchingResult.manglik_compatibility.boy_has_dosha ? (matchingResult.manglik_compatibility.boy_exceptions?.length > 0 ? "CANCELLED" : "ACTIVE") : "NO DOSHA"}
                    </span>
                  </div>
                </div>
                <div className={`p-5 rounded-xl border flex flex-col justify-between ${
                  matchingResult.manglik_compatibility.girl_has_dosha ? (matchingResult.manglik_compatibility.girl_exceptions?.length > 0 ? "bg-amber-950/20 border-amber-500/30" : "bg-red-950/20 border-red-500/30") : "bg-emerald-950/10 border-emerald-500/20"
                }`}>
                  <div className="flex items-center justify-between font-heading font-bold mb-2">
                    <span className="text-foreground">Girl's Manglik Status</span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm ${
                      matchingResult.manglik_compatibility.girl_has_dosha ? (matchingResult.manglik_compatibility.girl_exceptions?.length > 0 ? "text-amber-300 border-amber-500/80 bg-amber-900/60" : "text-red-300 border-red-500/80 bg-red-900/60") : "text-emerald-400 border-emerald-500/40 bg-emerald-950/40"
                    }`}>
                      {matchingResult.manglik_compatibility.girl_has_dosha ? (matchingResult.manglik_compatibility.girl_exceptions?.length > 0 ? "CANCELLED" : "ACTIVE") : "NO DOSHA"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-center p-4 bg-card/40 rounded-xl border border-border/20">
                <div className="text-sm font-heading font-bold text-primary mb-2">
                  {matchingResult.manglik_compatibility.compatibility_status}
                </div>
                <p className="text-xs text-muted-foreground font-serif leading-relaxed max-w-2xl mx-auto">
                  {matchingResult.manglik_compatibility.conclusion}
                </p>
              </div>
            </div>
          )}

          {/* Reset button */}
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setMatchingResult(null)}
              className="px-6 py-2.5 bg-primary/10 border border-primary/30 text-primary font-heading text-xs rounded-full hover:bg-primary/20 transition-all uppercase tracking-widest cursor-pointer"
            >
              Reset & Recalculate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
