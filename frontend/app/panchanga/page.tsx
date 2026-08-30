import React from "react";
import AppShell from "../components/layout/AppShell";
import PanchangaView from "./PanchangaView";

export const metadata = {
  title: "Vedic Panchangam | Vedic Jyotish",
  description:
    "Comprehensive Vedic Panchangam and Traditional Hindu Calendar. Calculate the cosmic limbs of time (Vara, Tithi, Nakshatra, Yoga, Karana), Masa, Samvat, Ritu, Ayana, and live traditional Vedic Time.",
};

export default function PanchangaPage() {
  return (
    <AppShell>
      <PanchangaView />
    </AppShell>
  );
}
