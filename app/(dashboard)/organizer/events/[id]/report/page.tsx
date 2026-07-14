"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Printer,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  Star,
  FileText,
  BarChart3,
  Building2,
  Download
} from "lucide-react";
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
  Cell
} from "recharts";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "@/components/providers/AuthProvider";
import toast from "react-hot-toast";

export default function EventReportPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const { user } = useAuth();

  const [event, setEvent] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Stats
  const [attendedCount, setAttendedCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingBreakdown, setRatingBreakdown] = useState<number[]>([0, 0, 0, 0, 0]);

  useEffect(() => {
    if (!user || !id) return;

    const fetchData = async () => {
      try {
        // 1. Fetch Event
        const eventRef = doc(db, "events", id);
        const eventSnap = await getDoc(eventRef);

        if (!eventSnap.exists()) {
          toast.error("Acara tidak ditemukan");
          router.push("/organizer/events");
          return;
        }

        const eventData = { id: eventSnap.id, ...eventSnap.data() } as any;

        if (eventData.organizerId !== user.uid) {
          toast.error("Akses ditolak");
          router.push("/organizer/events");
          return;
        }

        setEvent(eventData);

        // 2. Fetch Registrations
        const regQuery = query(
          collection(db, "registrations"),
          where("eventId", "==", id),
          where("organizerId", "==", user.uid)
        );
        const regSnap = await getDocs(regQuery);
        const regData = regSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        setRegistrations(regData);

        const attended = regData.filter(r => r.status === "attended").length;
        setAttendedCount(attended);

        // 3. Fetch Reviews
        const reviewsQuery = query(
          collection(db, "reviews"),
          where("eventId", "==", id)
        );
        const reviewsSnap = await getDocs(reviewsQuery);
        const revData = reviewsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)).sort((a: any, b: any) => {
          const timeA = a.createdAt?.seconds || (a.createdAt ? new Date(a.createdAt).getTime() / 1000 : 0);
          const timeB = b.createdAt?.seconds || (b.createdAt ? new Date(b.createdAt).getTime() / 1000 : 0);
          return timeB - timeA;
        });

        setReviews(revData);

        if (revData.length > 0) {
          const sum = revData.reduce((acc, curr: any) => acc + curr.rating, 0);
          setAverageRating(Math.round((sum / revData.length) * 10) / 10);

          const breakdown = [0, 0, 0, 0, 0];
          revData.forEach((r: any) => {
            const starIndex = 5 - r.rating; // 0=5*, 1=4*, 2=3*, 3=2*, 4=1*
            if (starIndex >= 0 && starIndex < 5) breakdown[starIndex]++;
          });
          setRatingBreakdown(breakdown);
        }

        setIsLoading(false);
      } catch (error: any) {
        console.error("Error fetching report data:", error);
        toast.error(`Gagal memuat laporan: ${error?.message || 'Terjadi kesalahan'}`);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, user, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="h-14 w-14 border-[5px] border-primary/10 border-t-primary rounded-full animate-spin mb-6" />
        <p className="text-neutral text-sm font-bold tracking-wide uppercase">Memuat Laporan...</p>
      </div>
    );
  }

  if (!event) return null;

  const totalRegistered = event.registeredCount || registrations.length;
  const attendanceRate = totalRegistered > 0 ? Math.round((attendedCount / totalRegistered) * 100) : 0;
  const capacityRate = event.maxCapacity > 0 ? Math.round((totalRegistered / event.maxCapacity) * 100) : 0;

  const funnelData = [
    { name: 'Kapasitas', jumlah: Number(event.maxCapacity) || 0, fill: '#e5e7eb' },
    { name: 'Pendaftar', jumlah: totalRegistered, fill: '#3b82f6' },
    { name: 'Hadir', jumlah: attendedCount, fill: '#10b981' }
  ];

  const pieColors = ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7'];
  const pieData = ratingBreakdown.map((count, idx) => ({
    name: `${5 - idx} Bintang`,
    value: count,
  })).filter(data => data.value > 0);

  return (
    <div className="max-w-5xl mx-auto pb-20 print:p-0 print:max-w-full">
      {/* ── HEADER / NAVIGATION ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 print:hidden">
        <Link
          href="/organizer/events"
          className="inline-flex items-center gap-2 text-accent hover:text-accent-600 font-bold text-sm transition-colors w-fit"
        >
          <ChevronLeft className="h-4 w-4" /> Kembali ke Daftar Acara
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-dark text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-black transition-all shadow-xl shadow-black/10 active:scale-95"
        >
          <Printer className="h-4 w-4" /> Cetak Laporan
        </button>
      </div>

      {/* ── PRINT HEADER (Only visible when printing) ── */}
      <div className="hidden print:block text-center mb-10 border-b-2 border-gray-800 pb-6">
        <h1 className="text-3xl font-black text-black mb-2 uppercase tracking-widest">Laporan Pelaksanaan Acara</h1>
        <p className="text-gray-600 font-medium text-sm">Dokumen ini digenerate otomatis melalui platform Cavent</p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden print:border-none print:shadow-none print:rounded-none">

        {/* ── EVENT INFO HERO ── */}
        <div className="bg-gray-50/50 p-8 border-b border-gray-100 print:bg-transparent print:p-0 print:mb-8 print:border-none">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-1/3 aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200/50 shadow-inner print:hidden">
              <img
                src={event.bannerUrl || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070"}
                alt="Banner Acara"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 space-y-5 print:w-full">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-blue-100">
                    {event.eventState === "completed" ? "Selesai" : "Berlangsung"}
                  </span>
                  <span className="bg-gray-100 text-neutral px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-gray-200">
                    {event.feeType}
                  </span>
                </div>
                <h1 className="text-3xl font-black text-dark leading-tight print:text-black mb-2">{event.title}</h1>
                <p className="text-primary font-bold text-sm">{event.organizerName}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-neutral shrink-0 print:text-black" />
                  <div>
                    <p className="text-xs font-bold text-neutral uppercase tracking-wider mb-0.5 print:text-gray-500">Tanggal Pelaksanaan</p>
                    <p className="text-sm font-semibold text-dark print:text-black">{event.startDate} • {event.startTime} WIB</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-neutral shrink-0 print:text-black" />
                  <div>
                    <p className="text-xs font-bold text-neutral uppercase tracking-wider mb-0.5 print:text-gray-500">Lokasi Acara</p>
                    <p className="text-sm font-semibold text-dark print:text-black">{event.venue}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── KEY METRICS ── */}
        <div className="p-8 print:p-0 print:mb-10">
          <h2 className="text-xl font-black text-dark mb-6 flex items-center gap-2 print:text-black">
            <BarChart3 className="h-5 w-5 text-primary" /> Statistik Kehadiran
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 print:grid-cols-4">
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 print:border-gray-300 print:bg-transparent">
              <p className="text-[10px] font-black text-neutral uppercase tracking-widest mb-1 print:text-gray-500">Kapasitas</p>
              <p className="text-3xl font-black text-dark print:text-black">{event.maxCapacity}</p>
            </div>
            <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100 print:border-gray-300 print:bg-transparent">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 print:text-gray-500">Pendaftar</p>
              <p className="text-3xl font-black text-blue-700 print:text-black">{totalRegistered}</p>
            </div>
            <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100 print:border-gray-300 print:bg-transparent">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 print:text-gray-500">Hadir</p>
              <p className="text-3xl font-black text-emerald-700 print:text-black">{attendedCount}</p>
            </div>
            <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-100 print:border-gray-300 print:bg-transparent">
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 print:text-gray-500">Rating Acara</p>
              <div className="flex items-center gap-1.5 mt-1">
                <p className="text-3xl font-black text-amber-700 print:text-black">{averageRating}</p>
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm print:border-gray-300 print:shadow-none mb-4">
            <div className="flex flex-col md:flex-row justify-between md:items-end mb-8 gap-4">
              <div>
                <p className="text-sm font-bold text-dark print:text-black">Tingkat Kehadiran & Keterisian Kuota</p>
                <p className="text-xs text-neutral mt-1">Visualisasi perbandingan kapasitas acara, jumlah pendaftar, dan peserta yang hadir.</p>
              </div>
              <div className="flex gap-4">
                <div className="text-right">
                  <p className="text-2xl font-black text-blue-600 print:text-black">{capacityRate}%</p>
                  <p className="text-[10px] font-bold text-neutral uppercase tracking-wider">Keterisian</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-emerald-600 print:text-black">{attendanceRate}%</p>
                  <p className="text-[10px] font-bold text-neutral uppercase tracking-wider">Kehadiran</p>
                </div>
              </div>
            </div>
            
            <div className="w-full h-[250px] print:h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={funnelData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 'bold' }} 
                  />
                  <RechartsTooltip 
                    cursor={{fill: '#f9fafb'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="jumlah" radius={[0, 8, 8, 0]} barSize={40}>
                    {
                      funnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── DAFTAR PESERTA HADIR ── */}
        <div className="p-8 bg-gray-50/10 border-t border-gray-100 print:p-0 print:border-t-2 print:border-gray-800 print:pt-8 print:bg-transparent">
          <h2 className="text-xl font-black text-dark mb-6 flex items-center gap-2 print:text-black">
            <Users className="h-5 w-5 text-blue-500" /> Daftar Peserta Hadir
          </h2>

          {registrations.filter(r => r.status === "attended").length > 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm print:border-none print:shadow-none print:rounded-none">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] font-black text-neutral uppercase tracking-widest bg-gray-50/80 print:bg-transparent print:border-b-2 print:border-gray-800">
                      <th className="py-4 px-5 w-12 text-center print:text-black">#</th>
                      <th className="py-4 px-5 print:text-black">Nama Lengkap</th>
                      <th className="py-4 px-5 print:text-black">Email / NIM</th>
                      <th className="py-4 px-5 print:text-black">Waktu Check-in</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 print:divide-gray-200">
                    {registrations.filter(r => r.status === "attended").map((reg, idx) => {
                      const checkInDate = reg.attendedAt?.toDate ? reg.attendedAt.toDate().toLocaleString("id-ID", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB' : "-";
                      const emailStr = reg.userEmail || reg.email || "";
                      const nimParts = emailStr.split('@');
                      const possibleNim = nimParts[0];
                      const nimDisplay = /^\d+$/.test(possibleNim) ? possibleNim : (emailStr || "-");

                      return (
                        <tr key={reg.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-5 text-sm text-neutral text-center font-medium print:text-black">{idx + 1}</td>
                          <td className="py-3 px-5 text-sm font-bold text-dark print:text-black">{reg.userName || reg.name || "Peserta"}</td>
                          <td className="py-3 px-5 text-xs text-neutral print:text-black">{nimDisplay}</td>
                          <td className="py-3 px-5 text-xs text-neutral print:text-black">{checkInDate}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center flex flex-col items-center print:border-none">
              <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="font-bold text-dark mb-1">Belum Ada Peserta Hadir</h3>
              <p className="text-sm text-neutral">Belum ada peserta yang melakukan check-in pada acara ini.</p>
            </div>
          )}
        </div>

        {/* ── REVIEWS & FEEDBACK ── */}
        <div className="p-8 bg-gray-50/30 border-t border-gray-100 print:p-0 print:border-t-2 print:border-gray-800 print:pt-8 print:bg-transparent">
          <h2 className="text-xl font-black text-dark mb-6 flex items-center gap-2 print:text-black">
            <Star className="h-5 w-5 text-amber-500" /> Ulasan &amp; Evaluasi Peserta
          </h2>

          {reviews.length > 0 ? (
            <div className="space-y-8 print:space-y-6">
              {/* Review Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm print:border-gray-300 print:shadow-none items-center">
                
                {/* Average Rating */}
                <div className="md:col-span-3 text-center md:border-r border-gray-100 md:pr-4">
                  <p className="text-5xl font-black text-dark tracking-tighter mb-2 print:text-black">{averageRating}</p>
                  <div className="flex justify-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`h-4 w-4 ${s <= Math.round(averageRating) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                    ))}
                  </div>
                  <p className="text-xs font-bold text-neutral uppercase tracking-widest">{reviews.length} Ulasan</p>
                </div>
                
                {/* Progress Bar Breakdown */}
                <div className="md:col-span-5 space-y-2">
                  {[5, 4, 3, 2, 1].map((s, idx) => {
                    const count = ratingBreakdown[idx] || 0;
                    const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={s} className="flex items-center gap-3 text-xs">
                        <span className="w-3 text-right font-bold text-dark print:text-black">{s}</span>
                        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0" />
                        <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden print:bg-gray-200">
                          <div className="bg-amber-400 h-full rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                        <span className="w-8 text-neutral font-medium text-right print:text-black">{count}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Pie Chart Visual */}
                <div className="md:col-span-4 h-[160px] flex items-center justify-center print:hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                        itemStyle={{ color: '#4b5563' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Review List */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm print:border-none print:shadow-none print:rounded-none">
                <div className="p-5 border-b border-gray-100 bg-gray-50/80 print:bg-transparent print:border-b-2 print:border-gray-800">
                  <h3 className="font-bold text-sm text-dark uppercase tracking-wider print:text-black">Komentar Peserta</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {reviews.map((r) => {
                    const date = r.createdAt ? new Date(r.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : "-";
                    return (
                      <div key={r.id} className="p-5 print:px-0">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-bold text-sm text-dark print:text-black">{r.userName}</p>
                            <p className="text-[10px] font-semibold text-neutral uppercase tracking-wider">{date}</p>
                          </div>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`h-3 w-3 ${s <= r.rating ? "fill-amber-400 text-amber-400 print:text-black print:fill-black" : "text-gray-200 print:hidden"}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-neutral leading-relaxed italic print:text-black">&quot;{r.comment}&quot;</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center flex flex-col items-center print:border-none">
              <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                <Star className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="font-bold text-dark mb-1">Belum Ada Ulasan</h3>
              <p className="text-sm text-neutral">Belum ada peserta yang memberikan rating atau evaluasi untuk acara ini.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
