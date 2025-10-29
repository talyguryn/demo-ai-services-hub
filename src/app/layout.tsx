import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Services Hub",
  description: "Discover and use AI-powered applications",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        <div className="pt-10 md:pt-48 bg-gradient-to-b from-black to-violet-900">
          {children}
        </div>
      </body>
    </html>
  );
}
