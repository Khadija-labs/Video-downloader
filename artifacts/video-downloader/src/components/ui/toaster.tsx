import { useToast } from "./use-toast";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className={cn(
              "glass-card p-4 flex items-start justify-between gap-4 overflow-hidden relative",
              toast.variant === "destructive" ? "border-destructive/50" : "border-primary/20"
            )}
          >
            {/* Subtle glow effect behind toast */}
            <div className={cn(
              "absolute -inset-10 opacity-20 blur-2xl z-0 rounded-full",
              toast.variant === "destructive" ? "bg-destructive" : "bg-primary"
            )} />
            
            <div className="relative z-10 flex-1">
              {toast.title && <h4 className="font-semibold text-foreground text-sm">{toast.title}</h4>}
              {toast.description && <p className="text-sm text-muted-foreground mt-1">{toast.description}</p>}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="relative z-10 text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
