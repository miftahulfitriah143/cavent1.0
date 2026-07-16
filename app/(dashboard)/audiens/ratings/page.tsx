"use client";

import { useEffect, useState } from "react";
import { Star, MessageSquare, Calendar, ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "@/components/providers/AuthProvider";

export default function RatingsPage() {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRatings = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      try {
        const q = query(
          collection(db, "reviews"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const fetchedRatings = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as any[];
        
        // Sort by createdAt descending
        fetchedRatings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setRatings(fetchedRatings);
      } catch (error) {
        console.error("Error fetching ratings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRatings();
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Link 
        href="/audiens/profile" 
        className="inline-flex items-center gap-2 text-accent hover:text-accent-600 font-bold text-sm transition-colors"
      >
        <ChevronLeft className="h-4 w-4" /> Kembali ke Profil
      </Link>

      <div>
        <h1 className="text-3xl font-extrabold text-dark tracking-tight">Ulasan & Rating</h1>
        <p className="text-neutral text-sm mt-1">Riwayat ulasan yang telah Anda berikan untuk acara.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <div className="bg-white rounded-3xl p-12 border border-dashed border-gray-200 text-center flex flex-col items-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
            <p className="text-sm font-bold text-neutral">Memuat ulasan...</p>
          </div>
        ) : ratings.length > 0 ? (
          ratings.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-dark">{item.eventTitle}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-neutral mt-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : "-"}
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-bold text-amber-700">{item.rating}</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 flex gap-4">
                <MessageSquare className="h-5 w-5 text-neutral shrink-0" />
                <p className="text-sm text-neutral italic">&quot;{item.comment}&quot;</p>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-3xl p-12 border border-dashed border-gray-200 text-center flex flex-col items-center">
             <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Star className="h-8 w-8 text-neutral/30" />
             </div>
             <h3 className="font-bold text-dark mb-1">Belum ada ulasan</h3>
             <p className="text-sm text-neutral">Anda belum memberikan ulasan untuk acara manapun.</p>
          </div>
        )}
      </div>
    </div>
  );
}
