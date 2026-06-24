"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { UserNav } from "@/components/layout/UserNav";
import { Menu, X, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

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
      ? "text-primary font-bold"
      : "text-neutral hover:text-primary";
  };

  return (
    <div className="fixed top-0 w-full z-50 flex flex-col items-center pt-4 md:pt-6 px-4 md:px-6">
      <header className="w-full max-w-7xl bg-white/95 backdrop-blur-md rounded-full px-4 py-2 md:px-6 md:py-2 shadow-sm flex items-center justify-between border border-gray-100/50">
        
        {/* Bagian Kiri: Menu & Logo */}
        <div className="flex items-center gap-1 md:gap-3">
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

          <Link href="/" className="flex items-center gap-1 md:gap-2">
            <div className="relative flex h-6 w-6 md:h-8 md:w-8 items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="h-full w-full text-primary" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L20.66 7V17L12 22L3.34 17V7L12 2Z" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </svg>
            </div>
            <div className="font-bold text-lg md:text-xl tracking-tight">
              <span className="text-primary">CA</span><span className="text-secondary">VENT</span>
            </div>
          </Link>
        </div>

        {/* Navigation Links - Tengah */}
        <nav className="hidden md:flex items-center gap-10 text-sm font-medium transition-all">
          <Link href="/" className={`${getActiveClass("/")} transition-colors`}>Beranda</Link>
          <Link href="/events" className={`${getActiveClass("/events")} transition-colors`}>Acara</Link>
          {!isStudent && <Link href="/#tentang" className="text-neutral hover:text-primary transition-colors">Tentang</Link>}
          <Link href="/#kontak" className="text-neutral hover:text-primary transition-colors">Kontak</Link>
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
                  className="px-3 py-1.5 md:px-5 md:py-2 rounded-full text-xs md:text-sm font-semibold border border-primary/30 text-primary hover:border-primary hover:bg-primary-50 transition-all"
                >
                  Masuk
                </Link>
                <Link
                  href="/login"
                  className="px-4 py-1.5 md:px-6 md:py-2 rounded-full text-xs md:text-sm font-semibold bg-primary text-white shadow-sm hover:bg-[#0e517a] transition-colors"
                >
                  Daftar
                </Link>
              </>
            )
          )}
        </div>
      </header>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="w-full max-w-7xl mt-2 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg md:hidden flex flex-col gap-3 border border-gray-100">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className={`font-semibold px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors ${getActiveClass("/")}`}>Beranda</Link>
          <Link href="/events" onClick={() => setIsMobileMenuOpen(false)} className={`font-semibold px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors ${getActiveClass("/events")}`}>Acara</Link>
          {!isStudent && <Link href="/#tentang" onClick={() => setIsMobileMenuOpen(false)} className="font-semibold text-neutral hover:text-primary px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">Tentang</Link>}
          <Link href="/#kontak" onClick={() => setIsMobileMenuOpen(false)} className="font-semibold text-neutral hover:text-primary px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">Kontak</Link>
        </div>
      )}
    </div>
  );
}
