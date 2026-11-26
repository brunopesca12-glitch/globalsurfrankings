import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://gsr.surf"),
  title: {
    default: "GSR — Global Surf Rankings",
    template: "%s · GSR",
  },
  description: "The best wave wins. An asynchronous world circuit. Entry is free. Rankings are season points.",
  openGraph: {
    title: "GSR — Global Surf Rankings",
    description: "The best wave wins. An asynchronous world circuit. Entry is free. Rankings are season points.",
    url: "https://gsr.surf",
    siteName: "Global Surf Rankings",
    locale: "en_US",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${fraunces.variable} min-h-screen font-sans antialiased`}>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
