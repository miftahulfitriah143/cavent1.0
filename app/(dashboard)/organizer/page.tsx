"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Calendar,
  Users,
  CheckCircle,
  Star,
  ArrowUpRight,
  Loader2,
  Clock,
  AlertCircle
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { useAuth } from "@/components/providers/AuthProvider";
import Link from "next/link";

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalRegistrants: 0,
    attendanceRate: 0,
    avgRating: 4.8
  });
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // 1. Fetch Events
    const qEvents = query(
      collection(db, "events"),
      where("organizerId", "==", user.uid)
    );

    const unsubscribeEvents = onSnapshot(qEvents, async (snapshot) => {
      const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentEvents(events.slice(0, 5));

      // 2. Fetch Registrations for Stats
      const qRegs = query(
        collection(db, "registrations"),
        where("organizerId", "==", user.uid)
      );

      const regsSnapshot = await getDocs(qRegs);
      const totalRegs = regsSnapshot.size;
      const attendedRegs = regsSnapshot.docs.filter(d => d.data().status === "attended").length;
      const attendanceRate = totalRegs > 0 ? Math.round((attendedRegs / totalRegs) * 100) : 0;

      setStats({
        totalEvents: events.length,
        totalRegistrants: totalRegs,
        attendanceRate: attendanceRate,
        avgRating: 4.8 // Placeholder for now
      });

      setIsLoading(false);
    });

    return () => unsubscribeEvents();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-neutral text-sm font-bold uppercase tracking-widest">Memuat Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-10">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-dark tracking-tight">Dashboard</h1>
          <p className="text-neutral text-sm mt-2">Selamat datang kembali! Berikut ringkasan aktivitas acaramu.</p>
        </div>
        <Link href="/organizer/events/new" className="flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-primary-900 shadow-xl shadow-primary/20 transition-all active:scale-95">
          <Plus className="h-5 w-5" />
          Buat Acara Baru
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: "Total Acara", value: stats.totalEvents, icon: <Calendar />, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Total Pendaftar", value: stats.totalRegistrants, icon: <Users />, color: "text-primary", bg: "bg-primary-50" },
          { label: "Tingkat Kehadiran", value: `${stats.attendanceRate}%`, icon: <CheckCircle />, color: "text-green-600", bg: "bg-green-50" },
          { label: "Rating Rata-rata", value: stats.avgRating, icon: <Star className="fill-current" />, color: "text-yellow-600", bg: "bg-yellow-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-6">
              <div className={`p-3 ${stat.bg} ${stat.color} rounded-xl`}>
                {stat.icon}
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-green-600">
                <ArrowUpRight className="h-3 w-3" />
                <span>Update</span>
              </div>
            </div>
            <h3 className="text-3xl font-black text-dark tracking-tight mb-1">{stat.value}</h3>
            <p className="text-[10px] font-black text-neutral uppercase tracking-widest">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-8 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-black text-dark tracking-tight">Acara Terbaru</h2>
            <p className="text-neutral text-xs font-medium mt-1">Status dan jumlah pendaftar terakhir.</p>
          </div>
          <Link href="/organizer/events" className="text-primary text-xs font-bold hover:underline">
            Lihat Semua
          </Link>
        </div>

        <div className="overflow-x-auto">
          {recentEvents.length > 0 ? (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-neutral text-[10px] uppercase font-black tracking-widest">
                  <th className="px-8 py-5">Nama Acara</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5">Pendaftar</th>
                  <th className="px-8 py-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="font-bold text-dark text-sm leading-tight">{event.title}</div>
                      <div className="flex items-center gap-2 text-[10px] text-neutral font-bold mt-1">
                        <Clock className="h-3 w-3" />
                        {event.startDate}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${event.status === 'published' ? 'bg-green-50 text-green-600 border-green-100' :
                        event.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-red-50 text-red-600 border-red-100'
                        }`}>
                        {event.status === 'published' ? 'Aktif' : event.status === 'pending' ? 'Menunggu' : 'Ditolak'}
                      </span>
                    </td>
                    <td className="px-8 py-6 font-black text-dark text-sm">
                      {event.registeredCount || 0}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <Link
                        href="/organizer/events"
                        className="inline-flex items-center justify-center p-2 text-neutral hover:text-primary hover:bg-primary-50 rounded-lg transition-all"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center px-10">
              <div className="h-16 w-16 bg-gray-50 rounded-xl flex items-center justify-center mb-6">
                <AlertCircle className="h-8 w-8 text-neutral/20" />
              </div>
              <h3 className="text-lg font-bold text-dark mb-1">Belum Ada Acara</h3>
              <p className="text-neutral text-sm">Mulai buat acaramu dan lihat statistiknya di sini.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

