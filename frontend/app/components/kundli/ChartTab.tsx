import React, { useState, useMemo } from "react";
import { Star, Moon, Sun, Sparkles, Compass, Clock, Calendar, AlertTriangle, User, Radio, RefreshCw } from "lucide-react";
import NorthIndianChart from "../NorthIndianChart";
import PlanetaryTable from "../PlanetaryTable";
import DashaTimeline from "../DashaTimeline";
import YogaCards from "../YogaCards";
import Accordion from "../shared/Accordion";
import ChartInspectorModal, { InspectedItem } from "./ChartInspectorModal";
import { calculateTransits } from "../ui/api";
import { useToast } from "../../hooks/useToast";
import { VARGA_INFO } from "../../lib/constants";
import { formatDate, isCurrent } from "../../lib/helpers";

interface ChartTabProps {
  chartData: any;
}

export default function ChartTab({ chartData }: ChartTabProps) {
  const { showToast } = useToast();
  const [selectedVarga, setSelectedVarga] = useState<string>("D1");
  const [inspectedItem, setInspectedItem] = useState<InspectedItem | null>(null);
  const [isTransitActive, setIsTransitActive] = useState(false);
  const [transitData, setTransitData] = useState<Record<string, any[]> | null>(null);
  const [isTransitLoading, setIsTransitLoading] = useState(false);
  const [expandedAccordions, setExpandedAccordions] = useState<Record<string, boolean>>({
    panchanga: true,
    planets: true,
    dasha: false,
  });

  const toggleAccordion = (id: string) => {
    setExpandedAccordions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Extract Planetary Strengths (Dig Bala) from house planets
  const digBalaPlanets = useMemo(() => {
    const list: any[] = [];
    if (chartData && chartData.chart_data) {
      Object.values(chartData.chart_data).forEach((house: any) => {
        (house.planets || []).forEach((planet: any) => {
          if (planet.dig_bala_points !== undefined && planet.dig_bala_points !== null) {
            list.push(planet);
          }
        });
      });
      list.sort((a, b) => (b.dig_bala_percentage || 0) - (a.dig_bala_percentage || 0));
    }
    return list;
  }, [chartData]);

  const signsList = useMemo(() => {
    return [
      "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
      "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
    ];
  }, []);

  const getSignLord = (signIdx: number) => {
    switch (signIdx) {
      case 0: case 7: return "Mars"; // Aries, Scorpio
      case 1: case 6: return "Venus"; // Taurus, Libra
      case 2: case 5: return "Mercury"; // Gemini, Virgo
      case 3: return "Moon"; // Cancer
      case 4: return "Sun"; // Leo
      case 8: case 11: return "Jupiter"; // Sagittarius, Pisces
      case 9: case 10: return "Saturn"; // Capricorn, Aquarius
      default: return "Unknown";
    }
  };

  const handleSelectHouse = (houseNumber: number, signName: string, planets: any[]) => {
    setInspectedItem({
      type: "house",
      houseNumber,
      houseSign: signName,
      housePlanets: planets,
    });
  };

  const handleSelectPlanet = (planet: any, houseNumber: number, signName: string) => {
    const pName = typeof planet === "string" ? planet : planet.name;
    const matched = (chartData.planetary_table || []).find((p: any) => p.name === pName);
    setInspectedItem({
      type: "planet",
      houseNumber,
      houseSign: signName,
      planet: matched || (typeof planet === "object" ? planet : { name: planet, sign: signName, house: houseNumber }),
    });
  };

  const handleToggleTransits = async () => {
    if (isTransitActive) {
      setIsTransitActive(false);
      return;
    }

    if (transitData) {
      setIsTransitActive(true);
      return;
    }

    setIsTransitLoading(true);
    try {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");
      const transitDate = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
      const transitTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

      const res = await calculateTransits({
        birth_data: {
          date: chartData.birth_date || "01/01/2000",
          time: chartData.birth_time || "12:00",
          city: chartData.city || "New Delhi",
          lat: chartData.latitude || 28.61,
          lon: chartData.longitude || 77.20,
        },
        transit_date: transitDate,
        transit_time: transitTime,
      });

      if (res && res.transit_planets) {
        const transitsByHouse: Record<string, any[]> = {};
        res.transit_planets.forEach((tp: any) => {
          const hKey = `house_${tp.transit_house_from_lagna}`;
          if (!transitsByHouse[hKey]) transitsByHouse[hKey] = [];
          transitsByHouse[hKey].push(tp);
        });
        setTransitData(transitsByHouse);
        setIsTransitActive(true);
        showToast("Live celestial transit (Gochara) overlay activated.", "success");
      }
    } catch (e) {
      showToast("Could not load real-time transits. Please try again.", "error");
    } finally {
      setIsTransitLoading(false);
    }
  };

  // Tithi Category Helper
  const tithiMeta = useMemo(() => {
    const tName = chartData.panchanga?.tithi?.name || "";
    const lower = tName.toLowerCase();
    if (lower.includes("pratipada") || lower.includes("shashthi") || lower.includes("ekadashi")) {
      return { category: "Nanda (नन्दा)", nature: "Joy & Prosperity", deity: "Agni / Fire" };
    }
    if (lower.includes("dwitiya") || lower.includes("saptami") || lower.includes("dwadashi")) {
      return { category: "Bhadra (भद्रा)", nature: "Auspicious & Fortunate", deity: "Brahma / Creation" };
    }
    if (lower.includes("tritiya") || lower.includes("ashtami") || lower.includes("trayodashi")) {
      return { category: "Jaya (जया)", nature: "Victory & Success", deity: "Ganesha / Shiva" };
    }
    if (lower.includes("chaturthi") || lower.includes("navami") || lower.includes("chaturdashi")) {
      return { category: "Rikta (रिक्ता)", nature: "Power & Elimination", deity: "Kali / Transformation" };
    }
    if (lower.includes("panchami") || lower.includes("dashami") || lower.includes("purnima") || lower.includes("amavasya")) {
      return { category: "Poorna (पूर्णा)", nature: "Abundance & Fullness", deity: "Moon / Sun / Lakshmi" };
    }
    return { category: "Vedic Tithi", nature: "Lunisolar Vibration", deity: "Graha Lord" };
  }, [chartData]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ascendant */}
        <div className="glass-parchment p-4 rounded-xl border-l-4 border-l-primary flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-full text-primary">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-heading uppercase tracking-tighter">
              Ascendant (लग्न)
            </div>
            <div className="font-heading text-lg font-bold">{chartData.ascendant.sign}</div>
          </div>
        </div>

        {/* Moon Sign */}
        <div className="glass-parchment p-4 rounded-xl border-l-4 border-l-secondary flex items-center gap-4">
          <div className="p-2 bg-secondary/10 rounded-full text-secondary">
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-heading uppercase tracking-tighter">
              Moon Sign (राशि)
            </div>
            <div className="font-heading text-lg font-bold">{chartData.moon_intelligence.sign}</div>
          </div>
        </div>

        {/* Nakshatra */}
        <div className="glass-parchment p-4 rounded-xl border-l-4 border-l-accent flex items-center gap-4">
          <div className="p-2 bg-accent/10 rounded-full text-accent">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-heading uppercase tracking-tighter">
              Nakshatra (नक्षत्र)
            </div>
            <div className="font-heading text-lg leading-tight font-bold">
              {chartData.moon_intelligence.nakshatra}
            </div>
          </div>
        </div>

        {/* Janma Tithi */}
        <div className="glass-parchment p-4 rounded-xl border-l-4 border-l-amber-500 flex items-center gap-4">
          <div className="p-2 bg-amber-500/10 rounded-full text-amber-600 dark:text-amber-400">
            <Sun className="w-5 h-5" />
          </div>
          <div className="truncate">
            <div className="text-xs text-muted-foreground font-heading uppercase tracking-tighter">
              Janma Tithi (जन्म तिथि)
            </div>
            <div className="font-heading text-base leading-tight font-bold text-foreground truncate">
              {chartData.panchanga?.tithi?.name || "Tithi"}
            </div>
            <div className="text-[10px] text-muted-foreground font-serif truncate">
              {chartData.panchanga?.paksha || ""} Paksha {chartData.panchanga?.masa ? `| ${chartData.panchanga.masa}` : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Chart and Table Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactive Divisional Kundli Chart */}
        <div className="glass-parchment p-6 rounded-2xl vedic-border shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-secondary font-heading mb-0.5 gold-glow">Divisional Kundli</h3>
              <p className="text-xs text-muted-foreground font-serif">
                Explore 16 divisional charts mapping distinct life aspects. Click houses or planets to inspect.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleToggleTransits}
                disabled={isTransitLoading}
                className={`px-3 py-1.5 rounded-lg border font-heading text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  isTransitActive
                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm"
                    : "bg-card border-border/50 text-muted-foreground hover:text-foreground"
                }`}
                title="Overlay real-time celestial planetary transits (Gochara)"
              >
                {isTransitLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Radio className="w-3.5 h-3.5" />
                )}
                <span>{isTransitActive ? "Transits: ON" : "Transits (Gochara)"}</span>
              </button>

              <select
                value={selectedVarga}
                onChange={(e) => setSelectedVarga(e.target.value)}
                className="bg-card border border-border/50 text-foreground rounded-lg p-2 font-heading text-xs outline-none focus:border-primary cursor-pointer transition-all"
              >
                {Object.entries(VARGA_INFO).map(([key, info]) => (
                  <option key={key} value={key} className="bg-card font-serif text-xs">
                    {key}: {info.title.split(" (")[0]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <NorthIndianChart
            chartData={
              selectedVarga === "D1"
                ? chartData.chart_data
                : selectedVarga === "D9"
                  ? chartData.navamsa_chart || {}
                  : chartData.divisional_charts?.[selectedVarga] || {}
            }
            ascendantSign={
              selectedVarga === "D1"
                ? chartData.ascendant.sign
                : selectedVarga === "D9"
                  ? chartData.navamsa_chart?.house_1?.sign || chartData.ascendant.sign
                  : chartData.divisional_charts?.[selectedVarga]?.house_1?.sign ||
                    chartData.ascendant.sign
            }
            title={VARGA_INFO[selectedVarga]?.title}
            onSelectHouse={handleSelectHouse}
            onSelectPlanet={handleSelectPlanet}
            transitData={transitData}
            isTransitActive={isTransitActive}
          />

          <div className="mt-6 text-center px-4 py-3 bg-primary/5 border border-primary/10 rounded-xl">
            <p className="font-serif italic text-xs text-foreground/80 leading-relaxed">
              <span className="font-heading font-semibold text-primary block sm:inline not-italic mr-1">
                {VARGA_INFO[selectedVarga]?.title}:
              </span>{" "}
              {VARGA_INFO[selectedVarga]?.description}
            </p>
          </div>
        </div>

        {/* Planetary Table */}
        <div className="glass-parchment p-6 rounded-2xl shadow-xl overflow-hidden flex flex-col justify-between">
          <div>
            <h3 className="text-secondary font-heading mb-1 gold-glow">Planetary Details</h3>
            <p className="text-xs text-muted-foreground font-serif mb-4">
              Accurate planetary positions, retrogrades, and dignities in your natal chart.
            </p>
            <PlanetaryTable planets={chartData.planetary_table || []} />
          </div>
        </div>
      </div>

      {/* Educational Accordion Section */}
      <div className="mt-8 space-y-4" style={{ overflowAnchor: "none" }}>
        {/* Panchanga */}
        <Accordion
          id="panchanga"
          title="Janma Panchanga Elements (जन्म पञ्चाङ्ग)"
          explanation="The five vital cosmic components representing divine time and lunisolar alignment at birth."
          icon={Clock}
          isOpen={expandedAccordions.panchanga || false}
          onToggle={() => toggleAccordion("panchanga")}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {[
                {
                  label: "Vara (Day of Birth)",
                  val: chartData.panchanga.vara,
                  sub: `Lord: ${chartData.panchanga.vara_lord || "Graha"}`,
                },
                {
                  label: "Janma Tithi (Lunar)",
                  val: chartData.panchanga.tithi.name,
                  pct: chartData.panchanga.tithi.progress,
                  sub: `${tithiMeta.category} | ${tithiMeta.deity}`,
                },
                {
                  label: "Nakshatra",
                  val: chartData.panchanga.nakshatra.name,
                  pct: chartData.panchanga.nakshatra.progress,
                  sub: `Lord: ${chartData.panchanga.nakshatra_lord || "Graha"}`,
                },
                {
                  label: "Yoga (Angle)",
                  val: chartData.panchanga.yoga.name,
                  pct: chartData.panchanga.yoga.progress,
                  sub: `Lord: ${chartData.panchanga.yoga_lord || "Graha"}`,
                },
                {
                  label: "Karana (Half Tithi)",
                  val: chartData.panchanga.karana.name,
                  pct: chartData.panchanga.karana.progress,
                  sub: `Lord: ${chartData.panchanga.karana_lord || "Graha"}`,
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-card/40 p-4 rounded-xl border border-border/20 flex flex-col justify-between"
                >
                  <div>
                    <div className="text-[9px] text-muted-foreground font-heading uppercase tracking-widest">
                      {item.label}
                    </div>
                    <div className="font-heading text-sm text-primary mt-1 font-bold">{item.val}</div>
                    {item.sub && (
                      <div className="text-[9px] text-muted-foreground font-serif mt-0.5 truncate">
                        {item.sub}
                      </div>
                    )}
                  </div>
                  {item.pct !== undefined ? (
                    <div className="mt-3">
                      <div className="w-full h-1 bg-border/40 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${item.pct * 100}%` }} />
                      </div>
                      <div className="text-[8px] text-muted-foreground mt-1 text-right">
                        {Math.round(item.pct * 100)}% elapsed at birth
                      </div>
                    </div>
                  ) : (
                    <div className="text-[8px] text-muted-foreground mt-3 italic">
                      Natal solar alignment
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Birth Cosmic Context (Masa, Samvat, Ritu, Ayana) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-card/30 p-3.5 rounded-xl border border-border/20 text-center text-xs">
              <div>
                <span className="text-[9px] text-muted-foreground font-heading uppercase block">
                  Janma Masa
                </span>
                <span className="font-heading font-bold text-foreground">
                  {chartData.panchanga.masa || "Shravana"} Masa
                </span>
              </div>
              <div>
                <span className="text-[9px] text-muted-foreground font-heading uppercase block">
                  Vikram / Shaka Samvat
                </span>
                <span className="font-heading font-bold text-foreground">
                  VS {chartData.panchanga.vikram_samvat || "--"} | SS {chartData.panchanga.shaka_samvat || "--"}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-muted-foreground font-heading uppercase block">
                  Ritu / Season
                </span>
                <span className="font-heading font-bold text-primary">
                  {chartData.panchanga.ritu || "Varsha"}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-muted-foreground font-heading uppercase block">
                  Ayana
                </span>
                <span className="font-heading font-bold text-foreground">
                  {chartData.panchanga.ayana || "Dakshinayana"}
                </span>
              </div>
            </div>
          </div>
        </Accordion>

        {/* Shadbala / Dig Bala [Beta] */}
        {chartData.shadbala ? (
          <Accordion
            id="shadbala"
            title="Planetary Strengths (Shadbala) [Beta]"
            explanation="Six-fold planetary strength (Shadbala) representing each planet's capability to deliver results across life. [Beta: Under Calibration]"
            icon={Star}
            isOpen={expandedAccordions.shadbala || false}
            onToggle={() => toggleAccordion("shadbala")}
          >
            {chartData.graha_yuddha && chartData.graha_yuddha.length > 0 && (
              <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-950/20 text-red-100">
                <h4 className="font-heading text-xs font-bold text-red-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <AlertTriangle size={14} className="animate-pulse" /> Graha Yuddha (Planetary War)
                  Active
                </h4>
                <div className="space-y-2">
                  {chartData.graha_yuddha.map((war: any, i: number) => (
                    <div key={i} className="text-xs font-serif leading-relaxed">
                      A celestial battle is active between{" "}
                      <span className="font-bold text-foreground">{war.planet_1}</span> and{" "}
                      <span className="font-bold text-foreground">{war.planet_2}</span> (Distance:{" "}
                      <span className="text-primary font-bold">{war.degree_diff}°</span>). The victor
                      is declared as <span className="font-bold text-yellow-400">{war.winner}</span>
                      .
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(chartData.shadbala.planet_balas || {}).map(
                ([name, bala]: [string, any], i: number) => {
                  const pct = Math.min(100, Math.round(bala.strength_ratio * 100));
                  const statusColor = bala.strength_ratio >= 1.0 ? "text-emerald-500" : "text-amber-500";
                  return (
                    <div
                      key={i}
                      className="bg-card/40 p-4 rounded-xl border border-border/20 flex flex-col justify-between hover:border-primary/30 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between border-b border-border/10 pb-2 mb-3">
                          <span className="font-heading text-xs font-bold text-foreground">
                            {name}
                          </span>
                          <span className={`text-xs font-heading font-bold ${statusColor}`}>
                            {bala.strength_ratio}x req
                          </span>
                        </div>
                        <div className="text-xs space-y-1.5 font-serif text-muted-foreground">
                          <div className="flex justify-between">
                            <span>Total Rupas:</span>{" "}
                            <span className="text-foreground font-semibold">{bala.total_rupas}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Shashtiamsa:</span>{" "}
                            <span className="text-foreground font-semibold">
                              {bala.total_shashtiamsa}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 border-t border-border/10 pt-2 text-[9px]">
                            <div className="flex justify-between">
                              <span>Sthana:</span>{" "}
                              <span className="text-foreground font-medium">
                                {Math.round(bala.sthana_bala)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Dig:</span>{" "}
                              <span className="text-foreground font-medium">
                                {Math.round(bala.dig_bala)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Kaala:</span>{" "}
                              <span className="text-foreground font-medium">
                                {Math.round(bala.kaala_bala)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Cheshta:</span>{" "}
                              <span className="text-foreground font-medium">
                                {Math.round(bala.cheshta_bala)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Naisargika:</span>{" "}
                              <span className="text-foreground font-medium">
                                {Math.round(bala.naisargika_bala)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Drik:</span>{" "}
                              <span className="text-foreground font-medium">
                                {Math.round(bala.drik_bala)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="w-full h-1.5 bg-border/40 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              bala.strength_ratio >= 1.0 ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[8px] text-muted-foreground mt-1">
                          <span>Ratio</span>
                          <span>{Math.round(bala.strength_ratio * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </Accordion>
        ) : (
          digBalaPlanets.length > 0 && (
            <Accordion
              id="digbala"
              title="Planetary Strengths (Dig Bala)"
              explanation="Directional strength coordinates determining a planet's capability to manifest outcomes."
              icon={Star}
              isOpen={expandedAccordions.digbala || false}
              onToggle={() => toggleAccordion("digbala")}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {digBalaPlanets.map((p: any, i: number) => (
                  <div
                    key={i}
                    className="bg-card/40 p-4 rounded-xl border border-border/20 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-heading text-xs font-bold text-foreground">{p.name}</span>
                      <span className="text-xs font-heading text-primary font-bold">
                        {p.dig_bala_points} Pts
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="w-full h-1.5 bg-border/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${p.dig_bala_percentage || 0}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[8px] text-muted-foreground mt-1">
                        <span>Lagna Power</span>
                        <span>{Math.round(p.dig_bala_percentage || 0)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Accordion>
          )
        )}

        {/* Bhava Bala [Beta] */}
        {chartData.bhava_bala && (
          <Accordion
            id="bhavabala"
            title="House Strengths (Bhava Bala) [Beta]"
            explanation="The computed strength of the 12 houses (Bhavas), determining which domains of life naturally flow with ease. [Beta: Under Calibration]"
            icon={Compass}
            isOpen={expandedAccordions.bhavabala || false}
            onToggle={() => toggleAccordion("bhavabala")}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {chartData.bhava_bala.map((score: number, i: number) => {
                const ascSignIdx = signsList.indexOf(chartData.ascendant.sign);
                const houseSignIdx = (ascSignIdx + i) % 12;
                const sign = signsList[houseSignIdx];
                const lord = getSignLord(houseSignIdx);

                const minBala = 250;
                const maxBala = 550;
                const displayPct = Math.min(
                  100,
                  Math.max(10, Math.round(((score - minBala) / (maxBala - minBala)) * 100))
                );

                return (
                  <div
                    key={i}
                    className="bg-card/40 p-4 rounded-xl border border-border/20 flex flex-col justify-between hover:border-primary/30 transition-all text-foreground"
                  >
                    <div>
                      <div className="text-[9px] text-muted-foreground font-heading uppercase tracking-widest">
                        House {i + 1}
                      </div>
                      <div className="font-heading text-sm text-primary font-bold mt-1">
                        {score} Pts
                      </div>
                      <div className="text-[9px] text-muted-foreground font-serif leading-normal mt-1 italic text-center sm:text-left">
                        {sign} • {lord}
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="w-full h-1 bg-border/40 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${displayPct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Accordion>
        )}

        {/* Vimshottari Dasha */}
        <Accordion
          id="dasha"
          title="Vimshottari Dasha Periods"
          explanation="Planetary period timeline mapping cyclic life progression over a 120-year cycle."
          icon={Calendar}
          isOpen={expandedAccordions.dasha || false}
          onToggle={() => toggleAccordion("dasha")}
        >
          <DashaTimeline timeline={chartData.vimshottari_timeline || []} className="w-full" />
        </Accordion>

        {/* Chara Dasha [Beta] */}
        {chartData.chara_dasha && (
          <Accordion
            id="charadasha"
            title="Jaimini Chara Dasha [Beta]"
            explanation="Sign-based cyclic timeline mapping spiritual and material periods of experiences. [Beta: Under Calibration]"
            icon={Compass}
            isOpen={expandedAccordions.charadasha || false}
            onToggle={() => toggleAccordion("charadasha")}
          >
            <div className="overflow-x-auto scroll-thin">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/50">
                  <tr className="border-b border-border">
                    <th className="px-3 py-3 font-heading text-primary text-xs tracking-wider">
                      Sign
                    </th>
                    <th className="px-3 py-3 font-heading text-primary text-xs tracking-wider text-center">
                      Duration (Years)
                    </th>
                    <th className="px-3 py-3 font-heading text-primary text-xs tracking-wider">
                      Start Date
                    </th>
                    <th className="px-3 py-3 font-heading text-primary text-xs tracking-wider">
                      End Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {(chartData.chara_dasha.periods || []).map((period: any, i: number) => {
                    const current = isCurrent(period.start_date, period.end_date);
                    return (
                      <tr
                        key={i}
                        className={`hover:bg-primary/5 transition-colors ${
                          current ? "bg-primary/5 font-bold" : ""
                        }`}
                      >
                        <td className="px-3 py-3 font-heading font-bold text-foreground flex items-center gap-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              current ? "bg-primary animate-pulse" : "bg-transparent"
                            }`}
                          />
                          {period.sign}
                        </td>
                        <td className="px-3 py-3 text-center font-serif text-foreground">
                          {period.duration_years}
                        </td>
                        <td className="px-3 py-3 font-serif text-muted-foreground text-xs">
                          {formatDate(period.start_date)}
                        </td>
                        <td className="px-3 py-3 font-serif text-muted-foreground text-xs flex items-center justify-between">
                          {formatDate(period.end_date)}
                          {current && (
                            <span className="text-[8px] font-heading text-primary px-1.5 py-0.5 bg-primary/10 rounded-full border border-primary/20">
                              NOW
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Accordion>
        )}

        {/* Yogas */}
        <Accordion
          id="yogas"
          title="Auspicious Yogas"
          explanation="Vedic planetary configurations forming special fortunes and life paths."
          icon={Sparkles}
          isOpen={expandedAccordions.yogas || false}
          onToggle={() => toggleAccordion("yogas")}
        >
          <YogaCards yogas={chartData.yogas || []} />
        </Accordion>

        {/* Doshas */}
        {chartData.doshas && (
          <Accordion
            id="doshas"
            title="Vedic Doshas"
            explanation="Cosmic faults and planetary afflictions affecting emotional and relational harmony."
            icon={AlertTriangle}
            isOpen={expandedAccordions.doshas || false}
            onToggle={() => toggleAccordion("doshas")}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                {
                  name: "Kala Sarpa",
                  val: chartData.doshas.kala_sarpa?.has_dosha,
                  desc: "Formed when all planets are hemmed between Rahu and Ketu, creating karmic lessons.",
                },
                {
                  name: "Manglik (Lagna)",
                  val: chartData.doshas.manglik_lagna?.has_dosha,
                  exceptions: chartData.doshas.manglik_lagna?.has_exceptions,
                  desc: "Mars placement in houses 1, 4, 7, 8, or 12 of Birth chart, indicating martial passion.",
                },
                {
                  name: "Manglik (Moon)",
                  val: chartData.doshas.manglik_moon?.has_dosha,
                  exceptions: chartData.doshas.manglik_moon?.has_exceptions,
                  desc: "Mars placement relative to Moon sign, affecting emotional relationship harmony.",
                },
                {
                  name: "Manglik (Venus)",
                  val: chartData.doshas.manglik_venus?.has_dosha,
                  exceptions: chartData.doshas.manglik_venus?.has_exceptions,
                  desc: "Mars placement relative to Venus, affecting love compatibility and passion.",
                },
                {
                  name: "Pitru Dosha",
                  val: chartData.doshas.pitru?.has_dosha,
                  desc: "Sun or Moon afflicted by Saturn, Rahu, or Ketu, indicating ancestral karmic debts.",
                },
                {
                  name: "Guru Chandala",
                  val: chartData.doshas.guru_chandala?.has_dosha,
                  mitigated: chartData.doshas.guru_chandala?.jupiter_stronger,
                  desc: "Jupiter conjoined with Rahu or Ketu, testing moral wisdom and spiritual beliefs.",
                },
                {
                  name: "Ganda Moola",
                  val: chartData.doshas.ganda_moola?.has_dosha,
                  desc: "Moon placed in highly transitionary junction points (Ketu and Mercury stars).",
                },
                {
                  name: "Kalathra Dosha",
                  val: chartData.doshas.kalathra_lagna || chartData.doshas.kalathra_moon,
                  desc: "Afflictions on the 7th house or lord, affecting relationships and partnership success.",
                },
                {
                  name: "Shrapit Dosha",
                  val: chartData.doshas.shrapit,
                  desc: "Saturn and Rahu conjunction, representing deep karmic obstacles requiring patience.",
                },
              ].map((d, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    d.val ? (d.mitigated ? "bg-amber-950/20 border-amber-500/30 text-amber-100" : "bg-red-950/20 border-red-500/30 text-red-100") : (d.exceptions ? "bg-amber-950/20 border-amber-500/30 text-amber-100" : "bg-card/40 border-border/20 text-foreground")
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-heading text-xs font-bold">{d.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm ${
                          d.val
                            ? (d.mitigated ? "bg-amber-900/60 border-amber-500/80 text-amber-300" : "bg-red-900/60 border-red-500/80 text-red-300")
                            : (d.exceptions ? "bg-amber-900/60 border-amber-500/80 text-amber-300" : "bg-emerald-950/40 border-emerald-500/40 text-emerald-400")
                        }`}
                      >
                        {d.val ? (d.mitigated ? "MITIGATED" : "ACTIVE") : (d.exceptions ? "CANCELLED" : "NO DOSHA")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-serif leading-relaxed mt-2">
                      {d.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Accordion>
        )}

        {/* Jaimini Lagnas & Karakas */}
        {chartData.jaimini && (
          <Accordion
            id="jaimini"
            title="Jaimini Lagnas & Karakas"
            explanation="Subtle focal points representing your soul's desires, material status, and public image."
            icon={User}
            isOpen={expandedAccordions.jaimini || false}
            onToggle={() => toggleAccordion("jaimini")}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {[
                {
                  title: "Arudha Lagna (AL)",
                  val: chartData.jaimini.arudha_lagna?.sign,
                  h: chartData.jaimini.arudha_lagna?.house,
                  desc: "How the world perceives you, your public image, and material status.",
                },
                {
                  title: "Upapada Lagna (UL)",
                  val: chartData.jaimini.upapada_lagna?.sign,
                  h: chartData.jaimini.upapada_lagna?.house,
                  desc: "Marriage, life partner's nature, status, and long-term relational bond.",
                },
                {
                  title: "Karakamsha Lagna (KL)",
                  val: chartData.jaimini.karakamsha_lagna?.sign,
                  h: chartData.jaimini.karakamsha_lagna?.house,
                  desc: "Soul's primary desire and direction, based on Atmakaraka's D9 position.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-card/40 p-4 rounded-xl border border-border/20 flex flex-col justify-between text-foreground"
                >
                  <div>
                    <span className="text-[9px] text-muted-foreground font-heading uppercase tracking-widest">
                      {item.title}
                    </span>
                    <div className="font-heading text-base text-primary font-bold mt-1">
                      {item.val}{" "}
                      <span className="text-xs text-muted-foreground font-serif">
                        (House {item.h})
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground font-serif italic mt-2 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto scroll-thin">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/50">
                  <tr className="border-b border-border">
                    <th className="px-3 py-3 font-heading text-primary text-xs tracking-wider">
                      Chara Karaka
                    </th>
                    <th className="px-3 py-3 font-heading text-primary text-xs tracking-wider">
                      Significance
                    </th>
                    <th className="px-3 py-3 font-heading text-primary text-xs tracking-wider">
                      Planet
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {[
                    {
                      code: "AK",
                      name: "Atmakaraka",
                      meaning: "Soul indicator, primary lessons and spiritual path.",
                    },
                    {
                      code: "AmK",
                      name: "Amatyakaraka",
                      meaning: "Career, profession, intellectual path, and counselors.",
                    },
                    {
                      code: "BK",
                      name: "Bhratrukaraka",
                      meaning: "Siblings, companions, gurus, and helpful guides.",
                    },
                    {
                      code: "MK",
                      name: "Matrukaraka",
                      meaning: "Mother, home environment, emotional peace, and luxury.",
                    },
                    {
                      code: "PiK",
                      name: "Pitrukaraka",
                      meaning: "Father, lineage, ancestors, and higher duties.",
                    },
                    {
                      code: "PK",
                      name: "Putrakaraka",
                      meaning: "Children, creative pursuits, education, and followers.",
                    },
                    {
                      code: "GK",
                      name: "Gnatikaraka",
                      meaning: "Rivals, disputes, conflicts, health challenges, and struggles.",
                    },
                    {
                      code: "DK",
                      name: "Darakaraka",
                      meaning: "Life partner, marriage, business partners, and physical wellness.",
                    },
                  ].map((k, i) => {
                    const planetName =
                      Object.entries(chartData.jaimini.chara_karakas || {}).find(
                        ([_, code]) => code === k.code
                      )?.[0] || "None";
                    return (
                      <tr key={i} className="hover:bg-primary/5 transition-colors">
                        <td className="px-3 py-2 font-heading font-bold text-foreground">
                          {k.code} ({k.name})
                        </td>
                        <td className="px-3 py-2 font-serif text-muted-foreground text-xs leading-relaxed">
                          {k.meaning}
                        </td>
                        <td className="px-3 py-2 font-heading font-semibold text-primary">
                          {planetName}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Accordion>
        )}

        {/* Aspects */}
        {chartData.aspects && (
          <Accordion
            id="aspects"
            title="Graha & Rasi Aspects"
            explanation="Planetary aspect configurations (Graha Drishti) and sign-based aspects (Rasi Drishti) representing mutual influences."
            icon={Compass}
            isOpen={expandedAccordions.aspects || false}
            onToggle={() => toggleAccordion("aspects")}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Graha Drishti */}
              <div className="space-y-3">
                <h5 className="font-heading text-xs text-secondary tracking-widest uppercase mb-2">
                  Graha Drishti (Planetary Aspects)
                </h5>
                <div className="overflow-x-auto scroll-thin max-h-[300px]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-muted/50">
                      <tr className="border-b border-border">
                        <th className="px-2 py-2 font-heading text-primary">Graha</th>
                        <th className="px-2 py-2 font-heading text-primary">Aspected Houses</th>
                        <th className="px-2 py-2 font-heading text-primary">Aspected Grahas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {Object.entries(chartData.aspects.graha_drishti || {}).map(
                        ([planet, details]: any, i) => (
                          <tr key={i} className="hover:bg-primary/5">
                            <td className="px-2 py-2 font-heading font-bold text-foreground">
                              {planet}
                            </td>
                            <td className="px-2 py-2 font-serif text-muted-foreground">
                              {details.aspected_houses?.join(", ") || "None"}
                            </td>
                            <td className="px-2 py-2 font-heading font-semibold text-primary">
                              {details.aspected_planets?.join(", ") || "None"}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Rasi Drishti */}
              <div className="space-y-3">
                <h5 className="font-heading text-xs text-secondary tracking-widest uppercase mb-2">
                  Rasi Drishti (Sign Aspects)
                </h5>
                <div className="overflow-x-auto scroll-thin max-h-[300px]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-muted/50">
                      <tr className="border-b border-border">
                        <th className="px-2 py-2 font-heading text-primary">Rasi</th>
                        <th className="px-2 py-2 font-heading text-primary">Aspected Rasis</th>
                        <th className="px-2 py-2 font-heading text-primary">Aspected Grahas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {Object.entries(chartData.aspects.rasi_drishti || {}).map(
                        ([sign, details]: any, i) => (
                          <tr key={i} className="hover:bg-primary/5">
                            <td className="px-2 py-2 font-heading font-bold text-foreground">
                              {sign}
                            </td>
                            <td className="px-2 py-2 font-serif text-muted-foreground">
                              {details.aspected_signs?.join(", ") || "None"}
                            </td>
                            <td className="px-2 py-2 font-heading font-semibold text-primary">
                              {details.aspected_planets?.join(", ") || "None"}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Accordion>
        )}

        {/* Argala [Beta] */}
        {chartData.argala && (
          <Accordion
            id="argala"
            title="Argala & Virodhargala [Beta]"
            explanation="Direct planetary interventions (Argala) and obstructions (Virodhargala) formed on houses. [Beta: Under Calibration]"
            icon={Compass}
            isOpen={expandedAccordions.argala || false}
            onToggle={() => toggleAccordion("argala")}
          >
            <div className="overflow-x-auto scroll-thin max-h-[400px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-muted/50">
                  <tr className="border-b border-border">
                    <th className="px-3 py-3 font-heading text-primary">House</th>
                    <th className="px-3 py-3 font-heading text-primary">
                      Argala Contributors (Interventions)
                    </th>
                    <th className="px-3 py-3 font-heading text-primary">
                      Virodhargala Contributors (Obstructions)
                    </th>
                    <th className="px-3 py-3 font-heading text-primary text-center">Net Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {Object.entries(chartData.argala.house_argalas || {}).map(
                    ([house, details]: any, i) => (
                      <tr key={i} className="hover:bg-primary/5">
                        <td className="px-3 py-2 font-heading font-bold text-foreground">
                          House {house}
                        </td>
                        <td className="px-3 py-2 font-serif text-muted-foreground leading-relaxed">
                          {details.argala_contributors?.length > 0
                            ? details.argala_contributors
                                .map((c: any) => `${c.planet_name} (H${c.argala_house})`)
                                .join(", ")
                            : "None"}
                        </td>
                        <td className="px-3 py-2 font-serif text-muted-foreground leading-relaxed">
                          {details.virodhargala_contributors?.length > 0
                            ? details.virodhargala_contributors
                                .map((c: any) => `${c.planet_name} (H${c.argala_house})`)
                                .join(", ")
                            : "None"}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-heading font-bold border ${
                              details.net_argala_status === "Active"
                                ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400"
                                : details.net_argala_status === "Obstructed"
                                  ? "bg-amber-950/20 border-amber-500/20 text-amber-400"
                                  : "bg-card border-border/20 text-muted-foreground"
                            }`}
                          >
                            {details.net_argala_status}
                          </span>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </Accordion>
        )}

        {/* Sade Sati */}
        {chartData.sade_sati && (
          <Accordion
            id="sadesati"
            title="Sade Sati & Transits"
            explanation="Current transit status of Saturn relative to natal Moon sign."
            icon={Star}
            isOpen={expandedAccordions.sadesati || false}
            onToggle={() => toggleAccordion("sadesati")}
          >
            <div className="space-y-4">
              <div
                className={`p-5 rounded-2xl border ${
                  chartData.sade_sati.is_active
                    ? "bg-amber-950/20 border-amber-500/30 text-amber-100"
                    : "bg-emerald-950/10 border-emerald-500/20 text-emerald-100"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h5 className="font-heading text-sm font-bold flex items-center gap-2">
                      <Star
                        className={`w-4 h-4 ${
                          chartData.sade_sati.is_active
                            ? "text-amber-500 animate-pulse"
                            : "text-emerald-500"
                        }`}
                      />
                      Saturn Sade Sati: {chartData.sade_sati.is_active ? "ACTIVE" : "INACTIVE"}
                    </h5>
                    <p className="text-xs text-muted-foreground font-serif mt-1">
                      Sade Sati is the 7.5-year cycle of Saturn transiting over the natal Moon sign
                      and adjacent houses.
                    </p>
                  </div>
                  {chartData.sade_sati.is_active && (
                    <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-full font-heading text-[9px] uppercase tracking-widest text-center">
                      {chartData.sade_sati.phase || "Active Phase"}
                    </span>
                  )}
                </div>
                <p className="text-xs font-serif leading-relaxed mt-4 border-t border-border/10 pt-3">
                  {chartData.sade_sati.description ||
                    "Saturn is transiting in a supportive house relative to your natal Moon sign, indicating no active Sade Sati challenges currently."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card/40 p-4 rounded-xl border border-border/20 text-foreground">
                  <div className="text-[8px] text-muted-foreground font-heading uppercase tracking-widest">
                    Natal Moon Sign
                  </div>
                  <div className="font-heading text-sm text-primary font-bold mt-1">
                    {chartData.sade_sati.moon_sign || chartData.moon_intelligence.sign}
                  </div>
                </div>
                <div className="bg-card/40 p-4 rounded-xl border border-border/20 text-foreground">
                  <div className="text-[8px] text-muted-foreground font-heading uppercase tracking-widest">
                    Current Saturn Transit
                  </div>
                  <div className="font-heading text-sm text-secondary font-bold mt-1">
                    {chartData.sade_sati.saturn_sign || "Aquarius"}
                  </div>
                </div>
                <div className="bg-card/40 p-4 rounded-xl border border-border/20 text-foreground">
                  <div className="text-[8px] text-muted-foreground font-heading uppercase tracking-widest">
                    Sade Sati Impact
                  </div>
                  <div className="font-heading text-sm text-foreground font-bold mt-1">
                    {chartData.sade_sati.is_active ? "Karmic Refinement" : "Supportive Period"}
                  </div>
                </div>
              </div>
            </div>
          </Accordion>
        )}
      </div>

      {/* Chart Inspector Modal */}
      <ChartInspectorModal
        item={inspectedItem}
        onClose={() => setInspectedItem(null)}
      />
    </div>
  );
}
