"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, getDocs } from "firebase/firestore";
import { useAuth } from "@/components/providers/AuthProvider";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Calendar, Users, BarChart3, TrendingUp, CheckCircle2, FileText, XCircle, Clock, Star } from "lucide-react";

export default function AdminAnalyticsPage() {
  const { user, role } = useAuth();
  
  const [events, setEvents] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || role !== "admin") return;

    // Fetch Events real-time
    const qEvents = query(collection(db, "events"));
    const unsubEvents = onSnapshot(qEvents, (snapshot) => {
      const eventsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEvents(eventsData);
    });

    // Fetch Registrations real-time
    const qRegistrations = query(collection(db, "registrations"));
    const unsubRegistrations = onSnapshot(qRegistrations, (snapshot) => {
      const regData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRegistrations(regData);
      setIsLoading(false);
    });

    return () => {
      unsubEvents();
      unsubRegistrations();
    };
  }, [user, role]);

  if (role !== "admin") {
    return <div className="p-8 text-center font-bold text-red-500">Akses Ditolak. Anda bukan Admin.</div>;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="h-14 w-14 border-[5px] border-primary/10 border-t-primary rounded-full animate-spin mb-6" />
        <p className="text-neutral text-sm font-bold tracking-wide uppercase">Memuat Analitik...</p>
      </div>
    );
  }

  // --- KPI Cards Calculations ---
  const totalEvents = events.length;
  const publishedEvents = events.filter((e) => e.status === "published").length;
  const pendingEvents = events.filter((e) => e.status === "pending").length;
  
  const totalRegistrations = registrations.length;
  const totalAttended = registrations.filter((r) => r.status === "attended").length;

  // --- Bar Chart Calculation (Acara per Bulan) ---
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
  const eventsPerMonthMap: Record<string, any> = {};

  // Inisialisasi 12 bulan
  monthNames.forEach((month) => {
    eventsPerMonthMap[month] = { name: month, draft: 0, pending: 0, published: 0, rejected: 0 };
  });

  events.forEach((event) => {
    if (event.createdAt) {
      const date = event.createdAt.seconds 
        ? new Date(event.createdAt.seconds * 1000) 
        : new Date(event.createdAt);
        
      const monthIdx = date.getMonth();
      const monthName = monthNames[monthIdx];
      const status = event.status || "draft";
      
      if (eventsPerMonthMap[monthName][status] !== undefined) {
        eventsPerMonthMap[monthName][status] += 1;
      }
    }
  });

  const barChartData = Object.values(eventsPerMonthMap);

  // --- Pie Chart Calculation (Tingkat Kehadiran) ---
  const pieChartData = [
    { name: "Hadir", value: totalAttended, color: "#10b981" },
    { name: "Tidak Hadir", value: totalRegistrations - totalAttended, color: "#f43f5e" },
  ];

  // --- Top 5 Popular Events ---
  const registrationCountByEvent: Record<string, number> = {};
  registrations.forEach((reg) => {
    if (reg.eventId) {
      registrationCountByEvent[reg.eventId] = (registrationCountByEvent[reg.eventId] || 0) + 1;
    }
  });

  // Sort events by popularity
  const topEvents = [...events]
    .map((e) => ({
      ...e,
      registrationCount: registrationCountByEvent[e.id] || 0,
    }))
    .sort((a, b) => b.registrationCount - a.registrationCount)
    .slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-dark tracking-tight mb-2">Dasbor Analitik</h1>
        <p className="text-neutral text-sm">Pantau statistik keseluruhan platform CAVENT.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-neutral uppercase tracking-wider mb-2">Total Acara</p>
            <p className="text-3xl font-black text-dark">{totalEvents}</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-neutral uppercase tracking-wider mb-2">Acara Disetujui</p>
            <p className="text-3xl font-black text-emerald-600">{publishedEvents}</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-neutral uppercase tracking-wider mb-2">Total Pendaftar</p>
            <p className="text-3xl font-black text-primary">{totalRegistrations}</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="h-6 w-6 text-primary" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-neutral uppercase tracking-wider mb-2">Total Hadir</p>
            <p className="text-3xl font-black text-amber-600">{totalAttended}</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-amber-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Bar Chart - Acara per Bulan */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-dark">Pertumbuhan Acara</h3>
              <p className="text-xs text-neutral">Jumlah acara yang diajukan per bulan</p>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <RechartsTooltip 
                  cursor={{ fill: '#f9fafb' }} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Bar dataKey="draft" name="Draft" stackId="a" fill="#9ca3af" radius={[0, 0, 4, 4]} />
                <Bar dataKey="pending" name="Menunggu" stackId="a" fill="#f59e0b" />
                <Bar dataKey="rejected" name="Ditolak" stackId="a" fill="#ef4444" />
                <Bar dataKey="published" name="Disetujui" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart - Tingkat Kehadiran */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h3 className="font-bold text-dark">Tingkat Kehadiran</h3>
              <p className="text-xs text-neutral">Hadir vs Tidak Hadir</p>
            </div>
          </div>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-dark">
                {totalRegistrations > 0 ? Math.round((totalAttended / totalRegistrations) * 100) : 0}%
              </span>
              <span className="text-[10px] text-neutral font-bold uppercase">Kehadiran</span>
            </div>
          </div>
          
          <div className="flex justify-center gap-6 mt-4">
            {pieChartData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-medium text-neutral">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Events Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center">
            <Star className="h-5 w-5 text-rose-500 fill-rose-500" />
          </div>
          <div>
            <h3 className="font-bold text-dark">Acara Terpopuler</h3>
            <p className="text-xs text-neutral">Berdasarkan jumlah pendaftar terbanyak</p>
          </div>
        </div>
        
        {topEvents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-100 text-[10px] font-bold text-neutral uppercase tracking-wider">
                  <th className="p-5">Peringkat</th>
                  <th className="p-5">Nama Acara</th>
                  <th className="p-5">Status</th>
                  <th className="p-5 text-right">Jumlah Pendaftar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topEvents.map((event, index) => (
                  <tr key={event.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-5 text-center">
                      <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full font-black text-sm ${
                        index === 0 ? "bg-amber-100 text-amber-600" :
                        index === 1 ? "bg-gray-200 text-gray-600" :
                        index === 2 ? "bg-orange-100 text-orange-700" :
                        "bg-gray-50 text-neutral"
                      }`}>
                        #{index + 1}
                      </span>
                    </td>
                    <td className="p-5 font-bold text-dark text-sm max-w-[200px] truncate">
                      {event.title}
                    </td>
                    <td className="p-5">
                      {event.status === "published" ? (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Disetujui</span>
                      ) : event.status === "pending" ? (
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">Menunggu</span>
                      ) : event.status === "rejected" ? (
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">Ditolak</span>
                      ) : (
                        <span className="text-xs font-bold text-gray-600 bg-gray-50 px-3 py-1 rounded-full">Draft</span>
                      )}
                    </td>
                    <td className="p-5 text-right font-black text-primary text-lg">
                      {event.registrationCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-neutral text-sm">
            Belum ada data acara dan pendaftar.
          </div>
        )}
      </div>
    </div>
  );
}
