"use client";

import { useEffect, useState } from "react";
import { Star, MessageSquare, Calendar, ChevronLeft, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/components/providers/AuthProvider";
import toast from "react-hot-toast";

export default function RatingsPage() {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    fetchRatings();
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      <div>
        <h1 className="text-3xl font-extrabold text-dark tracking-tight">Ulasan & Rating</h1>
        <p className="text-neutral text-sm mt-1">Riwayat ulasan yang telah Anda berikan untuk acara.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="bg-white rounded-3xl p-12 border border-dashed border-gray-200 text-center flex flex-col items-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
            <p className="text-sm font-bold text-neutral">Memuat ulasan...</p>
          </div>
        ) : ratings.length > 0 ? (
          ratings.map((item) => (
            <ReviewCard key={item.id} item={item} onUpdate={fetchRatings} />
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

function ReviewCard({ item, onUpdate }: { item: any, onUpdate: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState(item.rating);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(item.comment);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !comment.trim()) {
      toast.error("Harap isi rating dan ulasan!");
      return;
    }
    setIsSubmitting(true);
    try {
      const reviewRef = doc(db, "reviews", item.id);
      await updateDoc(reviewRef, {
        rating,
        comment,
        editCount: (item.editCount || 0) + 1,
        updatedAt: serverTimestamp()
      });
      toast.success("Ulasan berhasil diperbarui!");
      setIsEditing(false);
      onUpdate();
    } catch (error: any) {
      console.error("Update review error:", error);
      toast.error(error.message || "Gagal memperbarui ulasan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const editCount = item.editCount || 0;
  const canEdit = editCount < 2;

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col h-full hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1">
          <h3 className="font-bold text-dark text-sm leading-snug line-clamp-2 mb-1">{item.eventTitle}</h3>
          <Link 
            href={`/events/${item.eventId}`}
            className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 w-fit"
          >
            Lihat Halaman Acara <ArrowRight className="h-3 w-3" />
          </Link>
          <div className="flex items-center gap-1.5 text-[10px] text-neutral mt-2">
            <Calendar className="h-3 w-3" />
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : "-"}
          </div>
        </div>
        {!isEditing && (
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span className="text-xs font-bold text-amber-700">{item.rating}</span>
            </div>
            {canEdit && (
               <button 
                 onClick={() => {
                   setRating(item.rating);
                   setComment(item.comment);
                   setIsEditing(true);
                 }}
                 className="text-[10px] font-bold text-neutral hover:text-amber-700 underline underline-offset-2"
               >
                 Edit (Sisa {2 - editCount}x)
               </button>
            )}
          </div>
        )}
      </div>

      {!isEditing ? (
        <div className="bg-gray-50 rounded-xl p-3 flex gap-3 mt-auto h-full items-start">
          <MessageSquare className="h-4 w-4 text-neutral/40 shrink-0 mt-0.5" />
          <p className="text-xs text-neutral italic leading-relaxed">&quot;{item.comment}&quot;</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3 mt-2 border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">Mode Edit</span>
            <button type="button" onClick={() => setIsEditing(false)} className="text-[10px] font-bold text-neutral hover:text-dark">Batal</button>
          </div>
          
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
                     className={`h-4 w-4 transition-colors ${
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
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={300}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 focus:bg-white transition-all font-medium placeholder-neutral/40"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-white font-bold py-2 rounded-lg hover:bg-primary-900 shadow shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 text-xs flex items-center justify-center gap-2"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </form>
      )}
    </div>
  );
}
