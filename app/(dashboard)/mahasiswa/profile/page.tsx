"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { 
  User, 
  Mail, 
  CreditCard, 
  GraduationCap, 
  Calendar, 
  Star,
  Save,
  X,
  Edit2,
  MapPin,
  Bell,
  CheckCircle2,
  MessageSquare,
  Clock
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc } from "firebase/firestore";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [recentRegistrations, setRecentRegistrations] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalReviews: 0
  });

  const [editData, setEditData] = useState({
    displayName: user?.displayName || "",
    nim: "",
    prodi: "",
  });

  // Ambil data profil dari Firestore
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setEditData({
          displayName: data.displayName || user.displayName || "",
          nim: data.nim || "",
          prodi: data.prodi || "",
        });
      } else {
        setEditData({
          displayName: user.displayName || "",
          nim: "",
          prodi: "",
        });
      }
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "registrations"),
      where("userId", "==", user.uid)
    );

    const unsubscribeRegs = onSnapshot(q, (snapshot) => {
      const regs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => {
          const dateA = a.registeredAt?.seconds || 0;
          const dateB = b.registeredAt?.seconds || 0;
          return dateB - dateA;
        });

      setRecentRegistrations(regs.slice(0, 4));

      setStats({
        totalEvents: regs.length,
        totalReviews: 0 // Ideally this should be fetched, but keeping original logic
      });
      setIsLoading(false);
    }, (error) => {
      console.error("Profile Error:", error);
      setIsLoading(false);
    });

    const qNotif1 = query(collection(db, "notifications"), where("userId", "==", user.uid));
    const qNotif2 = query(collection(db, "notifications"), where("targetRole", "==", "mahasiswa"));

    let notifs1: any[] = [];
    let notifs2: any[] = [];

    const updateNotifs = () => {
      const merged = [...notifs1, ...notifs2];
      const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
      unique.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setNotifications(unique.slice(0, 5));
    };

    const unsubNotif1 = onSnapshot(qNotif1, (snap) => {
      notifs1 = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      updateNotifs();
    });

    const unsubNotif2 = onSnapshot(qNotif2, (snap) => {
      notifs2 = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      updateNotifs();
    });

    return () => {
      unsubscribeRegs();
      unsubNotif1();
      unsubNotif2();
    };
  }, [user]);

  if (!user) return null;

  const handleSave = async () => {
    if (!user) return;
    try {
      const ref = doc(db, "users", user.uid);
      await updateDoc(ref, {
        displayName: editData.displayName,
        nim: editData.nim,
        prodi: editData.prodi,
      });
      toast.success("Profil berhasil diperbarui!");
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan profil. Coba lagi.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6 px-4 md:px-0">
      
      {/* Top Row: Profile Card & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card (Left, span 2) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 relative">
          {isEditing && (
            <div className="absolute top-5 right-5 flex gap-2 z-10">
              <button 
                onClick={() => setIsEditing(false)}
                className="text-[11px] font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1.5"
              >
                <X className="h-3 w-3" /> Batal
              </button>
              <button 
                onClick={handleSave}
                className="text-[11px] font-bold text-white bg-blue-600 px-4 py-1.5 rounded-md hover:bg-blue-700 shadow-sm transition-all flex items-center gap-1.5"
              >
                <Save className="h-3 w-3" /> Simpan
              </button>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative shrink-0">
              <div className="h-24 w-24 md:h-28 md:w-28 rounded-full overflow-hidden border-4 border-white shadow-sm bg-gray-100">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ""} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-3xl font-bold text-gray-400 bg-gray-50">
                    {user.displayName?.charAt(0) || "U"}
                  </div>
                )}
              </div>
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="absolute bottom-0 right-0 h-8 w-8 bg-[#0b4d75] rounded-full flex items-center justify-center text-white shadow-md border-2 border-white hover:bg-[#083a59] transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            
            <div className="flex-1 text-center sm:text-left mt-2 sm:mt-4">
              {isEditing ? (
                <input 
                  type="text"
                  value={editData.displayName} 
                  onChange={(e) => setEditData({...editData, displayName: e.target.value})}
                  className="text-xl md:text-2xl font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-full max-w-sm focus:outline-none focus:ring-1 focus:ring-blue-500" 
                />
              ) : (
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                  {user.displayName}
                </h1>
              )}
              
              <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-600 mt-1.5">
                <GraduationCap className="h-4 w-4 shrink-0" />
                {isEditing ? (
                     <select 
                    value={editData.prodi}
                    onChange={(e) => setEditData({...editData, prodi: e.target.value})}
                    className="bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                   >
                     <option value="">-- Pilih Program Studi --</option>
                     <optgroup label="Fakultas Falsafah & Peradaban">
                       <option>S1 Ilmu Hubungan Internasional</option>
                       <option>S1 Ilmu Komunikasi</option>
                       <option>S1 Psikologi</option>
                       <option>S1 Falsafah dan Agama (Islam Madani)</option>
                     </optgroup>
                     <optgroup label="Fakultas Ekonomi & Bisnis">
                       <option>S1 Manajemen dan Bisnis</option>
                     </optgroup>
                     <optgroup label="Fakultas Ilmu Rekayasa">
                       <option>S1 Teknik Informatika</option>
                       <option>S1 Desain Komunikasi Visual (DKV)</option>
                       <option>S1 Desain Produk</option>
                     </optgroup>
                     <optgroup label="Program Pascasarjana (S2)">
                       <option>Magister Manajemen (MM)</option>
                       <option>Magister Ilmu Komunikasi (MIKOM)</option>
                       <option>Magister Hubungan Internasional (MHI)</option>
                     </optgroup>
                   </select>
                ) : (
                   <span className="text-sm font-medium">{editData.prodi || <span className="text-gray-400 italic">Belum diatur</span>}</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            <div className="bg-[#f8fafc] rounded-xl p-4 border border-gray-100 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="h-3.5 w-3.5 text-[#0b4d75]" />
                <span className="text-xs font-semibold text-gray-500">Student ID (NIM)</span>
              </div>
              {isEditing ? (
                <input 
                  type="text"
                  value={editData.nim} 
                  onChange={(e) => setEditData({...editData, nim: e.target.value})}
                  className="font-semibold text-gray-900 bg-white border border-gray-200 rounded-md px-2 py-1 w-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" 
                />
              ) : (
                <div className="font-semibold text-gray-900 text-sm md:text-base">{editData.nim || "-"}</div>
              )}
            </div>
            <div className="bg-[#f8fafc] rounded-xl p-4 border border-gray-100 flex flex-col justify-center">
               <div className="flex items-center gap-2 mb-1">
                <Mail className="h-3.5 w-3.5 text-[#0b4d75]" />
                <span className="text-xs font-semibold text-gray-500">University Email</span>
              </div>
              <div className="font-semibold text-gray-900 text-sm md:text-base truncate">{user.email}</div>
            </div>
          </div>
        </div>
        
        {/* Stats Cards (Right, span 1) */}
        <div className="lg:col-span-1 flex flex-col gap-6 justify-between">
            {/* Events Attended */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-5 h-full">
              <div className="h-12 w-12 rounded-full flex items-center justify-center bg-[#e0ecf8] shrink-0">
                <Star className="h-6 w-6 text-[#548fb2]" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 leading-none">{stats.totalEvents}</div>
                <div className="text-[11px] font-semibold text-gray-600 mt-1.5 uppercase tracking-wider">Events Attended</div>
              </div>
            </div>

            {/* Organizations Joined / Ulasan */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-5 h-full">
              <div className="h-12 w-12 rounded-full flex items-center justify-center bg-[#dff0ea] shrink-0">
                <User className="h-6 w-6 text-[#3d987d]" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 leading-none">{stats.totalReviews}</div>
                <div className="text-[11px] font-semibold text-gray-600 mt-1.5 uppercase tracking-wider">Ulasan Diberikan</div>
              </div>
            </div>
        </div>
      </div>

      {/* Bottom Row: My Events & Nav Menu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* My Events (Left, span 2) */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-lg font-bold text-[#0b4d75] flex items-center gap-2">
               My Events
            </h2>
            <Link href="/mahasiswa/my-events" className="text-[13px] font-bold text-[#0b4d75] hover:text-blue-800 transition-colors">
              View All
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {recentRegistrations.length > 0 ? (
              recentRegistrations.map(reg => (
                <Link key={reg.id} href={`/mahasiswa/my-events/${reg.id}`} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group flex flex-col">
                  <div className="h-32 md:h-36 bg-gray-100 relative overflow-hidden shrink-0">
                    <img src={reg.eventBanner || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070"} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/95 backdrop-blur-md text-[9px] font-bold text-[#0b4d75] uppercase tracking-wider rounded-md shadow-sm">
                      {reg.status === 'attended' ? 'Attended' : 'Registered'}
                    </div>
                  </div>
                  <div className="p-4 md:p-5 flex flex-col flex-1 bg-white">
                    <h3 className="font-bold text-gray-900 text-sm md:text-base mb-3 line-clamp-2 leading-snug group-hover:text-[#0b4d75] transition-colors">{reg.eventTitle}</h3>
                    <div className="mt-auto space-y-2">
                      <div className="flex items-center gap-2.5 text-[13px] text-gray-600 font-medium">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <span>{reg.eventDate}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[13px] text-gray-600 font-medium">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <span className="truncate">{reg.eventVenue || "Lokasi Acara"}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-2 bg-white rounded-2xl p-8 border border-dashed border-gray-200 flex flex-col items-center text-center">
                <div className="h-14 w-14 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                   <Calendar className="h-6 w-6 text-gray-300" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">Belum ada acara</h3>
                <p className="text-[13px] text-gray-500">Acara yang kamu daftarkan akan muncul di sini.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity (Right, span 1) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
            </div>
            
            <div className="space-y-0 relative">
              {notifications.length > 0 && (
                <div className="absolute top-4 bottom-4 left-[19px] w-[2px] bg-gray-100 z-0" />
              )}
              
              {notifications.length > 0 ? (
                notifications.map((notif, idx) => {
                  const date = notif.createdAt ? new Date(notif.createdAt.seconds * 1000) : new Date();
                  const diffHours = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 3600));
                  const timeAgo = diffHours > 24 ? `${Math.floor(diffHours/24)} days ago` : diffHours > 0 ? `${diffHours} hours ago` : 'Just now';
                  
                  let Icon = Bell;
                  let colorClass = "text-blue-500 bg-blue-50 border-blue-100";
                  
                  if (notif.type === 'NEW_REGISTRATION' || notif.title?.toLowerCase().includes('daftar')) {
                    Icon = CheckCircle2; colorClass = "text-emerald-500 bg-emerald-50 border-emerald-100";
                  } else if (notif.title?.toLowerCase().includes('ulasan') || notif.title?.toLowerCase().includes('komentar')) {
                    Icon = MessageSquare; colorClass = "text-sky-500 bg-sky-50 border-sky-100";
                  } else if (notif.type === 'EVENT_STARTED' || notif.title?.toLowerCase().includes('mulai')) {
                    Icon = Clock; colorClass = "text-purple-500 bg-purple-50 border-purple-100";
                  }

                  return (
                    <div key={notif.id} className="relative z-10 flex items-start gap-4 pb-6 last:pb-0">
                      <div className={`h-10 w-10 rounded-full border flex items-center justify-center shrink-0 bg-white shadow-sm ${colorClass.replace(/text-[^ ]+/, '')}`}>
                        <Icon className={`h-4 w-4 ${colorClass.split(' ')[0]}`} />
                      </div>
                      <div className="pt-1">
                        <p className="text-[13px] font-semibold text-gray-800 leading-snug">
                          {notif.message || notif.title}
                        </p>
                        <p className="text-[11px] font-medium text-gray-500 mt-1">
                          {timeAgo}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Bell className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                  <h4 className="font-bold text-gray-900 text-sm mb-1">Belum ada aktivitas</h4>
                  <p className="text-[13px] font-medium text-gray-500">Aktivitas dan notifikasi terbaru akan muncul di sini.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
