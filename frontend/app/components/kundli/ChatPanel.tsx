"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  ExternalLink,
  Send,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Mic,
  MicOff,
  Briefcase,
  Heart,
  Coins,
  ShieldAlert,
  Clock,
  Compass,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { chatWithAstrologerStream } from "../ui/api";
import { useToast } from "../../hooks/useToast";

interface ChatPanelProps {
  chartData: any;
  selectedLanguage: string;
}

const PROMPT_SUGGESTIONS = [
  {
    icon: Briefcase,
    category: "Career",
    prompt: "What does my 10th house and planetary alignment indicate for my career trajectory?",
  },
  {
    icon: Heart,
    category: "Relationships",
    prompt: "What are the marriage, relationship timing, and spousal indicators in my D1 & D9 charts?",
  },
  {
    icon: Coins,
    category: "Wealth",
    prompt: "What financial potentials, wealth-generating yogas, or income streams exist in my chart?",
  },
  {
    icon: Clock,
    category: "Dasha Timing",
    prompt: "How will my current Vimshottari Mahadasha and upcoming sub-periods unfold for me?",
  },
  {
    icon: ShieldAlert,
    category: "Doshas & Health",
    prompt: "Are there any sensitive planetary afflictions, doshas, or health vulnerabilities to be mindful of?",
  },
  {
    icon: Compass,
    category: "Soul Purpose",
    prompt: "What is my core life purpose and spiritual direction according to my Atmakaraka and Lagna?",
  },
];

export default function ChatPanel({
  chartData,
  selectedLanguage,
}: ChatPanelProps) {
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [userQuestion, setUserQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const { showToast } = useToast();

  const MAX_QUESTIONS = 3;
  const userQuestionCount = chatHistory.filter((m) => m.role === "user").length;
  const chatLimitReached = userQuestionCount >= MAX_QUESTIONS;

  // Extract quick chart summary chips
  const ascSign = chartData?.ascendant?.sign || "Lagna";
  const moonSign = chartData?.moon_intelligence?.sign || "Moon";
  const moonNakshatra = chartData?.moon_intelligence?.nakshatra || "";
  
  // Safely find current active dasha
  const currentDashaLord = chartData?.vimshottari_timeline?.[0]?.lord || "";

  // Auto-scroll to bottom smoothly on message update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatLoading]);

  // Setup Web Speech API for voice recognition if supported
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = selectedLanguage === "hi" ? "hi-IN" : "en-US";

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setUserQuestion((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setIsListening(false);
          showToast("Voice captured!", "success");
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [selectedLanguage, showToast]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      showToast("Voice input not supported on this browser", "info");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        showToast("Listening... speak your question", "info");
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserQuestion(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const sendQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || chatLimitReached || chatLoading) return;

    const newMsg = { role: "user", text: trimmed };
    const updatedHistory = [...chatHistory, newMsg];

    // Update UI immediately
    setChatHistory(updatedHistory);
    setUserQuestion("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setChatLoading(true);

    const streamingMsg = { role: "model", text: "" };
    const historyWithPlaceholder = [...updatedHistory, streamingMsg];
    setChatHistory(historyWithPlaceholder);

    try {
      let accumulated = "";
      await chatWithAstrologerStream(
        {
          chart_data: { ...chartData, language: selectedLanguage },
          question: trimmed,
          history: chatHistory, // Pass prior history so current question isn't duplicated
        },
        (chunk) => {
          accumulated += chunk;
          setChatHistory([...updatedHistory, { role: "model", text: accumulated }]);
        },
        () => setChatLoading(false),
        (err) => {
          setChatHistory([
            ...updatedHistory,
            { role: "model", text: err || "Error connecting to the celestial spheres." },
          ]);
          setChatLoading(false);
        }
      );
    } catch {
      setChatHistory([
        ...updatedHistory,
        { role: "model", text: "Error connecting to the celestial spheres. Please try again." },
      ]);
      setChatLoading(false);
    }
  };

  const handleCopyMessage = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    showToast("Copied to clipboard!", "success");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleResetChat = () => {
    if (chatHistory.length === 0) return;
    setChatHistory([]);
    setUserQuestion("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    showToast("Conversation cleared", "info");
  };

  const handleExport = () => {
    const header = `Vedic Jyotish — AI Astrologer Consultation\nGenerated: ${new Date().toLocaleString()}\nNative Chart: Ascendant ${ascSign}, Moon in ${moonSign} (${moonNakshatra})\n${"═".repeat(
      60
    )}\n\n`;
    const content = chatHistory
      .map((m) => `[${m.role === "user" ? "You" : "Rishi Jyotishi"}]:\n${m.text}\n`)
      .join("\n---\n\n");
    const blob = new Blob([header + content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vedic_consultation_${ascSign.toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full animate-fadeIn">
      {/* Modern Full-Height Conversational Window */}
      <div className="glass-parchment rounded-2xl md:rounded-3xl border border-primary/20 shadow-2xl flex flex-col h-[calc(100dvh-200px)] min-h-[520px] max-w-5xl mx-auto overflow-hidden">
        
        {/* Top Header: Astrologer Status & Chart Intelligence Badge */}
        <div className="px-4 py-3.5 bg-background/60 border-b border-primary/15 flex items-center justify-between gap-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-heading font-bold text-xs shadow-inner">
                🕉️
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-heading text-sm md:text-base font-semibold text-primary">
                  Rishi Jyotishi
                </h4>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-heading px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  <Sparkles className="w-2.5 h-2.5" /> Vedic AI
                </span>
              </div>
              {/* Native Astrological Context Pill */}
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
                <span>{ascSign} Lagna</span>
                <span>•</span>
                <span>Moon in {moonSign}</span>
                {currentDashaLord && (
                  <>
                    <span>•</span>
                    <span className="text-secondary font-medium">{currentDashaLord} Dasha</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Action Tools & Quota Pill */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/40 border border-border/40 text-[11px] font-heading text-muted-foreground">
              <span className="font-bold text-primary">{userQuestionCount}</span>
              <span>/</span>
              <span>{MAX_QUESTIONS} questions</span>
            </div>

            {chatHistory.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleResetChat}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-heading text-muted-foreground border border-border/40 rounded-lg hover:bg-primary/10 hover:text-primary transition-all cursor-pointer"
                  title="Clear Conversation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Reset</span>
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-heading text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-all cursor-pointer"
                  title="Export Transcript"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Export</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Message Thread Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-thin">
          {/* Welcome Message from Rishi */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 items-start max-w-[85%] md:max-w-[75%]"
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] text-primary font-heading flex-shrink-0 mt-0.5 shadow-sm">
              Rishi
            </div>
            <div className="bg-card/70 border border-primary/15 p-4 rounded-2xl rounded-tl-xs shadow-sm font-serif text-sm text-foreground leading-relaxed">
              <p>
                Namaste. I have cast and analyzed your <strong>{ascSign}</strong> Ascendant chart with the Moon placed in <strong>{moonSign}</strong>
                {moonNakshatra ? ` (${moonNakshatra})` : ""}.
              </p>
              <p className="mt-1.5 text-muted-foreground text-xs">
                Ask me any question regarding your career, relationship timing, wealth yogas, health, or current Mahadasha period.
              </p>
            </div>
          </motion.div>

          {/* Suggested Starter Questions (Shown when chat is fresh) */}
          {chatHistory.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="pt-2 pb-4"
            >
              <p className="text-xs font-heading uppercase tracking-widest text-muted-foreground/80 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" /> Recommended Astrological Inquiries
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {PROMPT_SUGGESTIONS.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => sendQuestion(item.prompt)}
                      className="text-left p-3 rounded-xl bg-background/50 hover:bg-primary/10 border border-border/50 hover:border-primary/40 transition-all duration-200 group cursor-pointer shadow-xs flex flex-col justify-between"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] font-heading font-semibold text-primary">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs font-serif text-muted-foreground group-hover:text-foreground line-clamp-2 leading-relaxed">
                        {item.prompt}
                      </p>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Active Conversation Messages */}
          <AnimatePresence initial={false}>
            {chatHistory.map((msg, i) => {
              const isUser = msg.role === "user";
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className={`flex gap-3 items-start ${isUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-heading flex-shrink-0 mt-0.5 shadow-sm ${
                      isUser
                        ? "bg-secondary/20 text-secondary border border-secondary/30"
                        : "bg-primary/20 text-primary border border-primary/30"
                    }`}
                  >
                    {isUser ? "You" : "Rishi"}
                  </div>
                  <div
                    className={`p-4 max-w-[88%] md:max-w-[78%] font-serif text-sm relative group shadow-sm leading-relaxed ${
                      isUser
                        ? "bg-primary/15 text-foreground rounded-2xl rounded-tr-xs border border-primary/25"
                        : "bg-card/75 text-foreground/90 rounded-2xl rounded-tl-xs border border-primary/15"
                    }`}
                  >
                    <div className="markdown-chat">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>

                    {!isUser && msg.text && (
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.text, i)}
                        className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 p-1.5 rounded-md bg-background/80 hover:bg-primary/20 text-muted-foreground hover:text-primary transition-all cursor-pointer shadow-xs"
                        title="Copy response"
                      >
                        {copiedIndex === i ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Streaming / Typing Indicator */}
          {chatLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 pl-11 text-xs text-primary font-heading tracking-wide"
            >
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
              </div>
              <span className="italic font-serif text-muted-foreground">
                Analyzing planetary alignments and dasha coordinates...
              </span>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating Input & Bottom Controls */}
        <div className="p-3 md:p-4 bg-background/60 border-t border-primary/15 backdrop-blur-md">
          {chatLimitReached ? (
            <div className="text-center py-2.5 px-4 rounded-xl bg-muted/40 border border-border/40 text-xs text-muted-foreground font-serif">
              You have used all {MAX_QUESTIONS} consultation questions for this session. Explore the <strong>Celestial Report</strong> tab for an extensive 3-page reading.
            </div>
          ) : (
            <>
              <div className="relative flex items-end bg-card/70 border border-border/60 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20 rounded-2xl transition-all shadow-inner">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={userQuestion}
                  onChange={handleTextareaInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendQuestion(userQuestion);
                    }
                  }}
                  placeholder="Ask Rishi Jyotishi about career, marriage, dasha... (Enter to send)"
                  className="w-full bg-transparent resize-none py-3.5 pl-4 pr-24 text-sm font-serif outline-none text-foreground placeholder:text-muted-foreground/60 max-h-[140px] scroll-thin leading-relaxed"
                />

                <div className="absolute right-2.5 bottom-2 flex items-center gap-1.5">
                  {/* Voice Recognition Button */}
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      isListening
                        ? "bg-red-500/20 border-red-500/50 text-red-500 animate-pulse"
                        : "bg-background/60 hover:bg-primary/10 border-border/40 text-muted-foreground hover:text-primary"
                    }`}
                    title={isListening ? "Stop listening" : "Voice input"}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  {/* Send Button */}
                  <button
                    type="button"
                    onClick={() => sendQuestion(userQuestion)}
                    disabled={chatLoading || !userQuestion.trim()}
                    className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30 disabled:hover:bg-primary transition-all cursor-pointer active:scale-95 shadow-xs"
                    title="Send question (Enter)"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center justify-between text-[11px] text-muted-foreground/70 mt-2 px-1 font-serif">
            <span className="hidden sm:inline">Shift + Enter for new line</span>
            <span className="mx-auto sm:mx-0">
              Vedic Jyotish AI guidance. Verify critical decisions with an experienced astrologer.
            </span>
            <span className="hidden sm:inline font-heading text-[10px]">
              {userQuestionCount}/{MAX_QUESTIONS} questions
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
