"use client";

import { useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/components/providers/AuthProvider";
import toast from "react-hot-toast";

export function NotificationListener() {
  const { user, role } = useAuth();
  const hasMountedUser = useRef(false);
  const hasMountedRole = useRef(false);

  // Request native notification permission properly with user gesture
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      // Chrome/Edge requires a user interaction to prompt for notifications.
      // We show a toast with a button so the user can click it.
      toast(
        (t) => (
          <div className="flex flex-col gap-2">
            <span className="font-bold text-sm">Aktifkan Notifikasi Desktop?</span>
            <span className="text-xs text-neutral-600">Agar notifikasi tetap masuk meskipun Anda sedang membuka tab/aplikasi lain.</span>
            <button
              onClick={() => {
                Notification.requestPermission().then((perm) => {
                  if (perm === "granted") {
                    toast.success("Notifikasi desktop diaktifkan!");
                  }
                });
                toast.dismiss(t.id);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg w-fit mt-1 transition-all active:scale-95"
            >
              Aktifkan Sekarang
            </button>
          </div>
        ),
        { duration: 15000, position: "bottom-right" }
      );
    }
  }, []);

  const triggerNotification = (title: string, message: string) => {
    // In-App Toast (Tampil di dalam aplikasi selalu, atau bisa difilter)
    // Tampilkan toast jika tab sedang aktif
    if (document.visibilityState === "visible") {
      toast(message, {
        icon: "🔔",
        duration: 5000,
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
          fontSize: "14px",
        },
      });
    }

    // Native Desktop Push Notification (Tampil di sistem operasi/desktop)
    // Hanya tampilkan jika window sedang tidak fokus / tab disembunyikan
    if ("Notification" in window && Notification.permission === "granted" && document.visibilityState !== "visible") {
      const notification = new Notification(title, {
        body: message,
        icon: "/favicon.ico", // Ensure you have a favicon
        requireInteraction: true, // Membuat notifikasi tidak hilang sendiri sampai di-klik atau di-close
        silent: false, // Memutar suara notifikasi default dari OS
      });

      // Jika notifikasi di-klik, fokuskan kembali tab browser
      notification.onclick = (e) => {
        e.preventDefault();
        window.focus();
        notification.close();
      };
    }
  };

  useEffect(() => {
    if (!user) return;

    hasMountedUser.current = false;
    hasMountedRole.current = false;

    // 1. Listen for notifications directed at the specific user
    const qUser = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid)
    );

    const unsubUser = onSnapshot(qUser, (snapshot) => {
      if (!hasMountedUser.current) {
        hasMountedUser.current = true;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          if (data.status === "unread") {
            triggerNotification(data.title || "Notifikasi Baru", data.message || "Anda mendapat notifikasi baru!");
          }
        }
      });
    });

    let unsubRole: (() => void) | undefined;

    // 2. Listen for notifications directed at the user's role (e.g. "admin")
    if (role === "admin") {
      const qRole = query(
        collection(db, "notifications"),
        where("targetRole", "==", "admin")
      );

      unsubRole = onSnapshot(qRole, (snapshot) => {
        if (!hasMountedRole.current) {
          hasMountedRole.current = true;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            if (data.status === "unread") {
              triggerNotification(data.title || "Notifikasi Baru", data.message || "Anda mendapat notifikasi baru!");
            }
          }
        });
      });
    }

    return () => {
      unsubUser();
      if (unsubRole) unsubRole();
    };
  }, [user, role]);

  return null;
}
