"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, User, Clock, BookOpen, AlertTriangle, ExternalLink, Star, Heart,
} from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShowDisclaimer(sessionStorage.getItem("vj_disclaimer_accepted") !== "true");
    }
  }, []);

  const handleAcceptDisclaimer = () => {
    setShowDisclaimer(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("vj_disclaimer_accepted", "true");
    }
  };

  const [uiLang, setUiLang] = useState<"en" | "gu" | "hi">("en");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("vedic_ui_lang") as "en" | "gu" | "hi";
      if (savedLang) setUiLang(savedLang);
    }
  }, []);

  const changeLanguage = (lang: "en" | "gu" | "hi") => {
    setUiLang(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("vedic_ui_lang", lang);
      window.dispatchEvent(new CustomEvent("vedic_lang_changed", { detail: lang }));
    }
  };

  const navLabels = {
    en: {
      birth: "Birth Chart & Kundali",
      matching: "Kundali Milan & Matching",
      panchang: "Vedic Panchangam",
      related: "Our Related Sites",
    },
    gu: {
      birth: "જન્મ કુંડળી (Kundali)",
      matching: "કુંડળી મિલન (Matching)",
      panchang: "વૈદિક પંચાંગ (Panchangam)",
      related: "અન્ય આધ્યાત્મિક સાઇટ્સ",
    },
    hi: {
      birth: "जन्म कुण्डली (Kundali)",
      matching: "कुण्डली मिलान (Matching)",
      panchang: "वैदिक पंचांग (Panchangam)",
      related: "अन्य आध्यात्मिक साइट्स",
    },
  };

  const navItems = [
    { href: "/", label: navLabels[uiLang].birth, icon: User },
    { href: "/matching", label: navLabels[uiLang].matching, icon: Heart },
    { href: "/panchanga", label: navLabels[uiLang].panchang, icon: Clock },
    { href: "/related-sites", label: navLabels[uiLang].related, icon: BookOpen },
  ];

  return (
    <main className="min-h-screen selection:bg-primary/30 selection:text-primary pb-20">
      {/* Top Floating Controls: Sidebar Trigger & Language Selector */}
      <div className="fixed top-4 left-4 z-40 flex items-center gap-2">
        <button
          onClick={() => setIsNavOpen(true)}
          className="p-3 rounded-full bg-background/80 backdrop-blur-md border border-primary/20 shadow-md text-primary hover:bg-primary/10 transition-all flex items-center justify-center cursor-pointer"
          title="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Language Switcher Pill */}
        <div className="bg-background/80 backdrop-blur-md border border-primary/20 shadow-md rounded-full p-1 flex items-center text-[10px] font-heading">
          <button
            type="button"
            onClick={() => changeLanguage("en")}
            className={`px-2 py-1 rounded-full transition-all cursor-pointer ${
              uiLang === "en" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => changeLanguage("gu")}
            className={`px-2 py-1 rounded-full transition-all cursor-pointer ${
              uiLang === "gu" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            ગુજ
          </button>
          <button
            type="button"
            onClick={() => changeLanguage("hi")}
            className={`px-2 py-1 rounded-full transition-all cursor-pointer ${
              uiLang === "hi" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            हिन्दी
          </button>
        </div>
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
                    <span className="font-heading text-base font-bold text-primary">
                      Vedic Jyotish
                    </span>
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
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsNavOpen(false)}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left font-heading text-sm transition-all cursor-pointer ${
                          isActive
                            ? "bg-primary/15 border-primary/30 text-primary font-bold shadow-sm"
                            : "bg-transparent border-transparent text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Footer details */}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Disclaimer Modal */}
      <AnimatePresence>
        {showDisclaimer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
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
                  Welcome to Vedic Jyotish. Please read our quick notice before calculating your
                  chart:
                </p>

                <div className="space-y-3">
                  <div className="flex gap-3">
                    <span className="text-amber-500 text-base mt-0.5">✦</span>
                    <p>
                      <strong>AI Beta Tool:</strong> Interpretations are generated by AI for{" "}
                      <strong>educational and informational use only</strong>, not critical life
                      decisions. Currently, this tool is in the development and testing phase.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-amber-500 text-base mt-0.5">✦</span>
                    <p>
                      <strong>Gemini Processing:</strong> Computed chart parameters are sent to
                      Google Gemini (Free Tier) to write your readings.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground pt-1 border-t border-amber-900/10">
                  For deeper study, see our{" "}
                  <a
                    href="https://github.com/Dhruvil-8/VedicJyotish/blob/main/ADDITIONAL_ASTROLOGY_RESOURCES.md.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary/80"
                  >
                    free detailed analysis guide
                  </a>
                  .
                </p>

                <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground flex-wrap">
                  <span>Open Source:</span>
                  <a
                    href="https://github.com/Dhruvil-8/VedicJyotish"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary/80 inline-flex items-center gap-0.5"
                  >
                    GitHub <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="mx-1 opacity-40">•</span>
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary/80 inline-flex items-center gap-0.5"
                  >
                    Privacy Policy <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <button
                onClick={handleAcceptDisclaimer}
                className="mt-8 w-full py-3 bg-primary text-primary-foreground font-heading rounded-full shadow-lg hover:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                I Understand — Agree &amp; Proceed
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-12 pb-8 md:pb-12">
        {/* Header */}
        <header className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block"
          >
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-heading gold-glow mb-2">
              Vedic Jyotish
            </h1>
            <div className="flex items-center justify-center gap-4 text-secondary/80 font-serif tracking-[0.2em] uppercase text-xs md:text-sm">
              <span className="h-px w-8 bg-secondary/30" />
              ॥ ॐ गं गणपतये नमः ॥
              <span className="h-px w-8 bg-secondary/30" />
            </div>
          </motion.div>
        </header>

        {/* Page Content */}
        {children}

        {/* Footer */}
        <footer className="mt-24 text-center text-muted-foreground font-serif tracking-widest text-[10px] uppercase opacity-50 space-x-3">
          <span>© 2026 Vedic Jyotish • Powered by High-Precision Ephemeris &amp; Gemini</span>
          <span>•</span>
          <a
            href="/privacy"
            className="underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            Privacy Policy
          </a>
        </footer>
      </div>
    </main>
  );
}
