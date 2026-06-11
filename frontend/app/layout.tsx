import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "AISQL – AI-Powered SQL Analytics",
  description:
    "Upload any CSV, ask questions in plain English, and get instant SQL queries, charts, and AI-driven business insights.",
  keywords: ["SQL", "AI", "analytics", "CSV", "data", "Gemini", "natural language"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans bg-[#040712] text-white antialiased`}>
        {/* Background gradient blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -left-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-violet-800/10 rounded-full blur-3xl" />
        </div>

        <Navbar />
        <main className="pt-16 min-h-screen">{children}</main>
      </body>
    </html>
  );
}
