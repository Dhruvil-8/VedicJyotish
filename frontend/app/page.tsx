"use client";

import React, { useState, useEffect } from "react";
import {
  Search, Sparkles, MessageSquare, Send, Calendar, Clock, MapPin, ChevronRight,
  Moon, Star, Wand2, AlertTriangle, ExternalLink, CheckCircle, XCircle, Info,
  Compass, BookOpen, Heart, ChevronDown, ChevronUp, RefreshCw, FileText, User, Globe, Menu
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  searchCity, calculateChart, chatWithAstrologerStream, generateReportStream,
  calculateCompatibility
} from "./components/ui/api";
import NorthIndianChart from "./components/NorthIndianChart";
import PlanetaryTable from "./components/PlanetaryTable";
import DashaTimeline from "./components/DashaTimeline";
import YogaCards from "./components/YogaCards";
import ReportSection from "./components/ReportSection";

// --- Divisional Varga Chart Explanations ---
const VARGA_INFO: Record<string, { title: string; description: string }> = {
  D1: { title: "D1 Lagna (Birth)", description: "Primary life, self-identity, physique, and general path of life." },
  D2: { title: "D2 Hora (Wealth)", description: "Wealth accumulation, financial resources, values, and family assets." },
  D3: { title: "D3 Drekkana (Siblings)", description: "Siblings, courage, motivation, drive, and initiatives." },
  D4: { title: "D4 Chaturthamsa (Property)", description: "Real estate, houses, fixed assets, and inner contentment." },
  D7: { title: "D7 Saptamsa (Progeny)", description: "Children, lineage, grand-children, and creative fruits." },
  D9: { title: "D9 Navamsa (Destiny)", description: "Inner potential, dharma, marital compatibility, and destiny after age 30." },
  D10: { title: "D10 Dasamsa (Career)", description: "Profession, career path, career success, and public status." },
  D12: { title: "D12 Dwadasamsa (Parents)", description: "Parents, lineage, ancestral karma, and family roots." },
  D16: { title: "D16 Shodasamsa (Luxuries)", description: "Vehicles, luxuries, material comforts, and general happiness." },
  D20: { title: "D20 Vimsamsa (Spirituality)", description: "Meditation, spiritual progress, divine worship, and devotion." },
  D24: { title: "D24 Chaturvimsamsa (Learning)", description: "Higher education, learning, scholarship, and skillsets." },
  D27: { title: "D27 Saptavimsamsa (Stamina)", description: "Physical stamina, mental strength, and inner temperament." },
  D30: { title: "D30 Trimsamsa (Obstacles)", description: "Arishthas, misdeeds, deep-seated weaknesses, and health trials." },
  D40: { title: "D40 Khavedamsa (Fortunes)", description: "Auspicious and inauspicious fruits of past-life deeds." },
  D45: { title: "D45 Akshavedamsa (Character)", description: "Moral integrity, purity of character, and ethical nature." },
  D60: { title: "D60 Shastiamsa (Karma)", description: "Deep-seated past-life karma, soul journey, and spiritual samskaras." },
};

const LANGUAGES = [
  { code: "English", label: "English" },
  { code: "Hindi", label: "हिन्दी (Hindi)" },
  { code: "Gujarati", label: "ગુજરાતી (Gujarati)" },
  { code: "Marathi", label: "मराठी (Marathi)" },
  { code: "Tamil", label: "தமிழ் (Tamil)" },
  { code: "Telugu", label: "తెలుగు (Telugu)" },
  { code: "Bengali", label: "বাংলা (Bengali)" },
  { code: "Kannada", label: "ಕನ್ನಡ (Kannada)" },
];

function convertTo24Hour(timeStr: string): string {
  const clean = timeStr.trim().toLowerCase();
  const isPm = clean.includes("pm");
  const isAm = clean.includes("am");
  let numbersOnly = clean.replace(/[a-z]/g, "").trim();
  numbersOnly = numbersOnly.replace(/[;.,-]/g, ":");
  const parts = numbersOnly.split(":");
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;
  if (isPm && hours < 12) {
    hours += 12;
  } else if (isAm && hours === 12) {
    hours = 0;
  }
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function parseDate(dateStr: string): Date {
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  }
  return new Date(dateStr);
}

function formatDate(dateStr: string): string {
  try {
    const d = parseDate(dateStr);
    return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function isCurrent(startStr: string, endStr: string): boolean {
  const now = new Date();
  return now >= parseDate(startStr) && now <= parseDate(endStr);
}

// --- Persistent Top-Level Accordion Component ---
interface AccordionProps {
  id: string;
  title: string;
  explanation: string;
  icon: any;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const Accordion = ({ id, title, explanation, icon: Icon, isOpen, onToggle, children }: AccordionProps) => {
  return (
    <div id={id} className="glass-parchment rounded-2xl vedic-border shadow-md overflow-hidden mb-5" style={{ overflowAnchor: "none" }}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-primary/5 cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-xl text-primary flex-shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-heading text-xs md:text-sm text-foreground font-bold tracking-wider">{title}</h4>
            <p className="text-[10px] text-muted-foreground font-serif italic mt-0.5">{explanation}</p>
          </div>
        </div>
        <div className="text-muted-foreground flex-shrink-0 ml-3">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="p-6 border-t border-border/20 bg-muted/5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function Home() {
  // Global Navigation & Sidebar
  const [appView, setAppView] = useState<"kundli" | "panchanga">("kundli");
  const [isNavOpen, setIsNavOpen] = useState(false);

  // Panchang Page Form Data
  const [panchangDate, setPanchangDate] = useState("");
  const [panchangTime, setPanchangTime] = useState("12:00");
  const [panchangCityInput, setPanchangCityInput] = useState("");
  const [panchangCityResults, setPanchangCityResults] = useState<any[]>([]);
  const [selectedPanchangCity, setSelectedPanchangCity] = useState<any>(null);
  const [panchangData, setPanchangData] = useState<any>(null);
  const [panchangLoading, setPanchangLoading] = useState(false);

  // Auto-initialize Today's Panchanga details on mount
  useEffect(() => {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');

    const formattedDate = `${d}/${m}/${y}`;
    const formattedTime = `${hh}:${mm}`;

    setPanchangDate(formattedDate);
    setPanchangTime(formattedTime);

    // Default reference city (New Delhi)
    const defaultCity = {
      name: "New Delhi, Delhi, India",
      lat: 28.6139,
      lon: 77.209,
      timezone: 5.5
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
          timezone: defaultCity.timezone
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

  // Debounced City Search for Panchanga page
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (panchangCityInput.length >= 3 && (!selectedPanchangCity || panchangCityInput !== selectedPanchangCity.name)) {
        const results = await searchCity(panchangCityInput);
        setPanchangCityResults(results);
      } else {
        setPanchangCityResults([]);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [panchangCityInput, selectedPanchangCity]);

  // --- States ---
  const [step, setStep] = useState<"form" | "dashboard">("form");
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English");

  // Form Data (Single Profile)
  const [date, setDate] = useState("14/12/2023");
  const [time, setTime] = useState("10:30");
  const [cityInput, setCityInput] = useState("");
  const [cityResults, setCityResults] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState<any>(null);

  // Chart & Report Data
  const [chartData, setChartData] = useState<any>(null);
  const [aiReport, setAiReport] = useState<string>("");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // Dashboard Tabs & Accordions
  const [activeTab, setActiveTab] = useState<"chart" | "chat" | "report" | "matching">("chart");
  const [selectedVarga, setSelectedVarga] = useState<string>("D1");
  const [expandedAccordions, setExpandedAccordions] = useState<Record<string, boolean>>({
    panchanga: true,
    planets: true,
    dasha: false,
  });

  const toggleAccordion = (id: string) => {
    setExpandedAccordions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Chat Data
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [userQuestion, setUserQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Disclaimer popup
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  // Compatibility (Matching) States
  const [matchingBoyDate, setMatchingBoyDate] = useState("14/12/2023");
  const [matchingBoyTime, setMatchingBoyTime] = useState("10:30");
  const [matchingBoyCityInput, setMatchingBoyCityInput] = useState("");
  const [matchingBoyCityResults, setMatchingBoyCityResults] = useState<any[]>([]);
  const [matchingBoySelectedCity, setMatchingBoySelectedCity] = useState<any>(null);

  const [matchingGirlDate, setMatchingGirlDate] = useState("14/12/2023");
  const [matchingGirlTime, setMatchingGirlTime] = useState("10:30");
  const [matchingGirlCityInput, setMatchingGirlCityInput] = useState("");
  const [matchingGirlCityResults, setMatchingGirlCityResults] = useState<any[]>([]);
  const [matchingGirlSelectedCity, setMatchingGirlSelectedCity] = useState<any>(null);

  const [matchingMethod, setMatchingMethod] = useState<string>("North");
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [matchingResult, setMatchingResult] = useState<any>(null);

  const MAX_QUESTIONS = 3;
  const userQuestionCount = chatHistory.filter((m) => m.role === "user").length;
  const chatLimitReached = userQuestionCount >= MAX_QUESTIONS;

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" | "info" } | null>(null);
  const showToast = (message: string, type: "error" | "success" | "info" = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // --- Handlers ---

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  // Auto-complete: Single Profile
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (cityInput.length >= 3 && !selectedCity) {
        const results = await searchCity(cityInput);
        setCityResults(results);
      } else {
        setCityResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [cityInput, selectedCity]);

  // Auto-complete: Matching Boy
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (matchingBoyCityInput.length >= 3 && !matchingBoySelectedCity) {
        const results = await searchCity(matchingBoyCityInput);
        setMatchingBoyCityResults(results);
      } else {
        setMatchingBoyCityResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [matchingBoyCityInput, matchingBoySelectedCity]);

  // Auto-complete: Matching Girl
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (matchingGirlCityInput.length >= 3 && !matchingGirlSelectedCity) {
        const results = await searchCity(matchingGirlCityInput);
        setMatchingGirlCityResults(results);
      } else {
        setMatchingGirlCityResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [matchingGirlCityInput, matchingGirlSelectedCity]);

  const selectCity = (city: any) => {
    setSelectedCity(city);
    setCityInput(city.name);
    setCityResults([]);
  };

  const handleCalculate = async () => {
    if (!selectedCity) return showToast("Please select a city from the dropdown list.", "info");
    if (!date) return showToast("Please enter a valid birth date (DD/MM/YYYY).", "info");
    if (!time) return showToast("Please enter a valid birth time (HH:MM).", "info");
    setLoading(true);
    try {
      const payload = {
        date,
        time: convertTo24Hour(time),
        city: selectedCity.name,
        lat: selectedCity.lat,
        lon: selectedCity.lon,
      };
      const data = await calculateChart(payload);
      setChartData(data);
      setStep("dashboard");
      setActiveTab("chart");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      let msg = "Error calculating chart. Please check your inputs and try again.";
      try {
        const body = await e?.response?.json?.();
        if (body?.detail) {
          const detail = Array.isArray(body.detail) ? body.detail[0]?.msg : body.detail;
          if (detail) msg = detail.replace(/^Value error, /i, "");
        }
      } catch { }
      showToast(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!chartData || reportLoading) return;
    setReportLoading(true);
    setAiReport("");
    try {
      await generateReportStream(
        { ...chartData, language: selectedLanguage },
        (chunk) => setAiReport((prev) => prev + chunk),
        () => setReportLoading(false),
        (err) => {
          showToast(err || "Celestial alignment failed. Please try again.");
          setReportLoading(false);
        }
      );
    } catch (e) {
      showToast("Celestial alignment failed. Please try again.");
      setReportLoading(false);
    }
  };

  const handleChat = async () => {
    if (!userQuestion.trim() || chatLimitReached) return;
    const newMsg = { role: "user", text: userQuestion };
    const updatedHistory = [...chatHistory, newMsg];

    setChatHistory(updatedHistory);
    setUserQuestion("");
    setChatLoading(true);

    const streamingMsg = { role: "model", text: "" };
    const historyWithPlaceholder = [...updatedHistory, streamingMsg];
    setChatHistory(historyWithPlaceholder);

    try {
      let accumulated = "";
      await chatWithAstrologerStream(
        {
          chart_data: { ...chartData, language: selectedLanguage },
          question: newMsg.text,
          history: updatedHistory,
        },
        (chunk) => {
          accumulated += chunk;
          setChatHistory([...updatedHistory, { role: "model", text: accumulated }]);
        },
        () => setChatLoading(false),
        (err) => {
          setChatHistory([...updatedHistory, { role: "model", text: err || "Error connecting to the stars." }]);
          setChatLoading(false);
        }
      );
    } catch (e) {
      setChatHistory([...updatedHistory, { role: "model", text: "Error connecting to the stars." }]);
      setChatLoading(false);
    }
  };

  // --- Quick Active Profile Loader for Matching ---
  const loadActiveProfile = (type: "boy" | "girl") => {
    if (!selectedCity) {
      return showToast("No active birth profile loaded. Please enter single horoscope details first.", "info");
    }
    if (type === "boy") {
      setMatchingBoyDate(date);
      setMatchingBoyTime(time);
      setMatchingBoySelectedCity(selectedCity);
      setMatchingBoyCityInput(selectedCity.name);
    } else {
      setMatchingGirlDate(date);
      setMatchingGirlTime(time);
      setMatchingGirlSelectedCity(selectedCity);
      setMatchingGirlCityInput(selectedCity.name);
    }
    showToast(`Loaded active profile into ${type === "boy" ? "Boy's" : "Girl's"} details.`, "success");
  };

  // --- Calculate Compatibility ---
  const handleCalculateCompatibility = async () => {
    if (!matchingBoySelectedCity) return showToast("Please select Boy's birth place from the dropdown.", "info");
    if (!matchingGirlSelectedCity) return showToast("Please select Girl's birth place from the dropdown.", "info");
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
      } catch { }
      showToast(msg);
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleCalculatePanchang = async () => {
    if (!panchangDate) return showToast("Please enter a valid date (DD/MM/YYYY).", "info");
    if (!panchangTime) return showToast("Please enter a valid time (HH:MM).", "info");
    if (!selectedPanchangCity) return showToast("Please select a location from the search suggestions.", "info");

    setPanchangLoading(true);
    try {
      const payload = {
        date: panchangDate,
        time: panchangTime,
        city: selectedPanchangCity.name,
        lat: selectedPanchangCity.lat,
        lon: selectedPanchangCity.lon,
        timezone: selectedPanchangCity.timezone
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
      } catch { }
      showToast(msg);
    } finally {
      setPanchangLoading(false);
    }
  };

  // Extract Planetary Strengths (Dig Bala) from house planets
  const digBalaPlanets: any[] = [];
  if (chartData && chartData.chart_data) {
    Object.values(chartData.chart_data).forEach((house: any) => {
      (house.planets || []).forEach((planet: any) => {
        if (planet.dig_bala_points !== undefined && planet.dig_bala_points !== null) {
          digBalaPlanets.push(planet);
        }
      });
    });
    digBalaPlanets.sort((a, b) => (b.dig_bala_percentage || 0) - (a.dig_bala_percentage || 0));
  }

  return (
    <main className="min-h-screen selection:bg-primary/30 selection:text-primary pb-20">

      {/* Sidebar Drawer Hamburger Trigger */}
      <div className="fixed top-4 left-4 z-40">
        <button
          onClick={() => setIsNavOpen(true)}
          className="p-3 rounded-full bg-background/80 backdrop-blur-md border border-primary/20 shadow-md text-primary hover:bg-primary/10 transition-all flex items-center justify-center cursor-pointer"
          title="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Sidebar Navigation Drawer */}
      <AnimatePresence>
        {isNavOpen && (
          <>
            {/* Drawer Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNavOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />

            {/* Sliding Sidebar Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-72 z-50 glass-parchment shadow-2xl border-r border-primary/20 p-6 flex flex-col justify-between"
            >
              <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-primary/10 pb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary gold-glow" />
                    <span className="font-heading text-base font-bold text-primary">Vedic Jyotish Portal</span>
                  </div>
                  <button
                    onClick={() => setIsNavOpen(false)}
                    className="text-muted-foreground hover:text-foreground text-xl leading-none cursor-pointer p-1"
                  >
                    &times;
                  </button>
                </div>

                {/* Navigation Items */}
                <nav className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setAppView("kundli");
                      setIsNavOpen(false);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left font-heading text-sm transition-all cursor-pointer ${appView === "kundli"
                        ? "bg-primary/15 border-primary/30 text-primary font-bold shadow-sm"
                        : "bg-transparent border-transparent text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                      }`}
                  >
                    <User className="w-4 h-4" /> Birth Chart & Kundali
                  </button>

                  <button
                    onClick={() => {
                      setAppView("panchanga");
                      setIsNavOpen(false);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left font-heading text-sm transition-all cursor-pointer ${appView === "panchanga"
                        ? "bg-primary/15 border-primary/30 text-primary font-bold shadow-sm"
                        : "bg-transparent border-transparent text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                      }`}
                  >
                    <Clock className="w-4 h-4" /> Daily Vedic Panchang
                  </button>
                </nav>
              </div>

              {/* Footer details */}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-start gap-3 px-5 py-4 rounded-2xl shadow-xl max-w-sm w-[90vw] backdrop-blur-md border ${toast.type === "error"
              ? "bg-red-50/90 border-red-200 text-red-800"
              : toast.type === "success"
                ? "bg-emerald-50/90 border-emerald-200 text-emerald-800"
                : "bg-amber-50/90 border-amber-200 text-amber-800"
              }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === "error" && <XCircle className="w-5 h-5 text-red-500" />}
              {toast.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-500" />}
              {toast.type === "info" && <Info className="w-5 h-5 text-amber-500" />}
            </div>
            <p className="font-serif text-sm leading-relaxed">{toast.message}</p>
            <button onClick={() => setToast(null)} className="ml-auto flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity text-lg leading-none cursor-pointer">&times;</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disclaimer Modal */}
      <AnimatePresence>
        {showDisclaimer && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-parchment rounded-2xl vedic-border shadow-2xl max-w-lg w-full p-8 md:p-10 relative overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                </div>
                <h2 className="text-xl font-heading text-primary">Important Disclaimer</h2>
              </div>

              <div className="space-y-6 font-serif text-sm text-foreground/80 leading-relaxed">
                <p className="text-muted-foreground">
                  Welcome to Vedic Jyotish. Please read our quick notice before calculating your chart:
                </p>

                <div className="space-y-3">
                  <div className="flex gap-3">
                    <span className="text-amber-500 text-base mt-0.5">✦</span>
                    <p>
                      <strong>AI Beta Tool:</strong> Interpretations are generated by AI for <strong>educational and informational use only</strong>, not critical life decisions. Currently, this tool is in the development and testing phase.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-amber-500 text-base mt-0.5">✦</span>
                    <p>
                      <strong>Gemini Processing:</strong> Computed chart parameters are sent to Google Gemini (Free Tier) to write your readings.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground pt-1 border-t border-amber-900/10">
                  For deeper study, see our{" "}
                  <a
                    href="https://github.com/Dhruvil-8/VedicJyotish/blob/main/ADDITIONAL_ASTROLOGY_RESOURCES.md.md"
                    target="_blank" rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary/80"
                  >
                    free detailed analysis guide
                  </a>.
                </p>

                <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground flex-wrap">
                  <span>Open Source:</span>
                  <a
                    href="https://github.com/Dhruvil-8/VedicJyotish"
                    target="_blank" rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary/80 inline-flex items-center gap-0.5"
                  >
                    GitHub <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="mx-1 opacity-40">•</span>
                  <a
                    href="/privacy"
                    target="_blank" rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary/80 inline-flex items-center gap-0.5"
                  >
                    Privacy Policy <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <button
                onClick={() => setShowDisclaimer(false)}
                className="mt-8 w-full py-3 bg-primary text-primary-foreground font-heading rounded-full shadow-lg hover:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                I Understand — Agree & Proceed
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">

        {/* Header */}
        <header className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block"
          >
            <h1 className="text-4xl md:text-6xl font-heading gold-glow mb-2">
              Vedic Jyotish
            </h1>
            <div className="flex items-center justify-center gap-4 text-secondary/80 font-serif tracking-[0.2em] uppercase text-xs md:text-sm">
              <span className="h-px w-8 bg-secondary/30" />
              ॥ ॐ गं गणपतये नमः ॥
              <span className="h-px w-8 bg-secondary/30" />
            </div>
          </motion.div>
        </header>

        <AnimatePresence mode="wait">
          {appView === "panchanga" ? (
            <motion.div
              key="panchanga"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-8"
            >
              {/* Custom Panchanga page selector form */}
              <div className="glass-parchment p-8 rounded-2xl vedic-border shadow-2xl relative max-w-xl mx-auto group">
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-heading text-primary">Daily Vedic Panchang</h2>
                    <p className="text-[11px] text-muted-foreground font-serif mt-1">Calculate the five vital cosmic limbs of time for any date and location.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Date */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs font-heading text-secondary tracking-widest uppercase">
                        <Calendar className="w-3.5 h-3.5" /> Date (DD/MM/YYYY)
                      </label>
                      <div className="relative">
                        <input
                          type="text" value={panchangDate} onChange={(e) => setPanchangDate(e.target.value)}
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
                          type="text" value={panchangTime} onChange={(e) => setPanchangTime(e.target.value)}
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
                        type="text" value={panchangCityInput}
                        onChange={(e) => { setPanchangCityInput(e.target.value); setSelectedPanchangCity(null); }}
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
                    onClick={handleCalculatePanchang}
                    disabled={panchangLoading}
                    className="w-full py-3 bg-primary text-primary-foreground font-heading rounded-full shadow-lg hover:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 text-sm"
                  >
                    {panchangLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Calculating Celestial Alignment...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" /> Calculate Daily Panchang
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Panchanga calculations outputs */}
              {panchangData && (
                <div className="glass-parchment p-8 rounded-2xl vedic-border shadow-xl space-y-6 max-w-4xl mx-auto">
                  <div className="text-center border-b border-primary/10 pb-4">
                    <h3 className="text-xl font-heading text-secondary gold-glow">Daily Panchang Elements</h3>
                    <p className="text-xs text-muted-foreground font-serif mt-1">
                      Computed for {selectedPanchangCity?.name || "Selected Location"} on {panchangDate} at {panchangTime}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {[
                      { label: "Vara (Day Lord)", val: panchangData.vara, icon: "✦", lord: panchangData.vara_lord, desc: "The solar weekday lord indicating natural planetary vitality of the day." },
                      { label: "Tithi (Lunar Day)", val: panchangData.tithi.name, pct: panchangData.tithi.progress, lord: panchangData.tithi_lord, desc: `Lunar day segment indicating emotional harmony. Fortnight: ${panchangData.paksha} Paksha.` },
                      { label: "Nakshatra (Moon Star)", val: panchangData.nakshatra.name, pct: panchangData.nakshatra.progress, lord: panchangData.nakshatra_lord, desc: "Lunar mansion governing the mind, emotional patterns, and active daily star energy." },
                      { label: "Yoga (Combined Angle)", val: panchangData.yoga.name, pct: panchangData.yoga.progress, lord: panchangData.yoga_lord, desc: "Combined solar-lunar angular alignment governing relationship and action currents." },
                      { label: "Karana (Half-Tithi)", val: panchangData.karana.name, pct: panchangData.karana.progress, lord: panchangData.karana_lord, desc: "Half-tithi interval governing career, daily execution capacity, and physical work." },
                    ].map((item, idx) => (
                      <div key={idx} className="bg-card/40 p-4 rounded-xl border border-border/20 flex flex-col justify-between hover:border-primary/20 transition-all text-left">
                        <div>
                          <div className="text-[9px] text-muted-foreground font-heading uppercase tracking-widest">{item.label}</div>
                          <div className="font-heading text-sm text-primary mt-1 font-bold">{item.val}</div>
                          {item.lord && (
                            <div className="text-[8px] font-heading text-secondary uppercase tracking-widest mt-1">Lord: <span className="font-bold">{item.lord}</span></div>
                          )}
                          <p className="text-[9px] text-muted-foreground font-serif leading-normal mt-2">{item.desc}</p>
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

                  {/* Astro & Celestial Details block for Professional layout */}
                  <div className="space-y-6 pt-4 border-t border-primary/10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Solar & Lunar Transitions */}
                      <div className="bg-card/30 p-5 rounded-2xl border border-border/20 text-left space-y-4">
                        <h4 className="font-heading text-xs uppercase tracking-widest text-secondary border-b border-border/10 pb-2 flex items-center gap-2">
                          <span></span> Solar & Lunar Transitions
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <span className="text-[9px] text-muted-foreground font-heading uppercase tracking-wider">Sun Zodiac Sign</span>
                            <div className="font-heading text-sm text-primary font-bold">{panchangData.sun_sign || "Taurus"}</div>
                            <span className="text-[8px] text-muted-foreground font-serif italic">Governs outer soul purpose</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] text-muted-foreground font-heading uppercase tracking-wider">Moon Zodiac Sign</span>
                            <div className="font-heading text-sm text-primary font-bold">{panchangData.moon_sign || "Cancer"}</div>
                            <span className="text-[8px] text-muted-foreground font-serif italic">Governs mind & emotions</span>
                          </div>
                        </div>
                      </div>

                      {/* Sunrise & Sunset transitions */}
                      <div className="bg-card/30 p-5 rounded-2xl border border-border/20 text-left space-y-4">
                        <h4 className="font-heading text-xs uppercase tracking-widest text-secondary border-b border-border/10 pb-2 flex items-center gap-2">
                          Surya Udaya & Asta
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <span className="text-[9px] text-muted-foreground font-heading uppercase tracking-wider">Sunrise (Udaya)</span>
                            <div className="font-heading text-sm text-primary font-bold">{panchangData.sunrise || "05:45"}</div>
                            <span className="text-[8px] text-muted-foreground font-serif italic">Sun rises on horizon</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] text-muted-foreground font-heading uppercase tracking-wider">Sunset (Asta)</span>
                            <div className="font-heading text-sm text-primary font-bold">{panchangData.sunset || "18:42"}</div>
                            <span className="text-[8px] text-muted-foreground font-serif italic">Sun sets below horizon</span>
                          </div>
                        </div>
                      </div>

                      {/* Calculation Standards */}
                      <div className="bg-card/30 p-5 rounded-2xl border border-border/20 text-left space-y-4">
                        <h4 className="font-heading text-xs uppercase tracking-widest text-secondary border-b border-border/10 pb-2 flex items-center gap-2">
                          <span></span> Sidereal Calculation Standards
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <span className="text-[9px] text-muted-foreground font-heading uppercase tracking-wider">Ayanamsha System</span>
                            <div className="font-heading text-sm text-primary font-bold">Chitra Paksha / Lahiri</div>
                            <span className="text-[8px] text-muted-foreground font-serif italic">Classic Vedic standard</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] text-muted-foreground font-heading uppercase tracking-wider">Exact Ayanamsha</span>
                            <div className="font-heading text-sm text-primary font-bold">
                              {panchangData.ayanamsha ? `${panchangData.ayanamsha.toFixed(4)}°` : "24.1356°"}
                            </div>
                            <span className="text-[8px] text-muted-foreground font-serif italic">Precision degree offset</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Rahu Kalam */}
                      <div className="bg-rose-500/5 p-5 rounded-2xl border border-rose-500/10 text-left space-y-4 relative group hover:border-rose-500/20 transition-all">
                        <h4 className="font-heading text-xs uppercase tracking-widest text-rose-600 border-b border-rose-500/10 pb-2 flex items-center gap-2">
                          Rahu Kaal (Inauspicious)
                        </h4>
                        <div className="space-y-1">
                          <span className="text-[9px] text-muted-foreground font-heading uppercase tracking-wider">Avoid starting new work</span>
                          <div className="font-heading text-lg text-rose-700 font-bold">{panchangData.rahu_kaal || "15:00 - 16:30"}</div>
                          <span className="text-[8px] text-rose-500/80 font-serif italic">Avoid major decisions/ventures</span>
                        </div>
                      </div>

                      {/* Abhijit Muhurat */}
                      <div className="bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/10 text-left space-y-4 relative group hover:border-emerald-500/20 transition-all">
                        <h4 className="font-heading text-xs uppercase tracking-widest text-emerald-600 border-b border-emerald-500/10 pb-2 flex items-center gap-2">
                          Abhijit Muhurat (Auspicious)
                        </h4>
                        <div className="space-y-1">
                          <span className="text-[9px] text-muted-foreground font-heading uppercase tracking-wider">Highly auspicious midday slot</span>
                          <div className="font-heading text-lg text-emerald-700 font-bold">{panchangData.abhijit_muhurat || "11:45 - 12:33"}</div>
                          <span className="text-[8px] text-emerald-500/80 font-serif italic">Highly recommended for all actions</span>
                        </div>
                      </div>

                      {/* Gulika & Yamaganda */}
                      <div className="bg-amber-500/5 p-5 rounded-2xl border border-amber-500/10 text-left space-y-4 relative group hover:border-amber-500/20 transition-all">
                        <h4 className="font-heading text-xs uppercase tracking-widest text-amber-600 border-b border-amber-500/10 pb-2 flex items-center gap-2">
                          Gulika & Yamaganda
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <span className="text-[9px] text-muted-foreground font-heading uppercase tracking-wider">Gulika Kalam</span>
                            <div className="font-heading text-xs text-amber-700 font-bold">{panchangData.gulika_kaal || "12:00 - 13:30"}</div>
                            <span className="text-[7px] text-muted-foreground font-serif italic">Good for long-term</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] text-muted-foreground font-heading uppercase tracking-wider">Yamaganda</span>
                            <div className="font-heading text-xs text-amber-700 font-bold">{panchangData.yama_ganda || "07:30 - 09:00"}</div>
                            <span className="text-[7px] text-muted-foreground font-serif italic">Avoid starting new</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* New Advanced Muhurtas Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                      {/* Brahma Muhurta */}
                      <div className="bg-violet-500/5 p-5 rounded-2xl border border-violet-500/10 text-left space-y-4 relative group hover:border-violet-500/20 transition-all">
                        <h4 className="font-heading text-xs uppercase tracking-widest text-violet-600 border-b border-violet-500/10 pb-2 flex items-center gap-2">
                          Brahma Muhurta
                        </h4>
                        <div className="space-y-1">
                          <span className="text-[9px] text-muted-foreground font-heading uppercase tracking-wider">Sacred pre-dawn meditation hour</span>
                          <div className="font-heading text-lg text-violet-700 font-bold">{panchangData.brahma_muhurta || "04:30 - 05:18"}</div>
                          <span className="text-[8px] text-violet-500/80 font-serif italic">Best for prayers, meditation & study</span>
                        </div>
                      </div>

                      {/* Vijaya Muhurta */}
                      <div className="bg-sky-500/5 p-5 rounded-2xl border border-sky-500/10 text-left space-y-4 relative group hover:border-sky-500/20 transition-all">
                        <h4 className="font-heading text-xs uppercase tracking-widest text-sky-600 border-b border-sky-500/10 pb-2 flex items-center gap-2">
                          Vijaya Muhurta (Victory)
                        </h4>
                        <div className="space-y-1">
                          <span className="text-[9px] text-muted-foreground font-heading uppercase tracking-wider">11th Muhurta — ensures success</span>
                          <div className="font-heading text-lg text-sky-700 font-bold">{panchangData.vijaya_muhurta || "14:24 - 15:12"}</div>
                          <span className="text-[8px] text-sky-500/80 font-serif italic">Ideal for legal, court & conquest matters</span>
                        </div>
                      </div>

                      {/* Pradosh Kaal */}
                      <div className="bg-indigo-500/5 p-5 rounded-2xl border border-indigo-500/10 text-left space-y-4 relative group hover:border-indigo-500/20 transition-all">
                        <h4 className="font-heading text-xs uppercase tracking-widest text-indigo-600 border-b border-indigo-500/10 pb-2 flex items-center gap-2">
                          Pradosh Kaal
                        </h4>
                        <div className="space-y-1">
                          <span className="text-[9px] text-muted-foreground font-heading uppercase tracking-wider">Twilight period after sunset</span>
                          <div className="font-heading text-lg text-indigo-700 font-bold">{panchangData.pradosh_kaal || "18:42 - 20:18"}</div>
                          <span className="text-[8px] text-indigo-500/80 font-serif italic">Sacred Shiva Puja window on Trayodashi</span>
                        </div>
                      </div>
                    </div>

                    {/* Dur Muhurtham */}
                    {panchangData.dur_muhurtham && panchangData.dur_muhurtham.length > 0 && (
                      <div className="bg-red-500/5 p-5 rounded-2xl border border-red-500/10 text-left space-y-4 relative group hover:border-red-500/20 transition-all mt-6">
                        <h4 className="font-heading text-xs uppercase tracking-widest text-red-600 border-b border-red-500/10 pb-2 flex items-center gap-2">
                          Dur Muhurtham (Inauspicious Periods)
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {panchangData.dur_muhurtham.map((slot: string, i: number) => (
                            <div key={i} className="space-y-1">
                              <span className="text-[9px] text-muted-foreground font-heading uppercase tracking-wider">Dur Muhurtham {i + 1}</span>
                              <div className="font-heading text-sm text-red-700 font-bold">{slot}</div>
                              <span className="text-[7px] text-red-500/80 font-serif italic">Avoid auspicious ceremonies</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Choghadiya Muhurat Table block — Daytime */}
                    {panchangData.choghadiya && (
                      <div className="bg-card/25 p-6 rounded-2xl border border-border/20 text-left space-y-4 pt-4 mt-6">
                        <div className="border-b border-primary/10 pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <h4 className="font-heading text-xs uppercase tracking-widest text-secondary flex items-center gap-2">
                            Choghadiya Muhurats (Daytime)
                          </h4>
                          <span className="text-[8px] text-muted-foreground font-serif italic">Sunrise to Sunset — 8 slots</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                          {panchangData.choghadiya.map((slot: any, i: number) => {
                            const isAuspicious = slot.nature === "Auspicious";
                            return (
                              <div
                                key={i}
                                className={`p-3 rounded-xl border transition-all flex flex-col justify-between text-center ${isAuspicious
                                    ? "bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/20"
                                    : "bg-rose-500/5 border-rose-500/10 hover:border-rose-500/20"
                                  }`}
                              >
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-[8px] text-muted-foreground font-heading uppercase tracking-wider">Slot {i + 1}</span>
                                  <span
                                    className={`text-[6px] font-heading uppercase tracking-widest px-1.5 py-0.5 rounded-full font-bold ${isAuspicious
                                        ? "bg-emerald-500/10 text-emerald-600"
                                        : "bg-rose-500/10 text-rose-600"
                                      }`}
                                  >
                                    {slot.nature}
                                  </span>
                                </div>
                                <div className="my-2">
                                  <div
                                    className={`font-heading text-sm font-bold ${isAuspicious ? "text-emerald-700" : "text-rose-700"
                                      }`}
                                  >
                                    {slot.name}
                                  </div>
                                </div>
                                <div className="text-[8px] text-muted-foreground font-serif leading-none mt-1">{slot.start}<br />to<br />{slot.end}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Choghadiya Muhurat Table block — Nighttime */}
                    {panchangData.choghadiya_night && (
                      <div className="bg-card/25 p-6 rounded-2xl border border-border/20 text-left space-y-4 pt-4 mt-4">
                        <div className="border-b border-primary/10 pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <h4 className="font-heading text-xs uppercase tracking-widest text-secondary flex items-center gap-2">
                            Choghadiya Muhurats (Nighttime)
                          </h4>
                          <span className="text-[8px] text-muted-foreground font-serif italic">Sunset to next Sunrise — 8 slots</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                          {panchangData.choghadiya_night.map((slot: any, i: number) => {
                            const isAuspicious = slot.nature === "Auspicious";
                            return (
                              <div
                                key={i}
                                className={`p-3 rounded-xl border transition-all flex flex-col justify-between text-center ${isAuspicious
                                    ? "bg-teal-500/5 border-teal-500/10 hover:border-teal-500/20"
                                    : "bg-purple-500/5 border-purple-500/10 hover:border-purple-500/20"
                                  }`}
                              >
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-[8px] text-muted-foreground font-heading uppercase tracking-wider">Slot {i + 1}</span>
                                  <span
                                    className={`text-[6px] font-heading uppercase tracking-widest px-1.5 py-0.5 rounded-full font-bold ${isAuspicious
                                        ? "bg-teal-500/10 text-teal-600"
                                        : "bg-purple-500/10 text-purple-600"
                                      }`}
                                  >
                                    {slot.nature}
                                  </span>
                                </div>
                                <div className="my-2">
                                  <div
                                    className={`font-heading text-sm font-bold ${isAuspicious ? "text-teal-700" : "text-purple-700"
                                      }`}
                                  >
                                    {slot.name}
                                  </div>
                                </div>
                                <div className="text-[8px] text-muted-foreground font-serif leading-none mt-1">{slot.start}<br />to<br />{slot.end}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Planetary Horas — Daytime */}
                    {panchangData.horas_day && (
                      <div className="bg-card/25 p-6 rounded-2xl border border-border/20 text-left space-y-4 pt-4 mt-6">
                        <div className="border-b border-primary/10 pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <h4 className="font-heading text-xs uppercase tracking-widest text-secondary flex items-center gap-2">
                            Planetary Horas (Daytime)
                          </h4>
                          <span className="text-[8px] text-muted-foreground font-serif italic">12 planetary hours from sunrise</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                          {panchangData.horas_day.map((hora: any, i: number) => {
                            const colorMap: Record<string, string> = {
                              "Highly Auspicious": "bg-emerald-500/8 border-emerald-500/15 text-emerald-700",
                              "Auspicious": "bg-teal-500/8 border-teal-500/15 text-teal-700",
                              "Neutral": "bg-amber-500/8 border-amber-500/15 text-amber-700",
                              "Inauspicious": "bg-rose-500/8 border-rose-500/15 text-rose-700",
                            };
                            const cls = colorMap[hora.nature] || colorMap["Neutral"];
                            return (
                              <div key={i} className={`p-3 rounded-xl border transition-all text-center ${cls}`}>
                                <div className="text-[8px] text-muted-foreground font-heading uppercase tracking-wider">Hora {hora.hora_num}</div>
                                <div className="font-heading text-sm font-bold mt-2">{hora.planet}</div>
                                <div className="text-[7px] text-muted-foreground font-serif mt-1">{hora.start} – {hora.end}</div>
                                <span className={`text-[6px] font-heading uppercase tracking-widest px-1.5 py-0.5 rounded-full font-bold mt-1 inline-block ${hora.nature === "Highly Auspicious" ? "bg-emerald-500/10 text-emerald-600" :
                                    hora.nature === "Auspicious" ? "bg-teal-500/10 text-teal-600" :
                                      hora.nature === "Neutral" ? "bg-amber-500/10 text-amber-600" :
                                        "bg-rose-500/10 text-rose-600"
                                  }`}>{hora.nature}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Planetary Horas — Nighttime */}
                    {panchangData.horas_night && (
                      <div className="bg-card/25 p-6 rounded-2xl border border-border/20 text-left space-y-4 pt-4 mt-4">
                        <div className="border-b border-primary/10 pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <h4 className="font-heading text-xs uppercase tracking-widest text-secondary flex items-center gap-2">
                            Planetary Horas (Nighttime)
                          </h4>
                          <span className="text-[8px] text-muted-foreground font-serif italic">12 planetary hours from sunset</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                          {panchangData.horas_night.map((hora: any, i: number) => {
                            const colorMap: Record<string, string> = {
                              "Highly Auspicious": "bg-emerald-500/8 border-emerald-500/15 text-emerald-700",
                              "Auspicious": "bg-teal-500/8 border-teal-500/15 text-teal-700",
                              "Neutral": "bg-amber-500/8 border-amber-500/15 text-amber-700",
                              "Inauspicious": "bg-purple-500/8 border-purple-500/15 text-purple-700",
                            };
                            const cls = colorMap[hora.nature] || colorMap["Neutral"];
                            return (
                              <div key={i} className={`p-3 rounded-xl border transition-all text-center ${cls}`}>
                                <div className="text-[8px] text-muted-foreground font-heading uppercase tracking-wider">Hora {hora.hora_num}</div>
                                <div className="font-heading text-sm font-bold mt-2">{hora.planet}</div>
                                <div className="text-[7px] text-muted-foreground font-serif mt-1">{hora.start} – {hora.end}</div>
                                <span className={`text-[6px] font-heading uppercase tracking-widest px-1.5 py-0.5 rounded-full font-bold mt-1 inline-block ${hora.nature === "Highly Auspicious" ? "bg-emerald-500/10 text-emerald-600" :
                                    hora.nature === "Auspicious" ? "bg-teal-500/10 text-teal-600" :
                                      hora.nature === "Neutral" ? "bg-amber-500/10 text-amber-600" :
                                        "bg-purple-500/10 text-purple-600"
                                  }`}>{hora.nature}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Related Sites Section */}
              <div className="max-w-4xl mx-auto mt-12 pt-8 border-t border-primary/10 text-center space-y-6">
                <div className="flex items-center justify-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary gold-glow" />
                  <h3 className="font-heading text-lg font-bold text-primary tracking-wider">Our Related Sites</h3>
                </div>
                <p className="text-xs text-muted-foreground font-serif max-w-md mx-auto">
                  Explore our other platforms dedicated to Sanatan Dharma scriptures, wisdom, and directory services.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  <a
                    href="https://srimad-bhgavad-gita.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 rounded-xl border border-primary/10 bg-primary/5 hover:bg-primary/10 hover:border-primary/20 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:scale-110 transition-transform">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-heading text-sm font-bold text-foreground">Srimad Bhagavad Gita</h4>
                        <p className="text-[10px] text-muted-foreground font-serif mt-0.5">Read and contemplate the divine dialogue</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>

                  <a
                    href="https://dhruvil-8.github.io/SanatanDharmaDirectory/site/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 rounded-xl border border-primary/10 bg-primary/5 hover:bg-primary/10 hover:border-primary/20 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:scale-110 transition-transform">
                        <Compass className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-heading text-sm font-bold text-foreground">Sanatan Dharma Directory</h4>
                        <p className="text-[10px] text-muted-foreground font-serif mt-0.5">Comprehensive spiritual resource directory</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>
                </div>
              </div>
            </motion.div>
          ) : step === "form" ? (
            <motion.div
              key="form"
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
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs font-heading text-secondary tracking-widest uppercase">
                        <Calendar className="w-3.5 h-3.5" /> Date (DD/MM/YYYY)
                      </label>
                      <div className="relative">
                        <input
                          type="text" value={date} onChange={(e) => setDate(e.target.value)}
                          placeholder="DD/MM/YYYY"
                          className="w-full bg-muted/30 border border-border/50 rounded-lg p-3 pr-10 font-serif focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all"
                        />
                        <input
                          type="date"
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-0 cursor-pointer z-10"
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                              const [y, m, d] = val.split("-");
                              if (y && m && d) setDate(`${d}/${m}/${y}`);
                            }
                          }}
                        />
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs font-heading text-secondary tracking-widest uppercase">
                        <Clock className="w-3.5 h-3.5" /> Time (HH:MM, 24h)
                      </label>
                      <div className="relative">
                        <input
                          type="text" value={time} onChange={(e) => setTime(e.target.value)}
                          placeholder="HH:MM"
                          className="w-full bg-muted/30 border border-border/50 rounded-lg p-3 pr-10 font-serif focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all"
                        />
                        <input
                          type="time"
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-0 cursor-pointer z-10"
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) setTime(val);
                          }}
                        />
                        <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 relative">
                    <label className="flex items-center gap-2 text-xs font-heading text-secondary tracking-widest uppercase">
                      <MapPin className="w-3.5 h-3.5" /> Birth Place
                    </label>
                    <div className="relative">
                      <input
                        type="text" value={cityInput}
                        onChange={(e) => { setCityInput(e.target.value); setSelectedCity(null); }}
                        placeholder="e.g. Mumbai, Maharashtra, India"
                        className="w-full bg-muted/30 border border-border/50 rounded-lg p-3 pl-10 font-serif focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all"
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>

                    <AnimatePresence>
                      {cityResults.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-50 w-full glass-parchment border-border/50 mt-1 rounded-lg shadow-2xl overflow-hidden"
                        >
                          {cityResults.map((city, i) => (
                            <button
                              key={i} onClick={() => selectCity(city)}
                              className="w-full text-left p-3 hover:bg-primary/10 font-serif text-sm border-b border-border/20 last:border-0 transition-colors cursor-pointer"
                            >
                              {city.name}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Language Selector */}
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
                    onClick={handleCalculate}
                    disabled={loading || !selectedCity}
                    className="w-full group bg-primary text-primary-foreground font-heading py-4 rounded-lg shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      <>Generate Horoscope <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Dashboard Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <button
                  onClick={() => setStep("form")}
                  className="text-primary font-heading text-xs tracking-widest uppercase hover:underline flex items-center gap-2 group cursor-pointer"
                >
                  <ChevronRight className="w-3 h-3 rotate-180 group-hover:-translate-x-1 transition-transform" />
                  Change Birth Details
                </button>

                <div className="flex items-center gap-3 flex-wrap">
                  {/* Dashboard Language Selector */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-full">
                    <Globe className="w-3 h-3 text-primary" />
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="bg-transparent text-primary font-heading text-[10px] outline-none cursor-pointer pr-1 uppercase tracking-wider font-semibold"
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code} className="bg-background text-foreground normal-case">
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {isInstallable && (
                    <button
                      onClick={handleInstall}
                      className="flex items-center gap-2 px-4 py-2 bg-secondary/10 border border-secondary/30 text-secondary font-heading text-[10px] rounded-full hover:bg-secondary/20 transition-all cursor-pointer"
                    >
                      <Star className="w-3 h-3" /> Install App
                    </button>
                  )}
                </div>
              </div>

              {/* Shimmering Tab Navigation */}
              <div className="flex border-b border-primary/20 overflow-x-auto scroll-thin select-none">
                <button
                  onClick={() => setActiveTab("chart")}
                  className={`flex items-center gap-2 px-6 py-4 font-heading text-xs md:text-sm tracking-widest uppercase border-b-2 transition-all flex-shrink-0 cursor-pointer ${activeTab === "chart"
                      ? "border-primary text-primary font-bold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <Compass className="w-4 h-4 flex-shrink-0" /> Vedic Calculations
                </button>
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`flex items-center gap-2 px-6 py-4 font-heading text-xs md:text-sm tracking-widest uppercase border-b-2 transition-all flex-shrink-0 cursor-pointer ${activeTab === "chat"
                      ? "border-primary text-primary font-bold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0" /> Ask AI Rishi
                </button>
                <button
                  onClick={() => setActiveTab("report")}
                  className={`flex items-center gap-2 px-6 py-4 font-heading text-xs md:text-sm tracking-widest uppercase border-b-2 transition-all flex-shrink-0 cursor-pointer ${activeTab === "report"
                      ? "border-primary text-primary font-bold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <BookOpen className="w-4 h-4 flex-shrink-0" /> Celestial Report
                </button>
                <button
                  onClick={() => setActiveTab("matching")}
                  className={`flex items-center gap-2 px-6 py-4 font-heading text-xs md:text-sm tracking-widest uppercase border-b-2 transition-all flex-shrink-0 cursor-pointer ${activeTab === "matching"
                      ? "border-primary text-primary font-bold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <Heart className="w-4 h-4 flex-shrink-0" /> Kundali Matching
                </button>
              </div>

              {/* Tab Contents */}
              <div className="pt-4">
                {activeTab === "chart" && (
                  <div className="space-y-8 animate-fadeIn">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="glass-parchment p-4 rounded-xl border-l-4 border-l-primary flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-full text-primary"><Star className="w-5 h-5" /></div>
                        <div>
                          <div className="text-[10px] text-muted-foreground font-heading uppercase tracking-tighter">Ascendant</div>
                          <div className="font-heading text-lg">{chartData.ascendant.sign}</div>
                        </div>
                      </div>
                      <div className="glass-parchment p-4 rounded-xl border-l-4 border-l-secondary flex items-center gap-4">
                        <div className="p-2 bg-secondary/10 rounded-full text-secondary"><Moon className="w-5 h-5" /></div>
                        <div>
                          <div className="text-[10px] text-muted-foreground font-heading uppercase tracking-tighter">Moon Sign</div>
                          <div className="font-heading text-lg">{chartData.moon_intelligence.sign}</div>
                        </div>
                      </div>
                      <div className="glass-parchment p-4 rounded-xl border-l-4 border-l-accent flex items-center gap-4">
                        <div className="p-2 bg-accent/10 rounded-full text-accent"><Sparkles className="w-5 h-5" /></div>
                        <div>
                          <div className="text-[10px] text-muted-foreground font-heading uppercase tracking-tighter">Nakshatra</div>
                          <div className="font-heading text-lg leading-tight">{chartData.moon_intelligence.nakshatra}</div>
                        </div>
                      </div>
                    </div>

                    {/* Chart and Table Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Interactive Divisional Kundli Chart */}
                      <div className="glass-parchment p-6 rounded-2xl vedic-border shadow-xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                          <div>
                            <h3 className="text-secondary font-heading mb-0.5 gold-glow">Divisional Kundli</h3>
                            <p className="text-[10px] text-muted-foreground font-serif">Explore 16 divisional charts mapping distinct life aspects.</p>
                          </div>
                          <select
                            value={selectedVarga}
                            onChange={(e) => setSelectedVarga(e.target.value)}
                            className="bg-card border border-border/50 text-foreground rounded-lg p-2 font-heading text-xs outline-none focus:border-primary cursor-pointer transition-all"
                          >
                            {Object.entries(VARGA_INFO).map(([key, info]) => (
                              <option key={key} value={key} className="bg-card font-serif text-xs">
                                {key}: {info.title.split(" (")[0]}
                              </option>
                            ))}
                          </select>
                        </div>

                        <NorthIndianChart
                          chartData={
                            selectedVarga === "D1"
                              ? chartData.chart_data
                              : selectedVarga === "D9"
                                ? chartData.navamsa_chart || {}
                                : chartData.divisional_charts?.[selectedVarga] || {}
                          }
                          ascendantSign={
                            selectedVarga === "D1"
                              ? chartData.ascendant.sign
                              : selectedVarga === "D9"
                                ? chartData.navamsa_chart?.house_1?.sign || chartData.ascendant.sign
                                : chartData.divisional_charts?.[selectedVarga]?.house_1?.sign || chartData.ascendant.sign
                          }
                          title={VARGA_INFO[selectedVarga]?.title}
                        />

                        <div className="mt-6 text-center px-4 py-3 bg-primary/5 border border-primary/10 rounded-xl">
                          <p className="font-serif italic text-xs text-foreground/80 leading-relaxed">
                            <span className="font-heading font-semibold text-primary block sm:inline not-italic mr-1">{VARGA_INFO[selectedVarga]?.title}:</span>{" "}
                            {VARGA_INFO[selectedVarga]?.description}
                          </p>
                        </div>
                      </div>

                      {/* Planetary Table */}
                      <div className="glass-parchment p-6 rounded-2xl shadow-xl overflow-hidden flex flex-col justify-between">
                        <div>
                          <h3 className="text-secondary font-heading mb-1 gold-glow">Planetary Details</h3>
                          <p className="text-[10px] text-muted-foreground font-serif mb-4">Accurate planetary positions, retrogrades, and dignities in your natal chart.</p>
                          <PlanetaryTable planets={chartData.planetary_table || []} />
                        </div>
                      </div>
                    </div>

                    {/* Educational Accordion Section */}
                    <div className="mt-8 space-y-4" style={{ overflowAnchor: "none" }}>
                      <Accordion id="panchanga" title="Panchanga Elements" explanation="The five vital daily cosmic components representing divine time at birth." icon={Clock} isOpen={expandedAccordions.panchanga || false} onToggle={() => toggleAccordion("panchanga")}>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                          {[
                            { label: "Vara (Day)", val: chartData.panchanga.vara, icon: "✦" },
                            { label: "Tithi (Lunar)", val: chartData.panchanga.tithi.name, pct: chartData.panchanga.tithi.progress },
                            { label: "Nakshatra", val: chartData.panchanga.nakshatra.name, pct: chartData.panchanga.nakshatra.progress },
                            { label: "Yoga (Angle)", val: chartData.panchanga.yoga.name, pct: chartData.panchanga.yoga.progress },
                            { label: "Karana", val: chartData.panchanga.karana.name, pct: chartData.panchanga.karana.progress },
                          ].map((item, i) => (
                            <div key={i} className="bg-card/40 p-4 rounded-xl border border-border/20 flex flex-col justify-between">
                              <div className="text-[9px] text-muted-foreground font-heading uppercase tracking-widest">{item.label}</div>
                              <div className="font-heading text-sm text-primary mt-1 font-bold">{item.val}</div>
                              {item.pct !== undefined ? (
                                <div className="mt-3">
                                  <div className="w-full h-1 bg-border/40 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary" style={{ width: `${item.pct * 100}%` }} />
                                  </div>
                                  <div className="text-[8px] text-muted-foreground mt-1 text-right">{Math.round(item.pct * 100)}% progress</div>
                                </div>
                              ) : (
                                <div className="text-[8px] text-muted-foreground mt-3 italic">Natal solar alignment</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </Accordion>

                      {chartData.shadbala ? (
                        <Accordion id="shadbala" title="Planetary Strengths (Shadbala)" explanation="Six-fold planetary strength (Shadbala) representing each planet's capability to deliver results across life." icon={Star} isOpen={expandedAccordions.shadbala || false} onToggle={() => toggleAccordion("shadbala")}>
                          {chartData.graha_yuddha && chartData.graha_yuddha.length > 0 && (
                            <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-950/20 text-red-100">
                              <h4 className="font-heading text-xs font-bold text-red-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <AlertTriangle size={14} className="animate-pulse" /> Graha Yuddha (Planetary War) Active
                              </h4>
                              <div className="space-y-2">
                                {chartData.graha_yuddha.map((war: any, i: number) => (
                                  <div key={i} className="text-xs font-serif leading-relaxed">
                                    A celestial battle is active between <span className="font-bold text-foreground">{war.planet_1}</span> and <span className="font-bold text-foreground">{war.planet_2}</span> (Distance: <span className="text-primary font-bold">{war.degree_diff}°</span>). The victor is declared as <span className="font-bold text-yellow-400 gold-glow">{war.winner}</span>.
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {Object.entries(chartData.shadbala.planet_balas || {}).map(([name, bala]: [string, any], i: number) => {
                              const pct = Math.min(100, Math.round(bala.strength_ratio * 100));
                              const statusColor = bala.strength_ratio >= 1.0 ? "text-emerald-500" : "text-amber-500";
                              return (
                                <div key={i} className="bg-card/40 p-4 rounded-xl border border-border/20 flex flex-col justify-between hover:border-primary/30 transition-all">
                                  <div>
                                    <div className="flex items-center justify-between border-b border-border/10 pb-2 mb-3">
                                      <span className="font-heading text-xs font-bold text-foreground">{name}</span>
                                      <span className={`text-[10px] font-heading font-bold ${statusColor}`}>{bala.strength_ratio}x req</span>
                                    </div>
                                    <div className="text-[10px] space-y-1.5 font-serif text-muted-foreground">
                                      <div className="flex justify-between"><span>Total Rupas:</span> <span className="text-foreground font-semibold">{bala.total_rupas}</span></div>
                                      <div className="flex justify-between"><span>Shashtiamsa:</span> <span className="text-foreground font-semibold">{bala.total_shashtiamsa}</span></div>

                                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 border-t border-border/10 pt-2 text-[9px]">
                                        <div className="flex justify-between"><span>Sthana:</span> <span className="text-foreground font-medium">{Math.round(bala.sthana_bala)}</span></div>
                                        <div className="flex justify-between"><span>Dig:</span> <span className="text-foreground font-medium">{Math.round(bala.dig_bala)}</span></div>
                                        <div className="flex justify-between"><span>Kaala:</span> <span className="text-foreground font-medium">{Math.round(bala.kaala_bala)}</span></div>
                                        <div className="flex justify-between"><span>Cheshta:</span> <span className="text-foreground font-medium">{Math.round(bala.cheshta_bala)}</span></div>
                                        <div className="flex justify-between"><span>Naisargika:</span> <span className="text-foreground font-medium">{Math.round(bala.naisargika_bala)}</span></div>
                                        <div className="flex justify-between"><span>Drik:</span> <span className="text-foreground font-medium">{Math.round(bala.drik_bala)}</span></div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-4">
                                    <div className="w-full h-1.5 bg-border/40 rounded-full overflow-hidden">
                                      <div className={`h-full ${bala.strength_ratio >= 1.0 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${pct}%` }} />
                                    </div>
                                    <div className="flex justify-between text-[8px] text-muted-foreground mt-1">
                                      <span>Ratio</span>
                                      <span>{Math.round(bala.strength_ratio * 100)}%</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </Accordion>
                      ) : (
                        digBalaPlanets.length > 0 && (
                          <Accordion id="digbala" title="Planetary Strengths (Dig Bala)" explanation="Directional strength coordinates determining a planet's capability to manifest outcomes." icon={Star} isOpen={expandedAccordions.digbala || false} onToggle={() => toggleAccordion("digbala")}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                              {digBalaPlanets.map((p: any, i: number) => (
                                <div key={i} className="bg-card/40 p-4 rounded-xl border border-border/20 flex flex-col justify-between">
                                  <div className="flex items-center justify-between">
                                    <span className="font-heading text-xs font-bold text-foreground">{p.name}</span>
                                    <span className="text-[10px] font-heading text-primary font-bold">{p.dig_bala_points} Pts</span>
                                  </div>
                                  <div className="mt-3">
                                    <div className="w-full h-1.5 bg-border/40 rounded-full overflow-hidden">
                                      <div className="h-full bg-primary" style={{ width: `${p.dig_bala_percentage || 0}%` }} />
                                    </div>
                                    <div className="flex justify-between text-[8px] text-muted-foreground mt-1">
                                      <span>Lagna Power</span>
                                      <span>{Math.round(p.dig_bala_percentage || 0)}%</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </Accordion>
                        )
                      )}

                      {chartData.bhava_bala && (
                        <Accordion id="bhavabala" title="House Strengths (Bhava Bala)" explanation="The computed strength of the 12 houses (Bhavas), determining which domains of life naturally flow with ease and which require greater conscious effort." icon={Compass} isOpen={expandedAccordions.bhavabala || false} onToggle={() => toggleAccordion("bhavabala")}>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {chartData.bhava_bala.map((score: number, i: number) => {
                              const signLord = (signIdx: number) => {
                                switch (signIdx) {
                                  case 0: case 7: return "Mars"; // Aries, Scorpio
                                  case 1: case 6: return "Venus"; // Taurus, Libra
                                  case 2: case 5: return "Mercury"; // Gemini, Virgo
                                  case 3: return "Moon"; // Cancer
                                  case 4: return "Sun"; // Leo
                                  case 8: case 11: return "Jupiter"; // Sagittarius, Pisces
                                  case 9: case 10: return "Saturn"; // Capricorn, Aquarius
                                  default: return "Unknown";
                                }
                              };
                              const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
                              const ascSignIdx = SIGNS.indexOf(chartData.ascendant.sign);
                              const houseSignIdx = (ascSignIdx + i) % 12;
                              const sign = SIGNS[houseSignIdx];
                              const lord = signLord(houseSignIdx);

                              const minBala = 250;
                              const maxBala = 550;
                              const displayPct = Math.min(100, Math.max(10, Math.round(((score - minBala) / (maxBala - minBala)) * 100)));

                              return (
                                <div key={i} className="bg-card/40 p-4 rounded-xl border border-border/20 flex flex-col justify-between hover:border-primary/30 transition-all">
                                  <div>
                                    <div className="text-[9px] text-muted-foreground font-heading uppercase tracking-widest">House {i + 1}</div>
                                    <div className="font-heading text-sm text-primary font-bold mt-1">{score} Pts</div>
                                    <div className="text-[9px] text-muted-foreground font-serif leading-normal mt-1 italic text-center sm:text-left">
                                      {sign} • {lord}
                                    </div>
                                  </div>
                                  <div className="mt-3">
                                    <div className="w-full h-1 bg-border/40 rounded-full overflow-hidden">
                                      <div className="h-full bg-primary" style={{ width: `${displayPct}%` }} />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </Accordion>
                      )}

                      <Accordion id="dasha" title="Vimshottari Dasha Periods" explanation="Planetary period timeline mapping cyclic life progression over a 120-year cycle." icon={Calendar} isOpen={expandedAccordions.dasha || false} onToggle={() => toggleAccordion("dasha")}>
                        <DashaTimeline timeline={chartData.vimshottari_timeline || []} className="w-full" />
                      </Accordion>

                      {chartData.chara_dasha && (
                        <Accordion id="charadasha" title="Jaimini Chara Dasha" explanation="Sign-based cyclic timeline mapping spiritual and material periods of experiences." icon={Compass} isOpen={expandedAccordions.charadasha || false} onToggle={() => toggleAccordion("charadasha")}>
                          <div className="overflow-x-auto scroll-thin">
                            <table className="w-full text-left border-collapse">
                              <thead className="bg-muted/50">
                                <tr className="border-b border-border">
                                  <th className="px-3 py-3 font-heading text-primary text-xs tracking-wider">Sign</th>
                                  <th className="px-3 py-3 font-heading text-primary text-xs tracking-wider text-center">Duration (Years)</th>
                                  <th className="px-3 py-3 font-heading text-primary text-xs tracking-wider">Start Date</th>
                                  <th className="px-3 py-3 font-heading text-primary text-xs tracking-wider">End Date</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/30">
                                {(chartData.chara_dasha.periods || []).map((period: any, i: number) => {
                                  const current = isCurrent(period.start_date, period.end_date);
                                  return (
                                    <tr key={i} className={`hover:bg-primary/5 transition-colors ${current ? "bg-primary/5 font-bold" : ""}`}>
                                      <td className="px-3 py-3 font-heading font-bold text-foreground flex items-center gap-2">
                                        <span className={`w-1.5 h-1.5 rounded-full ${current ? "bg-primary animate-pulse" : "bg-transparent"}`} />
                                        {period.sign}
                                      </td>
                                      <td className="px-3 py-3 text-center font-serif text-foreground">{period.duration_years}</td>
                                      <td className="px-3 py-3 font-serif text-muted-foreground text-xs">{formatDate(period.start_date)}</td>
                                      <td className="px-3 py-3 font-serif text-muted-foreground text-xs flex items-center justify-between">
                                        {formatDate(period.end_date)}
                                        {current && (
                                          <span className="text-[8px] font-heading text-primary px-1.5 py-0.5 bg-primary/10 rounded-full border border-primary/20">
                                            NOW
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </Accordion>
                      )}

                      <Accordion id="yogas" title="Auspicious Yogas" explanation="Vedic planetary configurations forming special fortunes and life paths." icon={Sparkles} isOpen={expandedAccordions.yogas || false} onToggle={() => toggleAccordion("yogas")}>
                        <YogaCards yogas={chartData.yogas || []} />
                      </Accordion>

                      {chartData.doshas && (
                        <Accordion id="doshas" title="Vedic Doshas" explanation="Cosmic faults and planetary afflictions affecting emotional and relational harmony." icon={AlertTriangle} isOpen={expandedAccordions.doshas || false} onToggle={() => toggleAccordion("doshas")}>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {[
                              { name: "Kala Sarpa", val: chartData.doshas.kala_sarpa?.has_dosha, desc: "Formed when all planets are hemmed between Rahu and Ketu, creating karmic lessons." },
                              { name: "Manglik (Lagna)", val: chartData.doshas.manglik_lagna?.has_dosha, desc: "Mars placement in houses 1, 4, 7, 8, or 12 of Birth chart, indicating martial passion." },
                              { name: "Manglik (Moon)", val: chartData.doshas.manglik_moon?.has_dosha, desc: "Mars placement relative to Moon sign, affecting emotional relationship harmony." },
                              { name: "Manglik (Venus)", val: chartData.doshas.manglik_venus?.has_dosha, desc: "Mars placement relative to Venus, affecting love compatibility and passion." },
                              { name: "Pitru Dosha", val: chartData.doshas.pitru?.has_dosha, desc: "Sun or Moon afflicted by Saturn, Rahu, or Ketu, indicating ancestral karmic debts." },
                              { name: "Guru Chandala", val: chartData.doshas.guru_chandala?.has_dosha, desc: "Jupiter conjoined with Rahu or Ketu, testing moral wisdom and spiritual beliefs." },
                              { name: "Ganda Moola", val: chartData.doshas.ganda_moola?.has_dosha, desc: "Moon placed in highly transitionary junction points (Ketu and Mercury stars)." },
                              { name: "Kalathra Dosha", val: chartData.doshas.kalathra_lagna || chartData.doshas.kalathra_moon, desc: "Afflictions on the 7th house or lord, affecting relationships and partnership success." },
                              { name: "Shrapit Dosha", val: chartData.doshas.shrapit, desc: "Saturn and Rahu conjunction, representing deep karmic obstacles requiring patience." }
                            ].map((d, i) => (
                              <div key={i} className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${d.val ? "bg-red-950/20 border-red-500/30 text-red-100" : "bg-card/40 border-border/20"}`}>
                                <div>
                                  <div className="flex items-center justify-between">
                                    <span className="font-heading text-xs font-bold">{d.name}</span>
                                    <span className={`text-[9px] font-heading px-2 py-0.5 rounded-full border ${d.val ? "bg-red-900/40 border-red-500/50 text-red-400" : "bg-emerald-950/20 border-emerald-500/20 text-emerald-500"}`}>
                                      {d.val ? "ACTIVE" : "NO DOSHA"}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground font-serif leading-relaxed mt-2">{d.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </Accordion>
                      )}

                      {chartData.jaimini && (
                        <Accordion id="jaimini" title="Jaimini Lagnas & Karakas" explanation="Subtle focal points representing your soul's desires, material status, and public image." icon={User} isOpen={expandedAccordions.jaimini || false} onToggle={() => toggleAccordion("jaimini")}>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            {[
                              { title: "Arudha Lagna (AL)", val: chartData.jaimini.arudha_lagna?.sign, h: chartData.jaimini.arudha_lagna?.house, desc: "How the world perceives you, your public image, and material status." },
                              { title: "Upapada Lagna (UL)", val: chartData.jaimini.upapada_lagna?.sign, h: chartData.jaimini.upapada_lagna?.house, desc: "Marriage, life partner's nature, status, and long-term relational bond." },
                              { title: "Karakamsha Lagna (KL)", val: chartData.jaimini.karakamsha_lagna?.sign, h: chartData.jaimini.karakamsha_lagna?.house, desc: "Soul's primary desire and direction, based on Atmakaraka's D9 position." },
                            ].map((item, i) => (
                              <div key={i} className="bg-card/40 p-4 rounded-xl border border-border/20 flex flex-col justify-between">
                                <div>
                                  <span className="text-[9px] text-muted-foreground font-heading uppercase tracking-widest">{item.title}</span>
                                  <div className="font-heading text-base text-primary font-bold mt-1">{item.val} <span className="text-xs text-muted-foreground font-serif">(House {item.h})</span></div>
                                </div>
                                <p className="text-[10px] text-muted-foreground font-serif italic mt-2 leading-relaxed">{item.desc}</p>
                              </div>
                            ))}
                          </div>

                          <div className="overflow-x-auto scroll-thin">
                            <table className="w-full text-left border-collapse">
                              <thead className="bg-muted/50">
                                <tr className="border-b border-border">
                                  <th className="px-3 py-3 font-heading text-primary text-xs tracking-wider">Chara Karaka</th>
                                  <th className="px-3 py-3 font-heading text-primary text-xs tracking-wider">Significance</th>
                                  <th className="px-3 py-3 font-heading text-primary text-xs tracking-wider">Planet</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/30">
                                {[
                                  { code: "AK", name: "Atmakaraka", meaning: "Soul indicator, primary lessons and spiritual path." },
                                  { code: "AmK", name: "Amatyakaraka", meaning: "Career, profession, intellectual path, and counselors." },
                                  { code: "BK", name: "Bhratrukaraka", meaning: "Siblings, companions, gurus, and helpful guides." },
                                  { code: "MK", name: "Matrukaraka", meaning: "Mother, home environment, emotional peace, and luxury." },
                                  { code: "PiK", name: "Pitrukaraka", meaning: "Father, lineage, ancestors, and higher duties." },
                                  { code: "PK", name: "Putrakaraka", meaning: "Children, creative pursuits, education, and followers." },
                                  { code: "GK", name: "Gnatikaraka", meaning: "Rivals, disputes, conflicts, health challenges, and struggles." },
                                  { code: "DK", name: "Darakaraka", meaning: "Life partner, marriage, business partners, and physical wellness." }
                                ].map((k, i) => {
                                  const planetName = Object.entries(chartData.jaimini.chara_karakas || {}).find(([_, code]) => code === k.code)?.[0] || "None";
                                  return (
                                    <tr key={i} className="hover:bg-primary/5 transition-colors">
                                      <td className="px-3 py-2 font-heading font-bold text-foreground">{k.code} ({k.name})</td>
                                      <td className="px-3 py-2 font-serif text-muted-foreground text-xs leading-relaxed">{k.meaning}</td>
                                      <td className="px-3 py-2 font-heading font-semibold text-primary">{planetName}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </Accordion>
                      )}

                      {chartData.aspects && (
                        <Accordion id="aspects" title="Graha & Rasi Aspects" explanation="Planetary aspect configurations (Graha Drishti) and sign-based aspects (Rasi Drishti) representing mutual influences." icon={Compass} isOpen={expandedAccordions.aspects || false} onToggle={() => toggleAccordion("aspects")}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Graha Drishti */}
                            <div className="space-y-3">
                              <h5 className="font-heading text-xs text-secondary tracking-widest uppercase mb-2">Graha Drishti (Planetary Aspects)</h5>
                              <div className="overflow-x-auto scroll-thin max-h-[300px]">
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead className="bg-muted/50">
                                    <tr className="border-b border-border">
                                      <th className="px-2 py-2 font-heading text-primary">Graha</th>
                                      <th className="px-2 py-2 font-heading text-primary">Aspected Houses</th>
                                      <th className="px-2 py-2 font-heading text-primary">Aspected Grahas</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border/20">
                                    {Object.entries(chartData.aspects.graha_drishti || {}).map(([planet, details]: any, i) => (
                                      <tr key={i} className="hover:bg-primary/5">
                                        <td className="px-2 py-2 font-heading font-bold text-foreground">{planet}</td>
                                        <td className="px-2 py-2 font-serif text-muted-foreground">{details.aspected_houses?.join(", ") || "None"}</td>
                                        <td className="px-2 py-2 font-heading font-semibold text-primary">{details.aspected_planets?.join(", ") || "None"}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Rasi Drishti */}
                            <div className="space-y-3">
                              <h5 className="font-heading text-xs text-secondary tracking-widest uppercase mb-2">Rasi Drishti (Sign Aspects)</h5>
                              <div className="overflow-x-auto scroll-thin max-h-[300px]">
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead className="bg-muted/50">
                                    <tr className="border-b border-border">
                                      <th className="px-2 py-2 font-heading text-primary">Rasi</th>
                                      <th className="px-2 py-2 font-heading text-primary">Aspected Rasis</th>
                                      <th className="px-2 py-2 font-heading text-primary">Aspected Grahas</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border/20">
                                    {Object.entries(chartData.aspects.rasi_drishti || {}).map(([sign, details]: any, i) => (
                                      <tr key={i} className="hover:bg-primary/5">
                                        <td className="px-2 py-2 font-heading font-bold text-foreground">{sign}</td>
                                        <td className="px-2 py-2 font-serif text-muted-foreground">{details.aspected_signs?.join(", ") || "None"}</td>
                                        <td className="px-2 py-2 font-heading font-semibold text-primary">{details.aspected_planets?.join(", ") || "None"}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </Accordion>
                      )}

                      {chartData.argala && (
                        <Accordion id="argala" title="Argala & Virodhargala" explanation="Direct planetary interventions (Argala) and obstructions (Virodhargala) formed on houses." icon={Compass} isOpen={expandedAccordions.argala || false} onToggle={() => toggleAccordion("argala")}>
                          <div className="overflow-x-auto scroll-thin max-h-[400px]">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead className="bg-muted/50">
                                <tr className="border-b border-border">
                                  <th className="px-3 py-3 font-heading text-primary">House</th>
                                  <th className="px-3 py-3 font-heading text-primary">Argala Contributors (Interventions)</th>
                                  <th className="px-3 py-3 font-heading text-primary">Virodhargala Contributors (Obstructions)</th>
                                  <th className="px-3 py-3 font-heading text-primary text-center">Net Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/30">
                                {Object.entries(chartData.argala.house_argalas || {}).map(([house, details]: any, i) => (
                                  <tr key={i} className="hover:bg-primary/5">
                                    <td className="px-3 py-2 font-heading font-bold text-foreground">House {house}</td>
                                    <td className="px-3 py-2 font-serif text-muted-foreground leading-relaxed">
                                      {details.argala_contributors?.length > 0
                                        ? details.argala_contributors.map((c: any) => `${c.planet_name} (H${c.argala_house})`).join(", ")
                                        : "None"}
                                    </td>
                                    <td className="px-3 py-2 font-serif text-muted-foreground leading-relaxed">
                                      {details.virodhargala_contributors?.length > 0
                                        ? details.virodhargala_contributors.map((c: any) => `${c.planet_name} (H${c.argala_house})`).join(", ")
                                        : "None"}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-heading font-bold border ${details.net_argala_status === "Active"
                                          ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400"
                                          : details.net_argala_status === "Obstructed"
                                            ? "bg-amber-950/20 border-amber-500/20 text-amber-400"
                                            : "bg-card border-border/20 text-muted-foreground"
                                        }`}>
                                        {details.net_argala_status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </Accordion>
                      )}

                      {chartData.sade_sati && (
                        <Accordion id="sadesati" title="Sade Sati & Transits" explanation="Current transit status of Saturn relative to natal Moon sign." icon={Star} isOpen={expandedAccordions.sadesati || false} onToggle={() => toggleAccordion("sadesati")}>
                          <div className="space-y-4">
                            <div className={`p-5 rounded-2xl border ${chartData.sade_sati.is_active
                                ? "bg-amber-950/20 border-amber-500/30 text-amber-100"
                                : "bg-emerald-950/10 border-emerald-500/20 text-emerald-100"
                              }`}>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                  <h5 className="font-heading text-sm font-bold flex items-center gap-2">
                                    <Star className={`w-4 h-4 ${chartData.sade_sati.is_active ? "text-amber-500 animate-pulse" : "text-emerald-500"}`} />
                                    Saturn Sade Sati: {chartData.sade_sati.is_active ? "ACTIVE" : "INACTIVE"}
                                  </h5>
                                  <p className="text-[10px] text-muted-foreground font-serif mt-1">Sade Sati is the 7.5-year cycle of Saturn transiting over the natal Moon sign and adjacent houses.</p>
                                </div>
                                {chartData.sade_sati.is_active && (
                                  <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-full font-heading text-[9px] uppercase tracking-widest text-center">
                                    {chartData.sade_sati.phase || "Active Phase"}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-serif leading-relaxed mt-4 border-t border-border/10 pt-3">
                                {chartData.sade_sati.description || "Saturn is transiting in a supportive house relative to your natal Moon sign, indicating no active Sade Sati challenges currently."}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="bg-card/40 p-4 rounded-xl border border-border/20">
                                <div className="text-[8px] text-muted-foreground font-heading uppercase tracking-widest">Natal Moon Sign</div>
                                <div className="font-heading text-sm text-primary font-bold mt-1">{chartData.sade_sati.moon_sign || chartData.moon_intelligence.sign}</div>
                              </div>
                              <div className="bg-card/40 p-4 rounded-xl border border-border/20">
                                <div className="text-[8px] text-muted-foreground font-heading uppercase tracking-widest">Current Saturn Transit</div>
                                <div className="font-heading text-sm text-secondary font-bold mt-1">{chartData.sade_sati.saturn_sign || "Aquarius"}</div>
                              </div>
                              <div className="bg-card/40 p-4 rounded-xl border border-border/20">
                                <div className="text-[8px] text-muted-foreground font-heading uppercase tracking-widest">Sade Sati Impact</div>
                                <div className="font-heading text-sm text-foreground font-bold mt-1">
                                  {chartData.sade_sati.is_active ? "Karmic Refinement" : "Supportive Period"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Accordion>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "chat" && (
                  <div className="animate-fadeIn">
                    {/* Chat Section */}
                    <div className="glass-parchment rounded-2xl overflow-hidden flex flex-col h-[600px] shadow-2xl border-primary/20 max-w-4xl mx-auto">
                      <div className="p-4 bg-primary/10 border-b border-primary/20 flex items-center justify-between">
                        <h4 className="font-heading text-primary flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" /> Ask the Rishi
                        </h4>
                        {chatHistory.length > 0 && (
                          <button
                            onClick={() => {
                              const header = `Vedic Jyotish — Chat History\nGenerated: ${new Date().toLocaleString()}\n${"═".repeat(50)}\n\n`;
                              const content = chatHistory.map(m => `[${m.role === "user" ? "You" : "Rishi"}]:\n${m.text}\n`).join("\n---\n\n");
                              const blob = new Blob([header + content], { type: "text/plain" });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = "vedic_chat_history.txt";
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-heading text-primary border border-primary/30 rounded-full hover:bg-primary/10 transition-all cursor-pointer"
                          >
                            <ExternalLink className="w-3 h-3" /> Export
                          </button>
                        )}
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-thin">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] text-primary font-heading flex-shrink-0">Rishi</div>
                          <div className="bg-muted/40 p-3 rounded-xl rounded-tl-none font-serif text-sm">
                            Humble greetings. I have studied your {chartData.ascendant.sign} chart. How may I guide you through the cosmic threads today?
                          </div>
                        </div>

                        {chatHistory.map((msg, i) => (
                          <motion.div
                            key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-heading flex-shrink-0 ${msg.role === "user" ? "bg-secondary/20 text-secondary border border-secondary/30" : "bg-primary/20 text-primary border border-primary/30"}`}>
                              {msg.role === "user" ? "You" : "Rishi"}
                            </div>
                            <div className={`p-3 rounded-xl max-w-[85%] font-serif text-sm ${msg.role === "user" ? "bg-secondary/10 text-secondary rounded-tr-none border border-secondary/10" : "bg-muted/40 rounded-tl-none text-foreground/90"}`}>
                              <div className="markdown-chat">
                                <ReactMarkdown>
                                  {msg.text}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        {chatLoading && <div className="text-[10px] text-primary animate-pulse font-heading tracking-widest pl-11">Aligning with stars...</div>}
                      </div>

                      <div className="p-4 bg-muted/20 border-t border-border/30">
                        {chatLimitReached ? (
                          <div className="text-center py-2 text-xs text-muted-foreground font-serif italic">
                            You've reached the {MAX_QUESTIONS}-question limit for this session. Generate the full report for deeper analysis.
                          </div>
                        ) : (
                          <>
                            <div className="text-right text-[10px] text-muted-foreground mb-1 font-heading">
                              {userQuestionCount}/{MAX_QUESTIONS} questions used
                            </div>
                            <div className="relative">
                              <input
                                value={userQuestion} onChange={(e) => setUserQuestion(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleChat()}
                                placeholder="Your question..."
                                className="w-full bg-background/50 border border-border/50 rounded-lg py-3 pl-4 pr-12 text-sm font-serif outline-none focus:border-primary transition-all"
                              />
                              <button
                                onClick={handleChat} disabled={chatLoading}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-primary hover:scale-110 active:scale-95 transition-all cursor-pointer"
                              >
                                <Send className="w-5 h-5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "report" && (
                  <div className="animate-fadeIn">
                    {!aiReport && !reportLoading ? (
                      <div className="text-center py-12 glass-parchment rounded-3xl border-dashed border-2 border-primary/30 max-w-4xl mx-auto">
                        <Wand2 className="w-12 h-12 text-primary/40 mx-auto mb-4 animate-pulse" />
                        <h3 className="text-2xl font-heading text-primary gold-glow mb-4">Deep Cosmic Analysis</h3>
                        <p className="max-w-md mx-auto text-muted-foreground font-serif italic mb-8 px-4 leading-relaxed text-sm">
                          Generate a comprehensive AI-powered report based on Sanatan Jyotish guidelines, outlining past life karma, health warnings, dasha timings, and custom remedies.
                        </p>
                        <button
                          onClick={handleGenerateReport}
                          className="px-8 py-4 bg-primary text-primary-foreground font-heading rounded-full shadow-lg hover:shadow-primary/30 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center gap-3 mx-auto cursor-pointer"
                        >
                          Generate Full Report <Sparkles className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <ReportSection report={aiReport} isStreaming={reportLoading} />
                    )}
                  </div>
                )}

                {activeTab === "matching" && (
                  <div className="animate-fadeIn max-w-4xl mx-auto space-y-8">
                    {!matchingResult ? (
                      <div className="glass-parchment p-8 rounded-2xl vedic-border shadow-2xl relative overflow-hidden">
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                        <h3 className="text-xl md:text-2xl font-heading text-primary gold-glow text-center mb-1">Kundali Matching</h3>
                        <p className="text-xs text-muted-foreground font-serif text-center mb-8">Calculate Ashtakoota Guna Milan (36 points) compatibility between partners.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-b border-border/20 pb-8">
                          {/* Column 1: Boy's Details */}
                          <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-primary/20 pb-2">
                              <h4 className="font-heading text-sm text-primary font-bold">Boy's Birth Details</h4>
                              <button
                                onClick={() => loadActiveProfile("boy")}
                                className="text-[10px] font-heading text-secondary px-2.5 py-1 bg-secondary/10 border border-secondary/20 rounded-full hover:bg-secondary/20 transition-all cursor-pointer flex items-center gap-1"
                              >
                                <RefreshCw className="w-2.5 h-2.5" /> Load My Details
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="flex items-center gap-1.5 text-[10px] font-heading text-secondary tracking-wider uppercase">
                                  <Calendar className="w-3 h-3" /> Date (DD/MM/YYYY)
                                </label>
                                <div className="relative">
                                  <input
                                    type="text" value={matchingBoyDate} onChange={(e) => setMatchingBoyDate(e.target.value)}
                                    placeholder="DD/MM/YYYY"
                                    className="w-full bg-muted/20 border border-border/50 rounded-lg p-2.5 pr-8 font-serif text-sm focus:border-primary outline-none transition-all"
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
                                <label className="flex items-center gap-1.5 text-[10px] font-heading text-secondary tracking-wider uppercase">
                                  <Clock className="w-3 h-3" /> Time (HH:MM, 24h)
                                </label>
                                <div className="relative">
                                  <input
                                    type="text" value={matchingBoyTime} onChange={(e) => setMatchingBoyTime(e.target.value)}
                                    placeholder="HH:MM"
                                    className="w-full bg-muted/20 border border-border/50 rounded-lg p-2.5 pr-8 font-serif text-sm focus:border-primary outline-none transition-all"
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
                              <label className="flex items-center gap-1.5 text-[10px] font-heading text-secondary tracking-wider uppercase">
                                <MapPin className="w-3 h-3" /> Birth Place
                              </label>
                              <div className="relative">
                                <input
                                  type="text" value={matchingBoyCityInput}
                                  onChange={(e) => { setMatchingBoyCityInput(e.target.value); setMatchingBoySelectedCity(null); }}
                                  placeholder="e.g. Delhi, India"
                                  className="w-full bg-muted/20 border border-border/50 rounded-lg p-2.5 pl-9 font-serif text-sm focus:border-primary outline-none transition-all"
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                              </div>

                              <AnimatePresence>
                                {matchingBoyCityResults.length > 0 && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="absolute z-50 w-full glass-parchment border-border/50 mt-1 rounded-lg shadow-xl overflow-hidden max-h-[160px] overflow-y-auto scroll-thin"
                                  >
                                    {matchingBoyCityResults.map((city, i) => (
                                      <button
                                        key={i} onClick={() => { setMatchingBoySelectedCity(city); setMatchingBoyCityInput(city.name); setMatchingBoyCityResults([]); }}
                                        className="w-full text-left p-2.5 hover:bg-primary/10 font-serif text-xs border-b border-border/10 last:border-0 transition-colors cursor-pointer"
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
                                onClick={() => loadActiveProfile("girl")}
                                className="text-[10px] font-heading text-secondary px-2.5 py-1 bg-secondary/10 border border-secondary/20 rounded-full hover:bg-secondary/20 transition-all cursor-pointer flex items-center gap-1"
                              >
                                <RefreshCw className="w-2.5 h-2.5" /> Load My Details
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="flex items-center gap-1.5 text-[10px] font-heading text-secondary tracking-wider uppercase">
                                  <Calendar className="w-3 h-3" /> Date (DD/MM/YYYY)
                                </label>
                                <div className="relative">
                                  <input
                                    type="text" value={matchingGirlDate} onChange={(e) => setMatchingGirlDate(e.target.value)}
                                    placeholder="DD/MM/YYYY"
                                    className="w-full bg-muted/20 border border-border/50 rounded-lg p-2.5 pr-8 font-serif text-sm focus:border-primary outline-none transition-all"
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
                                <label className="flex items-center gap-1.5 text-[10px] font-heading text-secondary tracking-wider uppercase">
                                  <Clock className="w-3 h-3" /> Time (HH:MM, 24h)
                                </label>
                                <div className="relative">
                                  <input
                                    type="text" value={matchingGirlTime} onChange={(e) => setMatchingGirlTime(e.target.value)}
                                    placeholder="HH:MM"
                                    className="w-full bg-muted/20 border border-border/50 rounded-lg p-2.5 pr-8 font-serif text-sm focus:border-primary outline-none transition-all"
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
                              <label className="flex items-center gap-1.5 text-[10px] font-heading text-secondary tracking-wider uppercase">
                                <MapPin className="w-3 h-3" /> Birth Place
                              </label>
                              <div className="relative">
                                <input
                                  type="text" value={matchingGirlCityInput}
                                  onChange={(e) => { setMatchingGirlCityInput(e.target.value); setMatchingGirlSelectedCity(null); }}
                                  placeholder="e.g. Mumbai, India"
                                  className="w-full bg-muted/20 border border-border/50 rounded-lg p-2.5 pl-9 font-serif text-sm focus:border-primary outline-none transition-all"
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                              </div>

                              <AnimatePresence>
                                {matchingGirlCityResults.length > 0 && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="absolute z-50 w-full glass-parchment border-border/50 mt-1 rounded-lg shadow-xl overflow-hidden max-h-[160px] overflow-y-auto scroll-thin"
                                  >
                                    {matchingGirlCityResults.map((city, i) => (
                                      <button
                                        key={i} onClick={() => { setMatchingGirlSelectedCity(city); setMatchingGirlCityInput(city.name); setMatchingGirlCityResults([]); }}
                                        className="w-full text-left p-2.5 hover:bg-primary/10 font-serif text-xs border-b border-border/10 last:border-0 transition-colors cursor-pointer"
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
                            <label className="text-[10px] font-heading text-secondary tracking-wider uppercase">Matching Method</label>
                            <select
                              value={matchingMethod} onChange={(e) => setMatchingMethod(e.target.value)}
                              className="bg-card border border-border/50 text-foreground rounded-lg p-2 font-heading text-xs outline-none focus:border-primary cursor-pointer w-full"
                            >
                              <option value="North">North Indian (Ashtakoota - 36 Gunas)</option>
                              <option value="South">South Indian (Poruthams - 10 Tests)</option>
                            </select>
                          </div>

                          <button
                            onClick={handleCalculateCompatibility}
                            disabled={matchingLoading || !matchingBoySelectedCity || !matchingGirlSelectedCity}
                            className="flex-1 bg-primary text-primary-foreground font-heading py-3 px-6 rounded-full shadow-lg hover:shadow-primary/20 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer text-xs md:text-sm"
                          >
                            {matchingLoading ? (
                              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                            ) : (
                              <>Calculate Compatibility <Heart className="w-4 h-4" /></>
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
                                <div className="text-[9px] text-muted-foreground font-heading uppercase tracking-widest">Score</div>
                                <div className="text-4xl font-heading font-extrabold text-primary my-1 gold-glow">{matchingResult.total_score}</div>
                                <div className="text-[9px] text-muted-foreground font-serif">Out of {matchingResult.max_score} Gunas</div>
                              </div>
                            </div>
                            <div className={`mt-5 px-5 py-1.5 rounded-full border font-heading text-[10px] uppercase tracking-wider ${matchingResult.total_score >= 28
                                ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-400"
                                : matchingResult.total_score >= 18
                                  ? "bg-amber-950/20 border-amber-500/30 text-amber-400"
                                  : "bg-red-950/20 border-red-500/30 text-red-400"
                              }`}>
                              {matchingResult.total_score >= 28
                                ? "Auspicious Match"
                                : matchingResult.total_score >= 18
                                  ? "Suitability Favorable"
                                  : "Caution / Low Harmony"}
                            </div>
                          </div>

                          {/* Quick summary box */}
                          <div className="flex-1 space-y-6">
                            <div className="text-center md:text-left">
                              <h4 className="font-heading text-lg text-primary gold-glow mb-1">Celestial Compatibility Analysis</h4>
                              <p className="text-xs text-muted-foreground font-serif">
                                Calculated using the classical Ashtakoota Guna Milan system ({matchingResult.method}ern Method).
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-card/40 p-4 rounded-xl border border-border/20">
                                <div className="text-[8px] text-muted-foreground font-heading uppercase tracking-wider">Boy's Moon Details</div>
                                <div className="font-heading text-xs text-primary font-bold mt-1.5 leading-relaxed">
                                  {matchingResult.boy_details?.nakshatra} Star
                                </div>
                                <div className="text-[10px] font-serif text-muted-foreground italic mt-0.5">
                                  {matchingResult.boy_details?.sign} • Pada {matchingResult.boy_details?.pada}
                                </div>
                              </div>

                              <div className="bg-card/40 p-4 rounded-xl border border-border/20">
                                <div className="text-[8px] text-muted-foreground font-heading uppercase tracking-wider">Girl's Moon Details</div>
                                <div className="font-heading text-xs text-secondary font-bold mt-1.5 leading-relaxed">
                                  {matchingResult.girl_details?.nakshatra} Star
                                </div>
                                <div className="text-[10px] font-serif text-muted-foreground italic mt-0.5">
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
                          <h4 className="text-secondary font-heading mb-1 gold-glow text-center">Ashtakoota Score Breakdown</h4>
                          <p className="text-[10px] text-muted-foreground font-serif text-center mb-6">Breakdown of the 8 relational dimensions calculated using Moon longitudes.</p>

                          <div className="overflow-x-auto scroll-thin">
                            <table className="w-full text-left border-collapse text-xs md:text-sm">
                              <thead className="bg-muted/50">
                                <tr className="border-b border-border">
                                  <th className="px-3 py-3 font-heading text-primary text-xs tracking-wider">Koota</th>
                                  <th className="px-3 py-3 font-heading text-primary text-xs tracking-wider">Significance</th>
                                  <th className="px-3 py-3 font-heading text-primary text-xs tracking-wider text-center">Score</th>
                                  <th className="px-3 py-3 font-heading text-primary text-xs tracking-wider text-center">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/30 text-xs">
                                {[
                                  { name: "Varna", max: 1, key: "varna", desc: "Mutual work attitudes, mental capability, work affinity, and spiritual inclination." },
                                  { name: "Vashya", max: 2, key: "vashya", desc: "Mutual attraction, influence, dominance levels, and power equations." },
                                  { name: "Tara", max: 3, key: "tara", desc: "Stellar energy, longevity, individual health, and general well-being." },
                                  { name: "Yoni", max: 4, key: "yoni", desc: "Physical intimacy, natural affinity, physical harmony, and animal affinity." },
                                  { name: "Graha Maitri", max: 5, key: "graha_maitri", desc: "Intellectual friendship, mental attachment, and planetary lord bonding." },
                                  { name: "Gana", max: 6, key: "gana", desc: "Behavioral temperaments: Deva (Divine), Manushya (Human), or Rakshasa (Demonic)." },
                                  { name: "Bhakoot", max: 7, key: "bhakoot", desc: "Emotional adjustment, family growth, progeny welfare, and prosperity." },
                                  { name: "Naadi", max: 8, key: "naadi", desc: "Genetic compatibility, physiological chemistry, and children health." }
                                ].map((k, i) => {
                                  const data = matchingResult[k.key] || { score: 0, max_score: k.max, matched: false };
                                  return (
                                    <tr key={i} className="hover:bg-primary/5 transition-colors">
                                      <td className="px-3 py-3 font-heading font-bold text-foreground">{k.name}</td>
                                      <td className="px-3 py-3 font-serif text-muted-foreground text-[10px] leading-relaxed max-w-[320px]">{k.desc}</td>
                                      <td className="px-3 py-3 text-center font-serif font-bold text-primary">{data.score} / {data.max_score}</td>
                                      <td className="px-3 py-3 text-center">
                                        <span className={`px-2.5 py-0.5 rounded text-[9px] font-heading font-bold border ${data.matched
                                            ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400"
                                            : "bg-red-950/20 border-red-500/20 text-red-400"
                                          }`}>
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
                          <h4 className="text-secondary font-heading mb-1 gold-glow text-center">Secondary Compatibility Tests</h4>
                          <p className="text-[10px] text-muted-foreground font-serif text-center mb-6">Crucial southern porutham checkmarks verifying physical and familial well-being.</p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-serif">
                            {[
                              { name: "Mahendra", val: matchingResult.mahendra, activeDesc: "Ensures progeny, longevity of couple and general family roots.", inactiveDesc: "Neutral or weak progeny connection." },
                              { name: "Sthree Dheerga", val: matchingResult.sthree_dheerga, activeDesc: "Ensures general wellness and great prosperity for the wife.", inactiveDesc: "Normal suitability." },
                              { name: "Vedha", val: !matchingResult.vedha, activeDesc: "No stellar conflicts (Vedha is absent - Highly Auspicious).", inactiveDesc: "Stellar conflicts detected (Vedha active)." },
                              { name: "Rajju", val: !matchingResult.rajju, activeDesc: "No body-longevity conflicts (Rajju is absent - Highly Auspicious).", inactiveDesc: "Longevity conflicts detected (Rajju active)." }
                            ].map((test, i) => (
                              <div key={i} className={`p-4 rounded-xl border flex flex-col justify-between ${test.val
                                  ? "bg-emerald-950/10 border-emerald-500/20"
                                  : "bg-red-950/10 border-red-500/20"
                                }`}>
                                <div>
                                  <div className="flex items-center justify-between font-heading font-bold text-[10px]">
                                    <span>{test.name}</span>
                                    {test.val ? (
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                    ) : (
                                      <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                                    )}
                                  </div>
                                  <p className="text-[9px] text-muted-foreground mt-2 leading-relaxed">
                                    {test.val ? test.activeDesc : test.inactiveDesc}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Reset button */}
                        <div className="mt-8 text-center">
                          <button
                            onClick={() => setMatchingResult(null)}
                            className="px-6 py-2.5 bg-primary/10 border border-primary/30 text-primary font-heading text-xs rounded-full hover:bg-primary/20 transition-all uppercase tracking-widest cursor-pointer"
                          >
                            Reset & Recalculate
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="mt-24 text-center text-muted-foreground font-serif tracking-widest text-[10px] uppercase opacity-50 space-x-3">
          <span>© 2025 Vedic Jyotish • Powered by High-Precision Ephemeris &amp; Gemini</span>
          <span>•</span>
          <a href="/privacy" className="underline underline-offset-2 hover:opacity-80 transition-opacity">Privacy Policy</a>
        </footer>
      </div>
    </main>
  );
}