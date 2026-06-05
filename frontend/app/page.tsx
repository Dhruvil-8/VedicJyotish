"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { Compass, MessageSquare, BookOpen, Heart, Globe, Star, ChevronLeft } from "lucide-react";
import AppShell from "./components/layout/AppShell";
import { LANGUAGES } from "./lib/constants";

// --- Dynamic Imports for Dashboard Tabs to optimize bundle size ---
const BirthForm = dynamic(() => import("./components/kundli/BirthForm"), {
  loading: () => (
    <div className="text-center py-12 font-serif text-sm text-primary animate-pulse">
      Preparing birth chart form...
    </div>
  ),
});

const ChartTab = dynamic(() => import("./components/kundli/ChartTab"), {
  loading: () => (
    <div className="text-center py-12 font-serif text-sm text-primary animate-pulse">
      Loading Calculations...
    </div>
  ),
});

const ChatPanel = dynamic(() => import("./components/kundli/ChatPanel"), {
  loading: () => (
    <div className="text-center py-12 font-serif text-sm text-primary animate-pulse">
      Preparing Chat...
    </div>
  ),
});

const ReportTab = dynamic(() => import("./components/kundli/ReportTab"), {
  loading: () => (
    <div className="text-center py-12 font-serif text-sm text-primary animate-pulse">
      Loading Report Interface...
    </div>
  ),
});

const MatchingTab = dynamic(() => import("./components/kundli/MatchingTab"), {
  loading: () => (
    <div className="text-center py-12 font-serif text-sm text-primary animate-pulse">
      Preparing Matching...
    </div>
  ),
});

export default function Home() {
  const [step, setStep] = useState<"form" | "dashboard">("form");
  const [chartData, setChartData] = useState<any>(null);
  const [activeProfile, setActiveProfile] = useState<{
    date: string;
    time: string;
    city: any;
  } | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<"chart" | "chat" | "report" | "matching">("chart");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English");

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

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

  const handleCalculate = (data: {
    chartData: any;
    date: string;
    time: string;
    city: any;
    language: string;
  }) => {
    setChartData(data.chartData);
    setActiveProfile({
      date: data.date,
      time: data.time,
      city: data.city,
    });
    setSelectedLanguage(data.language);
    setStep("dashboard");
    setActiveTab("chart");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AppShell>
      <AnimatePresence mode="wait">
        {step === "form" ? (
          <BirthForm
            key="birth-form"
            onCalculate={handleCalculate}
            defaultDate={activeProfile?.date}
            defaultTime={activeProfile?.time}
            defaultLanguage={selectedLanguage}
          />
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
                type="button"
                onClick={() => setStep("form")}
                className="text-primary font-heading text-xs tracking-widest uppercase hover:underline flex items-center gap-2 group cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
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
                      <option
                        key={lang.code}
                        value={lang.code}
                        className="bg-background text-foreground normal-case font-serif"
                      >
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>

                {isInstallable && (
                  <button
                    type="button"
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
                type="button"
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
                type="button"
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
                type="button"
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
                type="button"
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
            <div className="pt-4 text-foreground">
              <div className={activeTab === "chart" ? "block" : "hidden"}>
                <ChartTab chartData={chartData} />
              </div>
              <div className={activeTab === "chat" ? "block" : "hidden"}>
                <ChatPanel
                  key={activeProfile ? `${activeProfile.date}-${activeProfile.time}-${activeProfile.city.name}` : "empty"}
                  chartData={chartData}
                  selectedLanguage={selectedLanguage}
                />
              </div>
              <div className={activeTab === "report" ? "block" : "hidden"}>
                <ReportTab
                  key={activeProfile ? `${activeProfile.date}-${activeProfile.time}-${activeProfile.city.name}` : "empty"}
                  chartData={chartData}
                  selectedLanguage={selectedLanguage}
                />
              </div>
              <div className={activeTab === "matching" ? "block" : "hidden"}>
                <MatchingTab activeProfile={activeProfile} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}