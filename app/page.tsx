"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Users,
  MapPin,
  ArrowRight,
  BarChart3,
  Bell,
  QrCode,
  CheckCircle,
  Globe,
  Clock,
  CalendarDays,
  Star,
  User,
  CheckCircle2
} from "lucide-react";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/components/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";

export default function LandingPage() {
  const { role } = useAuth();
  const isStudent = role === "audiens";
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "events"),
      where("status", "==", "published")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter((e: any) => e.eventState !== "completed")
        .sort((a: any, b: any) => {
          const dateA = a.createdAt?.seconds || 0;
          const dateB = b.createdAt?.seconds || 0;
          return dateB - dateA; // Descending
        });
      
      setUpcomingEvents(events.slice(0, 3));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const QUICK_ACTIONS = [
    { title: "Profil Saya", icon: User, href: "/audiens/profile", color: "bg-blue-50 text-blue-600" },
    { title: "Acara Saya", icon: CalendarDays, href: "/audiens/my-events", color: "bg-teal-50 text-teal-600" },
    { title: "Ulasan Saya", icon: Star, href: "/audiens/ratings", color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">

      <PublicNavbar />

      {/* ═══════════════════════════════════════════
          HERO / DASHBOARD HEADER SECTION
      ═══════════════════════════════════════════ */}
      {isStudent ? (
        <section className="pt-28 pb-12 px-6 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-10">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-primary-900 to-primary rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-14 text-white relative overflow-hidden shadow-2xl shadow-primary/20">
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10 max-w-2xl">
                <h1 className="text-lg md:text-3xl font-extrabold tracking-tight mb-3 md:mb-6">Selamat Datang Kembali, Venters! 👋</h1>
                <p className="text-white/80 text-xs md:text-base leading-relaxed mb-6 md:mb-10">
                  Siap untuk menjelajahi pengalaman baru di kampus? Cari acara menarik dan kembangkan potensi dirimu bersama Cavent.
                </p>
                <Link href="/events" className="inline-flex items-center gap-2 md:gap-3 bg-accent text-white px-5 py-2.5 md:px-10 md:py-4 rounded-xl md:rounded-2xl font-bold text-xs md:text-lg hover:bg-amber-500 transition-all shadow-lg shadow-accent/30">
                  Cari Acara Sekarang
                  <ArrowRight className="h-4 w-4 md:h-6 md:w-6" />
                </Link>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.title}
                  href={action.href}
                  className="bg-white p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all flex flex-col items-center text-center group"
                >
                  <div className={`h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-2xl ${action.color} flex items-center justify-center mb-3 md:mb-5 group-hover:scale-110 transition-transform shadow-sm`}>
                    <action.icon className="h-5 w-5 md:h-7 md:w-7" />
                  </div>
                  <h3 className="font-bold text-sm md:text-lg text-dark">{action.title}</h3>
                  <p className="text-[10px] md:text-xs text-neutral mt-0.5 md:mt-1">Kelola {action.title.toLowerCase()}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="relative min-h-screen flex items-center bg-gradient-to-br from-primary-900 via-primary to-secondary overflow-hidden pt-24 pb-16">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-secondary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative mx-auto max-w-7xl w-full px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
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
                    className="inline-flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-amber-600 hover:-translate-y-0.5 transition-all shadow-lg shadow-amber-500/30"
                  >
                    Mulai Sekarang
                  </Link>
                  <a
                    href="#acara"
                    className="inline-flex items-center gap-2 border border-white/50 text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-white/10 hover:-translate-y-0.5 transition-all"
                  >
                    Lihat Acara
                  </a>
                </div>

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

              <div className="hidden lg:flex flex-col gap-4 items-end">
                {upcomingEvents.slice(0, 2).map((event) => (
                  <div key={event.id} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 w-72 text-white hover:bg-white/15 transition-colors overflow-hidden">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-accent/20 text-accent border border-accent/30 px-2 py-0.5 rounded-full">
                        Upcoming
                      </span>
                    </div>
                    <p className="font-bold text-sm mb-3 line-clamp-2 leading-snug">{event.title}</p>
                    <div className="grid grid-cols-3 gap-1 text-xs text-white/70">
                      <span className="flex items-center gap-1 min-w-0">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{event.venue}</span>
                      </span>
                      <span className="flex items-center gap-1 min-w-0">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span className="truncate">{event.startDate ? new Date(event.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBA'}</span>
                      </span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Users className="h-3 w-3 shrink-0" />
                        {event.maxCapacity} Kursi
                      </span>
                    </div>
                  </div>
                ))}
                {isLoading && upcomingEvents.length === 0 && (
                  <>
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl h-32 w-72 animate-pulse"></div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl h-32 w-72 animate-pulse"></div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {!isStudent && (
        <section id="tentang" className="py-20 bg-gray-50/50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-2xl font-extrabold text-dark mb-3">
                Solusi Terpadu untuk Manajemen Event Kampus
              </h2>
              <p className="text-neutral text-sm max-w-xl mx-auto">
                CAVENT hadir dengan fitur lengkap untuk mendukung kesuksesan setiap kegiatan organisasi dan audiens
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
      )}

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
            {isLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 h-80 animate-pulse" />
              ))
            ) : upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={role ? `/events/${event.id}` : "/login"}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full cursor-pointer"
                >
                  <div className="h-44 bg-gray-100 relative overflow-hidden">
                    <img
                      src={event.bannerUrl || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop"}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex gap-2 mb-3">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/5 text-primary border border-primary/10">
                        {event.category}
                      </span>
                    </div>

                    <h3 className="font-bold text-dark text-sm mb-3 line-clamp-2 group-hover:text-primary transition-colors h-10">
                      {event.title}
                    </h3>

                    <div className="flex flex-col gap-1.5 text-xs text-neutral mb-4 flex-1">
                      <span className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-primary/40 shrink-0" />
                        {event.venue}
                      </span>
                      <span className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-primary/40 shrink-0" />
                        {event.startDate}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div>
                        <div className="text-xs text-neutral">0/{event.maxCapacity} Kursi</div>
                        <div className="text-sm font-bold text-dark">{event.feeType}</div>
                      </div>
                      <span
                        className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary-900 transition-colors"
                      >
                        Detail
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full py-20 text-center bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                <p className="text-neutral font-medium">Belum ada acara mendatang.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {!isStudent && (
        <section className="py-24 bg-gradient-to-br from-primary-900 via-primary to-secondary relative overflow-hidden">
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
                className="inline-flex items-center gap-2 bg-accent text-white px-7 py-3.5 rounded-full font-bold text-sm hover:bg-amber-600 hover:-translate-y-0.5 transition-all shadow-lg shadow-amber-500/30"
              >
                Daftar sebagai Penyelenggara
              </Link>
              <a
                href="#tentang"
                className="inline-flex items-center gap-2 border border-white/50 text-white px-7 py-3.5 rounded-full font-bold text-sm hover:bg-white/10 hover:-translate-y-0.5 transition-all"
              >
                Pelajari Lebih Lanjut
              </a>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
