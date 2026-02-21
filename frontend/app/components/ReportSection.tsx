"use client";

import { Printer, Sparkles, FileText } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

interface ReportSectionProps {
    report: string;
    onDownload?: () => void;
}

export default function ReportSection({ report, onDownload }: ReportSectionProps) {
    const handleDownload = () => {
        const reportEl = document.getElementById("vedic-report-content");
        if (!reportEl) return;

        // Create a hidden iframe with ONLY the report content
        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "0";
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow?.document;
        if (!iframeDoc) return;

        // Write a self-contained HTML document with inline styles
        iframeDoc.open();
        iframeDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Vedic Jyotish Report</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Libre+Baskerville:wght@400;700&display=swap');

                    * { margin: 0; padding: 0; box-sizing: border-box; }

                    body {
                        font-family: 'Libre Baskerville', Georgia, serif;
                        color: #1a1a1a;
                        background: #fff;
                        padding: 40px 50px;
                        font-size: 11pt;
                        line-height: 1.7;
                    }

                    .report-header {
                        text-align: center;
                        padding-bottom: 16px;
                        margin-bottom: 24px;
                        border-bottom: 2px solid #8B4513;
                    }

                    .report-header h1 {
                        font-family: 'Cinzel', serif;
                        font-size: 18pt;
                        color: #8B4513;
                        letter-spacing: 0.1em;
                        text-transform: uppercase;
                    }

                    h2 {
                        font-family: 'Cinzel', serif;
                        font-size: 13pt;
                        color: #5a2d0c;
                        margin-top: 18pt;
                        margin-bottom: 6pt;
                        padding-bottom: 4px;
                        border-bottom: 1px solid rgba(139, 69, 19, 0.25);
                        letter-spacing: 0.05em;
                        page-break-after: avoid;
                    }

                    h3 {
                        font-family: 'Cinzel', serif;
                        font-size: 11pt;
                        color: #7a5520;
                        margin-top: 10pt;
                        margin-bottom: 4pt;
                        page-break-after: avoid;
                    }

                    p {
                        margin-bottom: 8pt;
                        line-height: 1.7;
                        orphans: 3;
                        widows: 3;
                    }

                    strong { color: #5a2d0c; }

                    ul {
                        list-style-type: disc;
                        margin-left: 20px;
                        margin-bottom: 8pt;
                    }

                    li {
                        margin-bottom: 3pt;
                        line-height: 1.6;
                    }

                    em { font-style: italic; color: #555; }

                    .report-footer {
                        margin-top: 30pt;
                        padding-top: 12pt;
                        border-top: 1px solid rgba(139, 69, 19, 0.2);
                        text-align: center;
                        font-size: 8pt;
                        color: rgba(100, 80, 60, 0.6);
                        letter-spacing: 0.15em;
                        text-transform: uppercase;
                    }
                </style>
            </head>
            <body>
                <div class="report-header">
                    <h1>✦ Vedic Jyotish — Celestial Insight Report ✦</h1>
                </div>
                <div class="report-body">
                    ${reportEl.querySelector('.markdown-report')?.innerHTML || ''}
                </div>
                <div class="report-footer">
                    — Vedic Jyotish • Sacred Calculations —
                </div>
            </body>
            </html>
        `);
        iframeDoc.close();

        // Wait for fonts to load, then print
        setTimeout(() => {
            iframe.contentWindow?.print();
            // Remove iframe after print dialog closes
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        }, 500);

        if (onDownload) onDownload();
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-4xl mx-auto"
        >
            <div className="glass-parchment rounded-3xl vedic-border shadow-2xl overflow-hidden relative">
                {/* Ornamental Header */}
                <div className="bg-primary/10 border-b border-primary/20 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg text-primary">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-heading text-primary gold-glow">Celestial Insight Report</h2>
                    </div>
                    <button
                        onClick={handleDownload}
                        className="group flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-heading text-xs rounded-full hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
                    >
                        <Printer className="w-4 h-4" /> Download PDF
                    </button>
                </div>

                {/* Report Content */}
                <div id="vedic-report-content" className="p-8 md:p-12 font-serif leading-relaxed relative min-h-[600px]" style={{ backgroundColor: '#f5e6c8', color: '#1a1a1a' }}>
                    {/* Subtle Watermark/Pattern */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center" style={{ opacity: 0.03 }}>
                        <FileText className="w-[500px] h-[500px] -rotate-12" style={{ color: '#1a1a1a' }} />
                    </div>

                    <div className="relative z-10 markdown-report">
                        <ReactMarkdown>{report}</ReactMarkdown>
                    </div>

                    {/* Footer Decoration */}
                    <div className="mt-12 pt-8 text-center flex items-center justify-center gap-4 text-xs tracking-widest uppercase" style={{ borderTop: '1px solid rgba(139, 69, 19, 0.2)', color: 'rgba(100, 80, 60, 0.6)' }}>
                        <span className="h-px w-8" style={{ backgroundColor: 'rgba(139, 69, 19, 0.2)' }} />
                        Vedic Jyotish • Sacred Calculations
                        <span className="h-px w-8" style={{ backgroundColor: 'rgba(139, 69, 19, 0.2)' }} />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
