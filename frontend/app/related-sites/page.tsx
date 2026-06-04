"use client";

import React from "react";
import AppShell from "../components/layout/AppShell";
import { BookOpen, Compass, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

export default function RelatedSitesPage() {
  return (
    <AppShell>
      <div className="space-y-8 text-foreground">
        <div className="glass-parchment p-8 md:p-12 rounded-2xl vedic-border shadow-2xl relative max-w-2xl mx-auto group">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors" />

          <div className="space-y-8 relative">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 bg-primary/10 rounded-2xl text-primary mb-2">
                <BookOpen className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-heading text-primary">Our Related Sites</h2>
              <p className="text-xs text-muted-foreground font-serif max-w-md mx-auto">
                Explore our other platforms dedicated to Sanatan Dharma scriptures, wisdom, and
                directory services.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <a
                href="https://srimad-bhgavad-gita.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-5 rounded-xl border border-primary/10 bg-primary/5 hover:bg-primary/10 hover:border-primary/20 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="p-3 bg-primary/10 rounded-lg text-primary group-hover:scale-110 transition-transform">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-heading text-sm font-bold text-foreground">
                      Srimad Bhagavad Gita
                    </h4>
                    <p className="text-xs text-muted-foreground font-serif mt-1">
                      Read, search, and contemplate the divine dialogue between Lord Krishna and
                      Arjuna.
                    </p>
                  </div>
                </div>
                <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </a>

              <a
                href="https://dhruvil-8.github.io/SanatanDharmaDirectory/site/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-5 rounded-xl border border-primary/10 bg-primary/5 hover:bg-primary/10 hover:border-primary/20 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="p-3 bg-primary/10 rounded-lg text-primary group-hover:scale-110 transition-transform">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-heading text-sm font-bold text-foreground">
                      Sanatan Dharma Directory
                    </h4>
                    <p className="text-xs text-muted-foreground font-serif mt-1">
                      A comprehensive directory of spiritual resources, temples, services, and
                      literature.
                    </p>
                  </div>
                </div>
                <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
