"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Search,
  Filter,
  Eye,
  Trash2,
  XCircle,
  CheckCircle2,
  Clock,
  MoreVertical,
  AlertTriangle,
  X
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import toast from "react-hot-toast";
import Link from "next/link";
import { getCategoryBadgeClass } from "@/lib/category";
import { checkAndExpirePendingEvents } from "@/lib/expireEvents";

export default function AdminEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [holdReason, setHoldReason] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "events"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      // Auto-expire acara yang tanggalnya sudah lewat
      checkAndExpirePendingEvents(allEvents);

      // Sort by creation date descending
      allEvents.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
      setEvents(allEvents);
      setIsLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setIsLoading(false);
      toast.error("Gagal memuat data acara.");
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let result = events;
    
    // Apply Status Filter
    if (filterStatus !== "all") {
      if (filterStatus === "approved") {
        result = result.filter(e => e.status === "approved" || e.status === "published");
      } else {
        result = result.filter(e => e.status === filterStatus);
      }
    }

    // Apply Search Query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => 
        e.title?.toLowerCase().includes(q) || 
        e.organizerName?.toLowerCase().includes(q)
      );
    }

    setFilteredEvents(result);
  }, [events, filterStatus, searchQuery]);

  const handleHoldEvent = async () => {
    if (!holdReason.trim()) {
      toast.error("Mohon berikan alasan pembatalan/penahanan");
      return;
    }

    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "events", selectedEvent.id), {
        status: "rejected",
        rejectionReason: holdReason,
        rejectedAt: serverTimestamp()
      });

      await addDoc(collection(db, "notifications"), {
        type: "EVENT_REJECTED",
        title: "Acara Dibatalkan Sistem",
        message: `Maaf, acara "${selectedEvent.title}" dibatalkan oleh Admin. Alasan: ${holdReason}`,
        eventId: selectedEvent.id,
        status: "unread",
        createdAt: serverTimestamp(),
        userId: selectedEvent.organizerId
      });

      toast.success("Acara berhasil dibatalkan/ditahan");
      setIsHoldModalOpen(false);
      setHoldReason("");
      setSelectedEvent(null);
    } catch (error: any) {
      console.error("Hold Error:", error);
      toast.error("Gagal menahan acara: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteEvent = async () => {
    setIsProcessing(true);
    try {
      await deleteDoc(doc(db, "events", selectedEvent.id));

      if (selectedEvent.organizerId) {
        await addDoc(collection(db, "notifications"), {
          type: "EVENT_DELETED",
          title: "Acara Dihapus",
          message: `Perhatian: Acara "${selectedEvent.title}" telah dihapus secara permanen dari sistem oleh Admin.`,
          eventId: selectedEvent.id,
          status: "unread",
          createdAt: serverTimestamp(),
          userId: selectedEvent.organizerId
        });
      }

      toast.success("Acara berhasil dihapus permanen");
      setIsDeleteModalOpen(false);
      setSelectedEvent(null);
    } catch (error: any) {
      console.error("Delete Error:", error);
      toast.error("Gagal menghapus acara: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
      case "approved":
        return <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">Disetujui</span>;
      case "pending":
        return <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">Menunggu</span>;
      case "rejected":
        return <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">Ditolak/Batal</span>;
      case "expired":
        return <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">Kedaluwarsa</span>;
      default:
        return <span className="text-[10px] font-bold text-gray-600 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200">Draft</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-dark tracking-tight">Semua Acara</h1>
          <p className="text-neutral text-sm mt-1 font-medium">Manajemen seluruh acara dan intervensi sistem</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Cari nama acara atau penyelenggara..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <Filter className="h-4 w-4 text-gray-400 shrink-0" />
          <div className="flex gap-2">
            {[
              { id: "all", label: "Semua" },
              { id: "pending", label: "Menunggu" },
              { id: "approved", label: "Disetujui" },
              { id: "rejected", label: "Ditolak/Batal" },
              { id: "expired", label: "Kedaluwarsa" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  filterStatus === tab.id 
                    ? "bg-primary text-white shadow-md shadow-primary/20" 
                    : "bg-gray-50 text-neutral hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-neutral uppercase tracking-wider">
                <th className="p-4 pl-6">Informasi Acara</th>
                <th className="p-4">Penyelenggara</th>
                <th className="p-4">Tanggal Pelaksanaan</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm font-bold text-neutral uppercase tracking-widest">Memuat Data...</p>
                  </td>
                </tr>
              ) : filteredEvents.length > 0 ? (
                filteredEvents.map(event => (
                  <tr key={event.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 bg-gray-100 border border-gray-200">
                          <img 
                            src={event.bannerUrl || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=100&q=80"} 
                            alt={event.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-dark text-sm line-clamp-1 max-w-[250px]">{event.title}</p>
                          <p className="text-[10px] text-neutral mt-0.5">{Array.isArray(event.category) ? event.category.join(", ") : event.category || "Event"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-dark text-xs">{event.organizerName || "-"}</p>
                      <p className="text-[10px] text-neutral truncate max-w-[150px]">{event.organizerProdi || ""}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-xs text-neutral font-medium">
                        <Calendar className="h-3.5 w-3.5 text-primary/60" />
                        <span>{event.startDate}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(event.status)}
                    </td>
                    <td className="p-4 pr-6">
                      <div className="flex items-center justify-end gap-2">
                        {/* Show link to detail page */}
                        <Link
                          href={`/events/${event.id}`}
                          target="_blank"
                          className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors border border-transparent hover:border-primary/20"
                          title="Lihat Halaman Acara"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>

                        {/* Only show intervention actions for approved/published events */}
                        {(event.status === "approved" || event.status === "published" || event.status === "pending") && (
                          <button
                            onClick={() => {
                              setSelectedEvent(event);
                              setIsHoldModalOpen(true);
                            }}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-200"
                            title="Batalkan / Tolak Acara"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedEvent(event);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                          title="Hapus Acara Permanen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-dark mb-1">Acara Tidak Ditemukan</h3>
                    <p className="text-sm text-neutral">Coba sesuaikan kata kunci atau filter pencarian.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hold/Cancel Modal */}
      {isHoldModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-dark/60 backdrop-blur-md" onClick={() => !isProcessing && setIsHoldModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-2xl p-8 shadow-xl border border-gray-200 animate-in zoom-in-95 duration-300">
            <div className="h-14 w-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-6">
              <AlertTriangle className="h-7 w-7 text-amber-500" />
            </div>
            <h2 className="text-2xl font-black text-dark mb-2 tracking-tight">Batalkan Acara?</h2>
            <p className="text-neutral text-sm mb-6 font-medium leading-relaxed">
              Acara <strong>{selectedEvent.title}</strong> akan dibatalkan/ditahan. Penyelenggara akan menerima notifikasi beserta alasannya.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral uppercase tracking-[0.2em] ml-1">Alasan Pembatalan <span className="text-red-500">*</span></label>
                <textarea
                  value={holdReason}
                  onChange={(e) => setHoldReason(e.target.value)}
                  placeholder="Contoh: Melanggar pedoman kampus..."
                  rows={4}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/40 transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsHoldModalOpen(false)}
                  disabled={isProcessing}
                  className="flex-1 bg-gray-50 text-dark py-3.5 rounded-xl font-bold text-sm hover:bg-gray-100 border border-gray-200 transition-all disabled:opacity-50"
                >
                  Kembali
                </button>
                <button
                  onClick={handleHoldEvent}
                  disabled={isProcessing}
                  className="flex-1 bg-amber-500 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-amber-600 transition-all shadow-sm disabled:opacity-50"
                >
                  {isProcessing ? "Memproses..." : "Batalkan Acara"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-dark/60 backdrop-blur-md" onClick={() => !isProcessing && setIsDeleteModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-2xl p-8 shadow-xl border border-gray-200 animate-in zoom-in-95 duration-300">
            <div className="h-14 w-14 bg-red-50 rounded-2xl flex items-center justify-center mb-6 border border-red-100">
              <Trash2 className="h-7 w-7 text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-dark mb-2 tracking-tight">Hapus Permanen?</h2>
            <p className="text-neutral text-sm mb-6 font-medium leading-relaxed">
              Anda yakin ingin menghapus <strong>{selectedEvent.title}</strong>? Tindakan ini tidak dapat dibatalkan dan semua data terkait acara ini akan hilang.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isProcessing}
                className="flex-1 bg-gray-50 text-dark py-3.5 rounded-xl font-bold text-sm hover:bg-gray-100 border border-gray-200 transition-all disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteEvent}
                disabled={isProcessing}
                className="flex-1 bg-red-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-red-700 transition-all shadow-sm disabled:opacity-50"
              >
                {isProcessing ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
