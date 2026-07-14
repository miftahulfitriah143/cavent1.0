"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import {
  BarChart3,
  Users,
  CheckCircle2,
  Star,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "@/components/providers/AuthProvider";

export default function OrganizerGlobalAnalytics() {
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalRegistrants: 0,
    attendedCount: 0,
    avgRating: 0,
    totalReviews: 0,
  });

  const [eventData, setEventData] = useState<any[]>([]);
  const [ratingBreakdown, setRatingBreakdown] = useState<number[]>([0, 0, 0, 0, 0]); // 5,4,3,2,1

  useEffect(() => {
    if (!user) return;

    const fetchGlobalAnalytics = async () => {
      try {
        // 1. Fetch Events
        const eventsQuery = query(
          collection(db, "events"),
          where("organizerId", "==", user.uid)
        );
        const eventsSnap = await getDocs(eventsQuery);
        const events = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        
        // 2. Fetch All Registrations for this organizer
        const regsQuery = query(
          collection(db, "registrations"),
          where("organizerId", "==", user.uid)
        );
        const regsSnap = await getDocs(regsQuery);
        const regs = regsSnap.docs.map(d => d.data() as any);
        
        const attendedCount = regs.filter(r => r.status === "attended").length;

        // 3. Fetch Reviews (We need to chunk event IDs because 'in' supports max 10)
        let allReviews: any[] = [];
        const eventIds = events.map(e => e.id);
        
        if (eventIds.length > 0) {
           // For simplicity in client side, fetch all reviews and filter, or chunk
           // Better to chunk
           const chunkSize = 10;
           for (let i = 0; i < eventIds.length; i += chunkSize) {
             const chunk = eventIds.slice(i, i + chunkSize);
             const chunkQuery = query(
               collection(db, "reviews"),
               where("eventId", "in", chunk)
             );
             const chunkSnap = await getDocs(chunkQuery);
             chunkSnap.docs.forEach(d => allReviews.push(d.data()));
           }
        }

        // Calculate Ratings
        let avgRating = 0;
        const breakdown = [0, 0, 0, 0, 0];
        
        if (allReviews.length > 0) {
          const sum = allReviews.reduce((acc, curr) => acc + (curr.rating || 0), 0);
          avgRating = Math.round((sum / allReviews.length) * 10) / 10;
          
          allReviews.forEach(r => {
            const starIndex = 5 - r.rating; // 0=5*, 1=4*, etc
            if (starIndex >= 0 && starIndex < 5) breakdown[starIndex]++;
          });
        }

        // Prepare chart data (Top 5 events by registration)
        const chartData = events.map(ev => {
          const evRegs = regs.filter(r => r.eventId === ev.id);
          const evAttended = evRegs.filter(r => r.status === "attended").length;
          return {
            name: ev.title.length > 20 ? ev.title.substring(0, 20) + "..." : ev.title,
            pendaftar: evRegs.length,
            hadir: evAttended
          };
        }).sort((a, b) => b.pendaftar - a.pendaftar).slice(0, 5);

        setStats({
          totalEvents: events.length,
          totalRegistrants: regs.length,
          attendedCount: attendedCount,
          avgRating,
          totalReviews: allReviews.length
        });
        
        setEventData(chartData);
        setRatingBreakdown(breakdown);
        setIsLoading(false);

      } catch (error) {
        console.error("Error fetching global analytics:", error);
        setIsLoading(false);
      }
    };

    fetchGlobalAnalytics();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="h-14 w-14 border-[5px] border-primary/10 border-t-primary rounded-full animate-spin mb-6" />
        <p className="text-neutral text-sm font-bold tracking-wide uppercase">Memuat Analitik Global...</p>
      </div>
    );
  }

  const attendanceRate = stats.totalRegistrants > 0 
    ? Math.round((stats.attendedCount / stats.totalRegistrants) * 100) 
    : 0;

  const pieColors = ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7'];
  const pieData = ratingBreakdown.map((count, idx) => ({
    name: `${5 - idx} Bintang`,
    value: count,
  })).filter(data => data.value > 0);

  return (
    <div className="max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-black text-dark tracking-tight flex items-center gap-3">
          <BarChart3 className="h-10 w-10 text-primary" /> Analitik Penyelenggara
        </h1>
        <p className="text-neutral text-sm mt-2 font-medium">Ringkasan performa dan metrik dari seluruh acara yang Anda selenggarakan.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-neutral uppercase tracking-widest mb-2">Total Acara</p>
          <div className="flex justify-between items-end">
            <p className="text-4xl font-black text-dark">{stats.totalEvents}</p>
            <div className="bg-blue-50 p-2 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-neutral uppercase tracking-widest mb-2">Total Pendaftar</p>
          <div className="flex justify-between items-end">
            <p className="text-4xl font-black text-blue-600">{stats.totalRegistrants}</p>
            <div className="bg-blue-50 p-2 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-neutral uppercase tracking-widest mb-2">Rata-rata Kehadiran</p>
          <div className="flex justify-between items-end">
            <p className="text-4xl font-black text-emerald-600">{attendanceRate}%</p>
            <div className="bg-emerald-50 p-2 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-neutral uppercase tracking-widest mb-2">Rating Rata-rata</p>
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-1.5">
              <p className="text-4xl font-black text-amber-500">{stats.avgRating}</p>
              <Star className="h-6 w-6 text-amber-400 fill-amber-400" />
            </div>
            <p className="text-xs font-bold text-neutral">({stats.totalReviews} Ulasan)</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        
        {/* Chart: Top 5 Events Performance */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
          <div className="mb-8">
            <h2 className="text-lg font-black text-dark">Performa Kehadiran (Top 5 Acara)</h2>
            <p className="text-xs text-neutral mt-1">Perbandingan Pendaftar vs Kehadiran pada acara paling populer.</p>
          </div>
          
          {eventData.length > 0 ? (
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={eventData}
                  margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 'bold' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9ca3af', fontSize: 10 }} 
                  />
                  <RechartsTooltip 
                    cursor={{fill: '#f9fafb'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '20px' }} />
                  <Bar dataKey="pendaftar" name="Total Pendaftar" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="hadir" name="Total Hadir" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm font-bold text-gray-400">Belum ada data acara yang memadai.</p>
            </div>
          )}
        </div>

        {/* Chart: Rating Distribution */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
          <div className="mb-2">
            <h2 className="text-lg font-black text-dark">Distribusi Kepuasan Peserta</h2>
            <p className="text-xs text-neutral mt-1">Akumulasi ulasan dari seluruh acara Anda.</p>
          </div>
          
          {pieData.length > 0 ? (
            <div className="w-full h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex flex-col items-center justify-center text-center">
              <Star className="h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm font-bold text-gray-400">Belum ada ulasan yang masuk dari peserta.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
