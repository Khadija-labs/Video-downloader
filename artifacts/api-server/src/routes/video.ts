import { Router, type IRouter } from "express";
import { GetVideoInfoBody, GetVideoInfoResponse } from "@workspace/api-zod";
import { z } from "zod";

const router: IRouter = Router();

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

function getMockVideoData(url: string, platform: string) {
  const platformData: Record<string, {
    title: string;
    thumbnail: string;
    author: string;
    duration: string;
  }> = {
    instagram: {
      title: "Amazing Instagram Reel",
      thumbnail: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=640&q=80",
      author: "@instagram_creator",
      duration: "0:30",
    },
    facebook: {
      title: "Facebook Video Post",
      thumbnail: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=640&q=80",
      author: "Facebook User",
      duration: "1:45",
    },
    tiktok: {
      title: "Viral TikTok Video",
      thumbnail: "https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=640&q=80",
      author: "@tiktok_star",
      duration: "0:15",
    },
    youtube: {
      title: "YouTube Video - Amazing Content",
      thumbnail: "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=640&q=80",
      author: "YouTube Channel",
      duration: "10:32",
    },
    twitter: {
      title: "Twitter/X Video Post",
      thumbnail: "https://images.unsplash.com/photo-1611162618479-ee4d9c0be0e0?w=640&q=80",
      author: "@twitter_user",
      duration: "0:45",
    },
  };

  const data = platformData[platform] || {
    title: "Social Media Video",
    thumbnail: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=640&q=80",
    author: "Content Creator",
    duration: "1:00",
  };

  // Build download URLs that route through our proxy so the browser downloads the file
  const buildDownloadUrl = (quality: string, format: string) =>
    `/api/video/download?url=${encodeURIComponent(url)}&quality=${encodeURIComponent(quality)}&format=${encodeURIComponent(format)}&platform=${encodeURIComponent(platform)}`;

  return {
    ...data,
    platform,
    downloads: [
      {
        quality: "HD 1080p",
        format: "mp4",
        url: buildDownloadUrl("hd1080", "mp4"),
        size: "~45 MB",
      },
      {
        quality: "HD 720p",
        format: "mp4",
        url: buildDownloadUrl("hd720", "mp4"),
        size: "~28 MB",
      },
      {
        quality: "SD 480p",
        format: "mp4",
        url: buildDownloadUrl("sd480", "mp4"),
        size: "~15 MB",
      },
      {
        quality: "Audio Only",
        format: "mp3",
        url: buildDownloadUrl("audio", "mp3"),
        size: "~3 MB",
      },
    ],
  };
}

router.post("/info", async (req, res) => {
  try {
    const body = GetVideoInfoBody.parse(req.body);
    const { url } = body;

    if (!isValidUrl(url)) {
      res.status(400).json({
        error: "Please enter a valid URL starting with http:// or https://",
        code: "INVALID_URL",
      });
      return;
    }

    const platform = detectPlatform(url);

    if (!isSupportedPlatform(platform)) {
      res.status(400).json({
        error: "This platform is not supported. Please use Instagram, Facebook, TikTok, YouTube, or Twitter/X links.",
        code: "UNSUPPORTED_PLATFORM",
      });
      return;
    }

    const videoData = getMockVideoData(url, platform);
    const response = GetVideoInfoResponse.parse(videoData);
    res.json(response);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        error: "Invalid request body. Please provide a URL.",
        code: "VALIDATION_ERROR",
      });
      return;
    }
    req.log.error({ err }, "Error fetching video info");
    res.status(500).json({
      error: "Failed to process the video URL. Please try again.",
      code: "PROCESSING_ERROR",
    });
  }
});

// Download proxy endpoint — serves content with Content-Disposition: attachment
// so the browser triggers a save dialog instead of navigating.
router.get("/download", async (req, res) => {
  const { url, quality, format, platform } = req.query as Record<string, string>;

  if (!url || !quality || !format) {
    res.status(400).json({ error: "Missing required query parameters.", code: "MISSING_PARAMS" });
    return;
  }

  try {
    // Determine a friendly filename
    const safeTitle = (platform || "video").replace(/[^a-z0-9]/gi, "_");
    const filename = `${safeTitle}_${quality}.${format}`;

    // In a real app, url would be a direct CDN/stream URL obtained from yt-dlp or
    // a third-party API. We proxy it so the browser receives it as a download.
    const upstream = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; VidSave/1.0)",
      },
    });

    if (!upstream.ok) {
      res.status(502).json({
        error: "Could not fetch the video from the source. The link may have expired.",
        code: "UPSTREAM_ERROR",
      });
      return;
    }

    const contentType = upstream.headers.get("content-type") || (format === "mp3" ? "audio/mpeg" : "video/mp4");

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", contentType);

    const upstreamLength = upstream.headers.get("content-length");
    if (upstreamLength) {
      res.setHeader("Content-Length", upstreamLength);
    }

    // Stream the response body directly to the client
    if (upstream.body) {
      const reader = upstream.body.getReader();
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
        res.end();
      };
      await pump();
    } else {
      const buffer = await upstream.arrayBuffer();
      res.send(Buffer.from(buffer));
    }
  } catch (err) {
    req.log.error({ err }, "Error proxying video download");
    if (!res.headersSent) {
      res.status(500).json({
        error: "Download failed. Please try again.",
        code: "DOWNLOAD_ERROR",
      });
    }
  }
});

export default router;
