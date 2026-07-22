"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  MapPin,
  MoreVertical,
  Edit3,
  Trash2,
  ExternalLink,
  Clock,
  XCircle,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/components/providers/AuthProvider";
import toast from "react-hot-toast";
import { QrCode, Play, X, CheckCircle2, FileText } from "lucide-react";
import { getCategoryBadgeClass } from "@/lib/category";

import { uploadImage } from "@/lib/cloudinary";
import { checkAndExpirePendingEvents } from "@/lib/expireEvents";

export default function MyEventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRejection, setSelectedRejection] = useState<{ title: string, reason: string } | null>(null);

  // Documentation Modal State
  const [docModalData, setDocModalData] = useState<{ eventId: string, title: string } | null>(null);
  const [docPhotos, setDocPhotos] = useState<File[]>([]);
  const [docVideo, setDocVideo] = useState("");
  const [docGdrive, setDocGdrive] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedRejection) setSelectedRejection(null);
        if (docModalData && !isUploading) setDocModalData(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRejection, docModalData, isUploading]);

  const handleDelete = async (eventId: string, title: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus acara "${title}"?`)) return;
    setIsProcessingAction(true);
    try {
      await deleteDoc(doc(db, "events", eventId));
      toast.success("Acara berhasil dihapus");
    } catch (error) {
      console.error("Delete Error:", error);
      toast.error("Gagal menghapus acara");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleStartEvent = async (eventId: string, title: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin memulai acara "${title}"? Ini akan mengaktifkan QR Code absensi peserta.`)) return;
    setIsProcessingAction(true);
    try {
      await updateDoc(doc(db, "events", eventId), {
        eventState: "started"
      });
      toast.success(`Acara "${title}" berhasil dimulai!`);

    } catch (error) {
      console.error("Start Event Error:", error);
      toast.error("Gagal memulai acara");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleCancelStartEvent = async (eventId: string, title: string) => {
    if (!window.confirm(`Batal memulai acara "${title}"? Status akan kembali seperti sebelum dimulai.`)) return;
    setIsProcessingAction(true);
    try {
      await updateDoc(doc(db, "events", eventId), {
        eventState: null
      });
      toast.success(`Berhasil membatalkan status mulai untuk acara "${title}".`);
    } catch (error) {
      console.error("Cancel Start Error:", error);
      toast.error("Gagal membatalkan status mulai");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleCancelEvent = async (eventId: string, title: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin MEMBATALKAN acara "${title}"? Tindakan ini tidak dapat diurungkan.`)) return;
    setIsProcessingAction(true);
    try {
      await updateDoc(doc(db, "events", eventId), {
        status: "cancelled"
      });
      toast.success(`Acara "${title}" berhasil dibatalkan.`);
    } catch (error) {
      console.error("Cancel Event Error:", error);
      toast.error("Gagal membatalkan acara");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleCompleteEvent = async (eventId: string, title: string) => {
    if (!window.confirm(`Selesaikan acara "${title}"? Status akan berubah menjadi Selesai.`)) return;
    setIsProcessingAction(true);
    try {
      await updateDoc(doc(db, "events", eventId), {
        eventState: "completed"
      });
      toast.success(`Acara "${title}" berhasil diselesaikan.`);
    } catch (error) {
      console.error("Complete Event Error:", error);
      toast.error("Gagal menyelesaikan acara");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const openDocModal = (eventId: string, title: string, existingDoc?: any) => {
    setDocModalData({ eventId, title });
    setDocPhotos([]); // Reset photos array (re-upload required for photos right now)
    setDocVideo(existingDoc?.video || "");
    setDocGdrive(existingDoc?.gdriveLink || "");
  };

  const submitDocumentation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docModalData) return;
    setIsUploading(true);
    try {
      const uploadedPhotos: string[] = [];
      for (const file of docPhotos) {
        if (uploadedPhotos.length >= 5) break;
        const url = await uploadImage(file);
        uploadedPhotos.push(url);
      }

      await updateDoc(doc(db, "events", docModalData.eventId), {
        documentation: {
          photos: uploadedPhotos,
          video: docVideo,
          gdriveLink: docGdrive
        }
      });
      toast.success(`Dokumentasi acara "${docModalData.title}" berhasil diunggah!`);
      setDocModalData(null);
    } catch (error) {
      console.error("Upload Documentation Error:", error);
      toast.error("Gagal mengunggah dokumentasi");
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Gunakan query sederhana dulu jika index belum dibuat
    const q = query(
      collection(db, "events"),
      where("organizerId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Auto-expire acara yang tanggalnya sudah lewat
      checkAndExpirePendingEvents(eventData);

      eventData.sort((a: any, b: any) => {
        // Sort manual untuk menghindari error index Firestore di awal
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });

      setEvents(eventData);
      setIsLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredEvents = events.filter(event =>
    event.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (event: any) => {
    switch (event.status) {
      case "published":
        return <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-sm border border-green-100"><CheckCircle2 className="h-3 w-3" /> Disetujui</span>;
      case "rejected":
        return (
          <button
            onClick={(e) => {
              e.preventDefault();
              setSelectedRejection({ title: event.title, reason: event.rejectionReason || "Tidak ada alasan spesifik." });
            }}
            className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-sm border border-red-100 hover:bg-red-100 transition-colors"
          >
            <XCircle className="h-3 w-3" /> Ditolak (Lihat Alasan)
          </button>
        );
      case "expired":
        return (
          <button
            onClick={(e) => {
              e.preventDefault();
              setSelectedRejection({ title: event.title, reason: event.rejectionReason || "Tanggal pelaksanaan sudah terlewat." });
            }}
            className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-sm border border-orange-100 hover:bg-orange-100 transition-colors"
          >
            <AlertCircle className="h-3 w-3" /> Kedaluwarsa
          </button>
        );
      case "cancelled":
        return <span className="bg-gray-50 text-gray-600 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-sm border border-gray-100"><XCircle className="h-3 w-3" /> Dibatalkan</span>;
      default:
        return <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-sm border border-amber-100"><Clock className="h-3 w-3" /> Menunggu</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-dark tracking-tight">Acara Saya</h1>
          <p className="text-neutral text-sm mt-1">Kelola dan pantau status pengajuan acaramu secara real-time</p>
        </div>
        <Link href="/organizer/events/new" className="flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-primary-900 shadow-xl shadow-primary/20 transition-all active:scale-[0.98] w-fit">
          <Plus className="h-5 w-5" /> Buat Acara Baru
        </Link>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        {[
          { label: "Total Acara", value: events.length, color: "text-dark", bg: "bg-white" },
          { label: "Disetujui", value: events.filter(e => e.status === "published").length, color: "text-green-600", bg: "bg-green-50/30" },
          { label: "Menunggu", value: events.filter(e => e.status === "pending").length, color: "text-amber-600", bg: "bg-amber-50/30" },
          { label: "Ditolak/Kedaluwarsa", value: events.filter(e => e.status === "rejected" || e.status === "cancelled" || e.status === "expired").length, color: "text-red-600", bg: "bg-red-50/30" },
        ].map((stat, i) => (
          <div key={i} className={`${stat.bg} p-6 rounded-xl border border-gray-100 shadow-sm transition-transform hover:scale-[1.02]`}>
            <p className="text-[10px] font-bold text-neutral uppercase tracking-[0.2em]">{stat.label}</p>
            <p className={`text-3xl font-black mt-2 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar / Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-10 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral/50" />
          <input
            type="text"
            placeholder="Cari judul acara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50/50 border border-transparent rounded-xl pl-14 pr-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-8 py-3.5 bg-gray-50 text-dark rounded-xl text-sm font-bold border border-transparent hover:bg-gray-100 transition-all">
          <Filter className="h-4 w-4" /> Filter
        </button>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="h-14 w-14 border-[5px] border-primary/10 border-t-primary rounded-full animate-spin mb-6" />
          <p className="text-neutral text-sm font-bold tracking-wide uppercase">Menghubungkan ke database...</p>
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEvents.map((event) => (
            <div key={event.id} className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group flex flex-col h-full">
              {/* Card Image */}
              <div className="aspect-[16/10] relative overflow-hidden">
                <Image
                  src={event.bannerUrl || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop"}
                  alt={event.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="absolute top-5 left-5">
                  {getStatusBadge(event)}
                </div>
              </div>

              {/* Card Content */}
              <div className="p-7 flex flex-col flex-1">
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  {Array.isArray(event.category) ? (
                    event.category.map((cat: string) => (
                      <span key={cat} className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${getCategoryBadgeClass(cat)}`}>
                        {cat}
                      </span>
                    ))
                  ) : (
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${getCategoryBadgeClass(event.category)}`}>
                      {event.category}
                    </span>
                  )}
                  <div className="h-1 w-1 bg-gray-300 rounded-full" />
                  <span className="text-[10px] font-black text-neutral uppercase tracking-widest">{event.feeType}</span>
                  {event.status === "published" && (
                    <>
                      <div className="h-1 w-1 bg-gray-300 rounded-full" />
                      {event.eventState === "started" ? (
                        <span className="text-[10px] font-black text-emerald-600 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
                          <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full inline-block"></span>
                          Berlangsung
                        </span>
                      ) : event.eventState === "completed" ? (
                        <span className="text-[10px] font-black text-gray-500 px-3 py-1 bg-gray-50 border border-gray-100 rounded-full uppercase tracking-wider">
                          Selesai
                        </span>
                      ) : (
                        <span className="text-[10px] font-black text-amber-600 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full uppercase tracking-wider">
                          Belum Mulai
                        </span>
                      )}
                    </>
                  )}
                </div>

                <h3 className="font-black text-dark text-xl leading-tight mb-5 line-clamp-2 min-h-[3.5rem] group-hover:text-primary transition-colors">
                  {event.title}
                </h3>

                <div className="space-y-3 mb-6 flex-1">
                  <div className="flex items-center gap-3 text-xs text-neutral/70 font-medium">
                    <Calendar className="h-4 w-4 text-primary/40 shrink-0" />
                    <span>{event.startDate} • {event.startTime} WIB</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-neutral/70 font-medium">
                    <MapPin className="h-4 w-4 text-primary/40 shrink-0" />
                    <span className="truncate">{event.venue}</span>
                  </div>

                  {event.status === "published" && (
                    <div className="mt-4 pt-4 border-t border-gray-50">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-bold text-neutral uppercase tracking-widest">Kapasitas Pendaftar</span>
                        <span className="text-xs font-black text-dark">{event.registeredCount || 0} / {event.maxCapacity}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${event.maxCapacity ? Math.min(Math.round(((event.registeredCount || 0) / event.maxCapacity) * 100), 100) : 0}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Event Control Button (Penyelenggara) */}
                {event.status === "published" && (
                  <div className="mb-6">
                    {event.eventState === "started" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCancelStartEvent(event.id, event.title)}
                          disabled={isProcessingAction}
                          className="flex-1 py-3 bg-gray-50 hover:bg-gray-200 text-gray-600 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 border border-gray-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Batal Mulai Acara"
                        >
                          <XCircle className="h-4 w-4" /> Batal Mulai
                        </button>
                        <button
                          onClick={() => handleCompleteEvent(event.id, event.title)}
                          disabled={isProcessingAction}
                          className="flex-1 py-3 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 border border-red-100 hover:border-red-500 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Selesaikan Acara"
                        >
                          <CheckCircle2 className="h-4 w-4" /> Selesaikan
                        </button>
                      </div>
                    ) : event.eventState === "completed" ? (
                      <div className="flex gap-2">
                        <Link
                          href={`/organizer/events/${event.id}/report`}
                          className="flex-[0.8] py-3 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 border border-blue-100 hover:border-blue-600 shadow-sm"
                          title="Lihat Laporan Acara"
                        >
                          <FileText className="h-4 w-4" /> Laporan
                        </Link>
                        {(() => {
                          const hasDoc = event.documentation && (
                            (event.documentation.photos && event.documentation.photos.length > 0) ||
                            event.documentation.video ||
                            event.documentation.gdriveLink
                          );
                          return (
                            <button
                              onClick={() => openDocModal(event.id, event.title, event.documentation)}
                              className="flex-1 py-3 bg-amber-50 hover:bg-amber-500 text-amber-600 hover:text-white rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 border border-amber-100 hover:border-amber-500 shadow-sm"
                              title={hasDoc ? "Edit Dokumentasi" : "Unggah Dokumentasi"}
                            >
                              {hasDoc ? <Edit3 className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                              {hasDoc ? "Edit Dokumentasi" : "Dokumentasi"}
                            </button>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCancelEvent(event.id, event.title)}
                          disabled={isProcessingAction}
                          className="flex-1 py-3 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 border border-red-100 hover:border-red-500 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Batalkan Acara"
                        >
                          <XCircle className="h-4 w-4" /> Batalkan
                        </button>
                        <button
                          onClick={() => handleStartEvent(event.id, event.title)}
                          disabled={isProcessingAction}
                          className="flex-[1.5] py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/15 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Mulai Acara & Aktifkan Absensi"
                        >
                          <Play className="h-4 w-4 fill-white" /> Mulai Acara
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-50 mt-auto">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/events/${event.id}`}
                      target="_blank"
                      className="p-3 bg-gray-50 text-neutral hover:text-primary hover:bg-primary/5 rounded-2xl transition-all"
                      title="Lihat Detail"
                      aria-label={`Lihat detail acara ${event.title}`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>

                    {event.status === "published" && event.eventState === "started" && (
                      <Link
                        href={`/organizer/events/${event.id}/attendance`}
                        className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all"
                        title="Manajemen Absensi"
                        aria-label={`Manajemen absensi acara ${event.title}`}
                      >
                        <QrCode className="h-4 w-4" />
                      </Link>
                    )}

                    {event.eventState !== "started" && event.eventState !== "completed" && (
                      <Link
                        href={`/organizer/events/${event.id}/edit`}
                        className="p-3 bg-gray-50 text-neutral hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                        title="Edit Acara"
                        aria-label={`Edit acara ${event.title}`}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(event.id, event.title)}
                    disabled={isProcessingAction}
                    className="p-3 bg-gray-50 text-neutral hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Hapus Acara"
                    aria-label={`Hapus acara ${event.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 py-28 flex flex-col items-center justify-center text-center px-10">
          <div className="h-24 w-24 bg-gray-50 rounded-xl flex items-center justify-center mb-8 shadow-inner">
            <AlertCircle className="h-12 w-12 text-neutral/20" />
          </div>
          <h3 className="text-2xl font-black text-dark mb-3">Tidak Ada Acara</h3>
          <p className="text-neutral text-sm max-w-sm leading-relaxed mb-10 font-medium">
            Sepertinya kamu belum pernah mengajukan acara. Mulai buat acaramu sekarang agar bisa dilihat oleh ribuan audiens!
          </p>
          <Link href="/organizer/events/new" className="bg-dark text-white px-10 py-4 rounded-xl font-bold text-sm hover:bg-black transition-all shadow-xl shadow-black/10 active:scale-[0.98]">
            Buat Acara Pertama
          </Link>
        </div>
      )}

      {/* Rejection Modal */}
      {selectedRejection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-dark/60 backdrop-blur-sm" onClick={() => setSelectedRejection(null)} />
          <div className="relative bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-red-500 p-8 text-white relative">
              <button
                onClick={() => setSelectedRejection(null)}
                className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="h-14 w-14 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-black mb-2">Pengajuan Ditolak</h3>
              <p className="text-white/80 text-sm font-medium">{selectedRejection.title}</p>
            </div>
            <div className="p-10">
              <p className="text-[10px] font-black text-neutral uppercase tracking-widest mb-4">Pesan Admin:</p>
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                <p className="text-dark text-sm leading-relaxed font-medium">
                  {selectedRejection.reason}
                </p>
              </div>
              <button
                onClick={() => setSelectedRejection(null)}
                className="w-full mt-8 bg-dark text-white font-bold py-4 rounded-lg hover:bg-black transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Documentation Modal */}
      {docModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto">
          <div className="absolute inset-0 bg-dark/60 backdrop-blur-sm" onClick={() => !isUploading && setDocModalData(null)} />
          <div className="relative bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 my-8">
            <div className="bg-primary p-8 text-white relative">
              <button
                onClick={() => setDocModalData(null)}
                disabled={isUploading}
                className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="h-14 w-14 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-black mb-2">Unggah Dokumentasi</h3>
              <p className="text-white/80 text-sm font-medium">{docModalData.title}</p>
            </div>

            <form onSubmit={submitDocumentation} className="p-8">
              <div className="mb-6">
                <p className="text-sm text-neutral mb-6">
                  Silakan unggah dokumentasi acara agar dapat dilihat oleh audiens di halaman profil Penyelenggara Anda.
                </p>

                <div className="space-y-5">
                  {/* Photos */}
                  <div>
                    <label className="block text-xs font-bold text-dark uppercase tracking-wider mb-2">
                      Foto Acara (Maks 5)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={isUploading}
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 5) {
                          alert("Maksimal 5 foto.");
                          setDocPhotos(files.slice(0, 5));
                        } else {
                          setDocPhotos(files);
                        }
                      }}
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    />
                    <p className="text-[10px] text-neutral mt-1">Pilih hingga 5 foto terbaik dari acara Anda.</p>
                  </div>

                  {/* Video */}
                  <div>
                    <label className="block text-xs font-bold text-dark uppercase tracking-wider mb-2">
                      Link Video Recap (YouTube/Tiktok/dsb)
                    </label>
                    <input
                      type="url"
                      value={docVideo}
                      disabled={isUploading}
                      onChange={(e) => setDocVideo(e.target.value)}
                      placeholder="https://..."
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                  </div>

                  {/* GDrive */}
                  <div>
                    <label className="block text-xs font-bold text-dark uppercase tracking-wider mb-2">
                      Link Google Drive (Folder Dokumentasi)
                    </label>
                    <input
                      type="url"
                      value={docGdrive}
                      disabled={isUploading}
                      onChange={(e) => setDocGdrive(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setDocModalData(null)}
                  disabled={isUploading}
                  className="px-6 py-3 text-neutral font-bold text-sm hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-6 py-3 bg-primary text-white font-bold text-sm rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2 disabled:opacity-70"
                >
                  {isUploading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Mengunggah...
                    </>
                  ) : (
                    "Simpan Dokumentasi"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
