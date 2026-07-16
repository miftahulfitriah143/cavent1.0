"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { UserRole } from "@/types";
import toast from "react-hot-toast";

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isApproved: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isApproved: true,
  isLoading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isApproved, setIsApproved] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fallback: Jika Firebase Auth gagal merespons dalam 5 detik (bug Safari/iOS tertentu), paksa loading berhenti
    const timeoutId = setTimeout(() => {
      console.warn("Firebase Auth response timeout. Forcing isLoading to false.");
      setIsLoading(false);
    }, 5000);

    let unsubscribeDoc = () => {};

    // Listener ini akan otomatis aktif setiap kali ada perubahan status login (termasuk auto-refresh token)
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      clearTimeout(timeoutId);
      
      // Bersihkan listener sebelumnya jika ada
      unsubscribeDoc();
      
      if (firebaseUser) {
        setUser(firebaseUser);
        // Dengarkan perubahan role/status dari Firestore secara real-time
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          unsubscribeDoc = onSnapshot(userDocRef, (userDocSnap) => {
            if (userDocSnap.exists()) {
              const data = userDocSnap.data();
              
              // Jika akun dinonaktifkan
              if (data.isActive === false) {
                toast.error("Akun Anda telah dinonaktifkan oleh Admin.");
                auth.signOut(); // Ini akan memicu onAuthStateChanged dengan user=null
              } else {
                const fetchedRole = data.role as string;
                const normalizedRole = fetchedRole === "mahasiswa" ? "audiens" : fetchedRole;
                setRole((normalizedRole as UserRole) || "audiens");
                setIsApproved(data.isApproved !== false);
              }
            } else {
              setRole("audiens"); // Fallback
              setIsApproved(true);
            }
          });
        } catch (error) {
          console.error("Gagal mendengarkan role:", error);
          setRole("audiens"); // Fallback jika terjadi error
          setIsApproved(true);
        }
      } else {
        setUser(null);
        setRole(null);
        setIsApproved(true);
      }
      setIsLoading(false);
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribeAuth();
      unsubscribeDoc();
    };
  }, []);

  const logout = async () => {
    setIsLoading(true);
    await auth.signOut();
    setUser(null);
    setRole(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, role, isApproved, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
