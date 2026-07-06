"use client";

import { useEffect, useState } from "react";
import {
  Check,
  X,
  Clock,
  Calendar,
  MapPin,
  User,
  AlertCircle,
  CheckCircle2,
  Users,
  CreditCard,
  Eye,
  Award,
  Building2,
  ChevronLeft,
  ChevronRight,
  Info
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import toast from "react-hot-toast";

export default function AdminApprovalPage() {
  const [pendingEvents, setPendingEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activePreviewImage, setActivePreviewImage] = useState<string | null>(null);
  const [currentHeroIdx, setCurrentHeroIdx] = useState(0);

  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return "Tidak diketahui";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];

      const dayName = days[date.getDay()];
      const day = date.getDate();
      const monthName = months[date.getMonth()];
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');

      return `${dayName}, ${day} ${monthName} ${year} pukul ${hours}:${minutes} WIB`;
    } catch (e) {
      return "Format tanggal salah";
    }
  };

  useEffect(() => {
    const q = query(
      collection(db, "events"),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPendingEvents(events);
      setIsLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setCurrentHeroIdx(0);
  }, [selectedEvent]);

  const handleApprove = async (eventId: string, organizerId: string, eventTitle: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      // 1. Update Event Status to published
      await updateDoc(doc(db, "events", eventId), {
        status: "published",
        approvedAt: serverTimestamp()
      });

      // 2. Notify Organizer
      await addDoc(collection(db, "notifications"), {
        type: "EVENT_APPROVED",
        title: "Acara Disetujui!",
        message: `Selamat! Acara "${eventTitle}" telah disetujui dan sekarang sudah tayang di publik.`,
        eventId: eventId,
        status: "unread",
        createdAt: serverTimestamp(),
        userId: organizerId // Target organizer
      });

      toast.success("Acara berhasil disetujui!");
    } catch (error: any) {
      console.error("Approve Error:", error);
      toast.error("Gagal menyetujui acara: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Mohon berikan alasan penolakan");
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Update Event Status to rejected
      await updateDoc(doc(db, "events", selectedEvent.id), {
        status: "rejected",
        rejectionReason: rejectionReason,
        rejectedAt: serverTimestamp()
      });

      // 2. Notify Organizer
      await addDoc(collection(db, "notifications"), {
        type: "EVENT_REJECTED",
        title: "Acara Ditolak",
        message: `Maaf, pengajuan acara "${selectedEvent.title}" ditolak. Alasan: ${rejectionReason}`,
        eventId: selectedEvent.id,
        status: "unread",
        createdAt: serverTimestamp(),
        userId: selectedEvent.organizerId
      });

      toast.success("Acara telah ditolak");
      setIsRejectModalOpen(false);
      setRejectionReason("");
      setSelectedEvent(null);
    } catch (error: any) {
      console.error("Reject Error:", error);
      toast.error("Gagal menolak acara: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-dark tracking-tight">Approval Acara</h1>
        <p className="text-neutral text-sm mt-1 font-medium">Tinjau dan kelola pengajuan acara dari penyelenggara</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="h-14 w-14 border-[5px] border-primary/10 border-t-primary rounded-full animate-spin mb-6" />
          <p className="text-neutral text-sm font-bold tracking-widest uppercase">Memuat Antrean...</p>
        </div>
      ) : pendingEvents.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {pendingEvents.map((event) => (
            <div key={event.id} className="bg-white rounded-xl p-6 md:p-10 border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col lg:flex-row gap-10 items-start lg:items-center group">
              {/* Poster Preview */}
              <div
                className="h-40 w-full lg:w-64 rounded-xl overflow-hidden bg-gray-50 shrink-0 shadow-sm border border-gray-100 cursor-pointer"
                onClick={() => setSelectedEvent(event)}
              >
                <img
                  src={event.bannerUrl || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop"}
                  alt="Poster"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>

              {/* Event Info */}
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[10px] font-black text-amber-600 px-4 py-1.5 bg-amber-50 rounded-full uppercase tracking-[0.15em] flex items-center gap-2 border border-amber-100 shadow-sm">
                    <Clock className="h-3 w-3" /> Menunggu Review
                  </span>
                  <span className="text-[10px] font-black text-primary px-4 py-1.5 bg-primary/5 rounded-full uppercase tracking-[0.15em] border border-primary/5">{event.category}</span>
                </div>

                <h3 className="text-2xl font-black text-dark leading-tight group-hover:text-primary transition-colors cursor-pointer" onClick={() => setSelectedEvent(event)}>{event.title}</h3>

                {/* Diajukan pada */}
                <div className="text-[11px] text-neutral/80 bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2 w-fit flex items-center gap-2 font-medium">
                  <span className="font-black text-[9px] uppercase tracking-wider text-neutral/50">Diajukan pada:</span>
                  <span className="text-dark font-bold">{formatDateTime(event.createdAt)}</span>
                </div>

                <div className="flex flex-wrap gap-x-8 gap-y-3 text-xs text-neutral font-medium">
                  <div className="flex items-center gap-2.5">
                    <User className="h-4.5 w-4.5 text-primary/30" />
                    <span className="font-black text-dark">{event.organizerName}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Calendar className="h-4.5 w-4.5 text-primary/30" />
                    <span>{event.startDate}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <MapPin className="h-4.5 w-4.5 text-primary/30" />
                    <span className="truncate max-w-[200px]">{event.venue}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 w-full lg:w-auto pt-6 lg:pt-0 lg:border-l lg:pl-10 border-gray-50">
                <button
                  onClick={() => setSelectedEvent(event)}
                  className="p-4 bg-gray-50 text-neutral hover:text-primary hover:bg-primary/5 rounded-xl border border-gray-100 transition-all"
                  title="Lihat Detail Lengkap"
                >
                  <Eye className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleApprove(event.id, event.organizerId, event.title)}
                  disabled={isProcessing}
                  className="flex-1 lg:flex-none flex items-center justify-center gap-2.5 bg-green-500 text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-green-600 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  <Check className="h-5 w-5" /> Setujui
                </button>
                <button
                  onClick={() => {
                    setSelectedEvent(event);
                    setIsRejectModalOpen(true);
                  }}
                  disabled={isProcessing}
                  className="flex-1 lg:flex-none flex items-center justify-center gap-2.5 bg-red-50 text-red-600 px-8 py-4 rounded-xl font-bold text-sm hover:bg-red-100 border border-red-100 transition-all active:scale-95 disabled:opacity-50"
                >
                  <X className="h-5 w-5" /> Tolak
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 py-32 flex flex-col items-center justify-center text-center px-10 shadow-sm">
          <div className="h-24 w-24 bg-green-50 rounded-2xl flex items-center justify-center mb-8 shadow-inner">
            <CheckCircle2 className="h-12 w-12 text-green-500/40" />
          </div>
          <h3 className="text-2xl font-black text-dark mb-3">Antrean Kosong</h3>
          <p className="text-neutral text-sm max-w-sm leading-relaxed font-medium">
            Hebat! Semua pengajuan acara sudah diproses. Tidak ada antrean yang tersisa.
          </p>
        </div>
      )}

      {/* Detail Preview Modal */}
      {selectedEvent && !isRejectModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-dark/60 backdrop-blur-md" onClick={() => setSelectedEvent(null)} />
          <div className="relative bg-white w-full max-w-6xl max-h-[95vh] rounded-xl overflow-hidden shadow-xl border border-gray-100 animate-in zoom-in-95 duration-300 flex flex-col">
            {/* Modal Header */}
            <div className="px-10 py-8 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
              <div>
                <h2 className="text-2xl font-black text-dark tracking-tight">Pratinjau Acara</h2>
                <p className="text-neutral text-xs font-bold mt-1 uppercase tracking-widest">Oleh: {selectedEvent.organizerName}</p>
                <p className="text-neutral-500 text-[11px] font-semibold mt-1 flex items-center gap-1.5">
                  <span className="text-neutral-400 font-bold uppercase tracking-wider text-[9px]">Diajukan:</span>
                  <span className="text-dark font-bold">{formatDateTime(selectedEvent.createdAt)}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-3 bg-gray-50 hover:bg-gray-100 text-neutral hover:text-dark rounded-2xl transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar bg-gray-50/50">
              {(() => {
                const allMedia = [selectedEvent.bannerUrl, ...(selectedEvent.additionalMedia || [])].filter(Boolean);
                return (
                  <>
                    {/* Desktop/Tablet 1:1 Student View Poster Area */}
                    <div className="relative w-full h-[320px] md:h-[420px] bg-dark rounded-lg overflow-hidden flex items-center justify-center group/hero select-none shrink-0 shadow-sm border border-gray-200">
                      {/* Blurred Background */}
                      <img
                        src={allMedia[currentHeroIdx] || selectedEvent.bannerUrl}
                        alt="Blurred Background"
                        className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-60 scale-110 pointer-events-none select-none"
                      />
                      {/* Crisp Main Poster Image */}
                      <img
                        src={allMedia[currentHeroIdx] || selectedEvent.bannerUrl}
                        alt="Banner"
                        className="relative z-10 max-h-full max-w-full object-contain transition-all duration-500 ease-in-out group-hover/hero:scale-[1.02] cursor-zoom-in"
                        onClick={() => setActivePreviewImage(allMedia[currentHeroIdx] || selectedEvent.bannerUrl)}
                      />

                      {/* Carousel Navigation Arrows */}
                      {allMedia.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentHeroIdx((prev) => (prev === 0 ? allMedia.length - 1 : prev - 1));
                            }}
                            className="absolute top-1/2 left-4 -translate-y-1/2 h-10 w-10 bg-white/95 hover:bg-white rounded-full flex items-center justify-center shadow-lg text-gray-700 transition-all active:scale-90 z-20 hover:scale-105"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentHeroIdx((prev) => (prev === allMedia.length - 1 ? 0 : prev + 1));
                            }}
                            className="absolute top-1/2 right-4 -translate-y-1/2 h-10 w-10 bg-white/95 hover:bg-white rounded-full flex items-center justify-center shadow-lg text-gray-700 transition-all active:scale-90 z-20 hover:scale-105"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </>
                      )}

                      {/* Media Counter Badge */}
                      {allMedia.length > 1 && (
                        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-[10px] font-black tracking-widest z-20">
                          {currentHeroIdx + 1} / {allMedia.length}
                        </div>
                      )}
                    </div>

                    {/* CARD 1: HEADER (Judul + Info + Penyelenggara ala Tiket.com) */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-10 shadow-sm space-y-6">
                      <div className="space-y-4">
                        {/* Kategori Kapsul */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {Array.isArray(selectedEvent.category) ? (
                            selectedEvent.category.map((cat: string) => (
                              <span key={cat} className="bg-primary/5 text-primary border border-primary/10 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                                {cat}
                              </span>
                            ))
                          ) : (
                            <span className="bg-primary/5 text-primary border border-primary/10 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                              {selectedEvent.category}
                            </span>
                          )}
                        </div>

                        {/* Judul */}
                        <h1 className="text-2xl md:text-3xl font-black text-dark leading-snug">
                          {selectedEvent.title}
                        </h1>

                        {/* Info List ala Tiket.com */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                          <div className="flex items-center gap-4 text-sm">
                            <div className="h-11 w-11 rounded-2xl bg-pink-50 flex items-center justify-center shrink-0">
                              <MapPin className="h-5 w-5 text-pink-500" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-neutral uppercase tracking-wider leading-none mb-1">Lokasi</p>
                              <span className="text-dark font-bold">{selectedEvent.campusLocation} - {selectedEvent.venue}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <div className="h-11 w-11 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                              <Calendar className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-neutral uppercase tracking-wider leading-none mb-1">Tanggal & Waktu</p>
                              <span className="text-dark font-bold">
                                {selectedEvent.startDate} • {selectedEvent.startTime} s/d {selectedEvent.endDate || selectedEvent.startDate} • {selectedEvent.endTime || "Selesai"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <div className="h-11 w-11 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
                              <Users className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-neutral uppercase tracking-wider leading-none mb-1">Kapasitas</p>
                              <span className="text-dark font-bold">{selectedEvent.maxCapacity} Peserta</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <div className="h-11 w-11 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                              <CreditCard className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-neutral uppercase tracking-wider leading-none mb-1">Biaya Pendaftaran</p>
                              <span className="text-primary font-black text-base">{selectedEvent.feeType}</span>
                            </div>
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px w-full bg-gray-100 my-4" />

                        {/* Penyelenggara */}
                        <div className="flex items-center gap-4">
                          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/10">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-neutral uppercase tracking-widest mb-0.5">Diselenggarakan oleh</p>
                            <p className="text-dark font-bold text-sm">{selectedEvent.organizerName}</p>
                            <p className="text-neutral text-xs">{Array.isArray(selectedEvent.organizerProdi) ? selectedEvent.organizerProdi.join(", ") : selectedEvent.organizerProdi}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tab Switcher ala iOS/Tiket.com mock */}
                    <div className="flex justify-center pt-2">
                      <div className="relative flex p-1 bg-gray-100/85 rounded-full border border-gray-200/50 w-72 overflow-hidden shadow-inner">
                        <div className="absolute top-1 bottom-1 bg-white rounded-full shadow-sm w-[calc(50%-4px)] left-[4px]" />
                        <div className="flex-1 relative z-10 py-2.5 rounded-full text-xs font-black text-center text-primary uppercase tracking-wider">
                          Detail Acara
                        </div>
                        <div className="flex-1 relative z-10 py-2.5 rounded-full text-xs font-black text-center text-neutral/70 uppercase tracking-wider">
                          Ulasan (0)
                        </div>
                      </div>
                    </div>

                    {/* Detail Cards List (Unified Detail Card matching latest events/[id]/page.tsx layout) */}
                    <div className="space-y-6">
                      <div className="bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-xl overflow-hidden">
                        {/* Tentang Acara */}
                        <div className="px-6 md:px-8 pt-8 pb-6">
                          <h2 className="text-xl font-bold text-dark mb-4">Tentang Acara</h2>
                          {selectedEvent.tagline && (
                            <p className="text-primary font-semibold text-sm mb-3">{selectedEvent.tagline}</p>
                          )}
                          <p className="text-neutral text-sm leading-relaxed whitespace-pre-wrap font-medium">{selectedEvent.description}</p>
                          {selectedEvent.theme && (
                            <div className="mt-4 flex items-start gap-2">
                              <span className="text-base">🏆</span>
                              <div>
                                <span className="text-dark font-bold text-sm">Tema Besar: </span>
                                <span className="text-neutral text-sm italic">&quot;{selectedEvent.theme}&quot;</span>
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
                              <p className="text-neutral text-sm font-medium">
                                {selectedEvent.startDate}{selectedEvent.startTime ? ` · ${selectedEvent.startTime}` : ""}{selectedEvent.endTime ? ` - ${selectedEvent.endTime} WIB` : " WIB"}
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
                              <p className="text-neutral text-sm font-medium">{selectedEvent.venue}</p>
                            </div>
                          </div>

                          {/* Benefit */}
                          {(selectedEvent.benefits || selectedEvent.feeType) && (
                            <div className="flex items-start gap-3">
                              <div className="h-9 w-9 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                                <Award className="h-4.5 w-4.5 text-emerald-500" />
                              </div>
                              <div>
                                <p className="font-bold text-dark text-sm">Benefit</p>
                                <p className="text-neutral text-sm font-medium">{selectedEvent.benefits || "Snack dan Sertifikat (SKPI)"}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* ── DIVIDER: What you will get ── */}
                        {selectedEvent.whatYouWillGet && selectedEvent.whatYouWillGet.length > 0 && (
                          <>
                            <div className="mx-6 md:mx-8 h-px bg-gray-100" />

                            <div className="px-6 md:px-8 py-6">
                              <h2 className="text-xl font-bold text-dark mb-5">Apa Saja Yang Akan Kamu Dapatkan?</h2>
                              <div className="space-y-3">
                                {selectedEvent.whatYouWillGet.map((item: string, idx: number) => (
                                  <div key={idx} className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                                    <span className="text-neutral text-sm font-medium">{item}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        {/* ── DIVIDER: Target Peserta ── */}
                        {selectedEvent.targetAudience && (
                          <>
                            <div className="mx-6 md:mx-8 h-px bg-gray-100" />

                            <div className="px-6 md:px-8 py-6">
                              <h2 className="text-xl font-bold text-dark mb-4">Target Peserta</h2>
                              <div className="flex items-start gap-3">
                                <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                                  <Users className="h-4.5 w-4.5 text-primary" />
                                </div>
                                <p className="text-neutral text-sm font-medium leading-relaxed pt-1">{selectedEvent.targetAudience}</p>
                              </div>
                            </div>
                          </>
                        )}

                        {/* ── DIVIDER: Syarat & Ketentuan ── */}
                        {(() => {
                          const termsList = Array.isArray(selectedEvent.termsAndConditions) 
                            ? selectedEvent.termsAndConditions.filter((item: string) => item.trim() !== "")
                            : (typeof selectedEvent.termsAndConditions === 'string' && selectedEvent.termsAndConditions.trim() !== '')
                              ? selectedEvent.termsAndConditions.split('\n').map((item: string) => item.trim()).filter((item: string) => item !== "")
                              : [];
                          if (termsList.length === 0) return null;
                          return (
                            <>
                              <div className="mx-6 md:mx-8 h-px bg-gray-100" />

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

                        {/* Fallback Legacy Agenda */}
                        {(!selectedEvent.whatYouWillGet || selectedEvent.whatYouWillGet.length === 0) && selectedEvent.agenda && selectedEvent.agenda.length > 0 && (
                          <>
                            <div className="mx-6 md:mx-8 h-px bg-gray-100" />
                            <div className="px-6 md:px-8 py-6">
                              <h2 className="text-xl font-bold text-dark mb-6">Agenda Acara</h2>
                              <div className="space-y-4">
                                {selectedEvent.agenda.map((item: any, idx: number) => (
                                  <div key={idx} className="flex gap-6 items-start">
                                    <div className="text-neutral text-sm w-24 shrink-0 font-medium">
                                      {item.startTime}–{item.endTime}
                                    </div>
                                    <div className="text-dark text-sm font-medium">
                                      {item.title}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Modal Footer (Actions) */}
            <div className="px-10 py-8 border-t border-gray-100 flex gap-4 shrink-0 bg-white">
              <button
                onClick={() => {
                  setSelectedEvent(selectedEvent);
                  setIsRejectModalOpen(true);
                }}
                className="flex-1 bg-red-50 text-red-600 py-4 rounded-xl font-bold text-sm hover:bg-red-100 border border-red-100 transition-all"
              >
                Tolak Pengajuan
              </button>
              <button
                onClick={() => {
                  handleApprove(selectedEvent.id, selectedEvent.organizerId, selectedEvent.title);
                  setSelectedEvent(null);
                }}
                className="flex-[2] bg-green-500 text-white py-4 rounded-xl font-bold text-sm hover:bg-green-600 shadow-sm transition-all"
              >
                Setujui & Tayangkan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-dark/60 backdrop-blur-md" onClick={() => !isProcessing && setIsRejectModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-2xl p-10 shadow-xl border border-gray-200 animate-in zoom-in-95 duration-300">
            <div className="h-16 w-16 bg-red-50 rounded-[1.5rem] flex items-center justify-center mb-8">
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="text-3xl font-black text-dark mb-3 tracking-tight">Tolak Acara</h2>
            <p className="text-neutral text-sm mb-8 font-medium">Berikan alasan penolakan yang jelas agar penyelenggara dapat memperbaikinya segera.</p>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-neutral uppercase tracking-[0.2em] ml-1">Alasan Penolakan <span className="text-red-500">*</span></label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Contoh: Poster kurang resolusi tinggi atau jam acara bentrok..."
                  rows={5}
                  className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-6 py-5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white focus:border-red-500/40 transition-all resize-none"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => setIsRejectModalOpen(false)}
                  disabled={isProcessing}
                  className="flex-1 bg-gray-50 text-dark py-4.5 rounded-xl font-bold text-sm hover:bg-gray-100 border border-gray-200 transition-all active:scale-95 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="flex-1 bg-red-500 text-white py-4.5 rounded-xl font-bold text-sm hover:bg-red-600 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {isProcessing ? "Memproses..." : "Tolak Sekarang"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Fullscreen Image Preview */}
      {activePreviewImage && selectedEvent && (
        (() => {
          const allMedia = [selectedEvent.bannerUrl, ...(selectedEvent.additionalMedia || [])].filter(Boolean);
          const activeIdx = allMedia.indexOf(activePreviewImage);
          return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10">
              <div className="absolute inset-0 bg-dark/95 backdrop-blur-xl" onClick={() => setActivePreviewImage(null)} />

              {/* Close Button */}
              <button
                onClick={() => setActivePreviewImage(null)}
                className="absolute top-6 right-6 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-50 hover:scale-105 active:scale-95"
                title="Tutup"
              >
                <X className="h-6 w-6" />
              </button>

              {/* Navigation Arrows for Lightbox */}
              {allMedia.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const prevIdx = activeIdx <= 0 ? allMedia.length - 1 : activeIdx - 1;
                      setActivePreviewImage(allMedia[prevIdx]);
                    }}
                    className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-50 hover:scale-105 active:scale-95"
                    title="Sebelumnya"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextIdx = activeIdx >= allMedia.length - 1 ? 0 : activeIdx + 1;
                      setActivePreviewImage(allMedia[nextIdx]);
                    }}
                    className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-50 hover:scale-105 active:scale-95"
                    title="Selanjutnya"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}

              {/* Central Expanded Image */}
              <div className="relative max-w-full max-h-full flex items-center justify-center animate-in zoom-in-95 duration-300 z-40">
                <img
                  src={activePreviewImage}
                  alt="Full Preview"
                  className="max-w-[90vw] max-h-[80vh] md:max-h-[85vh] object-contain rounded-2xl shadow-2xl shadow-black/80"
                />

                {/* Counter Badge inside Lightbox */}
                {allMedia.length > 1 && activeIdx !== -1 && (
                  <div className="absolute -bottom-12 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-black tracking-widest">
                    {activeIdx + 1} / {allMedia.length}
                  </div>
                )}
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}
