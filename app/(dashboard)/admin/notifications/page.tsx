"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, orderBy } from "firebase/firestore";
import { Bell, Check, Trash2, Calendar, FileText, CheckCircle2, XCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminNotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Admin receives notifications with targetRole == "admin"
    const q = query(
      collection(db, "notifications"),
      where("targetRole", "==", "admin")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
      
      setNotifications(notifData);
      setIsLoading(false);
    }, (error) => {
      console.error("Fetch Notifications Error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), {
        status: "read"
      });
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifs = notifications.filter(n => n.status === "unread");
      const promises = unreadNotifs.map(n => updateDoc(doc(db, "notifications", n.id), { status: "read" }));
      await Promise.all(promises);
      toast.success("Semua notifikasi ditandai sudah dibaca");
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, "notifications", id));
      toast.success("Notifikasi dihapus");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Gagal menghapus notifikasi");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "NEW_EVENT_PROPOSAL":
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "EVENT_UPDATED":
        return <Calendar className="h-5 w-5 text-amber-500" />;
      default:
        return <Bell className="h-5 w-5 text-neutral" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="h-12 w-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-neutral text-sm font-bold uppercase tracking-widest">Memuat Notifikasi...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-black text-dark tracking-tight">Notifikasi</h1>
          <p className="text-neutral text-sm mt-1 font-medium">Pemberitahuan sistem dan aktivitas penyelenggara.</p>
        </div>
        {notifications.some(n => n.status === "unread") && (
          <button 
            onClick={markAllAsRead}
            className="text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-full transition-colors"
          >
            Tandai semua dibaca
          </button>
        )}
      </div>

      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`bg-white rounded-2xl p-5 md:p-6 border transition-all flex gap-4 md:gap-5 group hover:shadow-md ${notif.status === "unread" ? "border-primary/20 shadow-sm" : "border-gray-100"}`}
            >
              <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${notif.status === "unread" ? "bg-blue-50" : "bg-gray-50"}`}>
                {getIcon(notif.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`text-sm md:text-base ${notif.status === "unread" ? "font-black text-dark" : "font-bold text-neutral"}`}>
                    {notif.title}
                  </h3>
                  {notif.status === "unread" && (
                    <span className="h-2.5 w-2.5 bg-primary rounded-full shrink-0 mt-1.5" />
                  )}
                </div>
                <p className={`text-sm ${notif.status === "unread" ? "text-dark/80 font-medium" : "text-neutral/70"}`}>
                  {notif.message}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-[10px] font-bold text-neutral/50 uppercase tracking-widest">
                    {notif.createdAt ? new Date(notif.createdAt.seconds * 1000).toLocaleString('id-ID') : "Baru saja"}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {notif.status === "unread" && (
                  <button 
                    onClick={() => markAsRead(notif.id)}
                    className="p-2 bg-gray-50 hover:bg-green-50 text-neutral hover:text-green-600 rounded-lg transition-colors"
                    title="Tandai sudah dibaca"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
                <button 
                  onClick={() => deleteNotification(notif.id)}
                  className="p-2 bg-gray-50 hover:bg-red-50 text-neutral hover:text-red-600 rounded-lg transition-colors"
                  title="Hapus"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-3xl p-16 border border-dashed border-gray-200 text-center flex flex-col items-center">
             <div className="h-20 w-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <Bell className="h-8 w-8 text-neutral/30" />
             </div>
             <h3 className="text-xl font-black text-dark mb-2">Belum ada notifikasi</h3>
             <p className="text-neutral text-sm">Semua pemberitahuan akan muncul di sini.</p>
          </div>
        )}
      </div>
    </div>
  );
}
