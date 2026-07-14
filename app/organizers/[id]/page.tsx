"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { 
  Building2, 
  MapPin, 
  Calendar, 
  Star, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Video,
  Image as ImageIcon,
  HardDrive
} from "lucide-react";
import { PublicNavbar } from "@/components/layout/PublicNavbar";

export default function OrganizerProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const [organizer, setOrganizer] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "reviews">("upcoming");

  // State for active media in past events
  const [activeMediaPreview, setActiveMediaPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganizerData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        // 1. Fetch Organizer User Data
        const userDoc = await getDoc(doc(db, "users", id));
        if (userDoc.exists() && userDoc.data().role === "organizer") {
          setOrganizer({ id: userDoc.id, ...userDoc.data() });
        } else {
          setIsLoading(false);
          return;
        }

        // 2. Fetch all published events by this organizer
        const eventsQuery = query(
          collection(db, "events"),
          where("organizerId", "==", id),
          where("status", "==", "published")
        );
        const eventsSnap = await getDocs(eventsQuery);
        const eventsData = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setEvents(eventsData);

        // 3. Fetch reviews for these events
        const eventIds = eventsData.map(e => e.id);
        const fetchedReviews: any[] = [];
        
        // Chunk query due to 'in' limit of 10
        for (let i = 0; i < eventIds.length; i += 10) {
          const chunk = eventIds.slice(i, i + 10);
          if (chunk.length > 0) {
            const revQuery = query(
              collection(db, "reviews"),
              where("eventId", "in", chunk)
            );
            const revSnap = await getDocs(revQuery);
            revSnap.forEach(d => {
              fetchedReviews.push({ id: d.id, ...d.data() });
            });
          }
        }
        
        // Sort reviews by date descending
        fetchedReviews.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        setReviews(fetchedReviews);
      } catch (error) {
        console.error("Error fetching organizer data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizerData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-neutral text-sm font-bold tracking-widest uppercase">Memuat Profil...</p>
        </div>
      </div>
    );
  }

  if (!organizer) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <PublicNavbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Building2 className="h-20 w-20 text-gray-200 mb-6" />
          <h1 className="text-2xl font-bold text-dark mb-2">Penyelenggara Tidak Ditemukan</h1>
          <p className="text-neutral">Penyelenggara ini mungkin telah dihapus atau tidak tersedia.</p>
          <Link href="/events" className="mt-8 px-6 py-3 bg-primary text-white font-bold rounded-xl">Kembali ke Acara</Link>
        </div>
      </div>
    );
  }

  // Derived Statistics
  const totalEvents = events.length;
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  const upcomingEvents = events.filter(e => e.eventState !== "completed" && e.eventState !== "started").sort((a, b) => {
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });
  
  const pastEvents = events.filter(e => e.eventState === "completed").sort((a, b) => {
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans flex flex-col relative overflow-x-clip">
      <div className="hidden md:block">
        <PublicNavbar />
      </div>

      {/* Header Profile */}
      <section className="w-full bg-gradient-to-br from-primary-900 via-primary to-secondary pt-32 pb-16 items-center relative z-10 overflow-hidden text-white">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05]" />
        
        <div className="max-w-5xl mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="h-32 w-32 md:h-40 md:w-40 bg-white rounded-full p-2 shadow-2xl flex-shrink-0">
            {organizer.photoURL ? (
              <img src={organizer.photoURL} alt={organizer.displayName} className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="w-full h-full bg-primary/10 rounded-full flex items-center justify-center">
                <Building2 className="h-16 w-16 text-primary" />
              </div>
            )}
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-black mb-4">{organizer.displayName}</h1>
            <p className="text-white/80 font-medium max-w-2xl mb-6">
              {organizer.orgDescription || "Penyelenggara resmi di Universitas Paramadina yang aktif membuat acara berkualitas untuk mahasiswa."}
            </p>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <div className="bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20 flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                <span className="font-bold">{averageRating}</span>
                <span className="text-white/60">({reviews.length} Ulasan)</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-white" />
                <span className="font-bold">{totalEvents} Acara</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto w-full px-4 md:px-6 py-12 flex-1">
        
        {/* Tabs Switcher */}
        <div className="flex justify-center mb-12 overflow-x-auto pb-4 scrollbar-hide">
          <div className="inline-flex bg-gray-100/80 p-1.5 rounded-full border border-gray-200/50">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${
                activeTab === "upcoming" ? "bg-white text-primary shadow-sm" : "text-neutral hover:text-dark"
              }`}
            >
              Acara Mendatang ({upcomingEvents.length})
            </button>
            <button
              onClick={() => setActiveTab("past")}
              className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${
                activeTab === "past" ? "bg-white text-primary shadow-sm" : "text-neutral hover:text-dark"
              }`}
            >
              Riwayat & Dokumentasi ({pastEvents.length})
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${
                activeTab === "reviews" ? "bg-white text-primary shadow-sm" : "text-neutral hover:text-dark"
              }`}
            >
              Ulasan ({reviews.length})
            </button>
          </div>
        </div>

        {/* Tab Content: Upcoming */}
        {activeTab === "upcoming" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {upcomingEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {upcomingEvents.map(event => (
                  <Link key={event.id} href={`/events/${event.id}`} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col md:flex-row h-[160px]">
                    <div className="w-full md:w-2/5 h-full relative overflow-hidden">
                      <img src={event.bannerUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-2 left-2 bg-primary text-white text-[10px] font-black uppercase px-2 py-1 rounded-md">
                        {event.category}
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-center">
                      <h3 className="font-bold text-dark line-clamp-2 mb-2 group-hover:text-primary transition-colors">{event.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-neutral mb-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{event.startDate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="truncate">{event.venue}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-3xl p-12 border border-dashed border-gray-200 text-center">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-bold text-dark text-lg mb-2">Belum Ada Acara Mendatang</h3>
                <p className="text-neutral text-sm">Penyelenggara ini belum memiliki acara aktif untuk saat ini.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Past & Documentation */}
        {activeTab === "past" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12">
            {pastEvents.length > 0 ? (
              pastEvents.map(event => (
                <div key={event.id} className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden">
                  <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start">
                    
                    {/* Event Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold uppercase">Telah Selesai</span>
                        <span className="text-neutral text-sm font-medium">{event.startDate}</span>
                      </div>
                      <h3 className="text-2xl font-black text-dark mb-4">{event.title}</h3>
                      <p className="text-neutral text-sm leading-relaxed mb-6 line-clamp-3">{event.description}</p>
                      <Link href={`/events/${event.id}`} className="text-primary font-bold text-sm flex items-center gap-1 hover:underline">
                        Lihat Detail Acara <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>

                    {/* Documentation Assets */}
                    {(event.documentation?.photos?.length > 0 || event.documentation?.video || event.documentation?.gdriveLink) ? (
                      <div className="w-full md:w-[45%] shrink-0">
                        <h4 className="text-sm font-bold text-dark uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Dokumentasi Acara</h4>
                        
                        <div className="space-y-4">
                          {/* Photos Grid */}
                          {event.documentation.photos && event.documentation.photos.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                              {event.documentation.photos.map((photo: string, idx: number) => (
                                <div 
                                  key={idx} 
                                  onClick={() => setActiveMediaPreview(photo)}
                                  className="aspect-square rounded-xl overflow-hidden cursor-zoom-in relative group"
                                >
                                  <img src={photo} alt={`Doc ${idx}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <ImageIcon className="text-white opacity-0 group-hover:opacity-100 h-6 w-6" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Links */}
                          <div className="flex flex-col gap-2 pt-2">
                            {event.documentation.video && (
                              <a href={event.documentation.video} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-red-50 hover:bg-red-100 text-red-600 p-3 rounded-xl transition-colors font-semibold text-sm">
                                <Video className="h-5 w-5" /> Lihat Video Recap
                              </a>
                            )}
                            {event.documentation.gdriveLink && (
                              <a href={event.documentation.gdriveLink} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-blue-50 hover:bg-blue-100 text-blue-600 p-3 rounded-xl transition-colors font-semibold text-sm">
                                <HardDrive className="h-5 w-5" /> Akses Folder GDrive
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full md:w-[45%] shrink-0 bg-gray-50 rounded-2xl flex flex-col items-center justify-center p-8 text-center h-full min-h-[200px] border border-dashed border-gray-200">
                        <ImageIcon className="h-10 w-10 text-gray-300 mb-3" />
                        <p className="text-neutral text-sm font-medium">Belum ada dokumentasi diunggah untuk acara ini.</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-gray-50 rounded-3xl p-12 border border-dashed border-gray-200 text-center">
                <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-bold text-dark text-lg mb-2">Belum Ada Riwayat Acara</h3>
                <p className="text-neutral text-sm">Penyelenggara ini belum menyelesaikan satupun acara.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Reviews */}
        {activeTab === "reviews" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
            {reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map(review => {
                  const eventTitle = events.find(e => e.id === review.eventId)?.title || "Acara tidak diketahui";
                  return (
                    <div key={review.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h4 className="font-bold text-dark">{review.userName}</h4>
                            <span className="bg-primary/5 border border-primary/10 text-primary px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider max-w-[250px] truncate">
                              Acara: {eventTitle}
                            </span>
                          </div>
                          {review.createdAt && (
                            <p className="text-[10px] text-neutral uppercase tracking-wider font-semibold mt-0.5">
                              {new Date(review.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                            </p>
                          )}
                        </div>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`h-4 w-4 ${s <= review.rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
                        ))}
                      </div>
                    </div>
                    <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
                      <p className="text-neutral text-sm italic leading-relaxed">"{review.comment}"</p>
                    </div>
                  </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-3xl p-12 border border-dashed border-gray-200 text-center">
                <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-bold text-dark text-lg mb-2">Belum Ada Ulasan</h3>
                <p className="text-neutral text-sm">Penyelenggara ini belum menerima ulasan apapun dari peserta.</p>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Media Preview Modal */}
      {activeMediaPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setActiveMediaPreview(null)}>
          <button className="absolute top-6 right-6 text-white hover:text-primary transition-colors bg-white/10 p-2 rounded-full">
            <ChevronLeft className="h-6 w-6 rotate-180" />
          </button>
          <img src={activeMediaPreview} alt="Preview" className="max-w-full max-h-[90vh] object-contain rounded-lg animate-in zoom-in duration-300" />
        </div>
      )}
    </div>
  );
}
