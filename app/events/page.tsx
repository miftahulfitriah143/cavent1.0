"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Calendar,
  Clock,
  Users,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  Building2,
  User,
} from "lucide-react";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Footer } from "@/components/layout/Footer";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { getCategoryBadgeClass } from "@/lib/category";

const CATEGORIES = [
  { label: "Semua", color: "bg-primary text-white", inactive: "bg-white border border-gray-200 text-neutral hover:border-primary hover:text-primary" },
  { label: "Seminar", color: "bg-teal-500 text-white", inactive: "bg-white border border-teal-200 text-teal-700 hover:bg-teal-50" },
  { label: "Workshop", color: "bg-rose-500 text-white", inactive: "bg-white border border-rose-200 text-rose-700 hover:bg-rose-50" },
  { label: "Kompetisi", color: "bg-amber-500 text-white", inactive: "bg-white border border-amber-200 text-amber-700 hover:bg-amber-50" },
  { label: "Webinar", color: "bg-blue-500 text-white", inactive: "bg-white border border-blue-200 text-blue-700 hover:bg-blue-50" },
  { label: "Diskusi", color: "bg-violet-500 text-white", inactive: "bg-white border border-violet-200 text-violet-700 hover:bg-violet-50" },
];

const FILTER_PENYELENGGARA = [
  { label: "Semua Penyelenggara", group: null },
  { label: "Universitas", group: null },
  { label: "FEB — Manajemen", group: "Fak. Ekonomi & Bisnis" },
  { label: "FFP — Ilmu Komunikasi", group: "Fak. Falsafah & Peradaban" },
  { label: "FFP — Hubungan Internasional", group: "Fak. Falsafah & Peradaban" },
  { label: "FFP — Psikologi", group: "Fak. Falsafah & Peradaban" },
  { label: "FFP — Falsafah Agama", group: "Fak. Falsafah & Peradaban" },
  { label: "FIR — DKV", group: "Fak. Ilmu Rekayasa" },
  { label: "FIR — TI", group: "Fak. Ilmu Rekayasa" },
  { label: "FIR — DP", group: "Fak. Ilmu Rekayasa" },
];



const STATUS_OPTIONS = ["Gratis", "Berbayar", "Segera Dimulai", "Telah Lalu"];

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeOrganizer, setActiveOrganizer] = useState("Semua Penyelenggara");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState("Terbaru");
  const [isLoading, setIsLoading] = useState(true);
  const [organizers, setOrganizers] = useState<any[]>([]);

  useEffect(() => {
    // Fetch real events from Firestore
    const q = query(
      collection(db, "events"),
      where("status", "==", "published")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(eventData);
      setIsLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setIsLoading(false);
    });

    const qOrganizers = query(collection(db, "users"), where("role", "==", "organizer"));
    const unsubOrganizers = onSnapshot(qOrganizers, (snapshot) => {
      setOrganizers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribe();
      unsubOrganizers();
    };
  }, []);

  const filtered = events.filter((e) => {
    // 1. Kategori Tag
    const matchCat = activeCategory === "Semua" ? true : (Array.isArray(e.category) ? e.category.includes(activeCategory) : e.category === activeCategory);

    // 2. Search Query
    const matchSearch = !searchQuery || e.title?.toLowerCase().includes(searchQuery.toLowerCase()) || e.venue?.toLowerCase().includes(searchQuery.toLowerCase()) || e.organizerName?.toLowerCase().includes(searchQuery.toLowerCase()) || (typeof e.organizerProdi === "string" && e.organizerProdi.toLowerCase().includes(searchQuery.toLowerCase())) || (Array.isArray(e.organizerProdi) && e.organizerProdi.some((prodi: string) => prodi.toLowerCase().includes(searchQuery.toLowerCase())));

    // 3. Status/Dropdown Filter
    const isPastEvent = e.eventState === "completed";

    if (sortBy === "Telah Lalu") {
      if (!isPastEvent) return false;
    } else {
      if (isPastEvent) return false; // Hide past events by default
      if (sortBy === "Gratis" && e.feeType !== "Gratis") return false;
    }

    // 4. Penyelenggara Filter
    let matchOrganizer = true;
    if (activeOrganizer !== "Semua Penyelenggara") {
      const prod = e.organizerProdi;
      matchOrganizer = Array.isArray(prod) ? prod.includes(activeOrganizer) : prod === activeOrganizer;
    }

    return matchCat && matchSearch && matchOrganizer;
  }).sort((a, b) => {
    // Pengurutan (Selalu Terbaru)
    const dateA = a.createdAt?.seconds || 0;
    const dateB = b.createdAt?.seconds || 0;
    return dateB - dateA;
  });

  const matchedOrganizer = searchQuery.length >= 2
    ? organizers.find(o => o.displayName?.toLowerCase().includes(searchQuery.toLowerCase()))
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f6fa] font-sans">

      <PublicNavbar />

      {/* ── MINI HERO HEADER ────────────────────────── */}
      <section className="relative pt-24 md:pt-28 pb-10 bg-gradient-to-br from-primary-900 via-primary to-secondary overflow-hidden">
        {/* Dekorasi blob */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-48 h-48 bg-secondary/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            {/* Kiri: Judul */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="text-accent text-xs font-bold uppercase tracking-widest">Temukan Acara</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
                Jelajahi Acara <span className="text-accent">Kampus</span>
              </h1>
              <p className="text-white/70 text-sm mt-2 max-w-md">
                Semua kegiatan Universitas Paramadina dalam satu tempat. Daftar, hadir, dan berkembang bersama.
              </p>
            </div>

            {/* Kanan: Stats */}
            <div className="flex gap-6 md:gap-8">
              {[
                { value: "4", label: "Acara Aktif" },
                { value: "4", label: "Kategori" },
                { value: "180+", label: "Peserta" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-xl font-extrabold text-white">{stat.value}</div>
                  <div className="text-[10px] text-white/60 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Search Bar — menempel di bawah hero */}
          <div className="flex gap-3 mt-7">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral/50" />
              <input
                type="text"
                placeholder="Cari nama acara, penyelenggara, atau lokasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border-0 bg-white text-sm text-dark focus:outline-none focus:ring-2 focus:ring-accent/50 transition-shadow shadow-md"
              />
            </div>
            <button className="flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-amber-500 transition-colors shadow-md">
              Cari
            </button>
            <button
              className="md:hidden flex items-center justify-center bg-white/20 backdrop-blur-sm text-white border border-white/30 w-12 h-12 rounded-xl"
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ────────────────────────────── */}
      <main className="flex-1 pb-16 px-4 md:px-6">
        <div className="mx-auto max-w-7xl">

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 py-5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                onClick={() => setActiveCategory(cat.label)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all shadow-sm ${activeCategory === cat.label ? cat.color : cat.inactive
                  }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Layout: Sidebar + Grid */}
          <div className="flex flex-col md:flex-row gap-5 items-start">

            {/* ── SIDEBAR FILTER ── */}
            {/* Sidebar: full-width toggle di mobile, fixed-width di desktop */}
            <aside className={`${isMobileFilterOpen ? "block" : "hidden"} w-full md:block md:w-56 md:shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden`}>
              {/* Sidebar header strip */}
              <div className="bg-gradient-to-r from-primary to-secondary px-5 py-3">
                <h3 className="font-bold text-white text-sm">Filter Acara</h3>
              </div>

              <div className="p-5">
                {/* Penyelenggara */}
                <div className="mb-5">
                  <p className="text-[10px] font-bold text-neutral uppercase tracking-wider mb-3">Penyelenggara</p>
                  <ul className="space-y-1">
                    {(() => {
                      let lastGroup: string | null = undefined as any;
                      return FILTER_PENYELENGGARA.map((item) => {
                        const showHeader = item.group !== lastGroup && item.group !== null;
                        if (item.group !== null) lastGroup = item.group;
                        return (
                          <li key={item.label}>
                            {showHeader && (
                              <p className="text-[9px] font-bold text-primary/60 uppercase tracking-wider mt-3 mb-1.5 pl-0.5">
                                {item.group}
                              </p>
                            )}
                            <div className="flex items-center gap-2.5 py-0.5">
                              <div
                                onClick={() => setActiveOrganizer(item.label)}
                                className={`h-4 w-4 rounded-full shrink-0 cursor-pointer flex items-center justify-center border-2 transition-colors ${activeOrganizer === item.label
                                  ? "border-primary bg-primary"
                                  : "border-gray-300 bg-white"
                                  }`}
                              >
                                {activeOrganizer === item.label && (
                                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                                )}
                              </div>
                              <span
                                className="text-xs text-neutral cursor-pointer hover:text-dark transition-colors"
                                onClick={() => setActiveOrganizer(item.label)}
                              >
                                {item.group === null ? item.label : item.label.split(" — ")[1]}
                              </span>
                            </div>
                          </li>
                        );
                      });
                    })()}
                  </ul>
                </div>
              </div>
            </aside>

            {/* ── EVENT GRID ── */}
            <div className="w-full md:flex-1 md:min-w-0">

              {/* Banner Penyelenggara yang Terkait (Mirip UI Shopee) */}
              {searchQuery.length >= 2 && matchedOrganizer && (
                <div className="mb-6 bg-white rounded-2xl border border-primary/20 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in zoom-in duration-300">
                  <div className="flex items-center gap-4">
                    <img
                      src={matchedOrganizer.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(matchedOrganizer.displayName)}&background=0e517a&color=fff`}
                      alt={matchedOrganizer.displayName}
                      className="w-14 h-14 rounded-full object-cover border-2 border-primary/20 shadow-sm"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-dark text-base">{matchedOrganizer.displayName}</h3>
                        <span className="text-[9px] bg-secondary text-white px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider">Penyelenggara</span>
                      </div>
                      <p className="text-xs text-neutral flex items-center gap-1 mt-1">
                        Penyelenggara terkait dengan &quot;{searchQuery}&quot;
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/organizers/${matchedOrganizer.id}`}
                    className="flex items-center justify-center gap-1 text-sm font-semibold text-accent border border-accent px-5 py-2.5 rounded-xl hover:bg-accent hover:text-white transition-colors whitespace-nowrap"
                  >
                    Kunjungi Profil
                  </Link>
                </div>
              )}

              {/* Header row */}
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-neutral">
                  Menampilkan <span className="font-bold text-dark">{filtered.length} Acara</span>
                </p>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none border border-gray-200 bg-white rounded-lg px-4 py-2 pr-8 text-sm font-semibold text-dark focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option>Terbaru</option>
                    <option>Telah Lalu</option>
                    <option>Gratis</option>
                    <option>Segera Dimulai</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral pointer-events-none" />
                </div>
              </div>

              {/* Cards Grid / Loading State */}
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
                      <div className="h-44 bg-gray-200"></div>
                      <div className="p-5">
                        <div className="flex gap-2 mb-3">
                          <div className="h-4 w-16 bg-gray-200 rounded-full"></div>
                          <div className="h-4 w-16 bg-gray-200 rounded-full"></div>
                        </div>
                        <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 w-1/2 bg-gray-200 rounded mb-4"></div>
                        <div className="space-y-2 mb-4">
                          <div className="h-3 w-full bg-gray-100 rounded"></div>
                          <div className="h-3 w-5/6 bg-gray-100 rounded"></div>
                        </div>
                        <div className="flex justify-between items-end pt-3 border-t border-gray-50">
                          <div className="h-6 w-16 bg-gray-200 rounded"></div>
                          <div className="h-8 w-20 bg-gray-200 rounded-xl"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filtered.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {filtered.map((event) => (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group flex flex-col cursor-pointer"
                    >
                      {/* Event Image Area */}
                      <div className={`h-44 bg-gray-100 relative overflow-hidden`}>
                        <img
                          src={event.bannerUrl || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop"}
                          alt={event.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        {/* Status badge */}
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-dark shadow-sm border border-white/20`}>
                            {event.feeType}
                          </span>
                          {event.eventState === "started" && (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-500/90 backdrop-blur-sm text-white shadow-sm flex items-center gap-1.5 animate-pulse">
                              <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                              Berlangsung
                            </span>
                          )}
                          {event.eventState === "completed" && (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-500/90 backdrop-blur-sm text-white shadow-sm flex items-center gap-1.5">
                              Selesai
                            </span>
                          )}
                        </div>
                        {/* Seats badge */}
                        <div className="absolute bottom-3 right-3 bg-black/30 backdrop-blur-sm rounded-lg px-2.5 py-1 flex items-center gap-1.5">
                          <Users className="h-3 w-3 text-white" />
                          <span className="text-white text-[10px] font-semibold">{event.registeredCount || 0}/{event.maxCapacity} Kursi</span>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="p-5 flex flex-col flex-1">
                        {/* Tags */}
                        <div className="flex gap-2 mb-3 flex-wrap">
                          {Array.isArray(event.category) ? (
                            event.category.map((cat: string) => (
                              <span key={cat} className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getCategoryBadgeClass(cat)}`}>
                                {cat}
                              </span>
                            ))
                          ) : (
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getCategoryBadgeClass(event.category || "General")}`}>
                              {event.category}
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-dark text-sm mb-3 line-clamp-2 group-hover:text-primary transition-colors leading-snug h-10">
                          {event.title}
                        </h3>

                        <div className="flex flex-col gap-1.5 text-xs text-neutral mb-4 flex-1">
                          <span className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-primary/40 shrink-0" />
                            <span className="line-clamp-1">{Array.isArray(event.organizerProdi) ? event.organizerProdi.join(", ") : event.organizerProdi}</span>
                          </span>
                          <span className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-primary/40 shrink-0" />
                            <span className="line-clamp-1">{event.organizerName}</span>
                          </span>
                          <span className="flex items-center gap-2 mt-1">
                            <MapPin className="h-3.5 w-3.5 text-primary/40 shrink-0" />
                            <span className="line-clamp-1">{event.venue}</span>
                          </span>
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-2">
                              <Calendar className="h-3.5 w-3.5 text-primary/40 shrink-0" />
                              {event.startDate}
                            </span>
                            <span className="flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5 text-primary/40 shrink-0" />
                              {event.startTime}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                          <div>
                            <span className="text-[10px] text-neutral">Biaya</span>
                            <div className="text-sm font-extrabold text-dark">{event.feeType === "Gratis" ? "Gratis" : "Berbayar"}</div>
                          </div>
                          <span
                            className="bg-primary text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-primary-900 hover:shadow-md hover:shadow-primary/20 transition-all"
                          >
                            Detail
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="text-neutral font-semibold">Tidak ada acara ditemukan</p>
                  <p className="text-xs text-neutral/70 mt-1">Coba ubah kata kunci atau filter yang dipilih.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
