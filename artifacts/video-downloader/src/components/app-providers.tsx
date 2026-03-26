"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Moon, Sun } from "lucide-react";
import { ThemeProvider, useTheme } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const [preset, setPreset] = useState<
    "lavender" | "ocean" | "neon" | "accent"
  >("lavender");

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("vidsave_theme_preset");
    if (
      stored === "lavender" ||
      stored === "ocean" ||
      stored === "neon" ||
      stored === "accent"
    ) {
      setPreset(stored);
      document.documentElement.setAttribute("data-theme-preset", stored);
    } else {
      document.documentElement.setAttribute("data-theme-preset", "lavender");
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("vidsave_theme_preset", preset);
    document.documentElement.setAttribute("data-theme-preset", preset);
  }, [preset, mounted]);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  return (
    <div className="fixed top-[72px] right-4 z-[60] flex items-center gap-2">
      <div className="flex items-center gap-1 rounded-full bg-card/85 border border-border/70 px-2 py-1 backdrop-blur">
        <button
          aria-label="Lavender theme"
          onClick={() => setPreset("lavender")}
          className={`h-4 w-4 rounded-full bg-violet-400 ring-2 ${preset === "lavender" ? "ring-white" : "ring-transparent"}`}
        />
        <button
          aria-label="Ocean theme"
          onClick={() => setPreset("ocean")}
          className={`h-4 w-4 rounded-full bg-sky-400 ring-2 ${preset === "ocean" ? "ring-white" : "ring-transparent"}`}
        />
        <button
          aria-label="Neon theme"
          onClick={() => setPreset("neon")}
          className={`h-4 w-4 rounded-full bg-fuchsia-500 ring-2 ${preset === "neon" ? "ring-white" : "ring-transparent"}`}
        />
        <button
          aria-label="Accent theme"
          onClick={() => setPreset("accent")}
          className={`h-4 w-4 rounded-full bg-[#FF6B6B] ring-2 ${preset === "accent" ? "ring-white" : "ring-transparent"}`}
        />
      </div>
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label="Toggle theme"
        className={[
          "h-7 w-18 rounded-full p-0.5 transition-all duration-300",
          "border shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)]",
          isDark
            ? "bg-gradient-to-r from-violet-600 via-indigo-500 to-sky-500 border-violet-300/40"
            : "bg-card/85 border-border/70",
        ].join(" ")}
      >
        <span
          className={[
            "flex h-6 w-6 items-center justify-center rounded-full bg-white text-violet-600",
            "shadow-md transition-transform duration-300",
            isDark ? "translate-x-[43px]" : "translate-x-0",
          ].join(" ")}
        >
          {isDark ? (
            <Moon className="h-3.5 w-3.5" />
          ) : (
            <Sun className="h-3.5 w-3.5 text-amber-500" />
          )}
        </span>
      </button>
    </div>
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider delayDuration={300}>
          <ThemeToggle />
          {children}
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
