import "@/index.css";
import { AppProviders } from "@/components/app-providers";

export const metadata = {
  title: "VidSave",
  description: "Social media video downloader",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
