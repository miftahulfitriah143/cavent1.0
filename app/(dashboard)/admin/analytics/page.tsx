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

  const popularEventChartData = topEvents.map(event => ({
    name: event.title.length > 20 ? event.title.substring(0, 20) + "..." : event.title,
    pendaftar: event.registrationCount,
  }));

  const categoryMap: Record<string, number> = {};
  events.forEach(event => {
    const categories = Array.isArray(event.category) ? event.category : [event.category || "Lainnya"];
    categories.forEach((cat: string) => {
       const key = cat.trim();
       if (key) {
         categoryMap[key] = (categoryMap[key] || 0) + 1;
       }
    });
  });

  const categoryChartData = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-dark tracking-tight">Dasbor Analitik</h1>
        <p className="text-neutral text-sm mt-1 font-medium">Pantau statistik keseluruhan platform CAVENT.</p>
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

      {/* Popular Events and Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        
        {/* Bar Chart - Acara Terpopuler */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center">
              <Star className="h-5 w-5 text-rose-500 fill-rose-500" />
            </div>
            <div>
              <h3 className="font-bold text-dark">Acara Terpopuler</h3>
              <p className="text-xs text-neutral">Berdasarkan jumlah pendaftar (Top 5)</p>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={popularEventChartData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 'bold' }} />
                <RechartsTooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="pendaftar" name="Total Pendaftar" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart - Kategori Acara Terbanyak */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
           <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-dark">Kategori Acara</h3>
              <p className="text-xs text-neutral">Distribusi jenis acara yang diselenggarakan</p>
            </div>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'][index % 7]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
