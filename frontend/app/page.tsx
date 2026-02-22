"use client";

import React, { useState, useEffect } from "react";
import { Search, Sparkles, MessageSquare, Send, Calendar, Clock, MapPin, ChevronRight, Moon, Star, Wand2, AlertTriangle, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { searchCity, calculateChart, chatWithAstrologer, generateReport } from "./components/ui/api";
import NorthIndianChart from "./components/NorthIndianChart";
import PlanetaryTable from "./components/PlanetaryTable";
import DashaTimeline from "./components/DashaTimeline";
import YogaCards from "./components/YogaCards";
import ReportSection from "./components/ReportSection";

export default function Home() {
  // --- State ---
  const [step, setStep] = useState<"form" | "dashboard">("form");
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  // Form Data
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

  // Chat Data
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [userQuestion, setUserQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Disclaimer popup
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  const MAX_QUESTIONS = 3;
  const userQuestionCount = chatHistory.filter((m) => m.role === "user").length;
  const chatLimitReached = userQuestionCount >= MAX_QUESTIONS;

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

  const selectCity = (city: any) => {
    setSelectedCity(city);
    setCityInput(city.name);
    setCityResults([]);
  };

  const handleCalculate = async () => {
    if (!selectedCity) return alert("Please select a city from the list");
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      alert("Error calculating chart. Check inputs.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!chartData || reportLoading) return;
    setReportLoading(true);
    try {
      const res = await generateReport(chartData);
      setAiReport(res.report);
    } catch (e) {
      alert("Celestial alignment failed. Please try again.");
    } finally {
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

    try {
      const res = await chatWithAstrologer({
        chart_data: chartData,
        question: newMsg.text,
        history: updatedHistory,
      });
      setChatHistory([...updatedHistory, { role: "model", text: res.response }]);
    } catch (e) {
      setChatHistory([...updatedHistory, { role: "model", text: "Error connecting to the stars." }]);
    } finally {
      setChatLoading(false);
    }
  };

  // --- Render ---

  return (
    <main className="min-h-screen selection:bg-primary/30 selection:text-primary">

      {/* Disclaimer Modal */}
      <AnimatePresence>
        {showDisclaimer && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
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

              <div className="space-y-4 font-serif text-sm text-foreground/80 leading-relaxed">
                <p>
                  <strong className="text-primary">This is an AI-generated astrological analysis tool</strong> currently in <strong>testing/beta</strong> phase. All interpretations are produced by AI and should be treated as <strong>educational and informational content only</strong>.
                </p>
                <p>
                  This tool does <strong>not</strong> replace a qualified Vedic astrologer. Do not make critical life decisions based solely on this analysis.
                </p>
                <p>
                  For a more detailed and accurate analysis, you can follow the{" "}
                  <a
                    href="https://github.com/Dhruvil-8/VedicJyotish/blob/main/ADDITIONAL_ASTROLOGY_RESOURCES.md.md"
                    target="_blank" rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2 hover:text-primary/80 inline-flex items-center gap-1"
                  >
                    free detailed analysis method <ExternalLink className="w-3 h-3" />
                  </a>
                  .
                </p>
                <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                  <span>Open Source:</span>
                  <a
                    href="https://github.com/Dhruvil-8/VedicJyotish"
                    target="_blank" rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2 hover:text-primary/80 inline-flex items-center gap-1"
                  >
                    github.com/Dhruvil-8/VedicJyotish <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <button
                onClick={() => setShowDisclaimer(false)}
                className="mt-8 w-full py-3 bg-primary text-primary-foreground font-heading rounded-full shadow-lg hover:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
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
              Ancient Wisdom • Modern Insight
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
                              className="w-full text-left p-3 hover:bg-primary/10 font-serif text-sm border-b border-border/20 last:border-0 transition-colors"
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
                    className="w-full group bg-primary text-primary-foreground font-heading py-4 rounded-lg shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              className="space-y-8 md:space-y-12"
            >
              {/* Dashboard Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <button
                  onClick={() => setStep("form")}
                  className="text-primary font-heading text-xs tracking-widest uppercase hover:underline flex items-center gap-2 group"
                >
                  <ChevronRight className="w-3 h-3 rotate-180 group-hover:-translate-x-1 transition-transform" />
                  Change Birth Details
                </button>

                <div className="flex items-center gap-3">
                  {isInstallable && (
                    <button
                      onClick={handleInstall}
                      className="flex items-center gap-2 px-4 py-2 bg-secondary/10 border border-secondary/30 text-secondary font-heading text-[10px] rounded-full hover:bg-secondary/20 transition-all"
                    >
                      <Star className="w-3 h-3" /> Install App
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visuals Column */}
                <div className="lg:col-span-2 space-y-8">
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

                  {/* Charts Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-parchment p-6 rounded-2xl vedic-border shadow-xl">
                      <NorthIndianChart
                        chartData={chartData.chart_data}
                        ascendantSign={chartData.ascendant.sign}
                        title="D1 Lagna (Birth)"
                      />
                    </div>
                    <div className="glass-parchment p-6 rounded-2xl vedic-border shadow-xl">
                      <NorthIndianChart
                        chartData={chartData.navamsa_chart || {}}
                        ascendantSign={chartData.navamsa_chart?.house_1?.sign || chartData.ascendant.sign}
                        title="D9 Navamsa (Destiny)"
                      />
                    </div>
                  </div>

                  {/* Planetary Table */}
                  <div className="glass-parchment p-6 rounded-2xl shadow-xl overflow-hidden">
                    <h3 className="text-secondary font-heading mb-4 gold-glow">Planetary Details</h3>
                    <PlanetaryTable planets={chartData.planetary_table || []} />
                  </div>

                  {/* Yogas */}
                  <YogaCards yogas={chartData.yogas || []} />
                </div>

                {/* Insights Column */}
                <div className="space-y-8">
                  {/* Chat Section */}
                  <div className="glass-parchment rounded-2xl overflow-hidden flex flex-col h-[600px] shadow-2xl border-primary/20">
                    <div className="p-4 bg-primary/10 border-b border-primary/20 flex items-center justify-between">
                      <h4 className="font-heading text-primary flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" /> Ask the Rishi
                      </h4>
                      {chatHistory.length > 0 && (
                        <button
                          onClick={() => {
                            const header = `Vedic Astro AI — Chat History\nGenerated: ${new Date().toLocaleString()}\n${'═'.repeat(50)}\n\n`;
                            const content = chatHistory.map(m => `[${m.role === 'user' ? 'You' : 'Rishi'}]:\n${m.text}\n`).join('\n---\n\n');
                            const blob = new Blob([header + content], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'vedic_chat_history.txt';
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-heading text-primary border border-primary/30 rounded-full hover:bg-primary/10 transition-all"
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
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-primary hover:scale-110 active:scale-95 transition-all"
                            >
                              <Send className="w-5 h-5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Dasha Timeline */}
                  <DashaTimeline timeline={chartData.vimshottari_timeline || []} className="bg-card/30 p-6 rounded-2xl" />
                </div>
              </div>

              {/* AI Report Section - Full Width */}
              <div className="pt-8 border-t border-primary/10">
                {!aiReport ? (
                  <div className="text-center py-12 glass-parchment rounded-3xl border-dashed border-2 border-primary/30">
                    <Wand2 className="w-12 h-12 text-primary/40 mx-auto mb-4" />
                    <h3 className="text-2xl font-heading text-primary gold-glow mb-4">Deep Cosmic Analysis</h3>
                    <p className="max-w-md mx-auto text-muted-foreground font-serif italic mb-8 px-4">
                      Generate a comprehensive AI-powered report.
                    </p>
                    <button
                      onClick={handleGenerateReport}
                      disabled={reportLoading}
                      className="px-8 py-4 bg-primary text-primary-foreground font-heading rounded-full shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-3 mx-auto"
                    >
                      {reportLoading ? (
                        <>Aligning Multiverses... <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /></>
                      ) : (
                        <>Generate Full Report <Sparkles className="w-5 h-5" /></>
                      )}
                    </button>
                  </div>
                ) : (
                  <ReportSection report={aiReport} />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="mt-24 text-center text-muted-foreground font-serif tracking-widest text-[10px] uppercase opacity-50">
          <p>© 2025 Vedic Jyotish • Powered by High-Precision Ephemeris & Gemini</p>
        </footer>
      </div>
    </main>
  );
}