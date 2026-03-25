import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Link2, Loader2, ArrowRight, CheckCircle2, Play, LayoutGrid, History } from "lucide-react";
import { useGetVideoInfo } from "@workspace/api-client-react";
import { VideoResult } from "@/components/video-result";
import { AdsSlot } from "@/components/ads-slot";
import { useToast } from "@/components/ui/use-toast";
import { addToHistory } from "@/pages/history";

const PLATFORMS = [
  { name: "Instagram", icon: "📸" },
  { name: "TikTok", icon: "🎵" },
  { name: "Facebook", icon: "👥" },
  { name: "YouTube", icon: "▶️" },
];

const FEATURES = [
  { title: "No Watermarks", desc: "Download high-quality videos completely free of annoying watermarks.", icon: LayoutGrid },
  { title: "Lightning Fast", desc: "Our servers process links in milliseconds so you don't have to wait.", icon: Play },
  { title: "Any Device", desc: "Works perfectly on your iPhone, Android, Mac, or Windows PC.", icon: CheckCircle2 },
];

export default function Home() {
  const [, navigate] = useLocation();
  const [url, setUrl] = useState("");
  const { toast } = useToast();

  // Pre-fill URL from query param (used by History page "re-download" button)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const preUrl = params.get("url");
    if (preUrl) setUrl(preUrl);
  }, []);

  const { mutate: fetchVideo, isPending, data: result, error } = useGetVideoInfo({
    mutation: {
      onSuccess: (data, variables) => {
        // Save to history
        addToHistory({
          url: variables.data.url,
          title: data.title,
          thumbnail: data.thumbnail,
          platform: data.platform,
          author: data.author,
          duration: data.duration,
        });
      },
      onError: (err: any) => {
        toast({
          title: "Error fetching video",
          description: err?.message || "Make sure the URL is valid and the video is public.",
          variant: "destructive",
        });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    try {
      new URL(url);
    } catch {
      toast({ title: "Invalid URL", description: "Please enter a valid http/https URL.", variant: "destructive" });
      return;
    }
    fetchVideo({ data: { url } });
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
    } catch {
      toast({ title: "Clipboard Access Denied", description: "Please paste the URL manually.", variant: "default" });
    }
  };

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/30">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
          alt=""
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-[100px] mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/90 to-background" />
      </div>

      <div className="relative z-10">
        {/* Navbar */}
        <header className="w-full border-b border-white/5 bg-background/20 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                <DownloadIcon className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">
                Vid<span className="text-primary">Save</span>
              </span>
            </div>
            <button
              onClick={() => navigate("/history")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
            >
              <History className="w-4 h-4" />
              History
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32 flex flex-col items-center">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-4xl text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-medium tracking-wide text-foreground/80">100% Free & Unlimited Downloads</span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6">
              Download Social Videos <br className="hidden sm:block" />
              <span className="text-gradient">In Seconds.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Save high-quality videos from Instagram, TikTok, Facebook, and YouTube directly to your device without watermarks.
            </p>

            {/* URL Input */}
            <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary via-fuchsia-500 to-accent rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000 group-hover:duration-200" />
              <div className="relative flex flex-col sm:flex-row items-center gap-2 p-2 bg-background/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                <div className="relative flex-1 flex items-center w-full">
                  <Link2 className="absolute left-4 w-5 h-5 text-muted-foreground" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste video URL here..."
                    className="w-full h-14 pl-12 pr-20 bg-transparent border-none focus:outline-none text-foreground text-lg placeholder:text-muted-foreground/60"
                    required
                  />
                  <button
                    type="button"
                    onClick={handlePaste}
                    className="absolute right-3 px-3 py-1.5 text-xs font-medium text-muted-foreground bg-white/5 hover:bg-white/10 hover:text-foreground rounded-lg transition-colors"
                  >
                    Paste
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isPending || !url}
                  className="w-full sm:w-auto h-14 px-8 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 shadow-[0_0_2rem_-0.5rem_hsl(var(--primary))] hover:shadow-[0_0_3rem_-0.5rem_hsl(var(--primary))] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 shrink-0"
                >
                  {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (<>Download <ArrowRight className="w-5 h-5" /></>)}
                </button>
              </div>
            </form>

            {/* Platforms */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {PLATFORMS.map((p) => (
                <div key={p.name} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors cursor-default">
                  <span className="text-lg">{p.icon}</span>
                  {p.name}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Ad slot - top */}
          <div className="w-full max-w-4xl mx-auto mb-12">
            <AdsSlot slotId="hero-ad-slot" format="horizontal" className="h-[90px]" />
          </div>

          {/* Results area */}
          <div className="w-full flex flex-col items-center justify-start" id="results">
            {isPending && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <div className="relative w-16 h-16 mb-6">
                  <div className="absolute inset-0 border-4 border-white/10 rounded-full" />
                  <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
                </div>
                <p className="text-lg font-medium animate-pulse">Extracting video details...</p>
              </motion.div>
            )}

            {!isPending && result && (
              <div className="w-full">
                <VideoResult data={result} sourceUrl={url} />
                <div className="mt-12 w-full max-w-4xl mx-auto">
                  <AdsSlot slotId="results-ad-slot" format="horizontal" />
                </div>
              </div>
            )}

            {!isPending && !result && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="w-full max-w-4xl mt-20">
                <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold mb-4">How It Works</h2>
                  <p className="text-muted-foreground">Three simple steps to save your favorite content.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                  <div className="hidden md:block absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2 z-0" />
                  {[
                    { step: "01", title: "Copy URL", desc: "Find the video you want and copy its link from the social app." },
                    { step: "02", title: "Paste & Fetch", desc: "Paste the link in the input box above and hit download." },
                    { step: "03", title: "Save File", desc: "Choose your preferred quality and save directly to your device." },
                  ].map((item) => (
                    <div key={item.step} className="relative z-10 bg-white/[0.03] border border-white/10 p-8 rounded-3xl text-center group hover:-translate-y-2 transition-transform duration-300">
                      <div className="w-14 h-14 mx-auto bg-background rounded-full border border-white/10 flex items-center justify-center font-bold text-xl text-primary mb-6 group-hover:scale-110 transition-transform">
                        {item.step}
                      </div>
                      <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {FEATURES.map((feature, idx) => (
                    <div key={idx} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-4">
                      <feature.icon className="w-8 h-8 text-accent" />
                      <h4 className="font-bold text-lg">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </main>

        <footer className="w-full border-t border-white/5 py-8 text-center text-sm text-muted-foreground relative z-10">
          <p>© {new Date().getFullYear()} VidSave Downloader. All rights reserved.</p>
          <p className="mt-2 text-xs opacity-50">For personal use only. Please respect copyright laws.</p>
        </footer>
      </div>
    </div>
  );
}

function DownloadIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}
