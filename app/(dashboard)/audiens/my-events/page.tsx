"use client";

import { useEffect, useState } from "react";
import { Calendar, MapPin, Clock, ArrowRight, Ticket, AlertCircle, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc } from "firebase/firestore";
import { useAuth } from "@/components/providers/AuthProvider";

export default function MyEventsPage() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "registrations"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const regData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => {
        const dateA = a.registeredAt?.seconds || 0;
        const dateB = b.registeredAt?.seconds || 0;
        return dateB - dateA;
      });
      
      setRegistrations(regData);
      setIsLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-12 w-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-neutral text-sm font-bold tracking-widest uppercase">Memuat Pendaftaran...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      <div>
        <h1 className="text-4xl font-black text-dark tracking-tight">Acara Saya</h1>
        <p className="text-neutral text-sm mt-2">Kelola pendaftaran dan tiket acara kampus Anda.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">


        {registrations.length > 0 ? (
          registrations.map((reg) => (
            <RegistrationCard key={reg.id} reg={reg} user={user} />
          ))
        ) : (
          <div className="bg-white rounded-xl p-16 md:p-24 border border-dashed border-gray-200 text-center flex flex-col items-center">
             <div className="h-24 w-24 bg-gray-50 rounded-xl flex items-center justify-center mb-8 shadow-inner">
                <Calendar className="h-10 w-10 text-neutral/20" />
             </div>
             <h3 className="text-2xl font-black text-dark mb-3">Belum ada acara</h3>
             <p className="text-neutral text-sm max-w-xs mx-auto mb-10 leading-relaxed font-medium">
               Anda belum mendaftar di acara apapun. Jelajahi katalog sekarang untuk menemukan acara menarik!
             </p>
             <Link 
               href="/events"
               className="bg-dark text-white px-10 py-4 rounded-xl font-bold hover:bg-black transition-all shadow-xl shadow-black/10 active:scale-95 flex items-center gap-3"
             >
               Jelajahi Acara <ArrowRight className="h-5 w-5" />
             </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function RegistrationCard({ reg, user }: { reg: any; user: any }) {
  const [eventState, setEventState] = useState("");
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    // Real-time listener for the event document
    const eventRef = doc(db, "events", reg.eventId);
    const unsubEvent = onSnapshot(eventRef, (docSnap) => {
      if (docSnap.exists()) {
        setEventState(docSnap.data().eventState || "");
      }
    });

    // Real-time listener for the user's review of this event
    const reviewQuery = query(
      collection(db, "reviews"),
      where("eventId", "==", reg.eventId),
      where("userId", "==", user.uid)
    );
    const unsubReview = onSnapshot(reviewQuery, (snap) => {
      setHasReviewed(!snap.empty);
    });

    return () => {
      unsubEvent();
      unsubReview();
    };
  }, [reg.eventId, user.uid]);

  let badge = null;
  if (eventState === "completed") {
    if (hasReviewed) {
      badge = <span className="bg-gray-100 text-gray-500 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-gray-200">Selesai</span>;
    } else {
      badge = <span className="bg-amber-50 text-amber-600 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-200">Berikan Ulasan Anda</span>;
    }
  } else if (reg.status === "attended") {
    badge = <span className="bg-blue-50 text-blue-600 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-blue-100">Sudah Absen</span>;
  } else if (eventState === "started") {
    badge = <span className="bg-orange-50 text-orange-600 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-orange-200">Belum Absen</span>;
  } else {
    badge = <span className="bg-green-50 text-green-600 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-green-100">Terdaftar</span>;
  }

  return (
    <div className="bg-white rounded-xl p-6 md:p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1">
      <div className="flex gap-6 items-center">
        <div className="h-20 w-20 md:h-24 md:w-24 rounded-xl overflow-hidden shrink-0 border border-gray-50 shadow-inner">
          <img 
            src={reg.eventBanner || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop"} 
            alt={reg.eventTitle}
            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            {badge}
          </div>
          <h3 className="font-black text-dark text-lg md:text-xl leading-tight group-hover:text-primary transition-colors">
            {reg.eventTitle}
          </h3>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <div className="flex items-center gap-2 text-xs text-neutral font-medium">
              <Calendar className="h-3.5 w-3.5 text-primary/40" />
              <span>{reg.eventDate}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral font-medium">
              <MapPin className="h-3.5 w-3.5 text-primary/40" />
              <span className="truncate max-w-[150px]">{reg.eventVenue}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 md:pl-6 md:border-l border-gray-50">
        <Link 
          href={`/audiens/my-events/${reg.id}`}
          className="flex items-center justify-center gap-3 bg-gray-50 text-dark px-6 py-3.5 rounded-2xl text-sm font-bold hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95 group/btn"
        >
          <Ticket className="h-4 w-4" />
          <span>Lihat Tiket</span>
          <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all" />
        </Link>
      </div>
    </div>
  );
}
