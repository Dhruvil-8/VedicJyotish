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
  LayoutGrid,
  Columns,
  List,
  Star,
  Check,
  CalendarDays,
  Flame,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateChart, calculateCalendar } from "../components/ui/api";
import { useCitySearch } from "../hooks/useCitySearch";
import { useToast } from "../hooks/useToast";
import { getCachedLocation, setCachedLocation, CachedLocation } from "../lib/locationCache";

// Classical 12 Hindu Months (Chaitradi Astronomical Order 0 to 11)
const HINDU_MONTHS_CHAITRADI = [
  { idx: 0, sa: "Chaitra", hi: "चैत्र", gu: "ચૈત્ર" },
  { idx: 1, sa: "Vaishakha", hi: "वैशाख", gu: "વૈશાખ" },
  { idx: 2, sa: "Jyeshtha", hi: "ज्येष्ठ", gu: "જેઠ" },
  { idx: 3, sa: "Ashadha", hi: "आषाढ़", gu: "અષાઢ" },
  { idx: 4, sa: "Shravana", hi: "श्रावण", gu: "શ્રાવણ" },
  { idx: 5, sa: "Bhadrapada", hi: "भाद्रपद", gu: "ભાદરવો" },
  { idx: 6, sa: "Ashvina", hi: "अश्विन", gu: "આસો" },
  { idx: 7, sa: "Kartika", hi: "कार्तिक", gu: "કારતક" },
  { idx: 8, sa: "Margashirsha", hi: "मार्गशीर्ष", gu: "માગશર" },
  { idx: 9, sa: "Pausha", hi: "पौष", gu: "પોષ" },
  { idx: 10, sa: "Magha", hi: "माघ", gu: "મહા" },
  { idx: 11, sa: "Phalguna", hi: "फाल्गुन", gu: "ફાગણ" },
];

// Gujarat Kartikadi Order (Year starts in Kartika after Diwali)
const HINDU_MONTHS_KARTIKADI = [
  { idx: 7, sa: "Kartika", hi: "कार्तिक", gu: "કારતક" },
  { idx: 8, sa: "Margashirsha", hi: "मार्गशीर्ष", gu: "માગશર" },
  { idx: 9, sa: "Pausha", hi: "पौष", gu: "પોષ" },
  { idx: 10, sa: "Magha", hi: "माघ", gu: "મહા" },
  { idx: 11, sa: "Phalguna", hi: "फाल्गुन", gu: "ફાગણ" },
  { idx: 0, sa: "Chaitra", hi: "चैत्र", gu: "ચૈત્ર" },
  { idx: 1, sa: "Vaishakha", hi: "वैशाख", gu: "વૈશાખ" },
  { idx: 2, sa: "Jyeshtha", hi: "ज्येष्ठ", gu: "જેઠ" },
  { idx: 3, sa: "Ashadha", hi: "आषाढ़", gu: "અષાઢ" },
  { idx: 4, sa: "Shravana", hi: "श्रावण", gu: "શ્રાવણ" },
  { idx: 5, sa: "Bhadrapada", hi: "भाद्रपद", gu: "ભાદરવો" },
  { idx: 6, sa: "Ashvina", hi: "અશ્વિન", gu: "આસો" },
];

const GREGORIAN_MONTHS = [
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

const TITHI_NAMES_SANSKRIT = [
  "१. प्रतिपदा (Pratipada)",
  "२. द्वितीया (Dwitiya)",
  "३. तृतीया (Tritiya)",
  "४. चतुर्थी (Chaturthi)",
  "५. पंचमी (Panchami)",
  "६. षष्ठी (Shashthi)",
  "७. सप्तमी (Saptami)",
  "८. अष्टमी (Ashtami)",
  "९. नवमी (Navami)",
  "१०. दशमी (Dashami)",
  "११. एकादशी (Ekadashi)",
  "१२. द्वादशी (Dwadashi)",
  "१३. त्रयोदशी (Trayodashi)",
  "१४. चतुर्दशी (Chaturdashi)",
  "१५. पूर्णिमा (Purnima)",
  "१. प्रतिपदा (Pratipada)",
  "२. द्वितीया (Dwitiya)",
  "३. तृतीया (Tritiya)",
  "४. चतुर्थी (Chaturthi)",
  "५. पंचमी (Panchami)",
  "६. षष्ठी (Shashthi)",
  "७. सप्तमी (Saptami)",
  "८. अष्टमी (Ashtami)",
  "९. नवमी (Navami)",
  "१०. दशमी (Dashami)",
  "११. एकादशी (Ekadashi)",
  "१२. द्वादशी (Dwadashi)",
  "१३. त्रयोदशी (Trayodashi)",
  "१४. चतुर्दशी (Chaturdashi)",
  "३०. अमावस्या (Amavasya)",
];

export type TraditionType = "gujarat" | "north" | "south" | "english";

export default function PanchangaView() {
  const { showToast } = useToast();

  // Primary Tab: "calendar" | "daily"
  const [activeTab, setActiveTab] = useState<"calendar" | "daily">("calendar");

  // Separate Traditional View
  const [traditionView, setTraditionView] = useState<TraditionType>("gujarat");

  // Layout presentation in Calendar: 7-Day Grid vs Paksha View vs Agenda View
  const [calendarLayout, setCalendarLayout] = useState<"grid" | "paksha" | "agenda">("grid");

  // Mobile Paksha Tab ("Shukla" vs "Krishna")
  const [activePakshaTab, setActivePakshaTab] = useState<"Shukla" | "Krishna">("Shukla");

  // Daily Choghadiya & Horas Day/Night Tab on Mobile
  const [choghadiyaTab, setChoghadiyaTab] = useState<"day" | "night">("day");
  const [horaTab, setHoraTab] = useState<"day" | "night">("day");

  // Active Date & Selection for Calendar
  const now = useMemo(() => new Date(), []);
  const todayFormatted = useMemo(() => {
    const d = String(now.getDate()).padStart(2, "0");
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const y = now.getFullYear();
    return `${d}/${m}/${y}`;
  }, [now]);

  const [calYear, setCalYear] = useState<number>(now.getFullYear());
  const [selectedMasaIdx, setSelectedMasaIdx] = useState<number>(4); // 4 = Shravana
  const [calGregMonth, setCalGregMonth] = useState<number>(now.getMonth() + 1);

  // Month Calendar Data
  const [calendarData, setCalendarData] = useState<any>(null);
  const [calendarLoading, setCalendarLoading] = useState<boolean>(false);
  const [selectedDayDetail, setSelectedDayDetail] = useState<any>(null);
  const [selectedDayPreview, setSelectedDayPreview] = useState<any>(null);

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

  // Initialize System-wide Cached Location & Data on Mount
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

    // Retrieve system-wide cached location
    const cachedCity = getCachedLocation();
    setSelectedPanchangCity(cachedCity);
    setPanchangCityInput(cachedCity.name);

    // Initial Fetch Daily Panchang
    const fetchInitialPanchang = async () => {
      try {
        const payload = {
          date: formattedDate,
          time: formattedTime,
          city: cachedCity.name,
          lat: cachedCity.lat,
          lon: cachedCity.lon,
          timezone: cachedCity.timezone,
        };
        const res = await calculateChart(payload);
        if (res && res.panchanga) {
          setPanchangData(res.panchanga);
        }
      } catch (err) {
        console.error("Failed to load initial Panchang:", err);
      }
    };

    // Initial Fetch Monthly Calendar (Gujarat Shravana view default)
    const fetchInitialCalendar = async () => {
      setCalendarLoading(true);
      try {
        const payload = {
          year: y,
          month: now.getMonth() + 1,
          lat: cachedCity.lat,
          lon: cachedCity.lon,
          timezone: cachedCity.timezone,
          tradition: "amanta",
          view_mode: "lunar",
          lunar_masa: 4, // Shravana
        };
        const res = await calculateCalendar(payload);
        if (res) {
          setCalendarData(res);
          // Set preview day to today or first day
          if (res.days && res.days.length > 0) {
            const todayDay = res.days.find((d: any) => d.date === formattedDate);
            setSelectedDayPreview(todayDay || res.days[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load initial Calendar:", err);
      } finally {
        setCalendarLoading(false);
      }
    };

    fetchInitialPanchang();
    fetchInitialCalendar();

    // Listen for system-wide location changes across tabs/components
    const handleLocationSync = (e: any) => {
      if (e?.detail) {
        setSelectedPanchangCity(e.detail);
        setPanchangCityInput(e.detail.name);
        fetchMonthCalendar(traditionView, selectedMasaIdx, calGregMonth, calYear, e.detail);
      }
    };
    window.addEventListener("vedic_location_changed", handleLocationSync);
    return () => window.removeEventListener("vedic_location_changed", handleLocationSync);
  }, []);

  // Fetch Month Calendar according to Selected Tradition
  const fetchMonthCalendar = async (
    targetTradition: TraditionType,
    targetMasa: number,
    targetGregMonth: number,
    targetYear: number,
    cityObj: any
  ) => {
    if (!cityObj || typeof cityObj.lat !== "number" || typeof cityObj.lon !== "number") return;
    setCalendarLoading(true);
    try {
      const isEnglish = targetTradition === "english";
      const traditionParam = targetTradition === "north" ? "purnimanta" : "amanta";
      const viewModeParam = isEnglish ? "gregorian" : "lunar";

      const payload = {
        year: targetYear,
        month: targetGregMonth,
        lat: cityObj.lat,
        lon: cityObj.lon,
        timezone: typeof cityObj.timezone === "number" ? cityObj.timezone : 5.5,
        tradition: traditionParam,
        view_mode: viewModeParam,
        lunar_masa: isEnglish ? undefined : targetMasa,
      };

      const res = await calculateCalendar(payload);
      if (res && res.days && res.days.length > 0) {
        setCalendarData(res);
        const todayDay = res.days.find((d: any) => d.date === todayFormatted);
        setSelectedDayPreview(todayDay || res.days[0]);
      }
    } catch (err) {
      console.warn("Calendar update background fetch warning:", err);
    } finally {
      setCalendarLoading(false);
    }
  };

  // Switch Tradition View
  const handleTraditionViewChange = (newTradition: TraditionType) => {
    setTraditionView(newTradition);
    let newMasa = selectedMasaIdx;
    if (newTradition === "north" && selectedMasaIdx === 4) {
      newMasa = 5; // Bhadrapada
      setSelectedMasaIdx(5);
    } else if (newTradition === "gujarat" && selectedMasaIdx === 5) {
      newMasa = 4; // Shravana
      setSelectedMasaIdx(4);
    }
    fetchMonthCalendar(newTradition, newMasa, calGregMonth, calYear, selectedPanchangCity);
  };

  const handlePrevMonth = () => {
    if (traditionView === "english") {
      let newM = calGregMonth - 1;
      let newY = calYear;
      if (newM < 1) {
        newM = 12;
        newY -= 1;
      }
      setCalGregMonth(newM);
      setCalYear(newY);
      fetchMonthCalendar(traditionView, selectedMasaIdx, newM, newY, selectedPanchangCity);
    } else {
      let newMasa = selectedMasaIdx - 1;
      let newY = calYear;
      if (newMasa < 0) {
        newMasa = 11;
        newY -= 1;
      }
      setSelectedMasaIdx(newMasa);
      setCalYear(newY);
      fetchMonthCalendar(traditionView, newMasa, calGregMonth, newY, selectedPanchangCity);
    }
  };

  const handleNextMonth = () => {
    if (traditionView === "english") {
      let newM = calGregMonth + 1;
      let newY = calYear;
      if (newM > 12) {
        newM = 1;
        newY += 1;
      }
      setCalGregMonth(newM);
      setCalYear(newY);
      fetchMonthCalendar(traditionView, selectedMasaIdx, newM, newY, selectedPanchangCity);
    } else {
      let newMasa = selectedMasaIdx + 1;
      let newY = calYear;
      if (newMasa > 11) {
        newMasa = 0;
        newY += 1;
      }
      setSelectedMasaIdx(newMasa);
      setCalYear(newY);
      fetchMonthCalendar(traditionView, newMasa, calGregMonth, newY, selectedPanchangCity);
    }
  };

  const handleSelectCity = (city: any) => {
    setSelectedPanchangCity(city);
    setPanchangCityInput(city.name);
    setPanchangCityResults([]);
    // Update system-wide cache
    setCachedLocation(city);
    fetchMonthCalendar(traditionView, selectedMasaIdx, calGregMonth, calYear, city);
  };

  const handleCalculatePanchang = async () => {
    if (!panchangDate) {
      showToast("Please enter a valid date.", "error");
      return;
    }

    setPanchangLoading(true);
    try {
      const payload = {
        date: panchangDate,
        time: panchangTime,
        city: selectedPanchangCity?.name || "New Delhi, India",
        lat: selectedPanchangCity?.lat || 28.6139,
        lon: selectedPanchangCity?.lon || 77.209,
        timezone: selectedPanchangCity?.timezone || 5.5,
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
    if (diffMins < 0) diffMins += 1440;

    const totalGhatis = diffMins / 24.0;
    const ghati = Math.floor(totalGhatis) % 60;
    const remVighati = (totalGhatis - Math.floor(totalGhatis)) * 60;
    const vighati = Math.floor(remVighati) % 60;
    const vipal = Math.floor((remVighati - Math.floor(remVighati)) * 60) % 60;

    const isDay = nowMins >= sunriseMins && nowMins < (panchangData.sunset ? parseTimeMins(panchangData.sunset) : 1110);
    const dayLen = panchangData.sunset ? parseTimeMins(panchangData.sunset) - sunriseMins : 720;

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
      let nightMins = nowMins - (panchangData.sunset ? parseTimeMins(panchangData.sunset) : 1110);
      if (nightMins < 0) nightMins += 1440;
      const nightLen = 1440 - dayLen;
      const pIdx = Math.min(3, Math.floor(nightMins / (nightLen / 4)));
      praharNum = pIdx + 5;
      muhurtaNum = Math.min(15, Math.floor(nightMins / (nightLen / 15))) + 16;
      const praharList = [
        ["Pradosha Prahar (First Night)", "प्रदोष प्रहर"],
        ["Nishitha Prahar (Midnight)", "निशीथ प्रहर"],
        ["Triyama Prahar (Late Night)", "त्रियामा प्रहर"],
        ["Usha Prahar (Pre-Dawn / Brahma)", "उषा प्रहर"],
      ];
      praharName = praharList[pIdx][0];
      praharSanskrit = praharList[pIdx][1];
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

  // Check if a time slot is active right now
  const isTimeSlotActive = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return false;
    const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes();
    const sMins = parseTimeMins(startStr);
    let eMins = parseTimeMins(endStr);
    if (eMins < sMins) {
      return nowMins >= sMins || nowMins < eMins;
    }
    return nowMins >= sMins && nowMins < eMins;
  };

  // Heading Calculation based on Tradition
  const currentMonthHeading = useMemo(() => {
    if (!calendarData) return "Vedic Calendar";
    if (traditionView === "english") {
      return `${GREGORIAN_MONTHS[calGregMonth - 1]} ${calYear}`;
    }
    const masa = calendarData.primary_masa || HINDU_MONTHS_CHAITRADI[selectedMasaIdx].sa;
    const vs = calendarData.primary_vikram_samvat || calYear + 57;
    const ss = calendarData.primary_shaka_samvat || calYear - 78;

    if (traditionView === "gujarat") {
      const guMasa = HINDU_MONTHS_CHAITRADI[selectedMasaIdx]?.gu || masa;
      return `${guMasa} માસ (${masa} Masa) - વિ.સં. ${vs}`;
    }
    if (traditionView === "north") {
      const hiMasa = HINDU_MONTHS_CHAITRADI[selectedMasaIdx]?.hi || masa;
      return `${hiMasa} मास (${masa} Masa) - वि.सं. ${vs}`;
    }
    if (traditionView === "south") {
      return `${masa} Masa - शालिवाहन शक ${ss} (${calendarData.primary_samvatsara || ""})`;
    }
    return `${masa} Masa ${vs} Vikram Samvat`;
  }, [calendarData, traditionView, selectedMasaIdx, calGregMonth, calYear]);

  // Current Month list based on Tradition
  const activeMonthList = useMemo(() => {
    if (traditionView === "gujarat") return HINDU_MONTHS_KARTIKADI;
    if (traditionView === "north" || traditionView === "south") return HINDU_MONTHS_CHAITRADI;
    return [];
  }, [traditionView]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn text-foreground max-w-6xl mx-auto px-3 sm:px-6 pb-12">
      {/* Top Header & Section Title */}
      <div className="text-center space-y-3 pt-2 sm:pt-4">
        <h1 className="text-2xl sm:text-4xl font-heading text-primary font-bold tracking-wide">
          Vedic Panchangam
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground font-serif max-w-2xl mx-auto px-2">
          Traditional Hindu Lunisolar Calendar, Five Cosmic Limbs of Time, and Real-time Vedic Kaala Maana.
        </p>

        {/* Responsive Segmented Mode Switcher */}
        <div className="w-full max-w-md mx-auto pt-2">
          <div className="grid grid-cols-2 p-1 bg-card/60 rounded-2xl border border-border/40 backdrop-blur-md shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab("calendar")}
              className={`py-2.5 px-3 rounded-xl font-heading text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === "calendar"
                  ? "bg-primary text-primary-foreground font-bold shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">Monthly Calendar</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("daily")}
              className={`py-2.5 px-3 rounded-xl font-heading text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === "daily"
                  ? "bg-primary text-primary-foreground font-bold shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">Daily Panchang</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Live Traditional Vedic Clock Widget */}
      {liveVedicClock && panchangData && (
        <div className="glass-parchment p-4 sm:p-6 rounded-2xl vedic-border shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-primary/10 pb-3 gap-2">
            <div>
              <span className="text-[10px] font-heading text-secondary tracking-widest uppercase block">
                Live Vedic Kaala Maana (वैदिक काल गणना)
              </span>
              <h3 className="text-base sm:text-lg font-heading text-primary font-bold">
                Ishta Kala (इष्टकाल - Elapsed Solar Time)
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-heading bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20 self-start sm:self-auto">
              <Clock className="w-3.5 h-3.5 animate-pulse text-primary shrink-0" />
              <span>
                Sunrise: <strong>{panchangData.sunrise || "--:--"}</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 text-center">
            {/* Ishta Kala in Ghati, Vighati, Vipal */}
            <div className="bg-card/40 p-3 sm:p-4 rounded-xl border border-border/20 space-y-1">
              <span className="text-[9px] sm:text-[10px] text-muted-foreground font-heading uppercase tracking-wider block">
                Elapsed Ishta Kala
              </span>
              <div className="font-heading text-lg sm:text-xl text-primary font-extrabold tracking-wider">
                {liveVedicClock.ghati} <span className="text-[10px] font-normal text-muted-foreground">Gh</span>{" "}
                {liveVedicClock.vighati} <span className="text-[10px] font-normal text-muted-foreground">Vigh</span>{" "}
                <span className="hidden sm:inline">
                  {liveVedicClock.vipal} <span className="text-[10px] font-normal text-muted-foreground">Vip</span>
                </span>
              </div>
              <p className="text-[8px] sm:text-[9px] text-muted-foreground font-serif">
                1 Ghati = 24m | 1 Vighati = 24s
              </p>
            </div>

            {/* Current Prahar */}
            <div className="bg-card/40 p-3 sm:p-4 rounded-xl border border-border/20 space-y-1">
              <span className="text-[9px] sm:text-[10px] text-muted-foreground font-heading uppercase tracking-wider block">
                Prahar ({liveVedicClock.praharNum}/8)
              </span>
              <div className="font-heading text-xs sm:text-sm text-foreground font-bold truncate">
                {liveVedicClock.praharSanskrit}
              </div>
              <p className="text-[8px] sm:text-[9px] text-muted-foreground font-serif truncate">
                {liveVedicClock.praharName.split("(")[0]}
              </p>
            </div>

            {/* Active Muhurta */}
            <div className="bg-card/40 p-3 sm:p-4 rounded-xl border border-border/20 space-y-1">
              <span className="text-[9px] sm:text-[10px] text-muted-foreground font-heading uppercase tracking-wider block">
                Active Muhurta ({liveVedicClock.muhurtaNum}/30)
              </span>
              <div className="font-heading text-xs sm:text-sm text-primary font-bold truncate">
                {panchangData.vedic_time?.muhurta_name || "Abhijit"} Muhurta
              </div>
              <p className="text-[8px] sm:text-[9px] text-muted-foreground font-serif truncate">
                Cosmic vibration
              </p>
            </div>

            {/* Cosmic Samvat Context */}
            <div className="bg-card/40 p-3 sm:p-4 rounded-xl border border-border/20 space-y-1">
              <span className="text-[9px] sm:text-[10px] text-muted-foreground font-heading uppercase tracking-wider block">
                Cosmic Eras (संवत्सर)
              </span>
              <div className="font-heading text-[11px] sm:text-xs text-foreground font-semibold">
                VS {panchangData.vikram_samvat || "2083"} | SS {panchangData.shaka_samvat || "1948"}
              </div>
              <p className="text-[8px] sm:text-[9px] text-muted-foreground font-serif truncate">
                {panchangData.samvatsara_name || "Krodhana"} Samvatsara
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 1: MONTHLY HINDU CALENDAR ──────────────────────────────────── */}
      {activeTab === "calendar" && (
        <div className="space-y-4 sm:space-y-6">
          {/* Tradition Switcher Bar (Mobile Horizontal Swipeable Pills) */}
          <div className="glass-parchment p-2 sm:p-3 rounded-2xl vedic-border shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-heading text-secondary font-bold uppercase tracking-wider px-1">
              Tradition View:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 scroll-smooth">
              <button
                type="button"
                onClick={() => handleTraditionViewChange("gujarat")}
                className={`px-3 py-1.5 rounded-xl font-heading text-xs whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  traditionView === "gujarat"
                    ? "bg-primary text-primary-foreground font-bold shadow-sm"
                    : "bg-card/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                Gujarat (કાર્તિકાદિ)
              </button>
              <button
                type="button"
                onClick={() => handleTraditionViewChange("north")}
                className={`px-3 py-1.5 rounded-xl font-heading text-xs whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  traditionView === "north"
                    ? "bg-primary text-primary-foreground font-bold shadow-sm"
                    : "bg-card/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                North India (पूर्णिमान्त)
              </button>
              <button
                type="button"
                onClick={() => handleTraditionViewChange("south")}
                className={`px-3 py-1.5 rounded-xl font-heading text-xs whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  traditionView === "south"
                    ? "bg-primary text-primary-foreground font-bold shadow-sm"
                    : "bg-card/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                South India (शालिवाहन)
              </button>
              <button
                type="button"
                onClick={() => handleTraditionViewChange("english")}
                className={`px-3 py-1.5 rounded-xl font-heading text-xs whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  traditionView === "english"
                    ? "bg-secondary text-secondary-foreground font-bold shadow-sm"
                    : "bg-card/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                English (Gregorian)
              </button>
            </div>
          </div>

          {/* Calendar Control Bar */}
          <div className="glass-parchment p-4 sm:p-5 rounded-2xl vedic-border shadow-xl space-y-3.5">
            {/* Top Tier: Month Navigation on Left, Layout Switcher on Right */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-3 pb-3 border-b border-primary/10">
              {/* Month Navigation & Heading */}
              <div className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto justify-between lg:justify-start min-w-0">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  disabled={calendarLoading}
                  className="p-2 sm:p-2.5 rounded-full bg-card/60 border border-border/40 hover:bg-primary/10 text-primary transition-all cursor-pointer disabled:opacity-50 shrink-0"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                <div className="text-center lg:text-left min-w-0 flex-1">
                  <h2 className="text-base sm:text-xl md:text-2xl font-heading text-primary font-bold truncate">
                    {currentMonthHeading}
                  </h2>
                  {calendarData && (
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground font-serif mt-0.5 truncate">
                      {calendarData.primary_ritu} | {calendarData.primary_ayana}
                      {calendarData.primary_samvatsara ? ` | ${calendarData.primary_samvatsara}` : ""}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  disabled={calendarLoading}
                  className="p-2 sm:p-2.5 rounded-full bg-card/60 border border-border/40 hover:bg-primary/10 text-primary transition-all cursor-pointer disabled:opacity-50 shrink-0"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Layout Switcher (Grid vs Paksha vs Agenda List) - Fixed position & width */}
              <div className="w-full lg:w-auto flex items-center justify-center bg-card/50 p-1 rounded-xl border border-border/30 text-xs font-heading shrink-0">
                <button
                  type="button"
                  onClick={() => setCalendarLayout("grid")}
                  className={`flex-1 lg:flex-initial py-1.5 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                    calendarLayout === "grid"
                      ? "bg-primary text-primary-foreground font-bold shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="7-Day Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                  <span>7-Day Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarLayout("paksha")}
                  className={`flex-1 lg:flex-initial py-1.5 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                    calendarLayout === "paksha"
                      ? "bg-primary text-primary-foreground font-bold shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Paksha View"
                >
                  <Columns className="w-3.5 h-3.5 shrink-0" />
                  <span>Paksha</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarLayout("agenda")}
                  className={`flex-1 lg:flex-initial py-1.5 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                    calendarLayout === "agenda"
                      ? "bg-primary text-primary-foreground font-bold shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Agenda List View"
                >
                  <List className="w-3.5 h-3.5 shrink-0" />
                  <span>List</span>
                </button>
              </div>
            </div>

            {/* Bottom Tier: Reference Location on Left, Quick Jump Controls on Right */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Location Bar with System-wide Cache Indicator */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-serif w-full sm:w-auto justify-between sm:justify-start">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate">
                    Ref: <strong className="text-foreground">{selectedPanchangCity?.name || "New Delhi, India"}</strong>
                  </span>
                </div>
                <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-heading shrink-0">
                  Cached System-wide
                </span>
              </div>

              {/* Quick Jump Dropdowns & Inputs */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                {traditionView === "english" ? (
                  <select
                    value={calGregMonth}
                    onChange={(e) => {
                      const m = parseInt(e.target.value, 10);
                      setCalGregMonth(m);
                      fetchMonthCalendar(traditionView, selectedMasaIdx, m, calYear, selectedPanchangCity);
                    }}
                    className="flex-1 sm:flex-initial bg-card/60 border border-border/40 text-foreground font-heading text-xs rounded-lg px-2.5 py-1.5 focus:border-primary outline-none cursor-pointer min-w-[120px]"
                  >
                    {GREGORIAN_MONTHS.map((name, idx) => (
                      <option key={idx} value={idx + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={selectedMasaIdx}
                    onChange={(e) => {
                      const m = parseInt(e.target.value, 10);
                      setSelectedMasaIdx(m);
                      fetchMonthCalendar(traditionView, m, calGregMonth, calYear, selectedPanchangCity);
                    }}
                    className="flex-1 sm:flex-initial bg-card/60 border border-border/40 text-foreground font-heading text-xs rounded-lg px-2.5 py-1.5 focus:border-primary outline-none cursor-pointer min-w-[140px]"
                  >
                    {activeMonthList.map((m) => (
                      <option key={m.idx} value={m.idx}>
                        {traditionView === "gujarat"
                          ? `${m.gu} (${m.sa})`
                          : traditionView === "north"
                          ? `${m.hi} (${m.sa})`
                          : `${m.sa} Masa`}
                      </option>
                    ))}
                  </select>
                )}

                <input
                  type="number"
                  value={calYear}
                  onChange={(e) => {
                    const y = parseInt(e.target.value, 10);
                    if (!isNaN(y)) {
                      setCalYear(y);
                      fetchMonthCalendar(traditionView, selectedMasaIdx, calGregMonth, y, selectedPanchangCity);
                    }
                  }}
                  className="w-16 sm:w-20 bg-card/60 border border-border/40 text-foreground font-heading text-xs rounded-lg px-2 py-1.5 focus:border-primary outline-none text-center"
                  placeholder="Year"
                />

                <button
                  type="button"
                  onClick={() => {
                    const curY = now.getFullYear();
                    const curM = now.getMonth() + 1;
                    setCalYear(curY);
                    setCalGregMonth(curM);
                    const defaultMasa = traditionView === "north" ? 5 : 4;
                    setSelectedMasaIdx(defaultMasa);
                    fetchMonthCalendar(traditionView, defaultMasa, curM, curY, selectedPanchangCity);
                  }}
                  className="px-2.5 py-1.5 bg-card/40 border border-border/40 hover:bg-primary/10 text-primary text-xs font-heading rounded-lg transition-all cursor-pointer whitespace-nowrap"
                >
                  Current
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Grid / Paksha / Agenda Display */}
          {calendarLoading ? (
            <div className="glass-parchment p-12 rounded-2xl vedic-border text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
              <div className="font-heading text-sm text-primary font-bold">
                Calculating Cosmic Ephemeris for Month...
              </div>
            </div>
          ) : calendarData && calendarData.days ? (
            <div className="glass-parchment p-3 sm:p-6 rounded-2xl vedic-border shadow-xl space-y-4">
              {/* ─── LAYOUT A: 7-DAY WEEKDAY GRID ─── */}
              {calendarLayout === "grid" && (
                <>
                  {/* Day of Week Headers */}
                  <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center border-b border-primary/10 pb-2">
                    {[
                      { en: "Sun", sa: "Ravi", fullSa: "Ravivara" },
                      { en: "Mon", sa: "Soma", fullSa: "Somavara" },
                      { en: "Tue", sa: "Mang", fullSa: "Mangalavara" },
                      { en: "Wed", sa: "Budh", fullSa: "Budhavara" },
                      { en: "Thu", sa: "Guru", fullSa: "Guruvara" },
                      { en: "Fri", sa: "Shuk", fullSa: "Shukravara" },
                      { en: "Sat", sa: "Shan", fullSa: "Shanivara" },
                    ].map((d, i) => (
                      <div key={i} className="space-y-0.5">
                        <div className="font-heading text-[10px] sm:text-xs text-primary font-bold uppercase tracking-wider">
                          <span className="hidden sm:inline">{d.fullSa}</span>
                          <span className="sm:hidden">{d.sa}</span>
                        </div>
                        <div className="text-[8px] sm:text-[9px] text-muted-foreground font-serif">{d.en}</div>
                      </div>
                    ))}
                  </div>

                  {/* Day Cells Grid */}
                  <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {/* Empty cells for leading weekday offset */}
                    {(() => {
                      const firstDay = calendarData.days[0];
                      if (!firstDay) return null;
                      const [d, m, y] = firstDay.date.split("/").map(Number);
                      const firstDate = new Date(y, m - 1, d);
                      const leadingDays = firstDate.getDay();
                      return Array.from({ length: leadingDays }).map((_, idx) => (
                        <div
                          key={`empty-${idx}`}
                          className="min-h-[52px] sm:min-h-[115px] p-1 sm:p-2.5 rounded-lg sm:rounded-xl bg-card/10 border border-transparent opacity-20"
                        />
                      ));
                    })()}

                    {/* Day Cards with Current Date Highlighting & Responsive Design */}
                    {calendarData.days.map((day: any, idx: number) => {
                      const isEnglish = traditionView === "english";
                      const tithiSanskritLabel = TITHI_NAMES_SANSKRIT[(day.tithi_index - 1) % 30] || day.tithi_name;
                      const isToday = day.date === todayFormatted;
                      const isSelectedPreview = selectedDayPreview?.date === day.date;

                      return (
                        <motion.div
                          key={idx}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => {
                            setSelectedDayPreview(day);
                            if (window.innerWidth >= 640) {
                              setSelectedDayDetail(day);
                            }
                          }}
                          className={`min-h-[54px] sm:min-h-[115px] p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl border transition-all text-left flex flex-col justify-between cursor-pointer relative group ${
                            isToday
                              ? "bg-primary/20 border-primary ring-2 ring-primary/50 shadow-md"
                              : isSelectedPreview
                              ? "bg-card/80 border-primary/60 ring-1 ring-primary/30"
                              : "bg-card/40 hover:bg-card/80 border-border/30 hover:border-primary/40 shadow-sm"
                          }`}
                        >
                          {/* Top Row: Primary Header, Today Badge */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-1">
                              {isEnglish ? (
                                <span
                                  className={`font-heading text-xs sm:text-sm font-bold ${
                                    isToday ? "text-primary font-extrabold" : "text-foreground"
                                  }`}
                                >
                                  {day.day_of_month}
                                </span>
                              ) : (
                                <>
                                  {/* Mobile: Tithi Number Numeral */}
                                  <span
                                    className={`sm:hidden font-heading text-xs font-bold ${
                                      isToday ? "text-primary font-extrabold" : "text-foreground"
                                    }`}
                                  >
                                    {((day.tithi_index - 1) % 15) + 1}
                                  </span>
                                  {/* Desktop: Sanskrit Label */}
                                  <span
                                    className={`hidden sm:inline font-heading text-xs truncate max-w-[85px] ${
                                      isToday ? "text-primary font-extrabold" : "text-foreground font-bold"
                                    }`}
                                  >
                                    {tithiSanskritLabel.split(" ")[0]}
                                  </span>
                                </>
                              )}
                              {isToday && (
                                <span className="hidden sm:inline text-[7px] font-heading font-extrabold px-1 py-0.2 rounded bg-primary text-primary-foreground uppercase tracking-wider">
                                  Today
                                </span>
                              )}
                            </div>

                            {/* Paksha Indicator: Desktop Badge, Mobile Mini Dot */}
                            <span
                              className={`hidden sm:inline text-[8px] font-heading px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                                day.paksha === "Shukla"
                                  ? "bg-amber-500/10 text-amber-700 border border-amber-500/20"
                                  : "bg-indigo-500/10 text-indigo-700 border border-indigo-500/20"
                              }`}
                            >
                              {day.paksha}
                            </span>
                            <span
                              className={`sm:hidden w-1.5 h-1.5 rounded-full ${
                                day.paksha === "Shukla" ? "bg-amber-500" : "bg-indigo-500"
                              }`}
                              title={`${day.paksha} Paksha`}
                            />
                          </div>

                          {/* Desktop Middle: Tithi Name & Nakshatra */}
                          <div className="hidden sm:block space-y-0.5 my-1">
                            <div className="font-heading text-[11px] text-foreground font-semibold truncate">
                              {day.tithi_name}
                            </div>
                            <div className="text-[9px] text-muted-foreground font-serif truncate">
                              {day.nakshatra_name}
                            </div>
                          </div>

                          {/* Desktop Bottom Badges */}
                          <div className="hidden sm:block space-y-1">
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
                            {day.is_pradosh && (
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

                          {/* Mobile Bottom Indicator Dots */}
                          <div className="flex sm:hidden items-center gap-1 justify-end pt-1">
                            {day.festival && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title={day.festival} />
                            )}
                            {day.is_ekadashi && (
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" title="Ekadashi" />
                            )}
                            {day.is_purnima && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ring-1 ring-amber-600" title="Purnima" />
                            )}
                            {day.is_amavasya && (
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-900" title="Amavasya" />
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Mobile Interactive Selected Day Preview Card */}
                  {selectedDayPreview && (
                    <div className="sm:hidden bg-card/60 p-3.5 rounded-xl border border-primary/30 space-y-2 mt-3 animate-fadeIn">
                      <div className="flex items-center justify-between border-b border-border/20 pb-2">
                        <div>
                          <span className="text-[9px] font-heading text-secondary uppercase font-bold tracking-wider block">
                            Selected Day ({selectedDayPreview.date})
                          </span>
                          <h4 className="font-heading text-sm text-primary font-bold">
                            {selectedDayPreview.tithi_name} ({selectedDayPreview.paksha} Paksha)
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedDayDetail(selectedDayPreview)}
                          className="px-2.5 py-1 bg-primary text-primary-foreground text-[10px] font-heading font-bold rounded-lg shadow-sm"
                        >
                          View Details
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-card/40 p-2 rounded-lg border border-border/10">
                          <span className="text-[9px] text-muted-foreground block font-heading">Nakshatra</span>
                          <span className="font-semibold text-foreground">{selectedDayPreview.nakshatra_name}</span>
                        </div>
                        <div className="bg-card/40 p-2 rounded-lg border border-border/10">
                          <span className="text-[9px] text-muted-foreground block font-heading">Day (Vara)</span>
                          <span className="font-semibold text-foreground">{selectedDayPreview.vara_sanskrit}</span>
                        </div>
                      </div>

                      {selectedDayPreview.festival && (
                        <div className="text-[11px] font-heading text-emerald-700 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 font-bold">
                          🎉 {selectedDayPreview.festival}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* ─── LAYOUT B: TWO PAKSHA COLUMNS (WITH MOBILE TABS) ─── */}
              {calendarLayout === "paksha" && (
                <div className="space-y-4">
                  {/* Mobile Paksha Tab Switcher */}
                  <div className="md:hidden grid grid-cols-2 p-1 bg-card/50 rounded-xl border border-border/30 text-xs font-heading">
                    <button
                      type="button"
                      onClick={() => setActivePakshaTab("Shukla")}
                      className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        activePakshaTab === "Shukla"
                          ? "bg-amber-500/20 text-amber-900 border border-amber-500/30 font-bold shadow-sm"
                          : "text-muted-foreground"
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5 text-amber-600" /> Shukla Paksha
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePakshaTab("Krishna")}
                      className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        activePakshaTab === "Krishna"
                          ? "bg-indigo-500/20 text-indigo-900 border border-indigo-500/30 font-bold shadow-sm"
                          : "text-muted-foreground"
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5 text-indigo-600" /> Krishna Paksha
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Shukla Paksha Column */}
                    <div
                      className={`space-y-3 bg-card/30 p-3 sm:p-4 rounded-xl border border-border/20 ${
                        activePakshaTab === "Shukla" ? "block" : "hidden md:block"
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                        <h3 className="font-heading text-xs sm:text-sm text-amber-700 font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <Sun className="w-3.5 h-3.5" /> Shukla Paksha (शुक्ल पक्ष)
                        </h3>
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground font-serif">
                          Tithi 1 to 15 (Waxing)
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {calendarData.days
                          .filter((d: any) => d.paksha === "Shukla")
                          .map((day: any, i: number) => {
                            const isEnglish = traditionView === "english";
                            const tLabel = isEnglish
                              ? `${day.day_of_month} ${GREGORIAN_MONTHS[calGregMonth - 1].slice(0, 3)} - ${day.tithi_name}`
                              : TITHI_NAMES_SANSKRIT[(day.tithi_index - 1) % 30] || day.tithi_name;
                            const isToday = day.date === todayFormatted;
                            return (
                              <div
                                key={i}
                                onClick={() => setSelectedDayDetail(day)}
                                className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between text-xs ${
                                  isToday
                                    ? "bg-primary/20 border-primary ring-1 ring-primary/50 shadow-md"
                                    : "bg-card/60 hover:bg-amber-500/10 border-border/20 hover:border-amber-500/30"
                                }`}
                              >
                                <div className="space-y-0.5 min-w-0 pr-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-heading text-xs font-bold text-primary block truncate">
                                      {tLabel}
                                    </span>
                                    {isToday && (
                                      <span className="text-[7px] font-heading font-extrabold px-1 py-0.2 rounded bg-primary text-primary-foreground uppercase shrink-0">
                                        Today
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-muted-foreground font-serif block truncate">
                                    {day.nakshatra_name} | {day.vara_sanskrit}
                                  </span>
                                </div>
                                <div className="text-right shrink-0">
                                  {day.festival ? (
                                    <span className="font-heading text-[10px] font-bold text-emerald-700 block max-w-[120px] truncate">
                                      {day.festival}
                                    </span>
                                  ) : day.is_purnima ? (
                                    <span className="font-heading text-[10px] font-bold text-amber-800 block">
                                      Purnima Vrat
                                    </span>
                                  ) : day.is_ekadashi ? (
                                    <span className="font-heading text-[10px] font-bold text-purple-800 block">
                                      Ekadashi Vrat
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Krishna Paksha Column */}
                    <div
                      className={`space-y-3 bg-card/30 p-3 sm:p-4 rounded-xl border border-border/20 ${
                        activePakshaTab === "Krishna" ? "block" : "hidden md:block"
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                        <h3 className="font-heading text-xs sm:text-sm text-indigo-700 font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <Moon className="w-3.5 h-3.5" /> Krishna Paksha (कृष्ण पक्ष)
                        </h3>
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground font-serif">
                          Tithi 16 to 30 (Waning)
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {calendarData.days
                          .filter((d: any) => d.paksha === "Krishna")
                          .map((day: any, i: number) => {
                            const isEnglish = traditionView === "english";
                            const tLabel = isEnglish
                              ? `${day.day_of_month} ${GREGORIAN_MONTHS[calGregMonth - 1].slice(0, 3)} - ${day.tithi_name}`
                              : TITHI_NAMES_SANSKRIT[(day.tithi_index - 1) % 30] || day.tithi_name;
                            const isToday = day.date === todayFormatted;
                            return (
                              <div
                                key={i}
                                onClick={() => setSelectedDayDetail(day)}
                                className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between text-xs ${
                                  isToday
                                    ? "bg-primary/20 border-primary ring-1 ring-primary/50 shadow-md"
                                    : "bg-card/60 hover:bg-indigo-500/10 border-border/20 hover:border-indigo-500/30"
                                }`}
                              >
                                <div className="space-y-0.5 min-w-0 pr-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-heading text-xs font-bold text-primary block truncate">
                                      {tLabel}
                                    </span>
                                    {isToday && (
                                      <span className="text-[7px] font-heading font-extrabold px-1 py-0.2 rounded bg-primary text-primary-foreground uppercase shrink-0">
                                        Today
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-muted-foreground font-serif block truncate">
                                    {day.nakshatra_name} | {day.vara_sanskrit}
                                  </span>
                                </div>
                                <div className="text-right shrink-0">
                                  {day.festival ? (
                                    <span className="font-heading text-[10px] font-bold text-emerald-700 block max-w-[120px] truncate">
                                      {day.festival}
                                    </span>
                                  ) : day.is_amavasya ? (
                                    <span className="font-heading text-[10px] font-bold text-slate-800 block">
                                      Amavasya / Pitru
                                    </span>
                                  ) : day.is_ekadashi ? (
                                    <span className="font-heading text-[10px] font-bold text-purple-800 block">
                                      Ekadashi Vrat
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── LAYOUT C: AGENDA / CHRONOLOGICAL DAY-BY-DAY LIST ─── */}
              {calendarLayout === "agenda" && (
                <div className="space-y-2.5">
                  {calendarData.days.map((day: any, i: number) => {
                    const isToday = day.date === todayFormatted;
                    return (
                      <div
                        key={i}
                        onClick={() => setSelectedDayDetail(day)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isToday
                            ? "bg-primary/20 border-primary ring-2 ring-primary/40 shadow-md"
                            : "bg-card/50 hover:bg-card/80 border-border/20"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Date Badge */}
                          <div className="w-12 h-12 rounded-xl bg-card/80 border border-border/30 flex flex-col items-center justify-center shrink-0">
                            <span className="font-heading text-xs font-extrabold text-primary">
                              {day.day_of_month}
                            </span>
                            <span className="text-[8px] font-serif text-muted-foreground uppercase">
                              {day.vara_sanskrit?.slice(0, 4)}
                            </span>
                          </div>

                          {/* Day Details */}
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-heading text-xs font-bold text-foreground truncate">
                                {day.tithi_name}
                              </span>
                              <span
                                className={`text-[8px] font-heading px-1.5 py-0.2 rounded ${
                                  day.paksha === "Shukla"
                                    ? "bg-amber-500/20 text-amber-800"
                                    : "bg-indigo-500/20 text-indigo-800"
                                }`}
                              >
                                {day.paksha}
                              </span>
                              {isToday && (
                                <span className="text-[7px] font-heading font-extrabold px-1 py-0.2 rounded bg-primary text-primary-foreground uppercase">
                                  Today
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-serif truncate">
                              Nakshatra: {day.nakshatra_name} | Sunrise: {day.sunrise}
                            </div>
                          </div>
                        </div>

                        {/* Festival / Vrat Badge */}
                        <div className="text-right shrink-0">
                          {day.festival ? (
                            <span className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-[10px] font-heading font-bold text-emerald-800 block">
                              {day.festival}
                            </span>
                          ) : day.is_purnima ? (
                            <span className="px-2 py-1 bg-amber-500/20 border border-amber-500/30 rounded-lg text-[10px] font-heading font-bold text-amber-800 block">
                              Purnima Vrat
                            </span>
                          ) : day.is_amavasya ? (
                            <span className="px-2 py-1 bg-slate-800 text-slate-100 rounded-lg text-[10px] font-heading font-bold block">
                              Amavasya
                            </span>
                          ) : day.is_ekadashi ? (
                            <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded-lg text-[10px] font-heading font-bold text-purple-800 block">
                              Ekadashi
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Monthly Important Vrats & Events Quick Reference */}
              {calendarData && calendarData.days && (
                <div className="bg-card/30 p-3 sm:p-5 rounded-2xl border border-border/20 space-y-3 mt-4">
                  <div className="flex items-center justify-between border-b border-border/10 pb-2">
                    <h3 className="font-heading text-xs sm:text-sm text-secondary font-bold uppercase tracking-wider">
                      Important Festivals & Vrats
                    </h3>
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground font-serif">
                      Auspicious Timings
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {calendarData.days
                      .filter((d: any) => d.vrats && d.vrats.length > 0)
                      .map((d: any, i: number) => (
                        <div
                          key={i}
                          onClick={() => setSelectedDayDetail(d)}
                          className="p-2.5 rounded-xl bg-card/50 hover:bg-primary/10 border border-border/20 hover:border-primary/30 transition-all cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5 min-w-0 pr-2">
                            <span className="font-heading text-xs font-bold text-primary block truncate">
                              {d.vrats.join(", ")}
                            </span>
                            <span className="text-[9px] sm:text-[10px] text-muted-foreground font-serif block truncate">
                              {d.tithi_name} ({d.paksha} Paksha)
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-heading text-xs font-bold text-foreground block">
                              {d.vara_sanskrit}
                            </span>
                            <span className="text-[8px] sm:text-[9px] text-muted-foreground font-serif">
                              {d.date}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Day Detail Modal / Mobile Bottom Sheet */}
          <AnimatePresence>
            {selectedDayDetail && (
              <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  className="bg-background glass-parchment border-t sm:border border-primary/20 shadow-2xl rounded-t-3xl sm:rounded-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 sm:space-y-6 max-h-[88vh] sm:max-h-[90vh] overflow-y-auto scroll-thin relative"
                >
                  {/* Mobile Grab Handle */}
                  <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-2 sm:hidden" />

                  <div className="flex items-center justify-between border-b border-primary/10 pb-3">
                    <div>
                      <span className="text-[9px] sm:text-[10px] font-heading text-secondary tracking-widest uppercase block">
                        Detailed Vedic Panchang ({selectedDayDetail.date})
                      </span>
                      <h3 className="text-lg sm:text-xl font-heading text-primary font-bold">
                        {selectedDayDetail.tithi_name} ({selectedDayDetail.paksha} Paksha)
                      </h3>
                      <p className="text-xs text-muted-foreground font-serif mt-0.5">
                        {selectedDayDetail.vara_sanskrit} ({selectedDayDetail.day_of_week})
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
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-center">
                    <div className="bg-card/40 p-2.5 rounded-xl border border-border/20">
                      <span className="text-[8px] sm:text-[9px] text-muted-foreground font-heading uppercase block">
                        Tradition Masa
                      </span>
                      <span className="text-[11px] sm:text-xs font-heading font-bold text-foreground">
                        {selectedDayDetail.masa_amanta} (Amanta)
                      </span>
                    </div>
                    <div className="bg-card/40 p-2.5 rounded-xl border border-border/20">
                      <span className="text-[8px] sm:text-[9px] text-muted-foreground font-heading uppercase block">
                        North Masa
                      </span>
                      <span className="text-[11px] sm:text-xs font-heading font-bold text-foreground">
                        {selectedDayDetail.masa_purnimanta} (Purnimanta)
                      </span>
                    </div>
                    <div className="bg-card/40 p-2.5 rounded-xl border border-border/20">
                      <span className="text-[8px] sm:text-[9px] text-muted-foreground font-heading uppercase block">
                        Ritu / Season
                      </span>
                      <span className="text-[11px] sm:text-xs font-heading font-bold text-primary">
                        {selectedDayDetail.ritu || "Grishma"}
                      </span>
                    </div>
                    <div className="bg-card/40 p-2.5 rounded-xl border border-border/20">
                      <span className="text-[8px] sm:text-[9px] text-muted-foreground font-heading uppercase block">
                        Ayana
                      </span>
                      <span className="text-[11px] sm:text-xs font-heading font-bold text-foreground">
                        {selectedDayDetail.ayana || "Dakshinayana"}
                      </span>
                    </div>
                  </div>

                  {/* 5 Cosmic Limbs */}
                  <div className="space-y-2.5 sm:space-y-3">
                    <h4 className="font-heading text-xs sm:text-sm text-primary font-bold uppercase tracking-wider">
                      Five Cosmic Limbs (पंच-अंग)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                      <div className="bg-card/40 p-3 rounded-xl border border-border/20 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] sm:text-[10px] text-muted-foreground font-heading uppercase block">
                            Tithi (Lunar Day)
                          </span>
                          <span className="font-heading text-xs sm:text-sm text-foreground font-semibold">
                            {selectedDayDetail.tithi_name}
                          </span>
                        </div>
                        <span className="text-xs font-serif text-muted-foreground">
                          {selectedDayDetail.paksha}
                        </span>
                      </div>

                      <div className="bg-card/40 p-3 rounded-xl border border-border/20 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] sm:text-[10px] text-muted-foreground font-heading uppercase block">
                            Nakshatra (Constellation)
                          </span>
                          <span className="font-heading text-xs sm:text-sm text-foreground font-semibold">
                            {selectedDayDetail.nakshatra_name}
                          </span>
                        </div>
                      </div>

                      <div className="bg-card/40 p-3 rounded-xl border border-border/20 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] sm:text-[10px] text-muted-foreground font-heading uppercase block">
                            Yoga (Luni-Solar Angle)
                          </span>
                          <span className="font-heading text-xs sm:text-sm text-foreground font-semibold">
                            {selectedDayDetail.yoga_name}
                          </span>
                        </div>
                      </div>

                      <div className="bg-card/40 p-3 rounded-xl border border-border/20 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] sm:text-[10px] text-muted-foreground font-heading uppercase block">
                            Karana (Half Tithi)
                          </span>
                          <span className="font-heading text-xs sm:text-sm text-foreground font-semibold">
                            {selectedDayDetail.karana_name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sun & Auspicious Timings */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-center">
                    <div className="bg-card/40 p-2.5 sm:p-3 rounded-xl border border-border/20">
                      <span className="text-[8px] sm:text-[9px] text-muted-foreground font-heading uppercase block">
                        Sunrise
                      </span>
                      <span className="text-xs font-heading font-bold text-foreground">
                        {selectedDayDetail.sunrise}
                      </span>
                    </div>
                    <div className="bg-card/40 p-2.5 sm:p-3 rounded-xl border border-border/20">
                      <span className="text-[8px] sm:text-[9px] text-muted-foreground font-heading uppercase block">
                        Sunset
                      </span>
                      <span className="text-xs font-heading font-bold text-foreground">
                        {selectedDayDetail.sunset}
                      </span>
                    </div>
                    <div className="bg-card/40 p-2.5 sm:p-3 rounded-xl border border-border/20">
                      <span className="text-[8px] sm:text-[9px] text-destructive font-heading uppercase block">
                        Rahu Kaal
                      </span>
                      <span className="text-xs font-heading font-bold text-destructive">
                        {selectedDayDetail.rahu_kaal}
                      </span>
                    </div>
                    <div className="bg-card/40 p-2.5 sm:p-3 rounded-xl border border-border/20">
                      <span className="text-[8px] sm:text-[9px] text-primary font-heading uppercase block">
                        Abhijit Muhurat
                      </span>
                      <span className="text-xs font-heading font-bold text-primary">
                        {selectedDayDetail.abhijit_muhurat}
                      </span>
                    </div>
                  </div>

                  {/* Vrats & Festivals on This Day */}
                  {selectedDayDetail.vrats && selectedDayDetail.vrats.length > 0 && (
                    <div className="bg-primary/5 p-3.5 sm:p-4 rounded-xl border border-primary/20 space-y-2">
                      <span className="text-[9px] sm:text-[10px] font-heading text-secondary uppercase tracking-widest block">
                        Auspicious Observances & Vrats
                      </span>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {selectedDayDetail.vrats.map((v: string, i: number) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 bg-primary/10 border border-primary/30 rounded-lg text-xs font-heading text-primary font-semibold"
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ─── TAB 2: DAILY PANCHANG & VEDIC TIME ──────────────────────────────── */}
      {activeTab === "daily" && (
        <div className="space-y-4 sm:space-y-6">
          {/* Custom Date / Time / City Selection Form */}
          <div className="glass-parchment p-4 sm:p-6 rounded-2xl vedic-border shadow-xl space-y-4">
            <h3 className="font-heading text-base sm:text-lg text-primary font-bold">
              Calculate Specific Day Panchang
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {/* Date with Today Helper */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-heading text-muted-foreground block">
                    Date (DD/MM/YYYY)
                  </label>
                  <button
                    type="button"
                    onClick={() => setPanchangDate(todayFormatted)}
                    className="text-[10px] font-heading text-primary hover:underline cursor-pointer"
                  >
                    Set Today
                  </button>
                </div>
                <input
                  type="text"
                  value={panchangDate}
                  onChange={(e) => setPanchangDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="w-full bg-card/60 border border-border/40 text-foreground font-heading text-sm rounded-xl px-3.5 py-2.5 focus:border-primary outline-none"
                />
              </div>

              {/* Time with Now Helper */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-heading text-muted-foreground block">
                    Time (HH:MM 24hr)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      const hh = String(d.getHours()).padStart(2, "0");
                      const mm = String(d.getMinutes()).padStart(2, "0");
                      setPanchangTime(`${hh}:${mm}`);
                    }}
                    className="text-[10px] font-heading text-primary hover:underline cursor-pointer"
                  >
                    Set Now
                  </button>
                </div>
                <input
                  type="time"
                  value={panchangTime}
                  onChange={(e) => setPanchangTime(e.target.value)}
                  className="w-full bg-card/60 border border-border/40 text-foreground font-heading text-sm rounded-xl px-3.5 py-2.5 focus:border-primary outline-none"
                />
              </div>

              {/* City Search */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-heading text-muted-foreground block">
                  City / Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={panchangCityInput}
                    onChange={(e) => {
                      setPanchangCityInput(e.target.value);
                      setSelectedPanchangCity(null);
                    }}
                    placeholder="Search city..."
                    className="w-full bg-card/60 border border-border/40 text-foreground font-heading text-sm rounded-xl pl-9 pr-3.5 py-2.5 focus:border-primary outline-none"
                  />
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                </div>

                {/* City Results Dropdown */}
                {panchangCityResults && panchangCityResults.length > 0 && !selectedPanchangCity && (
                  <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-background/95 border border-primary/20 shadow-xl rounded-xl max-h-48 overflow-y-auto">
                    {panchangCityResults.map((c: any, i: number) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectCity(c)}
                        className="w-full text-left px-3.5 py-2 text-xs hover:bg-primary/10 text-foreground border-b border-border/10 last:border-0 cursor-pointer"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCalculatePanchang}
              disabled={panchangLoading}
              className="w-full sm:w-auto px-6 py-2.5 bg-primary text-primary-foreground font-heading text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-primary/90 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
            >
              {panchangLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Calculate Vedic Panchang
            </button>
          </div>

          {/* Detailed Panchanga Output */}
          {panchangData && (
            <div className="space-y-4 sm:space-y-6">
              {/* 5 Cosmic Limbs Card */}
              <div className="glass-parchment p-4 sm:p-6 rounded-2xl vedic-border shadow-xl space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between border-b border-primary/10 pb-3">
                  <div>
                    <span className="text-[9px] sm:text-[10px] font-heading text-secondary tracking-widest uppercase block">
                      Five Cosmic Limbs
                    </span>
                    <h3 className="text-lg sm:text-xl font-heading text-primary font-bold">
                      Pancha-Anga (पञ्च-अङ्ग)
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-heading text-foreground font-semibold block">
                      {panchangData.vaara?.sanskrit || "Vara"}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground font-serif">
                      Lord: {panchangData.vaara?.lord || "Graha"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {/* Tithi */}
                  <div className="bg-card/40 p-3.5 sm:p-4 rounded-xl border border-border/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground font-heading uppercase">
                        1. Tithi (Lunar Phase)
                      </span>
                      <span className="text-[8px] sm:text-[9px] font-heading px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                        {panchangData.paksha}
                      </span>
                    </div>
                    <div className="font-heading text-sm sm:text-base text-primary font-bold">
                      {panchangData.tithi?.name || "Tithi"}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-muted-foreground">
                        <span>Progress</span>
                        <span>{panchangData.tithi?.progress_percent?.toFixed(1) || "0.0"}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-border/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${panchangData.tithi?.progress_percent || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Nakshatra */}
                  <div className="bg-card/40 p-3.5 sm:p-4 rounded-xl border border-border/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground font-heading uppercase">
                        2. Nakshatra (Star)
                      </span>
                      <span className="text-[8px] sm:text-[9px] font-heading px-1.5 py-0.5 rounded bg-secondary/10 text-secondary">
                        Pada {panchangData.nakshatra?.pada || 1}
                      </span>
                    </div>
                    <div className="font-heading text-sm sm:text-base text-secondary font-bold">
                      {panchangData.nakshatra?.name || "Nakshatra"}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-muted-foreground">
                        <span>Lord: {panchangData.nakshatra?.lord || "Graha"}</span>
                        <span>{panchangData.nakshatra?.progress_percent?.toFixed(1) || "0.0"}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-border/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-secondary rounded-full transition-all duration-500"
                          style={{ width: `${panchangData.nakshatra?.progress_percent || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Yoga */}
                  <div className="bg-card/40 p-3.5 sm:p-4 rounded-xl border border-border/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground font-heading uppercase">
                        3. Yoga (Luni-Solar)
                      </span>
                      <span className="text-[8px] sm:text-[9px] font-heading px-1.5 py-0.5 rounded bg-card/80 text-muted-foreground">
                        {panchangData.yoga?.benefic ? "Auspicious" : "Caution"}
                      </span>
                    </div>
                    <div className="font-heading text-sm sm:text-base text-foreground font-bold">
                      {panchangData.yoga?.name || "Yoga"}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-muted-foreground">
                        <span>Progress</span>
                        <span>{panchangData.yoga?.progress_percent?.toFixed(1) || "0.0"}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-border/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-foreground/60 rounded-full transition-all duration-500"
                          style={{ width: `${panchangData.yoga?.progress_percent || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Karana */}
                  <div className="bg-card/40 p-3.5 sm:p-4 rounded-xl border border-border/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground font-heading uppercase">
                        4. Karana (Half-Tithi)
                      </span>
                      <span className="text-[8px] sm:text-[9px] font-heading px-1.5 py-0.5 rounded bg-card/80 text-muted-foreground">
                        {panchangData.karana?.is_fixed ? "Fixed" : "Movable"}
                      </span>
                    </div>
                    <div className="font-heading text-sm sm:text-base text-foreground font-bold">
                      {panchangData.karana?.name || "Karana"}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-muted-foreground">
                        <span>Progress</span>
                        <span>{panchangData.karana?.progress_percent?.toFixed(1) || "0.0"}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-border/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-foreground/60 rounded-full transition-all duration-500"
                          style={{ width: `${panchangData.karana?.progress_percent || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Auspicious & Inauspicious Timings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Auspicious Muhurtas */}
                <div className="glass-parchment p-4 sm:p-6 rounded-2xl vedic-border shadow-xl space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 border-b border-primary/10 pb-3">
                    <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    <h3 className="font-heading text-sm sm:text-base text-primary font-bold">
                      Auspicious Timings (शुभ मुहूर्त)
                    </h3>
                  </div>
                  <div className="space-y-2.5 sm:space-y-3">
                    <div className="bg-primary/5 p-3 rounded-xl border border-primary/20 flex items-center justify-between">
                      <div>
                        <span className="font-heading text-xs font-bold text-primary block">
                          Abhijit Muhurat
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground font-serif">
                          Best for vital inaugurations & travel
                        </span>
                      </div>
                      <span className="font-heading text-xs font-bold text-foreground bg-card/60 px-2.5 py-1 rounded-lg border border-border/20 shrink-0">
                        {panchangData.abhijit_muhurat || "Midday"}
                      </span>
                    </div>

                    <div className="bg-primary/5 p-3 rounded-xl border border-primary/20 flex items-center justify-between">
                      <div>
                        <span className="font-heading text-xs font-bold text-primary block">
                          Brahma Muhurat
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground font-serif">
                          Best for meditation & study
                        </span>
                      </div>
                      <span className="font-heading text-xs font-bold text-foreground bg-card/60 px-2.5 py-1 rounded-lg border border-border/20 shrink-0">
                        {panchangData.brahma_muhurat || "Pre-dawn"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Inauspicious Kaalas */}
                <div className="glass-parchment p-4 sm:p-6 rounded-2xl vedic-border shadow-xl space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 border-b border-destructive/20 pb-3">
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
                    <h3 className="font-heading text-sm sm:text-base text-destructive font-bold">
                      Inauspicious Timings (अशुभ काल)
                    </h3>
                  </div>
                  <div className="space-y-2.5 sm:space-y-3">
                    <div className="bg-destructive/5 p-3 rounded-xl border border-destructive/20 flex items-center justify-between">
                      <div>
                        <span className="font-heading text-xs font-bold text-destructive block">
                          Rahu Kaal
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground font-serif">
                          Avoid starting new ventures
                        </span>
                      </div>
                      <span className="font-heading text-xs font-bold text-destructive bg-card/60 px-2.5 py-1 rounded-lg border border-border/20 shrink-0">
                        {panchangData.rahu_kaal || "Not Recommended"}
                      </span>
                    </div>

                    <div className="bg-destructive/5 p-3 rounded-xl border border-destructive/20 flex items-center justify-between">
                      <div>
                        <span className="font-heading text-xs font-bold text-destructive block">
                          Yama Ganda
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground font-serif">
                          Cautionary window ruled by Ketu
                        </span>
                      </div>
                      <span className="font-heading text-xs font-bold text-destructive bg-card/60 px-2.5 py-1 rounded-lg border border-border/20 shrink-0">
                        {panchangData.yama_ganda || "Caution"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 24-Hour Choghadiya Timings */}
              {(panchangData.choghadiya || panchangData.choghadiya_night) && (
                <div className="glass-parchment p-4 sm:p-6 rounded-2xl vedic-border shadow-xl space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-primary/10 pb-3 gap-2">
                    <div>
                      <span className="text-[9px] sm:text-[10px] font-heading text-secondary tracking-widest uppercase block">
                        24-Hour Time Division
                      </span>
                      <h3 className="text-lg sm:text-xl font-heading text-primary font-bold">
                        Choghadiya Timings (चौघड़िया)
                      </h3>
                    </div>

                    {/* Mobile Day/Night Tab Switcher */}
                    <div className="md:hidden grid grid-cols-2 p-1 bg-card/50 rounded-xl border border-border/30 text-xs font-heading">
                      <button
                        type="button"
                        onClick={() => setChoghadiyaTab("day")}
                        className={`py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                          choghadiyaTab === "day"
                            ? "bg-primary text-primary-foreground font-bold shadow-sm"
                            : "text-muted-foreground"
                        }`}
                      >
                        <Sun className="w-3.5 h-3.5" /> Day
                      </button>
                      <button
                        type="button"
                        onClick={() => setChoghadiyaTab("night")}
                        className={`py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                          choghadiyaTab === "night"
                            ? "bg-secondary text-secondary-foreground font-bold shadow-sm"
                            : "text-muted-foreground"
                        }`}
                      >
                        <Moon className="w-3.5 h-3.5" /> Night
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* Daytime Choghadiya */}
                    <div
                      className={`space-y-3 ${
                        choghadiyaTab === "day" ? "block" : "hidden md:block"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-heading text-primary font-bold uppercase tracking-wider">
                        <Sun className="w-4 h-4" /> Daytime (Sunrise to Sunset)
                      </div>
                      <div className="space-y-1.5">
                        {panchangData.choghadiya?.map((c: any, i: number) => {
                          const isGood = c.nature === "Auspicious";
                          const isActive = isTimeSlotActive(c.start, c.end);
                          return (
                            <div
                              key={i}
                              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                                isActive
                                  ? "bg-primary/20 border-primary ring-2 ring-primary/50 shadow-md"
                                  : isGood
                                  ? "bg-primary/10 border-primary/30"
                                  : "bg-card/40 border-border/20"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className={`font-heading font-bold truncate ${
                                    isGood ? "text-primary" : "text-foreground"
                                  }`}
                                >
                                  {c.name}
                                </span>
                                <span
                                  className={`text-[8px] sm:text-[9px] px-1.5 py-0.2 rounded font-heading shrink-0 ${
                                    isGood ? "bg-primary/20 text-primary" : "bg-card/80 text-muted-foreground"
                                  }`}
                                >
                                  {c.nature}
                                </span>
                                {isActive && (
                                  <span className="text-[7px] font-heading font-extrabold px-1.5 py-0.2 rounded-full bg-primary text-primary-foreground uppercase animate-pulse">
                                    Now
                                  </span>
                                )}
                              </div>
                              <span className="text-muted-foreground font-mono text-[10px] sm:text-[11px] shrink-0">
                                {c.start} - {c.end}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Nighttime Choghadiya */}
                    <div
                      className={`space-y-3 ${
                        choghadiyaTab === "night" ? "block" : "hidden md:block"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-heading text-secondary font-bold uppercase tracking-wider">
                        <Moon className="w-4 h-4" /> Nighttime (Sunset to Sunrise)
                      </div>
                      <div className="space-y-1.5">
                        {panchangData.choghadiya_night?.map((c: any, i: number) => {
                          const isGood = c.nature === "Auspicious";
                          const isActive = isTimeSlotActive(c.start, c.end);
                          return (
                            <div
                              key={i}
                              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                                isActive
                                  ? "bg-secondary/20 border-secondary ring-2 ring-secondary/50 shadow-md"
                                  : isGood
                                  ? "bg-secondary/10 border-secondary/30"
                                  : "bg-card/40 border-border/20"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className={`font-heading font-bold truncate ${
                                    isGood ? "text-secondary" : "text-foreground"
                                  }`}
                                >
                                  {c.name}
                                </span>
                                <span
                                  className={`text-[8px] sm:text-[9px] px-1.5 py-0.2 rounded font-heading shrink-0 ${
                                    isGood ? "bg-secondary/20 text-secondary" : "bg-card/80 text-muted-foreground"
                                  }`}
                                >
                                  {c.nature}
                                </span>
                                {isActive && (
                                  <span className="text-[7px] font-heading font-extrabold px-1.5 py-0.2 rounded-full bg-secondary text-secondary-foreground uppercase animate-pulse">
                                    Now
                                  </span>
                                )}
                              </div>
                              <span className="text-muted-foreground font-mono text-[10px] sm:text-[11px] shrink-0">
                                {c.start} - {c.end}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 24-Hour Planetary Horas */}
              {(panchangData.horas_day || panchangData.horas_night) && (
                <div className="glass-parchment p-4 sm:p-6 rounded-2xl vedic-border shadow-xl space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-primary/10 pb-3 gap-2">
                    <div>
                      <span className="text-[9px] sm:text-[10px] font-heading text-secondary tracking-widest uppercase block">
                        24-Hour Planetary Hours
                      </span>
                      <h3 className="text-lg sm:text-xl font-heading text-primary font-bold">
                        Planetary Horas (होरा चक्र)
                      </h3>
                    </div>

                    {/* Mobile Day/Night Tab Switcher */}
                    <div className="md:hidden grid grid-cols-2 p-1 bg-card/50 rounded-xl border border-border/30 text-xs font-heading">
                      <button
                        type="button"
                        onClick={() => setHoraTab("day")}
                        className={`py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                          horaTab === "day"
                            ? "bg-primary text-primary-foreground font-bold shadow-sm"
                            : "text-muted-foreground"
                        }`}
                      >
                        <Sun className="w-3.5 h-3.5" /> Day Horas
                      </button>
                      <button
                        type="button"
                        onClick={() => setHoraTab("night")}
                        className={`py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                          horaTab === "night"
                            ? "bg-secondary text-secondary-foreground font-bold shadow-sm"
                            : "text-muted-foreground"
                        }`}
                      >
                        <Moon className="w-3.5 h-3.5" /> Night Horas
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* Day Horas */}
                    <div
                      className={`space-y-3 ${
                        horaTab === "day" ? "block" : "hidden md:block"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-heading text-primary font-bold uppercase tracking-wider">
                        <Sun className="w-4 h-4" /> Daytime Planetary Horas (1 to 12)
                      </div>
                      <div className="space-y-1.5">
                        {panchangData.horas_day?.map((h: any, i: number) => {
                          const isActive = isTimeSlotActive(h.start, h.end);
                          return (
                            <div
                              key={i}
                              className={`p-2 sm:p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                                isActive
                                  ? "bg-primary/20 border-primary ring-2 ring-primary/50 shadow-md"
                                  : "bg-card/40 border-border/20"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[9px] sm:text-[10px] font-mono text-muted-foreground w-4 sm:w-5 shrink-0">
                                  #{h.hora_num}
                                </span>
                                <span className="font-heading font-bold text-foreground truncate">
                                  {h.planet} Hora
                                </span>
                                <span className="text-[8px] sm:text-[9px] text-muted-foreground font-serif shrink-0">
                                  ({h.nature})
                                </span>
                                {isActive && (
                                  <span className="text-[7px] font-heading font-extrabold px-1.5 py-0.2 rounded-full bg-primary text-primary-foreground uppercase animate-pulse">
                                    Now
                                  </span>
                                )}
                              </div>
                              <span className="text-muted-foreground font-mono text-[10px] sm:text-[11px] shrink-0">
                                {h.start} - {h.end}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Night Horas */}
                    <div
                      className={`space-y-3 ${
                        horaTab === "night" ? "block" : "hidden md:block"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-heading text-secondary font-bold uppercase tracking-wider">
                        <Moon className="w-4 h-4" /> Nighttime Planetary Horas (13 to 24)
                      </div>
                      <div className="space-y-1.5">
                        {panchangData.horas_night?.map((h: any, i: number) => {
                          const isActive = isTimeSlotActive(h.start, h.end);
                          return (
                            <div
                              key={i}
                              className={`p-2 sm:p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                                isActive
                                  ? "bg-secondary/20 border-secondary ring-2 ring-secondary/50 shadow-md"
                                  : "bg-card/40 border-border/20"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[9px] sm:text-[10px] font-mono text-muted-foreground w-4 sm:w-5 shrink-0">
                                  #{h.hora_num}
                                </span>
                                <span className="font-heading font-bold text-foreground truncate">
                                  {h.planet} Hora
                                </span>
                                <span className="text-[8px] sm:text-[9px] text-muted-foreground font-serif shrink-0">
                                  ({h.nature})
                                </span>
                                {isActive && (
                                  <span className="text-[7px] font-heading font-extrabold px-1.5 py-0.2 rounded-full bg-secondary text-secondary-foreground uppercase animate-pulse">
                                    Now
                                  </span>
                                )}
                              </div>
                              <span className="text-muted-foreground font-mono text-[10px] sm:text-[11px] shrink-0">
                                {h.start} - {h.end}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
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

function parseTimeMins(tStr: string): number {
  if (!tStr) return 0;
  const [h, m] = tStr.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return 0;
  return h * 60 + m;
}
