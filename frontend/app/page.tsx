"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { Compass, MessageSquare, BookOpen, ChevronLeft } from "lucide-react";
import AppShell from "./components/layout/AppShell";

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

export default function Home() {
  const [step, setStep] = useState<"form" | "dashboard">("form");
  const [chartData, setChartData] = useState<any>(null);
  const [activeProfile, setActiveProfile] = useState<{
    date: string;
    time: string;
    city: any;
  } | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<"chart" | "chat" | "report">("chart");
  const [mountedTabs, setMountedTabs] = useState<Set<string>>(new Set(["chart"]));
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English");

  // Stagger the mounting of hidden background tabs to prevent UI freeze
  useEffect(() => {
    if (step === "dashboard") {
      const timer = setTimeout(() => {
        setMountedTabs((prev) => new Set([...prev, "chat", "report"]));
      }, 800); // 800ms delay to let the main ChartTab render smoothly
      return () => clearTimeout(timer);
    }
  }, [step]);

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
    setMountedTabs(new Set(["chart"]));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AppShell isDashboard={step === "dashboard"}>
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
            className="space-y-6 sm:space-y-8"
          >
            {/* Dashboard Actions */}
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setStep("form")}
                className="text-primary font-heading text-xs tracking-widest uppercase hover:underline flex items-center gap-1.5 group cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Change Birth Details</span>
              </button>
            </div>

            {/* Shimmering Tab Navigation */}
            <div className="flex border-b border-primary/20 overflow-x-auto scroll-thin select-none">
              <button
                type="button"
                onClick={() => { setActiveTab("chart"); setMountedTabs(prev => new Set([...prev, "chart"])); }}
                className={`flex items-center gap-2 px-3 sm:px-6 py-3 sm:py-4 font-heading text-xs sm:text-sm tracking-wider sm:tracking-widest uppercase border-b-2 transition-all flex-shrink-0 cursor-pointer ${
                  activeTab === "chart"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Compass className="w-4 h-4 flex-shrink-0" />
                <span><span className="hidden sm:inline">Vedic </span>Calculations</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab("chat"); setMountedTabs(prev => new Set([...prev, "chat"])); }}
                className={`flex items-center gap-2 px-3 sm:px-6 py-3 sm:py-4 font-heading text-xs sm:text-sm tracking-wider sm:tracking-widest uppercase border-b-2 transition-all flex-shrink-0 cursor-pointer ${
                  activeTab === "chat"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span>Ask AI<span className="hidden sm:inline"> Rishi</span></span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab("report"); setMountedTabs(prev => new Set([...prev, "report"])); }}
                className={`flex items-center gap-2 px-3 sm:px-6 py-3 sm:py-4 font-heading text-xs sm:text-sm tracking-wider sm:tracking-widest uppercase border-b-2 transition-all flex-shrink-0 cursor-pointer ${
                  activeTab === "report"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <BookOpen className="w-4 h-4 flex-shrink-0" />
                <span><span className="hidden sm:inline">Celestial </span>Report</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="pt-4 text-foreground">
              {mountedTabs.has("chart") && (
                <div className={activeTab === "chart" ? "block" : "hidden"}>
                  <ChartTab chartData={chartData} />
                </div>
              )}
              {mountedTabs.has("chat") && (
                <div className={activeTab === "chat" ? "block" : "hidden"}>
                  <ChatPanel
                    key={activeProfile ? `${activeProfile.date}-${activeProfile.time}-${activeProfile.city.name}` : "empty"}
                    chartData={chartData}
                    selectedLanguage={selectedLanguage}
                  />
                </div>
              )}
              {mountedTabs.has("report") && (
                <div className={activeTab === "report" ? "block" : "hidden"}>
                  <ReportTab
                    key={activeProfile ? `${activeProfile.date}-${activeProfile.time}-${activeProfile.city.name}` : "empty"}
                    chartData={chartData}
                    selectedLanguage={selectedLanguage}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}