import { useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

export function useDownload() {
  const { toast } = useToast();

  const downloadFile = useCallback((url: string, filename: string) => {
    try {
      // All download URLs now route through our /api/video/download proxy,
      // which serves Content-Disposition: attachment — so the anchor download
      // attribute reliably triggers a save dialog without navigating away.
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      // Do NOT set target="_blank" — it overrides the download attribute for cross-origin URLs
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast({
        title: "Download started",
        description: `Saving ${filename}…`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not initiate the download. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  return { downloadFile };
}
