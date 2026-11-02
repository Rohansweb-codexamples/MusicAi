import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Music AI — Studio",
  description:
    "Generate original songs, instrumentals and beats from a sentence. Studio-grade AI music with vocals, lyrics and full download access.",
};

export const viewport: Viewport = {
  themeColor: "#07050C",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
