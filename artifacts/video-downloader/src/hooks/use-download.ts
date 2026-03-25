import { useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

export function useDownload() {
  const { toast } = useToast();

  const downloadFile = useCallback((url: string, filename: string) => {
    try {
      // In a real scenario with direct URLs, creating an anchor tag and clicking it
      // triggers the browser's download manager if the server sends Content-Disposition: attachment
      // or if we use the 'download' attribute.
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Download started",
        description: "Your file is downloading.",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not initiate the download. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  return { downloadFile };
}
