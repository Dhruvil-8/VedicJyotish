"use client";

import React, { useState, useEffect } from "react";
import {
  Search, Sparkles, MessageSquare, Send, Calendar, Clock, MapPin, ChevronRight,
  Moon, Star, Wand2, AlertTriangle, ExternalLink, CheckCircle, XCircle, Info,
  Compass, BookOpen, Heart, ChevronDown, ChevronUp, RefreshCw, FileText, User
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
  // --- States ---
  const [step, setStep] = useState<"form" | "dashboard">("form");
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

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
        time,
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
        chartData,
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
          chart_data: chartData,
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
          time: matchingBoyTime,
          city: matchingBoySelectedCity.name,
          lat: matchingBoySelectedCity.lat,
          lon: matchingBoySelectedCity.lon,
        },
        girl: {
          date: matchingGirlDate,
          time: matchingGirlTime,
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
          {step === "form" ? (
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
                      <input
                        type="text" value={date} onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-muted/30 border border-border/50 rounded-lg p-3 font-serif focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs font-heading text-secondary tracking-widest uppercase">
                        <Clock className="w-3.5 h-3.5" /> Time (HH:MM, 24h)
                      </label>
                      <input
                        type="text" value={time} onChange={(e) => setTime(e.target.value)}
                        className="w-full bg-muted/30 border border-border/50 rounded-lg p-3 font-serif focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all"
                      />
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

                <div className="flex items-center gap-3">
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
                  className={`flex items-center gap-2 px-6 py-4 font-heading text-xs md:text-sm tracking-widest uppercase border-b-2 transition-all flex-shrink-0 cursor-pointer ${
                    activeTab === "chart"
                      ? "border-primary text-primary font-bold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Compass className="w-4 h-4 flex-shrink-0" /> Vedic Calculations
                </button>
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`flex items-center gap-2 px-6 py-4 font-heading text-xs md:text-sm tracking-widest uppercase border-b-2 transition-all flex-shrink-0 cursor-pointer ${
                    activeTab === "chat"
                      ? "border-primary text-primary font-bold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0" /> Ask AI Rishi
                </button>
                <button
                  onClick={() => setActiveTab("report")}
                  className={`flex items-center gap-2 px-6 py-4 font-heading text-xs md:text-sm tracking-widest uppercase border-b-2 transition-all flex-shrink-0 cursor-pointer ${
                    activeTab === "report"
                      ? "border-primary text-primary font-bold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <BookOpen className="w-4 h-4 flex-shrink-0" /> Celestial Report
                </button>
                <button
                  onClick={() => setActiveTab("matching")}
                  className={`flex items-center gap-2 px-6 py-4 font-heading text-xs md:text-sm tracking-widest uppercase border-b-2 transition-all flex-shrink-0 cursor-pointer ${
                    activeTab === "matching"
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

                      {digBalaPlanets.length > 0 && (
                        <Accordion id="digbala" title="Planetary Strengths (Dig Bala)" explanation="Directional strength coordinates determining a planet's capability to manifest outcomes." icon={Star} isOpen={expandedAccordions.digbala || false} onToggle={() => toggleAccordion("digbala")}>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {digBalaPlanets.map((p, i) => (
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
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-heading font-bold border ${
                                        details.net_argala_status === "Active"
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
                            <div className={`p-5 rounded-2xl border ${
                              chartData.sade_sati.is_active
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
                              const header = `Vedic Astro AI — Chat History\nGenerated: ${new Date().toLocaleString()}\n${"═".repeat(50)}\n\n`;
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
                                <input
                                  type="text" value={matchingBoyDate} onChange={(e) => setMatchingBoyDate(e.target.value)}
                                  className="w-full bg-muted/20 border border-border/50 rounded-lg p-2.5 font-serif text-sm focus:border-primary outline-none transition-all"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="flex items-center gap-1.5 text-[10px] font-heading text-secondary tracking-wider uppercase">
                                  <Clock className="w-3 h-3" /> Time (HH:MM, 24h)
                                </label>
                                <input
                                  type="text" value={matchingBoyTime} onChange={(e) => setMatchingBoyTime(e.target.value)}
                                  className="w-full bg-muted/20 border border-border/50 rounded-lg p-2.5 font-serif text-sm focus:border-primary outline-none transition-all"
                                />
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
                                <input
                                  type="text" value={matchingGirlDate} onChange={(e) => setMatchingGirlDate(e.target.value)}
                                  className="w-full bg-muted/20 border border-border/50 rounded-lg p-2.5 font-serif text-sm focus:border-primary outline-none transition-all"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="flex items-center gap-1.5 text-[10px] font-heading text-secondary tracking-wider uppercase">
                                  <Clock className="w-3 h-3" /> Time (HH:MM, 24h)
                                </label>
                                <input
                                  type="text" value={matchingGirlTime} onChange={(e) => setMatchingGirlTime(e.target.value)}
                                  className="w-full bg-muted/20 border border-border/50 rounded-lg p-2.5 font-serif text-sm focus:border-primary outline-none transition-all"
                                />
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
                            <div className={`mt-5 px-5 py-1.5 rounded-full border font-heading text-[10px] uppercase tracking-wider ${
                              matchingResult.total_score >= 28
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
                                        <span className={`px-2.5 py-0.5 rounded text-[9px] font-heading font-bold border ${
                                          data.matched
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
                              <div key={i} className={`p-4 rounded-xl border flex flex-col justify-between ${
                                test.val
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