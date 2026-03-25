import { motion } from "framer-motion";
import { Download, Clock, User, Film, Music, AlertCircle } from "lucide-react";
import type { VideoInfoResponse } from "@workspace/api-client-react";
import { useDownload } from "@/hooks/use-download";
import { cn } from "@/lib/utils";

interface VideoResultProps {
  data: VideoInfoResponse;
}

const getPlatformColor = (platform: string) => {
  switch (platform.toLowerCase()) {
    case 'instagram': return 'bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-500';
    case 'facebook': return 'bg-blue-600';
    case 'tiktok': return 'bg-gradient-to-r from-cyan-500 to-pink-500';
    case 'youtube': return 'bg-red-600';
    default: return 'bg-primary';
  }
};

export function VideoResult({ data }: VideoResultProps) {
  const { downloadFile } = useDownload();

  const handleDownload = (url: string, quality: string, format: string) => {
    const filename = `${data.title.substring(0, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${quality}.${format}`;
    downloadFile(url, filename);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-4xl mx-auto glass-card rounded-3xl overflow-hidden mt-12 relative"
    >
      {/* Decorative background glow based on platform */}
      <div className={cn(
        "absolute -top-40 -right-40 w-96 h-96 opacity-20 blur-[100px] rounded-full pointer-events-none z-0",
        getPlatformColor(data.platform)
      )} />

      <div className="relative z-10 flex flex-col md:flex-row gap-6 p-6 md:p-8">
        
        {/* Thumbnail Section */}
        <div className="w-full md:w-5/12 lg:w-4/12 shrink-0">
          <div className="relative aspect-video md:aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl group">
            <img 
              src={data.thumbnail} 
              alt={data.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMxYTFhMjQiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBUaHVtYm5haWw8L3RleHQ+PC9zdmc+';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 mix-blend-multiply" />
            
            <div className="absolute top-4 left-4">
              <span className={cn(
                "px-3 py-1 text-xs font-bold uppercase tracking-wider text-white rounded-full shadow-lg backdrop-blur-md",
                getPlatformColor(data.platform)
              )}>
                {data.platform}
              </span>
            </div>
            
            <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-medium text-white/90">
              <Clock className="w-3.5 h-3.5" />
              {data.duration}
            </div>
          </div>
        </div>

        {/* Info & Downloads Section */}
        <div className="w-full md:w-7/12 lg:w-8/12 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground leading-tight line-clamp-2 mb-3">
              {data.title}
            </h2>
            <div className="flex items-center gap-3 text-muted-foreground mb-6">
              <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full text-sm">
                <User className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground/80">{data.author}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              Download Options
            </h3>
            
            {data.downloads.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.downloads.map((dl, idx) => (
                  <motion.button
                    key={`${dl.quality}-${idx}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => handleDownload(dl.url, dl.quality, dl.format)}
                    className="group relative flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/50 transition-all duration-300 overflow-hidden"
                  >
                    {/* Hover Glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300 shadow-inner">
                        {dl.format.includes('mp3') ? <Music className="w-5 h-5" /> : <Film className="w-5 h-5" />}
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-foreground group-hover:text-primary-foreground transition-colors">
                          {dl.quality}
                        </div>
                        <div className="text-xs text-muted-foreground uppercase font-medium flex items-center gap-2">
                          <span>{dl.format}</span>
                          {dl.size && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-white/20" />
                              <span>{dl.size}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative z-10 text-muted-foreground group-hover:text-primary transition-colors">
                      <Download className="w-5 h-5 group-hover:-translate-y-1 transition-transform duration-300" />
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm font-medium">No download links available for this video.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
