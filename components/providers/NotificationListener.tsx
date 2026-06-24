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

  // Request native notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const triggerNotification = (title: string, message: string) => {
    // In-App Toast
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

    // Native Desktop Push Notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body: message,
        icon: "/favicon.ico", // Ensure you have a favicon
      });
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
