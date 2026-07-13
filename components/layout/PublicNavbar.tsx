"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { UserNav } from "@/components/layout/UserNav";
import { Menu, X, ChevronLeft, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export function PublicNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, role, isLoading } = useAuth();
  const isStudent = role === "mahasiswa";

  // Deteksi apakah sedang di halaman detail (misal: /events/[id])
  const isDetailPage = pathname.startsWith("/events/") && pathname !== "/events";

  const getActiveClass = (path: string) => {
    return (path === "/" ? pathname === "/" : pathname.startsWith(path))
      ? "text-primary font-bold underline decoration-2 underline-offset-8"
      : "text-neutral hover:text-primary font-normal";
  };

  return (
    <div className="fixed top-0 w-full z-50 flex flex-col items-center pt-4 md:pt-6 px-4 md:px-6">
      <header className="w-full max-w-7xl h-16 bg-white/70 backdrop-blur-xl rounded-full px-4 md:px-6 shadow-sm flex items-center justify-between relative border border-white/50">

        {/* Bagian Kiri: Menu & Logo */}
        <div className="flex items-center gap-2 md:gap-3">
          {isDetailPage ? (
            <button
              className="md:hidden p-1.5 -ml-1.5 text-accent rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => router.push("/events")}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          ) : (
            <button
              className="md:hidden p-1.5 -ml-1.5 text-primary rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}

          <Link href="/" className="flex items-center">
            <div className="relative h-5 w-28 md:h-7 md:w-32">
              <Image src="/CAVENT5.svg" alt="Cavent Logo" fill className="object-contain object-left" priority />
            </div>
          </Link>
        </div>

        {/* Navigation Links - Tengah */}
        <nav className="hidden md:flex items-center gap-10 text-sm transition-all">
          <Link href="/" className={`${getActiveClass("/")} hover:-translate-y-0.5 transition-all inline-block`}>Beranda</Link>
          <Link href="/events" className={`${getActiveClass("/events")} hover:-translate-y-0.5 transition-all inline-block`}>Acara</Link>
          {!isStudent && <Link href="/tentang" className={`${getActiveClass("/tentang")} hover:-translate-y-0.5 transition-all inline-block`}>Tentang</Link>}
          <Link href="/#kontak" className="text-neutral font-normal hover:text-primary hover:-translate-y-0.5 transition-all inline-block">Kontak</Link>
        </nav>

        {/* Buttons Kanan */}
        <div className="flex items-center gap-2 md:gap-3">
          {!isLoading && (
            user ? (
              <UserNav />
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-5 py-2 md:px-7 md:py-2.5 rounded-full text-xs md:text-sm font-bold bg-accent text-white shadow-sm hover:bg-amber-600 hover:-translate-y-0.5 transition-all"
                >
                  Mulai Sekarang
                </Link>
              </>
            )
          )}
        </div>
      </header>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="w-full max-w-7xl mt-2 bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl p-4 shadow-lg md:hidden flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className={`font-semibold px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors ${getActiveClass("/")}`}>Beranda</Link>
          <Link href="/events" onClick={() => setIsMobileMenuOpen(false)} className={`font-semibold px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors ${getActiveClass("/events")}`}>Acara</Link>
          {!isStudent && <Link href="/tentang" onClick={() => setIsMobileMenuOpen(false)} className={`font-semibold px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors ${getActiveClass("/tentang")}`}>Tentang</Link>}
          <Link href="/#kontak" onClick={() => setIsMobileMenuOpen(false)} className="font-semibold text-neutral hover:text-primary px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">Kontak</Link>
        </div>
      )}
    </div>
  );
}
