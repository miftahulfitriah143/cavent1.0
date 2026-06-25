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
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isLoading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
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
                setRole((data.role as UserRole) || "mahasiswa");
              }
            } else {
              setRole("mahasiswa"); // Fallback
            }
          });
        } catch (error) {
          console.error("Gagal mendengarkan role:", error);
          setRole("mahasiswa"); // Fallback jika terjadi error
        }
      } else {
        setUser(null);
        setRole(null);
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
    <AuthContext.Provider value={{ user, role, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
