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

  return {
    ...data,
    platform,
    downloads: [
      {
        quality: "HD 1080p",
        format: "mp4",
        url: url,
        size: "~45 MB",
      },
      {
        quality: "HD 720p",
        format: "mp4",
        url: url,
        size: "~28 MB",
      },
      {
        quality: "SD 480p",
        format: "mp4",
        url: url,
        size: "~15 MB",
      },
      {
        quality: "Audio Only",
        format: "mp3",
        url: url,
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

export default router;
