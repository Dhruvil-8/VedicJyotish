"use client";

import React from "react";
import { Wand2, Sparkles } from "lucide-react";
import ReportSection from "../ReportSection";
import { generateReportStream } from "../ui/api";
import { useToast } from "../../hooks/useToast";

interface ReportTabProps {
  chartData: any;
  selectedLanguage: string;
  aiReport: string;
  setAiReport: React.Dispatch<React.SetStateAction<string>>;
  reportLoading: boolean;
  setReportLoading: (val: boolean) => void;
}

export default function ReportTab({
  chartData,
  selectedLanguage,
  aiReport,
  setAiReport,
  reportLoading,
  setReportLoading,
}: ReportTabProps) {
  const { showToast } = useToast();

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
          showToast(err || "Celestial alignment failed. Please try again.", "error");
          setReportLoading(false);
        }
      );
    } catch (e) {
      showToast("Celestial alignment failed. Please try again.", "error");
      setReportLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      {!aiReport && !reportLoading ? (
        <div className="text-center py-12 glass-parchment rounded-3xl border-dashed border-2 border-primary/30 max-w-4xl mx-auto">
          <Wand2 className="w-12 h-12 text-primary/40 mx-auto mb-4 animate-pulse" />
          <h3 className="text-2xl font-heading text-primary gold-glow mb-4">Deep Cosmic Analysis</h3>
          <p className="max-w-md mx-auto text-muted-foreground font-serif italic mb-8 px-4 leading-relaxed text-sm">
            Generate a comprehensive AI-powered report based on Sanatan Jyotish guidelines, outlining
            past life karma, health warnings, dasha timings, and custom remedies.
          </p>
          <button
            type="button"
            onClick={handleGenerateReport}
            className="px-8 py-4 bg-primary text-primary-foreground font-heading rounded-full shadow-lg hover:shadow-primary/30 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center gap-3 mx-auto cursor-pointer text-sm"
          >
            Generate Full Report <Sparkles className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <ReportSection report={aiReport} isStreaming={reportLoading} />
      )}
    </div>
  );
}
