import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Newsreader, Outfit } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
});

export const metadata: Metadata = {
  title: "Weekly habits of the dollar rate",
  description:
    "Weekday patterns in the National Bank of Belarus official US dollar rate over the last three months.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${newsreader.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <TooltipProvider>
          <div className="h-1 bg-foreground" />
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
