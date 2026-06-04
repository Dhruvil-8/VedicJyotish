import React from "react";
import AppShell from "../components/layout/AppShell";
import PanchangaView from "./PanchangaView";

export const metadata = {
  title: "Daily Vedic Panchang | Vedic Jyotish",
  description:
    "Calculate the five vital cosmic limbs of time (Vara, Tithi, Nakshatra, Yoga, Karana), planetary horas, and choghadiya muhurats for any location.",
};

export default function PanchangaPage() {
  return (
    <AppShell>
      <PanchangaView />
    </AppShell>
  );
}
