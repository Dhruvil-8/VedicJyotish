"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, ExternalLink, Send, Copy, Check, RotateCcw } from "lucide-react";
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
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { showToast } = useToast();
  const MAX_QUESTIONS = 3;
  const userQuestionCount = chatHistory.filter((m) => m.role === "user").length;
  const chatLimitReached = userQuestionCount >= MAX_QUESTIONS;

  // Auto-scroll to bottom smoothly on message streaming or addition
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatLoading]);

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserQuestion(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const sendQuestion = async (questionText: string) => {
    if (!questionText.trim() || chatLimitReached || chatLoading) return;
    const newMsg = { role: "user", text: questionText.trim() };
    const updatedHistory = [...chatHistory, newMsg];

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

  const handleChat = () => {
    sendQuestion(userQuestion);
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
      <div className="glass-parchment rounded-2xl overflow-hidden flex flex-col h-[calc(100dvh-260px)] min-h-[480px] max-h-[680px] shadow-2xl border border-primary/20 max-w-4xl mx-auto">
        {/* Header */}
        <div className="p-4 bg-primary/10 border-b border-primary/20 flex items-center justify-between">
          <h4 className="font-heading text-primary flex items-center gap-2 text-sm">
            <MessageSquare className="w-4 h-4" /> Ask the Rishi
          </h4>
          <div className="flex items-center gap-2">
            {chatHistory.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleResetChat}
                  className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-heading text-muted-foreground border border-border/40 rounded-full hover:bg-primary/10 hover:text-primary transition-all cursor-pointer"
                  title="Clear Conversation"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-heading text-primary border border-primary/30 rounded-full hover:bg-primary/10 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" /> Export
                </button>
              </>
            )}
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 scroll-thin">
          {/* Initial Rishi Welcome Message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex gap-3 items-end"
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] text-primary font-heading flex-shrink-0 mb-1 shadow-sm">
              Rishi
            </div>
            <div className="bg-muted/40 p-3.5 rounded-2xl rounded-bl-xs border border-primary/15 font-serif text-sm text-foreground shadow-sm max-w-[85%] leading-relaxed">
              Humble greetings. I have studied your {chartData?.ascendant?.sign || "Lagna"} chart. How may I guide
              you through the cosmic threads today?
            </div>
          </motion.div>

          {/* Chat History Messages */}
          {chatHistory.map((msg, i) => {
            const isUser = msg.role === "user";
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={`flex gap-3 items-end ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-heading flex-shrink-0 mb-1 shadow-sm ${
                    isUser
                      ? "bg-secondary/20 text-secondary border border-secondary/30"
                      : "bg-primary/20 text-primary border border-primary/30"
                  }`}
                >
                  {isUser ? "You" : "Rishi"}
                </div>
                <div
                  className={`p-3.5 max-w-[85%] font-serif text-sm relative group shadow-sm leading-relaxed ${
                    isUser
                      ? "bg-secondary/15 text-foreground rounded-2xl rounded-br-xs border border-secondary/30"
                      : "bg-muted/40 text-foreground/90 rounded-2xl rounded-bl-xs border border-primary/15"
                  }`}
                >
                  <div className="markdown-chat">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>

                  {!isUser && msg.text && (
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(msg.text, i)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-md bg-background/80 hover:bg-primary/20 text-muted-foreground hover:text-primary transition-all cursor-pointer shadow-sm"
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

          {chatLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 pl-11 text-[11px] text-primary font-heading tracking-wider"
            >
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-ping" />
              <span>Aligning with cosmic threads...</span>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input & Footer Container */}
        <div className="p-4 bg-muted/20 border-t border-border/30">
          {chatLimitReached ? (
            <div className="text-center py-2 text-xs text-muted-foreground font-serif italic">
              You've reached the {MAX_QUESTIONS}-question limit for this session. Generate the full
              report for deeper analysis.
            </div>
          ) : (
            <>
              <div className="text-right text-[10px] text-muted-foreground mb-1.5 font-heading">
                {userQuestionCount}/{MAX_QUESTIONS} questions used
              </div>
              <div className="relative flex items-end bg-background/60 border border-border/60 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20 rounded-xl transition-all shadow-inner">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={userQuestion}
                  onChange={handleTextareaInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleChat();
                    }
                  }}
                  placeholder="Ask the Rishi (Shift + Enter for new line)..."
                  className="w-full bg-transparent resize-none py-3 pl-4 pr-12 text-sm font-serif outline-none text-foreground placeholder:text-muted-foreground/60 max-h-[120px] scroll-thin leading-relaxed"
                />
                <button
                  type="button"
                  onClick={handleChat}
                  disabled={chatLoading || !userQuestion.trim()}
                  className="absolute right-2 bottom-2 p-2 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground disabled:opacity-30 disabled:hover:bg-primary/10 disabled:hover:text-primary transition-all cursor-pointer active:scale-95"
                  title="Send question (Enter)"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
          <p className="text-center text-[11px] text-muted-foreground/70 mt-2.5 font-serif">
            AI can make mistakes. Verify important astrological information.
          </p>
        </div>
      </div>
    </div>
  );
}


