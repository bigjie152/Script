import "../styles/globals.css";

export const metadata = {
  title: "Script Studio AI",
  description: "AI Studio UI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
