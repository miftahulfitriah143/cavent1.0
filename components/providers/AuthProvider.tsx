"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { UserRole } from "@/types";

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

    // Listener ini akan otomatis aktif setiap kali ada perubahan status login (termasuk auto-refresh token)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(timeoutId);
      
      if (firebaseUser) {
        setUser(firebaseUser);
        // Ambil role dari Firestore
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            setRole(userDocSnap.data().role as UserRole);
          } else {
            setRole("mahasiswa"); // Fallback
          }
        } catch (error) {
          console.error("Gagal mengambil role:", error);
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
      unsubscribe();
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
