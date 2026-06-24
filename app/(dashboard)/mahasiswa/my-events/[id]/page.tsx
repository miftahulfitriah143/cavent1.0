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
  Star
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { useAuth } from "@/components/providers/AuthProvider";
import toast from "react-hot-toast";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = React.use(params);
  
  const [registration, setRegistration] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [eventState, setEventState] = useState<string>("");
  const [myReview, setMyReview] = useState<any>(null);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  useEffect(() => {
    const fetchRegistration = async () => {
      try {
        const docRef = doc(db, "registrations", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const regData = { id: docSnap.id, ...docSnap.data() } as any;
          setRegistration(regData);

          // 1. Fetch eventState
          const eventSnap = await getDoc(doc(db, "events", regData.eventId));
          if (eventSnap.exists()) {
            setEventState(eventSnap.data().eventState || "");
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
              setMyReview(reviewSnap.docs[0].data());
            }
          }
        } else {
          toast.error("Data pendaftaran tidak ditemukan");
          router.push("/mahasiswa/my-events");
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

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error("Mohon berikan komentar ulasan Anda!");
      return;
    }
    if (!user) return;

    try {
      setIsSubmittingReview(true);
      const reviewData = {
        eventId: registration.eventId,
        eventTitle: registration.eventTitle,
        userId: user.uid,
        userName: user.displayName || "Mahasiswa Cavent",
        rating: rating,
        comment: comment.trim(),
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "reviews"), reviewData);
      setMyReview(reviewData);
      toast.success("Terima kasih! Ulasan Anda berhasil dikirim.");
    } catch (err) {
      console.error("Submit Review Error:", err);
      toast.error("Gagal mengirim ulasan.");
    } finally {
      setIsSubmittingReview(false);
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
    <div className="max-w-7xl mx-auto pb-20">
      {/* Back Button */}
      <Link 
        href="/mahasiswa/my-events" 
        className="inline-flex items-center gap-2 text-accent hover:text-accent-600 mb-6 font-bold text-sm transition-colors"
      >
        <ChevronLeft className="h-4 w-4" /> Kembali ke Daftar
      </Link>

      <div className="bg-white rounded-xl shadow-2xl shadow-primary/5 border border-gray-100 overflow-hidden">
        {/* Ticket Header */}
        <div className="bg-primary p-10 text-white relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                <Ticket className="h-6 w-6" />
              </div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-white/70">Tiket Elektronik</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black leading-tight mb-2">
              {registration.eventTitle}
            </h1>
            <p className="text-white/60 text-xs font-medium uppercase tracking-widest">
              ID Pendaftaran: {registration.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Ticket Body */}
        <div className="p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 pb-10 border-b border-gray-100 border-dashed">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-neutral uppercase tracking-widest">Tanggal Acara</p>
              <div className="flex items-center gap-2 text-dark font-bold">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{registration.eventDate}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-neutral uppercase tracking-widest">Lokasi</p>
              <div className="flex items-center gap-2 text-dark font-bold">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="truncate">{registration.eventVenue}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-neutral uppercase tracking-widest">Nama Peserta</p>
              <p className="text-dark font-black">{registration.userName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-neutral uppercase tracking-widest">Status</p>
              <div className="flex items-center gap-2">
                {registration.status === "attended" ? (
                  <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-green-100">
                    <CheckCircle2 className="h-3 w-3" /> Sudah Absen
                  </span>
                ) : (
                  <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-blue-100">
                    <Clock className="h-3 w-3" /> Menunggu Absensi
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Area */}
          <div className="text-center">
            {registration.status === "attended" ? (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="bg-green-50 rounded-xl p-8 border border-green-100 flex flex-col items-center max-w-xl mx-auto shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                  <div className="h-16 w-16 bg-green-600 text-white rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-green-200">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-black text-green-900 mb-1">Terima Kasih!</h3>
                  <p className="text-green-700/70 text-xs font-semibold">Anda telah berhasil melakukan absensi.</p>
                </div>

                {/* Rating & Ulasan Section (Linked to Completed EventState) */}
                {eventState === "completed" && (
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 max-w-xl mx-auto text-left shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-6">
                    <div>
                      <h3 className="text-lg font-black text-dark tracking-tight">Bagikan Pengalamanmu!</h3>
                      <p className="text-neutral text-xs font-medium mt-1">Berikan rating dan ulasan untuk membantu panitia meningkatkan kualitas acara selanjutnya.</p>
                    </div>

                    {myReview ? (
                      /* Submitted State */
                      <div className="bg-amber-50/50 border border-amber-100/50 rounded-xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-3 py-1 rounded-full uppercase tracking-wider">Ulasan Terkirim</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`h-4.5 w-4.5 ${s <= myReview.rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-dark text-sm italic font-medium leading-relaxed">&quot;{myReview.comment}&quot;</p>
                      </div>
                    ) : (
                      /* Input Form State */
                      <form onSubmit={handleSubmitReview} className="space-y-5">
                        {/* Interactive Stars Selector */}
                        <div className="flex flex-col items-center gap-2 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                          <p className="text-neutral text-[10px] font-bold uppercase tracking-wider">Pilih Rating</p>
                          <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setRating(s)}
                                onMouseEnter={() => setHoverRating(s)}
                                onMouseLeave={() => setHoverRating(0)}
                                className="p-1.5 focus:outline-none transition-transform hover:scale-125"
                              >
                                <Star
                                  className={`h-8 w-8 transition-colors ${
                                    s <= (hoverRating || rating)
                                      ? "text-amber-400 fill-amber-400"
                                      : "text-gray-200"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Comment Textarea */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-neutral uppercase tracking-widest block">Ulasan Anda</label>
                          <textarea
                            rows={3}
                            placeholder="Tulis ulasan Anda tentang acara ini..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            maxLength={300}
                            className="w-full bg-gray-50/50 border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all font-medium placeholder-neutral/40"
                          />
                          <div className="flex justify-between items-center text-[10px] text-neutral/50 font-bold uppercase">
                            <span>Maksimal 300 karakter</span>
                            <span>{comment.length}/300</span>
                          </div>
                        </div>

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={isSubmittingReview}
                          className="w-full bg-primary text-white font-black py-4 rounded-xl hover:bg-primary-900 shadow-xl shadow-primary/15 transition-all active:scale-[0.98] disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                        >
                          {isSubmittingReview ? (
                            <>
                              <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                              Mengirim...
                            </>
                          ) : (
                            "Kirim Ulasan"
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            ) : showScanner ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-dark tracking-tight">Scan QR Absensi</h3>
                  <button 
                    onClick={() => setShowScanner(false)}
                    className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
                  >
                    <X className="h-4 w-4 text-neutral" />
                  </button>
                </div>
                <div id="reader" className="overflow-hidden rounded-xl border-4 border-primary/20 shadow-xl" />
                <p className="text-neutral text-xs font-medium">Arahkan kamera ke QR Code yang disediakan panitia</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="mb-10 opacity-30">
                   <Sparkles className="h-12 w-12 text-primary" />
                </div>
                <button 
                  onClick={() => setShowScanner(true)}
                  className="w-full bg-primary text-white font-black py-5 rounded-xl flex items-center justify-center gap-3 hover:bg-primary-900 shadow-xl shadow-primary/20 transition-all active:scale-95"
                >
                  <Camera className="h-6 w-6" />
                  Scan Absensi Sekarang
                </button>
                <p className="text-neutral text-[10px] font-bold uppercase tracking-widest mt-6">
                  Silakan scan QR Code di meja panitia saat acara dimulai
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Ticket Footer (Cutline effect) */}
        <div className="relative h-8 bg-gray-50 flex items-center justify-center">
          <div className="absolute -left-4 w-8 h-8 bg-[#f4f6fa] rounded-full shadow-inner" />
          <div className="w-full border-t-4 border-dotted border-gray-200 mx-8" />
          <div className="absolute -right-4 w-8 h-8 bg-[#f4f6fa] rounded-full shadow-inner" />
        </div>
        <div className="bg-gray-50 p-6 text-center">
          <p className="text-[10px] font-black text-neutral/40 uppercase tracking-[0.3em]">CAVENT UNIVERSITY SYSTEM</p>
        </div>
      </div>
    </div>
  );
}
