"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Calendar,
  MapPin,
  Mic,
  Building2,
  Bell,
  GraduationCap,
  Sparkles,
  Users,
  X,
  Share2,
  Heart,
  Clock,
  Info,
  Star,
  Award,
  CheckCircle2,
  Ticket,
  User
} from "lucide-react";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/components/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp, query, where, getDocs, deleteDoc, onSnapshot } from "firebase/firestore";
import toast from "react-hot-toast";

export default function EventDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const isEmailVerified = user?.emailVerified || user?.email === "mita@paramadina.ac.id" || user?.email === "miftahulfitriah143@gmail.com";
  const { id } = React.use(params);
  const [event, setEvent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("detail");
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [activePreviewImage, setActivePreviewImage] = useState<string | null>(null);
  const [currentHeroIdx, setCurrentHeroIdx] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [ratingBreakdown, setRatingBreakdown] = useState<number[]>([0, 0, 0, 0, 0]);

  useEffect(() => {
    // 1. Real-time Subscription for Event Data
    const docRef = doc(db, "events", id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setEvent({ id: docSnap.id, ...docSnap.data() });
        setIsLoading(false);
      } else {
        toast.error("Acara tidak ditemukan");
        router.push("/events");
      }
    }, (error) => {
      console.error("Error fetching event:", error);
      toast.error("Gagal memuat data acara");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [id, router]);

  useEffect(() => {
    // 2. Fetch User Registration Status & Reviews
    const fetchAdditionalData = async () => {
      try {
        if (user) {
          const regQuery = query(
            collection(db, "registrations"),
            where("eventId", "==", id),
            where("userId", "==", user.uid)
          );
          const regSnap = await getDocs(regQuery);
          if (!regSnap.empty) {
            setIsRegistered(true);
            setRegistrationData({ id: regSnap.docs[0].id, ...regSnap.docs[0].data() });
          } else {
            setIsRegistered(false);
            setRegistrationData(null);
          }
        }

        const reviewsQuery = query(
          collection(db, "reviews"),
          where("eventId", "==", id)
        );
        const reviewsSnap = await getDocs(reviewsQuery);
        const loadedReviews = reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        
        loadedReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setReviews(loadedReviews);

        if (loadedReviews.length > 0) {
          const sum = loadedReviews.reduce((acc, curr) => acc + curr.rating, 0);
          setAverageRating(Math.round((sum / loadedReviews.length) * 10) / 10);

          const breakdown = [0, 0, 0, 0, 0]; // index 0=5*, 1=4*, 2=3*, 3=2*, 4=1*
          loadedReviews.forEach(r => {
            const starIndex = 5 - r.rating;
            if (starIndex >= 0 && starIndex < 5) {
              breakdown[starIndex]++;
            }
          });
          setRatingBreakdown(breakdown);
        }
      } catch (error) {
        console.error("Error fetching additional data:", error);
      }
    };

    fetchAdditionalData();
  }, [id, user]);

  const handleRegister = async () => {
    if (!user) {
      toast.error("Silakan login untuk mendaftar");
      router.push("/login");
      return;
    }

    if (!isEmailVerified) {
      toast.error("Silakan verifikasi email Anda terlebih dahulu!");
      return;
    }

    setIsActionLoading(true);
    try {
      const newRegRef = await addDoc(collection(db, "registrations"), {
        userId: user.uid || "",
        userEmail: user.email || "",
        userName: user.displayName || "Mahasiswa",
        eventId: id,
        eventTitle: event.title || "Acara Tanpa Judul",
        eventDate: event.startDate || "",
        eventVenue: event.venue || "",
        eventBanner: event.bannerUrl || "",
        organizerId: event.organizerId || "",
        registeredAt: serverTimestamp(),
        status: "confirmed"
      });

      const eventRef = doc(db, "events", id);
      await updateDoc(eventRef, {
        registeredCount: increment(1)
      });

      // Buat notifikasi untuk organizer
      if (event.organizerId) {
        await addDoc(collection(db, "notifications"), {
          userId: event.organizerId,
          type: "NEW_REGISTRATION",
          title: "Pendaftar Baru",
          message: `${user.displayName || "Mahasiswa"} baru saja mendaftar ke acara Anda: ${event.title || "Acara Tanpa Judul"}`,
          eventId: id,
          status: "unread",
          createdAt: serverTimestamp(),
        });
      }

      setIsRegistered(true);
      setRegistrationData({ id: newRegRef.id, status: "confirmed" });
      toast.success("Berhasil mendaftar acara!");
    } catch (error: any) {
      console.error("Registration Error:", error);
      toast.error("Gagal mendaftar: " + (error?.message || "Kesalahan tak dikenal"));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!user) return;
    if (!window.confirm("Apakah Anda yakin ingin membatalkan pendaftaran?")) return;

    setIsActionLoading(true);
    try {
      const regQuery = query(
        collection(db, "registrations"),
        where("eventId", "==", id),
        where("userId", "==", user.uid)
      );
      const regSnap = await getDocs(regQuery);

      if (!regSnap.empty) {
        await deleteDoc(doc(db, "registrations", regSnap.docs[0].id));
        const eventRef = doc(db, "events", id);
        await updateDoc(eventRef, {
          registeredCount: increment(-1)
        });
        setIsRegistered(false);
        toast.success("Pendaftaran dibatalkan.");
      }
    } catch (error) {
      console.error("Cancel Error:", error);
      toast.error("Gagal membatalkan pendaftaran");
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-neutral text-sm font-bold tracking-widest uppercase">Memuat Acara...</p>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const seatsLeft = event.maxCapacity - (event.registeredCount || 0);
  const progressPercentage = Math.round(((event.registeredCount || 0) / event.maxCapacity) * 100);
  const allMedia = [event.bannerUrl, ...(event.additionalMedia || [])];

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans flex flex-col relative overflow-x-clip">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[30%] h-[30%] bg-accent/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-[20%] w-[50%] h-[50%] bg-secondary/5 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
      </div>
      <div className="hidden md:block">
        <PublicNavbar />
      </div>

      {/* DESKTOP HERO SECTION */}
      <section className="hidden md:flex w-full bg-gradient-to-br from-primary-900 via-primary to-secondary pt-32 pb-16 items-center relative z-10 overflow-hidden">
        {/* Dynamic Blurred Overlay Blended with Brand Gradient */}
        <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-0">
          <img
            src={allMedia[currentHeroIdx]}
            alt="Hero Background Blur"
            className="w-full h-full object-cover blur-[100px] opacity-30 scale-110"
          />
          {/* Subtle Dark Overlay to keep text contrast perfect */}
          <div className="absolute inset-0 bg-black/45" />
        </div>

        <div className="max-w-7xl mx-auto px-6 w-full flex gap-12 items-center relative z-10">
          {/* Left: Image Container */}
          <div
            onClick={() => setActivePreviewImage(allMedia[currentHeroIdx])}
            className="w-[55%] relative group rounded-2xl overflow-hidden shadow-2xl h-[450px] cursor-zoom-in bg-black/40 flex items-center justify-center"
          >
            {/* Blurred Background */}
            <img
              src={allMedia[currentHeroIdx]}
              alt="Blurred Background"
              className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-60 scale-110 pointer-events-none select-none"
            />
            {/* Crisp Main Poster Image */}
            <img
              src={allMedia[currentHeroIdx]}
              alt="Banner"
              className="relative z-10 max-h-full max-w-full object-contain transition-all duration-500 ease-in-out group-hover:scale-[1.02]"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (navigator.share) {
                  navigator.share({
                    title: event.title,
                    text: `Mari ikuti acara ${event.title} di Cavent!`,
                    url: window.location.href,
                  }).catch(console.error);
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Tautan acara berhasil disalin!");
                }
              }}
              className="absolute top-6 right-6 h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-lg text-gray-500 hover:text-primary transition-colors z-10"
              title="Bagikan Acara"
            >
              <Share2 className="h-5 w-5" />
            </button>
            {allMedia.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentHeroIdx((prev) => (prev === 0 ? allMedia.length - 1 : prev - 1));
                  }}
                  className="absolute top-1/2 left-4 -translate-y-1/2 h-10 w-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg text-gray-700 transition-all active:scale-90 z-10"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentHeroIdx((prev) => (prev === allMedia.length - 1 ? 0 : prev + 1));
                  }}
                  className="absolute top-1/2 right-4 -translate-y-1/2 h-10 w-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg text-gray-700 transition-all active:scale-90 z-10"
                >
                  <ChevronLeft className="h-5 w-5 rotate-180" />
                </button>
              </>
            )}
          </div>

          {/* Right: Info Container */}
          <div className="w-[45%] text-white flex flex-col justify-center">
            {reviews.length > 0 && (
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 w-fit mb-4 text-xs font-bold text-amber-400">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span>{averageRating}</span>
                <span className="text-white/60 font-semibold">•</span>
                <span className="text-white/80">{reviews.length} Ulasan</span>
              </div>
            )}
            <h1 className="text-4xl font-bold leading-tight mb-8">{event.title}</h1>

            <div className="space-y-5 text-gray-200">
              <div className="flex items-start gap-4">
                <MapPin className="h-5 w-5 shrink-0 mt-0.5 text-gray-400" />
                <span className="text-sm leading-relaxed">{event.venue}</span>
              </div>
              <div className="flex items-center gap-4">
                <Calendar className="h-5 w-5 shrink-0 text-gray-400" />
                <span className="text-sm">{event.startDate}{event.startTime ? `, ${event.startTime} WIB` : ''}</span>
              </div>
              <div className="flex items-center gap-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-gray-400"><path d="M4 7V4h16v3" /><path d="M4 17v3h16v-3" /><path d="M4 12h16" /><path d="M4 7a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2" /><path d="M20 7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2" /></svg>
                <span className="text-sm">Ticket prices start from {event.feeType === "Gratis" ? "Gratis" : "IDR 986,000"}</span>
              </div>
              <div className="flex items-center gap-4">
                <Building2 className="h-5 w-5 shrink-0 text-gray-400" />
                <span className="text-sm">{Array.isArray(event.organizerProdi) ? event.organizerProdi.join(", ") : event.organizerProdi}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MOBILE GALLERY */}
      <section className="relative w-full md:hidden pt-0">
        <div className="w-full">
          <div className="relative group">
            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide h-[350px]">
              {allMedia.map((url, idx) => (
                <div key={idx} className="w-full shrink-0 snap-start relative h-full" onClick={() => setActivePreviewImage(url)}>
                  <img src={url} alt={`Media ${idx}`} className="w-full h-full object-cover" />
                  <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-widest">
                    {idx + 1} / {allMedia.length}
                  </div>
                </div>
              ))}
            </div>

            <div className="absolute top-4 left-4 flex gap-3 z-30">
              <button
                onClick={() => router.push("/events")}
                className="h-10 w-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl border border-white/20 active:scale-90 transition-all text-accent"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            </div>

            <div className="absolute top-4 right-4 flex gap-3 z-30">
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: event.title,
                      text: `Mari ikuti acara ${event.title} di Cavent!`,
                      url: window.location.href,
                    }).catch(console.error);
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Tautan acara berhasil disalin!");
                  }
                }}
                className="h-10 w-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl border border-white/20 active:scale-90 transition-all text-neutral hover:text-primary"
                title="Bagikan Acara"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CARD 1: HEADER (Judul + Info + Penyelenggara ala Tiket.com) */}
      <section className="relative w-full bg-white px-4 md:px-10 pt-7 pb-8 z-10 md:hidden">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-8">

            {/* Left: Main Info */}
            <div className="flex-1 space-y-4">
              {/* Kategori Kapsul */}
              <div className="flex items-center gap-2 flex-wrap">
                {Array.isArray(event.category) ? (
                  event.category.map((cat: string) => (
                    <span key={cat} className="bg-primary/5 text-primary border border-primary/10 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {cat}
                    </span>
                  ))
                ) : (
                  <span className="bg-primary/5 text-primary border border-primary/10 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {event.category}
                  </span>
                )}
              </div>

              {/* Judul */}
              {reviews.length > 0 && (
                <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full w-fit text-[10px] font-black text-amber-600 animate-in fade-in duration-300">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span>{averageRating} ({reviews.length} Ulasan)</span>
                </div>
              )}
              <h1 className="text-2xl md:text-4xl font-bold text-dark leading-snug">
                {event.title}
              </h1>

              {/* Info List ala Tiket.com */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-primary font-semibold">{event.venue}</span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-neutral shrink-0" />
                  <span className="text-dark font-medium">{event.startDate}{event.startTime ? `, ${event.startTime} WIB` : ''}</span>
                </div>



              </div>


              {/* Divider */}
              <div className="h-px w-full bg-gray-100 pt-2" />

              {/* Penyelenggara */}
              <div className="flex items-center gap-4 pt-1">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-neutral uppercase tracking-widest mb-0.5">Diselenggarakan oleh</p>
                  <p className="text-dark font-bold text-sm">{event.organizerName}</p>
                  <p className="text-neutral text-xs">{Array.isArray(event.organizerProdi) ? event.organizerProdi.join(", ") : event.organizerProdi}</p>
                </div>
              </div>
            </div>

            {/* Right: Desktop Sticky Registration (hidden on mobile — using bottom bar) */}
            <div className="hidden lg:block w-[340px] shrink-0">
              {/* placeholder – registration card is rendered in the grid below */}
            </div>
          </div>
        </div>
      </section>

      {/* THICK SECTION BREAKER (Gap ala Tiket.com) */}
      <div className="h-2.5 w-full bg-gray-100/60 border-y border-gray-100/50" />


      {/* ── MAIN CONTENT GRID ────────────────────────────────── */}
      <main className="max-w-7xl mx-auto w-full px-0 md:px-10 pt-6 pb-12 space-y-6">
        {/* Tab Switcher ala iOS/Tiket.com dengan Efek Sliding Smooth */}
        <div className="flex justify-center px-4 md:px-0">
          <div className="relative flex p-1 bg-gray-100/80 rounded-full border border-gray-200/50 w-72 overflow-hidden">
            {/* Background Geser */}
            <div
              className="absolute top-1 bottom-1 bg-white rounded-full shadow-sm transition-all duration-300 ease-out"
              style={{
                width: "calc(50% - 4px)",
                left: "4px",
                transform: activeTab === "detail" ? "translateX(0)" : "translateX(100%)",
              }}
            />

            <button
              onClick={() => setActiveTab("detail")}
              className={`flex-1 relative z-10 py-2.5 rounded-full text-xs font-bold text-center transition-colors duration-300 ${activeTab === "detail" ? "text-primary" : "text-neutral hover:text-dark"
                }`}
            >
              Detail Acara
            </button>

            <button
              onClick={() => setActiveTab("ratings")}
              className={`flex-1 relative z-10 py-2.5 rounded-full text-xs font-bold text-center transition-colors duration-300 ${activeTab === "ratings" ? "text-primary" : "text-neutral hover:text-dark"
                }`}
            >
              Rating & Ulasan
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          <div className="lg:col-span-2 space-y-6 relative z-10 min-h-[620px]">
            {activeTab === "detail" ? (
              <>
                {/* ── UNIFIED DETAIL CARD ── */}
                <div className="bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-xl overflow-hidden">

                  {/* Tentang Acara */}
                  <div className="px-6 md:px-8 pt-8 pb-6">
                    <h2 className="text-xl font-bold text-dark mb-4">Tentang Acara</h2>
                    {event.tagline && (
                      <p className="text-primary font-semibold text-sm mb-3">{event.tagline}</p>
                    )}
                    <p className="text-neutral text-sm leading-relaxed whitespace-pre-wrap">{event.description}</p>
                    {event.theme && (
                      <div className="mt-4 flex items-start gap-2">
                        <span className="text-base">🏆</span>
                        <div>
                          <span className="text-dark font-bold text-sm">Tema Besar: </span>
                          <span className="text-neutral text-sm italic">&quot;{event.theme}&quot;</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Row info: Tanggal, Lokasi, Benefit */}
                  <div className="px-6 md:px-8 pb-6 space-y-4">
                    {/* Tanggal & Waktu */}
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <Calendar className="h-4.5 w-4.5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-bold text-dark text-sm">Tanggal &amp; Waktu</p>
                        <p className="text-neutral text-sm">
                          {event.startDate}{event.startTime ? ` · ${event.startTime}` : ""}{event.endTime ? ` - ${event.endTime} WIB` : " WIB"}
                        </p>
                      </div>
                    </div>

                    {/* Lokasi */}
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 bg-pink-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="h-4.5 w-4.5 text-pink-500" />
                      </div>
                      <div>
                        <p className="font-bold text-dark text-sm">Lokasi</p>
                        <p className="text-neutral text-sm">{event.venue}</p>
                      </div>
                    </div>

                    {/* Benefit */}
                    {(event.benefits || event.feeType) && (
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                          <Award className="h-4.5 w-4.5 text-emerald-500" />
                        </div>
                        <div>
                          <p className="font-bold text-dark text-sm">Benefit</p>
                          <p className="text-neutral text-sm">{event.benefits || "Snack dan Sertifikat (SKPI)"}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── DIVIDER ── */}
                  {event.whatYouWillGet && event.whatYouWillGet.length > 0 && (
                    <>
                      <div className="mx-6 md:mx-8 h-px bg-gray-100" />

                      {/* Apa Saja Yang Akan Kamu Dapatkan */}
                      <div className="px-6 md:px-8 py-6">
                        <h2 className="text-xl font-bold text-dark mb-5">Apa Saja Yang Akan Kamu Dapatkan?</h2>
                        <div className="space-y-3">
                          {event.whatYouWillGet.map((item: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-3">
                              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                              <span className="text-neutral text-sm font-medium">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── DIVIDER ── */}
                  {event.targetAudience && (
                    <>
                      <div className="mx-6 md:mx-8 h-px bg-gray-100" />

                      {/* Target Peserta */}
                      <div className="px-6 md:px-8 py-6">
                        <h2 className="text-xl font-bold text-dark mb-4">Target Peserta</h2>
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                            <Users className="h-4.5 w-4.5 text-primary" />
                          </div>
                          <p className="text-neutral text-sm font-medium leading-relaxed pt-1">{event.targetAudience}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── DIVIDER ── */}
                  {(() => {
                    const termsList = Array.isArray(event.termsAndConditions) 
                      ? event.termsAndConditions.filter((item: string) => item.trim() !== "")
                      : (typeof event.termsAndConditions === 'string' && event.termsAndConditions.trim() !== '')
                        ? event.termsAndConditions.split('\n').map((item: string) => item.trim()).filter((item: string) => item !== "")
                        : [];
                    if (termsList.length === 0) return null;
                    return (
                      <>
                        <div className="mx-6 md:mx-8 h-px bg-gray-100" />

                        {/* Syarat & Ketentuan */}
                        <div className="px-6 md:px-8 py-6">
                          <h2 className="text-xl font-bold text-dark mb-5">Syarat & Ketentuan</h2>
                          <div className="space-y-4">
                            {termsList.map((item: string, idx: number) => {
                              const cleanItem = item.replace(/^\s*(?:\d+[\.\)\-]?|\*|\-|•)\s*/, "");
                              return (
                                <div key={idx} className="flex items-start gap-3 animate-in fade-in duration-300">
                                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-[11px] font-black text-red-500 shrink-0 border border-red-100/50 mt-0.5">
                                    {idx + 1}
                                  </span>
                                  <span className="text-neutral text-sm font-medium pt-0.5 leading-relaxed">{cleanItem}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    );
                  })()}

                </div>
              </>
            ) : (
              /* Card: Rating & Ulasan (Dynamic State) */
              <div className="bg-white px-6 md:px-8 py-8 rounded-xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-8 animate-in fade-in duration-500">
                <div>
                  <h2 className="text-xl font-bold text-dark mb-1">Rating &amp; Ulasan</h2>
                  <p className="text-neutral text-xs">Ulasan jujur dari mahasiswa yang telah mengikuti acara ini.</p>
                </div>

                {reviews.length > 0 ? (
                  <div className="space-y-8">
                    {/* Summary Card Dashboard */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-100/50 items-center">
                      {/* Big Average Block */}
                      <div className="md:col-span-4 text-center md:border-r border-gray-200/50 md:pr-6 space-y-2">
                        <p className="text-5xl font-black text-dark tracking-tight">{averageRating}</p>
                        <div className="flex justify-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-5 w-5 ${
                                s <= Math.round(averageRating)
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-neutral font-medium">{reviews.length} Ulasan Terverifikasi</p>
                      </div>

                      {/* Progress Bars Breakdown Block */}
                      <div className="md:col-span-8 space-y-2.5">
                        {[5, 4, 3, 2, 1].map((s, idx) => {
                          const count = ratingBreakdown[idx] || 0;
                          const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                          return (
                            <div key={s} className="flex items-center gap-3 text-xs">
                              <span className="w-3 text-right font-bold text-dark">{s}</span>
                              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0" />
                              <div className="flex-1 bg-gray-200/60 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-amber-400 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <span className="w-8 text-neutral font-medium text-right">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Reviews List */}
                    <div className="space-y-6 pt-2">
                      {reviews.map((r) => {
                        const formattedDate = r.createdAt
                          ? new Date(r.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric"
                            })
                          : "Tanggal tidak diketahui";
                        return (
                          <div key={r.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0 space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-bold text-dark text-sm">{r.userName}</p>
                                <p className="text-[10px] text-neutral font-semibold uppercase tracking-wider mt-0.5">{formattedDate}</p>
                              </div>
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`h-3.5 w-3.5 ${
                                      s <= r.rating ? "text-amber-400 fill-amber-400" : "text-gray-200"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="bg-gray-50/30 p-4 rounded-xl border border-gray-100/50">
                              <p className="text-neutral text-sm font-medium italic leading-relaxed">&quot;{r.comment}&quot;</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Empty State */
                  <div className="bg-gray-50/50 rounded-3xl p-12 border border-dashed border-gray-200 text-center flex flex-col items-center justify-center">
                    <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 mb-4">
                      <Star className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="font-bold text-dark text-base mb-1">Belum Ada Ulasan</h3>
                    <p className="text-xs text-neutral max-w-xs leading-relaxed">
                      Belum ada ulasan untuk acara ini. Jadilah yang pertama memberikan ulasan setelah mengikuti acara!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <aside className="hidden lg:block lg:sticky lg:top-32 w-full shrink-0">
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="text-2xl font-bold text-dark mb-4">Daftar Sekarang</h3>

              <div className="flex items-center gap-2 text-xl font-bold text-[#22c55e] mb-6">
                <span className="text-2xl">🎓</span>
                <span>{event.feeType === "Gratis" ? "Gratis" : "Berbayar"}</span>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
                  <span className="text-neutral font-medium text-sm">Penyelenggara</span>
                  <span className="text-dark font-extrabold text-sm">{event.organizerName}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
                  <span className="text-neutral font-medium text-sm">Kapasitas</span>
                  <span className="text-dark font-extrabold text-sm">{event.maxCapacity} Orang</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
                  <span className="text-neutral font-medium text-sm">Tersisa</span>
                  <span className="text-red-500 font-extrabold text-sm">{seatsLeft} Kursi</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
                  <span className="text-neutral font-medium text-sm">Batas Daftar</span>
                  <span className="text-dark font-extrabold text-sm">{event.regCloseDate || event.startDate}</span>
                </div>
              </div>

              <div className="mb-6">
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all duration-1000" style={{ width: `${progressPercentage}%` }} />
                </div>
              </div>

              {event.eventState === "started" && (
                <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3 text-blue-700">
                  <div className="relative flex h-3 w-3 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider">Acara Sedang Berlangsung</span>
                </div>
              )}

              <div className="flex flex-col gap-3">
                {(() => {
                  const regCloseDateObj = event.regCloseDate ? new Date(event.regCloseDate) : event.startDate ? new Date(event.startDate) : new Date();
                  regCloseDateObj.setHours(23, 59, 59, 999);
                  const isRegistrationClosed = new Date() > regCloseDateObj;

                  if (event.eventState === "completed") {
                    if (isRegistered && registrationData?.status === "attended") {
                      return (
                        <Link href={`/mahasiswa/my-events/${registrationData.id}`} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold py-4 rounded-2xl text-center shadow-lg shadow-amber-500/20 transition-all active:scale-95 text-sm flex items-center justify-center gap-2">
                          <Star className="h-4 w-4 fill-white" /> Berikan Ulasan
                        </Link>
                      );
                    }
                    return (
                      <button disabled className="w-full bg-gray-100 text-gray-500 cursor-not-allowed font-extrabold py-4 rounded-2xl text-center text-sm border border-gray-200">
                        Acara Sudah Selesai
                      </button>
                    );
                  }

                  if (!user) {
                    return (
                      <Link href="/login" className="w-full bg-primary hover:bg-primary/95 text-white font-extrabold py-4 rounded-2xl text-center shadow-lg shadow-primary/20 transition-all active:scale-95 text-sm">
                        Login untuk Daftar
                      </Link>
                    );
                  }
                  
                  if (!isEmailVerified) {
                    return (
                      <button disabled className="w-full bg-gray-100 text-neutral cursor-not-allowed font-extrabold py-4 rounded-2xl text-center text-sm border border-gray-200">
                        Belum Terverifikasi
                      </button>
                    );
                  }

                  if (isRegistered) {
                    return (
                      <div className="flex flex-col gap-2">
                        <Link href={`/mahasiswa/my-events/${registrationData?.id}`} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold py-4 rounded-2xl text-center shadow-lg transition-all active:scale-95 text-sm flex items-center justify-center gap-2">
                          <Ticket className="h-4 w-4" /> Lihat Tiket
                        </Link>
                        {event.eventState !== "started" && (
                          <button onClick={handleCancel} disabled={isActionLoading} className="w-full bg-red-50 text-red-600 border border-red-100 font-bold py-3 rounded-2xl hover:bg-red-100 transition-all active:scale-95 text-xs">
                            {isActionLoading ? "Memproses..." : "Batalkan Pendaftaran"}
                          </button>
                        )}
                      </div>
                    );
                  }

                  if (isRegistrationClosed) {
                    return (
                      <button disabled className="w-full bg-gray-100 text-gray-500 cursor-not-allowed font-extrabold py-4 rounded-2xl text-center text-sm border border-gray-200">
                        Pendaftaran Ditutup
                      </button>
                    );
                  }

                  return (
                    <button
                      onClick={handleRegister}
                      disabled={isActionLoading || seatsLeft <= 0}
                      className={`w-full font-extrabold py-4 rounded-2xl transition-all shadow-lg active:scale-95 text-sm ${seatsLeft <= 0 ? "bg-gray-100 text-neutral cursor-not-allowed" : "bg-primary hover:bg-primary/95 text-white shadow-primary/20"}`}
                    >
                      {isActionLoading ? "Memproses..." : seatsLeft <= 0 ? "Kuota Penuh" : "Daftar"}
                    </button>
                  );
                })()}

                {event.eventState !== "completed" && (
                  <button className="w-full border border-gray-200 text-neutral font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all text-sm">
                    <Bell className="h-5 w-5 text-neutral" /> Ingatkan Saya
                  </button>
                )}
              </div>

              <p className="text-[10px] text-neutral/70 text-center mt-5 leading-relaxed px-2">
                Dengan mendaftar, Anda menyetujui syarat & ketentuan acara
              </p>
            </div>
          </aside>
        </div>
      </main>

      <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t border-gray-100 px-6 py-5 flex items-center justify-between z-[100] shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div>
          <p className="text-[10px] font-black text-neutral uppercase tracking-widest mb-0.5">Biaya Daftar</p>
          <p className="text-lg font-black text-primary leading-tight">{event.feeType === "Gratis" ? "Gratis" : "Berbayar"}</p>
          <p className="text-[9px] font-bold text-red-500 mt-0.5">Sisa {seatsLeft} Kursi</p>
        </div>
        {(() => {
          const regCloseDateObj = event.regCloseDate ? new Date(event.regCloseDate) : event.startDate ? new Date(event.startDate) : new Date();
          regCloseDateObj.setHours(23, 59, 59, 999);
          const isRegistrationClosed = new Date() > regCloseDateObj;

          if (event.eventState === "completed") {
            if (isRegistered && registrationData?.status === "attended") {
              return (
                <Link href={`/mahasiswa/my-events/${registrationData.id}`} className="bg-amber-500 hover:bg-amber-600 text-white font-black px-6 py-4 rounded-2xl text-sm shadow-lg active:scale-95 transition-all flex gap-2 items-center">
                  <Star className="h-4 w-4 fill-white" /> Ulasan
                </Link>
              );
            }
            return (
              <button disabled className="bg-gray-100 text-gray-500 cursor-not-allowed px-6 py-4 rounded-2xl text-sm border border-gray-200 font-black">
                Selesai
              </button>
            );
          }

          if (!user) {
            return (
              <Link href="/login" className="bg-primary text-white font-black px-10 py-4 rounded-2xl text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all">
                Login
              </Link>
            );
          }

          if (!isEmailVerified) {
            return (
              <button disabled className="bg-gray-100 text-neutral cursor-not-allowed px-10 py-4 rounded-2xl text-sm border border-gray-200">
                Verifikasi
              </button>
            );
          }

          if (isRegistered) {
            return (
              <Link href={`/mahasiswa/my-events/${registrationData?.id}`} className="bg-emerald-500 text-white font-black px-8 py-4 rounded-2xl text-sm border border-emerald-500 shadow-lg active:scale-95 transition-all flex items-center gap-2">
                <Ticket className="h-4 w-4" /> Tiket
              </Link>
            );
          }

          if (isRegistrationClosed) {
            return (
              <button disabled className="bg-gray-100 text-gray-500 cursor-not-allowed px-8 py-4 rounded-2xl text-sm border border-gray-200 font-black">
                Ditutup
              </button>
            );
          }

          return (
            <button onClick={handleRegister} disabled={isActionLoading || seatsLeft <= 0} className="bg-primary text-white font-black px-10 py-4 rounded-2xl text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all">
              {isActionLoading ? "..." : "Daftar"}
            </button>
          );
        })()}
      </div>

      <Footer />

      {activePreviewImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-dark/95 backdrop-blur-xl" onClick={() => setActivePreviewImage(null)} />

          {/* Close Button */}
          <button
            onClick={() => setActivePreviewImage(null)}
            className="absolute top-6 right-6 p-4 bg-white/10 text-white hover:bg-white/20 transition-all rounded-full z-30"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Left Navigation Chevron */}
          {allMedia.length > 1 && (
            <button
              onClick={() => {
                const currentIdx = allMedia.indexOf(activePreviewImage);
                const prevIdx = currentIdx === 0 ? allMedia.length - 1 : currentIdx - 1;
                setActivePreviewImage(allMedia[prevIdx]);
              }}
              className="absolute left-6 h-14 w-14 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all active:scale-90 z-30 shadow-lg"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}

          {/* Image Container */}
          <div className="relative z-10 animate-in zoom-in-95 duration-300 max-w-[80vw] max-h-[80vh] flex items-center justify-center">
            <img
              src={activePreviewImage}
              alt="Preview"
              className="max-w-full max-h-[80vh] object-contain rounded-3xl shadow-2xl border border-white/10"
            />
          </div>

          {/* Right Navigation Chevron */}
          {allMedia.length > 1 && (
            <button
              onClick={() => {
                const currentIdx = allMedia.indexOf(activePreviewImage);
                const nextIdx = currentIdx === allMedia.length - 1 ? 0 : currentIdx + 1;
                setActivePreviewImage(allMedia[nextIdx]);
              }}
              className="absolute right-6 h-14 w-14 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all active:scale-90 z-30 shadow-lg"
            >
              <ChevronLeft className="h-8 w-8 rotate-180" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
