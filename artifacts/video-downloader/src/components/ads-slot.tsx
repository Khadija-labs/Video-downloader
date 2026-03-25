import { cn } from "@/lib/utils";

interface AdsSlotProps {
  className?: string;
  slotId?: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  label?: string;
}

export function AdsSlot({ className, slotId = "placeholder-slot", format = "auto", label = "Advertisement" }: AdsSlotProps) {
  return (
    <div 
      className={cn(
        "w-full bg-secondary/30 border border-white/5 rounded-2xl flex items-center justify-center overflow-hidden relative group",
        "min-h-[100px]", 
        className
      )}
      data-ad-slot={slotId}
      data-ad-format={format}
    >
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxjaXJjbGUgY3g9IjEiIGN5PSIxIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+Cjwvc3ZnPg==')] opacity-50 z-0"></div>
      <div className="text-center relative z-10 p-4">
        <span className="text-xs uppercase tracking-widest font-semibold text-muted-foreground/60 block mb-1">
          {label}
        </span>
        <span className="text-sm text-muted-foreground/40 group-hover:text-muted-foreground/80 transition-colors">
          Ad Placement ({format})
        </span>
      </div>
    </div>
  );
}
