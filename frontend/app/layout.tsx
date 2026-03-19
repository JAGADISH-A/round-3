import type { Metadata } from "next";
import { Inter, Bebas_Neue, IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/chat/Sidebar";
import { ConnectivityGuard } from "@/components/chat/ConnectivityGuard";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" });
const mono = IBM_Plex_Mono({ weight: ["400", "500", "600"], subsets: ["latin"], variable: "--font-mono" });
const grotesk = Space_Grotesk({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-grotesk" });

export const metadata: Metadata = {
  title: "CareerSpark AI | Your Personal Career Coach",
  description: "AI-Powered Career Readiness and Job Employability Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${bebas.variable} ${mono.variable} ${grotesk.variable} bg-[#050505] text-white`}>
      <body className="antialiased min-h-screen flex">
        <Sidebar />
        <main className="flex-1 h-screen overflow-hidden">
          {children}
        </main>
        <ConnectivityGuard />
      </body>
    </html>
  );
}
