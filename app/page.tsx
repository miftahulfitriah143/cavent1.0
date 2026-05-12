"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Calendar,
  Users,
  MapPin,
  ArrowRight,
  Menu,
  X,
  BarChart3,
  Bell,
  QrCode,
  CheckCircle,
  Globe,
  FileText,
  Zap,
  Clock,
} from "lucide-react";

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">

      {/* ═══════════════════════════════════════════
          NAVBAR - Floating Pill (sama dengan halaman login)
      ═══════════════════════════════════════════ */}
      <div className="fixed top-0 w-full z-50 flex flex-col items-center pt-4 md:pt-6 px-4 md:px-6">
        <header className="w-full max-w-7xl bg-white/95 backdrop-blur-md rounded-full px-4 py-2 md:px-6 md:py-3 shadow-sm flex items-center justify-between relative">

          {/* Bagian Kiri: Menu & Logo */}
          <div className="flex items-center gap-1 md:gap-3">
            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-1.5 -ml-1.5 text-primary rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Logo Icon */}
            <div className="relative flex h-6 w-6 md:h-8 md:w-8 items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="h-full w-full text-primary" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L20.66 7V17L12 22L3.34 17V7L12 2Z" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </svg>
            </div>
            {/* Logo Text */}
            <div className="font-bold text-lg md:text-xl tracking-tight">
              <span className="text-primary">CA</span><span className="text-secondary">VENT</span>
            </div>
          </div>

          {/* Navigation Links - Tengah */}
          <nav className="hidden md:flex items-center gap-10 text-sm font-medium text-neutral">
            <a href="#" className="text-primary font-semibold">Beranda</a>
            <Link href="/events" className="hover:text-primary transition-colors">Acara</Link>
            <a href="#tentang" className="hover:text-primary transition-colors">Tentang</a>
            <a href="#kontak" className="hover:text-primary transition-colors">Kontak</a>
          </nav>

          {/* Buttons Kanan */}
          <div className="flex items-center gap-2 md:gap-3">
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
          </div>
        </header>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="w-full max-w-7xl mt-2 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg md:hidden flex flex-col gap-3">
            <a href="#" className="font-semibold text-primary px-3 py-2 rounded-lg bg-blue-50">Beranda</a>
            <Link href="/events" onClick={() => setIsMobileMenuOpen(false)} className="font-semibold text-neutral hover:text-primary px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">Acara</Link>
            <a href="#tentang" onClick={() => setIsMobileMenuOpen(false)} className="font-semibold text-neutral hover:text-primary px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">Tentang</a>
            <a href="#kontak" onClick={() => setIsMobileMenuOpen(false)} className="font-semibold text-neutral hover:text-primary px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">Kontak</a>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-[#0a2540] via-[#116295] to-[#1EA99C] overflow-hidden pt-24 pb-16">

        {/* Dekorasi background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-secondary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative mx-auto max-w-7xl w-full px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Kiri: Teks */}
            <div className="text-white">
              <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4">
                Kelola Acara <span className="text-accent">Kampus</span><br />
                Lebih Mudah &<br />
                Terorganisir
              </h1>
              <p className="text-white/75 text-base leading-relaxed mb-8 max-w-lg">
                CAVENT menghubungkan penyelenggara dan audiens dalam satu platform. Buat, kelola, dan ikuti acara kampus dengan mudah.
              </p>
              <div className="flex flex-wrap items-center gap-3 mb-12">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-amber-500 transition-colors shadow-lg shadow-amber-500/30"
                >
                  Mulai Sekarang
                </Link>
                <a
                  href="#acara"
                  className="inline-flex items-center gap-2 border border-white/50 text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-white/10 transition-colors"
                >
                  Lihat Acara
                </a>
              </div>

              {/* Stats */}
              <div className="flex gap-10">
                <div>
                  <div className="text-2xl font-extrabold text-white">120+</div>
                  <div className="text-xs text-white/60 mt-0.5">Acara Terlaksana</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-white">4.8k</div>
                  <div className="text-xs text-white/60 mt-0.5">Pengguna Aktif</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-white">98%</div>
                  <div className="text-xs text-white/60 mt-0.5">Kepuasan Peserta</div>
                </div>
              </div>
            </div>

            {/* Kanan: Floating Event Cards */}
            <div className="hidden lg:flex flex-col gap-4 items-end">
              {/* Card 1 */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 w-72 text-white hover:bg-white/15 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-accent/20 text-accent border border-accent/30 px-2 py-0.5 rounded-full">
                    Upcoming
                  </span>
                </div>
                <p className="font-bold text-sm mb-2">Seminar Nasional Teknologi 2026</p>
                <div className="flex items-center gap-3 text-xs text-white/70">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />Aula Firmanzah Lt.8
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />25 Mei 2026
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />300 Kursi
                  </span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 w-72 text-white hover:bg-white/15 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-accent/20 text-accent border border-accent/30 px-2 py-0.5 rounded-full">
                    Upcoming
                  </span>
                </div>
                <p className="font-bold text-sm mb-2">Workshop UI/UX Design Thinking</p>
                <div className="flex items-center gap-3 text-xs text-white/70">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />Lab Komputer
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />30 Jun 2026
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />50 Kursi
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FEATURES SECTION
      ═══════════════════════════════════════════ */}
      <section id="tentang" className="py-20 bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-2xl font-extrabold text-dark mb-3">
              Solusi Terpadu untuk Manajemen Event Kampus
            </h2>
            <p className="text-neutral text-sm max-w-xl mx-auto">
              CAVENT hadir dengan fitur lengkap untuk mendukung kesuksesan setiap kegiatan organisasi dan mahasiswa
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Calendar,
                color: "bg-blue-50 text-primary",
                title: "Manajemen Terpadu",
                desc: "Buat, edit, dan hapus acara dengan mudah, lengkap dengan pengaturan kuota, kategori, dan media.",
              },
              {
                icon: QrCode,
                color: "bg-teal-50 text-secondary",
                title: "Absensi QR Code",
                desc: "Sistem absensi digital yang akurat dan cepat menggunakan kode QR unik untuk setiap peserta.",
              },
              {
                icon: Bell,
                color: "bg-amber-50 text-accent",
                title: "Notifikasi Real-time",
                desc: "Kirim pengumuman dan pengingat kepada peserta terdaftar secara otomatis dan tepat waktu.",
              },
              {
                icon: BarChart3,
                color: "bg-purple-50 text-purple-600",
                title: "Analitik & Laporan",
                desc: "Pantau statistik pendaftar, tingkat kehadiran, dan feedback peserta dalam satu dashboard.",
              },
              {
                icon: CheckCircle,
                color: "bg-green-50 text-green-600",
                title: "Alur Persetujuan",
                desc: "Sistem review dan persetujuan acara oleh admin untuk menjaga kualitas kegiatan kampus.",
              },
              {
                icon: Globe,
                color: "bg-red-50 text-red-500",
                title: "Promosi Mudah",
                desc: "Bagikan halaman acara ke seluruh sivitas akademika dengan satu klik melalui tautan unik.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className={`inline-flex items-center justify-center h-11 w-11 rounded-xl mb-4 ${feature.color}`}>
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-dark mb-2 text-sm">{feature.title}</h3>
                <p className="text-neutral text-xs leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          UPCOMING EVENTS SECTION
      ═══════════════════════════════════════════ */}
      <section id="acara" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-2xl font-extrabold text-dark mb-1">Acara Kampus Mendatang</h2>
              <p className="text-neutral text-sm">Temukan acara menarik di Universitas Paramadina</p>
            </div>
            <Link
              href="/events"
              className="flex items-center gap-1 text-sm font-semibold text-primary hover:text-[#0e517a] transition-colors whitespace-nowrap"
            >
              Lihat Semua <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Seminar Nasional Teknologi 2026",
                location: "Aula Firmanzah Lt.8",
                date: "25 Mei 2026",
                price: "Rp 50.000",
                registered: 160,
                capacity: 300,
                tags: ["Seminar", "Teknologi"],
              },
              {
                title: "Workshop UI/UX Design Thinking",
                location: "Lab Komputer",
                date: "30 Jun 2026",
                price: "Rp 75.000",
                registered: 50,
                capacity: 80,
                tags: ["Workshop", "Desain"],
              },
              {
                title: "IT Fest 2026",
                location: "Aula Firmanzah Lt.8",
                date: "25 Okt 2026",
                price: "Gratis",
                registered: 0,
                capacity: 500,
                tags: ["Festival", "Teknologi"],
              },
            ].map((event) => (
              <div
                key={event.title}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
              >
                {/* Image Placeholder */}
                <div className="h-40 bg-gradient-to-br from-gray-200 to-gray-300 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center opacity-30">
                    <Calendar className="h-16 w-16 text-gray-500" />
                  </div>
                </div>

                <div className="p-5">
                  {/* Tags */}
                  <div className="flex gap-2 mb-3">
                    {event.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h3 className="font-bold text-dark text-sm mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                    {event.title}
                  </h3>

                  <div className="flex flex-col gap-1.5 text-xs text-neutral mb-4">
                    <span className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                      {event.location}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                      {event.date}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-neutral">{event.registered}/{event.capacity} Kursi</div>
                      <div className="text-sm font-bold text-dark">{event.price}</div>
                    </div>
                    <Link
                      href="/login"
                      className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#0e517a] transition-colors"
                    >
                      Daftar
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CTA SECTION
      ═══════════════════════════════════════════ */}
      <section className="py-24 bg-gradient-to-br from-[#0a2540] via-[#116295] to-[#1EA99C] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4" />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Siap Menyelenggarakan Acara?
          </h2>
          <p className="text-white/70 text-base mb-10 max-w-xl mx-auto">
            Bergabung dengan ratusan penyelenggara yang sudah mempercayakan manajemen acara mereka kepada CAVENT.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-accent text-white px-7 py-3.5 rounded-full font-semibold text-sm hover:bg-amber-500 transition-colors shadow-lg shadow-amber-500/30"
            >
              Daftar sebagai Penyelenggara
            </Link>
            <a
              href="#tentang"
              className="inline-flex items-center gap-2 border border-white/50 text-white px-7 py-3.5 rounded-full font-semibold text-sm hover:bg-white/10 transition-colors"
            >
              Pelajari Lebih Lanjut
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════ */}
      <footer id="kontak" className="bg-[#0a1929] text-white/70 py-8 md:py-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-8 mb-8">
            {/* Kolom 1: Branding */}
            <div className="col-span-2 md:col-span-2 md:pr-10">
              <div className="flex items-center gap-2 mb-3">
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-secondary" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L20.66 7V17L12 22L3.34 17V7L12 2Z" />
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                </svg>
                <span className="font-bold text-base text-white tracking-tight">
                  CA<span className="text-secondary">VENT</span>
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-white/50">
                Platform manajemen acara kampus terpadu untuk seluruh sivitas akademika Universitas Paramadina.
              </p>
            </div>

            {/* Kolom 2: Platform */}
            <div>
              <h4 className="text-white font-bold text-xs mb-3">PLATFORM</h4>
              <ul className="space-y-1.5 text-[11px]">
                {["Buat Acara", "Temukan Acara", "Dashboard", "Analitik"].map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Kolom 3: Dukungan */}
            <div>
              <h4 className="text-white font-bold text-xs mb-3">Dukungan</h4>
              <ul className="space-y-1.5 text-[11px]">
                {["Panduan Pengguna", "FAQ", "Hubungi Kami", "Laporan Bug"].map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Kolom 4: Institusi */}
            <div>
              <h4 className="text-white font-bold text-xs mb-3">Institusi</h4>
              <ul className="space-y-1.5 text-[11px]">
                {["Tentang Kami", "Kebijakan Privasi", "Syarat & Ketentuan"].map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <p className="text-center text-[10px] text-white/40">
              © {new Date().getFullYear()} CAVENT — Universitas Paramadina. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
