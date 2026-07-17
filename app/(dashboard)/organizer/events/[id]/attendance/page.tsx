"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Search,
  Download,
  CheckCircle2,
  RefreshCw,
  ChevronLeft,
  Maximize,
  AlertCircle,
  X
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/components/providers/AuthProvider";
import Link from "next/link";
import QRCode from "qrcode";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

export default function AttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const { user } = useAuth();

  const [event, setEvent] = useState<any>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFullScreenQR, setIsFullScreenQR] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Fetch Event
  useEffect(() => {
    if (!user) return;
    const fetchEvent = async () => {
      try {
        const docRef = doc(db, "events", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.organizerId !== user.uid) {
            toast.error("Anda tidak memiliki akses ke halaman ini.");
            router.push("/organizer/events");
            return;
          }
          setEvent({ id: docSnap.id, ...data });
        } else {
          toast.error("Acara tidak ditemukan.");
          router.push("/organizer/events");
        }
      } catch (error) {
        console.error("Error fetching event:", error);
      }
    };
    fetchEvent();
  }, [id, user, router]);

  // Fetch Registrations Real-time
  useEffect(() => {
    if (!user || !id) return;

    const q = query(
      collection(db, "registrations"),
      where("eventId", "==", id),
      where("organizerId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const attendeeData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => {
        // Sort by check-in time (newest first) if attended, else by registration time
        const timeA = a.attendedAt?.seconds || a.registeredAt?.seconds || 0;
        const timeB = b.attendedAt?.seconds || b.registeredAt?.seconds || 0;
        return timeB - timeA;
      });

      setAttendees(attendeeData);
      setIsLoading(false);
    }, (error) => {
      console.error("Firestore Error fetching attendees:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [id, user]);


  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullScreenQR(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Scroll Lock Effect for Fullscreen
  useEffect(() => {
    if (isFullScreenQR) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isFullScreenQR]);

  // Dynamic QR Code Generator
  useEffect(() => {
    if (!event) return;

    let interval: NodeJS.Timeout;

    const generateDynamicQR = async () => {
      const timestamp = Date.now();
      const payload = `${id}_${timestamp}`;
      try {
        const url = await QRCode.toDataURL(payload, { width: 400, margin: 2, color: { dark: '#000000', light: '#FFFFFF' } });
        setQrDataUrl(url);
        setLastRefresh(timestamp);

        // Save payload to Firestore
        await updateDoc(doc(db, "events", id), {
          currentQrPayload: payload,
          qrUpdatedAt: timestamp
        });
      } catch (err) {
        console.error("Error generating dynamic QR:", err);
      } finally {
        setIsRefreshing(false);
      }
    };

    generateDynamicQR(); // Initial call
    interval = setInterval(generateDynamicQR, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [event, id, isRefreshing]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    // Setting state will trigger the useEffect to regenerate QR
  };

  const handleManualCheckIn = async (registrationId: string, userName: string) => {
    try {
      await updateDoc(doc(db, "registrations", registrationId), {
        status: "attended",
        attendedAt: serverTimestamp(),
        checkInMethod: "manual"
      });
      toast.success(`${userName} berhasil di-check-in!`);
    } catch (error) {
      console.error("Check-in Error:", error);
      toast.error("Gagal melakukan check-in manual.");
    }
  };

  const handleCancelCheckIn = async (registrationId: string, userName: string) => {
    if (!window.confirm(`Batalkan check-in untuk ${userName}?`)) return;
    try {
      await updateDoc(doc(db, "registrations", registrationId), {
        status: "registered",
        attendedAt: null,
        checkInMethod: null
      });
      toast.success(`Check-in ${userName} dibatalkan.`);
    } catch (error) {
      console.error("Cancel Check-in Error:", error);
      toast.error("Gagal membatalkan check-in.");
    }
  };

  const handleExport = () => {
    const formattedData = filteredAttendees.map((a, idx) => ({
      "No": idx + 1,
      "Nama Peserta": a.fullName || a.userName,
      "Email": a.userEmail,
      "NIM / ID": a.nim || extractNim(a.userEmail),
      "Waktu Daftar": a.registeredAt?.toDate().toLocaleString('id-ID') || "-",
      "Waktu Check-in": a.attendedAt?.toDate().toLocaleString('id-ID') || "-",
      "Status Kehadiran": a.status === "attended" ? "Hadir" : "Belum Hadir"
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    
    // Set auto-width for columns
    const wscols = [
      { wch: 5 }, // No
      { wch: 25 }, // Nama
      { wch: 30 }, // Email
      { wch: 15 }, // NIM
      { wch: 20 }, // Daftar
      { wch: 20 }, // Check-in
      { wch: 15 } // Status
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Absensi");

    const fileName = `Laporan_Absensi_${event?.title?.replace(/\s+/g, '_') || 'Acara'}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    toast.success("Laporan Excel berhasil diekspor!");
  };

  const filteredAttendees = attendees.filter(a => {
    const nameMatch = (a.fullName || a.userName)?.toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = a.userEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    const nimMatch = (a.nim || "").toLowerCase().includes(searchTerm.toLowerCase());
    return nameMatch || emailMatch || nimMatch;
  });

  const attendedCount = attendees.filter(a => a.status === "attended").length;
  const totalCount = event?.maxCapacity || attendees.length; // Use max capacity if available
  const pendingCount = attendees.length - attendedCount;

  // Extract NIM from email if possible (e.g. 122103034@mhs.kampus.ac.id)
  const extractNim = (email: string) => {
    const parts = email?.split('@') || [];
    const possibleNim = parts[0];
    return /^\d+$/.test(possibleNim) ? possibleNim : (email || "-");
  };

  if (isLoading || !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="h-14 w-14 border-[5px] border-primary/10 border-t-primary rounded-full animate-spin mb-6" />
        <p className="text-neutral text-sm font-bold tracking-wide uppercase">Memuat Data Absensi...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <Link
        href="/organizer/events"
        className="inline-flex items-center gap-2 text-accent hover:text-accent-600 font-bold text-sm transition-colors mb-4"
      >
        <ChevronLeft className="h-4 w-4" /> Kembali ke Daftar Acara
      </Link>


      {isFullScreenQR && (
        <div className="fixed inset-0 z-[100] bg-white overflow-hidden h-screen w-screen">
          <div className="h-full w-full flex flex-col items-center justify-center relative animate-in fade-in zoom-in-95 duration-500">
            {/* Decorative ambient background elements */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[150px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

            <button
              onClick={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen();
                }
                setIsFullScreenQR(false);
              }}
              className="fixed top-6 right-6 p-3 lg:p-4 bg-gray-50 hover:bg-gray-100 text-neutral hover:text-dark rounded-full backdrop-blur-md transition-all z-50 border border-gray-200 shadow-md"
              title="Keluar dari mode layar penuh"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="z-10 flex flex-col items-center w-full max-w-4xl mx-auto my-auto">
              {/* Live Indicator */}
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-emerald-50 border border-emerald-100 mb-6 shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-700 font-bold tracking-widest text-[10px] md:text-xs uppercase">Live Attendance</span>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-dark text-center mb-3 tracking-tight leading-tight px-4">{event?.title}</h1>
              <p className="text-base md:text-lg lg:text-xl text-neutral font-medium mb-10 text-center px-4">Scan QR Code di bawah untuk absensi otomatis</p>

              <div className="relative group mx-auto">
                {/* Outer glow for QR */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-[2.5rem] md:rounded-[3rem] blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200 pointer-events-none"></div>

                <div className="relative bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-gray-100 w-full max-w-[280px] md:max-w-[360px] aspect-square flex items-center justify-center transform transition-transform duration-500 group-hover:scale-[1.02]">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain mix-blend-multiply" />
                  ) : (
                    <div className="animate-pulse bg-gray-100 w-full h-full rounded-2xl border-2 border-dashed border-gray-200"></div>
                  )}
                </div>
              </div>

              {/* Refresh Indicator */}
              <div className="mt-12 flex items-center gap-3 text-neutral bg-gray-50 px-6 py-3 rounded-2xl border border-gray-200 shadow-sm">
                <RefreshCw className="h-4 w-4 md:h-5 md:w-5 animate-spin text-neutral" />
                <span className="text-xs md:text-sm font-medium tracking-wide">Kode QR diperbarui setiap 30 detik</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">


        {/* LEFT PANEL - QR Code */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col items-center relative">
            <button
              className="absolute top-6 right-6 p-2 text-neutral hover:text-dark transition-colors"
              onClick={() => {
                const elem = document.documentElement;
                if (elem.requestFullscreen) {
                  elem.requestFullscreen();
                }
                setIsFullScreenQR(true);
              }}
              title="Fullscreen"
            >
              <Maximize className="h-5 w-5" />
            </button>

            <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-xl text-sm font-black text-center mb-8 max-w-full truncate">
              {event.title}
            </div>

            <div className="bg-gray-50 p-4 rounded-3xl shadow-inner border border-gray-200 mb-6 w-full max-w-[280px] aspect-square flex items-center justify-center">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain mix-blend-multiply" />
              ) : (
                <div className="animate-pulse bg-gray-200 w-full h-full rounded-2xl"></div>
              )}
            </div>

            <h3 className="text-xl font-black text-dark mb-2">QR Code Check-in</h3>
            <p className="text-neutral text-xs text-center mb-8">Minta peserta scan QR ini untuk absensi otomatis</p>

            <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 w-full mb-8">
              <CheckCircle2 className="h-5 w-5" />
              {attendedCount} peserta hadir
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary-900 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={handleExport}
                className="flex items-center justify-center gap-2 bg-white text-orange-500 border border-orange-200 py-3 rounded-xl font-bold text-sm hover:bg-orange-50 transition-all"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Attendees List */}
        <div className="lg:col-span-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <h2 className="text-xl font-black text-dark">Daftar Peserta</h2>
            <div className="flex items-center gap-3">
              <span className="bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-xs font-bold border border-green-100">
                {attendedCount} Hadir
              </span>
              <span className="bg-gray-100 text-neutral px-4 py-1.5 rounded-full text-xs font-bold border border-gray-200">
                {pendingCount} Belum
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral/40" />
                <input
                  type="text"
                  placeholder="Cari Nama/NIM Peserta.."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-orange-500/20">
                Cari
              </button>
            </div>

            {filteredAttendees.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] font-black text-neutral uppercase tracking-widest">
                      <th className="py-4 px-4 w-12 text-center">#</th>
                      <th className="py-4 px-4">NAMA</th>
                      <th className="py-4 px-4">NIM/ID</th>
                      <th className="py-4 px-4">WAKTU CHECK-IN</th>
                      <th className="py-4 px-4">STATUS</th>
                      <th className="py-4 px-4 text-right">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredAttendees.map((a, idx) => (
                      <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-4 text-sm text-neutral text-center font-medium">{idx + 1}</td>
                        <td className="py-4 px-4 text-sm font-bold text-dark">{a.fullName || a.userName}</td>
                        <td className="py-4 px-4 text-sm text-neutral">{a.nim || extractNim(a.userEmail)}</td>
                        <td className="py-4 px-4 text-sm text-dark font-medium">
                          {a.attendedAt
                            ? a.attendedAt.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
                            : '-'}
                        </td>
                        <td className="py-4 px-4 text-sm text-dark font-medium">
                          {a.status === "attended" ? "Hadir" : "Belum"}
                        </td>
                        <td className="py-4 px-4 text-right">
                          {a.status !== "attended" ? (
                            <button 
                              onClick={() => handleManualCheckIn(a.id, a.userName)}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
                            >
                              Check-in
                            </button>
                          ) : a.checkInMethod === "manual" ? (
                            <button 
                              onClick={() => handleCancelCheckIn(a.id, a.userName)}
                              className="bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border border-red-100 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                            >
                              Batal
                            </button>
                          ) : (
                            <span className="text-neutral font-bold text-xs px-4" title="Check-in via QR">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-neutral/30" />
                </div>
                <h3 className="text-lg font-bold text-dark mb-1">Peserta Tidak Ditemukan</h3>
                <p className="text-neutral text-sm">Coba sesuaikan kata kunci pencarian Anda.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
