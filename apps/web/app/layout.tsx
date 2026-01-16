import type { Metadata } from "next";
import { Noto_Sans_SC, Sora } from "next/font/google";
import "../styles/globals.css";

const fontDisplay = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display"
});

const fontBody = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "Script AI",
  description: "剧本构建与一致性协作平台"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={`${fontDisplay.variable} ${fontBody.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
