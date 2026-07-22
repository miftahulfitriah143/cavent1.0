"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  Calendar, 
  MapPin, 
  Ticket, 
  CheckCircle2, 
  Camera, 
  X,
  Clock,
  Sparkles,
  Star,
  Video
} from "lucide-react";
import Link from "next/link";
import { db, auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, addDoc, increment, deleteDoc } from "firebase/firestore";
import { useAuth } from "@/components/providers/AuthProvider";
import toast from "react-hot-toast";
import { Html5QrcodeScanner } from "html5-qrcode";
import { CertificateTemplate } from "@/components/CertificateTemplate";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const GoogleCalendarIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" viewBox="0 0 512 512" className={className}>
    <path d="M387 117.5 265.7 104l-148.2 13.5L104 252.2 117.5 387l134.7 16.8L387 387l13.5-138.1z" style={{ fill: '#fff' }} transform="translate(3.75 3.75)"/>
    <path d="M176.55 330.35c-10.1-6.8-17-16.7-20.9-29.9l23.4-9.6c2.1 8.1 5.8 14.3 11.1 18.8 5.3 4.4 11.7 6.6 19.1 6.6 7.6 0 14.2-2.3 19.7-7s8.3-10.6 8.3-17.8q0-10.95-8.7-18c-5.8-4.6-13.1-7-21.8-7h-13.5v-23.1h12.1c7.5 0 13.8-2 18.9-6.1 5.1-4 7.7-9.6 7.7-16.6q0-9.45-6.9-15c-4.6-3.7-10.4-5.6-17.4-5.6-6.9 0-12.3 1.8-16.4 5.5-4 3.7-7 8.2-8.8 13.5l-23.1-9.6c3.1-8.7 8.7-16.4 16.9-23 8.3-6.6 18.8-10 31.6-10 9.5 0 18 1.8 25.5 5.5s13.5 8.8 17.8 15.2c4.3 6.5 6.4 13.8 6.4 21.9 0 8.3-2 15.2-6 21q-6 8.55-14.7 13.2v1.4c7.6 3.2 13.9 8.1 18.8 14.7s7.3 14.4 7.3 23.6-2.3 17.3-7 24.5c-4.6 7.2-11.1 12.8-19.2 16.9-8.2 4.1-17.4 6.2-27.6 6.2-11.6 0-22.5-3.4-32.6-10.2m143.4-116-25.5 18.6-12.8-19.5 46-33.2h17.7v156.7h-25.3v-122.6z" style={{ fill: '#1a73e8' }}/>
    <path d="M387 508.2 508.2 387l-60.6-27-60.6 27-27 60.6z" style={{ fill: '#ea4335' }} transform="translate(3.75 3.75)"/>
    <path d="m90.6 447.6 26.9 60.6H387V387H117.5z" style={{ fill: '#34a853' }} transform="translate(3.75 3.75)"/>
    <path d="M36.7-3.8C14.3-3.8-3.8 14.3-3.8 36.7V387l60.6 26.9 60.6-26.9V117.5H387l26.9-60.6L387-3.8z" style={{ fill: '#4285f4' }} transform="translate(3.75 3.75)"/>
    <path d="M-3.8 387v80.8c0 22.3 18.1 40.4 40.4 40.4h80.8V387z" style={{ fill: '#188038' }} transform="translate(3.75 3.75)"/>
    <path d="M387 117.5V387h121.3V117.5l-60.6-26.9z" style={{ fill: '#fbbc04' }} transform="translate(3.75 3.75)"/>
    <path d="M508.2 117.5V36.7c0-22.3-18.1-40.4-40.4-40.4H387v121.3h121.2z" style={{ fill: '#1967d2' }} transform="translate(3.75 3.75)"/>
  </svg>
);

export default function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = React.use(params);
  
  const [registration, setRegistration] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [eventState, setEventState] = useState<string>("");
  const [eventMeetingLink, setEventMeetingLink] = useState<string>("");
  const [eventCampusLocation, setEventCampusLocation] = useState<string>("");
  const [myReview, setMyReview] = useState<any>(null);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [isEditingReview, setIsEditingReview] = useState<boolean>(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState<boolean>(false);
  const [isGeneratingCert, setIsGeneratingCert] = useState<boolean>(false);
  const certRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchRegistration = async () => {
      try {
        const docRef = doc(db, "registrations", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const regData = { id: docSnap.id, ...docSnap.data() } as any;
          setRegistration(regData);

          // 1. Fetch eventData
          const eventSnap = await getDoc(doc(db, "events", regData.eventId));
          if (eventSnap.exists()) {
            const data = eventSnap.data();
            setEventState(data.eventState || "");
            setEventMeetingLink(data.meetingLink || "");
            setEventCampusLocation(data.campusLocation || "");
          }

          // 2. Fetch existing review
          if (user) {
            const reviewQuery = query(
              collection(db, "reviews"),
              where("eventId", "==", regData.eventId),
              where("userId", "==", user.uid)
            );
            const reviewSnap = await getDocs(reviewQuery);
            if (!reviewSnap.empty) {
              setMyReview({ id: reviewSnap.docs[0].id, ...reviewSnap.docs[0].data() });
            }
          }
        } else {
          toast.error("Data pendaftaran tidak ditemukan");
          router.push("/audiens/my-events");
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error("Gagal memuat tiket");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRegistration();
  }, [id, router, user]);

  // Handle QR Scan
  useEffect(() => {
    let scanner: any = null;
    if (showScanner) {
      scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      const onScanSuccess = async (decodedText: string) => {
        const scannedEventId = decodedText.split('_')[0];
        if (scannedEventId === registration.eventId) {
          scanner.clear();
          setShowScanner(false);
          handleAttendance(decodedText);
        } else {
          toast.error("QR Code tidak valid untuk acara ini");
        }
      };

      const onScanFailure = (error: any) => {
        // silent error
      };

      scanner.render(onScanSuccess, onScanFailure);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch((error: any) => console.error("Failed to clear scanner", error));
      }
    };
  }, [showScanner, registration]);

  const handleAttendance = async (scannedPayload: string) => {
    try {
      setIsScanning(true);
      
      // Validasi dynamic QR payload dari server (untuk menghindari screenshot lama)
      const eventSnap = await getDoc(doc(db, "events", registration.eventId));
      if (eventSnap.exists()) {
        const currentQr = eventSnap.data().currentQrPayload;
        if (currentQr && currentQr !== scannedPayload) {
          toast.error("QR Code sudah kedaluwarsa. Silakan scan ulang QR terbaru di layar penyelenggara.");
          setIsScanning(false);
          // Show scanner again so they can retry
          setShowScanner(true);
          return;
        }
      }

      const regRef = doc(db, "registrations", id);
      await updateDoc(regRef, {
        status: "attended",
        attendedAt: serverTimestamp()
      });
      
      setRegistration((prev: any) => ({ ...prev, status: "attended" }));
      toast.success("Absensi Berhasil! Selamat mengikuti acara.");
    } catch (error) {
      console.error("Attendance Error:", error);
      toast.error("Gagal mencatat absensi");
    } finally {
      setIsScanning(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!window.confirm("Apakah Anda yakin ingin membatalkan pendaftaran acara ini? Tiket Anda akan hangus.")) return;
    try {
      setIsLoading(true);
      
      // Ubah status pendaftaran menjadi dibatalkan
      await updateDoc(doc(db, "registrations", id), {
        status: "cancelled",
        cancelCount: increment(1)
      });
      
      // Kurangi registeredCount di dokumen event
      await updateDoc(doc(db, "events", registration.eventId), {
        registeredCount: increment(-1)
      });
      
      toast.success("Pendaftaran berhasil dibatalkan.");
      router.push("/audiens/my-events");
    } catch (error) {
      console.error("Cancel Registration Error:", error);
      toast.error("Gagal membatalkan pendaftaran.");
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error("Mohon berikan komentar ulasan Anda!");
      return;
    }
    if (!user) return;

    try {
      setIsSubmittingReview(true);
      
      if (isEditingReview && myReview?.id) {
        // Mode Edit
        const reviewRef = doc(db, "reviews", myReview.id);
        await updateDoc(reviewRef, {
          rating: rating,
          comment: comment.trim(),
          editCount: increment(1),
          updatedAt: new Date().toISOString()
        });
        setMyReview((prev: any) => ({
          ...prev,
          rating: rating,
          comment: comment.trim(),
          editCount: (prev.editCount || 0) + 1
        }));
        toast.success("Ulasan berhasil diperbarui!");
        setIsEditingReview(false);
      } else {
        // Mode Baru
        const reviewData = {
          eventId: registration.eventId,
          eventTitle: registration.eventTitle,
          userId: user.uid,
          userName: user.displayName || "Audiens Cavent",
          rating: rating,
          comment: comment.trim(),
          editCount: 0,
          createdAt: new Date().toISOString()
        };

        const newDoc = await addDoc(collection(db, "reviews"), reviewData);
        setMyReview({ id: newDoc.id, ...reviewData });
        toast.success("Terima kasih! Ulasan Anda berhasil dikirim.");
      }
    } catch (err) {
      console.error("Submit Review Error:", err);
      toast.error("Gagal mengirim ulasan.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSyncCalendar = async () => {
    try {
      setIsSyncingCalendar(true);
      const provider = new GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/calendar.events");
      
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      if (!token) {
        toast.error("Gagal mendapatkan token akses kalender.");
        return;
      }

      // Convert format date "15 Juni 2024" to ISO format if possible, or fallback to simple ISO
      // Here we assume eventDate is mapped properly, but we'll try to extract date.
      // Assuming event.startDate is available in the event doc, we should fetch it.
      const eventSnap = await getDoc(doc(db, "events", registration.eventId));
      if (!eventSnap.exists()) {
        toast.error("Data acara tidak ditemukan.");
        return;
      }
      
      const eventData = eventSnap.data();
      const startDateStr = eventData.startDate || new Date().toISOString().split('T')[0];
      const startTimeStr = eventData.startTime || "08:00";
      const endTimeStr = eventData.endTime || "17:00";
      
      const startDateTime = `${startDateStr}T${startTimeStr}:00+07:00`;
      const endDateTime = `${startDateStr}T${endTimeStr}:00+07:00`;

      const isOnline = eventData.campusLocation === 'Online';
      const meetLink = eventData.meetingLink || '';
      const baseDescription = eventData.description || "Acara Cavent University System";

      const calendarPayload = {
        summary: eventData.title || registration.eventTitle,
        location: isOnline && meetLink ? meetLink : (eventData.venue || registration.eventVenue),
        description: baseDescription,
        start: {
          dateTime: startDateTime,
          timeZone: "Asia/Jakarta"
        },
        end: {
          dateTime: endDateTime,
          timeZone: "Asia/Jakarta"
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "popup", minutes: 24 * 60 },
            { method: "popup", minutes: 10 }
          ]
        }
      };

      const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(calendarPayload)
      });

      if (res.ok) {
        toast.success("Berhasil disinkronisasi ke Google Calendar!");
      } else {
        const errorData = await res.json();
        console.error("Google Calendar API Error:", errorData);
        toast.error(`Gagal API: ${errorData.error?.message || "Kesalahan API Kalender"}`);
      }

    } catch (error: any) {
      console.error("Sync Calendar Error:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error("Otorisasi dibatalkan pengguna.");
      } else {
        toast.error(`Gagal sinkronisasi: ${error?.message || "Kesalahan tak dikenal"}`);
      }
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  const handleDownloadCertificate = async () => {
    if (!certRef.current) return;
    try {
      setIsGeneratingCert(true);
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1122, 793]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, 1122, 793);
      pdf.save(`Sertifikat_${registration.eventTitle.replace(/\s+/g, '_')}.pdf`);
      toast.success("Sertifikat berhasil diunduh!");
    } catch (error) {
      console.error("Error generating certificate:", error);
      toast.error("Gagal mengunduh sertifikat.");
    } finally {
      setIsGeneratingCert(false);
    }
  };


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="h-12 w-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-neutral text-sm font-bold uppercase tracking-widest">Memuat Tiket...</p>
      </div>
    );
  }

  if (!registration) return null;

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4">
      {/* Back Button */}
      <Link 
        href="/audiens/my-events" 
        className="inline-flex items-center gap-2 text-accent hover:text-amber-600 mb-6 font-bold text-sm transition-colors"
      >
        <ChevronLeft className="h-4 w-4" /> Kembali ke Daftar
      </Link>

      {/* TICKET CARD - BOARDING PASS STYLE */}
      <div className="bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-gray-100 flex flex-col md:flex-row relative overflow-hidden mb-8">
        {/* Left Side (Header) */}
        <div className="md:w-2/5 bg-gradient-to-br from-primary to-blue-700 p-8 md:p-10 text-white flex flex-col justify-between relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Ticket className="h-5 w-5" />
              </div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-white/80">Cavent E-Ticket</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black leading-tight mb-2 line-clamp-3">
              {registration.eventTitle}
            </h1>
          </div>
          
          <div className="relative z-10 mt-8">
            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">ID Pendaftaran</p>
            <p className="text-lg font-mono font-bold tracking-widest bg-white/10 inline-block px-3 py-1 rounded-lg">
              {registration.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Divider cut-outs */}
        <div className="hidden md:flex flex-col justify-between items-center relative z-20 -mx-3 py-4 bg-white">
           <div className="w-6 h-6 bg-[#f4f6fa] rounded-full shadow-inner absolute -top-3" />
           <div className="h-full w-0 border-l-2 border-dashed border-gray-200 my-4" />
           <div className="w-6 h-6 bg-[#f4f6fa] rounded-full shadow-inner absolute -bottom-3" />
        </div>
        
        {/* Mobile divider */}
        <div className="md:hidden relative h-6 bg-white flex items-center justify-center -mt-3 z-20">
          <div className="absolute -left-3 w-6 h-6 bg-[#f4f6fa] rounded-full shadow-inner" />
          <div className="w-full border-t-2 border-dashed border-gray-200 mx-6" />
          <div className="absolute -right-3 w-6 h-6 bg-[#f4f6fa] rounded-full shadow-inner" />
        </div>

        {/* Right Side (Details & Actions) */}
        <div className="md:w-3/5 p-8 md:p-10 flex flex-col justify-between bg-white relative z-10">
          {/* Details */}
          <div className="grid grid-cols-2 gap-y-8 gap-x-6 mb-10">
            <div>
              <p className="text-[10px] font-black text-neutral uppercase tracking-widest mb-1.5">Tanggal</p>
              <div className="flex items-center gap-2 text-dark font-bold text-sm">
                <Calendar className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate">{registration.eventDate}</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-neutral uppercase tracking-widest mb-1.5">Lokasi</p>
              <div className="flex items-center gap-2 text-dark font-bold text-sm">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate">{registration.eventVenue}</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-neutral uppercase tracking-widest mb-1.5">Nama Peserta</p>
              <p className="text-dark font-black text-sm">{registration.fullName || registration.userName}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-neutral uppercase tracking-widest mb-1.5">NIM / ID</p>
              <p className="text-dark font-black text-sm">{registration.nim || "-"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-black text-neutral uppercase tracking-widest mb-1.5">Status Kehadiran</p>
              <div>
                {registration.status === "attended" ? (
                  <span className="bg-green-50 text-green-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 border border-green-200">
                    <CheckCircle2 className="h-3 w-3" /> Hadir
                  </span>
                ) : (
                  <span className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 border border-orange-200">
                    <Clock className="h-3 w-3" /> Menunggu
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Secondary Actions (Calendar, Cancel) */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
             {eventCampusLocation === "Online" && eventMeetingLink && (
               <a 
                 href={eventMeetingLink}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="flex-1 bg-blue-50 border border-blue-100 text-blue-700 font-bold py-2.5 px-3 rounded-lg hover:bg-blue-100 transition-all text-[11px] flex items-center justify-center gap-2"
               >
                 <Video className="h-4 w-4" /> Gabung Pertemuan Online
               </a>
             )}
             <button 
               onClick={handleSyncCalendar}
               disabled={isSyncingCalendar}
               className="flex-1 bg-white border border-gray-200 text-dark font-bold py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-all text-[11px] flex items-center justify-center gap-2"
             >
               <GoogleCalendarIcon className="h-4 w-4" /> 
               {isSyncingCalendar ? "Menyimpan..." : "Simpan ke Google Calendar"}
             </button>
             
             {eventState !== "started" && eventState !== "completed" && registration.status !== "attended" && (registration.cancelCount || 0) < 2 && (
               <div className="flex-1 flex flex-col gap-1.5 justify-center">
                 <button 
                   onClick={handleCancelRegistration}
                   className="w-full bg-red-50 text-red-600 font-bold py-2.5 px-3 rounded-lg hover:bg-red-100 hover:text-red-700 transition-all text-[11px] flex items-center justify-center gap-2"
                 >
                   Batalkan Pendaftaran
                 </button>
                 <p className="text-[9px] text-center text-red-500/80 font-medium">*Maksimal batal 2 kali</p>
               </div>
             )}
          </div>

          {/* Interactive Actions within the Ticket */}
          <div className="border-t-2 border-dashed border-gray-100 pt-8 mt-auto">
            {registration.status === "attended" ? (
              <div className="space-y-6">
                 <div className="flex items-center gap-4 bg-green-50 p-4 rounded-xl border border-green-100">
                   <div className="bg-green-500 text-white p-2 rounded-lg shadow-lg shadow-green-500/30 shrink-0">
                     <CheckCircle2 className="h-5 w-5" />
                   </div>
                   <div>
                     <h3 className="font-bold text-green-900 text-sm">Kehadiran Terkonfirmasi</h3>
                     <p className="text-green-700/80 text-[10px] font-medium">Terima kasih telah hadir.</p>
                   </div>
                 </div>

                 {/* Download Certificate */}
                 {eventState === "completed" && (
                    <button
                      onClick={handleDownloadCertificate}
                      disabled={isGeneratingCert}
                      className="w-full bg-gradient-to-r from-accent to-amber-600 text-white font-bold py-3 px-4 rounded-xl hover:from-amber-500 hover:to-amber-700 shadow-lg shadow-accent/30 transition-all active:scale-[0.98] disabled:opacity-50 text-xs flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-1.5 rounded-lg">
                           <Ticket className="h-4 w-4" />
                        </div>
                        <span>Unduh E-Sertifikat Acara</span>
                      </div>
                      {isGeneratingCert ? <div className="h-3 w-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <ChevronLeft className="h-3 w-3 rotate-180 text-white/70 group-hover:text-white transition-colors" />}
                    </button>
                 )}

                 {/* Reviews */}
                 {eventState === "completed" && (
                   <div className="pt-2 border-t border-gray-50">
                     <h4 className="font-bold text-dark text-xs mb-3 flex items-center gap-2"><Star className="h-3 w-3 text-amber-400 fill-amber-400"/> Bagikan Pengalamanmu</h4>
                      
                     {myReview && !isEditingReview ? (
                       <div className="bg-amber-50/50 border border-amber-100/50 rounded-xl p-4 space-y-3">
                         <div className="flex items-center justify-between">
                           <span className="text-[9px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wider">Terkirim</span>
                           <div className="flex items-center gap-0.5">
                             {[1, 2, 3, 4, 5].map((s) => (
                               <Star key={s} className={`h-3 w-3 ${s <= myReview.rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
                             ))}
                           </div>
                         </div>
                         <p className="text-dark text-xs italic font-medium leading-relaxed">&quot;{myReview.comment}&quot;</p>
                         
                         {(myReview.editCount || 0) < 2 && (
                           <div className="pt-2 border-t border-amber-200/30 flex items-center justify-between mt-2">
                             <span className="text-[9px] font-bold text-amber-700">Sisa Edit: {2 - (myReview.editCount || 0)}x</span>
                             <button 
                               onClick={() => {
                                 setRating(myReview.rating);
                                 setComment(myReview.comment);
                                 setIsEditingReview(true);
                               }}
                               className="text-[10px] font-bold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded transition-colors"
                             >
                               Edit Ulasan
                             </button>
                           </div>
                         )}
                       </div>
                     ) : (
                       <form onSubmit={handleSubmitReview} className="space-y-3">
                         {isEditingReview && (
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">Mode Edit</span>
                              <button type="button" onClick={() => setIsEditingReview(false)} className="text-[10px] font-bold text-neutral hover:text-dark">Batal</button>
                            </div>
                         )}
                         <div className="flex flex-col items-center gap-1 bg-gray-50 p-2 rounded-xl border border-gray-100">
                           <div className="flex items-center gap-1">
                             {[1, 2, 3, 4, 5].map((s) => (
                               <button
                                 key={s}
                                 type="button"
                                 onClick={() => setRating(s)}
                                 onMouseEnter={() => setHoverRating(s)}
                                 onMouseLeave={() => setHoverRating(0)}
                                 className="p-1 focus:outline-none transition-transform hover:scale-110"
                               >
                                 <Star
                                   className={`h-5 w-5 transition-colors ${
                                     s <= (hoverRating || rating)
                                       ? "text-amber-400 fill-amber-400"
                                       : "text-gray-200"
                                   }`}
                                 />
                               </button>
                             ))}
                           </div>
                         </div>
 
                         <textarea
                           rows={2}
                           placeholder="Tulis pendapat Anda..."
                           value={comment}
                           onChange={(e) => setComment(e.target.value)}
                           maxLength={300}
                           className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 focus:bg-white transition-all font-medium placeholder-neutral/40"
                         />
 
                         <button
                           type="submit"
                           disabled={isSubmittingReview}
                           className="w-full bg-primary text-white font-bold py-2.5 rounded-lg hover:bg-primary-900 shadow shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 text-xs flex items-center justify-center gap-2"
                         >
                           {isSubmittingReview ? "Mengirim..." : "Kirim Ulasan"}
                         </button>
                       </form>
                     )}
                   </div>
                 )}
              </div>
            ) : showScanner ? (
              <div className="space-y-4">
                 <div className="flex items-center justify-between mb-2">
                   <h3 className="font-bold text-dark text-sm">Scan QR Code Absensi</h3>
                   <button onClick={() => setShowScanner(false)} className="p-1.5 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                     <X className="h-3 w-3 text-neutral" />
                   </button>
                 </div>
                 <div id="reader" className="overflow-hidden rounded-xl border-2 border-primary/20 bg-gray-50 max-h-64" />
                 <p className="text-neutral text-[10px] text-center font-medium">Arahkan kamera ke layar di meja panitia</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                 {/* Prominent Check-in Button */}
                 {eventState === "started" ? (
                    <button 
                      onClick={() => setShowScanner(true)}
                      className="w-full bg-dark text-white font-bold py-3.5 rounded-xl hover:bg-black shadow-lg shadow-black/10 transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-2"
                    >
                      <Camera className="h-4 w-4" /> Buka Kamera untuk Absen
                    </button>
                 ) : eventState !== "completed" ? (
                    <div className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 flex items-center justify-center gap-2">
                       <Clock className="h-4 w-4 text-neutral" />
                       <span className="text-xs font-bold text-neutral">Absensi belum dibuka oleh panitia</span>
                    </div>
                 ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden Certificate Template */}
      <CertificateTemplate 
        ref={certRef}
        userName={registration.userName}
        eventName={registration.eventTitle}
        eventDate={registration.eventDate}
        certificateId={registration.id.toUpperCase()}
      />
    </div>
  );
}
