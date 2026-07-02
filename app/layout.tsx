import type { Metadata } from "next";
import { Poppins, Lora } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { NotificationListener } from "@/components/providers/NotificationListener";
import "./globals.css";

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: "--font-poppins",
  subsets: ["latin"],
});

const lora = Lora({
  weight: ['400', '500', '600', '700'],
  variable: "--font-lora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cavent - Pusat Informasi Kegiatan Universitas Paramadina",
  description: "Platform satu pintu untuk manajemen acara kampus.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${poppins.variable} ${lora.variable} h-full antialiased scroll-smooth scroll-pt-24 md:scroll-pt-28`}
    >
      <body className={`${poppins.variable} ${lora.variable} antialiased min-h-full flex flex-col font-sans`}>
        <AuthProvider>
          <NotificationListener />
          {children}
          <Toaster position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}
