"use client";

import React, { useState } from "react";
import { MessageSquare, ExternalLink, Send } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { chatWithAstrologerStream } from "../ui/api";
import { useToast } from "../../hooks/useToast";

interface ChatPanelProps {
  chartData: any;
  selectedLanguage: string;
}

export default function ChatPanel({
  chartData,
  selectedLanguage,
}: ChatPanelProps) {
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [userQuestion, setUserQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const { showToast } = useToast();
  const MAX_QUESTIONS = 3;
  const userQuestionCount = chatHistory.filter((m) => m.role === "user").length;
  const chatLimitReached = userQuestionCount >= MAX_QUESTIONS;

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
          setChatHistory([
            ...updatedHistory,
            { role: "model", text: err || "Error connecting to the stars." },
          ]);
          setChatLoading(false);
        }
      );
    } catch (e) {
      setChatHistory([
        ...updatedHistory,
        { role: "model", text: "Error connecting to the stars." },
      ]);
      setChatLoading(false);
    }
  };

  const handleExport = () => {
    const header = `Vedic Jyotish — Chat History\nGenerated: ${new Date().toLocaleString()}\n${"═".repeat(
      50
    )}\n\n`;
    const content = chatHistory
      .map((m) => `[${m.role === "user" ? "You" : "Rishi"}]:\n${m.text}\n`)
      .join("\n---\n\n");
    const blob = new Blob([header + content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vedic_chat_history.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fadeIn">
      <div className="glass-parchment rounded-2xl overflow-hidden flex flex-col h-[600px] shadow-2xl border border-primary/20 max-w-4xl mx-auto">
        <div className="p-4 bg-primary/10 border-b border-primary/20 flex items-center justify-between">
          <h4 className="font-heading text-primary flex items-center gap-2 text-sm">
            <MessageSquare className="w-4 h-4" /> Ask the Rishi
          </h4>
          {chatHistory.length > 0 && (
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-heading text-primary border border-primary/30 rounded-full hover:bg-primary/10 transition-all cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" /> Export
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-thin">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] text-primary font-heading flex-shrink-0">
              Rishi
            </div>
            <div className="bg-muted/40 p-3 rounded-xl rounded-tl-none font-serif text-sm text-foreground">
              Humble greetings. I have studied your {chartData.ascendant.sign} chart. How may I guide
              you through the cosmic threads today?
            </div>
          </div>

          {chatHistory.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-heading flex-shrink-0 ${
                  msg.role === "user"
                    ? "bg-secondary/20 text-secondary border border-secondary/30"
                    : "bg-primary/20 text-primary border border-primary/30"
                }`}
              >
                {msg.role === "user" ? "You" : "Rishi"}
              </div>
              <div
                className={`p-3 rounded-xl max-w-[85%] font-serif text-sm ${
                  msg.role === "user"
                    ? "bg-secondary/10 text-secondary rounded-tr-none border border-secondary/10"
                    : "bg-muted/40 rounded-tl-none text-foreground/90"
                }`}
              >
                <div className="markdown-chat">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
          {chatLoading && (
            <div className="text-[10px] text-primary animate-pulse font-heading tracking-widest pl-11">
              Aligning with stars...
            </div>
          )}
        </div>

        <div className="p-4 bg-muted/20 border-t border-border/30">
          {chatLimitReached ? (
            <div className="text-center py-2 text-xs text-muted-foreground font-serif italic">
              You've reached the {MAX_QUESTIONS}-question limit for this session. Generate the full
              report for deeper analysis.
            </div>
          ) : (
            <>
              <div className="text-right text-[10px] text-muted-foreground mb-1 font-heading">
                {userQuestionCount}/{MAX_QUESTIONS} questions used
              </div>
              <div className="relative">
                <input
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleChat()}
                  placeholder="Your question..."
                  className="w-full bg-background/50 border border-border/50 rounded-lg py-3 pl-4 pr-12 text-sm font-serif outline-none focus:border-primary transition-all text-foreground"
                />
                <button
                  type="button"
                  onClick={handleChat}
                  disabled={chatLoading}
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
  );
}
