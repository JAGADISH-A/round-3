import type { Metadata } from "next";
import { Inter, Orbitron, Share_Tech_Mono, Rajdhani, Noto_Sans_Tamil } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import FontWrapper from "@/components/FontWrapper";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron" });
const techMono = Share_Tech_Mono({ weight: "400", subsets: ["latin"], variable: "--font-tech-mono" });
const rajdhani = Rajdhani({ weight: ["300", "400", "500", "600", "700"], subsets: ["latin"], variable: "--font-rajdhani" });
const tamil = Noto_Sans_Tamil({ weight: ["400", "500", "600", "700"], subsets: ["tamil"], variable: "--font-tamil" });

export const metadata: Metadata = {
  title: "BumbleBee AI | Strategic Hub",
  description: "AI Interview Simulation & Career Diagnostic Terminal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable} ${techMono.variable} ${rajdhani.variable} ${tamil.variable} bg-black text-white dark`}>
      <body className="antialiased min-h-screen">
        <AuthProvider>
          <LanguageProvider>
            <FontWrapper>
              {children}
            </FontWrapper>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
