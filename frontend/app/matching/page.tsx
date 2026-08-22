import React from "react";
import AppShell from "../components/layout/AppShell";
import MatchingTab from "../components/kundli/MatchingTab";

export const metadata = {
  title: "Kundali Milan & Compatibility Matching | Vedic Jyotish",
  description:
    "Comprehensive 36 Guna Ashta-Koota Vedic Horoscope Compatibility Matching for Marriage and Relationships.",
};

export default function MatchingPage() {
  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6 pt-4">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl sm:text-4xl font-heading text-primary gold-glow">
            Kundali Milan & Compatibility
          </h1>
          <p className="text-sm font-serif text-muted-foreground max-w-xl mx-auto italic">
            Ancient 36 Gunas Ashta-Koota matching analysis evaluating mental, emotional, spiritual, and physical harmony for a prosperous union.
          </p>
        </div>
        <MatchingTab activeProfile={null} />
      </div>
    </AppShell>
  );
}
