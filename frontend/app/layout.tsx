import type { Metadata } from "next";
import { Inter, Bebas_Neue, Space_Grotesk, Noto_Sans_Tamil } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import FontWrapper from "@/components/FontWrapper";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" });
const grotesk = Space_Grotesk({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-grotesk" });
const tamil = Noto_Sans_Tamil({ weight: ["400", "500", "600", "700"], subsets: ["tamil"], variable: "--font-tamil" });

export const metadata: Metadata = {
  title: "BumbleBee AI | Your AI Career Assistant",
  description: "AI-Powered Career Readiness, Resumes, and Interviews",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${bebas.variable} ${grotesk.variable} ${tamil.variable} bg-black text-white dark`}>
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
