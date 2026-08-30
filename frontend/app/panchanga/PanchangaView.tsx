"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Sparkles,
  Info,
  Shield,
  Layers,
  Compass,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateChart, calculateCalendar } from "../components/ui/api";
import { useCitySearch } from "../hooks/useCitySearch";
import { useToast } from "../hooks/useToast";

const HINDU_MONTH_NAMES = [
  "Chaitra",
  "Vaishakha",
  "Jyeshtha",
  "Ashadha",
  "Shravana",
  "Bhadrapada",
  "Ashvina",
  "Kartika",
  "Margashirsha",
  "Pausha",
  "Magha",
  "Phalguna",
];

const GREGORIAN_MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const HINDU_MONTH_APPROX_MAP: Record<number, number> = {
  // Maps Hindu Month index (0: Chaitra) to approximate Gregorian month (1-12)
  0: 4, // Chaitra -> April
  1: 5, // Vaishakha -> May
  2: 6, // Jyeshtha -> June
  3: 7, // Ashadha -> July
  4: 8, // Shravana -> August
  5: 9, // Bhadrapada -> September
  6: 10, // Ashvina -> October
  7: 11, // Kartika -> November
  8: 12, // Margashirsha -> December
  9: 1, // Pausha -> January
  10: 2, // Magha -> February
  11: 3, // Phalguna -> March
};

export default function PanchangaView() {
  const { showToast } = useToast();

  // Primary Mode: "daily" | "calendar"
  const [activeTab, setActiveTab] = useState<"daily" | "calendar">("calendar");

  // Calendar View Settings: default is Hindu Month view and Purnimanta tradition
  const [calendarMode, setCalendarMode] = useState<"hindu" | "english">("hindu");
  const [tradition, setTradition] = useState<"purnimanta" | "amanta">("purnimanta");

  // Current Date / Selection for Calendar
  const now = useMemo(() => new Date(), []);
  const [calYear, setCalYear] = useState<number>(now.getFullYear());
  const [calMonth, setCalMonth] = useState<number>(now.getMonth() + 1); // 1-12

  // Month Calendar Data
  const [calendarData, setCalendarData] = useState<any>(null);
  const [calendarLoading, setCalendarLoading] = useState<boolean>(false);
  const [selectedDayDetail, setSelectedDayDetail] = useState<any>(null);

  // Daily Panchanga State
  const [panchangDate, setPanchangDate] = useState<string>("");
  const [panchangTime, setPanchangTime] = useState<string>("12:00");
  const [panchangCityInput, setPanchangCityInput] = useState<string>("");
  const [selectedPanchangCity, setSelectedPanchangCity] = useState<any>(null);
  const [panchangData, setPanchangData] = useState<any>(null);
  const [panchangLoading, setPanchangLoading] = useState<boolean>(false);

  // Live Vedic Clock Ticker
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Debounced City Search
  const { results: panchangCityResults, setResults: setPanchangCityResults } = useCitySearch(
    panchangCityInput,
    selectedPanchangCity,
    500
  );

  // Live Timer Update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize Default Reference City & Data on Mount
  useEffect(() => {
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

    // Initial Fetch Daily Panchang
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

    // Initial Fetch Monthly Calendar
    const fetchInitialCalendar = async () => {
      setCalendarLoading(true);
      try {
        const payload = {
          year: y,
          month: now.getMonth() + 1,
          lat: defaultCity.lat,
          lon: defaultCity.lon,
          timezone: defaultCity.timezone,
          tradition: tradition,
        };
        const res = await calculateCalendar(payload);
        if (res) {
          setCalendarData(res);
        }
      } catch (err) {
        console.error("Failed to load initial Calendar:", err);
      } finally {
        setCalendarLoading(false);
      }
    };

    fetchInitialPanchang();
    fetchInitialCalendar();
  }, []);

  // Fetch Month Calendar on Month/Year/Tradition/Location Change
  const fetchMonthCalendar = async (
    targetYear: number,
    targetMonth: number,
    targetTradition: string,
    cityObj: any
  ) => {
    if (!cityObj) return;
    setCalendarLoading(true);
    try {
      const payload = {
        year: targetYear,
        month: targetMonth,
        lat: cityObj.lat,
        lon: cityObj.lon,
        timezone: cityObj.timezone,
        tradition: targetTradition,
      };
      const res = await calculateCalendar(payload);
      if (res) {
        setCalendarData(res);
      }
    } catch (err) {
      console.error("Failed to fetch calendar:", err);
      showToast("Error updating Vedic Calendar.", "error");
    } finally {
      setCalendarLoading(false);
    }
  };

  const handlePrevMonth = () => {
    let newMonth = calMonth - 1;
    let newYear = calYear;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setCalMonth(newMonth);
    setCalYear(newYear);
    fetchMonthCalendar(newYear, newMonth, tradition, selectedPanchangCity);
  };

  const handleNextMonth = () => {
    let newMonth = calMonth + 1;
    let newYear = calYear;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setCalMonth(newMonth);
    setCalYear(newYear);
    fetchMonthCalendar(newYear, newMonth, tradition, selectedPanchangCity);
  };

  const handleTraditionChange = (newTradition: "purnimanta" | "amanta") => {
    setTradition(newTradition);
    fetchMonthCalendar(calYear, calMonth, newTradition, selectedPanchangCity);
  };

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
      showToast("Please select a location from search suggestions.", "info");
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
        showToast("Vedic Panchang calculated successfully.", "success");
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

  // Real-time Live Vedic Time Calculations based on Sunrise
  const liveVedicClock = useMemo(() => {
    if (!panchangData || !panchangData.sunrise) return null;
    const [sH, sM] = panchangData.sunrise.split(":").map(Number);
    if (isNaN(sH) || isNaN(sM)) return null;

    const sunriseMins = sH * 60 + sM;
    const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes() + currentTime.getSeconds() / 60;
    let diffMins = nowMins - sunriseMins;
    if (diffMins < 0) diffMins += 1440; // Previous sunrise if before today's sunrise

    const totalGhatis = diffMins / 24.0;
    const ghati = Math.floor(totalGhatis) % 60;
    const remVighati = (totalGhatis - Math.floor(totalGhatis)) * 60;
    const vighati = Math.floor(remVighati) % 60;
    const vipal = Math.floor((remVighati - Math.floor(remVighati)) * 60) % 60;

    // Active Prahar & Muhurta
    const isDay = nowMins >= sunriseMins && nowMins < (panchangData.sunset ? parseTimeMins(panchangData.sunset) : 1110);
    const dayLen = panchangData.sunset ? parseTimeMins(panchangData.sunset) - sunriseMins : 720;
    const nightLen = 1440 - dayLen;

    let praharNum = 1;
    let praharName = "Pratah Prahar";
    let praharSanskrit = "प्रातः प्रहर";
    let muhurtaNum = 1;

    if (isDay) {
      const pIdx = Math.min(3, Math.floor((nowMins - sunriseMins) / (dayLen / 4)));
      praharNum = pIdx + 1;
      muhurtaNum = Math.min(15, Math.floor((nowMins - sunriseMins) / (dayLen / 15)) + 1);
      const praharList = [
        ["Pratah Prahar (Dawn to Morning)", "प्रातः प्रहर"],
        ["Madhyahna Prahar (Midday / Noon)", "मध्याह्न प्रहर"],
        ["Aparahna Prahar (Afternoon)", "अपराह्न प्रहर"],
        ["Sayahna Prahar (Late Afternoon)", "सायाह्न प्रहर"],
      ];
      praharName = praharList[pIdx][0];
      praharSanskrit = praharList[pIdx][1];
    } else {
      const sunsetMins = panchangData.sunset ? parseTimeMins(panchangData.sunset) : 1110;
      let nightElapsed = nowMins - sunsetMins;
      if (nightElapsed < 0) nightElapsed += 1440;
      const pIdx = Math.min(3, Math.floor(nightElapsed / (nightLen / 4)));
      praharNum = 5 + pIdx;
      muhurtaNum = 15 + Math.min(15, Math.floor(nightElapsed / (nightLen / 15)) + 1);
      const nightPraharList = [
        ["Pradosha Prahar (Early Evening)", "प्रदोष प्रहर"],
        ["Nishitha Prahar (Midnight)", "निशीथ प्रहर"],
        ["Triyama Prahar (Late Night)", "त्रियामा प्रहर"],
        ["Usha Prahar (Pre-dawn / Brahma)", "उषा प्रहर"],
      ];
      praharName = nightPraharList[pIdx][0];
      praharSanskrit = nightPraharList[pIdx][1];
    }

    return {
      ghati,
      vighati,
      vipal,
      praharNum,
      praharName,
      praharSanskrit,
      muhurtaNum,
    };
  }, [panchangData, currentTime]);

  function parseTimeMins(tStr: string): number {
    const [h, m] = tStr.split(":").map(Number);
    return isNaN(h) || isNaN(m) ? 0 : h * 60 + m;
  }

  // Determine Primary Month Label
  const currentMonthHeading = useMemo(() => {
    if (!calendarData) {
      return calendarMode === "hindu"
        ? "Vedic Hindu Calendar"
        : `${GREGORIAN_MONTH_NAMES[calMonth - 1]} ${calYear}`;
    }
    if (calendarMode === "hindu") {
      const masa = calendarData.primary_masa || "Masa";
      const samvat = calendarData.primary_vikram_samvat || calYear + 57;
      return `${masa} Masa ${samvat} Vikram Samvat`;
    }
    return `${GREGORIAN_MONTH_NAMES[calMonth - 1]} ${calYear}`;
  }, [calendarData, calendarMode, calMonth, calYear]);

  return (
    <div className="space-y-8 animate-fadeIn text-foreground max-w-6xl mx-auto px-4 sm:px-6">
      {/* Top Header & Section Title */}
      <div className="text-center space-y-3 pt-4">
        <h1 className="text-3xl sm:text-4xl font-heading text-primary font-bold tracking-wide">
          Vedic Panchangam
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground font-serif max-w-2xl mx-auto">
          Traditional Hindu Lunisolar Calendar, Five Cosmic Limbs of Time, and Real-time Vedic Kaala Maana.
        </p>

        {/* View Mode Switcher Tabs (No emojis) */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("calendar")}
            className={`px-5 py-2.5 rounded-full font-heading text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 border ${
              activeTab === "calendar"
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "bg-card/40 text-muted-foreground border-border/40 hover:bg-card/70"
            }`}
          >
            <CalendarIcon className="w-4 h-4" /> Monthly Hindu Calendar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("daily")}
            className={`px-5 py-2.5 rounded-full font-heading text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 border ${
              activeTab === "daily"
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "bg-card/40 text-muted-foreground border-border/40 hover:bg-card/70"
            }`}
          >
            <Clock className="w-4 h-4" /> Daily Panchang & Vedic Time
          </button>
        </div>
      </div>

      {/* Real-time Live Traditional Vedic Clock Widget */}
      {liveVedicClock && panchangData && (
        <div className="glass-parchment p-5 sm:p-6 rounded-2xl vedic-border shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-primary/10 pb-3 gap-2">
            <div>
              <span className="text-[10px] font-heading text-secondary tracking-widest uppercase block">
                Live Vedic Kaala Maana (वैदिक काल गणना)
              </span>
              <div className="font-heading text-base text-primary font-bold">
                Ishta Kala Elapsed from Surya Udaya ({panchangData.sunrise})
              </div>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[10px] font-heading text-muted-foreground uppercase tracking-wider block">
                Local Standard Time
              </span>
              <div className="font-serif text-xs text-foreground font-semibold">
                {currentTime.toLocaleTimeString()} | {panchangDate}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Ishta Kala Ghati-Vighati-Vipal */}
            <div className="bg-card/40 p-4 rounded-xl border border-border/20 space-y-1">
              <span className="text-[9px] text-muted-foreground font-heading uppercase tracking-wider block">
                Ishta Kaal (इष्टकाल)
              </span>
              <div className="font-heading text-lg text-primary font-bold">
                {liveVedicClock.ghati} Gh. {liveVedicClock.vighati} Vi. {liveVedicClock.vipal} Vip.
              </div>
              <p className="text-[9px] text-muted-foreground font-serif">
                {liveVedicClock.ghati} घटी {liveVedicClock.vighati} विघटी {liveVedicClock.vipal} विपल
              </p>
            </div>

            {/* Current Prahar */}
            <div className="bg-card/40 p-4 rounded-xl border border-border/20 space-y-1">
              <span className="text-[9px] text-muted-foreground font-heading uppercase tracking-wider block">
                Current Prahar (प्रहर {liveVedicClock.praharNum} of 8)
              </span>
              <div className="font-heading text-sm text-secondary font-bold">
                {liveVedicClock.praharName}
              </div>
              <p className="text-[9px] text-muted-foreground font-serif">
                {liveVedicClock.praharSanskrit}
              </p>
            </div>

            {/* Active Muhurta */}
            <div className="bg-card/40 p-4 rounded-xl border border-border/20 space-y-1">
              <span className="text-[9px] text-muted-foreground font-heading uppercase tracking-wider block">
                Daily Muhurta ({liveVedicClock.muhurtaNum} of 30)
              </span>
              <div className="font-heading text-sm text-primary font-bold">
                {panchangData.vedic_time?.muhurta_name || "Abhijit"} Muhurta
              </div>
              <p className="text-[9px] text-muted-foreground font-serif">
                Governs present cosmic vibration
              </p>
            </div>

            {/* Cosmic Samvat Context */}
            <div className="bg-card/40 p-4 rounded-xl border border-border/20 space-y-1">
              <span className="text-[9px] text-muted-foreground font-heading uppercase tracking-wider block">
                Cosmic Eras (संवत्सर)
              </span>
              <div className="font-heading text-xs text-foreground font-semibold">
                VS {panchangData.vikram_samvat || "2083"} | SS {panchangData.shaka_samvat || "1948"}
              </div>
              <p className="text-[9px] text-muted-foreground font-serif">
                {panchangData.samvatsara_name || "Krodhana"} Samvatsara
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 1: MONTHLY HINDU CALENDAR ──────────────────────────────────── */}
      {activeTab === "calendar" && (
        <div className="space-y-6">
          {/* Calendar Control Bar */}
          <div className="glass-parchment p-5 sm:p-6 rounded-2xl vedic-border shadow-xl space-y-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              {/* Month Navigation & Heading */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  disabled={calendarLoading}
                  className="p-2.5 rounded-full bg-card/60 border border-border/40 hover:bg-primary/10 text-primary transition-all cursor-pointer disabled:opacity-50"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div>
                  <h2 className="text-xl sm:text-2xl font-heading text-primary font-bold">
                    {currentMonthHeading}
                  </h2>
                  {calendarData && (
                    <p className="text-[10px] text-muted-foreground font-serif mt-0.5">
                      {calendarData.primary_ritu} | {calendarData.primary_ayana} | Samvatsara: {calendarData.primary_samvatsara}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  disabled={calendarLoading}
                  className="p-2.5 rounded-full bg-card/60 border border-border/40 hover:bg-primary/10 text-primary transition-all cursor-pointer disabled:opacity-50"
                  title="Next Month"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Quick Year & Month Jump Controls */}
                <div className="flex items-center gap-1.5 ml-0 sm:ml-2">
                  <select
                    value={calMonth}
                    onChange={(e) => {
                      const m = parseInt(e.target.value, 10);
                      setCalMonth(m);
                      fetchMonthCalendar(calYear, m, tradition, selectedPanchangCity);
                    }}
                    className="bg-card/60 border border-border/40 text-foreground font-heading text-xs rounded-lg px-2.5 py-1.5 focus:border-primary outline-none cursor-pointer"
                  >
                    {GREGORIAN_MONTH_NAMES.map((name, idx) => (
                      <option key={idx} value={idx + 1}>
                        {calendarMode === "hindu" ? `${HINDU_MONTH_NAMES[(idx + 8) % 12]} (${name})` : name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    value={calYear}
                    onChange={(e) => {
                      const y = parseInt(e.target.value, 10);
                      if (!isNaN(y)) {
                        setCalYear(y);
                        fetchMonthCalendar(y, calMonth, tradition, selectedPanchangCity);
                      }
                    }}
                    className="w-20 bg-card/60 border border-border/40 text-foreground font-heading text-xs rounded-lg px-2.5 py-1.5 focus:border-primary outline-none"
                    placeholder="Year"
                    title="Jump to any year (Past or Future)"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      const curY = now.getFullYear();
                      const curM = now.getMonth() + 1;
                      setCalYear(curY);
                      setCalMonth(curM);
                      fetchMonthCalendar(curY, curM, tradition, selectedPanchangCity);
                    }}
                    className="px-2.5 py-1.5 bg-card/40 border border-border/40 hover:bg-primary/10 text-primary text-xs font-heading rounded-lg transition-all cursor-pointer"
                  >
                    Today
                  </button>
                </div>
              </div>

              {/* Toggles: Calendar Mode & Tradition */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Calendar System Switcher */}
                <div className="flex items-center bg-card/50 p-1 rounded-xl border border-border/30 text-xs font-heading">
                  <button
                    type="button"
                    onClick={() => setCalendarMode("hindu")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      calendarMode === "hindu"
                        ? "bg-primary text-primary-foreground font-bold shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Hindu Month (Masa)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarMode("english")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      calendarMode === "english"
                        ? "bg-primary text-primary-foreground font-bold shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    English (Gregorian)
                  </button>
                </div>

                {/* Tradition Switcher */}
                <div className="flex items-center bg-card/50 p-1 rounded-xl border border-border/30 text-xs font-heading">
                  <button
                    type="button"
                    onClick={() => handleTraditionChange("purnimanta")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      tradition === "purnimanta"
                        ? "bg-secondary text-secondary-foreground font-bold shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Purnimanta (North)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTraditionChange("amanta")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      tradition === "amanta"
                        ? "bg-secondary text-secondary-foreground font-bold shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Amanta (South/West)
                  </button>
                </div>
              </div>
            </div>

            {/* Location Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-primary/10 pt-3 gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-serif">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>
                  Astronomical reference:{" "}
                  <strong className="text-foreground">{selectedPanchangCity?.name || "New Delhi, India"}</strong>
                </span>
              </div>

              <div className="text-[11px] text-muted-foreground font-serif">
                Click on any calendar day to inspect complete Panchang & Muhurta timings.
              </div>
            </div>
          </div>

          {/* Calendar Grid Display */}
          {calendarLoading ? (
            <div className="glass-parchment p-12 rounded-2xl vedic-border text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
              <div className="font-heading text-sm text-primary font-bold">
                Calculating Cosmic Ephemeris for Month...
              </div>
            </div>
          ) : calendarData && calendarData.days ? (
            <div className="glass-parchment p-4 sm:p-6 rounded-2xl vedic-border shadow-xl space-y-4">
              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 gap-2 text-center border-b border-primary/10 pb-2">
                {[
                  { en: "Sun", sa: "Ravivara" },
                  { en: "Mon", sa: "Somavara" },
                  { en: "Tue", sa: "Mangalavara" },
                  { en: "Wed", sa: "Budhavara" },
                  { en: "Thu", sa: "Guruvara" },
                  { en: "Fri", sa: "Shukravara" },
                  { en: "Sat", sa: "Shanivara" },
                ].map((d, i) => (
                  <div key={i} className="space-y-0.5">
                    <div className="font-heading text-xs text-primary font-bold uppercase tracking-wider">
                      {d.sa}
                    </div>
                    <div className="text-[9px] text-muted-foreground font-serif">{d.en}</div>
                  </div>
                ))}
              </div>

              {/* Day Cells Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Empty cells for leading offset */}
                {(() => {
                  const firstDay = calendarData.days[0];
                  if (!firstDay) return null;
                  const [d, m, y] = firstDay.date.split("/").map(Number);
                  const firstDate = new Date(y, m - 1, d);
                  const leadingDays = firstDate.getDay(); // 0 is Sunday
                  return Array.from({ length: leadingDays }).map((_, idx) => (
                    <div
                      key={`empty-${idx}`}
                      className="min-h-[100px] p-2 rounded-xl bg-card/10 border border-transparent opacity-30"
                    />
                  ));
                })()}

                {/* Calendar Days */}
                {calendarData.days.map((day: any, idx: number) => {
                  const isToday =
                    day.day_of_month === now.getDate() &&
                    calMonth === now.getMonth() + 1 &&
                    calYear === now.getFullYear();

                  return (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedDayDetail(day)}
                      className={`min-h-[115px] p-2.5 rounded-xl border transition-all text-left flex flex-col justify-between cursor-pointer relative group ${
                        isToday
                          ? "bg-primary/10 border-primary shadow-md"
                          : "bg-card/40 hover:bg-card/80 border-border/30 hover:border-primary/40"
                      }`}
                    >
                      {/* Top Row: Date & Paksha */}
                      <div className="flex items-start justify-between">
                        <span
                          className={`font-heading text-sm font-bold ${
                            isToday ? "text-primary font-extrabold" : "text-foreground"
                          }`}
                        >
                          {day.day_of_month}
                        </span>

                        <span
                          className={`text-[8px] font-heading px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                            day.paksha === "Shukla"
                              ? "bg-amber-500/10 text-amber-700 border border-amber-500/20"
                              : "bg-indigo-500/10 text-indigo-700 border border-indigo-500/20"
                          }`}
                        >
                          {day.paksha === "Shukla" ? "Shukla" : "Krishna"}
                        </span>
                      </div>

                      {/* Middle: Hindu Tithi & Nakshatra */}
                      <div className="space-y-0.5 my-1">
                        <div className="font-heading text-[11px] text-primary font-semibold truncate">
                          {day.tithi_name}
                        </div>
                        <div className="text-[9px] text-muted-foreground font-serif truncate">
                          {day.nakshatra_name}
                        </div>
                      </div>

                      {/* Bottom Badges: Vrats & Festivals */}
                      <div className="space-y-1">
                        {day.is_purnima && (
                          <span className="block text-[8px] font-heading font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 border border-amber-500/30 truncate">
                            Purnima
                          </span>
                        )}
                        {day.is_amavasya && (
                          <span className="block text-[8px] font-heading font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-100 truncate">
                            Amavasya
                          </span>
                        )}
                        {day.is_ekadashi && (
                          <span className="block text-[8px] font-heading font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-800 border border-purple-500/30 truncate">
                            Ekadashi Vrat
                          </span>
                        )}
                        {day.is_pradosh && !day.is_ekadashi && (
                          <span className="block text-[8px] font-heading font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-800 border border-blue-500/30 truncate">
                            Pradosh Vrat
                          </span>
                        )}
                        {day.festival && !day.is_purnima && !day.is_amavasya && !day.is_ekadashi && (
                          <span className="block text-[8px] font-heading font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-800 border border-emerald-500/30 truncate">
                            {day.festival}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Monthly Important Vrats & Events Quick Reference */}
              {calendarData && calendarData.days && (
                <div className="bg-card/30 p-5 rounded-2xl border border-border/20 space-y-3 mt-4">
                  <div className="flex items-center justify-between border-b border-border/10 pb-2">
                    <h3 className="font-heading text-sm text-secondary font-bold uppercase tracking-wider">
                      Important Festivals & Vrats in {currentMonthHeading}
                    </h3>
                    <span className="text-[10px] text-muted-foreground font-serif">
                      Auspicious Lunar Timings
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {calendarData.days
                      .filter((d: any) => d.vrats && d.vrats.length > 0)
                      .map((d: any, i: number) => (
                        <div
                          key={i}
                          onClick={() => setSelectedDayDetail(d)}
                          className="p-2.5 rounded-xl bg-card/50 hover:bg-primary/10 border border-border/20 hover:border-primary/30 transition-all cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5">
                            <span className="font-heading text-xs font-bold text-primary block">
                              {d.vrats.join(", ")}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-serif">
                              {d.tithi_name} ({d.paksha})
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-heading text-xs font-bold text-foreground block">
                              {d.day_of_month} {GREGORIAN_MONTH_NAMES[calMonth - 1].slice(0, 3)}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-serif">
                              {d.vara_sanskrit}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Day Detail Modal / Drawer */}
          <AnimatePresence>
            {selectedDayDetail && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-background/95 glass-parchment border border-primary/20 shadow-2xl rounded-2xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto scroll-thin relative"
                >
                  <div className="flex items-center justify-between border-b border-primary/10 pb-3">
                    <div>
                      <span className="text-[10px] font-heading text-secondary tracking-widest uppercase block">
                        Detailed Vedic Panchang
                      </span>
                      <h3 className="text-xl font-heading text-primary font-bold">
                        {selectedDayDetail.tithi_name} ({selectedDayDetail.paksha} Paksha)
                      </h3>
                      <p className="text-xs text-muted-foreground font-serif mt-0.5">
                        {selectedDayDetail.vara_sanskrit} ({selectedDayDetail.day_of_week}), {selectedDayDetail.date}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedDayDetail(null)}
                      className="p-2 rounded-full hover:bg-card/80 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Cosmic Context */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="bg-card/40 p-2.5 rounded-xl border border-border/20">
                      <span className="text-[9px] font-heading text-muted-foreground uppercase block">Masa (Month)</span>
                      <span className="text-xs font-heading text-primary font-bold">
                        {tradition === "amanta" ? selectedDayDetail.masa_amanta : selectedDayDetail.masa_purnimanta}
                      </span>
                    </div>
                    <div className="bg-card/40 p-2.5 rounded-xl border border-border/20">
                      <span className="text-[9px] font-heading text-muted-foreground uppercase block">Vikram Samvat</span>
                      <span className="text-xs font-heading text-primary font-bold">{selectedDayDetail.vikram_samvat}</span>
                    </div>
                    <div className="bg-card/40 p-2.5 rounded-xl border border-border/20">
                      <span className="text-[9px] font-heading text-muted-foreground uppercase block">Shaka Samvat</span>
                      <span className="text-xs font-heading text-primary font-bold">{selectedDayDetail.shaka_samvat}</span>
                    </div>
                    <div className="bg-card/40 p-2.5 rounded-xl border border-border/20">
                      <span className="text-[9px] font-heading text-muted-foreground uppercase block">Ritu / Ayana</span>
                      <span className="text-xs font-heading text-primary font-bold truncate block">
                        {selectedDayDetail.ritu}
                      </span>
                    </div>
                  </div>

                  {/* Five Limbs */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-heading text-secondary uppercase tracking-widest">
                      Five Vital Cosmic Limbs
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                      <div className="bg-card/40 p-3 rounded-xl border border-border/20">
                        <span className="text-[9px] text-muted-foreground font-heading uppercase block">Tithi (Lunar Day)</span>
                        <div className="font-heading text-sm text-primary font-bold">{selectedDayDetail.tithi_name}</div>
                      </div>
                      <div className="bg-card/40 p-3 rounded-xl border border-border/20">
                        <span className="text-[9px] text-muted-foreground font-heading uppercase block">Nakshatra (Moon Star)</span>
                        <div className="font-heading text-sm text-primary font-bold">{selectedDayDetail.nakshatra_name}</div>
                      </div>
                      <div className="bg-card/40 p-3 rounded-xl border border-border/20">
                        <span className="text-[9px] text-muted-foreground font-heading uppercase block">Yoga (Solar-Lunar Angle)</span>
                        <div className="font-heading text-sm text-primary font-bold">{selectedDayDetail.yoga_name}</div>
                      </div>
                      <div className="bg-card/40 p-3 rounded-xl border border-border/20">
                        <span className="text-[9px] text-muted-foreground font-heading uppercase block">Karana (Half-Tithi)</span>
                        <div className="font-heading text-sm text-primary font-bold">{selectedDayDetail.karana_name}</div>
                      </div>
                    </div>
                  </div>

                  {/* Timings & Muhurtas */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-heading text-secondary uppercase tracking-widest">
                      Sun & Muhurta Timings
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                      <div className="bg-card/40 p-3 rounded-xl border border-border/20">
                        <span className="text-[9px] text-muted-foreground font-heading uppercase block">Sunrise</span>
                        <div className="font-heading text-sm text-primary font-bold">{selectedDayDetail.sunrise}</div>
                      </div>
                      <div className="bg-card/40 p-3 rounded-xl border border-border/20">
                        <span className="text-[9px] text-muted-foreground font-heading uppercase block">Sunset</span>
                        <div className="font-heading text-sm text-primary font-bold">{selectedDayDetail.sunset}</div>
                      </div>
                      <div className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                        <span className="text-[9px] text-rose-700 font-heading uppercase block">Rahu Kaal</span>
                        <div className="font-heading text-sm text-rose-800 font-bold">{selectedDayDetail.rahu_kaal}</div>
                      </div>
                      <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                        <span className="text-[9px] text-emerald-700 font-heading uppercase block">Abhijit Muhurat</span>
                        <div className="font-heading text-sm text-emerald-800 font-bold">{selectedDayDetail.abhijit_muhurat}</div>
                      </div>
                    </div>
                  </div>

                  {/* Vrats and Observances */}
                  {selectedDayDetail.vrats && selectedDayDetail.vrats.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-heading text-secondary uppercase tracking-widest">
                        Vrats & Auspicious Observances
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedDayDetail.vrats.map((v: string, i: number) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary font-heading text-xs rounded-full font-semibold"
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setPanchangDate(selectedDayDetail.date);
                        setActiveTab("daily");
                        setSelectedDayDetail(null);
                      }}
                      className="px-6 py-2.5 bg-primary text-primary-foreground font-heading text-xs rounded-full uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer"
                    >
                      Calculate Full 24-Hr Horas & Choghadiya
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ─── TAB 2: DAILY PANCHANG & TIME ────────────────────────────────────── */}
      {activeTab === "daily" && (
        <div className="space-y-8">
          {/* Custom Date & Location Selector */}
          <div className="glass-parchment p-6 sm:p-8 rounded-2xl vedic-border shadow-2xl relative max-w-xl mx-auto">
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-xl sm:text-2xl font-heading text-primary font-bold">
                  Daily Panchangam Calculator
                </h2>
                <p className="text-[11px] text-muted-foreground font-serif mt-1">
                  Compute the five cosmic limbs of time, 24-hr Choghadiya, and Planetary Horas for any location.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs font-heading text-secondary tracking-widest uppercase">
                    <CalendarIcon className="w-3.5 h-3.5" /> Date (DD/MM/YYYY)
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
                    <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
                  </div>
                </div>

                {/* Time */}
                <div className="space-y-1.5">
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

              {/* Location Search */}
              <div className="space-y-1.5 relative">
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
                className="w-full py-3 bg-primary text-primary-foreground font-heading rounded-full shadow-lg hover:shadow-primary/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 text-sm"
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

          {/* Daily Panchanga Detailed Output */}
          {panchangData && (
            <div className="glass-parchment p-6 sm:p-8 rounded-2xl vedic-border shadow-xl space-y-6">
              {/* Header Details */}
              <div className="text-center border-b border-primary/10 pb-4 space-y-1">
                <h3 className="text-xl font-heading text-secondary gold-glow font-bold">
                  Five Cosmic Limbs of Time (पञ्चाङ्गम्)
                </h3>
                <p className="text-xs text-muted-foreground font-serif">
                  Computed for {selectedPanchangCity?.name || "Selected Location"} on {panchangDate} at {panchangTime}
                </p>
              </div>

              {/* Five Limbs Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {[
                  {
                    label: "Vara (Day Lord)",
                    val: panchangData.vara,
                    lord: panchangData.vara_lord,
                    desc: "The solar weekday lord governing vitality and bodily health.",
                  },
                  {
                    label: "Tithi (Lunar Day)",
                    val: panchangData.tithi.name,
                    pct: panchangData.tithi.progress,
                    lord: panchangData.tithi_lord,
                    desc: `Lunar phase governing psychological and emotional balance. Fortnight: ${panchangData.paksha} Paksha.`,
                  },
                  {
                    label: "Nakshatra (Moon Star)",
                    val: panchangData.nakshatra.name,
                    pct: panchangData.nakshatra.progress,
                    lord: panchangData.nakshatra_lord,
                    desc: "Lunar mansion governing intuitive flow, mind, and cosmic energy.",
                  },
                  {
                    label: "Yoga (Angular Sum)",
                    val: panchangData.yoga.name,
                    pct: panchangData.yoga.progress,
                    lord: panchangData.yoga_lord,
                    desc: "Combined solar-lunar alignment governing relationships and action.",
                  },
                  {
                    label: "Karana (Half-Tithi)",
                    val: panchangData.karana.name,
                    pct: panchangData.karana.progress,
                    lord: panchangData.karana_lord,
                    desc: "Half-tithi interval governing physical work and achievement.",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-card/40 p-4 rounded-xl border border-border/20 flex flex-col justify-between hover:border-primary/30 transition-all text-left"
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
                          <span>Progress</span>
                          <span>{Math.round(item.pct * 100)}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Astronomical Transits & Muhurtas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-primary/10">
                {/* Sun & Moon Rashi */}
                <div className="bg-card/30 p-4 rounded-xl border border-border/20 text-left space-y-3">
                  <h4 className="font-heading text-xs uppercase tracking-widest text-secondary border-b border-border/10 pb-1.5 font-semibold">
                    Solar & Lunar Signs
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] text-muted-foreground font-heading uppercase block">Sun Sign</span>
                      <div className="font-heading text-sm text-primary font-bold">{panchangData.sun_sign || "Leo"}</div>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground font-heading uppercase block">Moon Sign</span>
                      <div className="font-heading text-sm text-primary font-bold">{panchangData.moon_sign || "Aries"}</div>
                    </div>
                  </div>
                </div>

                {/* Sunrise / Sunset */}
                <div className="bg-card/30 p-4 rounded-xl border border-border/20 text-left space-y-3">
                  <h4 className="font-heading text-xs uppercase tracking-widest text-secondary border-b border-border/10 pb-1.5 font-semibold">
                    Surya Udaya & Asta
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] text-muted-foreground font-heading uppercase block">Sunrise</span>
                      <div className="font-heading text-sm text-primary font-bold">{panchangData.sunrise}</div>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground font-heading uppercase block">Sunset</span>
                      <div className="font-heading text-sm text-primary font-bold">{panchangData.sunset}</div>
                    </div>
                  </div>
                </div>

                {/* Ayanamsha */}
                <div className="bg-card/30 p-4 rounded-xl border border-border/20 text-left space-y-3">
                  <h4 className="font-heading text-xs uppercase tracking-widest text-secondary border-b border-border/10 pb-1.5 font-semibold">
                    Ayanamsha (Chitra Paksha)
                  </h4>
                  <div>
                    <span className="text-[9px] text-muted-foreground font-heading uppercase block">Lahiri Precision</span>
                    <div className="font-heading text-sm text-primary font-bold">
                      {panchangData.ayanamsha ? `${panchangData.ayanamsha.toFixed(4)}°` : "24.1356°"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Muhurtas Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                {/* Abhijit */}
                <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 text-left space-y-1">
                  <span className="text-[9px] font-heading text-emerald-700 uppercase tracking-widest font-bold block">
                    Abhijit Muhurat (Auspicious)
                  </span>
                  <div className="font-heading text-base text-emerald-800 font-bold">
                    {panchangData.abhijit_muhurat || "11:55 - 12:45"}
                  </div>
                  <p className="text-[8px] text-emerald-600 font-serif">Ideal for starting important tasks</p>
                </div>

                {/* Brahma Muhurta */}
                <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 text-left space-y-1">
                  <span className="text-[9px] font-heading text-blue-700 uppercase tracking-widest font-bold block">
                    Brahma Muhurta (Spiritual)
                  </span>
                  <div className="font-heading text-base text-blue-800 font-bold">
                    {panchangData.brahma_muhurta || "04:30 - 05:18"}
                  </div>
                  <p className="text-[8px] text-blue-600 font-serif">Ideal for meditation and sadhana</p>
                </div>

                {/* Rahu Kaal */}
                <div className="bg-rose-500/10 p-4 rounded-xl border border-rose-500/20 text-left space-y-1">
                  <span className="text-[9px] font-heading text-rose-700 uppercase tracking-widest font-bold block">
                    Rahu Kaal (Inauspicious)
                  </span>
                  <div className="font-heading text-base text-rose-800 font-bold">
                    {panchangData.rahu_kaal || "15:00 - 16:30"}
                  </div>
                  <p className="text-[8px] text-rose-600 font-serif">Avoid embarking on new ventures</p>
                </div>

                {/* Yama Ganda */}
                <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 text-left space-y-1">
                  <span className="text-[9px] font-heading text-amber-700 uppercase tracking-widest font-bold block">
                    Yama Ganda (Caution)
                  </span>
                  <div className="font-heading text-base text-amber-800 font-bold">
                    {panchangData.yama_ganda || "09:00 - 10:30"}
                  </div>
                  <p className="text-[8px] text-amber-600 font-serif">Avoid high-risk actions</p>
                </div>
              </div>

              {/* 24-Hour Daytime & Nighttime Choghadiya */}
              {panchangData.choghadiya && (
                <div className="space-y-4 pt-4 border-t border-primary/10">
                  <h4 className="text-base font-heading text-secondary font-bold">
                    24-Hour Choghadiya Muhurtas (चौघड़िया)
                  </h4>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Daytime Choghadiya */}
                    <div className="bg-card/30 p-4 rounded-xl border border-border/20 space-y-3">
                      <div className="flex items-center justify-between border-b border-border/10 pb-2">
                        <span className="font-heading text-xs font-bold text-primary uppercase tracking-wider">
                          Daytime Choghadiya (दिन का चौघड़िया)
                        </span>
                        <span className="text-[10px] text-muted-foreground font-serif">Sunrise to Sunset</span>
                      </div>

                      <div className="space-y-1.5">
                        {panchangData.choghadiya.map((slot: any, idx: number) => {
                          const isAuspicious = slot.nature === "Auspicious";
                          return (
                            <div
                              key={idx}
                              className={`p-2.5 rounded-lg flex items-center justify-between text-xs border ${
                                isAuspicious
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800"
                                  : "bg-muted/20 border-border/10 text-muted-foreground"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-heading font-bold">{slot.name}</span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded font-serif bg-background/50">
                                  {slot.nature}
                                </span>
                              </div>
                              <span className="font-serif text-[11px] font-semibold">
                                {slot.start} - {slot.end}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Nighttime Choghadiya */}
                    {panchangData.choghadiya_night && (
                      <div className="bg-card/30 p-4 rounded-xl border border-border/20 space-y-3">
                        <div className="flex items-center justify-between border-b border-border/10 pb-2">
                          <span className="font-heading text-xs font-bold text-secondary uppercase tracking-wider">
                            Nighttime Choghadiya (रात्रि का चौघड़िया)
                          </span>
                          <span className="text-[10px] text-muted-foreground font-serif">Sunset to Sunrise</span>
                        </div>

                        <div className="space-y-1.5">
                          {panchangData.choghadiya_night.map((slot: any, idx: number) => {
                            const isAuspicious = slot.nature === "Auspicious";
                            return (
                              <div
                                key={idx}
                                className={`p-2.5 rounded-lg flex items-center justify-between text-xs border ${
                                  isAuspicious
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800"
                                    : "bg-muted/20 border-border/10 text-muted-foreground"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-heading font-bold">{slot.name}</span>
                                  <span className="text-[9px] px-1.5 py-0.5 rounded font-serif bg-background/50">
                                    {slot.nature}
                                  </span>
                                </div>
                                <span className="font-serif text-[11px] font-semibold">
                                  {slot.start} - {slot.end}
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

              {/* 24-Hour Planetary Horas */}
              {panchangData.horas_day && (
                <div className="space-y-4 pt-4 border-t border-primary/10">
                  <h4 className="text-base font-heading text-secondary font-bold">
                    24-Hour Planetary Horas (ग्रह होरा)
                  </h4>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Day Horas */}
                    <div className="bg-card/30 p-4 rounded-xl border border-border/20 space-y-3">
                      <div className="border-b border-border/10 pb-2">
                        <span className="font-heading text-xs font-bold text-primary uppercase tracking-wider">
                          Daytime Horas (दिन की होरा: 1 - 12)
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {panchangData.horas_day.map((h: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-card/40 border border-border/20 flex items-center justify-between text-xs"
                          >
                            <span className="font-heading font-bold text-primary">{h.planet}</span>
                            <span className="text-[10px] text-muted-foreground font-serif">
                              {h.start} - {h.end}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Night Horas */}
                    {panchangData.horas_night && (
                      <div className="bg-card/30 p-4 rounded-xl border border-border/20 space-y-3">
                        <div className="border-b border-border/10 pb-2">
                          <span className="font-heading text-xs font-bold text-secondary uppercase tracking-wider">
                            Nighttime Horas (रात्रि की होरा: 13 - 24)
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {panchangData.horas_night.map((h: any, idx: number) => (
                            <div
                              key={idx}
                              className="p-2 rounded-lg bg-card/40 border border-border/20 flex items-center justify-between text-xs"
                            >
                              <span className="font-heading font-bold text-secondary">{h.planet}</span>
                              <span className="text-[10px] text-muted-foreground font-serif">
                                {h.start} - {h.end}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
