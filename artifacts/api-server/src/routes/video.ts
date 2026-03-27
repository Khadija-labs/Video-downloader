import { Router, type IRouter } from "express";
import { GetVideoInfoBody, GetVideoInfoResponse } from "@workspace/api-zod";
import { z } from "zod";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createWriteStream, mkdirSync, existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const router: IRouter = Router();

/** Prefer bundled yt-dlp from build (reliable on Render); env overrides. */
function resolveYtDlpExecutable(): string {
  const fromEnv =
    process.env["YT_DLP_PATH"]?.trim() || process.env["YT_DLP"]?.trim();
  if (fromEnv) return fromEnv;

  const bundleDir = path.dirname(fileURLToPath(import.meta.url));
  const bundledName = os.platform() === "win32" ? "yt-dlp.exe" : "yt-dlp";
  const bundled = path.join(bundleDir, bundledName);
  if (existsSync(bundled)) return bundled;

  const cwdFallback = path.join(process.cwd(), bundledName);
  if (existsSync(cwdFallback)) return cwdFallback;

  return os.platform() === "win32" ? "yt-dlp.exe" : "yt-dlp";
}

const YT_DLP = resolveYtDlpExecutable();

// Temp dir for downloads
const DOWNLOAD_DIR = path.join(os.tmpdir(), "vidsave-downloads");
if (!existsSync(DOWNLOAD_DIR)) mkdirSync(DOWNLOAD_DIR, { recursive: true });

const YT_COOKIES_B64 = process.env["YT_COOKIES_B64"]?.trim();
const YT_COOKIES_FILE = path.join(DOWNLOAD_DIR, "yt-cookies.txt");
if (YT_COOKIES_B64) {
  try {
    const decoded = Buffer.from(YT_COOKIES_B64, "base64").toString("utf8");
    if (decoded.includes("youtube.com") || decoded.includes("# Netscape")) {
      writeFileSync(YT_COOKIES_FILE, decoded, "utf8");
    }
  } catch (err) {
    console.warn("Failed to decode YT_COOKIES_B64:", err);
  }
}

function detectPlatform(url: string): string {
  if (/instagram\.com/i.test(url)) return "instagram";
  if (/facebook\.com|fb\.watch/i.test(url)) return "facebook";
  if (/tiktok\.com/i.test(url)) return "tiktok";
  if (/youtube\.com|youtu\.be/i.test(url)) return "youtube";
  if (/twitter\.com|x\.com/i.test(url)) return "twitter";
  return "unknown";
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function isSupportedPlatform(platform: string): boolean {
  return ["instagram", "facebook", "tiktok", "youtube", "twitter"].includes(platform);
}

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function buildDownloadUrl(originalUrl: string, formatId: string, filename: string): string {
  return `/api/video/download?url=${encodeURIComponent(originalUrl)}&formatId=${encodeURIComponent(formatId)}&filename=${encodeURIComponent(filename)}`;
}

// POST /api/video/info
router.post("/info", async (req, res) => {
  try {
    const body = GetVideoInfoBody.parse(req.body);
    const { url } = body;

    if (!isValidUrl(url)) {
      res.status(400).json({ error: "Please enter a valid URL starting with http:// or https://", code: "INVALID_URL" });
      return;
    }

    const platform = detectPlatform(url);
    if (!isSupportedPlatform(platform)) {
      res.status(400).json({
        error: "Platform not supported. Please use Instagram, Facebook, TikTok, YouTube, or Twitter/X links.",
        code: "UNSUPPORTED_PLATFORM",
      });
      return;
    }

    // Use yt-dlp to extract video metadata
    let meta: any;
    try {
      const infoArgs = [
        "--dump-json",
        "--no-playlist",
        "--no-warnings",
        "--socket-timeout", "20",
      ];
      if (platform === "youtube" && existsSync(YT_COOKIES_FILE)) {
        infoArgs.push("--cookies", YT_COOKIES_FILE);
      }
      infoArgs.push(url);

      const { stdout } = await execFileAsync(YT_DLP, infoArgs, { timeout: 30000 });
      meta = JSON.parse(stdout);
    } catch (err: any) {
      const stderr =
        typeof err?.stderr === "string"
          ? err.stderr.slice(0, 800)
          : err?.stderr?.toString?.()?.slice(0, 800);
      req.log.error({ err, stderr, ytDlp: YT_DLP }, "yt-dlp metadata extraction failed");

      const ytAuthNeeded =
        typeof stderr === "string" &&
        /sign in to confirm you're not a bot|cookies-from-browser|pass-cookies-to-yt-dlp/i.test(
          stderr,
        );

      if (ytAuthNeeded) {
        res.status(400).json({
          error:
            "This YouTube link requires sign-in/cookies verification. Please try another public link.",
          code: "YOUTUBE_AUTH_REQUIRED",
        });
        return;
      }

      res.status(400).json({
        error: "Could not fetch video info. The link may be private, expired, or unsupported.",
        code: "EXTRACTION_FAILED",
      });
      return;
    }

    const title: string = meta.title || "Untitled Video";
    const thumbnail: string = meta.thumbnail || meta.thumbnails?.[0]?.url || "";
    const author: string = meta.uploader || meta.channel || meta.creator || "Unknown";
    const duration: string = formatDuration(meta.duration);
    const safeTitle = title.replace(/[^\w\s-]/g, "").trim().substring(0, 40).replace(/\s+/g, "_") || "video";

    // Build download quality options from available formats
    const formats: any[] = meta.formats || [];

    // Group by quality: best video+audio combined, plus audio-only
    const qualityMap: Array<{ label: string; formatId: string; ext: string; size: string }> = [];

    const videoFormats = formats.filter((f) => f.vcodec !== "none" && f.acodec !== "none");
    const audioFormats = formats.filter((f) => f.vcodec === "none" && f.acodec !== "none");

    // Pick specific height tiers
    const tiers = [
      { label: "HD 1080p", height: 1080 },
      { label: "HD 720p", height: 720 },
      { label: "SD 480p", height: 480 },
    ];

    const usedIds = new Set<string>();
    for (const tier of tiers) {
      // Find best format at or near this height
      const match = videoFormats
        .filter((f) => f.height && f.height <= tier.height + 50)
        .sort((a, b) => (b.height || 0) - (a.height || 0))[0];

      if (match && !usedIds.has(match.format_id)) {
        const bytes = match.filesize || match.filesize_approx;
        const sizeMb = bytes ? `~${Math.round(bytes / 1024 / 1024)} MB` : "";
        qualityMap.push({
          label: tier.label,
          formatId: match.format_id,
          ext: match.ext || "mp4",
          size: sizeMb,
        });
        usedIds.add(match.format_id);
      }
    }

    // If no combined formats, use yt-dlp's best merged format
    if (qualityMap.length === 0) {
      qualityMap.push({
        label: "Best Quality",
        formatId: "bestvideo+bestaudio/best",
        ext: "mp4",
        size: "",
      });
    }

    // Audio only
    const bestAudio = audioFormats.sort((a, b) => (b.abr || 0) - (a.abr || 0))[0];
    if (bestAudio) {
      const bytes = bestAudio.filesize || bestAudio.filesize_approx;
      qualityMap.push({
        label: "Audio Only",
        formatId: bestAudio.format_id,
        ext: "mp3",
        size: bytes ? `~${Math.round(bytes / 1024 / 1024)} MB` : "",
      });
    } else {
      qualityMap.push({ label: "Audio Only", formatId: "bestaudio/best", ext: "mp3", size: "" });
    }

    const downloads = qualityMap.map(({ label, formatId, ext, size }) => ({
      quality: label,
      format: ext,
      url: buildDownloadUrl(url, formatId, `${safeTitle}_${label.replace(/\s+/g, "_")}.${ext}`),
      size,
    }));

    const response = GetVideoInfoResponse.parse({ title, thumbnail, platform, duration, author, downloads });
    res.json(response);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid request body.", code: "VALIDATION_ERROR" });
      return;
    }
    req.log.error({ err }, "Error in /video/info");
    res.status(500).json({ error: "Server error. Please try again.", code: "SERVER_ERROR" });
  }
});

// GET /api/video/download?url=...&formatId=...&filename=...
router.get("/download", async (req, res) => {
  const { url, formatId, filename } = req.query as Record<string, string>;

  if (!url || !formatId || !filename) {
    res.status(400).json({ error: "Missing required parameters.", code: "MISSING_PARAMS" });
    return;
  }

  if (!isValidUrl(url)) {
    res.status(400).json({ error: "Invalid URL.", code: "INVALID_URL" });
    return;
  }

  try {
    const safeFilename = filename.replace(/[/\\?%*:|"<>]/g, "_");
    const ext = path.extname(safeFilename) || ".mp4";
    const isAudio = ext === ".mp3";

    const outputPath = path.join(DOWNLOAD_DIR, `${Date.now()}${ext}`);

    // Build yt-dlp args
    const args = [
      "--no-playlist",
      "--no-warnings",
      "--socket-timeout", "30",
      "-f", formatId,
      "-o", outputPath,
    ];

    if (isAudio) {
      args.push("--extract-audio", "--audio-format", "mp3");
    } else {
      // Merge video+audio into mp4
      args.push("--merge-output-format", "mp4");
    }

    if (detectPlatform(url) === "youtube" && existsSync(YT_COOKIES_FILE)) {
      args.push("--cookies", YT_COOKIES_FILE);
    }
    args.push(url);

    await execFileAsync(YT_DLP, args, { timeout: 120000 });

    // Determine actual output path (yt-dlp may change extension)
    const actualPath = isAudio
      ? outputPath.replace(ext, ".mp3")
      : outputPath.replace(ext, ".mp4");

    const finalPath = existsSync(actualPath) ? actualPath : outputPath;

    if (!existsSync(finalPath)) {
      res.status(500).json({ error: "Download failed: file not created.", code: "FILE_NOT_FOUND" });
      return;
    }

    const mimeType = isAudio ? "audio/mpeg" : "video/mp4";
    res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
    res.setHeader("Content-Type", mimeType);

    const { createReadStream } = await import("node:fs");
    const stream = createReadStream(finalPath);
    stream.pipe(res);

    // Clean up after sending
    stream.on("end", () => {
      import("node:fs").then(({ unlink }) => unlink(finalPath, () => {}));
    });
  } catch (err: any) {
    const stderr =
      typeof err?.stderr === "string"
        ? err.stderr.slice(0, 800)
        : err?.stderr?.toString?.()?.slice(0, 800);
    req.log.error({ err, stderr, ytDlp: YT_DLP }, "yt-dlp download failed");
    if (!res.headersSent) {
      res.status(500).json({
        error: "Download failed. The video may be restricted or unavailable.",
        code: "DOWNLOAD_ERROR",
      });
    }
  }
});

export default router;
