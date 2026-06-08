"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardStore } from "@/store/dashboard-store";

const icons = {
  success: CheckCircle2,
  warning: TriangleAlert,
  danger: XCircle,
  info: Info
};

export function Toaster() {
  const toasts = useDashboardStore((state) => state.toasts);
  const dismissToast = useDashboardStore((state) => state.dismissToast);

  return (
    <div className="fixed right-4 top-4 z-50 w-96 max-w-[calc(100vw-2rem)] space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.tone];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.98 }}
              className="rounded-md border border-border bg-panel p-3 shadow-soft"
            >
              <div className="flex gap-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{toast.title}</div>
                  <div className="text-sm text-muted">{toast.description}</div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => dismissToast(toast.id)} aria-label="Dismiss">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
