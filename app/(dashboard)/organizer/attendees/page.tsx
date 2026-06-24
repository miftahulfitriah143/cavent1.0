"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Mail, 
  CheckCircle2, 
  Clock,
  Calendar,
  ExternalLink,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { useAuth } from "@/components/providers/AuthProvider";
import Link from "next/link";

export default function AttendeesPage() {
  const { user } = useAuth();
  const [attendees, setAttendees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    if (!user) return;

    // Fetch registrations where organizerId matches current user
    const q = query(
      collection(db, "registrations"),
      where("organizerId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const attendeeData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => {
        const dateA = a.registeredAt?.seconds || 0;
        const dateB = b.registeredAt?.seconds || 0;
        return dateB - dateA;
      });
      
      setAttendees(attendeeData);
      setIsLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredAttendees = attendees.filter(a => {
    const matchesSearch = 
      a.userName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.eventTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.userEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === "all" || a.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "attended":
        return <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 border border-green-100"><CheckCircle2 className="h-3 w-3" /> Hadir</span>;
      default:
        return <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 border border-blue-100"><Clock className="h-3 w-3" /> Terdaftar</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <Link 
        href="/organizer" 
        className="inline-flex items-center gap-2 text-accent hover:text-accent-600 font-bold text-sm transition-colors"
      >
        <ChevronLeft className="h-4 w-4" /> Kembali ke Dashboard
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-dark tracking-tight">Daftar Peserta</h1>
          <p className="text-neutral text-sm mt-2">Pantau mahasiswa yang mendaftar dan hadir di acaramu.</p>
        </div>

        <button className="flex items-center gap-2 bg-dark text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-black shadow-xl shadow-black/10 transition-all active:scale-95 w-fit">
          <Download className="h-4 w-4" /> Export Data (.csv)
        </button>
      </div>

      {/* Stats Mini */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-neutral uppercase tracking-widest mb-1">Total Pendaftar</p>
          <p className="text-2xl font-black text-dark">{attendees.length}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-xl border border-green-100 shadow-sm">
          <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-1">Total Hadir</p>
          <p className="text-2xl font-black text-green-700">{attendees.filter(a => a.status === "attended").length}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-8 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral/40" />
          <input 
            type="text" 
            placeholder="Cari nama peserta, email, atau judul acara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50/50 border border-transparent rounded-xl pl-14 pr-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all"
          />
        </div>
        <select 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-gray-50 text-dark font-bold text-sm px-6 py-3.5 rounded-xl border border-transparent focus:ring-2 focus:ring-primary/10 outline-none cursor-pointer"
        >
          <option value="all">Semua Status</option>
          <option value="confirmed">Belum Hadir</option>
          <option value="attended">Sudah Hadir</option>
        </select>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="h-12 w-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-neutral text-sm font-bold tracking-widest uppercase">Memuat Peserta...</p>
          </div>
        ) : filteredAttendees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-5 text-[10px] font-black text-neutral uppercase tracking-widest">Mahasiswa</th>
                  <th className="px-8 py-5 text-[10px] font-black text-neutral uppercase tracking-widest">Acara</th>
                  <th className="px-8 py-5 text-[10px] font-black text-neutral uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-neutral uppercase tracking-widest">Waktu Daftar</th>
                  <th className="px-8 py-5 text-[10px] font-black text-neutral uppercase tracking-widest"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredAttendees.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold text-xs">
                          {a.userName?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-black text-dark">{a.userName}</p>
                          <p className="text-xs text-neutral font-medium">{a.userEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-dark truncate max-w-[200px]">{a.eventTitle}</p>
                    </td>
                    <td className="px-8 py-6">
                      {getStatusBadge(a.status)}
                    </td>
                    <td className="px-8 py-6 text-xs text-neutral font-medium">
                      {a.registeredAt?.toDate().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <a href={`mailto:${a.userEmail}`} className="p-2 text-neutral hover:text-primary transition-colors" title="Hubungi Peserta">
                           <Mail className="h-4 w-4" />
                         </a>
                         <button className="p-2 text-neutral hover:text-dark transition-colors" title="Detail Peserta">
                           <ChevronRight className="h-4 w-4" />
                         </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-32 flex flex-col items-center justify-center text-center px-10">
            <div className="h-20 w-20 bg-gray-50 rounded-xl flex items-center justify-center mb-6">
              <Users className="h-10 w-10 text-neutral/20" />
            </div>
            <h3 className="text-xl font-bold text-dark mb-2">Tidak Ada Peserta</h3>
            <p className="text-neutral text-sm max-w-xs mx-auto">
              Belum ada pendaftar untuk acara-acaramu. Pastikan acaramu sudah menarik dan disetujui admin!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
