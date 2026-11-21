"use client";

import React, { useState } from "react";
import { Calendar, Clock, MapPin, Search, Globe, ChevronRight, RefreshCw } from "lucide-react";
import { calculateChart, searchCity } from "../ui/api";
import { useCitySearch } from "../../hooks/useCitySearch";
import { useToast } from "../../hooks/useToast";
import { LANGUAGES } from "../../lib/constants";
import { convertTo24Hour, normalizeDateInput } from "../../lib/helpers";
import { setCachedLocation } from "../../lib/locationCache";

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

  // Convert DD/MM/YYYY or YYYY-MM-DD to ISO YYYY-MM-DD for native <input type="date">
  const isoDate = React.useMemo(() => {
    if (!date) return "";
    const parts = date.trim().split(/[-/.]/);
    if (parts.length === 3) {
      if (parts[0].length <= 2 && parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
      }
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
      }
    }
    return "";
  }, [date]);

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
    let cityToUse = selectedCity;
    if (!cityToUse && cityInput.trim().length >= 2) {
      if (cityResults.length > 0) {
        cityToUse = cityResults[0];
        setSelectedCity(cityToUse);
      } else {
        const found = await searchCity(cityInput.trim());
        if (found && found.length > 0) {
          cityToUse = found[0];
          setSelectedCity(cityToUse);
        }
      }
    }

    if (!cityToUse) {
      showToast("Please search and select your birth city.", "info");
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
        date: normalizeDateInput(date),
        time: convertTo24Hour(time),
        city: cityToUse.name,
        lat: cityToUse.lat,
        lon: cityToUse.lon,
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
        city: cityToUse,
        language: selectedLanguage,
      });
    } catch (e: any) {
      let msg = e?.message || "Error calculating chart. Please check your inputs and try again.";
      try {
        const body = await e?.response?.clone?.()?.json?.();
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
    <div className="max-w-xl mx-auto">
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
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  onBlur={() => {
                    if (date.trim()) {
                      setDate(normalizeDateInput(date));
                    }
                  }}
                  placeholder="DD/MM/YYYY (e.g. 15/08/1990)"
                  className="w-full bg-muted/30 border border-border/50 rounded-lg p-3 pr-12 font-serif focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all text-foreground"
                />
                <div
                  className="absolute right-0 top-0 bottom-0 w-11 flex items-center justify-center hover:bg-primary/10 rounded-r-lg transition-colors group cursor-pointer text-primary overflow-hidden"
                  title="Open Calendar Date Picker"
                >
                  <Calendar className="w-4 h-4 text-primary group-hover:scale-110 transition-transform pointer-events-none" />
                  <input
                    type="date"
                    value={isoDate}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    tabIndex={0}
                    aria-label="Select date"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        const [y, m, d] = val.split("-");
                        if (y && m && d) setDate(`${d}/${m}/${y}`);
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Time */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-heading text-secondary tracking-widest uppercase">
                <Clock className="w-3.5 h-3.5" /> Time (HH:MM, 24h)
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  onBlur={() => {
                    if (time.trim()) {
                      setTime(convertTo24Hour(time));
                    }
                  }}
                  placeholder="HH:MM (e.g. 14:30 or 02:30 PM)"
                  className="w-full bg-muted/30 border border-border/50 rounded-lg p-3 pr-12 font-serif focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all text-foreground"
                />
                <div
                  className="absolute right-0 top-0 bottom-0 w-11 flex items-center justify-center hover:bg-primary/10 rounded-r-lg transition-colors group cursor-pointer text-primary overflow-hidden"
                  title="Open Time Picker"
                >
                  <Clock className="w-4 h-4 text-primary group-hover:scale-110 transition-transform pointer-events-none" />
                  <input
                    type="time"
                    value={time.includes(":") ? convertTo24Hour(time) : ""}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    tabIndex={0}
                    aria-label="Select time"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) setTime(val);
                    }}
                  />
                </div>
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

              {cityResults.length > 0 && (
                <div
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
                </div>
              )}
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
            disabled={loading}
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
    </div>
  );
}
