"use client";

import { useEffect, useState } from "react";
import { 
  ArrowRight, 
  CalendarDays, 
  Star, 
  User, 
  Ticket, 
  Clock, 
  CheckCircle2, 
  Calendar,
  ChevronRight,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, limit, orderBy } from "firebase/firestore";
import { useAuth } from "@/components/providers/AuthProvider";

export default function MahasiswaDashboard() {
  const { user } = useAuth();
  const [recentRegistrations, setRecentRegistrations] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalTickets: 0,
    attendedEvents: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Fetch recent registrations
    const q = query(
      collection(db, "registrations"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const regs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => {
          const dateA = a.registeredAt?.seconds || 0;
          const dateB = b.registeredAt?.seconds || 0;
          return dateB - dateA;
        });

      setRecentRegistrations(regs.slice(0, 3));
      
      // Also get total counts
      setStats({
        totalTickets: regs.length,
        attendedEvents: regs.filter((r: any) => r.status === "attended").length
      });

      
      setIsLoading(false);
    }, (error) => {
      console.error("Dashboard Error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const QUICK_ACTIONS = [
    { title: "Profil Saya", icon: User, href: "/mahasiswa/profile", color: "bg-blue-50 text-blue-600" },
    { title: "Acara Saya", icon: CalendarDays, href: "/mahasiswa/my-events", color: "bg-teal-50 text-teal-600" },
    { title: "Ulasan Saya", icon: Star, href: "/mahasiswa/ratings", color: "bg-amber-50 text-amber-600" },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-neutral text-sm font-bold uppercase tracking-widest">Memuat Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-900 to-primary rounded-xl p-6 md:p-12 text-white relative overflow-hidden shadow-xl shadow-primary/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-lg md:text-3xl font-black tracking-tight mb-3 md:mb-4 leading-tight">Selamat Datang Kembali, Venters! 👋</h1>
          <p className="text-white/80 text-xs md:text-base leading-relaxed mb-6 md:mb-8">
            Siap untuk menjelajahi pengalaman baru di kampus? Cari acara menarik dan kembangkan potensi dirimu bersama Cavent.
          </p>
          <Link href="/events" className="inline-flex items-center gap-2 bg-accent text-white px-5 py-2.5 md:px-8 md:py-3.5 rounded-xl font-bold text-xs md:text-base hover:bg-amber-500 transition-all shadow-lg shadow-accent/20 active:scale-95">
            Cari Acara Sekarang
            <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Recent Registrations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-dark tracking-tight">Pendaftaran Terakhir</h2>
            <Link href="/mahasiswa/my-events" className="text-primary text-xs font-bold hover:underline">Lihat Semua</Link>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {recentRegistrations.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {recentRegistrations.map((reg) => (
                  <Link 
                    key={reg.id} 
                    href={`/mahasiswa/my-events/${reg.id}`}
                    className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 rounded-xl overflow-hidden shrink-0 border border-gray-100 shadow-inner">
                        <img 
                          src={reg.eventBanner || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop"} 
                          alt={reg.eventTitle}
                          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-dark text-sm group-hover:text-primary transition-colors">{reg.eventTitle}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1.5 text-[10px] text-neutral font-medium">
                            <Calendar className="h-3 w-3 text-primary/40" />
                            {reg.eventDate}
                          </div>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            reg.status === 'attended' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                          }`}>
                            {reg.status === 'attended' ? 'Hadir' : 'Terdaftar'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-neutral/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-center px-10">
                 <div className="h-16 w-16 bg-gray-50 rounded-xl flex items-center justify-center mb-6">
                    <CalendarDays className="h-8 w-8 text-neutral/20" />
                 </div>
                 <h3 className="text-lg font-bold text-dark mb-1">Belum ada pendaftaran</h3>
                 <p className="text-neutral text-sm mb-8">Acara yang kamu ikuti akan muncul di sini.</p>
                 <Link href="/events" className="text-primary text-sm font-bold flex items-center gap-2 hover:gap-3 transition-all">
                   Cari Acara <ArrowRight className="h-4 w-4" />
                 </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Stats & Actions */}
        <div className="space-y-8">
          {/* Stats Card */}
          <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Ticket className="h-20 w-20" />
            </div>
            <h2 className="text-sm font-black text-neutral uppercase tracking-widest mb-6">Ringkasan</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Ticket className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold text-dark">Total Tiket</span>
                </div>
                <span className="text-lg font-black text-dark">{recentRegistrations.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold text-dark">Sudah Hadir</span>
                </div>
                <span className="text-lg font-black text-dark">{stats.attendedEvents}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 gap-4">
            {QUICK_ACTIONS.map((action) => (
              <Link 
                key={action.title}
                href={action.href}
                className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group"
              >
                <div className={`h-12 w-12 rounded-xl ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-dark text-sm">{action.title}</h3>
                  <p className="text-[10px] text-neutral font-medium">Buka menu {action.title.toLowerCase()}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral/20 ml-auto group-hover:text-dark transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


