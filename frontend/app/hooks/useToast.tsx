"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { XCircle, CheckCircle, Info } from "lucide-react";

// --- Types ---
type ToastType = "error" | "success" | "info";

interface ToastState {
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

// --- Context ---
const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Hook to access the toast system from any component inside `ToastProvider`.
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

/**
 * Provider component that manages toast state and renders the toast notification.
 * Wrap your app (or layout) with this provider.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: ToastType = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-start gap-3 px-5 py-4 rounded-2xl shadow-xl max-w-sm w-[90vw] backdrop-blur-md border ${
              toast.type === "error"
                ? "bg-red-50/90 border-red-200 text-red-800"
                : toast.type === "success"
                  ? "bg-emerald-50/90 border-emerald-200 text-emerald-800"
                  : "bg-amber-50/90 border-amber-200 text-amber-800"
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === "error" && <XCircle className="w-5 h-5 text-red-500" />}
              {toast.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-500" />}
              {toast.type === "info" && <Info className="w-5 h-5 text-amber-500" />}
            </div>
            <p className="font-serif text-sm leading-relaxed">{toast.message}</p>
            <button
              onClick={() => setToast(null)}
              className="ml-auto flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity text-lg leading-none cursor-pointer"
            >
              &times;
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}
