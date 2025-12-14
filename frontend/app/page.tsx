"use client";
import React, { useState, useEffect } from "react";
import { Search, Sparkles, MessageSquare, Send } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { searchCity, calculateChart, chatWithAstrologer } from "./components/ui/api";
import NorthIndianChart from "./components/NorthIndianChart";

export default function Home() {
  // --- State ---
  const [step, setStep] = useState<"form" | "dashboard">("form");
  const [loading, setLoading] = useState(false);
  
  // Form Data
  const [date, setDate] = useState("14/12/2023"); // Default for testing
  const [time, setTime] = useState("10:30");
  const [cityInput, setCityInput] = useState("");
  const [cityResults, setCityResults] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState<any>(null);

  // Chart Data
  const [chartData, setChartData] = useState<any>(null);

  // Chat Data
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [userQuestion, setUserQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // --- Handlers ---

  // 1. City Autocomplete
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (cityInput.length >= 3 && !selectedCity) {
        const results = await searchCity(cityInput);
        setCityResults(results);
      } else {
        setCityResults([]);
      }
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [cityInput, selectedCity]);

  const selectCity = (city: any) => {
    setSelectedCity(city);
    setCityInput(city.name);
    setCityResults([]);
  };

  // 2. Generate Chart
  const handleCalculate = async () => {
    if (!selectedCity) return alert("Please select a city from the list");
    setLoading(true);
    try {
      const payload = {
        date,
        time,
        city: selectedCity.name,
        lat: selectedCity.lat,
        lon: selectedCity.lon,
      };
      const data = await calculateChart(payload);
      setChartData(data);
      setStep("dashboard");
    } catch (e) {
      alert("Error calculating chart. Check inputs.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Chat
  const handleChat = async () => {
    if (!userQuestion.trim()) return;
    const newMsg = { role: "user", text: userQuestion };
    const updatedHistory = [...chatHistory, newMsg];
    
    setChatHistory(updatedHistory);
    setUserQuestion("");
    setChatLoading(true);

    try {
      const res = await chatWithAstrologer({
        chart_data: chartData,
        question: newMsg.text,
        history: updatedHistory,
      });
      setChatHistory([...updatedHistory, { role: "model", text: res.response }]);
    } catch (e) {
      setChatHistory([...updatedHistory, { role: "model", text: "Error connecting to the stars." }]);
    } finally {
      setChatLoading(false);
    }
  };

  // --- Render ---

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-purple-500 bg-clip-text text-transparent flex justify-center gap-2 items-center">
            <Sparkles className="text-amber-400" /> Vedic AI Astrologer
          </h1>
          <p className="text-slate-400 mt-2">Ancient Wisdom, Modern Intelligence</p>
        </header>

        {step === "form" && (
          <div className="max-w-md mx-auto bg-slate-900/50 p-8 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm">
            <div className="space-y-6">
              
              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Date (DD/MM/YYYY)</label>
                  <input 
                    type="text" value={date} onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Time (HH:MM)</label>
                  <input 
                    type="text" value={time} onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              {/* City Autocomplete */}
              <div className="relative">
                <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Birth City</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    value={cityInput}
                    onChange={(e) => { setCityInput(e.target.value); setSelectedCity(null); }}
                    placeholder="Start typing city..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 pl-10 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                {/* Dropdown Results */}
                {cityResults.length > 0 && (
                  <div className="absolute z-10 w-full bg-slate-800 border border-slate-700 mt-1 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {cityResults.map((city, i) => (
                      <div 
                        key={i} 
                        onClick={() => selectCity(city)}
                        className="p-3 hover:bg-slate-700 cursor-pointer text-sm text-slate-300 border-b border-slate-700/50 last:border-0"
                      >
                        {city.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={handleCalculate}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 rounded-lg transition-all shadow-lg shadow-purple-900/20 disabled:opacity-50"
              >
                {loading ? "Aligning Stars..." : "Generate Horoscope"}
              </button>

            </div>
          </div>
        )}

        {step === "dashboard" && chartData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-700">
            
            {/* Left Column: Visuals */}
            <div className="space-y-6">
              {/* Chart Card */}
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex flex-col items-center">
                <h2 className="text-xl font-semibold mb-6 text-amber-100">Lagna Chart (D1)</h2>
                <NorthIndianChart 
                  data={chartData.chart_data} 
                  ascendantSign={chartData.ascendant.sign} 
                />
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <div className="text-xs text-slate-400 uppercase">Ascendant</div>
                  <div className="text-lg font-medium text-purple-300">{chartData.ascendant.sign}</div>
                  <div className="text-xs text-slate-500">{(chartData.ascendant.degree).toFixed(2)}°</div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <div className="text-xs text-slate-400 uppercase">Moon Sign</div>
                  <div className="text-lg font-medium text-purple-300">{chartData.moon_intelligence.sign}</div>
                  <div className="text-xs text-slate-500">{chartData.moon_intelligence.nakshatra}</div>
                </div>
              </div>
            </div>

            {/* Right Column: AI Chat */}
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 flex flex-col h-[600px]">
              <div className="p-4 border-b border-slate-800 bg-slate-900/50 rounded-t-2xl">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-400" /> 
                  AI Astrologer
                </h2>
              </div>
              
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
                {/* Intro Message */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-900/50 flex items-center justify-center text-xs">AI</div>
                  <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none max-w-[85%] text-sm text-slate-300">
                    I have analyzed your chart. You are a {chartData.ascendant.sign} Ascendant with Moon in {chartData.moon_intelligence.nakshatra}. How can I help you?
                  </div>
                </div>

                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${msg.role === "user" ? "bg-amber-900/50" : "bg-purple-900/50"}`}>
                      {msg.role === "user" ? "You" : "AI"}
                    </div>
                    <div className={`p-3 rounded-2xl max-w-[85%] text-sm ${msg.role === "user" ? "bg-amber-950/40 text-amber-100 rounded-tr-none" : "bg-slate-800 text-slate-300 rounded-tl-none"}`}>
                       <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  </div>
                ))}
                
                {chatLoading && (
                  <div className="text-xs text-slate-500 animate-pulse pl-12">Consulting the stars...</div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-slate-800 bg-slate-900/50 rounded-b-2xl">
                <div className="flex gap-2">
                  <input 
                    value={userQuestion}
                    onChange={(e) => setUserQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleChat()}
                    placeholder="Ask about career, marriage, health..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-purple-500 outline-none"
                  />
                  <button 
                    onClick={handleChat}
                    disabled={chatLoading}
                    className="bg-purple-600 hover:bg-purple-500 p-3 rounded-xl transition-colors disabled:opacity-50"
                  >
                    <Send className="w-5 h-5 text-white" />
                  </button>
                </div>
                <div className="text-center mt-2 text-[10px] text-slate-600">
                  Limit: 3 questions per session for privacy.
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </main>
  );
}