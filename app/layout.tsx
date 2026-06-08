import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Job Scraper Dashboard",
  description: "Real-time ATS-style dashboard for multi-source job scraping pipelines."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
