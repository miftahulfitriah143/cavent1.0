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
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/components/providers/AuthProvider";
import toast from "react-hot-toast";
import { QrCode, Play, X, CheckCircle2, FileText } from "lucide-react";
const getCategoryBadgeClass = (category: string) => {
  if (!category) return "text-primary bg-primary/5 border border-primary/10";
  const norm = category.toLowerCase();
  if (norm.includes("seminar")) return "text-teal-600 bg-teal-50 border border-teal-100";
  if (norm.includes("workshop")) return "text-rose-600 bg-rose-50 border border-rose-100";
  if (norm.includes("kompetisi") || norm.includes("competition")) return "text-amber-600 bg-amber-50 border border-amber-100";
  if (norm.includes("diskusi")) return "text-violet-600 bg-violet-50 border border-violet-100";
  
  return "text-primary bg-primary/5 border border-primary/10";
};

export default function MyEventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRejection, setSelectedRejection] = useState<{title: string, reason: string} | null>(null);
  
  
  

  const handleDelete = async (eventId: string, title: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus acara "${title}"?`)) return;

    try {
      await deleteDoc(doc(db, "events", eventId));
      toast.success("Acara berhasil dihapus");
    } catch (error) {
      console.error("Delete Error:", error);
      toast.error("Gagal menghapus acara");
    }
  };

  const handleStartEvent = async (eventId: string, title: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin memulai acara "${title}"? Ini akan mengaktifkan QR Code absensi peserta.`)) return;
    try {
      await updateDoc(doc(db, "events", eventId), {
        eventState: "started"
      });
      toast.success(`Acara "${title}" berhasil dimulai!`);
      
    } catch (error) {
      console.error("Start Event Error:", error);
      toast.error("Gagal memulai acara");
    }
  };

  const handleCompleteEvent = async (eventId: string, title: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menyelesaikan acara "${title}"? Setelah selesai, peserta yang hadir dapat memberikan rating dan ulasan.`)) return;
    try {
      await updateDoc(doc(db, "events", eventId), {
        eventState: "completed"
      });
      toast.success(`Acara "${title}" telah diselesaikan! Terima kasih.`);
    } catch (error) {
      console.error("Complete Event Error:", error);
      toast.error("Gagal menyelesaikan acara");
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
      })).sort((a: any, b: any) => {
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
          { label: "Ditolak", value: events.filter(e => e.status === "rejected").length, color: "text-red-600", bg: "bg-red-50/30" },
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
                <img 
                  src={event.bannerUrl || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop"} 
                  alt={event.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
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
                </div>

                {/* Event Control Button (Penyelenggara) */}
                {event.status === "published" && (
                  <div className="mb-6">
                    {event.eventState === "started" ? (
                      <button
                        onClick={() => handleCompleteEvent(event.id, event.title)}
                        className="w-full py-3 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 border border-red-100 hover:border-red-500 shadow-sm"
                        title="Selesaikan Acara"
                      >
                        <CheckCircle2 className="h-4.5 w-4.5" /> Selesaikan Acara
                      </button>
                    ) : event.eventState === "completed" ? (
                      <Link
                        href={`/organizer/events/${event.id}/report`}
                        className="w-full py-3 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 border border-blue-100 hover:border-blue-600 shadow-sm"
                        title="Lihat Laporan Acara"
                      >
                        <FileText className="h-4.5 w-4.5" /> Laporan Acara
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleStartEvent(event.id, event.title)}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/15"
                        title="Mulai Acara & Aktifkan Absensi"
                      >
                        <Play className="h-4.5 w-4.5 fill-white" /> Mulai Acara
                      </button>
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
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>

                      {event.status === "published" && event.eventState === "started" && (
                        <Link 
                         href={`/organizer/events/${event.id}/attendance`}
                         className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all"
                         title="Manajemen Absensi"
                        >
                          <QrCode className="h-4 w-4" />
                        </Link>
                      )}

                      <Link 
                       href={`/organizer/events/${event.id}/edit`}
                       className="p-3 bg-gray-50 text-neutral hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                       title="Edit Acara"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Link>
                    </div>
                   <button 
                    onClick={() => handleDelete(event.id, event.title)}
                    className="p-3 bg-gray-50 text-neutral hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                    title="Hapus Acara"
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
            Sepertinya kamu belum pernah mengajukan acara. Mulai buat acaramu sekarang agar bisa dilihat oleh ribuan mahasiswa!
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

          </div>
  );
}
