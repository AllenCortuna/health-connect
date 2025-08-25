import type { Metadata } from "next";
import { Martian_Mono } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "react-toastify";

const martianMono = Martian_Mono({
  variable: "--font-martian-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Health Connect",
  description: "Barangay Health Connect",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${martianMono.variable} antialiased font-mono tracking-normal text-zinc-500 text-xs font-light`}
      >
        <ToastContainer />
        {children}
      </body>
    </html>
  );
}
