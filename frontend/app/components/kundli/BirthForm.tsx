"use client";

import React, { useState } from "react";
import { Calendar, Clock, MapPin, Search, Globe, ChevronRight, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateChart } from "../ui/api";
import { useCitySearch } from "../../hooks/useCitySearch";
import { useToast } from "../../hooks/useToast";
import { LANGUAGES } from "../../lib/constants";
import { convertTo24Hour } from "../../lib/helpers";
import { getCachedLocation, setCachedLocation } from "../../lib/locationCache";

// In-memory cache to store API calculation results for duplicate inputs
const chartCache = new Map<string, any>();

interface BirthFormProps {
  onCalculate: (data: {
    chartData: any;
    date: string;
    time: string;
    city: any;
    language: string;
  }) => void;
  defaultDate?: string;
  defaultTime?: string;
  defaultLanguage?: string;
}

export default function BirthForm({
  onCalculate,
  defaultDate = "",
  defaultTime = "",
  defaultLanguage = "English",
}: BirthFormProps) {
  const { showToast } = useToast();
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [cityInput, setCityInput] = useState("");
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(defaultLanguage);
  const [loading, setLoading] = useState(false);

  // Initialize cached location on mount if no city is chosen
  React.useEffect(() => {
    const cached = getCachedLocation();
    if (cached && !selectedCity) {
      setSelectedCity(cached);
      setCityInput(cached.name);
    }
  }, []);

  // Debounced City Search
  const { results: cityResults, setResults: setCityResults } = useCitySearch(
    cityInput,
    selectedCity,
    500
  );

  const selectCity = (city: any) => {
    setSelectedCity(city);
    setCityInput(city.name);
    setCityResults([]);
    setCachedLocation(city);
  };

  const handleCalculate = async () => {
    if (!selectedCity) {
      showToast("Please select a city from the dropdown list.", "info");
      return;
    }
    if (!date) {
      showToast("Please enter a valid birth date (DD/MM/YYYY).", "info");
      return;
    }
    if (!time) {
      showToast("Please enter a valid birth time (HH:MM).", "info");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        date,
        time: convertTo24Hour(time),
        city: selectedCity.name,
        lat: selectedCity.lat,
        lon: selectedCity.lon,
      };
      
      const cacheKey = `${payload.date}|${payload.time}|${payload.lat}|${payload.lon}`;
      let data: any;
      
      if (chartCache.has(cacheKey)) {
        data = chartCache.get(cacheKey);
      } else {
        data = await calculateChart(payload);
        chartCache.set(cacheKey, data);
      }

      onCalculate({
        chartData: data,
        date,
        time,
        city: selectedCity,
        language: selectedLanguage,
      });
    } catch (e: any) {
      let msg = "Error calculating chart. Please check your inputs and try again.";
      try {
        const body = await e?.response?.json?.();
        if (body?.detail) {
          const detail = Array.isArray(body.detail) ? body.detail[0]?.msg : body.detail;
          if (detail) msg = detail.replace(/^Value error, /i, "");
        }
      } catch {}
      showToast(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="max-w-xl mx-auto"
    >
      <div className="glass-parchment p-8 md:p-12 rounded-2xl vedic-border shadow-2xl relative overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors" />

        <div className="space-y-8 relative">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-heading text-primary">Enter Birth Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-heading text-secondary tracking-widest uppercase">
                <Calendar className="w-3.5 h-3.5" /> Date (DD/MM/YYYY)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="w-full bg-muted/30 border border-border/50 rounded-lg p-3 pr-12 font-serif focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all text-foreground"
                />
                <label
                  className="absolute right-0 top-0 bottom-0 w-11 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer hover:bg-primary/10 rounded-r-lg transition-colors group"
                  title="Open Calendar Date Picker"
                >
                  <input
                    type="date"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        const [y, m, d] = val.split("-");
                        if (y && m && d) setDate(`${d}/${m}/${y}`);
                      }
                    }}
                  />
                  <Calendar className="w-4 h-4 text-primary group-hover:scale-110 transition-transform pointer-events-none" />
                </label>
              </div>
            </div>

            {/* Time */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-heading text-secondary tracking-widest uppercase">
                <Clock className="w-3.5 h-3.5" /> Time (HH:MM, 24h)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="HH:MM"
                  className="w-full bg-muted/30 border border-border/50 rounded-lg p-3 pr-12 font-serif focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all text-foreground"
                />
                <label
                  className="absolute right-0 top-0 bottom-0 w-11 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer hover:bg-primary/10 rounded-r-lg transition-colors group"
                  title="Open Time Picker"
                >
                  <input
                    type="time"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) setTime(val);
                    }}
                  />
                  <Clock className="w-4 h-4 text-primary group-hover:scale-110 transition-transform pointer-events-none" />
                </label>
              </div>
            </div>
          </div>

          {/* Place */}
          <div className="space-y-2 relative">
            <label className="flex items-center gap-2 text-xs font-heading text-secondary tracking-widest uppercase">
              <MapPin className="w-3.5 h-3.5" /> Birth Place
            </label>
            <div className="relative">
              <input
                type="text"
                value={cityInput}
                onChange={(e) => {
                  setCityInput(e.target.value);
                  setSelectedCity(null);
                }}
                placeholder="e.g. Mumbai, Maharashtra, India"
                className="w-full bg-muted/30 border border-border/50 rounded-lg p-3 pl-10 font-serif focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all text-foreground"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>

            <AnimatePresence>
              {cityResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-50 w-full glass-parchment border border-border/50 mt-1 rounded-lg shadow-2xl overflow-hidden"
                >
                  {cityResults.map((city, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectCity(city)}
                      className="w-full text-left p-3 hover:bg-primary/10 font-serif text-sm border-b border-border/20 last:border-0 transition-colors cursor-pointer text-foreground"
                    >
                      {city.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-heading text-secondary tracking-widest uppercase">
              <Globe className="w-3.5 h-3.5 text-primary" /> Consultation Language
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full bg-muted/30 border border-border/50 rounded-lg p-3 font-serif focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all cursor-pointer text-foreground"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-background text-foreground">
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleCalculate}
            disabled={loading || !selectedCity}
            className="w-full group bg-primary text-primary-foreground font-heading py-4 rounded-lg shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Generate Horoscope{" "}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
