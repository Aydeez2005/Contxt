import type { Metadata } from "next";
import { Syne, Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";

// Syne — geometric display grotesque, distinctive at large scale
const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "600", "700", "800"],
});

// Cormorant Garamond — used only for italic contrast inside headlines
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

// DM Sans — clean, readable body text
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Contxt — Organisational Intelligence",
  description:
    "Your team's memory, on demand. Connect your tools once — every employee gets instant answers in Telegram.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${cormorant.variable} ${dmSans.variable} h-full`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
