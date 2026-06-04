"use client";

import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface AccordionProps {
  id: string;
  title: string;
  explanation: string;
  icon: any;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const Accordion = React.memo(function Accordion({
  id,
  title,
  explanation,
  icon: Icon,
  isOpen,
  onToggle,
  children,
}: AccordionProps) {
  return (
    <div
      id={id}
      className="glass-parchment rounded-2xl vedic-border shadow-md overflow-hidden mb-5"
      style={{ overflowAnchor: "none" }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-primary/5 cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-xl text-primary flex-shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-heading text-xs md:text-sm text-foreground font-bold tracking-wider">
              {title}
            </h4>
            <p className="text-[10px] text-muted-foreground font-serif italic mt-0.5">
              {explanation}
            </p>
          </div>
        </div>
        <div className="text-muted-foreground flex-shrink-0 ml-3">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="p-6 border-t border-border/20 bg-muted/5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default Accordion;
