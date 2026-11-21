"use client";

import React, { useState, useEffect } from "react";
import {
  Menu, User, Clock, BookOpen, AlertTriangle, ExternalLink,
} from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
  isDashboard?: boolean;
}

export default function AppShell({ children, isDashboard = false }: AppShellProps) {
  const [pathname, setPathname] = useState("/");
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPathname(window.location.pathname || "/");
      const isLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      if (!isLocal && sessionStorage.getItem("vj_disclaimer_accepted") !== "true") {
        setShowDisclaimer(true);
      }
    }
  }, []);

  const handleAcceptDisclaimer = () => {
    setShowDisclaimer(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("vj_disclaimer_accepted", "true");
    }
  };

  const navItems = [
    { href: "/", label: "Birth Chart & Kundali", icon: User },
    // Temporarily hidden from UI (can be re-enabled whenever needed):
    // { href: "/matching", label: "Kundali Milan & Matching", icon: Heart },
    { href: "/panchanga", label: "Vedic Panchangam", icon: Clock },
    { href: "/related-sites", label: "Our Related Sites", icon: BookOpen },
  ];

  return (
    <main className="min-h-screen selection:bg-primary/30 selection:text-primary pb-20">
      {/* Sidebar Drawer Hamburger Trigger */}
      <div className="fixed top-4 left-4 z-40">
        <button
          type="button"
          onClick={() => setIsNavOpen(true)}
          className="p-3 rounded-full bg-background/80 backdrop-blur-md border border-primary/20 shadow-md text-primary hover:bg-primary/10 transition-all flex items-center justify-center cursor-pointer"
          title="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Top-Right Branding Badge */}
      {isDashboard && (
        <div className="fixed top-4 right-4 z-40 md:hidden">
          <div className="px-3 py-2 rounded-full bg-background/85 backdrop-blur-md border border-primary/20 shadow-md">
            <span className="font-heading text-xs font-bold text-primary gold-glow tracking-tight">
              Vedic Jyotish
            </span>
          </div>
        </div>
      )}

      {/* Sidebar Drawer Backdrop Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isNavOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsNavOpen(false)}
      />

      {/* Sliding Sidebar Panel */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-72 z-50 glass-parchment shadow-2xl border-r border-primary/20 p-6 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isNavOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        }`}
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
              type="button"
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
                <a
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
                </a>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-parchment rounded-2xl vedic-border shadow-2xl max-w-lg w-full p-8 md:p-10 relative overflow-hidden">
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
                    decisions.
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="text-amber-500 text-base mt-0.5">✦</span>
                  <p>
                    <strong>Gemini Processing:</strong> Computed chart parameters are sent to
                    Google Gemini to write your readings.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground flex-wrap">
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
              type="button"
              onClick={handleAcceptDisclaimer}
              className="mt-8 w-full py-3 bg-primary text-primary-foreground font-heading rounded-full shadow-lg hover:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              I Understand — Agree &amp; Proceed
            </button>
          </div>
        </div>
      )}

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 md:pb-12 ${isDashboard ? "pt-16 md:pt-12" : "pt-20 md:pt-12"}`}>
        {/* Header */}
        <header className={`text-center ${isDashboard ? "hidden md:block mb-8 md:mb-12" : "mb-12"}`}>
          <div className="inline-block">
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-heading gold-glow mb-2">
              Vedic Jyotish
            </h1>
            <div className="flex items-center justify-center gap-4 text-secondary/80 font-serif tracking-[0.2em] uppercase text-xs md:text-sm">
              <span className="h-px w-8 bg-secondary/30" />
              ॥ ॐ गं गणपतये नमः ॥
              <span className="h-px w-8 bg-secondary/30" />
            </div>
          </div>
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
