"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { 
  User, 
  Mail, 
  CreditCard, 
  GraduationCap, 
  ShieldCheck, 
  Calendar, 
  Star,
  LogOut,
  ChevronRight,
  Save,
  X,
  Loader2,
  Clock
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, limit, orderBy } from "firebase/firestore";

export default function ProfilePage() {
  const { user, role, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [recentRegistrations, setRecentRegistrations] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalReviews: 0
  });

  const [editData, setEditData] = useState({
    displayName: user?.displayName || "",
    nim: (user as any)?.nim || "",
    prodi: "Teknik Informatika",
  });

  useEffect(() => {
    if (!user) return;

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

      setStats({
        totalEvents: regs.length,
        totalReviews: 0 
      });
      setIsLoading(false);
    }, (error) => {
      console.error("Profile Error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) return null;

  const STATS = [
    { label: "Acara Diikuti", value: stats.totalEvents.toString(), icon: Calendar, color: "bg-blue-50 text-blue-600" },
    { label: "Ulasan", value: stats.totalReviews.toString(), icon: Star, color: "bg-amber-50 text-amber-600" },
  ];

  const handleSave = () => {
    toast.success("Profil berhasil diperbarui!");
    setIsEditing(false);
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Komponen Sidebar Terintegrasi (Avatar & Menu)
  const SidebarCard = () => (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden h-fit">
      {/* Avatar Section */}
      <div className="p-8 pb-8 flex flex-col items-center text-center">
        <div className="relative inline-block mb-4">
          <div className="h-32 w-32 md:h-40 md:w-40 rounded-full bg-primary-900 border-4 border-white shadow-lg flex items-center justify-center text-white text-5xl font-bold overflow-hidden">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || ""} className="h-full w-full object-cover" />
            ) : (
              user.displayName?.charAt(0) || "U"
            )}
          </div>
          <div className="absolute bottom-2 right-2 h-8 w-8 md:h-10 md:w-10 bg-secondary rounded-full border-4 border-white flex items-center justify-center shadow-md">
             <ShieldCheck className="h-4 w-4 md:h-5 md:w-5 text-white" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-dark truncate w-full px-4">
          {isEditing ? editData.displayName : user.displayName}
        </h2>
        <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mt-2">MAHASISWA</p>
      </div>

      {/* Menu Section */}
      <div className="border-t border-gray-50">
        {/* Header - Always Visible, Interactive on Mobile */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-full flex items-center justify-between p-5 bg-gray-50/10 hover:bg-gray-50/50 md:hover:bg-transparent transition-colors group"
        >
          <h3 className="text-[10px] font-bold text-neutral uppercase tracking-[0.2em]">Akun & Pengaturan</h3>
          <div className="md:hidden h-6 w-6 rounded-lg bg-white border border-gray-100 flex items-center justify-center shadow-sm">
            <ChevronRight className={`h-3.5 w-3.5 text-neutral transition-transform duration-300 ${isMenuOpen ? 'rotate-90' : ''}`} />
          </div>
        </button>

        {/* Menu Items - Collapsible on Mobile */}
        <div className={`${isMenuOpen ? 'block' : 'hidden md:block'} p-3 pt-0 space-y-1 animate-in slide-in-from-top-1 duration-300`}>
          <Link href="/mahasiswa/profile" className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 group transition-all text-left w-full">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-dark">Profil Saya</span>
            </div>
            <ChevronRight className="h-4 w-4 text-neutral/40" />
          </Link>
          <Link href="/mahasiswa/my-events" className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-gray-50 group transition-all text-left w-full">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-neutral group-hover:text-primary" />
              <span className="text-sm font-bold text-dark">Acara Saya</span>
            </div>
            <ChevronRight className="h-4 w-4 text-neutral/40" />
          </Link>
          <Link href="/mahasiswa/ratings" className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-gray-50 group transition-all text-left w-full">
            <div className="flex items-center gap-3">
              <Star className="h-4 w-4 text-neutral group-hover:text-primary" />
              <span className="text-sm font-bold text-dark">Ulasan & Rating</span>
            </div>
            <ChevronRight className="h-4 w-4 text-neutral/40" />
          </Link>
          <button 
            onClick={() => logout()}
            className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-red-50 group transition-all w-full text-left"
          >
            <div className="flex items-center gap-3">
              <LogOut className="h-4 w-4 text-red-400 group-hover:text-red-600" />
              <span className="text-sm font-bold text-red-500">Keluar</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );


  return (
    <div className="max-w-6xl mx-auto pb-12 px-4 md:px-0 space-y-8">
      <div className="hidden md:block">
        <h1 className="text-3xl font-extrabold text-dark tracking-tight">Profil Saya</h1>
        <p className="text-neutral text-sm mt-1">Kelola informasi akun dan identitas akademik Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <SidebarCard />
        </div>

        <div className="lg:col-span-3 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
                <div className={`h-12 w-12 ${stat.color} rounded-2xl flex items-center justify-center`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-black text-dark leading-none">{stat.value}</div>
                  <div className="text-[10px] font-bold text-neutral uppercase mt-1 tracking-wider">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Personal Info Card */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-gray-100 shadow-sm">
             <div className="flex items-center justify-between mb-10">
               <h2 className="text-xl md:text-2xl font-extrabold text-dark">
                {isEditing ? "Edit Profil" : "Informasi Pribadi"}
               </h2>
               {!isEditing ? (
                 <button 
                   onClick={() => setIsEditing(true)}
                   className="text-xs font-bold text-primary hover:text-primary-900 transition-colors bg-primary/5 px-4 py-2 rounded-full"
                 >
                   Ubah Data
                 </button>
               ) : (
                 <div className="flex gap-3">
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="text-xs font-bold text-neutral flex items-center gap-1.5 hover:text-dark bg-gray-100 px-4 py-2 rounded-full"
                    >
                      <X className="h-3.5 w-3.5" /> Batal
                    </button>
                    <button 
                      onClick={handleSave}
                      className="text-xs font-bold text-white flex items-center gap-1.5 bg-primary px-5 py-2 rounded-full shadow-md shadow-primary/20 hover:bg-[#0e517a]"
                    >
                      <Save className="h-3.5 w-3.5" /> Simpan
                    </button>
                 </div>
               )}
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral uppercase tracking-widest flex items-center gap-2">
                    <User className="h-3 w-3" /> Nama Lengkap
                  </label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={editData.displayName}
                      onChange={(e) => setEditData({...editData, displayName: e.target.value})}
                      className="w-full bg-primary/5 border border-primary/10 rounded-2xl px-5 py-3.5 text-sm font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  ) : (
                    <p className="text-lg font-bold text-dark">{user.displayName}</p>
                  )}
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral uppercase tracking-widest flex items-center gap-2">
                    <Mail className="h-3 w-3" /> Alamat Email
                  </label>
                  <p className="text-sm md:text-base font-bold text-neutral/60 italic truncate">{user.email}</p>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral uppercase tracking-widest flex items-center gap-2">
                    <CreditCard className="h-3 w-3" /> NIM / ID
                  </label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      placeholder="Masukkan NIM kamu"
                      value={editData.nim}
                      onChange={(e) => setEditData({...editData, nim: e.target.value})}
                      className="w-full bg-primary/5 border border-primary/10 rounded-2xl px-5 py-3.5 text-sm font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  ) : (
                    <p className="text-lg font-bold text-dark">{editData.nim || "-"}</p>
                  )}
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral uppercase tracking-widest flex items-center gap-2">
                    <GraduationCap className="h-3 w-3" /> Program Studi
                  </label>
                  {isEditing ? (
                    <select 
                      value={editData.prodi}
                      onChange={(e) => setEditData({...editData, prodi: e.target.value})}
                      className="w-full bg-primary/5 border border-primary/10 rounded-2xl px-5 py-3.5 text-sm font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none transition-all cursor-pointer"
                    >
                      <option>Teknik Informatika</option>
                      <option>Sistem Informasi</option>
                      <option>DKV</option>
                      <option>Manajemen</option>
                      <option>Ilmu Komunikasi</option>
                    </select>
                  ) : (
                    <p className="text-lg font-bold text-dark">{editData.prodi}</p>
                  )}
               </div>
             </div>
          </div>

          {/* Pendaftaran Terakhir Section */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
             <div className="flex items-center justify-between mb-6">
               <h2 className="text-xl font-bold text-dark">Pendaftaran Terakhir</h2>
               <Link href="/mahasiswa/my-events" className="text-xs font-bold text-neutral hover:text-primary transition-colors">Lihat Semua</Link>
             </div>
             
             <div className="space-y-4">
               {recentRegistrations.length > 0 ? (
                 recentRegistrations.map((reg) => (
                    <Link 
                      key={reg.id}
                      href={`/mahasiswa/my-events/${reg.id}`}
                      className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 border border-gray-50 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl overflow-hidden shadow-inner">
                          <img src={reg.eventBanner || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop"} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <h4 className="font-bold text-dark text-sm group-hover:text-primary transition-colors">{reg.eventTitle}</h4>
                          <p className="text-[10px] text-neutral font-medium">{reg.eventDate}</p>
                        </div>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        reg.status === 'attended' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {reg.status === 'attended' ? 'Hadir' : 'Terdaftar'}
                      </span>
                    </Link>
                 ))
               ) : (
                 <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-gray-50/50 border border-dashed border-gray-200 rounded-3xl">
                   <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-3">
                     <Calendar className="h-6 w-6 text-neutral/30" />
                   </div>
                   <p className="text-sm font-bold text-neutral">Belum ada pendaftaran</p>
                   <p className="text-[10px] text-neutral/60 mt-1 max-w-[200px]">Acara yang kamu ikuti akan muncul di sini.</p>
                   <Link href="/events" className="mt-4 text-xs font-bold text-primary hover:underline">Cari Acara</Link>
                 </div>
               )}
             </div>
          </div>


        </div>
      </div>
    </div>
  );
}

