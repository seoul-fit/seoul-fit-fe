import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LoginButton from "@/components/LoginButton";

const geist = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Seoul Fit Map",
    description: "AI 기반 공공시설 통합 네비게이터",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko">
        <body className={`${geist.variable} ${geistMono.variable} antialiased`}>
        {/* 우측 상단 로그인 버튼 */}
        <header className="absolute top-4 right-4 z-50">
            <LoginButton />
        </header>

        {children}
        </body>
        </html>
    );
}