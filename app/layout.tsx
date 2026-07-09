import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Storeframing | Sell Online",
  description: "All in One E-commerce Platform",
  authors: [{ name: "Abdul Wahab" }],
  keywords: ["Storeframing", "Sell Online", "E-commerce Platform"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} h-full antialiased`}
    >
      <body className="flex flex-col min-h-screen">{children}</body>
    </html>
  );
}
