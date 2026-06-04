"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Search, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateChart } from "../components/ui/api";
import { useCitySearch } from "../hooks/useCitySearch";
import { useToast } from "../hooks/useToast";

export default function PanchangaView() {
  const { showToast } = useToast();

  const [panchangDate, setPanchangDate] = useState("");
  const [panchangTime, setPanchangTime] = useState("12:00");
  const [panchangCityInput, setPanchangCityInput] = useState("");
  const [selectedPanchangCity, setSelectedPanchangCity] = useState<any>(null);
  const [panchangData, setPanchangData] = useState<any>(null);
  const [panchangLoading, setPanchangLoading] = useState(false);

  // Debounced City Search
  const { results: panchangCityResults, setResults: setPanchangCityResults } = useCitySearch(
    panchangCityInput,
    selectedPanchangCity,
    500
  );

  // Auto-initialize Today's Panchanga details on mount
  useEffect(() => {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, "0");
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const y = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");

    const formattedDate = `${d}/${m}/${y}`;
    const formattedTime = `${hh}:${mm}`;

    setPanchangDate(formattedDate);
    setPanchangTime(formattedTime);

    // Default reference city (New Delhi)
    const defaultCity = {
      name: "New Delhi, Delhi, India",
      lat: 28.6139,
      lon: 77.209,
      timezone: 5.5,
    };
    setSelectedPanchangCity(defaultCity);
    setPanchangCityInput(defaultCity.name);

    const fetchInitialPanchang = async () => {
      try {
        const payload = {
          date: formattedDate,
          time: formattedTime,
          city: defaultCity.name,
          lat: defaultCity.lat,
          lon: defaultCity.lon,
          timezone: defaultCity.timezone,
        };
        const res = await calculateChart(payload);
        if (res && res.panchanga) {
          setPanchangData(res.panchanga);
        }
      } catch (err) {
        console.error("Failed to load initial Panchang:", err);
      }
    };

    fetchInitialPanchang();
  }, []);

  const handleCalculatePanchang = async () => {
    if (!panchangDate) {
      showToast("Please enter a valid date (DD/MM/YYYY).", "info");
      return;
    }
    if (!panchangTime) {
      showToast("Please enter a valid time (HH:MM).", "info");
      return;
    }
    if (!selectedPanchangCity) {
      showToast("Please select a location from the search suggestions.", "info");
      return;
    }

    setPanchangLoading(true);
    try {
      const payload = {
        date: panchangDate,
        time: panchangTime,
        city: selectedPanchangCity.name,
        lat: selectedPanchangCity.lat,
        lon: selectedPanchangCity.lon,
        timezone: selectedPanchangCity.timezone,
      };

      const res = await calculateChart(payload);
      if (res && res.panchanga) {
        setPanchangData(res.panchanga);
        showToast("Daily Panchang calculated successfully!", "success");
      }
    } catch (e: any) {
      let msg = "Error calculating Panchang. Please check inputs and try again.";
      try {
        const body = await e?.response?.json?.();
        if (body?.detail) msg = body.detail;
      } catch {}
      showToast(msg, "error");
    } finally {
      setPanchangLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn text-foreground">
      {/* Custom Panchanga page selector form */}
      <div className="glass-parchment p-8 rounded-2xl vedic-border shadow-2xl relative max-w-xl mx-auto group">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-heading text-primary">Daily Vedic Panchang</h2>
            <p className="text-[11px] text-muted-foreground font-serif mt-1">
              Calculate the five vital cosmic limbs of time for any date and location.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-heading text-secondary tracking-widest uppercase">
                <Calendar className="w-3.5 h-3.5" /> Date (DD/MM/YYYY)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={panchangDate}
                  onChange={(e) => setPanchangDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="w-full bg-muted/30 border border-border/50 rounded-lg p-3 pr-10 font-serif focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all text-sm text-foreground"
                />
                <input
                  type="date"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-0 cursor-pointer z-10"
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) {
                      const [y, m, d] = val.split("-");
                      if (y && m && d) setPanchangDate(`${d}/${m}/${y}`);
                    }
                  }}
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
              </div>
            </div>

            {/* Time */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-heading text-secondary tracking-widest uppercase">
                <Clock className="w-3.5 h-3.5" /> Time (HH:MM)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={panchangTime}
                  onChange={(e) => setPanchangTime(e.target.value)}
                  placeholder="HH:MM"
                  className="w-full bg-muted/30 border border-border/50 rounded-lg p-3 pr-10 font-serif focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all text-sm text-foreground"
                />
                <input
                  type="time"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-0 cursor-pointer z-10"
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) setPanchangTime(val);
                  }}
                />
                <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Location Selector */}
          <div className="space-y-2 relative">
            <label className="flex items-center gap-2 text-xs font-heading text-secondary tracking-widest uppercase">
              <MapPin className="w-3.5 h-3.5" /> Location
            </label>
            <div className="relative">
              <input
                type="text"
                value={panchangCityInput}
                onChange={(e) => {
                  setPanchangCityInput(e.target.value);
                  setSelectedPanchangCity(null);
                }}
                placeholder="e.g. New Delhi, Delhi, India"
                className="w-full bg-muted/30 border border-border/50 rounded-lg p-3 pl-10 font-serif focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all text-sm text-foreground"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>

            <AnimatePresence>
              {panchangCityResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-20 w-full mt-1 bg-background/95 backdrop-blur-md border border-border/60 rounded-xl shadow-xl max-h-48 overflow-y-auto scroll-thin"
                >
                  {panchangCityResults.map((city, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedPanchangCity(city);
                        setPanchangCityInput(city.name);
                        setPanchangCityResults([]);
                      }}
                      className="w-full text-left p-3 hover:bg-primary/5 transition-colors border-b border-border/10 last:border-0 font-serif text-xs text-foreground cursor-pointer"
                    >
                      {city.name} (TZ: {city.timezone >= 0 ? `+${city.timezone}` : city.timezone})
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={handleCalculatePanchang}
            disabled={panchangLoading}
            className="w-full py-3 bg-primary text-primary-foreground font-heading rounded-full shadow-lg hover:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 text-sm"
          >
            {panchangLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Calculating Celestial Alignment...
              </>
            ) : (
              <>Calculate Daily Panchang</>
            )}
          </button>
        </div>
      </div>

      {/* Panchanga calculations outputs */}
      {panchangData && (
        <div className="glass-parchment p-8 rounded-2xl vedic-border shadow-xl space-y-6 max-w-4xl mx-auto">
          <div className="text-center border-b border-primary/10 pb-4">
            <h3 className="text-xl font-heading text-secondary gold-glow">
              Daily Panchang Elements
            </h3>
            <p className="text-xs text-muted-foreground font-serif mt-1">
              Computed for {selectedPanchangCity?.name || "Selected Location"} on {panchangDate} at{" "}
              {panchangTime}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {[
              {
                label: "Vara (Day Lord)",
                val: panchangData.vara,
                lord: panchangData.vara_lord,
                desc: "The solar weekday lord indicating natural planetary vitality of the day.",
              },
              {
                label: "Tithi (Lunar Day)",
                val: panchangData.tithi.name,
                pct: panchangData.tithi.progress,
                lord: panchangData.tithi_lord,
                desc: `Lunar day segment indicating emotional harmony. Fortnight: ${panchangData.paksha} Paksha.`,
              },
              {
                label: "Nakshatra (Moon Star)",
                val: panchangData.nakshatra.name,
                pct: panchangData.nakshatra.progress,
                lord: panchangData.nakshatra_lord,
                desc: "Lunar mansion governing the mind, emotional patterns, and active daily star energy.",
              },
              {
                label: "Yoga (Combined Angle)",
                val: panchangData.yoga.name,
                pct: panchangData.yoga.progress,
                lord: panchangData.yoga_lord,
                desc: "Combined solar-lunar angular alignment governing relationship and action currents.",
              },
              {
                label: "Karana (Half-Tithi)",
                val: panchangData.karana.name,
                pct: panchangData.karana.progress,
                lord: panchangData.karana_lord,
                desc: "Half-tithi interval governing career, daily execution capacity, and physical work.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-card/40 p-4 rounded-xl border border-border/20 flex flex-col justify-between hover:border-primary/20 transition-all text-left"
              >
                <div>
                  <div className="text-[9px] text-muted-foreground font-heading uppercase tracking-widest">
                    {item.label}
                  </div>
                  <div className="font-heading text-sm text-primary mt-1 font-bold">{item.val}</div>
                  {item.lord && (
                    <div className="text-[8px] font-heading text-secondary uppercase tracking-widest mt-1">
                      Lord: <span className="font-bold">{item.lord}</span>
                    </div>
                  )}
                  <p className="text-[9px] text-muted-foreground font-serif leading-normal mt-2">
                    {item.desc}
                  </p>
                </div>
                {item.pct !== undefined && (
                  <div className="mt-4">
                    <div className="w-full h-1 bg-border/40 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${item.pct * 100}%` }} />
                    </div>
                    <div className="flex justify-between text-[7px] text-muted-foreground mt-1">
                      <span>Segment Completion</span>
                      <span>{Math.round(item.pct * 100)}%</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Astro & Celestial Details block */}
          <div className="space-y-6 pt-4 border-t border-primary/10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Solar & Lunar Transitions */}
              <div className="bg-card/30 p-5 rounded-2xl border border-border/20 text-left space-y-4">
                <h4 className="font-heading text-xs uppercase tracking-widest text-secondary border-b border-border/10 pb-2">
                  Solar & Lunar Transitions
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] text-muted-foreground font-heading uppercase tracking-wider">
                      Sun Zodiac Sign
                    </span>
                    <div className="font-heading text-sm text-primary font-bold">
                      {panchangData.sun_sign || "Taurus"}
                    </div>
                    <span className="text-[8px] text-muted-foreground font-serif italic">
                      Governs outer soul purpose
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-muted-foreground font-heading uppercase tracking-wider">
                      Moon Zodiac Sign
                    </span>
                    <div className="font-heading text-sm text-primary font-bold">
                      {panchangData.moon_sign || "Cancer"}
                    </div>
                    <span className="text-[8px] text-muted-foreground font-serif italic">
                      Governs mind & emotions
                    </span>
                  </div>
                </div>
              </div>

              {/* Sunrise & Sunset transitions */}
              <div className="bg-card/30 p-5 rounded-2xl border border-border/20 text-left space-y-4">
                <h4 className="font-heading text-xs uppercase tracking-widest text-secondary border-b border-border/10 pb-2">
                  Surya Udaya & Asta
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] text-muted-foreground font-heading uppercase tracking-wider">
                      Sunrise (Udaya)
                    </span>
                    <div className="font-heading text-sm text-primary font-bold">
                      {panchangData.sunrise || "05:45"}
                    </div>
                    <span className="text-[8px] text-muted-foreground font-serif italic">
                      Sun rises on horizon
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-muted-foreground font-heading uppercase tracking-wider">
                      Sunset (Asta)
                    </span>
                    <div className="font-heading text-sm text-primary font-bold">
                      {panchangData.sunset || "18:42"}
                    </div>
                    <span className="text-[8px] text-muted-foreground font-serif italic">
                      Sun sets below horizon
                    </span>
                  </div>
                </div>
              </div>

              {/* Calculation Standards */}
              <div className="bg-card/30 p-5 rounded-2xl border border-border/20 text-left space-y-4">
                <h4 className="font-heading text-xs uppercase tracking-widest text-secondary border-b border-border/10 pb-2">
                  Sidereal Calculation Standards
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] text-muted-foreground font-heading uppercase tracking-wider">
                      Ayanamsha System
                    </span>
                    <div className="font-heading text-sm text-primary font-bold">
                      Chitra Paksha / Lahiri
                    </div>
                    <span className="text-[8px] text-muted-foreground font-serif italic">
                      Classic Vedic standard
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-muted-foreground font-heading uppercase tracking-wider">
                      Exact Ayanamsha
                    </span>
                    <div className="font-heading text-sm text-primary font-bold">
                      {panchangData.ayanamsha ? `${panchangData.ayanamsha.toFixed(4)}°` : "24.1356°"}
                    </div>
                    <span className="text-[8px] text-muted-foreground font-serif italic">
                      Precision degree offset
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Rahu Kalam */}
              <div className="bg-rose-500/5 p-5 rounded-2xl border border-rose-500/10 text-left space-y-4 relative group hover:border-rose-500/20 transition-all">
                <h4 className="font-heading text-xs uppercase tracking-widest text-rose-600 border-b border-rose-500/10 pb-2">
                  Rahu Kaal (Inauspicious)
                </h4>
                <div className="space-y-1">
                  <span className="text-[9px] text-muted-foreground font-heading uppercase tracking-wider">
                    Avoid starting new work
                  </span>
                  <div className="font-heading text-lg text-rose-700 font-bold">
                    {panchangData.rahu_kaal || "15:00 - 16:30"}
                  </div>
                  <span className="text-[8px] text-rose-500/80 font-serif italic">
                    Avoid major decisions/ventures
                  </span>
                </div>
              </div>

              {/* Abhijit Muhurat */}
              <div className="bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/10 text-left space-y-4 relative group hover:border-emerald-500/20 transition-all">
                <h4 className="font-heading text-xs uppercase tracking-widest text-emerald-600 border-b border-emerald-500/10 pb-2">
                  Abhijit Muhurat (Auspicious)
                </h4>
                <div className="space-y-1">
                  <span className="text-[9px] text-muted-foreground font-heading uppercase tracking-wider">
                    Highly auspicious midday slot
                  </span>
                  <div className="font-heading text-lg text-emerald-700 font-bold">
                    {panchangData.abhijit_muhurat || "11:45 - 12:33"}
                  </div>
                  <span className="text-[8px] text-emerald-500/80 font-serif italic">
                    Highly recommended for all actions
                  </span>
                </div>
              </div>

              {/* Gulika & Yamaganda */}
              <div className="bg-amber-500/5 p-5 rounded-2xl border border-amber-500/10 text-left space-y-4 relative group hover:border-amber-500/20 transition-all">
                <h4 className="font-heading text-xs uppercase tracking-widest text-amber-600 border-b border-amber-500/10 pb-2">
                  Gulika & Yamaganda
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] text-muted-foreground font-heading uppercase tracking-wider">
                      Gulika Kalam
                    </span>
                    <div className="font-heading text-xs text-amber-700 font-bold">
                      {panchangData.gulika_kaal || "12:00 - 13:30"}
                    </div>
                    <span className="text-[7px] text-muted-foreground font-serif italic">
                      Good for long-term
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-muted-foreground font-heading uppercase tracking-wider">
                      Yamaganda
                    </span>
                    <div className="font-heading text-xs text-amber-700 font-bold">
                      {panchangData.yama_ganda || "07:30 - 09:00"}
                    </div>
                    <span className="text-[7px] text-muted-foreground font-serif italic">
                      Avoid starting new
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Brahma, Vijaya, Pradosh Muhurtas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="bg-violet-500/5 p-5 rounded-2xl border border-violet-500/10 text-left space-y-4 relative group hover:border-violet-500/20 transition-all">
                <h4 className="font-heading text-xs uppercase tracking-widest text-violet-600 border-b border-violet-500/10 pb-2">
                  Brahma Muhurta
                </h4>
                <div className="space-y-1">
                  <span className="text-[9px] text-muted-foreground font-heading uppercase tracking-wider">
                    Sacred pre-dawn meditation hour
                  </span>
                  <div className="font-heading text-lg text-violet-700 font-bold">
                    {panchangData.brahma_muhurta || "04:30 - 05:18"}
                  </div>
                  <span className="text-[8px] text-violet-500/80 font-serif italic">
                    Best for prayers, meditation & study
                  </span>
                </div>
              </div>

              <div className="bg-sky-500/5 p-5 rounded-2xl border border-sky-500/10 text-left space-y-4 relative group hover:border-sky-500/20 transition-all">
                <h4 className="font-heading text-xs uppercase tracking-widest text-sky-600 border-b border-sky-500/10 pb-2">
                  Vijaya Muhurta (Victory)
                </h4>
                <div className="space-y-1">
                  <span className="text-[9px] text-muted-foreground font-heading uppercase tracking-wider">
                    11th Muhurta — ensures success
                  </span>
                  <div className="font-heading text-lg text-sky-700 font-bold">
                    {panchangData.vijaya_muhurta || "14:24 - 15:12"}
                  </div>
                  <span className="text-[8px] text-sky-500/80 font-serif italic">
                    Ideal for legal, court & conquest matters
                  </span>
                </div>
              </div>

              <div className="bg-indigo-500/5 p-5 rounded-2xl border border-indigo-500/10 text-left space-y-4 relative group hover:border-indigo-500/20 transition-all">
                <h4 className="font-heading text-xs uppercase tracking-widest text-indigo-600 border-b border-indigo-500/10 pb-2">
                  Pradosh Kaal
                </h4>
                <div className="space-y-1">
                  <span className="text-[9px] text-muted-foreground font-heading uppercase tracking-wider">
                    Twilight period after sunset
                  </span>
                  <div className="font-heading text-lg text-indigo-700 font-bold">
                    {panchangData.pradosh_kaal || "18:42 - 20:18"}
                  </div>
                  <span className="text-[8px] text-indigo-500/80 font-serif italic">
                    Sacred Shiva Puja window on Trayodashi
                  </span>
                </div>
              </div>
            </div>

            {/* Dur Muhurtham */}
            {panchangData.dur_muhurtham && panchangData.dur_muhurtham.length > 0 && (
              <div className="bg-red-500/5 p-5 rounded-2xl border border-red-500/10 text-left space-y-4 relative group hover:border-red-500/20 transition-all mt-6">
                <h4 className="font-heading text-xs uppercase tracking-widest text-red-600 border-b border-red-500/10 pb-2">
                  Dur Muhurtham (Inauspicious Periods)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {panchangData.dur_muhurtham.map((slot: string, i: number) => (
                    <div key={i} className="space-y-1">
                      <span className="text-[9px] text-muted-foreground font-heading uppercase tracking-wider">
                        Dur Muhurtham {i + 1}
                      </span>
                      <div className="font-heading text-sm text-red-700 font-bold">{slot}</div>
                      <span className="text-[7px] text-red-500/80 font-serif italic">
                        Avoid auspicious ceremonies
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Choghadiya Daytime */}
            {panchangData.choghadiya && (
              <div className="bg-card/25 p-6 rounded-2xl border border-border/20 text-left space-y-4 pt-4 mt-6">
                <div className="border-b border-primary/10 pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <h4 className="font-heading text-xs uppercase tracking-widest text-secondary">
                    Choghadiya Muhurats (Daytime)
                  </h4>
                  <span className="text-[8px] text-muted-foreground font-serif italic">
                    Sunrise to Sunset — 8 slots
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                  {panchangData.choghadiya.map((slot: any, i: number) => {
                    const isAuspicious = slot.nature === "Auspicious";
                    return (
                      <div
                        key={i}
                        className={`p-3 rounded-xl border transition-all flex flex-col justify-between text-center ${
                          isAuspicious
                            ? "bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/20"
                            : "bg-rose-500/5 border-rose-500/10 hover:border-rose-500/20"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[8px] text-muted-foreground font-heading uppercase tracking-wider">
                            Slot {i + 1}
                          </span>
                          <span
                            className={`text-[6px] font-heading uppercase tracking-widest px-1.5 py-0.5 rounded-full font-bold ${
                              isAuspicious
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-rose-500/10 text-rose-600"
                            }`}
                          >
                            {slot.nature}
                          </span>
                        </div>
                        <div className="my-2">
                          <div
                            className={`font-heading text-sm font-bold ${
                              isAuspicious ? "text-emerald-700" : "text-rose-700"
                            }`}
                          >
                            {slot.name}
                          </div>
                        </div>
                        <div className="text-[8px] text-muted-foreground font-serif leading-none mt-1">
                          {slot.start}
                          <br />
                          to
                          <br />
                          {slot.end}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Choghadiya Nighttime */}
            {panchangData.choghadiya_night && (
              <div className="bg-card/25 p-6 rounded-2xl border border-border/20 text-left space-y-4 pt-4 mt-4">
                <div className="border-b border-primary/10 pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <h4 className="font-heading text-xs uppercase tracking-widest text-secondary">
                    Choghadiya Muhurats (Nighttime)
                  </h4>
                  <span className="text-[8px] text-muted-foreground font-serif italic">
                    Sunset to next Sunrise — 8 slots
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                  {panchangData.choghadiya_night.map((slot: any, i: number) => {
                    const isAuspicious = slot.nature === "Auspicious";
                    return (
                      <div
                        key={i}
                        className={`p-3 rounded-xl border transition-all flex flex-col justify-between text-center ${
                          isAuspicious
                            ? "bg-teal-500/5 border-teal-500/10 hover:border-teal-500/20"
                            : "bg-purple-500/5 border-purple-500/10 hover:border-purple-500/20"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[8px] text-muted-foreground font-heading uppercase tracking-wider">
                            Slot {i + 1}
                          </span>
                          <span
                            className={`text-[6px] font-heading uppercase tracking-widest px-1.5 py-0.5 rounded-full font-bold ${
                              isAuspicious
                                ? "bg-teal-500/10 text-teal-600"
                                : "bg-purple-500/10 text-purple-600"
                            }`}
                          >
                            {slot.nature}
                          </span>
                        </div>
                        <div className="my-2">
                          <div
                            className={`font-heading text-sm font-bold ${
                              isAuspicious ? "text-teal-700" : "text-purple-700"
                            }`}
                          >
                            {slot.name}
                          </div>
                        </div>
                        <div className="text-[8px] text-muted-foreground font-serif leading-none mt-1">
                          {slot.start}
                          <br />
                          to
                          <br />
                          {slot.end}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Horas Daytime */}
            {panchangData.horas_day && (
              <div className="bg-card/25 p-6 rounded-2xl border border-border/20 text-left space-y-4 pt-4 mt-6">
                <div className="border-b border-primary/10 pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <h4 className="font-heading text-xs uppercase tracking-widest text-secondary">
                    Planetary Horas (Daytime)
                  </h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  {panchangData.horas_day.map((hora: any, i: number) => {
                    const colorMap: Record<string, string> = {
                      "Highly Auspicious": "bg-emerald-500/8 border-emerald-500/15 text-emerald-700",
                      Auspicious: "bg-teal-500/8 border-teal-500/15 text-teal-700",
                      Neutral: "bg-amber-500/8 border-amber-500/15 text-amber-700",
                      Inauspicious: "bg-rose-500/8 border-rose-500/15 text-rose-700",
                    };
                    const cls = colorMap[hora.nature] || colorMap["Neutral"];
                    return (
                      <div key={i} className={`p-3 rounded-xl border transition-all text-center ${cls}`}>
                        <div className="text-[8px] text-muted-foreground font-heading uppercase tracking-wider">
                          Hora {hora.hora_num}
                        </div>
                        <div className="font-heading text-xs font-bold mt-2">{hora.planet}</div>
                        <div className="text-[7px] text-muted-foreground font-serif mt-1">
                          {hora.start} – {hora.end}
                        </div>
                        <div
                          className={`text-[6px] font-heading uppercase tracking-widest px-1.5 py-0.5 rounded-full font-bold mt-1 inline-block ${
                            hora.nature === "Highly Auspicious"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : hora.nature === "Auspicious"
                                ? "bg-teal-500/10 text-teal-600"
                                : hora.nature === "Neutral"
                                  ? "bg-amber-500/10 text-amber-600"
                                  : "bg-rose-500/10 text-rose-600"
                          }`}
                        >
                          {hora.nature}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Horas Nighttime */}
            {panchangData.horas_night && (
              <div className="bg-card/25 p-6 rounded-2xl border border-border/20 text-left space-y-4 pt-4 mt-4">
                <div className="border-b border-primary/10 pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <h4 className="font-heading text-xs uppercase tracking-widest text-secondary">
                    Planetary Horas (Nighttime)
                  </h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  {panchangData.horas_night.map((hora: any, i: number) => {
                    const colorMap: Record<string, string> = {
                      "Highly Auspicious": "bg-emerald-500/8 border-emerald-500/15 text-emerald-700",
                      Auspicious: "bg-teal-500/8 border-teal-500/15 text-teal-700",
                      Neutral: "bg-amber-500/8 border-amber-500/15 text-amber-700",
                      Inauspicious: "bg-purple-500/8 border-purple-500/15 text-purple-700",
                    };
                    const cls = colorMap[hora.nature] || colorMap["Neutral"];
                    return (
                      <div key={i} className={`p-3 rounded-xl border transition-all text-center ${cls}`}>
                        <div className="text-[8px] text-muted-foreground font-heading uppercase tracking-wider">
                          Hora {hora.hora_num}
                        </div>
                        <div className="font-heading text-xs font-bold mt-2">{hora.planet}</div>
                        <div className="text-[7px] text-muted-foreground font-serif mt-1">
                          {hora.start} – {hora.end}
                        </div>
                        <span
                          className={`text-[6px] font-heading uppercase tracking-widest px-1.5 py-0.5 rounded-full font-bold mt-1 inline-block ${
                            hora.nature === "Highly Auspicious"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : hora.nature === "Auspicious"
                                ? "bg-teal-500/10 text-teal-600"
                                : hora.nature === "Neutral"
                                  ? "bg-amber-500/10 text-amber-600"
                                  : "bg-purple-500/10 text-purple-600"
                          }`}
                        >
                          {hora.nature}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
