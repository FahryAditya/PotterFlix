"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CircleCheck } from "lucide-react";
import { usePotterStore } from "@/stores/use-potter-store";

/**
 * Animated toast notification backed by Zustand toast queue.
 */
export function ToastNotification() {
  const { toastMessage, toastKey, hideToast } = usePotterStore();

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => hideToast(), 2400);
    return () => clearTimeout(timer);
  }, [toastMessage, toastKey, hideToast]);

  return (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          key={toastKey}
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ duration: 0.22 }}
          className="pointer-events-none fixed right-6 bottom-6 z-50 flex items-center gap-3 rounded-xl border border-white/15 bg-[#1e1e22] px-4 py-3 text-xs text-white shadow-2xl"
        >
          <CircleCheck
            className="h-4 w-4 shrink-0 text-brand-red"
            aria-hidden="true"
          />
          <span>{toastMessage}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
