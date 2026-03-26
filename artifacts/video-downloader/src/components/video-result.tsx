import { motion } from "framer-motion";
import { Download, Clock, User, Film, Music, AlertCircle } from "lucide-react";
import type { VideoInfoResponse } from "@workspace/api-client-react";
import { useDownload } from "@/hooks/use-download";
import { addToHistory } from "@/pages/history";
import { cn } from "@/lib/utils";

interface VideoResultProps {
  data: VideoInfoResponse;
  sourceUrl: string;
}

const getPlatformGradient = (platform: string) => {
  switch (platform.toLowerCase()) {
    case "instagram": return "from-yellow-500 via-pink-500 to-purple-500";
    case "facebook": return "from-blue-600 to-blue-400";
    case "tiktok": return "from-cyan-500 to-pink-500";
    case "youtube": return "from-red-600 to-red-500";
    default: return "from-primary to-accent";
  }
};

const getPlatformBadge = (platform: string) => {
  switch (platform.toLowerCase()) {
    case "instagram": return "bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600";
    case "facebook": return "bg-blue-600";
    case "tiktok": return "bg-gradient-to-r from-cyan-500 to-pink-500";
    case "youtube": return "bg-red-600";
    default: return "bg-primary";
  }
};

export function VideoResult({ data, sourceUrl }: VideoResultProps) {
  const { downloadFile } = useDownload();

  const handleDownload = (url: string, quality: string, format: string) => {
    const safeName = data.title.substring(0, 30).replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const filename = `${safeName}_${quality}.${format}`;
    downloadFile(url, filename);

    // Update history entry with the quality that was chosen
    addToHistory({
      url: sourceUrl,
      title: data.title,
      thumbnail: data.thumbnail,
      platform: data.platform,
      author: data.author,
      duration: data.duration,
      downloadedQuality: quality,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-4xl mx-auto rounded-3xl overflow-hidden mt-12 relative bg-white/75 dark:bg-white/[0.05] border border-primary/20 dark:border-white/10 shadow-2xl"
    >
      {/* Platform glow */}
      <div className={cn(
        "absolute -top-40 -right-40 w-96 h-96 opacity-20 blur-[100px] rounded-full pointer-events-none z-0 bg-gradient-to-br",
        getPlatformGradient(data.platform)
      )} />

      <div className="relative z-10 flex flex-col md:flex-row gap-6 p-6 md:p-8">

        {/* Thumbnail */}
        <div className="w-full md:w-5/12 lg:w-4/12 shrink-0">
          <div className="relative aspect-video md:aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl group">
            <img
              src={data.thumbnail}
              alt={data.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).style.opacity = "0";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="absolute top-4 left-4">
              <span className={cn("px-3 py-1 text-xs font-bold uppercase tracking-wider text-white rounded-full shadow-lg", getPlatformBadge(data.platform))}>
                {data.platform}
              </span>
            </div>

            <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-medium text-white/90">
              <Clock className="w-3.5 h-3.5" />
              {data.duration}
            </div>
          </div>
        </div>

        {/* Info & Downloads */}
        <div className="w-full md:w-7/12 lg:w-8/12 flex flex-col justify-between">
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-tight line-clamp-2 mb-3">
              {data.title}
            </h2>
            <div className="flex items-center gap-2 text-muted-foreground dark:text-foreground/85">
              <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full text-sm">
                <User className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground/90">{data.author}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground dark:text-foreground/80 mb-4">
              Download Options
            </h3>

            {data.downloads.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.downloads.map((dl, idx) => (
                  <motion.button
                    key={`${dl.quality}-${idx}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    onClick={() => handleDownload(dl.url, dl.quality, dl.format)}
                    className="group relative flex items-center justify-between p-4 rounded-xl bg-white/70 dark:bg-white/5 border border-primary/20 dark:border-white/10 hover:bg-white/90 dark:hover:bg-white/10 hover:border-primary/50 transition-all duration-200 text-left overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                        {dl.format === "mp3" ? <Music className="w-5 h-5" /> : <Film className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="font-bold text-foreground text-sm">{dl.quality}</div>
                        <div className="text-xs text-muted-foreground dark:text-foreground/80 uppercase flex items-center gap-2">
                          <span>{dl.format}</span>
                          {dl.size && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-white/20 inline-block" />
                              <span>{dl.size}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Download className="w-5 h-5 text-muted-foreground dark:text-foreground/80 group-hover:text-primary group-hover:-translate-y-0.5 transition-all duration-200 relative z-10 shrink-0" />
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">No download options available for this video.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
